import { baseSepolia } from 'viem/chains';
import { createPublicClient, http, parseAbiItem, formatEther } from 'viem';
import path from 'path';
import dotenv from 'dotenv';
import { pathToFileURL } from 'url';

import { createRequire } from 'module';

const require = createRequire(import.meta.url);

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const DivarProxyArtifact = require('../../ABI/DivarProxyABI.json');
const CampaignArtifact = require('../../ABI/CampaignABI.json');
const { supabaseAdmin } = await import('../supabase/server.js');

const DIVAR_PROXY_ADDRESS = (process.env.DIVAR_PROXY_ADDRESS || '0xaB0999Eae920849a41A55eA080d0a4a210156817').toLowerCase();
const DEFAULT_START_BLOCK = BigInt(process.env.DIVAR_START_BLOCK ?? 30247040);
const BLOCK_CHUNK = BigInt(process.env.DIVAR_INDEXER_CHUNK ?? 1000);

const RPC_API_KEY = process.env.CDP_API_KEY || process.env.NEXT_PUBLIC_CDP_CLIENT_API_KEY || process.env.NEXT_PUBLIC_CDP_PROJECT_ID;
const RPC_URL = RPC_API_KEY
  ? `https://api.developer.coinbase.com/rpc/v1/base-sepolia/${RPC_API_KEY}`
  : 'https://sepolia.base.org';

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC_URL),
});

const DIVAR_PROXY_ABI = DivarProxyArtifact.abi;
const CAMPAIGN_ABI = CampaignArtifact.abi;

const EVENT_CAMPAIGN_CREATED = parseAbiItem(
  'event CampaignCreated(address indexed campaignAddress, address indexed creator, string name, uint256 timestamp)'
);

const EVENT_SHARES_PURCHASED = parseAbiItem(
  'event SharesPurchased(address indexed investor, uint256 amount, uint256 shares, uint256 timestamp)'
);

export async function syncCampaigns() {
  const currentBlock = await publicClient.getBlockNumber();
  const fromBlock = await getLastSyncedBlock('campaigns');

  const startBlock = fromBlock > 0n ? fromBlock + 1n : DEFAULT_START_BLOCK;
  if (startBlock > currentBlock) {
    return { processed: 0, skipped: true };
  }

  let processed = 0;
  let cursor = startBlock;
  let totalLogs = 0;
  const discoveredCampaignAddresses = new Set();

  console.log(`[Indexer] Synchronisation depuis le bloc ${startBlock.toString()} jusqu'au bloc ${currentBlock.toString()}`);

  while (cursor <= currentBlock) {
    const upper = cursor + BLOCK_CHUNK - 1n > currentBlock ? currentBlock : cursor + BLOCK_CHUNK - 1n;

    const logs = await publicClient.getLogs({
      address: DIVAR_PROXY_ADDRESS,
      event: EVENT_CAMPAIGN_CREATED,
      fromBlock: cursor,
      toBlock: upper,
    });

    const count = logs.length;
    totalLogs += count;
    console.log(`[Indexer] Bloc ${cursor.toString()} -> ${upper.toString()} : ${count} campagnes trouvées (cumul = ${totalLogs})`);

    for (const log of logs) {
      const campaignAddress = log.args.campaignAddress.toLowerCase();
      const creator = log.args.creator.toLowerCase();
      const blockNumber = log.blockNumber ?? upper;

      const details = await fetchCampaignDetails(campaignAddress);
      discoveredCampaignAddresses.add(campaignAddress);

      await persistCampaign({
        address: campaignAddress,
        creator,
        blockNumber,
        ...details,
      });
      processed += 1;
    }

    await updateLastSyncedBlock('campaigns', upper);
    cursor = upper + 1n;
  }


  const { data: existingCampaignRows } = await supabaseAdmin
    .from('campaigns')
    .select('address');

  const allCampaignAddresses = new Set(
    (existingCampaignRows ?? [])
      .map((row) => row.address?.toLowerCase?.())
      .filter(Boolean),
  );
  for (const addr of discoveredCampaignAddresses) {
    if (addr) {
      allCampaignAddresses.add(addr.toLowerCase());
    }
  }

  await refreshExistingCampaigns();

  await syncCampaignTransactions([...allCampaignAddresses], startBlock, currentBlock);

  console.log(`[Indexer] Total de logs traités : ${totalLogs}`);

  return { processed };
}

