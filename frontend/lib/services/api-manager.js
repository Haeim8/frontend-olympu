/**
 * Gestionnaire centralisé des appels API - Version Firebase uniquement
 */

class ApiManager {
  constructor() {
    // Simple manager pour Firebase seulement
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
    // Retourner liste vide pour maintenant - pas de blockchain
    return [];
  }

  async getCampaignData(campaignAddress, useCache = true) {
    // Pas de données blockchain pour maintenant
    return null;
  }

  async getCampaignInvestors(campaignAddress, useCache = true) {
    // Pas de données blockchain pour maintenant
    return [];
  }

  async getCampaignTransactions(campaignAddress, useCache = true) {
    // Pas de données blockchain pour maintenant
    return [];
  }

  async getUserInvestments(userAddress) {
    // Pas de données blockchain pour maintenant
    return [];
  }

  // === UTILITAIRES ===
  
  formatEthValue(value) {
    if (!value) return "0";
    return "0";
  }

  clearCache() {
    // Pas de cache pour maintenant
  }

  invalidateCache(pattern) {
    // Pas de cache pour maintenant
  }

  getCacheStats() {
    return { size: 0 };
  }
}

// Instance singleton
export const apiManager = new ApiManager();
export default apiManager;