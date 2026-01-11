/**
 * =============================================================================
 * GESTIONNAIRE API CENTRALISÉ (CLIENT) - LIVAR
 * =============================================================================
 * 
 * Gestionnaire centralisé des appels API et blockchain.
 * Compatible avec le navigateur (Client-side safe).
 * Communique avec le backend via les routes API de Next.js.
 * =============================================================================
 */

import { ethers } from 'ethers';
import config from '../config.js';
import DivarProxyABI from '../../ABI/DivarProxyABI.json';
import CampaignABI from '../../ABI/CampaignABI.json';
import { clientCache } from './client-cache.js';

// =============================================================================
// UTILITAIRES
// =============================================================================

const toStringSafe = (value, fallback = '0') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return value.toString();
  return fallback;
};

// Formater comme DexScreener: 0.0₅8453
const formatSmallNumber = (value) => {
  if (!value || value === '0' || value === 0) return '0';

  const num = parseFloat(value);

  // Valeurs normales
  if (num >= 0.01) return num.toFixed(4);
  if (num >= 0.0001) return num.toFixed(6); // Plus de précision

  // Format notation scientifique
  const str = num.toExponential();
  const [coefficient, exponent] = str.split('e');
  const exp = Math.abs(parseInt(exponent));

  // DexScreener format: 0.0₅8453
  const coef = parseFloat(coefficient).toFixed(4).replace(/\.?0+$/, '').replace('0.', '');
  const subscripts = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
  const expStr = (exp - 1).toString().split('').map(d => subscripts[parseInt(d)]).join('');

  return `0.0${expStr}${coef}`;
};

const parseBool = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no', ''].includes(normalized)) return false;
  }
  return fallback !== undefined ? fallback : Boolean(value);
};

const normalizeCampaignSummary = (summary) => {
  if (!summary) return null;

  const sharePrice = toStringSafe(summary.sharePrice ?? summary.share_price ?? '0');
  const goal = toStringSafe(summary.goal ?? '0');
  const raised = toStringSafe(summary.raised ?? '0');
  const sharesSold = toStringSafe(summary.sharesSold ?? summary.shares_sold ?? '0');
  const totalShares = toStringSafe(summary.totalShares ?? summary.total_shares ?? '0');
  const status = summary.status ?? null;
  const isActive = parseBool(summary.isActive ?? summary.is_active, status ? status === 'active' : undefined);
  const isFinalized = parseBool(summary.isFinalized ?? summary.is_finalized, status ? status === 'finalized' : undefined);
  const endDate = summary.endDate ?? summary.end_date ?? null;
  const goalNumber = parseFloat(goal) || 0;
  const raisedNumber = parseFloat(raised) || 0;
  const investors = Number.parseInt(summary.total_investors ?? summary.unique_investors ?? sharesSold, 10);
  const progress = goalNumber > 0 ? (raisedNumber / goalNumber) * 100 : 0;

  return {
    ...summary,
    address: summary.address,
    id: summary.address,
    name: summary.name,
    symbol: summary.symbol,
    goal,
    raised,
    sharePrice,
    share_price: sharePrice,
    sharesSold,
    totalShares,
    targetAmount: goal,
    fundsRaised: raised,
    status,
    isActive: isActive ?? false,
    isFinalized: isFinalized ?? false,
    endDate,
    end_date: endDate,
    progressPercentage: progress,
    progress,
    investorCount: investors,
    investors
  };
};

// =============================================================================
// CLASSE API MANAGER
// =============================================================================

class ApiManager {
  constructor() {
    this.abis = {};
    this.contractAddresses = config.contracts;
    this.isInitialized = false;
  }

  async initWeb3() {
    if (this.isInitialized) return;
    this.isInitialized = true;
  }

  // Invalider le cache client
  invalidateCache(key) {
    if (!key) {
      console.log('[API Manager] Invalidation de tout le cache client');
      clientCache.clear();
      return;
    }

    // Invalider intelligemment selon la clé
    if (key.includes('campaign') || key.includes('api_campaign')) {
      clientCache.clear(); // Plus simple de tout vider pour l'instant
    }

    console.log(`[API Manager] Cache client invalidé pour: ${key}`);
  }

  // Placeholder pour le préchargement
  preloadCampaignDetails(address) {
    // Peut être implémenté plus tard si nécessaire
  }