async function fetchCampaignDetails(campaignAddress) {
  const [name, symbol, currentRoundRaw, totalSupply, registry] = await Promise.all([
    publicClient.readContract({
      address: campaignAddress,
      abi: CAMPAIGN_ABI,
      functionName: 'name',
    }),
    publicClient.readContract({
      address: campaignAddress,
      abi: CAMPAIGN_ABI,
      functionName: 'symbol',
    }),
    publicClient.readContract({
      address: campaignAddress,
      abi: CAMPAIGN_ABI,
      functionName: 'getCurrentRound',
    }),
    publicClient.readContract({
      address: campaignAddress,
      abi: CAMPAIGN_ABI,
      functionName: 'totalSupply',
    }),
    publicClient.readContract({
      address: DIVAR_PROXY_ADDRESS,
      abi: DIVAR_PROXY_ABI,
      functionName: 'getCampaignRegistry',
      args: [campaignAddress],
    }),
  ]);

  const roundIndexValue = Array.isArray(currentRoundRaw)
    ? currentRoundRaw[0]
    : currentRoundRaw;
  const roundIndex = typeof roundIndexValue === 'object' && roundIndexValue?.toString
    ? Number(roundIndexValue.toString())
    : Number(roundIndexValue);

  if (!Number.isFinite(roundIndex) || roundIndex < 0) {
    throw new Error(`Invalid round index for ${campaignAddress}: ${currentRoundRaw}`);
  }

  const roundData = Array.isArray(currentRoundRaw)
    ? currentRoundRaw
    : await publicClient.readContract({
        address: campaignAddress,
        abi: CAMPAIGN_ABI,
        functionName: 'rounds',
        args: [BigInt(roundIndex)],
      });

  const sharePrice = formatEther(roundData[1]);
  const targetAmount = formatEther(roundData[2]);
  const fundsRaised = formatEther(roundData[3]);
  const sharesSold = roundData[4].toString();
  const endTime = Number(roundData[5]);
  const isActive = Boolean(roundData[6]);
  const isFinalized = Boolean(roundData[7]);

  const status = determineStatus({ isActive, isFinalized, endTime });

  return {
    name,
    symbol,
    goal: targetAmount,
    raised: fundsRaised,
    sharePrice,
    sharesSold,
    totalShares: totalSupply.toString(),
    status,
    isActive,
    isFinalized,
    endDate: endTime > 0 ? new Date(endTime * 1000).toISOString() : null,
    metadataUri: registry.metadata,
    category: registry.category,
    logo: registry.logo,
    currentRound: roundIndex,
  };
}

function determineStatus({ isActive, isFinalized, endTime }) {
  if (isActive) return 'active';
  if (isFinalized) return 'finalized';
  if (endTime && endTime * 1000 > Date.now()) return 'upcoming';
  return 'ended';
}

async function persistCampaign(payload) {
  const {
    address,
    creator,
    blockNumber,
    name,
    symbol,
    goal,
    raised,
    sharePrice,
    sharesSold,
    totalShares,
    status,
    isActive,
    isFinalized,
    endDate,
    metadataUri,
    category,
    logo,
    currentRound,
  } = payload;

  const upsertPayload = {
    address,
    creator,
    name,
    symbol,
    goal,
    raised,
    share_price: sharePrice,
    shares_sold: sharesSold,
    total_shares: totalShares,
    status,
    is_active: isActive,
    is_finalized: isFinalized,
    end_date: endDate,
    metadata_uri: metadataUri,
    category,
    logo,
    current_round: currentRound,
    updated_at: new Date().toISOString(),
  };

  if (blockNumber && blockNumber > 0) {
    upsertPayload.last_synced_block = Number(blockNumber);
  }

  await supabaseAdmin.from('campaigns').upsert(upsertPayload);
}

