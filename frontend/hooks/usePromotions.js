import { useState, useEffect } from 'react';
import { apiManager } from '../lib/services/api-manager';

export function usePromotions() {
  const [promotions, setPromotions] = useState([]);
  const [boostedCampaigns, setBoostedCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPromotions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [activePromotions] = await Promise.all([
        apiManager.getActivePromotions()
      ]);
      
      const boostedCampaigns = []; // Pas encore implémenté dans apiManager
      
      setPromotions(activePromotions);
      setBoostedCampaigns(boostedCampaigns);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching promotions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchPromotions, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    promotions,
    boostedCampaigns,
    isLoading,
    error,
    refetch: fetchPromotions
  };
}

export function useCampaignBoost(campaignAddress, roundNumber) {
  const [boostInfo, setBoostInfo] = useState({ isBoosted: false });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!campaignAddress || !roundNumber) return;

    const checkBoost = async () => {
      try {
        setIsLoading(true);
        const info = await apiManager.isCampaignBoosted(campaignAddress, roundNumber);
        setBoostInfo(info);
      } catch (err) {
        console.error('Error checking campaign boost:', err);
        setBoostInfo({ isBoosted: false });
      } finally {
        setIsLoading(false);
      }
    };

    checkBoost();
  }, [campaignAddress, roundNumber]);

  return { boostInfo, isLoading };
}