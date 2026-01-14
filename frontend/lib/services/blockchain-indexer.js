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
import config from '../config.js';
import { campaigns, transactions, syncState, promotions, rounds, finance } from '../../backend/db.js';

// ABIs minimales pour l'indexation
const DIVAR_PROXY_ABI = [
    "event CampaignCreated(address indexed campaignAddress, address indexed creator, string name, uint256 timestamp)"
];

const PROMOTION_MANAGER_ABI = [
    "event PromotionCreated(address indexed campaign, address indexed promoter, uint8 boostType, uint256 amount, uint256 endTime)"
];

const CAMPAIGN_ABI = [
    "event SharesPurchased(address indexed investor, uint256 shares, uint256 roundNumber)",
    "function currentRound() view returns (uint256)",
    "function rounds(uint256) view returns (uint256 roundNumber, uint256 sharePrice, uint256 targetAmount, uint256 fundsRaised, uint256 sharesSold, uint256 endTime, bool isActive, bool isFinalized)",
    "function totalSharesIssued() view returns (uint256)",
    "function getCurrentRound() view returns (uint256 roundNumber, uint256 sharePrice, uint256 targetAmount, uint256 fundsRaised, uint256 sharesSold, uint256 endTime, bool isActive, bool isFinalized)",
    "function platformCommissionPercent() view returns (uint256)"
];

class BlockchainIndexer {
    constructor() {
        const rpcUrl = config.helpers.getPrimaryRPC();
        console.log(`[Indexer] Initialisation avec RPC: ${rpcUrl}`);

        this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        this.divarAddress = config.contracts.DivarProxy;
        this.isIndexing = false;
    }

    /**
     * Démarrer l'indexation en mode continu (Boucle infinie)
     */
    async start() {
        if (this.isIndexing) return;
        this.isIndexing = true;
        console.log('[Indexer] 🚀 Démarrage du service continu...');

        // Lancer la boucle de synchronisation (toutes les 30s)
        this.syncLoop();
    }

    /**
     * Effectuer un seul passage de synchronisation (Mode Serverless / Cron)
     */
    async syncNext() {
        console.log('[Indexer] ⏱️ Exécution d\'un passage de synchronisation...');
        try {
            await this.syncNewCampaigns();
            await this.syncAllTransactions();
            await this.syncAllRounds();
            await this.syncAllFinance();
            await this.syncPromotions();
            return { success: true };
        } catch (error) {
            console.error('[Indexer] ❌ Erreur passage sync:', error.message);
            throw error;
        }
    }

    async syncLoop() {
        while (this.isIndexing) {
            try {
                await this.syncNewCampaigns();
                await this.syncAllTransactions();
                await this.syncAllRounds();
                await this.syncAllFinance();
                await this.syncPromotions();
            } catch (error) {
                console.error('[Indexer] ❌ Erreur boucle sync:', error.message);
            }
            // Attendre 2 minutes avant la prochaine sync (plus raisonnable pour le cache)
            await new Promise(resolve => setTimeout(resolve, 120000));
        }
    }

