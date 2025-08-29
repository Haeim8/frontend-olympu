import { supabase, BOOST_TYPES, BOOST_PRIORITIES } from '../supabase/client';

export class PromotionService {
  
  /**
   * Récupérer toutes les promotions actives
   */
  static async getActivePromotions() {
    try {
      const { data, error } = await supabase
        .from('active_promotions')
        .select('*')
        .order('boost_type', { ascending: false });

      if (error) throw error;
      
      // Trier par priorité de boost
      return data.sort((a, b) => {
        const priorityA = BOOST_PRIORITIES[a.boost_type] || 0;
        const priorityB = BOOST_PRIORITIES[b.boost_type] || 0;
        return priorityB - priorityA;
      });
    } catch (error) {
      console.error('Error fetching active promotions:', error);
      return [];
    }
  }

  /**
   * Vérifier si une campagne est boostée
   */
  static async isCampaignBoosted(campaignAddress, roundNumber) {
    try {
      const { data, error } = await supabase
        .from('campaign_promotions')
        .select('boost_type, end_timestamp')
        .eq('campaign_address', campaignAddress)
        .eq('round_number', roundNumber)
        .eq('is_active', true)
        .gt('end_timestamp', new Date().toISOString())
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data ? {
        isBosted: true,
        boostType: data.boost_type,
        endTime: new Date(data.end_timestamp)
      } : { isBoosted: false };
    } catch (error) {
      console.error('Error checking campaign boost:', error);
      return { isBoosted: false };
    }
  }

  /**
   * Récupérer les campagnes boostées pour affichage prioritaire
   */
  static async getBoostedCampaigns() {
    try {
      const promotions = await this.getActivePromotions();
      
      // Grouper par campagne (garder le boost le plus élevé par campagne)
      const campaignBoosts = {};
      
      promotions.forEach(promo => {
        const key = `${promo.campaign_address}_${promo.round_number}`;
        if (!campaignBoosts[key] || 
            BOOST_PRIORITIES[promo.boost_type] > BOOST_PRIORITIES[campaignBoosts[key].boost_type]) {
          campaignBoosts[key] = promo;
        }
      });
      
      return Object.values(campaignBoosts);
    } catch (error) {
      console.error('Error fetching boosted campaigns:', error);
      return [];
    }
  }

  /**
   * Récupérer les analytics pour l'admin
   */
  static async getPromotionAnalytics(days = 30) {
    try {
      const { data, error } = await supabase
        .from('campaign_promotions')
        .select(`
          boost_type,
          eth_amount,
          created_at,
          campaign_address
        `)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Calculer les stats
      const stats = {
        totalPromotions: data.length,
        totalRevenue: data.reduce((sum, p) => sum + parseFloat(p.eth_amount), 0),
        byType: {
          featured: data.filter(p => p.boost_type === 'featured').length,
          trending: data.filter(p => p.boost_type === 'trending').length,
          spotlight: data.filter(p => p.boost_type === 'spotlight').length
        },
        revenueByType: {
          featured: data.filter(p => p.boost_type === 'featured').reduce((sum, p) => sum + parseFloat(p.eth_amount), 0),
          trending: data.filter(p => p.boost_type === 'trending').reduce((sum, p) => sum + parseFloat(p.eth_amount), 0),
          spotlight: data.filter(p => p.boost_type === 'spotlight').reduce((sum, p) => sum + parseFloat(p.eth_amount), 0)
        },
        uniqueCampaigns: new Set(data.map(p => p.campaign_address)).size
      };

      return stats;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return null;
    }
  }

  /**
   * Ajouter une nouvelle promotion (appelé par le backend listener)
   */
  static async addPromotion(promotionData) {
    try {
      const { data, error } = await supabase
        .from('campaign_promotions')
        .insert([promotionData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding promotion:', error);
      throw error;
    }
  }

  /**
   * Nettoyer les promotions expirées
   */
  static async cleanupExpiredPromotions() {
    try {
      const { data, error } = await supabase
        .from('campaign_promotions')
        .update({ 
          is_active: false,
          expired_at: new Date().toISOString()
        })
        .eq('is_active', true)
        .lt('end_timestamp', new Date().toISOString());

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error cleaning up promotions:', error);
      throw error;
    }
  }
}

// Helper pour les badges UI
export const getBoostBadge = (boostType) => {
  switch (boostType) {
    case BOOST_TYPES.FEATURED:
      return { emoji: '🔥', label: 'Featured', color: 'bg-orange-500' };
    case BOOST_TYPES.TRENDING:
      return { emoji: '⭐', label: 'Trending', color: 'bg-blue-500' };
    case BOOST_TYPES.SPOTLIGHT:
      return { emoji: '💎', label: 'Spotlight', color: 'bg-purple-500' };
    default:
      return null;
  }
};