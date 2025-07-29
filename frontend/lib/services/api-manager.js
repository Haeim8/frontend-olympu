/**
 * Gestionnaire centralisé des appels API avec retry logic et optimisation
 * Évite les appels répétitifs et gère les limitations de provider
 */

import { ethers } from 'ethers';
import CampaignABI from '@/ABI/CampaignABI.json';
import DivarProxyABI from '@/ABI/DivarProxyABI.json';
import blockchainCache from './cache-manager.js';

class ApiManager {
  constructor() {
    this.provider = null;
    this.cache = blockchainCache;
    this.MAX_RETRIES = 3;
    this.BASE_DELAY = 1000;
    this.BATCH_SIZE = 3;
    this.PROVIDER_URL = `https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;
    this.PLATFORM_ADDRESS = "0x9fc348c0f4f4b1Ad6CaB657a7C519381FC5D3941";
    
    this.initProvider();
    this.setupCacheCallbacks();
  }

  initProvider() {
    this.provider = new ethers.providers.JsonRpcProvider(this.PROVIDER_URL);
  }

  setupCacheCallbacks() {
    this.cache.fetchCampaignData = this.fetchCampaignDataForCache.bind(this);
    this.cache.fetchInvestorsData = this.fetchInvestorsDataForCache.bind(this);
    this.cache.fetchTransactionsData = this.fetchTransactionsDataForCache.bind(this);
    this.cache.refreshCampaignData = this.refreshCampaignDataForCache.bind(this);
    this.cache.refreshInvestorsData = this.refreshInvestorsDataForCache.bind(this);
    this.cache.refreshTransactionsData = this.refreshTransactionsDataForCache.bind(this);
  }

  // Retry logic avec backoff exponentiel
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchWithRetry(fn, retries = this.MAX_RETRIES, delayMs = this.BASE_DELAY) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (error.response?.status === 429 || error.message.includes('429')) {
          if (i === retries - 1) throw error;
          await this.delay(delayMs * Math.pow(2, i));
          continue;
        }
        throw error;
      }
    }
  }

  // === MÉTHODES POUR L'AUTHENTIFICATION ===

  async checkUserProfile(address) {
    try {
      const { db } = await import('@/lib/firebase/firebase');
      const { doc, getDoc } = await import('firebase/firestore');
      
      const docRef = doc(db, "users", address);
      const docSnap = await getDoc(docRef);
      
      return {
        exists: docSnap.exists(),
        data: docSnap.exists() ? docSnap.data() : null
      };
    } catch (error) {
      console.error('Erreur lors de la vérification du profil Firebase:', error);
      return { exists: false, data: null };
    }
  }

  async checkUserRegistration(address) {
    try {
      const platformContract = new ethers.Contract(this.PLATFORM_ADDRESS, DivarProxyABI, this.provider);
      
      const isRegistered = await this.fetchWithRetry(async () => {
        return await platformContract.isUserRegistered(address);
      });

      return { isRegistered };
    } catch (error) {
      console.error('Erreur lors de la vérification du contrat:', error);
      return { isRegistered: false };
    }
  }

  // === MÉTHODES POUR LES CAMPAGNES ===
  
  async getAllCampaigns(useCache = true) {
    const cacheKey = this.cache.generateKey('campaigns', 'all');
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    const platformContract = new ethers.Contract(this.PLATFORM_ADDRESS, DivarProxyABI, this.provider);
    
    const campaigns = await this.fetchWithRetry(async () => {
      return await platformContract.getAllCampaigns();
    });

    this.cache.set(cacheKey, campaigns, this.cache.staticTTL, 'high');
    return campaigns;
  }

  async getCampaignData(campaignAddress, useCache = true) {
    const cacheKey = this.cache.generateKey('campaign', campaignAddress);
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    const data = await this.fetchCampaignDataForCache(campaignAddress);
    this.cache.set(cacheKey, data, this.cache.defaultTTL, 'normal');
    return data;
  }

  async fetchCampaignDataForCache(campaignAddress) {
    const [campaignContract, platformContract] = [
      new ethers.Contract(campaignAddress, CampaignABI, this.provider),
      new ethers.Contract(this.PLATFORM_ADDRESS, DivarProxyABI, this.provider)
    ];

    return await this.fetchWithRetry(async () => {
      const [roundInfo, campaignInfo] = await Promise.all([
        campaignContract.getCurrentRound(),
        platformContract.campaignRegistry(campaignAddress)
      ]);

      // roundInfo structure: [roundNumber, sharePrice, targetAmount, fundsRaised, sharesSold, endTime, isActive, isFinalized]
      const [roundNumber, sharePrice, targetAmount, fundsRaised, sharesSold, endTime, isActive, isFinalized] = roundInfo;

      return {
        id: campaignAddress,
        name: campaignInfo.name,
        sector: campaignInfo.category,
        sharePrice: ethers.utils.formatEther(sharePrice),
        raised: ethers.utils.formatEther(fundsRaised),
        goal: ethers.utils.formatEther(targetAmount),
        endDate: new Date(endTime.toNumber() * 1000).toLocaleDateString(),
        endTime: endTime.toNumber(),
        isActive: isActive,
        isFinalized: isFinalized,
        creator: campaignInfo.creator,
        creationTime: campaignInfo.creationTime.toNumber(),
        lawyer: campaignInfo.lawyer || ethers.constants.AddressZero,
        roundNumber: roundNumber.toNumber(),
        sharesSold: sharesSold.toNumber(),
        escrowAddress: campaignInfo.escrowAddress || ethers.constants.AddressZero
      };
    });
  }

  async refreshCampaignDataForCache(campaignAddress) {
    const data = await this.fetchCampaignDataForCache(campaignAddress);
    const cacheKey = this.cache.generateKey('campaign', campaignAddress);
    this.cache.set(cacheKey, data, this.cache.defaultTTL, 'normal');
    return data;
  }

  async getCampaignsBatch(campaignAddresses) {
    const results = [];
    
    for (let i = 0; i < campaignAddresses.length; i += this.BATCH_SIZE) {
      const batch = campaignAddresses.slice(i, i + this.BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(address => this.getCampaignData(address))
      );
      
      results.push(...batchResults);
      
      if (i + this.BATCH_SIZE < campaignAddresses.length) {
        await this.delay(1000);
      }
    }

    await this.cache.preloadCampaignData(campaignAddresses.slice(0, 6));
    return results.filter(campaign => campaign !== null);
  }

  async getCampaignInvestors(campaignAddress, useCache = true) {
    const cacheKey = this.cache.generateKey('campaign_investors', campaignAddress);
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    const data = await this.fetchInvestorsDataForCache(campaignAddress);
    this.cache.set(cacheKey, data, this.cache.defaultTTL, 'normal');
    return data;
  }

  async fetchInvestorsDataForCache(campaignAddress) {
    const events = await this.getCampaignEvents(campaignAddress, false);
    const investorsMap = new Map();
    
    const allTxs = [...events.purchases, ...events.refunds];
    allTxs.forEach(tx => {
      if (tx.type === 'Achat') {
        const currentCount = investorsMap.get(tx.investor) || 0;
        investorsMap.set(tx.investor, currentCount + parseInt(tx.numShares));
      } else if (tx.type === 'Remboursement') {
        const currentCount = investorsMap.get(tx.investor) || 0;
        investorsMap.set(tx.investor, Math.max(0, currentCount - parseInt(tx.numShares)));
      }
    });

    return Array.from(investorsMap.entries())
      .filter(([_, count]) => count > 0)
      .map(([address, nftCount]) => ({
        address,
        nftCount: nftCount.toString()
      }));
  }

  async refreshInvestorsDataForCache(campaignAddress) {
    const data = await this.fetchInvestorsDataForCache(campaignAddress);
    const cacheKey = this.cache.generateKey('campaign_investors', campaignAddress);
    this.cache.set(cacheKey, data, this.cache.defaultTTL, 'normal');
    return data;
  }

  async getCampaignTransactions(campaignAddress, useCache = true) {
    const cacheKey = this.cache.generateKey('campaign_transactions', campaignAddress);
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    const data = await this.fetchTransactionsDataForCache(campaignAddress);
    this.cache.set(cacheKey, data, this.cache.defaultTTL, 'normal');
    return data;
  }

  async fetchTransactionsDataForCache(campaignAddress) {
    const events = await this.getCampaignEvents(campaignAddress, false);
    
    const allTxs = [
      ...events.purchases.map(event => ({
        id: event.blockNumber,
        type: 'Achat',
        investor: event.investor,
        nftCount: event.numShares,
        value: event.value
      })),
      ...events.refunds.map(event => ({
        id: event.blockNumber,
        type: 'Remboursement',  
        investor: event.investor,
        nftCount: event.numShares,
        value: event.value
      }))
    ].sort((a,b) => b.id - a.id);

    return allTxs;
  }

  async refreshTransactionsDataForCache(campaignAddress) {
    const data = await this.fetchTransactionsDataForCache(campaignAddress);
    const cacheKey = this.cache.generateKey('campaign_transactions', campaignAddress);
    this.cache.set(cacheKey, data, this.cache.defaultTTL, 'normal');
    return data;
  }

  // === MÉTHODES POUR LE WALLET ===
  
  async getUserInvestments(userAddress) {
    const cacheKey = this.getCacheKey('getUserInvestments', [userAddress]);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const campaignAddresses = await this.getAllCampaigns();
    const investments = [];

    for (let i = 0; i < campaignAddresses.length; i += this.BATCH_SIZE) {
      const batch = campaignAddresses.slice(i, i + this.BATCH_SIZE);
      
      await Promise.all(
        batch.map(async (campaignAddress) => {
          try {
            const campaignContract = new ethers.Contract(campaignAddress, CampaignABI, this.provider);
            const balance = await this.fetchWithRetry(() => campaignContract.balanceOf(userAddress));
            
            if (balance.toNumber() > 0) {
              const [investmentData, campaignInfo] = await Promise.all([
                this.fetchWithRetry(() => campaignContract.getInvestments(userAddress)),
                this.getCampaignData(campaignAddress)
              ]);
              
              investments.push({
                campaignAddress,
                campaignName: campaignInfo.name,
                investments: investmentData,
                balance: balance.toNumber()
              });
            }
          } catch (e) {
            console.warn(`Erreur pour la campagne ${campaignAddress}:`, e);
          }
        })
      );
      
      if (i + this.BATCH_SIZE < campaignAddresses.length) {
        await this.delay(1000);
      }
    }

    this.setCache(cacheKey, investments);
    return investments;
  }

  // === MÉTHODES POUR LES ÉVÉNEMENTS ===
  
  async getCampaignEvents(campaignAddress, useCache = true) {
    const cacheKey = this.cache.generateKey('campaign_events', campaignAddress);
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    const contract = new ethers.Contract(campaignAddress, CampaignABI, this.provider);
    
    const events = await this.fetchWithRetry(async () => {
      const [purchaseEvents, refundEvents] = await Promise.all([
        contract.queryFilter(contract.filters.SharesPurchased()),
        contract.queryFilter(contract.filters.SharesRefunded())
      ]);

      return {
        purchases: purchaseEvents.map(event => ({
          type: 'Achat',
          investor: event.args.investor,
          numShares: event.args.numShares.toString(),
          value: ethers.utils.formatEther(event.args.value || "0"),
          blockNumber: event.blockNumber
        })),
        refunds: refundEvents.map(event => ({
          type: 'Remboursement',
          investor: event.args.investor,
          numShares: event.args.numShares.toString(),
          value: ethers.utils.formatEther(event.args.refundAmount || "0"),
          blockNumber: event.blockNumber
        }))
      };
    });

    this.cache.set(cacheKey, events, this.cache.defaultTTL, 'normal');
    return events;
  }

  // === ACTIONS BLOCKCHAIN POUR CAMPAIGN ===

  async distributeDividends(campaignAddress, amount, message = "") {
    const contract = new ethers.Contract(campaignAddress, CampaignABI, this.provider.getSigner());
    
    const amountWei = ethers.utils.parseEther(amount.toString());
    const tx = await contract.distributeDividends(amountWei, { value: amountWei });
    await tx.wait();
    
    this.cache.invalidateCampaign(campaignAddress);
    return tx;
  }

  async claimEscrow(campaignAddress) {
    const contract = new ethers.Contract(campaignAddress, CampaignABI, this.provider.getSigner());
    
    const tx = await contract.claimEscrow();
    await tx.wait();
    
    this.cache.invalidateCampaign(campaignAddress);
    return tx;
  }

  async startNewRound(campaignAddress, targetAmount, sharePrice, duration) {
    const contract = new ethers.Contract(campaignAddress, CampaignABI, this.provider.getSigner());
    
    const targetAmountWei = ethers.utils.parseEther(targetAmount.toString());
    const sharePriceWei = ethers.utils.parseEther(sharePrice.toString());
    
    const tx = await contract.startNewRound(targetAmountWei, sharePriceWei, duration);
    await tx.wait();
    
    this.cache.invalidateCampaign(campaignAddress);
    return tx;
  }

  async addDocument(campaignAddress, ipfsHash, fileName) {
    const contract = new ethers.Contract(campaignAddress, CampaignABI, this.provider.getSigner());
    
    const tx = await contract.addDocument(ipfsHash, fileName);
    await tx.wait();
    
    this.cache.invalidate(`campaign_documents_${campaignAddress}`);
    return tx;
  }

  async getDocuments(campaignAddress, useCache = true) {
    const cacheKey = this.cache.generateKey('campaign_documents', campaignAddress);
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    const contract = new ethers.Contract(campaignAddress, CampaignABI, this.provider);
    const documents = await this.fetchWithRetry(() => contract.getDocuments());
    
    this.cache.set(cacheKey, documents, this.cache.staticTTL, 'normal');
    return documents;
  }

  // === MÉTHODES DE PRÉCHARGEMENT ===

  async preloadCampaignDetails(campaignId) {
    this.cache.preloadOnHover(campaignId);
  }

  async warmupHomePageCache(campaignIds) {
    await this.cache.warmupCache(campaignIds);
  }

  invalidateCampaignCache(campaignAddress) {
    this.cache.invalidateCampaign(campaignAddress);
  }

  // === UTILITAIRES ===
  
  formatEthValue(value) {
    if (!value) return "0";
    try {
      const formattedValue = ethers.utils.formatEther(value.toString());
      return parseFloat(formattedValue).toFixed(6);
    } catch (error) {
      console.error("Erreur de formatage:", error);
      return "0";
    }
  }

  clearCache() {
    this.cache.clear();
  }

  invalidateCache(pattern) {
    this.cache.invalidate(pattern);
  }

  getCacheStats() {
    return this.cache.getCacheStats();
  }
}

// Instance singleton
export const apiManager = new ApiManager();
export default apiManager;