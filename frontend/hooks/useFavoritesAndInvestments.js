import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { apiManager } from '@/lib/services/api-manager';

/**
 * Hook personnalisé pour gérer les favoris et les investissements
 * - Favoris: stockés dans localStorage, ajoutés/retirés manuellement
 * - Investissements: détectés automatiquement via les transactions blockchain
 */
export function useFavoritesAndInvestments() {
  const { address } = useAccount();
  const [favorites, setFavorites] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [isLoadingInvestments, setIsLoadingInvestments] = useState(false);

  // Charger les favoris depuis localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('livar_favorites');
    if (savedFavorites) {
      try {
        const parsed = JSON.parse(savedFavorites);
        setFavorites(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error('Erreur lors du chargement des favoris:', error);
        setFavorites([]);
      }
    }
  }, []);

  // Charger les investissements depuis la blockchain
  useEffect(() => {
    if (!address) {
      setInvestments([]);
      return;
    }

    const loadUserInvestments = async () => {
      setIsLoadingInvestments(true);
      try {
        // Récupérer toutes les campagnes
        const allCampaigns = await apiManager.getAllCampaigns();
        const userInvestments = [];

        // Pour chaque campagne, vérifier si l'utilisateur a investi
        for (const campaignAddress of allCampaigns) {
          try {
            // Récupérer les transactions de cette campagne
            const response = await fetch(`/api/campaigns/${campaignAddress.toLowerCase()}/transactions`);

            if (response.ok) {
              const data = await response.json();
              const transactions = data.transactions || [];

              // Vérifier si l'utilisateur a des transactions d'achat dans cette campagne
              const hasInvested = transactions.some(
                tx => tx.investor?.toLowerCase() === address.toLowerCase() &&
                      tx.type === 'Achat' &&
                      tx.shares > 0
              );

              if (hasInvested) {
                userInvestments.push(campaignAddress.toLowerCase());
              }
            }
          } catch (error) {
            // Ignorer silencieusement les erreurs pour les campagnes individuelles
            console.debug(`Impossible de charger les transactions pour ${campaignAddress}:`, error.message);
          }
        }

        setInvestments(userInvestments);
      } catch (error) {
        console.error('Erreur lors du chargement des investissements:', error);
        setInvestments([]);
      } finally {
        setIsLoadingInvestments(false);
      }
    };

    loadUserInvestments();
  }, [address]);

  // Ajouter/retirer un favori
  const toggleFavorite = useCallback((campaignAddress) => {
    const normalized = campaignAddress.toLowerCase();

    setFavorites(prev => {
      const isCurrentlyFavorite = prev.includes(normalized);
      const newFavorites = isCurrentlyFavorite
        ? prev.filter(id => id !== normalized)
        : [...prev, normalized];

      // Sauvegarder dans localStorage
      localStorage.setItem('livar_favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  // Vérifier si une campagne est favorite
  const isFavorite = useCallback((campaignAddress) => {
    return favorites.includes(campaignAddress?.toLowerCase());
  }, [favorites]);

  // Vérifier si l'utilisateur a investi dans une campagne
  const hasInvested = useCallback((campaignAddress) => {
    return investments.includes(campaignAddress?.toLowerCase());
  }, [investments]);

  // Obtenir toutes les campagnes suivies (favoris + investissements, sans doublons)
  const getTrackedCampaigns = useCallback(() => {
    const tracked = new Set([...favorites, ...investments]);
    return Array.from(tracked);
  }, [favorites, investments]);

  return {
    favorites,
    investments,
    isLoadingInvestments,
    toggleFavorite,
    isFavorite,
    hasInvested,
    getTrackedCampaigns,
  };
}
