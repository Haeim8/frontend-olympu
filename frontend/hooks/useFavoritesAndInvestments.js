import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { apiManager } from '@/lib/services/api-manager';

const FAVORITES_KEY = 'livar_favorites';

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

  // Charger les favoris depuis localStorage (avec guard SSR)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedFavorites = window.localStorage.getItem(FAVORITES_KEY);
      if (savedFavorites) {
        const parsed = JSON.parse(savedFavorites);
        setFavorites(Array.isArray(parsed) ? parsed : []);
        console.log('[Favorites] Chargés depuis localStorage:', parsed);
      }
    } catch (error) {
      console.error('[Favorites] Erreur lors du chargement:', error);
      setFavorites([]);
    }
  }, []);

  // Charger les investissements depuis l'API
  useEffect(() => {
    if (!address) {
      setInvestments([]);
      return;
    }

    const loadUserInvestments = async () => {
      setIsLoadingInvestments(true);
      try {
        // Utiliser l'API getUserInvestments qui récupère les investissements de l'utilisateur
        const userInvestmentsData = await apiManager.getUserInvestments(address);

        // Extraire les adresses des campagnes dans lesquelles l'utilisateur a investi
        const investedCampaigns = [];

        if (Array.isArray(userInvestmentsData)) {
          userInvestmentsData.forEach(inv => {
            if (inv.campaignAddress) {
              investedCampaigns.push(inv.campaignAddress.toLowerCase());
            }
          });
        }

        console.log('[Investments] Campagnes investies:', investedCampaigns);
        setInvestments(investedCampaigns);
      } catch (error) {
        console.error('[Investments] Erreur lors du chargement:', error);
        setInvestments([]);
      } finally {
        setIsLoadingInvestments(false);
      }
    };

    loadUserInvestments();
  }, [address]);

  // Ajouter/retirer un favori
  const toggleFavorite = useCallback((campaignAddress) => {
    if (!campaignAddress) return;

    const normalized = campaignAddress.toLowerCase();
    console.log('[Favorites] Toggle:', normalized);

    setFavorites(prev => {
      const isCurrentlyFavorite = prev.includes(normalized);
      const newFavorites = isCurrentlyFavorite
        ? prev.filter(id => id !== normalized)
        : [...prev, normalized];

      // Sauvegarder dans localStorage
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
          console.log('[Favorites] Sauvegardé:', newFavorites);
        } catch (error) {
          console.error('[Favorites] Erreur sauvegarde:', error);
        }
      }

      return newFavorites;
    });
  }, []);

  // Vérifier si une campagne est favorite
  const isFavorite = useCallback((campaignAddress) => {
    if (!campaignAddress) return false;
    return favorites.includes(campaignAddress.toLowerCase());
  }, [favorites]);

  // Vérifier si l'utilisateur a investi dans une campagne
  const hasInvested = useCallback((campaignAddress) => {
    if (!campaignAddress) return false;
    return investments.includes(campaignAddress.toLowerCase());
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
