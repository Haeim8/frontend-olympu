import { NextResponse } from 'next/server';
import { transactions as dbTransactions } from '@/backend/db';
import { ethers } from 'ethers';
import config from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request, { params }) {
  const rawAddress = params?.address;

  if (!rawAddress) {
    return NextResponse.json({ error: 'Missing campaign address' }, { status: 400 });
  }

  const address = rawAddress.toLowerCase();
  console.log(`[TX API] Fetching transactions for ${address}`);

  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');
  const offsetParam = searchParams.get('offset');

  let limit = 100;
  if (limitParam) {
    const parsed = Number.parseInt(limitParam, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      limit = Math.min(parsed, 500);
    }
  }

  let offset = 0;
  if (offsetParam) {
    const parsed = Number.parseInt(offsetParam, 10);
    if (Number.isFinite(parsed) && parsed >= 0) {
      offset = parsed;
    }
  }

  try {
    // 1. Récupérer depuis Supabase
    console.log(`[TX API] Calling dbTransactions.getByCampaign(${address})`);
    let txList = await dbTransactions.getByCampaign(address, { limit, offset });
    console.log(`[TX API] Got ${txList.length} transactions from DB`);

    // 2. Fallback Blockchain DIRECT si Supabase est vide
    if (txList.length === 0) {
      console.log(`[TX API] 🔄 Fallback Blockchain pour ${address.slice(0, 10)}...`);
      try {
        const rpcUrl = config.helpers.getPrimaryRPC();
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

        const abi = [
          "event SharesPurchased(address indexed investor, uint256 shares, uint256 roundNumber)",
          "function getCurrentRound() view returns (uint256 roundNumber, uint256 sharePrice, uint256 targetAmount, uint256 fundsRaised, uint256 sharesSold, uint256 endTime, bool isActive, bool isFinalized)"
        ];
        const contract = new ethers.Contract(address, abi, provider);

        let sharePrice = "0";
        try {
          const roundData = await contract.getCurrentRound();
          sharePrice = roundData.sharePrice.toString();
        } catch (e) {
          console.warn('[TX API] Cannot fetch sharePrice');
        }

        const currentBlock = await provider.getBlockNumber();
        const fromBlock = currentBlock - 5000; // Extended range

        const events = await contract.queryFilter("SharesPurchased", fromBlock, currentBlock);

        if (events.length > 0) {
          console.log(`[TX API] ✨ ${events.length} from blockchain`);
          txList = events.map(event => {
            const shares = event.args.shares || 0;
            const amountWei = sharePrice !== "0" ? ethers.BigNumber.from(sharePrice).mul(shares).toString() : "0";

            return {
              tx_hash: event.transactionHash,
              campaign_address: address,
              investor: event.args.investor.toLowerCase(),
              amount: amountWei,
              shares: shares.toString(),
              type: 'purchase',
              block_number: event.blockNumber,
              timestamp: new Date().toISOString(),
              is_blockchain_direct: true
            };
          }).reverse();
        }
      } catch (bcError) {
        console.warn('[TX API] Blockchain fallback error:', bcError.message);
      }
    }

    const response = NextResponse.json({
      transactions: txList,
      count: txList.length,
      source: txList.some(t => t.is_blockchain_direct) ? 'blockchain' : 'database'
    });

    // Force no-cache headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');

    return response;
  } catch (error) {
    console.error('[TX API] Error:', error);
    return NextResponse.json({ error: 'Database error', message: error.message }, { status: 500 });
  }
}