    /**
     * Synchroniser les nouvelles campagnes depuis DivarProxy
     * OPTIMISÉ : Uniquement les nouveaux events, pas de scan complet
     */
    async syncNewCampaigns() {
        try {
            // Récupérer le dernier block synchronisé
            const startBlock = parseInt(process.env.DIVAR_START_BLOCK || '0');
            const lastSyncState = await syncState.get('campaigns') || { last_block: startBlock };
            const currentBlock = await this.provider.getBlockNumber();
            let fromBlock = lastSyncState.last_block + 1;

            if (fromBlock >= currentBlock) {
                console.log('[Indexer] ✅ À jour, pas de nouveau bloc');
                return;
            }

            const MAX_RANGE = 50000;
            const toBlock = Math.min(fromBlock + MAX_RANGE, currentBlock);

            console.log(`[Indexer] 🆕 Scan ${fromBlock} -> ${toBlock} (${toBlock - fromBlock + 1} blocs)`);

            const eventTopic = ethers.utils.id('CampaignCreated(address,address,string,uint256)');

            const logs = await this.provider.getLogs({
                address: this.divarAddress,
                topics: [eventTopic],
                fromBlock: '0x' + fromBlock.toString(16),
                toBlock: '0x' + toBlock.toString(16)
            });

            if (logs.length > 0) {
                console.log(`[Indexer] ✨ ${logs.length} nouvelles campagnes trouvées`);
                for (const log of logs) {
                    const campaignAddress = '0x' + log.topics[1].slice(26);
                    const creator = '0x' + log.topics[2].slice(26);

                    console.log(`[Indexer] ✨ Sync campagne: ${campaignAddress}`);
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
            }

            // Mettre à jour l'état de synchronisation avec le block atteint
            await syncState.upsert('campaigns', toBlock);

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
        try {
            // Récupérer toutes les adresses de campagnes connues
            const { data: allCampaigns } = await campaigns.getAll();
            if (!allCampaigns || allCampaigns.length === 0) return;

            console.log(`[Indexer] 💳 Sync transactions pour ${allCampaigns.length} campagnes...`);

            for (const campaign of allCampaigns) {
                await this.syncCampaignTransactions(campaign.address);
            }
        } catch (error) {
            console.error('[Indexer] ❌ Erreur syncAllTransactions:', error.message);
        }
    }

    /**
     * Synchroniser les détails de tous les rounds pour toutes les campagnes
     */
    async syncAllRounds() {
        try {
            const { data: allCampaigns } = await campaigns.getAll();
            if (!allCampaigns || allCampaigns.length === 0) return;

            for (const campaign of allCampaigns) {
                await this.syncCampaignRounds(campaign.address);
            }
        } catch (error) {
            console.error('[Indexer] ❌ Erreur syncAllRounds:', error.message);
        }
    }

    /**
     * Synchroniser les rounds d'une campagne spécifique
     */
    async syncCampaignRounds(campaignAddress) {
        try {
            const contract = new ethers.Contract(campaignAddress, CAMPAIGN_ABI, this.provider);
            const currentRoundNumber = await contract.currentRound();

            // Récupérer les données existantes pour comparer
            const { data: existingRounds } = await rounds.getByCampaign(campaignAddress);
            const roundsMap = {};
            (existingRounds || []).forEach(r => roundsMap[r.round_number] = r);

            for (let i = 1; i <= Number(currentRoundNumber); i++) {
                const roundData = await contract.rounds(i);

                // OPTIMISATION : Ne sauvegarder que si c'est nouveau ou si ça a changé
                const existing = roundsMap[i];
                const hasChanged = !existing ||
                    existing.funds_raised !== roundData.fundsRaised.toString() ||
                    existing.shares_sold !== Number(roundData.sharesSold) ||
                    existing.is_active !== roundData.isActive ||
                    existing.is_finalized !== roundData.isFinalized;

                if (hasChanged) {
                    await rounds.upsert({
                        campaign_address: campaignAddress.toLowerCase(),
                        round_number: Number(roundData.roundNumber),
                        share_price: roundData.sharePrice.toString(),
                        target_amount: roundData.targetAmount.toString(),
                        funds_raised: roundData.fundsRaised.toString(),
                        shares_sold: Number(roundData.sharesSold),
                        end_time: Math.floor(Number(roundData.endTime)),
                        is_active: roundData.isActive,
                        is_finalized: roundData.isFinalized
                    });
                    console.log(`[Indexer] 🔄 Round ${i} mis à jour pour ${campaignAddress.slice(0, 8)}`);
                }
            }
        } catch (error) {
            console.warn(`[Indexer] ⚠️ Erreur sync rounds ${campaignAddress}:`, error.message);
        }
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
                const { investor, shares, roundNumber } = event.args;
                const amount = sharePrice.mul(shares);

                await transactions.insert({
                    tx_hash: event.transactionHash,
                    campaign_address: campaignAddress.toLowerCase(),
                    investor: investor.toLowerCase(),
                    amount: amount.toString(),
                    shares: Number(shares),
                    round_number: Number(roundNumber),
                    type: 'purchase',
                    block_number: Number(event.blockNumber),
                    timestamp: new Date(),
                    commission: "0",
                    net_amount: amount.toString()
                });

                console.log(`[Indexer] 💸 Tx ${event.transactionHash.slice(0, 8)} : ${shares} shares`);
            }

            // Mettre à jour l'état de synchronisation
            await syncState.upsert(syncId, currentBlock);

        } catch (error) {
            console.error(`[Indexer] ❌ Erreur sync transactions ${campaignAddress}:`, error.message);
        }
    }

    async syncAllFinance() {
        try {
            const { data: allCampaigns } = await campaigns.getAll();
            if (!allCampaigns || allCampaigns.length === 0) return;

            for (const campaign of allCampaigns) {
                await this.syncCampaignFinance(campaign.address);
            }
        } catch (error) {
            console.error('[Indexer] ❌ Erreur syncAllFinance:', error.message);
        }
    }

    async syncCampaignFinance(campaignAddress) {
        try {
            const contract = new ethers.Contract(campaignAddress, CAMPAIGN_ABI, this.provider);
            // Lecture des données financières si exposées par le contrat
            // Pour l'instant, on prépare le terrain pour Escrow et Dividendes
        } catch (error) {
            console.warn(`[Indexer] ⚠️ Erreur sync finance ${campaignAddress}:`, error.message);
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
