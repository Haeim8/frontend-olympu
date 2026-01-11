/**
 * =============================================================================
 * CACHE CLIENT INTELLIGENT - LIVAR
 * =============================================================================
 * 
 * Cache localStorage avec Redis backend pour persistance et synchronisation
 * Évite les rechargements inutiles depuis la blockchain
 * =============================================================================
 */

class ClientCache {
  constructor() {
    this.prefix = 'livar_cache_';
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
    this.memoryCache = new Map();
  }

  // =============================================================================
  // UTILITAIRES
  // =============================================================================

  getKey(key) {
    return `${this.prefix}${key}`;
  }

  isExpired(timestamp, ttl = this.defaultTTL) {
    return Date.now() - timestamp > ttl;
  }

  // =============================================================================
  // OPÉRATIONS CACHE
  // =============================================================================

  /**
   * Récupérer depuis le cache (localStorage → mémoire)
   */
  get(key, ttl = this.defaultTTL) {
    // 1. Vérifier cache mémoire d'abord
    const memData = this.memoryCache.get(key);
    if (memData && !this.isExpired(memData.timestamp, ttl)) {
      return memData.data;
    }

    // 2. Vérifier localStorage
    try {
      const stored = localStorage.getItem(this.getKey(key));
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!this.isExpired(parsed.timestamp, ttl)) {
          // Mettre en cache mémoire
          this.memoryCache.set(key, parsed);
          return parsed.data;
        }
        // Nettoyer l'ancienne donnée
        localStorage.removeItem(this.getKey(key));
      }
    } catch (error) {
      console.warn('[Cache] Erreur localStorage:', error);
    }

    return null;
  }

  /**
   * Stocker dans le cache (localStorage + mémoire)
   */
  set(key, data, ttl = this.defaultTTL) {
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl
    };

    // 1. Stocker en mémoire
    this.memoryCache.set(key, cacheData);

    // 2. Stocker dans localStorage
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(cacheData));
    } catch (error) {
      console.warn('[Cache] Erreur localStorage:', error);
    }

    return true;
  }

  /**
   * Supprimer du cache
   */
  delete(key) {
    this.memoryCache.delete(key);
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.warn('[Cache] Erreur suppression localStorage:', error);
    }
    return true;
  }

  /**
   * Vider tout le cache
   */
  clear() {
    this.memoryCache.clear();
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('[Cache] Erreur vidage localStorage:', error);
    }
    return true;
  }

  // =============================================================================
  // FONCTIONS SPÉCIFIQUES CAMPAGNES
  // =============================================================================

  /**
   * Récupérer la liste des campagnes
   */
  getCampaigns() {
    return this.get('campaigns_list', 2 * 60 * 1000); // 2 minutes
  }

  /**
   * Stocker la liste des campagnes
   */
  setCampaigns(campaigns) {
    return this.set('campaigns_list', campaigns, 2 * 60 * 1000);
  }

  /**
   * Récupérer une campagne spécifique
   */
  getCampaign(address) {
    return this.get(`campaign_${address?.toLowerCase()}`, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Stocker une campagne
   */
  setCampaign(address, campaign) {
    return this.set(`campaign_${address?.toLowerCase()}`, campaign, 5 * 60 * 1000);
  }

  /**
   * Invalider une campagne
   */
  invalidateCampaign(address) {
    this.delete(`campaign_${address?.toLowerCase()}`);
    // Forcer le rechargement de la liste
    this.delete('campaigns_list');
  }

  /**
   * Récupérer les transactions d'une campagne
   */
  getTransactions(campaignAddress) {
    return this.get(`transactions_${campaignAddress?.toLowerCase()}`, 60 * 1000); // 1 minute
  }

  /**
   * Stocker les transactions
   */
  setTransactions(campaignAddress, transactions) {
    return this.set(`transactions_${campaignAddress?.toLowerCase()}`, transactions, 60 * 1000);
  }

  /**
   * Récupérer les promotions actives
   */
  getPromotions() {
    return this.get('promotions_active', 60 * 1000); // 1 minute
  }

  /**
   * Stocker les promotions
   */
  setPromotions(promotions) {
    return this.set('promotions_active', promotions, 60 * 1000);
  }

  // =============================================================================
  // STATS ET DEBUG
  // =============================================================================

  /**
   * Obtenir les stats du cache
   */
  getStats() {
    const localStorageKeys = Object.keys(localStorage).filter(key => 
      key.startsWith(this.prefix)
    );

    return {
      memorySize: this.memoryCache.size,
      localStorageSize: localStorageKeys.length,
      totalSize: this.memoryCache.size + localStorageKeys.length,
      memoryKeys: Array.from(this.memoryCache.keys()),
      localStorageKeys: localStorageKeys.map(key => key.replace(this.prefix, ''))
    };
  }

  /**
   * Nettoyer les entrées expirées
   */
  cleanup() {
    const now = Date.now();
    
    // Nettoyer cache mémoire
    for (const [key, data] of this.memoryCache.entries()) {
      if (this.isExpired(data.timestamp, data.ttl)) {
        this.memoryCache.delete(key);
      }
    }

    // Nettoyer localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (this.isExpired(parsed.timestamp, parsed.ttl)) {
              localStorage.removeItem(key);
            }
          }
        }
      });
    } catch (error) {
      console.warn('[Cache] Erreur nettoyage localStorage:', error);
    }
  }
}

export const clientCache = new ClientCache();
export default clientCache;