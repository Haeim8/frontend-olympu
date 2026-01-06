/**
 * =============================================================================
 * INDEXER BLOCKCHAIN - LIVAR
 * =============================================================================
 * 
 * Service de synchronisation des événements blockchain vers PostgreSQL.
 * Écoute les événements :
 * - CampaignCreated (sur DivarProxy)
 * - SharePurchased (sur les contrats Campaign)
 * - etc.
 * =============================================================================
 */

import { ethers } from 'ethers';
import config from '../config';
import { campaigns, transactions, syncState, promotions } from '../../backend/db';
import { campaignCache, transactionCache, promotionCache } from '../../backend/redis';

// ABIs minimales pour l'indexation
const DIVAR_PROXY_ABI = [
    "event CampaignCreated(address indexed campaignAddress, address indexed creator, string name, string symbol)"
];

const PROMOTION_MANAGER_ABI = [
    "event PromotionCreated(address indexed campaign, address indexed promoter, uint8 boostType, uint256 amount, uint256 endTime)"
];

const CAMPAIGN_ABI = [
    "event SharePurchased(address indexed investor, uint256 amount, uint256 shares, uint256 round)",
    "function currentRound() view returns (uint256)",
    "function totalShares() view returns (uint256)",
    "function sharesSold() view returns (uint256)",
    "function goal() view returns (uint256)",
    "function raised() view returns (uint256)",
    "function sharePrice() view returns (uint256)",
    "function status() view returns (uint8)"
];

class BlockchainIndexer {
    constructor() {
        this.provider = new ethers.providers.JsonRpcProvider(config.helpers.getPrimaryRPC());
        this.isIndexing = false;
    }

    /**
     * Démarrer l'indexation
     */
    async start() {
        if (this.isIndexing) return;
        this.isIndexing = true;
        console.log('[Indexer] 🚀 Démarrage du service...');

        // Lancer la boucle de synchronisation (toutes les 30s)
        this.syncLoop();
    }

