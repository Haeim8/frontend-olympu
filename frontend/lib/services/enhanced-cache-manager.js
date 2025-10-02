/**
 * Système de cache amélioré avec persistance et synchronisation intelligente
 */

class EnhancedBlockchainCache {
  constructor() {
    // Cache en mémoire pour les accès rapides
    this.memoryCache = new Map();
    
    // Configuration du cache
    this.config = {
      maxMemorySize: 200, // Augmenté pour plus de données
      defaultTTL: 300000, // 5 minutes
      criticalTTL: 60000,  // 1 minute pour données critiques
      staticTTL: 1800000,  // 30 minutes pour données statiques
      persistentTTL: 3600000, // 1 heure pour données persistantes
    };

    // Statistiques et monitoring
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      persistentHits: 0,
      rpcCalls: 0,
      errors: 0
    };

    // Queue de préchargement intelligent
    this.preloadQueue = new Set();
    this.isPreloading = false;
    this.preloadBatch = [];

    // Système de priorités
    this.priorities = {
      CRITICAL: 'critical',
      HIGH: 'high', 
      NORMAL: 'normal',
      LOW: 'low'
    };

    // Données persistantes (localStorage/sessionStorage)
    this.persistentKeys = new Set([
      'campaign_list',
      'campaign_summary',
      'user_investments',
      'active_promotions'
    ]);

    // Circuit breaker pour éviter les appels répétés qui échouent
    this.circuitBreaker = new Map();
    
