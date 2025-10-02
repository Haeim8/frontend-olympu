import { baseSepolia } from 'viem/chains';
import { createPublicClient, http, parseAbiItem, formatEther, keccak256, toHex } from 'viem';
import path from 'path';
import dotenv from 'dotenv';
import { pathToFileURL } from 'url';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Import ABIs - avec fallback pour Vercel
let DivarProxyArtifact, CampaignArtifact;
try {
  // Essayer d'abord l'import dynamique (dev)
  DivarProxyArtifact = JSON.parse(
    await readFile(path.resolve(__dirname, '../../ABI/DivarProxyABI.json'), 'utf-8')
  );
  CampaignArtifact = JSON.parse(
    await readFile(path.resolve(__dirname, '../../ABI/CampaignABI.json'), 'utf-8')
  );
} catch (error) {
  // Fallback : import statique pour Vercel
  const DivarProxy = await import('../../ABI/DivarProxyABI.json');
  const Campaign = await import('../../ABI/CampaignABI.json');
  DivarProxyArtifact = DivarProxy.default || DivarProxy;
  CampaignArtifact = Campaign.default || Campaign;
}

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

// Plus besoin d'événements - tout est récupéré via fonctions du contrat!

export async function syncCampaigns() {
  console.log('[Indexer] 🚀 Synchronisation INTELLIGENTE (APPELS RPC DIRECTS)');

  const currentBlock = await publicClient.getBlockNumber();

  // 1. Récupérer toutes les campagnes depuis la DB
  const { data: campaigns } = await supabaseAdmin
    .from('campaigns')
    .select('address, creator');

  if (!campaigns || campaigns.length === 0) {
    console.log('[Indexer] ⚠️ Aucune campagne dans la DB');
    return { processed: 0 };
  }

  console.log(`[Indexer] 📋 ${campaigns.length} campagnes trouvées dans la DB`);

  // 2. Mettre à jour chaque campagne via appels RPC directs
  let processed = 0;
  for (const campaign of campaigns) {
    try {
      const details = await fetchCampaignDetails(campaign.address);

      await persistCampaign({
        address: campaign.address,
        creator: campaign.creator,
        blockNumber: 0n,
        ...details,
      });

      processed++;
    } catch (error) {
      console.error(`[Indexer] ❌ Erreur ${campaign.address}:`, error.message);
    }
  }

  console.log(`[Indexer] ✅ ${processed}/${campaigns.length} campagnes mises à jour`);

  // 3. Sync des transactions via appels RPC directs (getInvestments)
  const campaignAddresses = campaigns.map(c => c.address.toLowerCase());
  await syncCampaignTransactionsFromContract(campaignAddresses);

  await updateLastSyncedBlock('campaigns', currentBlock);

  return { processed };
}

