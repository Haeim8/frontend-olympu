class BlockchainCache {
  constructor() {
    this.cache = new Map();
    this.preloadQueue = [];
    this.isPreloading = false;
    this.preloadListeners = new Set();
    this.maxCacheSize = 100;
    this.defaultTTL = 300000; // 5 minutes
    this.criticalTTL = 60000;  // 1 minute pour données critiques
    this.staticTTL = 1800000;  // 30 minutes pour données statiques
  }

  generateKey(type, identifier, params = {}) {
    const baseKey = `${type}_${identifier}`;
    const paramStr = Object.keys(params).length > 0 ? `_${JSON.stringify(params)}` : '';
    return `${baseKey}${paramStr}`;
  }

  set(key, data, ttl = this.defaultTTL, priority = 'normal') {
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      ttl,
      priority,
      hits: 0
    });
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (this.isExpired(cached)) {
      this.cache.delete(key);
      this.scheduleRefresh(key);
      return null;
    }

    cached.lastAccessed = Date.now();
    cached.hits++;
    return cached.data;
  }

  isExpired(cached) {
    return Date.now() - cached.timestamp > cached.ttl;
  }

  evictLeastRecentlyUsed() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (value.priority !== 'critical' && value.lastAccessed < oldestTime) {
        oldestTime = value.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  scheduleRefresh(key) {
    if (!this.preloadQueue.includes(key)) {
      this.preloadQueue.push(key);
      this.processPreloadQueue();
    }
  }

  async preloadCampaignData(campaignIds, priority = 'normal') {
    const preloadPromises = campaignIds.map(async (campaignId) => {
      const keys = [
        this.generateKey('campaign', campaignId),
        this.generateKey('campaign_investors', campaignId),
        this.generateKey('campaign_transactions', campaignId),
      ];

      for (const key of keys) {
        if (!this.cache.has(key)) {
          this.preloadQueue.push({ key, campaignId, priority });
        }
      }
    });

    await Promise.all(preloadPromises);
    this.processPreloadQueue();
  }

  async processPreloadQueue() {
    if (this.isPreloading || this.preloadQueue.length === 0) return;

    this.isPreloading = true;
    
    try {
      const batch = this.preloadQueue.splice(0, 3);
      
      await Promise.all(batch.map(async (item) => {
        if (typeof item === 'string') {
          await this.refreshCacheItem(item);
        } else {
          await this.preloadCampaignItem(item);
        }
      }));

      if (this.preloadQueue.length > 0) {
        setTimeout(() => this.processPreloadQueue(), 1000);
      }
    } catch (error) {
      console.error('Erreur lors du préchargement:', error);
    } finally {
      this.isPreloading = false;
    }
  }

  async refreshCacheItem(key) {
    const [type, identifier] = key.split('_');
    
    try {
      switch (type) {
        case 'campaign':
          await this.refreshCampaignData(identifier);
          break;
        case 'campaign_investors':
          await this.refreshInvestorsData(identifier);
          break;
        case 'campaign_transactions':
          await this.refreshTransactionsData(identifier);
          break;
      }
    } catch (error) {
      console.error(`Erreur refresh ${key}:`, error);
    }
  }

  async preloadCampaignItem(item) {
    const { key, campaignId, priority } = item;
    
    if (this.cache.has(key)) return;

    try {
      const [type] = key.split('_');
      let data = null;

      switch (type) {
        case 'campaign':
          data = await this.fetchCampaignData(campaignId);
          break;
        case 'campaign_investors':
          data = await this.fetchInvestorsData(campaignId);
          break;
        case 'campaign_transactions':
          data = await this.fetchTransactionsData(campaignId);
          break;
      }

      if (data) {
        const ttl = priority === 'critical' ? this.criticalTTL : this.defaultTTL;
        this.set(key, data, ttl, priority);
      }
    } catch (error) {
      console.error(`Erreur préchargement ${key}:`, error);
    }
  }

  preloadOnHover(campaignId) {
    const keys = [
      this.generateKey('campaign', campaignId),
      this.generateKey('campaign_investors', campaignId),
    ];

    keys.forEach(key => {
      if (!this.cache.has(key) && !this.preloadQueue.some(item => 
        typeof item === 'object' && item.key === key
      )) {
        this.preloadQueue.push({ key, campaignId, priority: 'high' });
      }
    });

    this.processPreloadQueue();
  }

  invalidate(pattern) {
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (typeof pattern === 'string' && key.includes(pattern)) {
        keysToDelete.push(key);
      } else if (pattern instanceof RegExp && pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  invalidateCampaign(campaignId) {
    this.invalidate(`campaign_${campaignId}`);
    this.invalidate(`campaign_investors_${campaignId}`);
    this.invalidate(`campaign_transactions_${campaignId}`);
  }

  getCacheStats() {
    let totalHits = 0;
    let totalSize = 0;
    const typeStats = {};

    for (const [key, value] of this.cache.entries()) {
      totalHits += value.hits;
      totalSize++;
      
      const type = key.split('_')[0];
      if (!typeStats[type]) {
        typeStats[type] = { count: 0, hits: 0 };
      }
      typeStats[type].count++;
      typeStats[type].hits += value.hits;
    }

    return {
      totalEntries: totalSize,
      totalHits,
      typeStats,
      isPreloading: this.isPreloading,
      queueSize: this.preloadQueue.length
    };
  }

  clear() {
    this.cache.clear();
    this.preloadQueue = [];
  }

  async warmupCache(campaignIds) {
    console.log('🔥 Réchauffement du cache pour', campaignIds.length, 'campagnes');
    
    await this.preloadCampaignData(campaignIds, 'high');
    
    const stats = this.getCacheStats();
    console.log('📊 Cache stats après warmup:', stats);
  }

  async fetchCampaignData(campaignId) {
    try {
      const { apiManager } = await import('./api-manager.js');
      return await apiManager.getCampaignData(campaignId, false);
    } catch (error) {
      console.error('Erreur fetchCampaignData:', error);
      return null;
    }
  }

  async fetchInvestorsData(campaignId) {
    try {
      const { apiManager } = await import('./api-manager.js');
      return await apiManager.getCampaignInvestors(campaignId, false);
    } catch (error) {
      console.error('Erreur fetchInvestorsData:', error);
      return null;
    }
  }

  async fetchTransactionsData(campaignId) {
    try {
      const { apiManager } = await import('./api-manager.js');
      return await apiManager.getCampaignTransactions(campaignId, false);
    } catch (error) {
      console.error('Erreur fetchTransactionsData:', error);
      return null;
    }
  }

  async refreshCampaignData(campaignId) {
    try {
      const data = await this.fetchCampaignData(campaignId);
      if (data) {
        const key = this.generateKey('campaign', campaignId);
        this.set(key, data, this.defaultTTL);
      }
      return data;
    } catch (error) {
      console.error('Erreur refreshCampaignData:', error);
      return null;
    }
  }

  async refreshInvestorsData(campaignId) {
    try {
      const data = await this.fetchInvestorsData(campaignId);
      if (data) {
        const key = this.generateKey('campaign_investors', campaignId);
        this.set(key, data, this.defaultTTL);
      }
      return data;
    } catch (error) {
      console.error('Erreur refreshInvestorsData:', error);
      return null;
    }
  }

  async refreshTransactionsData(campaignId) {
    try {
      const data = await this.fetchTransactionsData(campaignId);
      if (data) {
        const key = this.generateKey('campaign_transactions', campaignId);
        this.set(key, data, this.defaultTTL);
      }
      return data;
    } catch (error) {
      console.error('Erreur refreshTransactionsData:', error);
      return null;
    }
  }
}

const blockchainCache = new BlockchainCache();

export default blockchainCache;
export { BlockchainCache };