  async loadABIs() {
    if (Object.keys(this.abis).length > 0) return;

    this.abis = {
      DivarProxy: DivarProxyABI.abi,
      Campaign: CampaignABI.abi
    };

    console.log('[ApiManager] ✅ ABIs depuis /ABI/');
  }

  // =============================================================================
  // APPELS API (DONNÉES POSTGRESQL + REDIS)
  // =============================================================================

  /**
   * Récupérer toutes les campagnes - BLOCKCHAIN D'ABORD (DYNAMIQUE)
   */
  async getAllCampaigns(filters = {}) {
    try {
      // 1. Essayer la blockchain d'abord (dynamique)
      await this.loadABIs();

      if (typeof window !== 'undefined' && window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const divarAddress = this.contractAddresses.DivarProxy;

        if (divarAddress) {
          try {
            const contract = new ethers.Contract(divarAddress, this.abis.DivarProxy, provider);
            const addresses = await contract.getAllCampaigns();

            // Dédupliquer les adresses
            const uniqueAddresses = [...new Set(addresses.map(a => a.toLowerCase()))];

            console.log(`[ApiManager] 🔄 ${uniqueAddresses.length} campagnes depuis blockchain`);

            // 2. Récupérer les détails en parallèle (sans cache pour être dynamique)
            const campaignPromises = uniqueAddresses.map(address =>
              this.getCampaignDataDirect(address).catch(() => {
                // Silencieux - les anciennes campagnes incompatibles sont filtrées
                return null;
              })
            );

            const results = await Promise.allSettled(campaignPromises);
            const allCampaigns = results
              .filter(result => result.status === 'fulfilled' && result.value)
              .map(result => result.value);

            // Dédupliquer par adresse (en cas de double récupération)
            const seen = new Set();
            const blockchainCampaigns = allCampaigns.filter(campaign => {
              const addr = campaign.address?.toLowerCase();
              if (seen.has(addr)) return false;
              seen.add(addr);
              return true;
            });

            console.log(`[ApiManager] ✅ ${blockchainCampaigns.length} campagnes uniques (sur ${allCampaigns.length} récupérées)`);

            // 3. Compléter avec Supabase si besoin
            if (blockchainCampaigns.length === 0) {
              const params = new URLSearchParams(filters);
              const res = await fetch(`/api/campaigns?${params.toString()}`);
              const data = await res.json();
              const supabaseCampaigns = data.campaigns?.map(normalizeCampaignSummary) || [];

              if (supabaseCampaigns.length > 0) {
                console.log(`[ApiManager] ✅ ${supabaseCampaigns.length} campagnes depuis Supabase`);
                if (!filters.creator) {
                  clientCache.setCampaigns(supabaseCampaigns);
                }
                return supabaseCampaigns;
              }
            } else {
              // Mettre en cache les résultats blockchain
              if (!filters.creator) {
                clientCache.setCampaigns(blockchainCampaigns);
              }
            }

            // 4. Filtrer par créateur si demandé
            if (filters.creator) {
              const creatorLower = filters.creator.toLowerCase();
              const filtered = blockchainCampaigns.filter(c => c.creator?.toLowerCase() === creatorLower);
              console.log(`[ApiManager] Filtré: ${filtered.length} campagnes pour ${creatorLower}`);
              return filtered;
            }

            return blockchainCampaigns;
          } catch (blockchainError) {
            console.warn('[ApiManager] Erreur blockchain, fallback Supabase:', blockchainError.message);
          }
        }
      }

      // 5. Fallback Supabase si blockchain indisponible
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/campaigns?${params.toString()}`);
      const data = await res.json();
      const supabaseCampaigns = data.campaigns?.map(normalizeCampaignSummary) || [];

      if (supabaseCampaigns.length > 0) {
        if (!filters.creator) {
          clientCache.setCampaigns(supabaseCampaigns);
        }
        console.log(`[ApiManager] ✅ ${supabaseCampaigns.length} campagnes depuis Supabase`);
        return supabaseCampaigns;
      }

      return [];
    } catch (error) {
      console.error('[ApiManager] getAllCampaigns error:', error);

      // Dernier recours : cache client même expiré
      const oldCache = clientCache.getCampaigns(24 * 60 * 60 * 1000); // 24h
      if (oldCache) {
        console.log('[ApiManager] ⚠️ Cache expiré utilisé comme fallback');
        return oldCache;
      }

      return [];
    }
  }

  /**
   * Récupérer les détails d'une campagne DIRECTEMENT depuis la blockchain (SANS CACHE)
   */
  async getCampaignDataDirect(address) {
    if (!address || typeof address !== 'string') return null;

    try {
      await this.loadABIs();

      if (typeof window !== 'undefined' && window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const campaignContract = new ethers.Contract(address, this.abis.Campaign, provider);
        const divarContract = new ethers.Contract(this.contractAddresses.DivarProxy, this.abis.DivarProxy, provider);

        // Lire les infos depuis DivarProxy
        const info = await divarContract.getCampaignRegistry(address);

        // Validation stricte: ignorer les campagnes sans nom valide
        if (!info || !info.name || info.name.trim() === '') {
          console.log(`[ApiManager] Campagne ${address.slice(0, 8)} ignorée (pas de nom valide)`);
          return null;
        }

        // Lire le round actuel depuis le contrat Campaign
        const roundData = await campaignContract.getCurrentRound();
        const totalShares = await campaignContract.totalSharesIssued();

        const sharePriceEth = ethers.utils.formatEther(roundData.sharePrice);
        const raisedEth = ethers.utils.formatEther(roundData.fundsRaised);
        const goalEth = ethers.utils.formatEther(roundData.targetAmount);

        // Parser le metadata si c'est un JSON stringifié
        let parsedMetadata = {};
        try {
          if (info.metadata && typeof info.metadata === 'string' && info.metadata.startsWith('{')) {
            parsedMetadata = JSON.parse(info.metadata);
          }
        } catch (e) {
          // Silencieux - les anciennes campagnes ont souvent du texte brut ou des URLs IPFS
        }

        const normalized = normalizeCampaignSummary({
          address: address.toLowerCase(),
          creator: info.creator.toLowerCase(),
          name: info.name,
          category: info.category,
          logo: info.logo,
          metadata: info.metadata,
          description: parsedMetadata.description || '',
          ipfs: parsedMetadata,
          goal: goalEth,
          raised: raisedEth,
          share_price: formatSmallNumber(sharePriceEth),
          shares_sold: roundData.sharesSold.toString(),
          total_shares: totalShares.toString(),
          end_date: new Date(roundData.endTime.toNumber() * 1000).toISOString(),
          status: roundData.isFinalized ? 'finalized' : (roundData.isActive ? 'active' : 'ended'),
          current_round: roundData.roundNumber.toNumber()
        });

        console.log(`[ApiManager] Campagne ${address.slice(0, 8)} - créateur: ${info.creator.toLowerCase()}`);
        return normalized;
      }

      return null;
    } catch (error) {
      console.error(`[ApiManager] getCampaignDataDirect error for ${address}:`, error);
      return null;
    }
  }

  /**
   * Récupérer les détails d'une campagne - CACHE D'ABORD, BLOCKCHAIN SI NÉCESSAIRE
   */
  async getCampaignData(address, forceFresh = false) {
    if (!address || typeof address !== 'string') return null;

    try {
      // 1. Vérifier le cache client (sauf si forceFresh)
      if (!forceFresh) {
        const cached = clientCache.getCampaign(address);
        if (cached) {
          console.log(`[ApiManager] ✅ Campagne ${address.slice(0, 8)} depuis cache`);
          return cached;
        }
      }

      // 2. Essayer Supabase d'abord
      try {
        const res = await fetch(`/api/campaigns/${address.toLowerCase()}`);
        const data = await res.json();
        if (data.campaign) {
          const normalized = normalizeCampaignSummary(data.campaign);
          clientCache.setCampaign(address, normalized);
          console.log(`[ApiManager] ✅ Campagne ${address.slice(0, 8)} depuis Supabase`);
          return normalized;
        }
      } catch (supabaseError) {
        console.warn(`[ApiManager] Supabase erreur pour ${address}:`, supabaseError.message);
      }

      // 3. Lire depuis la blockchain (uniquement si nécessaire)
      return await this.getCampaignDataDirect(address);
    } catch (error) {
      console.error(`[ApiManager] getCampaignData error for ${address}:`, error);

      // Fallback : cache même expiré
      const oldCache = clientCache.getCampaign(address, 24 * 60 * 60 * 1000); // 24h
      if (oldCache && !forceFresh) {
        console.log(`[ApiManager] ⚠️ Cache expiré utilisé pour ${address}`);
        return oldCache;
      }

      return null;
    }
  }

  /**
   * Alias pour getCampaignData (compatibilité)
   */
  async getCampaignSummary(address, options = {}) {
    return this.getCampaignData(address, options.forceFresh || false);
  }

  /**
   * Sauvegarder ou mettre à jour une campagne dans PostgreSQL (via API)
   */
  async upsertCampaign(campaignData) {
    try {
      const res = await fetch('/api/campaigns/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData)
      });
      return await res.json();
    } catch (error) {
      console.error('[ApiManager] upsertCampaign error:', error);
      throw error;
    }
  }

  /**
   * Récupérer les transactions d'une campagne - CACHE D'ABORD
   */
  async getCampaignTransactions(address) {
    if (!address) return [];

    try {
      // 1. Vérifier le cache client
      const cached = clientCache.getTransactions(address);
      if (cached) {
        console.log(`[ApiManager] ✅ Transactions ${address.slice(0, 8)} depuis cache`);
        return cached;
      }

      // 2. Récupérer depuis API
      const res = await fetch(`/api/campaigns/${address.toLowerCase()}/transactions`);
      const data = await res.json();
      const transactions = data.transactions || [];

      // 3. Mettre en cache client
      clientCache.setTransactions(address, transactions);

      console.log(`[ApiManager] 🔄 Transactions ${address.slice(0, 8)} depuis API`);
      return transactions;
    } catch (error) {
      console.error(`[ApiManager] getCampaignTransactions error for ${address}:`, error);

      // Fallback : cache même expiré
      const oldCache = clientCache.getTransactions(address, 24 * 60 * 60 * 1000); // 24h
      return oldCache || [];
    }
  }

  /**
   * Récupérer les promotions actives - CACHE D'ABORD
   */
  async getActivePromotions(includeExpired = false) {
    try {
      // 1. Vérifier le cache client
      const cached = clientCache.getPromotions();
      if (cached && !includeExpired) {
        console.log('[ApiManager] ✅ Promotions depuis cache');
        return cached;
      }

      // 2. Récupérer depuis API
      const res = await fetch(`/api/promotions?includeExpired=${includeExpired}`);
      const data = await res.json();
      const promotions = data.promotions || [];

      // 3. Mettre en cache client (seulement les actives)
      if (!includeExpired) {
        clientCache.setPromotions(promotions);
      }

      console.log('[ApiManager] 🔄 Promotions depuis API');
      return promotions;
    } catch (error) {
      console.error('[ApiManager] getActivePromotions error:', error);

      // Fallback : cache même expiré
      const oldCache = clientCache.getPromotions();
      return oldCache || [];
    }
  }

  /**
   * Récupérer les documents d'une campagne (via API)
   */
  async getCampaignDocuments(address) {
    if (!address) return [];
    try {
      const res = await fetch(`/api/documents?address=${address.toLowerCase()}`);
      const data = await res.json();
      return data.documents || [];
    } catch (error) {
      console.error('[ApiManager] getCampaignDocuments error:', error);
      return [];
    }
  }

  /**
   * Ajouter un document (via API)
   */
  async addDocument(campaignAddress, url, name, category = 'other') {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignAddress, url, name, category })
      });
      return await res.json();
    } catch (error) {
      console.error('[ApiManager] addDocument error:', error);
      throw error;
    }
  }

  // =============================================================================
  // INTERACTIONS BLOCKCHAIN (DIRECT ETHERS)
  // =============================================================================

  async createCampaign(formData, signer) {
    await this.loadABIs();

    const divarAddress = this.contractAddresses.DivarProxy;
    if (!divarAddress) throw new Error('DivarProxy address not configured');

    const contract = new ethers.Contract(divarAddress, this.abis.DivarProxy, signer);

    const name = formData.projectName || formData.name;
    const symbol = formData.tokenSymbol || formData.symbol || name.substring(0, 4).toUpperCase();
    const targetAmount = ethers.utils.parseEther(formData.fundingGoal?.toString() || '0');
    const sharePrice = ethers.utils.parseEther(formData.sharePrice?.toString() || '0.01');
    const endTimestamp = Math.floor(new Date(formData.endDate).getTime() / 1000);

    // Paramètres requis par le contrat DivarProxy.createCampaign
    const category = formData.sector || 'Other';
    const metadata = formData.metadataUri || formData.description || '';
    const royaltyFee = formData.royaltyFee ? parseInt(formData.royaltyFee) : 0;
    const logo = formData.logoUrl || '';

    // Paramètres NFT customization
    const nftBackgroundColor = formData.nftCustomization?.backgroundColor || '#ffffff';
    const nftTextColor = formData.nftCustomization?.textColor || '#000000';
    const nftLogoUrl = formData.nftCustomization?.logoUrl || logo;
    const nftSector = category;

    const creationFee = await contract.getCampaignCreationFeeETH();

    const tx = await contract.createCampaign(
      name,                    // string _name
      symbol,                  // string _symbol
      targetAmount,            // uint256 _targetAmount
      sharePrice,              // uint256 _sharePrice
      endTimestamp,            // uint256 _endTime
      category,                // string _category
      metadata,                // string _metadata
      royaltyFee,              // uint96 _royaltyFee
      logo,                    // string _logo
      nftBackgroundColor,      // string _nftBackgroundColor
      nftTextColor,            // string _nftTextColor
      nftLogoUrl,              // string _nftLogoUrl
      nftSector,               // string _nftSector
      { value: creationFee }
    );

    const receipt = await tx.wait();

    console.log('[CreateCampaign] Receipt:', receipt);
    console.log('[CreateCampaign] Events:', receipt.events);

    // Récupérer l'adresse de la campagne depuis les events (v5 style)
    const event = receipt.events?.find(e => e.event === 'CampaignCreated');
    console.log('[CreateCampaign] CampaignCreated event:', event);

    let campaignAddress = event?.args?.campaignAddress || event?.args?.[0] || '';

    // Ethers v5: Parfois les args indexés sont dans un tableau
    if (!campaignAddress && event?.args && Array.isArray(event.args)) {
      campaignAddress = event.args[0];
    }

    console.log('[CreateCampaign] Campaign address extracted:', campaignAddress);

    if (campaignAddress) {
      // Gérer le cas "Autre" pour le secteur
      const finalCategory = formData.sector === 'Autre' ? (formData.otherSector || category) : category;

      await this.upsertCampaign({
        address: campaignAddress.toLowerCase(),
        creator: (await signer.getAddress()).toLowerCase(),
        name,
        symbol,
        category: finalCategory,
        goal: targetAmount.toString(),
        share_price: sharePrice.toString(),
        total_shares: String(formData.totalShares || formData.numberOfShares || 0),
        end_date: new Date(formData.endDate),
        status: 'active',
        // Valeurs par défaut pour une nouvelle campagne
        raised: '0',
        shares_sold: '0',
        is_active: true,
        is_finalized: false,
        current_round: 1,
        // Description et extras (pas stockés on-chain)
        description: formData.description || '',
        metadata_uri: JSON.stringify({
          socials: formData.socials || {},
          team: formData.teamMembers || [],
          royaltyFee: formData.royaltyFee || '0',
          royaltyReceiver: formData.royaltyReceiver || ''
        }),
        logo,
        // NFT customization
        nft_background_color: nftBackgroundColor,
        nft_text_color: nftTextColor,
        nft_logo_url: nftLogoUrl,
        nft_sector: nftSector
      });

      // Invalider le cache
      clientCache.clear();

      return { success: true, address: campaignAddress, txHash: tx.hash };
    }

    console.error('[CreateCampaign] No campaign address found in events');
    return { success: false, error: 'Campaign address not found in transaction receipt', txHash: tx.hash };
  }

  // =============================================================================
  // FONCTIONS UTILISATEUR
  // =============================================================================

  /**
   * Recuperer les investissements d'un utilisateur depuis la DB
   * Retourne un tableau d'objets avec les transactions groupees par campagne
   */
  async getUserInvestments(userAddress) {
    if (!userAddress) return [];
    try {
      const res = await fetch(`/api/investments?address=${userAddress.toLowerCase()}`);
      const data = await res.json();
      return data.investments || [];
    } catch (error) {
      console.error('[ApiManager] getUserInvestments error:', error);
      return [];
    }
  }

  /**
   * Formater une valeur ETH (wei -> ETH lisible)
   */
  formatEthValue(value) {
    if (!value) return '0';
    try {
      // Si c'est deja un string avec decimales
      if (typeof value === 'string' && value.includes('.')) {
        return parseFloat(value).toFixed(4);
      }
      // Si c'est en wei (grand nombre)
      const numValue = BigInt(value.toString());
      const ethValue = Number(numValue) / 1e18;
      return ethValue.toFixed(4);
    } catch {
      return '0';
    }
  }

  /**
   * Vider le cache cote serveur via API
   */
  clearCache() {
    // Invalider le cache navigateur en forcant un reload des donnees
    console.log('[ApiManager] Cache invalidation requested');
    clientCache.clear();
  }

  /**
   * Obtenir les stats du cache
   */
  getCacheStats() {
    return clientCache.getStats();
  }

  // =============================================================================
  // FONCTIONS CAMPAGNE (BLOCKCHAIN)
  // =============================================================================

  /**
   * Récupérer les investisseurs d'une campagne depuis Supabase
   */
  async getCampaignInvestors(campaignAddress) {
    if (!campaignAddress) return [];
    try {
      const res = await fetch(`/api/investors?campaign=${campaignAddress.toLowerCase()}`);
      const data = await res.json();
      return data.investors || [];
    } catch (error) {
      console.error('[ApiManager] getCampaignInvestors error:', error);
      return [];
    }
  }

  /**
   * Distribuer des dividendes aux détenteurs de NFT
   * @param {string} campaignAddress - Adresse du contrat Campaign
   * @param {string} amount - Montant en ETH à distribuer
   * @param {object} signer - Signer ethers.js
   */
  async distributeDividends(campaignAddress, amount, signer) {
    if (!signer) {
      throw new Error('Signer requis pour distribuer les dividendes');
    }
    await this.loadABIs();
    const contract = new ethers.Contract(campaignAddress, this.abis.Campaign, signer);
    const tx = await contract.distributeDividends({ value: ethers.utils.parseEther(amount) });
    const receipt = await tx.wait();
    console.log('[ApiManager] Dividendes distribués:', receipt.transactionHash);
    return receipt;
  }

  /**
   * Libérer l'escrow (fonds bloqués) vers le créateur
   * @param {string} campaignAddress - Adresse du contrat Campaign
   * @param {object} signer - Signer ethers.js
   */
  async claimEscrow(campaignAddress, signer) {
    if (!signer) {
      throw new Error('Signer requis pour libérer l\'escrow');
    }
    await this.loadABIs();
    const contract = new ethers.Contract(campaignAddress, this.abis.Campaign, signer);
    const tx = await contract.claimEscrow();
    const receipt = await tx.wait();
    console.log('[ApiManager] Escrow libéré:', receipt.transactionHash);
    return receipt;
  }

  /**
   * Démarrer un nouveau round de financement
   * @param {string} campaignAddress - Adresse du contrat Campaign
   * @param {string} targetAmount - Objectif en ETH
   * @param {string} sharePrice - Prix par share en ETH
   * @param {number} duration - Durée en secondes
   * @param {object} signer - Signer ethers.js
   */
  async startNewRound(campaignAddress, targetAmount, sharePrice, duration, signer) {
    if (!signer) {
      throw new Error('Signer requis pour démarrer un nouveau round');
    }
    await this.loadABIs();
    const contract = new ethers.Contract(campaignAddress, this.abis.Campaign, signer);
    const tx = await contract.startNewRound(
      ethers.utils.parseEther(targetAmount),
      ethers.utils.parseEther(sharePrice),
      duration
    );
    const receipt = await tx.wait();
    console.log('[ApiManager] Nouveau round démarré:', receipt.transactionHash);
    return receipt;
  }

  /**
   * Promouvoir une campagne via RecPromotionManager
   * @param {string} campaignAddress - Adresse de la campagne
   * @param {number} boostType - 0=Featured, 1=Trending, 2=Spotlight
   * @param {object} signer - Signer ethers.js
   */
  async promoteCampaign(campaignAddress, boostType, signer) {
    if (!signer) {
      throw new Error('Signer requis pour promouvoir la campagne');
    }
    await this.loadABIs();
    const promotionAddress = this.contractAddresses.RecPromotionManager;
    if (!promotionAddress) {
      throw new Error('Adresse RecPromotionManager non configurée');
    }
    const contract = new ethers.Contract(promotionAddress, this.abis.RecPromotionManager, signer);

    // Récupérer le prix en ETH pour ce type de boost
    const priceInWei = await contract.getBoostPriceInETH(boostType);
    console.log('[ApiManager] Prix promotion:', ethers.utils.formatEther(priceInWei), 'ETH');

    const tx = await contract.promoteCampaign(campaignAddress, boostType, { value: priceInWei });
    const receipt = await tx.wait();
    console.log('[ApiManager] Campagne promue:', receipt.transactionHash);
    return receipt;
  }
}

export const apiManager = new ApiManager();
export default apiManager;