async function syncCampaignTransactionsFromContract(campaignAddresses) {
  console.log('[Indexer][Tx] 🔄 Récupération transactions via fonctions contrat...');

  for (const campaignAddress of campaignAddresses) {
    try {
      // 1. Récupérer totalSupply (nombre de NFTs)
      const totalSupply = await publicClient.readContract({
        address: campaignAddress,
        abi: CAMPAIGN_ABI,
        functionName: 'totalSupply',
      });

      const supply = Number(totalSupply.toString());
      if (supply === 0) {
        console.log(`[Indexer][Tx] ⚠️ ${campaignAddress}: Aucun NFT`);
        continue;
      }

      console.log(`[Indexer][Tx] 📋 ${campaignAddress}: ${supply} NFT(s)`);

      // 2. Récupérer les propriétaires uniques
      const owners = new Set();
      for (let tokenId = 0; tokenId < supply; tokenId++) {
        try {
          const owner = await publicClient.readContract({
            address: campaignAddress,
            abi: CAMPAIGN_ABI,
            functionName: 'ownerOf',
            args: [BigInt(tokenId)],
          });
          owners.add(owner.toLowerCase());
        } catch (error) {
          // NFT brûlé ou erreur
        }
      }

      console.log(`[Indexer][Tx] 👥 ${campaignAddress}: ${owners.size} investisseur(s)`);

      // 3. Pour chaque investisseur, récupérer ses investissements
      for (const investor of owners) {
        try {
          const investments = await publicClient.readContract({
            address: campaignAddress,
            abi: CAMPAIGN_ABI,
            functionName: 'getInvestments',
            args: [investor],
          });

          // Insérer dans la DB
          for (const inv of investments) {
            // Générer un hash valide au format 0x[64 hex chars]
            const compositeKey = `${campaignAddress}-${investor}-${inv.timestamp.toString()}`;
            const txHash = keccak256(toHex(compositeKey));

            // Stocker en Wei (string) pour éviter les pertes de précision
            const amountWei = inv.amount.toString();
            const commissionWei = ((inv.amount * 12n) / 100n).toString();
            const netAmountWei = (inv.amount - (inv.amount * 12n) / 100n).toString();

            const payload = {
              tx_hash: txHash,
              campaign_address: campaignAddress,
              investor: investor,
              amount: amountWei,
              shares: inv.shares.toString(),
              round_number: inv.roundNumber.toString(),
              type: 'purchase',
              block_number: 0,
              timestamp: new Date(Number(inv.timestamp) * 1000).toISOString(),
              commission: commissionWei,
              net_amount: netAmountWei,
            };

            const { data, error } = await supabaseAdmin
              .from('campaign_transactions')
              .upsert(payload, { onConflict: 'tx_hash' });

            if (error) {
              console.error(`[Indexer][Tx] ❌ Erreur insertion ${txHash}:`, error.message);
            }
          }

          console.log(`[Indexer][Tx] ✅ ${investor}: ${investments.length} transaction(s)`);
        } catch (error) {
          console.warn(`[Indexer][Tx] ⚠️ Erreur ${investor}:`, error.message);
        }
      }
    } catch (error) {
      console.error(`[Indexer][Tx] ❌ Erreur ${campaignAddress}:`, error.message);
    }
  }

  console.log('[Indexer][Tx] ✅ Transactions récupérées');
}

