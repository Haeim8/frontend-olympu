/**
 * Gestionnaire centralisé des appels API - Firebase + Blockchain
 */

import blockchainCache from './cache-manager.js';

class ApiManager {
  constructor() {
    this.cache = blockchainCache;
    
    // Adresses des contrats déployés sur Base Sepolia
    this.contractAddresses = {
      PriceConsumerV3: "0xa5050E4FC5F7115378Bbf8bAa17517298962bebE",
      DivarProxy: "0x89Eba0c82c1f16433473A9A06690BfaAC2c7a1b4",
      CampaignKeeper: "0x7BA165d19De799DA8070D3c1C061933551726D1E"
    };

    // Cache des ABIs
    this.abis = {};
    this.contracts = {};
    this.provider = null;
  }

  async initializeWeb3() {
    if (typeof window !== 'undefined' && window.ethereum) {
      const { ethers } = await import('ethers');
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      return true;
    }
    return false;
  }

  async loadABIs() {
    if (Object.keys(this.abis).length > 0) return;

    try {
      const [divarAbi, campaignAbi, keeperAbi, priceAbi] = await Promise.all([
        import('/ABI/DivarProxyABI.json'),
        import('/ABI/CampaignABI.json'),
        import('/ABI/CampaignKeeperABI.json'),
        import('/ABI/PriceConsumerV3ABI.json')
      ]);

      this.abis = {
        DivarProxy: divarAbi.default,
        Campaign: campaignAbi.default,
        CampaignKeeper: keeperAbi.default,
        PriceConsumerV3: priceAbi.default
      };
    } catch (error) {
      console.error('Erreur chargement ABIs:', error);
    }
  }

  async getContract(contractName, address = null) {
    if (!this.provider) {
      await this.initializeWeb3();
    }

    if (!this.provider) {
      throw new Error('Web3 provider non disponible');
    }

    await this.loadABIs();

    const contractAddress = address || this.contractAddresses[contractName];
    const contractKey = `${contractName}_${contractAddress}`;

    if (!this.contracts[contractKey]) {
      const { ethers } = await import('ethers');
      this.contracts[contractKey] = new ethers.Contract(
        contractAddress,
        this.abis[contractName],
        this.provider
      );
    }

    return this.contracts[contractKey];
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
    // Plus besoin de vérifier l'inscription - toujours true maintenant
    return { isRegistered: true };
  }

  // === MÉTHODES POUR LES CAMPAGNES ===
  
