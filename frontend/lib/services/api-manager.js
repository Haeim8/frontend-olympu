/**
 * =============================================================================
 * GESTIONNAIRE API CENTRALISÉ (CLIENT) - LIVAR
 * =============================================================================
 *
 * Gestionnaire centralisé des appels API et blockchain.
 * Compatible avec le navigateur (Client-side safe).
 * BLOCKCHAIN = SOURCE DE VÉRITÉ. Supabase = cache synchronisé.
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
  if (num >= 0.0001) return num.toFixed(6);

  // Format notation scientifique
  const str = num.toExponential();
  const [coefficient, exponent] = str.split('e');
  const exp = Math.abs(parseInt(exponent));

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

  // Parser les métadonnées pour récupérer Socials/Team/Sector
  let ipfs = summary.ipfs || {};
  if (summary.metadata_uri && (!summary.ipfs || Object.keys(summary.ipfs).length === 0)) {
    try {
      if (summary.metadata_uri.startsWith('{')) {
        ipfs = JSON.parse(summary.metadata_uri);
      }
    } catch (e) {
      console.warn('[ApiManager] Erreur parsing metadata_uri:', e.message);
    }
  }

  return {
    ...summary,
    address: summary.address,
    id: summary.address,
    name: summary.name,
    symbol: summary.symbol,
    description: summary.description || ipfs.description || '',
    ipfs,
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

  /**
   * Obtenir un provider - wallet si disponible, sinon RPC public
   */
  getProvider() {
    if (typeof window !== 'undefined' && window.ethereum) {
      return new ethers.providers.Web3Provider(window.ethereum);
    }
    // Fallback: RPC public pour lire la blockchain sans wallet
    const rpcUrl = config.helpers.getPrimaryRPC();
    return new ethers.providers.JsonRpcProvider(rpcUrl);
  }

  // Invalider le cache client
  invalidateCache(key) {
    if (!key) {
      console.log('[API Manager] Invalidation de tout le cache client');
      clientCache.clear();
      return;
    }

    if (key.includes('campaign') || key.includes('api_campaign')) {
      clientCache.clear();
    }

    console.log(`[API Manager] Cache client invalidé pour: ${key}`);
  }

  // Placeholder pour le préchargement
  preloadCampaignDetails() {
    // Peut être implémenté plus tard si nécessaire
  }

  async loadABIs() {
    if (Object.keys(this.abis).length > 0) return;

    this.abis = {
      DivarProxy: DivarProxyABI.abi,
      Campaign: CampaignABI.abi
    };

    console.log('[ApiManager] ABIs chargés');
  }

  // =============================================================================
  // SYNCHRONISATION BLOCKCHAIN → SUPABASE
  // =============================================================================

  /**
   * @dev Investir dans une campagne (acheter des parts)
   * @param {string} campaignAddress Adresse du contrat de campagne
   * @param {number} shareCount Nombre de parts à acheter
   * @param {object} signer Signer ethers.js
   */
  async buyShares(campaignAddress, shareCount, signer) {
    console.log(`[ApiManager] Achat de ${shareCount} parts pour ${campaignAddress}...`);
    try {
      const campaignContract = new ethers.Contract(campaignAddress, CampaignABI, signer);
      const roundData = await campaignContract.rounds(await campaignContract.currentRound());
      const totalPrice = roundData.sharePrice.mul(shareCount);

      console.log(`[ApiManager] Envoi de la transaction: ${ethers.utils.formatEther(totalPrice)} ETH`);
      const tx = await campaignContract.buyShares(shareCount, {
        value: totalPrice,
        gasLimit: 300000 // Sécurité
      });

      console.log(`[ApiManager] Transaction envoyée: ${tx.hash}. Attente de confirmation...`);
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        console.log(`[ApiManager] Transaction confirmée !`);
        // Déclencher une sync vers Supabase (optionnel car l'indexeur devrait le faire,
        // mais bien pour l'immédiateté)
        this.syncToSupabase(campaignAddress);
        return { success: true, txHash: tx.hash };
      } else {
        throw new Error("La transaction a échoué on-chain");
      }
    } catch (error) {
      console.error('[ApiManager] Erreur buyShares:', error);
      throw error;
    }
  }

  /**
   * Synchroniser une campagne vers Supabase (fire and forget)
   */
  async syncToSupabase(campaignData) {
    if (!campaignData?.address || !campaignData?.name) return;

    // Générer un symbol par défaut si absent
    const symbol = campaignData.symbol || campaignData.name.substring(0, 4).toUpperCase();

    try {
      await fetch('/api/campaigns/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: campaignData.address,
          creator: campaignData.creator,
          name: campaignData.name,
          symbol: symbol,
          category: campaignData.category || 'Other',
          logo: campaignData.logo || '',
          goal: campaignData.goal || '0',
          raised: campaignData.raised || '0',
          share_price: campaignData.sharePrice || campaignData.share_price || '0',
          shares_sold: campaignData.sharesSold || campaignData.shares_sold || '0',
          total_shares: campaignData.totalShares || campaignData.total_shares || '0',
          end_date: campaignData.endDate || campaignData.end_date,
          status: campaignData.status || 'active',
          is_active: campaignData.isActive ?? true,
          is_finalized: campaignData.isFinalized ?? false,
          current_round: campaignData.current_round || 1,
          current_round_data: campaignData.current_round_data || {
            round_number: campaignData.current_round || 1,
            share_price: campaignData.sharePrice || campaignData.share_price || '0',
            target_amount: campaignData.goal || '0',
            funds_raised: campaignData.raised || '0',
            shares_sold: campaignData.sharesSold || campaignData.shares_sold || '0',
            end_time: campaignData.endDate || campaignData.end_date,
            is_active: campaignData.isActive ?? true,
            is_finalized: campaignData.isFinalized ?? false
          }
        })
      });
      console.log(`[ApiManager] Supabase sync: ${campaignData.address.slice(0, 8)}`);
    } catch (error) {
      console.warn(`[ApiManager] Supabase sync failed:`, error.message);
    }
  }

  // =============================================================================
  // LECTURE CAMPAGNES - BLOCKCHAIN D'ABORD, TOUJOURS
  // =============================================================================

  /**
   * Récupérer toutes les campagnes - BLOCKCHAIN = SOURCE DE VÉRITÉ
   */
  async getAllCampaigns(filters = {}) {
    try {
      await this.loadABIs();

      const provider = this.getProvider();
      const divarAddress = this.contractAddresses.DivarProxy;

      if (!divarAddress) {
        console.error('[ApiManager] DivarProxy address not configured');
        return [];
      }

      try {
        const contract = new ethers.Contract(divarAddress, this.abis.DivarProxy, provider);
        const addresses = await contract.getAllCampaigns();

        // Dédupliquer les adresses
        const uniqueAddresses = [...new Set(addresses.map(a => a.toLowerCase()))];
        console.log(`[ApiManager] ${uniqueAddresses.length} campagnes depuis blockchain`);

        // Récupérer les détails en parallèle
        const campaignPromises = uniqueAddresses.map(address =>
          this.getCampaignDataDirect(address).catch(() => null)
        );

        const results = await Promise.allSettled(campaignPromises);
        const allCampaigns = results
          .filter(result => result.status === 'fulfilled' && result.value)
          .map(result => result.value);

        // Dédupliquer par adresse
        const seen = new Set();
        const blockchainCampaigns = allCampaigns.filter(campaign => {
          const addr = campaign.address?.toLowerCase();
          if (seen.has(addr)) return false;
          seen.add(addr);
          return true;
        });

        console.log(`[ApiManager] ${blockchainCampaigns.length} campagnes valides`);

        // Mettre en cache
        if (!filters.creator) {
          clientCache.setCampaigns(blockchainCampaigns);
        }

        // Filtrer par créateur si demandé
        if (filters.creator) {
          const creatorLower = filters.creator.toLowerCase();
          const filtered = blockchainCampaigns.filter(c => c.creator?.toLowerCase() === creatorLower);
          console.log(`[ApiManager] Filtré: ${filtered.length} campagnes pour ${creatorLower}`);
          return filtered;
        }

        return blockchainCampaigns;

      } catch (blockchainError) {
        console.error('[ApiManager] Erreur blockchain:', blockchainError.message);

        // Fallback: cache client
        const cached = clientCache.getCampaigns(24 * 60 * 60 * 1000);
        if (cached) {
          console.log('[ApiManager] Fallback: cache client');
          return cached;
        }

        return [];
      }

    } catch (error) {
      console.error('[ApiManager] getAllCampaigns error:', error);
      return [];
    }
  }

  /**
   * Récupérer les détails d'une campagne DIRECTEMENT depuis la blockchain
   */
  async getCampaignDataDirect(address) {
    if (!address || typeof address !== 'string') return null;

    try {
      await this.loadABIs();

      const provider = this.getProvider();
      const campaignContract = new ethers.Contract(address, this.abis.Campaign, provider);
      const divarContract = new ethers.Contract(this.contractAddresses.DivarProxy, this.abis.DivarProxy, provider);

      // Lire les infos depuis DivarProxy
      const info = await divarContract.getCampaignRegistry(address);

      // Validation: ignorer les campagnes sans nom valide
      if (!info || !info.name || info.name.trim() === '') {
        console.log(`[ApiManager] Campagne ${address.slice(0, 8)} ignorée (pas de nom)`);
        return null;
      }

      // Lire le round actuel et le symbol depuis le contrat Campaign
      const [roundData, totalShares, symbol] = await Promise.all([
        campaignContract.getCurrentRound(),
        campaignContract.totalSharesIssued(),
        campaignContract.symbol().catch(() => info.name.substring(0, 4).toUpperCase())
      ]);

      const sharePriceEth = ethers.utils.formatEther(roundData.sharePrice);
      const raisedEth = ethers.utils.formatEther(roundData.fundsRaised);
      const goalEth = ethers.utils.formatEther(roundData.targetAmount);

      // Parser le metadata si c'est un JSON
      let parsedMetadata = {};
      try {
        if (info.metadata && typeof info.metadata === 'string' && info.metadata.startsWith('{')) {
          parsedMetadata = JSON.parse(info.metadata);
        }
      } catch (e) {
        // Silencieux
      }

      const normalized = normalizeCampaignSummary({
        address: address.toLowerCase(),
        creator: info.creator.toLowerCase(),
        name: info.name,
        symbol: symbol || info.name.substring(0, 4).toUpperCase(),
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
        isActive: roundData.isActive,
        isFinalized: roundData.isFinalized,
        current_round: roundData.roundNumber.toNumber()
      });

      // SYNCHRONISER VERS SUPABASE (fire and forget)
      this.syncToSupabase(normalized).catch(() => { });

      return normalized;

    } catch (error) {
      console.error(`[ApiManager] getCampaignDataDirect error for ${address}:`, error.message);
      return null;
    }
  }

  /**
   * Récupérer les détails d'une campagne - BLOCKCHAIN D'ABORD
   */
  async getCampaignData(address, forceFresh = false) {
    if (!address || typeof address !== 'string') return null;

    try {
      // 1. Cache client (sauf si forceFresh)
      if (!forceFresh) {
        const cached = clientCache.getCampaign(address);
        if (cached) {
          console.log(`[ApiManager] Campagne ${address.slice(0, 8)} depuis cache`);
          return cached;
        }
      }

      // 2. BLOCKCHAIN D'ABORD
      const blockchainData = await this.getCampaignDataDirect(address);
      if (blockchainData) {
        clientCache.setCampaign(address, blockchainData);
        return blockchainData;
      }

      // 3. Fallback Supabase si blockchain échoue
      try {
        const res = await fetch(`/api/campaigns/${address.toLowerCase()}`);
        const data = await res.json();
        if (data.campaign) {
          const normalized = normalizeCampaignSummary(data.campaign);
          clientCache.setCampaign(address, normalized);
          console.log(`[ApiManager] Campagne ${address.slice(0, 8)} depuis Supabase (fallback)`);
          return normalized;
        }
      } catch (supabaseError) {
        console.warn(`[ApiManager] Supabase erreur:`, supabaseError.message);
      }

      return null;

    } catch (error) {
      console.error(`[ApiManager] getCampaignData error:`, error);
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
   * Sauvegarder ou mettre à jour une campagne dans Supabase (via API)
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
   * Récupérer les transactions d'une campagne
   */
  async getCampaignTransactions(address) {
    if (!address) return [];

    try {
      const cached = clientCache.getTransactions(address);
      if (cached) {
        return cached;
      }

      const res = await fetch(`/api/campaigns/${address.toLowerCase()}/transactions`);
      const data = await res.json();
      const transactions = data.transactions || [];

      clientCache.setTransactions(address, transactions);
      return transactions;

    } catch (error) {
      console.error(`[ApiManager] getCampaignTransactions error:`, error);
      return [];
    }
  }

  /**
   * Récupérer les promotions actives
   */
  async getActivePromotions(includeExpired = false) {
    try {
      const cached = clientCache.getPromotions();
      if (cached && !includeExpired) {
        return cached;
      }

      const res = await fetch(`/api/promotions?includeExpired=${includeExpired}`);
      const data = await res.json();
      const promotions = data.promotions || [];

      if (!includeExpired) {
        clientCache.setPromotions(promotions);
      }

      return promotions;

    } catch (error) {
      console.error('[ApiManager] getActivePromotions error:', error);
      return [];
    }
  }

  /**
   * Récupérer les documents d'une campagne
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
   * Ajouter un document
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
  // INTERACTIONS BLOCKCHAIN (ÉCRITURE)
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

    const category = formData.sector || 'Other';
    const metadata = formData.metadataUri || formData.description || '';
    const royaltyFee = formData.royaltyFee ? parseInt(formData.royaltyFee) : 0;
    const logo = formData.logoUrl || '';

    const nftBackgroundColor = formData.nftCustomization?.backgroundColor || '#ffffff';
    const nftTextColor = formData.nftCustomization?.textColor || '#000000';
    const nftLogoUrl = formData.nftCustomization?.logoUrl || logo;
    const nftSector = category;

    const creationFee = await contract.getCampaignCreationFeeETH();

    const tx = await contract.createCampaign(
      name, symbol, targetAmount, sharePrice, endTimestamp,
      category, metadata, royaltyFee, logo,
      nftBackgroundColor, nftTextColor, nftLogoUrl, nftSector,
      { value: creationFee }
    );

    const receipt = await tx.wait();

    const event = receipt.events?.find(e => e.event === 'CampaignCreated');
    let campaignAddress = event?.args?.campaignAddress || event?.args?.[0] || '';

    if (!campaignAddress && event?.args && Array.isArray(event.args)) {
      campaignAddress = event.args[0];
    }

    if (campaignAddress) {
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
        raised: '0',
        shares_sold: '0',
        is_active: true,
        is_finalized: false,
        current_round: 1,
        description: formData.description || '',
        metadata_uri: JSON.stringify({
          socials: formData.socials || {},
          team: formData.teamMembers || [],
          royaltyFee: formData.royaltyFee || '0',
          royaltyReceiver: formData.royaltyReceiver || ''
        }),
        logo,
        nft_background_color: nftBackgroundColor,
        nft_text_color: nftTextColor,
        nft_logo_url: nftLogoUrl,
        nft_sector: nftSector
      });

      clientCache.clear();
      return { success: true, address: campaignAddress, txHash: tx.hash };
    }

    return { success: false, error: 'Campaign address not found in transaction receipt', txHash: tx.hash };
  }

  // =============================================================================
  // FONCTIONS UTILISATEUR
  // =============================================================================

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

  formatEthValue(value) {
    if (!value) return '0';
    try {
      if (typeof value === 'string' && value.includes('.')) {
        return parseFloat(value).toFixed(4);
      }
      const numValue = BigInt(value.toString());
      const ethValue = Number(numValue) / 1e18;
      return ethValue.toFixed(4);
    } catch {
      return '0';
    }
  }

  clearCache() {
    console.log('[ApiManager] Cache cleared');
    clientCache.clear();
  }

  getCacheStats() {
    return clientCache.getStats();
  }

  // =============================================================================
  // FONCTIONS CAMPAGNE (BLOCKCHAIN)
  // =============================================================================

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

  async distributeDividends(campaignAddress, amount, signer) {
    if (!signer) throw new Error('Signer requis');
    await this.loadABIs();
    const contract = new ethers.Contract(campaignAddress, this.abis.Campaign, signer);
    const tx = await contract.distributeDividends({ value: ethers.utils.parseEther(amount) });
    const receipt = await tx.wait();
    return receipt;
  }

  async claimEscrow(campaignAddress, signer) {
    if (!signer) throw new Error('Signer requis');
    await this.loadABIs();
    const contract = new ethers.Contract(campaignAddress, this.abis.Campaign, signer);
    const tx = await contract.claimEscrow();
    const receipt = await tx.wait();
    return receipt;
  }

  async startNewRound(campaignAddress, targetAmount, sharePrice, duration, signer) {
    if (!signer) throw new Error('Signer requis');
    await this.loadABIs();
    const contract = new ethers.Contract(campaignAddress, this.abis.Campaign, signer);
    const tx = await contract.startNewRound(
      ethers.utils.parseEther(targetAmount),
      ethers.utils.parseEther(sharePrice),
      duration
    );
    const receipt = await tx.wait();
    return receipt;
  }

  async promoteCampaign(campaignAddress, boostType, signer) {
    if (!signer) throw new Error('Signer requis');
    await this.loadABIs();
    const promotionAddress = this.contractAddresses.RecPromotionManager;
    if (!promotionAddress) throw new Error('RecPromotionManager non configuré');

    const contract = new ethers.Contract(promotionAddress, this.abis.RecPromotionManager, signer);
    const priceInWei = await contract.getBoostPriceInETH(boostType);
    const tx = await contract.promoteCampaign(campaignAddress, boostType, { value: priceInWei });
    const receipt = await tx.wait();
    return receipt;
  }
}

export const apiManager = new ApiManager();
export default apiManager;