async function fetchCampaignDetails(campaignAddress) {
  console.log(`[Indexer] 📞 Appels RPC pour ${campaignAddress}...`);

  // TOUS LES APPELS RPC EN PARALLÈLE
  const [
    name,
    symbol,
    currentRoundRaw,
    totalSupply,
    registry,
    startup,
    totalSharesIssued,
    totalDividendsDeposited,
    dividendsPerShare,
    escrowInfo,
    nftBackgroundColor,
    nftTextColor,
    nftLogoUrl,
    nftSector
  ] = await Promise.all([
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
    publicClient.readContract({
      address: campaignAddress,
      abi: CAMPAIGN_ABI,
      functionName: 'startup',
    }),
    publicClient.readContract({
      address: campaignAddress,
      abi: CAMPAIGN_ABI,
      functionName: 'totalSharesIssued',
    }),
    publicClient.readContract({
      address: campaignAddress,
      abi: CAMPAIGN_ABI,
      functionName: 'totalDividendsDeposited',
    }),
    publicClient.readContract({
      address: campaignAddress,
      abi: CAMPAIGN_ABI,
      functionName: 'dividendsPerShare',
    }),
    publicClient.readContract({
      address: campaignAddress,
      abi: CAMPAIGN_ABI,
      functionName: 'getEscrowInfo',
    }),
    publicClient.readContract({
      address: campaignAddress,
      abi: CAMPAIGN_ABI,
      functionName: 'nftBackgroundColor',
    }),
    publicClient.readContract({
      address: campaignAddress,
      abi: CAMPAIGN_ABI,
      functionName: 'nftTextColor',
    }),
    publicClient.readContract({
      address: campaignAddress,
      abi: CAMPAIGN_ABI,
      functionName: 'nftLogoUrl',
    }),
    publicClient.readContract({
      address: campaignAddress,
      abi: CAMPAIGN_ABI,
      functionName: 'nftSector',
    }),
  ]);

  const roundIndexValue = Array.isArray(currentRoundRaw) ? currentRoundRaw[0] : currentRoundRaw;
  const roundIndex = Number(roundIndexValue?.toString?.() ?? roundIndexValue);

  if (!Number.isFinite(roundIndex) || roundIndex < 0) {
    throw new Error(`Invalid round index for ${campaignAddress}: ${currentRoundRaw}`);
  }

  const roundData = Array.isArray(currentRoundRaw) ? currentRoundRaw : [];

  const sharePrice = formatEther(roundData[1] ?? 0n);
  const targetAmount = formatEther(roundData[2] ?? 0n);
  const fundsRaised = formatEther(roundData[3] ?? 0n);
  const sharesSold = roundData[4]?.toString() ?? '0';
  const endTime = Number(roundData[5] ?? 0);
  const isActive = Boolean(roundData[6]);
  const isFinalized = Boolean(roundData[7]);

  const status = determineStatus({ isActive, isFinalized, endTime });

  // Escrow info
  const escrowAmount = escrowInfo[0] ? formatEther(escrowInfo[0]) : '0';
  const escrowReleaseTime = Number(escrowInfo[1] ?? 0);
  const escrowTimeRemaining = Number(escrowInfo[2] ?? 0);
  const escrowIsReleased = Boolean(escrowInfo[3]);

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
    creator: startup?.toLowerCase?.() ?? registry.creator?.toLowerCase?.() ?? null,
    nftBackgroundColor: nftBackgroundColor ?? '',
    nftTextColor: nftTextColor ?? '',
    nftLogoUrl: nftLogoUrl ?? '',
    nftSector: nftSector ?? '',
    totalSharesIssued: totalSharesIssued?.toString() ?? '0',
    totalDividendsDeposited: totalDividendsDeposited ? formatEther(totalDividendsDeposited) : '0',
    dividendsPerShare: dividendsPerShare ? formatEther(dividendsPerShare) : '0',
    escrowAmount,
    escrowReleaseTime: escrowReleaseTime > 0 ? new Date(escrowReleaseTime * 1000).toISOString() : null,
    escrowTimeRemaining,
    escrowIsReleased,
    roundSharePrice: sharePrice,
    roundTargetAmount: targetAmount,
    roundEndTime: endTime > 0 ? endTime : null,
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
    nftBackgroundColor,
    nftTextColor,
    nftLogoUrl,
    nftSector,
    totalSharesIssued,
    totalDividendsDeposited,
    dividendsPerShare,
    escrowAmount,
    escrowReleaseTime,
    escrowTimeRemaining,
    escrowIsReleased,
    roundSharePrice,
    roundTargetAmount,
    roundEndTime,
  } = payload;

  // Calculer progress_percentage
  const goalNum = parseFloat(goal || '0');
  const raisedNum = parseFloat(raised || '0');
  const progressPercentage = goalNum > 0 ? Math.min((raisedNum / goalNum) * 100, 100) : 0;

  // Compter total_transactions et unique_investors depuis la DB
  const { count: txCount } = await supabaseAdmin
    .from('campaign_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_address', address);

  const { data: investors } = await supabaseAdmin
    .from('campaign_transactions')
    .select('investor')
    .eq('campaign_address', address);

  const uniqueInvestors = new Set((investors || []).map(i => i.investor)).size;

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
    nft_background_color: nftBackgroundColor || '',
    nft_text_color: nftTextColor || '',
    nft_logo_url: nftLogoUrl || null,
    nft_sector: nftSector || null,
    round_share_price: roundSharePrice ?? sharePrice,
    round_target_amount: roundTargetAmount ?? goal,
    round_end_time: roundEndTime ?? endDate,
    total_investors: uniqueInvestors,
    unique_investors: uniqueInvestors,
    total_transactions: txCount || 0,
    progress_percentage: progressPercentage,
    updated_at: new Date().toISOString(),
  };

  if (blockNumber && blockNumber > 0) {
    upsertPayload.last_synced_block = Number(blockNumber);
  }

  await supabaseAdmin.from('campaigns').upsert(upsertPayload);
}

export async function syncSingleCampaign(address) {
  if (!address) {
    throw new Error('syncSingleCampaign: address is required');
  }
  const campaignAddress = address.toLowerCase();
  const details = await fetchCampaignDetails(campaignAddress);
  if (!details) {
    throw new Error(`syncSingleCampaign: unable to fetch details for ${campaignAddress}`);
  }

  await persistCampaign({
    address: campaignAddress,
    creator: details.creator ?? null,
    blockNumber: 0n,
    ...details,
  });

  await syncCampaignTransactionsFromContract([campaignAddress]);

  return { address: campaignAddress };
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
