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
        this.rpcUrls = config.helpers.getAllRPCs();
        this.provider = null;
        this.divarAddress = config.contracts.DivarProxy;
        this.isIndexing = false;
        this.rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL ||
            process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ||
            'https://mainnet.base.org';
        this.chainId = process.env.NEXT_PUBLIC_NETWORK === 'base' ? 8453 : 84532;
        console.log(`[Indexer] Config RPCs: ${this.rpcUrls.length} endpoints`);
    }

    /**
     * Faire un appel RPC via fetch natif (fonctionne dans Next.js serverless)
     */
    async rpcCall(method, params = []) {
        const res = await fetch(this.rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method, params, id: 1, jsonrpc: '2.0' })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message || 'RPC Error');
        return data.result;
    }

    /**
     * Appeler une fonction de contrat via RPC (eth_call)
     */
    async contractCall(contractAddress, functionSelector) {
        return this.rpcCall('eth_call', [
            { to: contractAddress, data: functionSelector },
            'latest'
        ]);
    }


    async getProvider() {
        // Pas de cache - créer un nouveau provider à chaque fois pour éviter les problèmes de connexion
        const network = {
            name: process.env.NEXT_PUBLIC_NETWORK === 'base' ? 'base' : 'base-sepolia',
            chainId: this.chainId || 8453
        };

        // Utiliser le RPC mainnet ou sepolia selon la config
        const rpcUrl = this.rpcUrl;
        console.log(`[Indexer] RPC URL: ${rpcUrl.slice(0, 50)}...`);

        // Test avec fetch natif puis créer le provider ethers
        try {
            const testRes = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ method: 'eth_blockNumber', params: [], id: 1, jsonrpc: '2.0' })
            });
            const testData = await testRes.json();
            if (testData.result) {
                const currentBlock = parseInt(testData.result, 16);
                console.log(`[Indexer] Fetch OK: block ${currentBlock}`);
                const provider = new ethers.providers.JsonRpcProvider(rpcUrl, network);
                console.log('[Indexer] ✅ Provider created');
                return { provider, currentBlock };

            } else {
                console.warn(`[Indexer] RPC error: ${JSON.stringify(testData.error)}`);
            }
        } catch (e) {
            console.warn(`[Indexer] RPC failed: ${e.message.slice(0, 60)}`);
        }


        // Fallback aux autres RPCs configurés
        for (const fallbackRpcUrl of this.rpcUrls) {
            if (fallbackRpcUrl === rpcUrl) continue; // Déjà essayé
            try {
                console.log(`[Indexer] Trying fallback RPC: ${rpcUrl.slice(0, 35)}...`);
                const testRes = await fetch(rpcUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ method: 'eth_blockNumber', params: [], id: 1, jsonrpc: '2.0' })
                });
                const testData = await testRes.json();
                if (testData.result) {
                    const currentBlock = parseInt(testData.result, 16);
                    const provider = new ethers.providers.JsonRpcProvider(rpcUrl, network);
                    console.log(`[Indexer] ✅ Fallback connected: block ${currentBlock}`);
                    return { provider, currentBlock };
                }
            } catch (e) {
                console.warn(`[Indexer] RPC failed: ${e.message.slice(0, 40)}`)
            }
        }


        throw new Error('Aucun RPC disponible');
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
      * Effectuer la synchronisation complète jusqu'à être à jour (Mode Serverless / Cron)
      * TIMEOUT : 10 secondes max pour éviter le timeout Vercel
     */
    async syncNext() {
        const startTime = Date.now();
        const TIMEOUT_MS = 10000; // 10 secondes max
        const MAX_CAMPAIGNS_PER_RUN = 5; // Limiter le nombre de campagnes traitées par run

        console.log('[Indexer] ⏱️ Démarrage synchronisation...');
        try {
            const { provider, currentBlock } = await this.getProvider();
            console.log(`[Indexer] 📦 Block actuel: ${currentBlock}`);

            // Helper pour vérifier le timeout
            const isTimeout = () => (Date.now() - startTime) > TIMEOUT_MS;

            // Sync nouvelles campagnes (rapide)
            await this.syncNewCampaigns();
            if (isTimeout()) {
                console.log('[Indexer] ⏰ Timeout - arrêt propre');
                return { success: true, partial: true, reason: 'timeout' };
            }

            // Sync rounds et stats (limité)
            const allCampaigns = await campaigns.getAll();
            let processed = 0;
            for (const campaign of (allCampaigns || [])) {
                if (isTimeout() || processed >= MAX_CAMPAIGNS_PER_RUN) break;
                try {
                    await this.syncCampaignRounds(campaign.address);
                    const details = await this.fetchCampaignDetails(campaign.address);
                    if (details && Object.keys(details).length > 0) {
                        // Préserver les données existantes (nom, etc.) en fusionnant avec les nouvelles
                        await campaigns.upsert({
                            ...campaign,  // Préserver nom, description, etc.
                            ...details    // Mettre à jour raised, shares_sold, status, etc.
                        });
                    }
                    processed++;
                } catch (e) {
                    console.warn(`[Indexer] ⚠️ Erreur campagne ${campaign.address.slice(0, 8)}:`, e.message);
                }
            }
            console.log(`[Indexer] ✅ ${processed}/${allCampaigns?.length || 0} campagnes traitées`);

            console.log(`[Indexer] ✅ Sync terminée - Block ${currentBlock}`);
            return { success: true, block: currentBlock, processed };

        } catch (error) {
            console.error('[Indexer] ❌ Erreur passage sync:', error.message);
            throw error;
        }
    }

    async syncLoop() {
        while (this.isIndexing) {
            try {
                await this.syncNewCampaigns();
                await this.syncAllRounds(); // Priorité aux statuts et détails globaux
                await this.syncAllTransactions(); // Les transactions peuvent être lentes/échouer sans bloquer le reste
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
            const lastSyncState = await syncState.get('campaigns');
            const dbLastBlock = lastSyncState?.last_block ?? 0;
            // PROTECTION: Toujours utiliser le MAX pour ignorer les valeurs obsolètes de Vercel
            const effectiveLastBlock = Math.max(dbLastBlock, startBlock);
            const { provider, currentBlock } = await this.getProvider();
            let fromBlock = effectiveLastBlock + 1;


            if (fromBlock >= currentBlock) {
                console.log('[Indexer] ✅ À jour, pas de nouveau bloc');
                return;
            }

            const MAX_RANGE = 999; // Limite RPC Coinbase = 1000 blocs max
            const toBlock = Math.min(fromBlock + MAX_RANGE, currentBlock);

            if (fromBlock > toBlock) return;

            console.log(`[Indexer] 🆕 Scan ${fromBlock} -> ${toBlock} (${toBlock - fromBlock + 1} blocs)`);

            // Topic pour CampaignCreated(address,address,string,uint256)
            const eventTopic = '0x011e52f88446cffe402f824c74be32fb23411b1333a3d5df3b2b25c94d065026';

            const logs = await this.rpcCall('eth_getLogs', [{
                address: this.divarAddress,
                topics: [eventTopic],
                fromBlock: '0x' + fromBlock.toString(16),
                toBlock: '0x' + toBlock.toString(16)
            }]);

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
     * Récupérer les détails techniques d'une campagne via son contrat (via fetch natif)
     */
    async fetchCampaignDetails(address) {
        try {
            // Selectors de fonction (premiers 4 bytes du keccak256)
            const getCurrentRoundSelector = '0xa32bf597';
            const totalSharesIssuedSelector = '0xfab2cb36';
            const nameSelector = '0x06fdde03';
            const symbolSelector = '0x95d89b41';

            // Appeler getCurrentRound via eth_call
            const roundResult = await this.contractCall(address, getCurrentRoundSelector);

            // Décoder le résultat (8 x uint256 + 2 x bool = 8 x 32 bytes)
            const roundNumber = parseInt(roundResult.slice(2, 66), 16);
            const sharePrice = BigInt('0x' + roundResult.slice(66, 130)).toString();
            const targetAmount = BigInt('0x' + roundResult.slice(130, 194)).toString();
            const fundsRaised = BigInt('0x' + roundResult.slice(194, 258)).toString();
            const sharesSold = parseInt(roundResult.slice(258, 322), 16);
            const endTime = parseInt(roundResult.slice(322, 386), 16);
            const isActive = parseInt(roundResult.slice(386, 450), 16) === 1;
            const isFinalized = parseInt(roundResult.slice(450, 514), 16) === 1;

            // Appeler totalSharesIssued
            const totalSharesResult = await this.contractCall(address, totalSharesIssuedSelector);
            const totalShares = parseInt(totalSharesResult, 16);

            // Récupérer le nom et symbol depuis le contrat
            let name = null, symbol = null;
            try {
                const nameResult = await this.contractCall(address, nameSelector);
                // Décoder le string (offset 32 bytes + length 32 bytes + data)
                const nameLength = parseInt(nameResult.slice(66, 130), 16);
                name = Buffer.from(nameResult.slice(130, 130 + nameLength * 2), 'hex').toString('utf8');
            } catch (e) { /* ignore */ }
            try {
                const symbolResult = await this.contractCall(address, symbolSelector);
                const symbolLength = parseInt(symbolResult.slice(66, 130), 16);
                symbol = Buffer.from(symbolResult.slice(130, 130 + symbolLength * 2), 'hex').toString('utf8');
            } catch (e) { /* ignore */ }

            // Déterminer le statut
            let status = 'active';
            if (isFinalized) {
                status = 'finalized';
            } else if (!isActive) {
                status = 'ended';
            }

            return {
                name: name || undefined,
                symbol: symbol || undefined,
                current_round: roundNumber,
                total_shares: totalShares,
                shares_sold: sharesSold,
                goal: targetAmount,
                raised: fundsRaised,
                share_price: sharePrice,
                end_date: new Date(endTime * 1000),
                status,
                is_active: isActive,
                is_finalized: isFinalized
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
            const allCampaigns = await campaigns.getAll();
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
            const allCampaigns = await campaigns.getAll();
            if (!allCampaigns || allCampaigns.length === 0) return;

            for (const campaign of allCampaigns) {
                try {
                    await this.syncCampaignRounds(campaign.address);

                    // Mettre à jour les métriques globales de la campagne (status, raised, etc.)
                    const details = await this.fetchCampaignDetails(campaign.address);
                    if (details && Object.keys(details).length > 0) {
                        await campaigns.upsert({
                            ...campaign,
                            ...details
                        });
                        console.log(`[Indexer] ✅ Statut mis à jour pour ${campaign.address.slice(0, 10)}... : ${details.status}`);
                    }
                } catch (campaignError) {
                    console.error(`[Indexer] ❌ Erreur sync campagne ${campaign.address}:`, campaignError.message);
                }
            }
        } catch (error) {
            console.error('[Indexer] ❌ Erreur syncAllRounds:', error.message);
        }
    }

    /**
     * Synchroniser les rounds d'une campagne spécifique (via fetch natif)
     */
    async syncCampaignRounds(campaignAddress) {
        try {
            // Selector: currentRound() = 0x8a19c8bc
            const currentRoundResult = await this.contractCall(campaignAddress, '0x8a19c8bc');
            const currentRoundNumber = parseInt(currentRoundResult, 16);

            if (currentRoundNumber === 0) return;

            // Récupérer les données existantes pour comparer
            const existingRounds = await rounds.getByCampaign(campaignAddress);
            const roundsMap = {};
            (existingRounds || []).forEach(r => roundsMap[r.round_number] = r);

            for (let i = 1; i <= currentRoundNumber; i++) {
                // Selector: rounds(uint256) = 0x8c65c81f + param encodé
                const roundParam = i.toString(16).padStart(64, '0');
                const roundResult = await this.contractCall(campaignAddress, '0x8c65c81f' + roundParam);

                // Décoder le résultat du round
                const roundNumber = parseInt(roundResult.slice(2, 66), 16);
                const sharePrice = BigInt('0x' + roundResult.slice(66, 130)).toString();
                const targetAmount = BigInt('0x' + roundResult.slice(130, 194)).toString();
                const fundsRaised = BigInt('0x' + roundResult.slice(194, 258)).toString();
                const sharesSold = parseInt(roundResult.slice(258, 322), 16);
                const endTime = parseInt(roundResult.slice(322, 386), 16);
                const isActive = parseInt(roundResult.slice(386, 450), 16) === 1;
                const isFinalized = parseInt(roundResult.slice(450, 514), 16) === 1;

                // OPTIMISATION : Ne sauvegarder que si c'est nouveau ou si ça a changé
                const existing = roundsMap[i];
                const hasChanged = !existing ||
                    existing.funds_raised !== fundsRaised ||
                    existing.shares_sold !== sharesSold ||
                    existing.is_active !== isActive ||
                    existing.is_finalized !== isFinalized;

                if (hasChanged) {
                    await rounds.upsert({
                        campaign_address: campaignAddress.toLowerCase(),
                        round_number: roundNumber,
                        share_price: sharePrice,
                        target_amount: targetAmount,
                        funds_raised: fundsRaised,
                        shares_sold: sharesSold,
                        end_time: endTime,
                        is_active: isActive,
                        is_finalized: isFinalized
                    });
                    console.log(`[Indexer] 🔄 Round ${i} mis à jour pour ${campaignAddress.slice(0, 8)}`);
                }
            }
        } catch (error) {
            console.warn(`[Indexer] ⚠️ Erreur sync rounds ${campaignAddress}:`, error.message);
        }
    }


    /**
     * Synchroniser les transactions d'une campagne spécifique (via fetch natif)
     * OPTIMISÉ : Uniquement les nouvelles transactions
     */
    async syncCampaignTransactions(campaignAddress) {
        try {
            const syncId = `tx:${campaignAddress.toLowerCase()}`;
            const lastSync = await syncState.get(syncId) || { last_block: 0 };
            const { currentBlock } = await this.getProvider();
            const fromBlock = lastSync.last_block > 0 ? lastSync.last_block + 1 : currentBlock - 50000;

            if (fromBlock >= currentBlock) return;

            // Topic pour SharesPurchased(address indexed investor, uint256 shares, uint256 roundNumber)
            // keccak256("SharesPurchased(address,uint256,uint256)")
            const sharesPurchasedTopic = '0x630b54f21d1c5ae41c4633ad96e8c15ce15665365eded6a38476ffa71c8ace6c';

            // Scan in chunks of 999 blocks (RPC limit)
            let allLogs = [];
            const CHUNK_SIZE = 999;
            for (let start = fromBlock; start <= currentBlock; start += CHUNK_SIZE) {
                const end = Math.min(start + CHUNK_SIZE - 1, currentBlock);
                try {
                    console.log(`[Indexer] 🔎 Scan TXs ${campaignAddress.slice(0, 8)}: ${start} -> ${end}`);
                    const logs = await this.rpcCall('eth_getLogs', [{
                        address: campaignAddress,
                        topics: [sharesPurchasedTopic],
                        fromBlock: '0x' + start.toString(16),
                        toBlock: '0x' + end.toString(16)
                    }]);
                    if (logs && logs.length > 0) {
                        allLogs = allLogs.concat(logs);
                    }
                } catch (err) {
                    console.warn(`[Indexer] Chunk ${start}-${end} failed for ${campaignAddress.slice(0, 8)}:`, err.message);
                    break;
                }
            }

            if (allLogs.length === 0) {
                console.log(`[Indexer] ✅ Pas de nouvelles transactions pour ${campaignAddress.slice(0, 8)}`);
                await syncState.upsert(syncId, currentBlock);
                return;
            }

            console.log(`[Indexer] 💸 ${allLogs.length} nouvelles transactions pour ${campaignAddress.slice(0, 8)}`);

            // Récupérer le sharePrice via contractCall
            const roundResult = await this.contractCall(campaignAddress, '0xa32bf597'); // getCurrentRound()
            const sharePrice = BigInt('0x' + roundResult.slice(66, 130));

            for (const log of allLogs) {
                // Décoder les données du log
                // topics[1] = investor (indexed)
                // data = shares (uint256) + roundNumber (uint256)
                const investor = '0x' + log.topics[1].slice(26);
                const shares = parseInt(log.data.slice(2, 66), 16);
                const roundNumber = parseInt(log.data.slice(66, 130), 16);
                const amount = (sharePrice * BigInt(shares)).toString();

                await transactions.insert({
                    tx_hash: log.transactionHash,
                    campaign_address: campaignAddress.toLowerCase(),
                    investor: investor.toLowerCase(),
                    amount: amount,
                    shares: shares,
                    round_number: roundNumber,
                    type: 'purchase',
                    block_number: parseInt(log.blockNumber, 16),
                    timestamp: new Date(),
                    commission: "0",
                    net_amount: amount
                });

                console.log(`[Indexer] 💸 Tx ${log.transactionHash.slice(0, 10)} : ${shares} shares`);
            }

            // Mettre à jour l'état de synchronisation
            await syncState.upsert(syncId, currentBlock);

        } catch (error) {
            console.error(`[Indexer] ❌ Erreur sync transactions ${campaignAddress}:`, error.message);
        }
    }



    async syncAllFinance() {
        // Désactivé - pas encore implémenté
        return;
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