    // Initialisation
    this.initialize();
  }

  initialize() {
    // Charger les données persistantes au démarrage
    this.loadPersistentData();
    
    // Nettoyer périodiquement
    setInterval(() => this.cleanup(), 60000); // Toutes les minutes
    
    // Sauvegarder périodiquement
    setInterval(() => this.savePersistentData(), 300000); // Toutes les 5 minutes
    
    console.log('🚀 Enhanced Cache Manager initialisé');
  }

  /**
   * Génération de clés de cache intelligente
   */
  generateKey(type, identifier, params = {}) {
    const baseKey = `${type}_${identifier}`;
    
    // Ajouter les paramètres pertinents seulement
    const relevantParams = this.filterRelevantParams(type, params);
    const paramStr = Object.keys(relevantParams).length > 0 
      ? `_${this.hashParams(relevantParams)}` 
      : '';
    
    return `${baseKey}${paramStr}`;
  }

  /**
   * Filtrer les paramètres pertinents selon le type de données
   */
  filterRelevantParams(type, params) {
    const relevantParamsByType = {
      'campaign': ['useCache', 'includeTransactions'],
      'campaign_list': ['creator', 'status', 'category'],
      'campaign_transactions': ['limit', 'investor', 'type'],
      'user_investments': ['includeHistory'],
      'promotion': ['roundNumber', 'boostType']
    };

    const relevant = relevantParamsByType[type] || [];
    const filtered = {};
    
    relevant.forEach(key => {
      if (params[key] !== undefined) {
        filtered[key] = params[key];
      }
    });
    
    return filtered;
  }

  /**
   * Hash simple des paramètres pour la clé
   */
  hashParams(params) {
    return btoa(JSON.stringify(params)).slice(0, 8);
  }

  /**
   * Récupération avec logique intelligente
   */
  get(key, options = {}) {
    const { allowStale = false, priority = this.priorities.NORMAL } = options;
    
    // Vérifier le cache mémoire
    const cached = this.memoryCache.get(key);
    if (cached) {
      // Vérifier l'expiration
      if (!this.isExpired(cached) || (allowStale && !this.isStaleExpired(cached))) {
        cached.lastAccessed = Date.now();
        cached.hits++;
        this.stats.hits++;
        
        // Précharger si proche de l'expiration
        if (this.isNearExpiration(cached)) {
          this.scheduleRefresh(key, priority);
        }
        
        return cached.data;
      } else {
        // Données expirées
        this.memoryCache.delete(key);
        this.scheduleRefresh(key, priority);
      }
    }

    // Vérifier le cache persistant
    const persistent = this.getPersistent(key);
    if (persistent) {
      // Remettre en cache mémoire
      this.setMemory(key, persistent.data, persistent.ttl, persistent.priority);
      this.stats.persistentHits++;
      return persistent.data;
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Stockage avec logique de priorité
   */
  set(key, data, ttl = this.config.defaultTTL, priority = this.priorities.NORMAL) {
    // Éviter de cacher des données nulles ou vides
    if (data === null || data === undefined) {
      return;
    }

    // Nettoyer le cache si nécessaire
    if (this.memoryCache.size >= this.config.maxMemorySize) {
      this.evictLeastImportant();
    }

    // Stocker en mémoire
    this.setMemory(key, data, ttl, priority);

    // Stocker de manière persistante si nécessaire
    if (this.shouldPersist(key, priority)) {
      this.setPersistent(key, data, ttl, priority);
    }

    this.stats.sets++;
  }

  /**
   * Stockage en mémoire
   */
  setMemory(key, data, ttl, priority) {
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      ttl,
      priority,
      hits: 0,
      size: this.estimateSize(data)
    });
  }

  /**
   * Vérification d'expiration
   */
  isExpired(cached) {
    return Date.now() - cached.timestamp > cached.ttl;
  }

  /**
   * Vérification d'expiration stale (données utilisables mais anciennes)
   */
  isStaleExpired(cached) {
    return Date.now() - cached.timestamp > (cached.ttl * 2);
  }

  /**
   * Vérification si proche de l'expiration
   */
  isNearExpiration(cached) {
    const elapsed = Date.now() - cached.timestamp;
    return elapsed > (cached.ttl * 0.8); // 80% du TTL
  }

  /**
   * Éviction intelligente basée sur la priorité et l'utilisation
   */
  evictLeastImportant() {
    const entries = Array.from(this.memoryCache.entries());
    
    // Trier par priorité et utilisation
    entries.sort((a, b) => {
      const [keyA, valueA] = a;
      const [keyB, valueB] = b;
      
      // Priorité critique = ne pas évincer
      if (valueA.priority === this.priorities.CRITICAL) return 1;
      if (valueB.priority === this.priorities.CRITICAL) return -1;
      
      // Ensuite par score d'utilisation
      const scoreA = this.calculateUsageScore(valueA);
      const scoreB = this.calculateUsageScore(valueB);
      
      return scoreA - scoreB;
    });

    // Évincer les 10% les moins importants
    const toEvict = Math.ceil(entries.length * 0.1);
    for (let i = 0; i < toEvict; i++) {
      const [key] = entries[i];
      this.memoryCache.delete(key);
      this.stats.evictions++;
    }
  }

  /**
   * Calcul du score d'utilisation
   */
  calculateUsageScore(cached) {
    const age = Date.now() - cached.timestamp;
    const timeSinceAccess = Date.now() - cached.lastAccessed;
    const hitRate = cached.hits / Math.max(1, age / 60000); // hits par minute
    
    // Score plus élevé = plus important à garder
    return hitRate * 1000 - timeSinceAccess / 1000 - age / 10000;
  }

  /**
   * Préchargement intelligent
   */
  async scheduleRefresh(key, priority = this.priorities.NORMAL) {
    if (this.preloadQueue.has(key)) return;
    
    this.preloadQueue.add(key);
    
    // Traitement immédiat pour les données critiques
    if (priority === this.priorities.CRITICAL) {
      await this.processRefresh(key);
      return;
    }
    
    // Traitement en batch pour les autres
    this.preloadBatch.push({ key, priority, timestamp: Date.now() });
    
    if (!this.isPreloading) {
      setTimeout(() => this.processPreloadBatch(), 1000);
    }
  }

  /**
   * Traitement du batch de préchargement
   */
  async processPreloadBatch() {
    if (this.isPreloading || this.preloadBatch.length === 0) return;
    
    this.isPreloading = true;
    
    try {
      // Trier par priorité
      this.preloadBatch.sort((a, b) => {
        const priorityOrder = {
          [this.priorities.CRITICAL]: 4,
          [this.priorities.HIGH]: 3,
          [this.priorities.NORMAL]: 2,
          [this.priorities.LOW]: 1
        };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      // Traiter par chunks
      const batch = this.preloadBatch.splice(0, 5);
      
      await Promise.allSettled(
        batch.map(item => this.processRefresh(item.key))
      );
      
      // Continuer s'il reste des éléments
      if (this.preloadBatch.length > 0) {
        setTimeout(() => this.processPreloadBatch(), 2000);
      }
      
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Traitement d'un refresh
   */
  async processRefresh(key) {
    try {
      this.preloadQueue.delete(key);
      
      // Analyser la clé pour déterminer le type de données
      const [type, identifier] = key.split('_', 2);
      
      let data = null;
      
      switch (type) {
        case 'campaign':
          data = await this.refreshCampaignData(identifier);
          break;
        case 'campaign_list':
          data = await this.refreshCampaignList();
          break;
        case 'campaign_transactions':
          data = await this.refreshTransactionData(identifier);
          break;
        case 'user_investments':
          data = await this.refreshUserInvestments(identifier);
          break;
        case 'active_promotions':
          data = await this.refreshPromotions();
          break;
      }
      
      if (data) {
        this.set(key, data, this.config.defaultTTL, this.priorities.NORMAL);
      }
      
    } catch (error) {
      console.error(`❌ Erreur refresh ${key}:`, error);
      this.recordCircuitBreakerFailure(key);
      this.stats.errors++;
    }
  }

  /**
   * Refresh des données de campagne
   */
  async refreshCampaignData(campaignAddress) {
    if (this.isCircuitBreakerOpen(campaignAddress)) {
      return null;
    }

    try {
      // Importer dynamiquement l'API manager pour éviter les dépendances circulaires
      const { apiManager } = await import('./api-manager.js');
      const data = await apiManager.getCampaignData(campaignAddress, false);
      
      this.recordCircuitBreakerSuccess(campaignAddress);
      this.stats.rpcCalls++;
      
      return data;
    } catch (error) {
      this.recordCircuitBreakerFailure(campaignAddress);
      throw error;
    }
  }

  /**
   * Refresh de la liste des campagnes
   */
  async refreshCampaignList() {
    try {
      const { apiManager } = await import('./api-manager.js');
      const data = await apiManager.listCampaigns({}, { useCache: false });
      
      this.stats.rpcCalls++;
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh des transactions
   */
  async refreshTransactionData(campaignAddress) {
    try {
      const { apiManager } = await import('./api-manager.js');
      const data = await apiManager.getCampaignTransactions(campaignAddress, { useCache: false });
      
      this.stats.rpcCalls++;
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh des investissements utilisateur
   */
  async refreshUserInvestments(userAddress) {
    try {
      const { apiManager } = await import('./api-manager.js');
      const data = await apiManager.getUserInvestments(userAddress, { useCache: false });
      
      this.stats.rpcCalls++;
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh des promotions
   */
  async refreshPromotions() {
    try {
      const { apiManager } = await import('./api-manager.js');
      const data = await apiManager.getActivePromotions(false);
      
      this.stats.rpcCalls++;
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gestion du circuit breaker
   */
  isCircuitBreakerOpen(key) {
    const failures = this.circuitBreaker.get(key);
    if (!failures) return false;
    
    return failures.count >= 3 && (Date.now() - failures.lastAttempt) < 300000; // 5 minutes
  }

  recordCircuitBreakerFailure(key) {
    const current = this.circuitBreaker.get(key) || { count: 0, lastAttempt: 0 };
    this.circuitBreaker.set(key, {
      count: current.count + 1,
      lastAttempt: Date.now()
    });
  }

  recordCircuitBreakerSuccess(key) {
    this.circuitBreaker.delete(key);
  }

  /**
   * Gestion de la persistance
   */
  shouldPersist(key, priority) {
    const [type] = key.split('_', 1);
    return this.persistentKeys.has(type) || priority === this.priorities.CRITICAL;
  }

  getPersistent(key) {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(`livar_cache_${key}`);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      
      // Vérifier l'expiration
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        localStorage.removeItem(`livar_cache_${key}`);
        return null;
      }
      
      return parsed;
    } catch (error) {
      return null;
    }
  }

  setPersistent(key, data, ttl, priority) {
    if (typeof window === 'undefined') return;
    
    try {
      const toStore = {
        data,
        timestamp: Date.now(),
        ttl,
        priority
      };
      
      localStorage.setItem(`livar_cache_${key}`, JSON.stringify(toStore));
    } catch (error) {
      // Storage plein, nettoyer
      this.cleanupPersistentStorage();
    }
  }

  loadPersistentData() {
    if (typeof window === 'undefined') return;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('livar_cache_')) {
          const cacheKey = key.replace('livar_cache_', '');
          const data = this.getPersistent(cacheKey);
          
          if (data) {
            this.setMemory(cacheKey, data.data, data.ttl, data.priority);
          }
        }
      }
      
      console.log(`📦 ${this.memoryCache.size} entrées chargées depuis le cache persistant`);
    } catch (error) {
      console.error('❌ Erreur chargement cache persistant:', error);
    }
  }

  savePersistentData() {
    if (typeof window === 'undefined') return;
    
    let saved = 0;
    
    for (const [key, cached] of this.memoryCache.entries()) {
      if (this.shouldPersist(key, cached.priority)) {
        this.setPersistent(key, cached.data, cached.ttl, cached.priority);
        saved++;
      }
    }
    
    if (saved > 0) {
      console.log(`💾 ${saved} entrées sauvegardées dans le cache persistant`);
    }
  }

  cleanupPersistentStorage() {
    if (typeof window === 'undefined') return;
    
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('livar_cache_')) {
        const cacheKey = key.replace('livar_cache_', '');
        const data = this.getPersistent(cacheKey);
        
        if (!data) {
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`🧹 ${keysToRemove.length} entrées expirées supprimées du cache persistant`);
  }

  /**
   * Nettoyage périodique
   */
  cleanup() {
    const before = this.memoryCache.size;
    
    // Supprimer les entrées expirées
    for (const [key, cached] of this.memoryCache.entries()) {
      if (this.isStaleExpired(cached)) {
        this.memoryCache.delete(key);
      }
    }
    
    // Nettoyer le circuit breaker
    for (const [key, failures] of this.circuitBreaker.entries()) {
      if (Date.now() - failures.lastAttempt > 600000) { // 10 minutes
        this.circuitBreaker.delete(key);
      }
    }
    
    const after = this.memoryCache.size;
    if (before !== after) {
      console.log(`🧹 Cache nettoyé: ${before - after} entrées supprimées`);
    }
  }

  /**
   * Estimation de la taille des données
   */
  estimateSize(data) {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 1000; // Estimation par défaut
    }
  }

  /**
   * Préchargement intelligent basé sur les patterns d'utilisation
   */
  preloadOnHover(campaignId) {
    if (!campaignId) return;
    
    const keys = [
      this.generateKey('campaign', campaignId),
      this.generateKey('campaign_transactions', campaignId, { limit: 10 }),
    ];

    keys.forEach(key => {
      if (!this.memoryCache.has(key)) {
        this.scheduleRefresh(key, this.priorities.HIGH);
      }
    });
  }

  /**
   * Invalidation intelligente
   */
  invalidate(pattern) {
    const keysToDelete = [];
    
    for (const key of this.memoryCache.keys()) {
      if (typeof pattern === 'string' && key.includes(pattern)) {
        keysToDelete.push(key);
      } else if (pattern instanceof RegExp && pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.memoryCache.delete(key);
      
      // Supprimer aussi du cache persistant
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`livar_cache_${key}`);
      }
    });

    console.log(`🗑️ ${keysToDelete.length} entrées invalidées`);
  }

  /**
   * Invalidation spécifique à une campagne
   */
  invalidateCampaign(campaignAddress) {
    if (!campaignAddress) return;
    
    const patterns = [
      `campaign_${campaignAddress.toLowerCase()}`,
      `campaign_transactions_${campaignAddress.toLowerCase()}`,
      `campaign_investors_${campaignAddress.toLowerCase()}`
    ];

    patterns.forEach(pattern => this.invalidate(pattern));
  }

  /**
   * Statistiques détaillées
   */
  getStats() {
    const memoryUsage = Array.from(this.memoryCache.values())
      .reduce((total, cached) => total + (cached.size || 0), 0);

    const hitRate = this.stats.hits / Math.max(1, this.stats.hits + this.stats.misses);

    return {
      ...this.stats,
      memoryEntries: this.memoryCache.size,
      memoryUsage,
      hitRate: Math.round(hitRate * 100),
      circuitBreakerEntries: this.circuitBreaker.size,
      preloadQueueSize: this.preloadQueue.size,
      isPreloading: this.isPreloading
    };
  }

  /**
   * Nettoyage complet
   */
  clear() {
    this.memoryCache.clear();
    this.preloadQueue.clear();
    this.preloadBatch = [];
    this.circuitBreaker.clear();
    
    // Nettoyer le cache persistant
    if (typeof window !== 'undefined') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('livar_cache_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
    
    // Reset des stats
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      persistentHits: 0,
      rpcCalls: 0,
      errors: 0
    };
    
    console.log('🧹 Cache complètement nettoyé');
  }

  /**
   * Warmup du cache avec les données essentielles
   */
  async warmup(campaignIds = []) {
    console.log(`🔥 Warmup du cache pour ${campaignIds.length} campagnes`);
    
    try {
      // Précharger la liste des campagnes
      await this.scheduleRefresh('campaign_list_all', this.priorities.HIGH);
      
      // Précharger les promotions actives
      await this.scheduleRefresh('active_promotions_all', this.priorities.HIGH);
      
      // Précharger les campagnes spécifiées
      for (const campaignId of campaignIds.slice(0, 10)) { // Limiter à 10
        await this.scheduleRefresh(
          this.generateKey('campaign', campaignId), 
          this.priorities.HIGH
        );
      }
      
      console.log('🔥 Warmup terminé');
    } catch (error) {
      console.error('❌ Erreur warmup:', error);
    }
  }
}

// Instance singleton
const enhancedCache = new EnhancedBlockchainCache();

export default enhancedCache;
export { EnhancedBlockchainCache };