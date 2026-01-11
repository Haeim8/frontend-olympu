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
import { SimpleRpcProvider } from './simple-rpc-provider.js';

// ABIs minimales pour l'indexation
const DIVAR_PROXY_ABI = [
    "event CampaignCreated(address indexed campaignAddress, address indexed creator, string name, uint256 timestamp)"
];

const PROMOTION_MANAGER_ABI = [
    "event PromotionCreated(address indexed campaign, address indexed promoter, uint8 boostType, uint256 amount, uint256 endTime)"
];

const CAMPAIGN_ABI = [
    "event SharesPurchased(address indexed investor, uint256 shares, uint256 roundNumber)",
    "function getCurrentRound() view returns (uint256 roundNumber, uint256 sharePrice, uint256 targetAmount, uint256 fundsRaised, uint256 sharesSold, uint256 endTime, bool isActive, bool isFinalized)",
    "function totalSharesIssued() view returns (uint256)"
];

class BlockchainIndexer {
    constructor() {
        const rpcUrl = 'https://sepolia.base.org';
        console.log('[Indexer] Initialisation avec fetch natif');

        // Utiliser notre SimpleRpcProvider avec fetch natif (marche dans Next.js)
        this.provider = new SimpleRpcProvider(rpcUrl);
        this.divarAddress = '0xaB0999Eae920849a41A55eA080d0a4a210156817';
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
     * OPTIMISÉ : Uniquement les nouveaux events, pas de scan complet
     */
    async syncNewCampaigns() {
        try {
            // Récupérer le dernier block synchronisé
            const lastSyncState = await syncState.get('campaigns') || { last_block: 30247040 };
            const currentBlock = await this.provider.getBlockNumber();
            const fromBlock = lastSyncState.last_block + 1;
            
            // Ne scanner que les blocs récents
            if (fromBlock >= currentBlock) {
                console.log('[Indexer] ✅ À jour, pas de nouveau bloc');
                return;
            }

            console.log(`[Indexer] 🆕 Scan ${fromBlock} -> ${currentBlock} (${currentBlock - fromBlock + 1} blocs)`);

            const eventTopic = ethers.utils.id('CampaignCreated(address,address,string,uint256)');
            
            // Un seul appel RPC pour les nouveaux blocs
            const logs = await this.provider.getLogs({
                address: this.divarAddress,
                topics: [eventTopic],
                fromBlock: '0x' + fromBlock.toString(16),
                toBlock: '0x' + currentBlock.toString(16)
            });

            console.log(`[Indexer] 🆕 ${logs.length} nouvelles campagnes`);

            // Traiter uniquement les nouvelles campagnes
            for (const log of logs) {
                const campaignAddress = '0x' + log.topics[1].slice(26);
                const creator = '0x' + log.topics[2].slice(26);

                console.log(`[Indexer] ✨ Nouvelle campagne: ${campaignAddress}`);

                // Récupérer les détails complets depuis le contrat
                const details = await this.fetchCampaignDetails(campaignAddress);
                
                await campaigns.upsert({
                    address: campaignAddress.toLowerCase(),
                    creator: creator.toLowerCase(),
                    name: details.name || 'Campaign',
                    symbol: details.symbol || 'CAMP',
                    goal: details.goal || '0',
                    raised: details.raised || '0',
                    share_price: details.share_price || '0',
                    shares_sold: details.shares_sold || '0',
                    total_shares: details.total_shares || '0',
                    status: details.status || 'active',
                    is_active: details.status === 'active',
                    is_finalized: details.status === 'finalized',
                    end_date: details.end_date || null
                });
            }

            // Invalider uniquement les caches concernés
            if (logs.length > 0) {
                await campaignCache.invalidateAll();
            }
            
            // Mettre à jour l'état de synchronisation
            await syncState.upsert('campaigns', currentBlock);
            
        } catch (error) {
            console.error('[Indexer] ❌ Erreur sync nouvelles campagnes:', error.message);
        }
    }

    /**
     * Récupérer les détails techniques d'une campagne via son contrat
     */
    async fetchCampaignDetails(address) {
        const contract = new ethers.Contract(address, CAMPAIGN_ABI, this.provider);
        try {
            const roundData = await contract.getCurrentRound();
            const totalShares = await contract.totalSharesIssued();

            // Décomposer les données du round
            const [roundNumber, sharePrice, targetAmount, fundsRaised, sharesSold, endTime, isActive, isFinalized] = roundData;

            // Déterminer le statut
            let status = 'active';
            if (isFinalized) {
                status = 'finalized';
            } else if (!isActive) {
                status = 'ended';
            }

            return {
                current_round: Number(roundNumber),
                total_shares: Number(totalShares),
                shares_sold: Number(sharesSold),
                goal: targetAmount.toString(),
                raised: fundsRaised.toString(),
                share_price: sharePrice.toString(),
                end_date: new Date(Number(endTime) * 1000),
                status
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
        // DÉSACTIVÉ: nécessite ethers.Contract qui ne fonctionne pas avec SimpleRpcProvider
        return;
    }

    /**
     * Synchroniser les transactions d'une campagne spécifique
     * OPTIMISÉ : Uniquement les nouvelles transactions
     */
    async syncCampaignTransactions(campaignAddress) {
        try {
            const syncId = `tx:${campaignAddress.toLowerCase()}`;
            const lastSync = await syncState.get(syncId) || { last_block: 0 };
            const currentBlock = await this.provider.getBlockNumber();
            const fromBlock = Math.max(lastSync.last_block + 1, currentBlock - 1000); // Limité à 1000 blocs

            if (fromBlock >= currentBlock) return;

            const contract = new ethers.Contract(campaignAddress, CAMPAIGN_ABI, this.provider);
            const events = await contract.queryFilter("SharesPurchased", fromBlock, currentBlock);

            if (events.length === 0) {
                console.log(`[Indexer] ✅ Pas de nouvelles transactions pour ${campaignAddress.slice(0, 8)}`);
                return;
            }

            console.log(`[Indexer] 💸 ${events.length} nouvelles transactions pour ${campaignAddress.slice(0, 8)}`);

            // Récupérer les détails du round actuel une seule fois
            let roundData = null;
            try {
                roundData = await contract.getCurrentRound();
            } catch (error) {
                console.warn(`[Indexer] Impossible de récupérer round data pour ${campaignAddress}:`, error.message);
                return;
            }

            const sharePrice = roundData[1]; // sharePrice est le 2ème élément

            for (const event of events) {
                const { investor, numShares, roundNumber } = event.args;
                const amount = sharePrice.mul(numShares);

                await transactions.insert({
                    tx_hash: event.transactionHash,
                    campaign_address: campaignAddress.toLowerCase(),
                    investor: investor.toLowerCase(),
                    amount: amount.toString(),
                    shares: Number(numShares),
                    round_number: Number(roundNumber),
                    type: 'purchase',
                    block_number: event.blockNumber,
                    timestamp: new Date(),
                    commission: "0",
                    net_amount: amount.toString()
                });

                console.log(`[Indexer] 💸 Tx ${event.transactionHash.slice(0, 8)} : ${numShares} shares`);
            }

            // Invalider les caches
            await transactionCache.invalidate(campaignAddress);
            await campaignCache.invalidate(campaignAddress);
            
            // Mettre à jour l'état de synchronisation
            await syncState.upsert(syncId, currentBlock);

        } catch (error) {
            console.error(`[Indexer] ❌ Erreur sync transactions ${campaignAddress}:`, error.message);
        }
    }

    /**
     * Synchroniser les promotions depuis RecPromotionManager
     */
    async syncPromotions() {
        // DÉSACTIVÉ: nécessite ethers.Contract
        return;
    }
}

export const indexer = new BlockchainIndexer();
export default indexer;
