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

// =============================================================================
// UTILITAIRES
// =============================================================================

const toStringSafe = (value, fallback = '0') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return value.toString();
  return fallback;
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

  // Placeholder pour la compatibilité avec l'UI existante
  invalidateCache(key) {
    // Dans la nouvelle version, on laisse les routes API ou le navigateur gérer le cache
    console.log(`[API Manager] Cache invalidé pour: ${key}`);
  }

  // Placeholder pour le préchargement
  preloadCampaignDetails(address) {
    // Peut être implémenté plus tard si nécessaire
  }

  async loadABIs() {
    if (Object.keys(this.abis).length > 0) return;

    try {
      const response = await fetch('/abis/all.json');
      if (response.ok) {
        this.abis = await response.json();
      } else {
        // Fallback ABIs minimales si le fichier JSON n'est pas là
        this.abis = {
          DivarProxy: ["function createCampaign(string,string,uint256,uint256,uint256,string) payable returns (address)", "function creationFee() view returns (uint256)"],
          Campaign: ["function buyShares(uint256) payable", "function sharesSold() view returns (uint256)", "function raised() view returns (uint256)"]
        };
      }
    } catch (error) {
      console.warn('[ApiManager] Erreur chargement ABIs:', error);
    }
  }

  // =============================================================================
  // APPELS API (DONNÉES POSTGRESQL + REDIS)
  // =============================================================================

  /**
   * Récupérer toutes les campagnes (via API)
   */
  async getAllCampaigns(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/campaigns?${params.toString()}`);
      const data = await res.json();

      if (!data.campaigns) return [];
      return data.campaigns.map(normalizeCampaignSummary);
    } catch (error) {
      console.error('[ApiManager] getAllCampaigns error:', error);
      return [];
    }
  }

  /**
   * Récupérer les détails d'une campagne (via API)
   */
  async getCampaignData(address, forceFresh = false) {
    if (!address) return null;
    try {
      const res = await fetch(`/api/campaigns/${address.toLowerCase()}`);
      const data = await res.json();
      return normalizeCampaignSummary(data.campaign);
    } catch (error) {
      console.error(`[ApiManager] getCampaignData error for ${address}:`, error);
      return null;
    }
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
   * Récupérer les transactions d'une campagne (via API)
   */
  async getCampaignTransactions(address) {
    if (!address) return [];
    try {
      const res = await fetch(`/api/campaigns/${address.toLowerCase()}/transactions`);
      const data = await res.json();
      return data.transactions || [];
    } catch (error) {
      console.error(`[ApiManager] getCampaignTransactions error for ${address}:`, error);
      return [];
    }
  }

  /**
   * Récupérer les promotions actives (via API)
   */
  async getActivePromotions(includeExpired = false) {
    try {
      const res = await fetch(`/api/promotions?includeExpired=${includeExpired}`);
      const data = await res.json();
      return data.promotions || [];
    } catch (error) {
      console.error('[ApiManager] getActivePromotions error:', error);
      return [];
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
    const goal = ethers.utils.parseEther(formData.fundingGoal?.toString() || '0');
    const sharePrice = ethers.utils.parseEther(formData.sharePrice?.toString() || '0.01');
    const endTimestamp = Math.floor(new Date(formData.endDate).getTime() / 1000);
    const metadata = formData.metadataUri || '';

    const creationFee = await contract.creationFee();

    const tx = await contract.createCampaign(
      name,
      symbol,
      goal,
      sharePrice,
      BigInt(endTimestamp),
      metadata,
      { value: creationFee }
    );

    const receipt = await tx.wait();

    // Récupérer l'adresse de la campagne depuis les events (v5 style)
    const event = receipt.events?.find(e => e.event === 'CampaignCreated');
    const campaignAddress = event?.args?.campaignAddress || '';

    if (campaignAddress) {
      await this.upsertCampaign({
        address: campaignAddress.toLowerCase(),
        creator: await signer.getAddress(),
        name,
        symbol,
        goal: goal.toString(),
        share_price: sharePrice.toString(),
        total_shares: Number(formData.totalShares || formData.numberOfShares),
        end_date: new Date(formData.endDate),
        status: 'active'
      });
      return { success: true, address: campaignAddress, txHash: tx.hash };
    }

    return { success: true, txHash: tx.hash };
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
  }

  /**
   * Obtenir les stats du cache
   */
  getCacheStats() {
    return {
      hits: 0,
      misses: 0,
      size: 0,
      note: 'Cache gere cote serveur via Redis'
    };
  }
}

export const apiManager = new ApiManager();
export default apiManager;