  async getAllCampaigns(useCache = true) {
    const cacheKey = this.cache.generateKey('all_campaigns', 'main');
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const divarProxy = await this.getContract('DivarProxy');
      const campaignAddresses = await divarProxy.getAllCampaigns();
      
      this.cache.set(cacheKey, campaignAddresses, this.cache.defaultTTL);
      return campaignAddresses;
    } catch (error) {
      console.error('Erreur getAllCampaigns:', error);
      return [];
    }
  }

  async getCampaignData(campaignAddress, useCache = true) {
    const cacheKey = this.cache.generateKey('campaign', campaignAddress);
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const campaign = await this.getContract('Campaign', campaignAddress);
      const divarProxy = await this.getContract('DivarProxy');
      
      const [
        name,
        symbol,
        currentRound,
        totalInvestors,
        totalShares,
        targetAmount,
        endTime,
        isActive,
        registry
      ] = await Promise.all([
        campaign.name(),
        campaign.symbol(),
        campaign.getCurrentRound(),
        campaign.totalInvestors(),
        campaign.totalSupply(),
        campaign.targetAmount(),
        campaign.endTime(),
        campaign.isActive(),
        divarProxy.campaignRegistry(campaignAddress)
      ]);

      const campaignData = {
        address: campaignAddress,
        name,
        symbol,
        currentRound: currentRound.toString(),
        totalInvestors: totalInvestors.toString(),
        totalShares: totalShares.toString(),
        targetAmount: targetAmount.toString(),
        endTime: endTime.toString(),
        isActive,
        creator: registry.creator,
        category: registry.category,
        metadata: registry.metadata,
        logo: registry.logo
      };

      this.cache.set(cacheKey, campaignData, this.cache.defaultTTL);
      return campaignData;
    } catch (error) {
      console.error('Erreur getCampaignData:', error);
      return null;
    }
  }

  async getCampaignInvestors(campaignAddress, useCache = true) {
    const cacheKey = this.cache.generateKey('campaign_investors', campaignAddress);
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const campaign = await this.getContract('Campaign', campaignAddress);
      const totalInvestors = await campaign.totalInvestors();
      const investors = [];

      for (let i = 0; i < totalInvestors; i++) {
        const investorAddress = await campaign.investors(i);
        const shares = await campaign.balanceOf(investorAddress);
        investors.push({
          address: investorAddress,
          shares: shares.toString()
        });
      }

      this.cache.set(cacheKey, investors, this.cache.defaultTTL);
      return investors;
    } catch (error) {
      console.error('Erreur getCampaignInvestors:', error);
      return [];
    }
  }

  async getCampaignTransactions(campaignAddress, useCache = true) {
    const cacheKey = this.cache.generateKey('campaign_transactions', campaignAddress);
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const campaign = await this.getContract('Campaign', campaignAddress);
      const filter = campaign.filters.SharesPurchased();
      const events = await campaign.queryFilter(filter);
      
      const transactions = events.map(event => ({
        hash: event.transactionHash,
        blockNumber: event.blockNumber,
        investor: event.args.investor,
        amount: event.args.amount.toString(),
        shares: event.args.shares.toString(),
        timestamp: event.args.timestamp.toString()
      }));

      this.cache.set(cacheKey, transactions, this.cache.defaultTTL);
      return transactions;
    } catch (error) {
      console.error('Erreur getCampaignTransactions:', error);
      return [];
    }
  }

  async getUserInvestments(userAddress) {
    const cacheKey = this.cache.generateKey('user_investments', userAddress);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const campaigns = await this.getAllCampaigns();
      const investments = [];

      for (const campaignAddress of campaigns) {
        const campaign = await this.getContract('Campaign', campaignAddress);
        const balance = await campaign.balanceOf(userAddress);
        
        if (balance.gt(0)) {
          const campaignData = await this.getCampaignData(campaignAddress);
          investments.push({
            ...campaignData,
            userShares: balance.toString()
          });
        }
      }

      this.cache.set(cacheKey, investments, this.cache.defaultTTL);
      return investments;
    } catch (error) {
      console.error('Erreur getUserInvestments:', error);
      return [];
    }
  }

  // === UTILITAIRES ===
  
  async formatEthValue(value) {
    if (!value) return "0";
    
    try {
      const { ethers } = await import('ethers');
      return ethers.utils.formatEther(value);
    } catch (error) {
      console.error('Erreur formatEthValue:', error);
      return "0";
    }
  }

  async getEthPrice() {
    const cacheKey = this.cache.generateKey('eth_price', 'current');
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const priceConsumer = await this.getContract('PriceConsumerV3');
      const price = await priceConsumer.getLatestPrice();
      const priceInUsd = (price / 1e8).toFixed(2);
      
      this.cache.set(cacheKey, priceInUsd, this.cache.criticalTTL);
      return priceInUsd;
    } catch (error) {
      console.error('Erreur getEthPrice:', error);
      return "0";
    }
  }

  async getCampaignCreationFee() {
    const cacheKey = this.cache.generateKey('creation_fee', 'current');
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const divarProxy = await this.getContract('DivarProxy');
      const fee = await divarProxy.getCampaignCreationFeeETH();
      const feeFormatted = await this.formatEthValue(fee);
      
      this.cache.set(cacheKey, { raw: fee.toString(), formatted: feeFormatted }, this.cache.criticalTTL);
      return { raw: fee.toString(), formatted: feeFormatted };
    } catch (error) {
      console.error('Erreur getCampaignCreationFee:', error);
      return { raw: "0", formatted: "0" };
    }
  }

  clearCache() {
    this.cache.clear();
  }

  invalidateCache(pattern) {
    this.cache.invalidate(pattern);
  }

  invalidateCampaign(campaignAddress) {
    this.cache.invalidateCampaign(campaignAddress);
  }

  getCacheStats() {
    return this.cache.getCacheStats();
  }

  // === MÉTHODES DE PRÉCHARGEMENT ===

  preloadCampaignOnHover(campaignAddress) {
    this.cache.preloadOnHover(campaignAddress);
  }

  async warmupCache(campaignAddresses) {
    await this.cache.warmupCache(campaignAddresses);
  }
}

// Instance singleton
export const apiManager = new ApiManager();
export default apiManager;