import { NextResponse } from 'next/server';
import { campaigns as dbCampaigns, transactions as dbTransactions } from '@/backend/db';
import { ethers } from 'ethers';
import config from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const rawAddress = params?.address;

  if (!rawAddress) {
    return NextResponse.json({ error: 'Missing campaign address' }, { status: 400 });
  }

  const address = rawAddress.toLowerCase();
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
    let txList = await dbTransactions.getByCampaign(address, { limit, offset });

    // 2. Fallback Blockchain DIRECT si Supabase est vide (ou pour les très récentes)
    // Utile quand l'indexer est en retard ou bloqué
    if (txList.length === 0) {
      console.log(`[API] 🔄 Fallback Blockchain pour ${address.slice(0, 10)}... (0 tx en DB)`);
      try {
        const rpcUrl = config.helpers.getPrimaryRPC();
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

        // ABI minimale
        const abi = [
          "event SharesPurchased(address indexed investor, uint256 shares, uint256 roundNumber)",
          "function getCurrentRound() view returns (uint256 roundNumber, uint256 sharePrice, uint256 targetAmount, uint256 fundsRaised, uint256 sharesSold, uint256 endTime, bool isActive, bool isFinalized)"
        ];
        const contract = new ethers.Contract(address, abi, provider);

        // Récupérer le prix de la part pour le calcul (un seul appel)
        let sharePrice = "0";
        try {
          const roundData = await contract.getCurrentRound();
          sharePrice = roundData.sharePrice.toString();
        } catch (e) {
          console.warn('[API] Impossible de fetch sharePrice pour fallback');
        }

        // Scan limité (2000 blocs pour le fallback direct)
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = currentBlock - 2000;

        const events = await contract.queryFilter("SharesPurchased", fromBlock, currentBlock);

        if (events.length > 0) {
          console.log(`[API] ✨ ${events.length} transactions trouvées en direct sur chain`);
          const blockchainTxs = events.map(event => {
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

          txList = blockchainTxs;
        }
      } catch (bcError) {
        console.warn('[API] Erreur fallback blockchain:', bcError.message);
      }
    }

    return NextResponse.json({
      transactions: txList,
      source: txList.some(t => t.is_blockchain_direct) ? 'blockchain' : 'database'
    });
  } catch (error) {
    console.error('[API] Error fetching transactions:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