async function syncCampaignTransactions(campaignAddresses, startBlock, currentBlock) {
  if (!Array.isArray(campaignAddresses) || campaignAddresses.length === 0) {
    console.log('[Indexer][Tx] Aucune campagne à synchroniser');
    return;
  }

  const txFromBlock = await getLastSyncedBlock('campaign_transactions');
  const txStartBlock = txFromBlock > 0n ? txFromBlock + 1n : startBlock;
  if (txStartBlock > currentBlock) {
    console.log('[Indexer][Tx] Transactions déjà à jour');
    return;
  }

  const uniqueAddresses = Array.from(new Set(
    campaignAddresses
      .map((addr) => addr?.toLowerCase?.())
      .filter(Boolean),
  ));

  console.log(
    `[Indexer][Tx] Synchronisation des transactions depuis le bloc ${txStartBlock.toString()} jusqu'au bloc ${currentBlock.toString()} (${uniqueAddresses.length} campagnes)`
  );

  const addressChunks = chunkArray(uniqueAddresses, 40);
  let cursor = txStartBlock;

  while (cursor <= currentBlock) {
    const upper = cursor + BLOCK_CHUNK - 1n > currentBlock ? currentBlock : cursor + BLOCK_CHUNK - 1n;
    let totalForRange = 0;

    for (const addressChunk of addressChunks) {
      if (!addressChunk || addressChunk.length === 0) continue;

      try {
        const logs = await publicClient.getLogs({
          address: addressChunk,
          event: EVENT_SHARES_PURCHASED,
          fromBlock: cursor,
          toBlock: upper,
        });

        totalForRange += logs.length;
        if (logs.length === 0) continue;

        const rows = logs.map((log) => {
          const investor = log.args?.investor;
          const amount = log.args?.amount;
          const shares = log.args?.shares;
          const timestamp = log.args?.timestamp;
          const blockNumber = log.blockNumber ?? upper;

          const amountEth = amount !== undefined ? formatEther(amount) : '0';
          const timestampSeconds = typeof timestamp === 'object' && timestamp?.toString
            ? Number(timestamp.toString())
            : Number(timestamp ?? 0);
          const isoTimestamp = Number.isFinite(timestampSeconds) && timestampSeconds > 0
            ? new Date(timestampSeconds * 1000).toISOString()
            : new Date().toISOString();

          return {
            tx_hash: log.transactionHash,
            campaign_address: log.address.toLowerCase(),
            investor: investor?.toLowerCase?.() ?? investor,
            amount: amountEth,
            shares: shares?.toString?.() ?? '0',
            type: 'purchase',
            block_number: Number(blockNumber),
            timestamp: isoTimestamp,
          };
        });

        await supabaseAdmin
          .from('campaign_transactions')
          .upsert(rows, { onConflict: 'tx_hash' });
      } catch (error) {
        console.warn('[Indexer][Tx] Erreur lors de la récupération des transactions:', error.message);
      }
    }

    console.log(`[Indexer][Tx] Blocs ${cursor.toString()} -> ${upper.toString()} : ${totalForRange} transactions`);
    await updateLastSyncedBlock('campaign_transactions', upper);
    cursor = upper + 1n;
  }
}

function chunkArray(list, size) {
  if (!Array.isArray(list) || size <= 0) return [];
  const chunks = [];
  for (let i = 0; i < list.length; i += size) {
    chunks.push(list.slice(i, i + size));
  }
  return chunks;
}


async function refreshExistingCampaigns() {
  const { data: campaigns } = await supabaseAdmin
    .from('campaigns')
    .select('address, creator');

  if (!campaigns) return;

  for (const row of campaigns) {
    try {
      const address = row.address;
      const details = await fetchCampaignDetails(address);
      await persistCampaign({ address, creator: row.creator, blockNumber: 0n, ...details });
    } catch (error) {
      console.error('[Indexer] Failed to refresh campaign', row.address, error);
    }
  }
}

async function getLastSyncedBlock(id) {
  const { data, error } = await supabaseAdmin
    .from('sync_state')
    .select('last_block')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[Indexer] sync_state read error', error);
    return 0n;
  }

  return data?.last_block ? BigInt(data.last_block) : 0n;
}

async function updateLastSyncedBlock(id, blockNumber) {
  await supabaseAdmin
    .from('sync_state')
    .upsert({ id, last_block: Number(blockNumber), updated_at: new Date().toISOString() });
}


const isMain = process.argv[1] ? pathToFileURL(process.argv[1]).href === import.meta.url : false;

if (isMain) {
  syncCampaigns()
    .then(({ processed, skipped }) => {
      console.log(`✅ syncCampaigns terminé : ${processed} campagnes traitées${skipped ? ' (skip, à jour)' : ''}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ syncCampaigns échoué :', error);
      process.exit(1);
    });
}