    async syncLoop() {
        while (this.isIndexing) {
            try {
                await this.syncNewCampaigns();
                await this.syncAllTransactions();
                await this.syncPromotions();
            } catch (error) {
                console.error('[Indexer] ❌ Erreur boucle sync:', error.message);
            }
            // Attendre 30 secondes avant la prochaine sync
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
    }

    /**
     * Synchroniser les nouvelles campagnes depuis DivarProxy
     */
    async syncNewCampaigns() {
        const proxyAddress = config.contracts.DivarProxy;
        if (!proxyAddress) return;

        const lastSync = await syncState.get('campaigns') || { last_block: 0 };
        const currentBlock = await this.provider.getBlockNumber();
        const fromBlock = Math.max(lastSync.last_block + 1, currentBlock - 10000); // Max 10k blocks backwards

        if (fromBlock >= currentBlock) return;

        console.log(`[Indexer] 🔍 Recherche campagnes entre ${fromBlock} et ${currentBlock}`);

        const contract = new ethers.Contract(proxyAddress, DIVAR_PROXY_ABI, this.provider);
        const events = await contract.queryFilter("CampaignCreated", fromBlock, currentBlock);

        for (const event of events) {
            const { campaignAddress, creator, name, symbol } = event.args;

            // Récupérer les détails supplémentaires depuis le contrat
            const campaignDetails = await this.fetchCampaignDetails(campaignAddress);

            await campaigns.upsert({
                address: campaignAddress.toLowerCase(),
                creator: creator.toLowerCase(),
                name,
                symbol,
                ...campaignDetails,
                last_synced_block: event.blockNumber
            });

            console.log(`[Indexer] ✨ Nouvelle campagne indexée : ${name} (${campaignAddress})`);
            await campaignCache.invalidateAll();
        }

        await syncState.upsert('campaigns', currentBlock);
    }

    /**
     * Récupérer les détails techniques d'une campagne via son contrat
     */
    async fetchCampaignDetails(address) {
        const contract = new ethers.Contract(address, CAMPAIGN_ABI, this.provider);
        try {
            const [round, total, sold, goal, raised, price, status] = await Promise.all([
                contract.currentRound(),
                contract.totalShares(),
                contract.sharesSold(),
                contract.goal(),
                contract.raised(),
                contract.sharePrice(),
                contract.status()
            ]);

            const statusMap = { 0: 'active', 1: 'ended', 2: 'cancelled' };

            return {
                current_round: Number(round),
                total_shares: Number(total),
                shares_sold: Number(sold),
                goal: goal.toString(),
                raised: raised.toString(),
                share_price: price.toString(),
                status: statusMap[Number(status)] || 'active'
            };
        } catch (error) {
            console.warn(`[Indexer] ⚠️ Impossible de lire les détails pour ${address}:`, error.message);
            return {};
        }
    }

    /**
     * Synchroniser les transactions pour toutes les campagnes connues
     */
    async syncAllTransactions() {
        const activeCampaigns = await campaigns.getAll({ status: 'active' });

        for (const campaign of activeCampaigns) {
            await this.syncCampaignTransactions(campaign.address);
        }
    }

    /**
     * Synchroniser les transactions d'une campagne spécifique
     */
    async syncCampaignTransactions(campaignAddress) {
        const syncId = `tx:${campaignAddress.toLowerCase()}`;
        const lastSync = await syncState.get(syncId) || { last_block: 0 };
        const currentBlock = await this.provider.getBlockNumber();
        const fromBlock = Math.max(lastSync.last_block + 1, currentBlock - 5000);

        if (fromBlock >= currentBlock) return;

        const contract = new ethers.Contract(campaignAddress, CAMPAIGN_ABI, this.provider);
        const events = await contract.queryFilter("SharePurchased", fromBlock, currentBlock);

        for (const event of events) {
            const { investor, amount, shares, round } = event.args;

            await transactions.insert({
                tx_hash: event.transactionHash,
                campaign_address: campaignAddress.toLowerCase(),
                investor: investor.toLowerCase(),
                amount: amount.toString(),
                shares: Number(shares),
                round_number: Number(round),
                type: 'purchase',
                block_number: event.blockNumber,
                timestamp: new Date(), // Idéalement récupérer via getBlock, mais coûteux en RPC
                commission: "0", // À calculer si besoin
                net_amount: amount.toString()
            });

            console.log(`[Indexer] 💸 Transaction indexée pour ${campaignAddress} : ${shares} shares`);
            await transactionCache.invalidate(campaignAddress);
        }

        await syncState.upsert(syncId, currentBlock);

        // Si des transactions ont été trouvées, mettre à jour les stats de la campagne (fait via Trigger SQL, mais forçons le cache)
        if (events.length > 0) {
            await campaignCache.invalidate(campaignAddress);
        }
    }

    /**
     * Synchroniser les promotions depuis RecPromotionManager
     */
    async syncPromotions() {
        const promoManagerAddress = config.contracts.RecPromotionManager;
        if (!promoManagerAddress) return;

        const lastSync = await syncState.get('promotions') || { last_block: 0 };
        const currentBlock = await this.provider.getBlockNumber();
        const fromBlock = Math.max(lastSync.last_block + 1, currentBlock - 5000);

        if (fromBlock >= currentBlock) return;

        const contract = new ethers.Contract(promoManagerAddress, PROMOTION_MANAGER_ABI, this.provider);
        const events = await contract.queryFilter("PromotionCreated", fromBlock, currentBlock);

        for (const event of events) {
            const { campaign, promoter, boostType, amount, endTime } = event.args;

            await promotions.insert({
                campaign_address: campaign.toLowerCase(),
                creator: promoter.toLowerCase(),
                boost_type: Number(boostType),
                eth_amount: amount.toString(),
                start_timestamp: new Date(),
                end_timestamp: new Date(Number(endTime) * 1000),
                tx_hash: event.transactionHash,
                block_number: event.blockNumber,
            });

            console.log(`[Indexer] 🔥 Promotion indexée pour ${campaign}`);
        }

        if (events.length > 0) {
            await promotionCache.invalidate();
        }

        await syncState.upsert('promotions', currentBlock);
    }
}

export const indexer = new BlockchainIndexer();
export default indexer;
