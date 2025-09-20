import { ethers } from 'ethers';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import RecPromotionManagerABI from '../../ABI/RecPromotionManagerABI.json';

// Configuration des contrats
const CONTRACTS = {
  base: {
    chainId: 8453,
    rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
    promotionManager: process.env.NEXT_PUBLIC_REC_PROMOTION_MANAGER_ADDRESS
  },
  baseSepolia: {
    chainId: 84532,
    rpcUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    promotionManager: '0x85cD8153659d61866F1e6CFdb9896f6195a707d2'
  }
};

// Mapping BoostType enum vers string
const BOOST_TYPE_MAPPING = {
  0: 'featured',
  1: 'trending', 
  2: 'spotlight'
};

export class PromotionListener {
  constructor(network = 'baseSepolia') {
    this.network = network;
    this.config = CONTRACTS[network];
    this.provider = null;
    this.contract = null;
    this.isListening = false;
  }

  /**
   * Initialiser la connexion
   */
  async initialize() {
    try {
    if (!this.config) {
      throw new Error(`Network ${this.network} not supported`);
    }

    if (!this.config.promotionManager) {
      throw new Error(`RecPromotionManager address not configured for ${this.network}`);
    }

    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Promotion listener disabled.');
      return false;
    }

      // Créer le provider
      this.provider = new ethers.providers.JsonRpcProvider(this.config.rpcUrl);
      
      // Créer l'instance du contrat
      this.contract = new ethers.Contract(
        this.config.promotionManager,
        RecPromotionManagerABI,
        this.provider
      );

      console.log(`✅ PromotionListener initialized for ${this.network}`);
      console.log(`📍 Contract: ${this.config.promotionManager}`);

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize PromotionListener:', error);
      return false;
    }
  }

  /**
   * Démarrer l'écoute des événements
   */
  async startListening() {
    if (!this.contract) {
      const initialized = await this.initialize();
      if (!initialized) return false;
    }

    if (this.isListening) {
      console.log('⚠️ Already listening for promotion events');
      return true;
    }

    try {
      // Écouter les événements CampaignPromoted
      this.contract.on('CampaignPromoted', this.handleCampaignPromoted.bind(this));
      
      // Écouter les événements PromotionExpired
      this.contract.on('PromotionExpired', this.handlePromotionExpired.bind(this));

      this.isListening = true;
      console.log('🎧 Started listening for promotion events');

      return true;
    } catch (error) {
      console.error('❌ Failed to start listening:', error);
      return false;
    }
  }

  /**
   * Arrêter l'écoute
   */
  stopListening() {
    if (this.contract && this.isListening) {
      this.contract.removeAllListeners('CampaignPromoted');
      this.contract.removeAllListeners('PromotionExpired');
      this.isListening = false;
      console.log('🔇 Stopped listening for promotion events');
    }
  }

  /**
   * Gérer l'événement CampaignPromoted
   */
  async handleCampaignPromoted(
    campaignAddress,
    creator,
    boostType,
    roundNumber,
    ethAmount,
    startTime,
    endTime,
    timestamp,
    event
  ) {
    try {
      console.log('🚀 New CampaignPromoted event:', {
        campaignAddress,
        creator,
        boostType: boostType.toString(),
        roundNumber: roundNumber.toString(),
        ethAmount: ethers.utils.formatEther(ethAmount),
        event: event.transactionHash
      });

      // Préparer les données pour Supabase
      const promotionData = {
        campaign_address: campaignAddress.toLowerCase(),
        creator: creator.toLowerCase(),
        boost_type: BOOST_TYPE_MAPPING[boostType.toNumber()],
        round_number: roundNumber.toNumber(),
        eth_amount: ethers.utils.formatEther(ethAmount),
        start_timestamp: new Date(startTime.toNumber() * 1000).toISOString(),
        end_timestamp: new Date(endTime.toNumber() * 1000).toISOString(),
        created_at: new Date(timestamp.toNumber() * 1000).toISOString(),
        is_active: true,
        expired_at: null,
        tx_hash: event.transactionHash,
        block_number: event.blockNumber,
        network: this.network
      };

      // Insérer dans Supabase
      if (!supabase) return;

      const { data, error } = await supabase
        .from('campaign_promotions')
        .insert([promotionData])
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to insert promotion into Supabase:', error);
        return;
      }

      console.log('✅ Promotion inserted into Supabase:', data.id);

      // Émettre un événement pour rafraîchir l'UI
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('promotionUpdated', { 
          detail: { type: 'created', data: promotionData } 
        }));
      }

    } catch (error) {
      console.error('❌ Error handling CampaignPromoted:', error);
    }
  }

  /**
   * Gérer l'événement PromotionExpired
   */
  async handlePromotionExpired(campaignAddress, roundNumber, boostType, timestamp, event) {
    try {
      console.log('⏰ PromotionExpired event:', {
        campaignAddress,
        roundNumber: roundNumber.toString(),
        boostType: boostType.toString()
      });

      // Marquer comme expiré dans Supabase
      if (!supabase) return;

      const { data, error } = await supabase
        .from('campaign_promotions')
        .update({ 
          is_active: false,
          expired_at: new Date(timestamp.toNumber() * 1000).toISOString()
        })
        .eq('campaign_address', campaignAddress.toLowerCase())
        .eq('round_number', roundNumber.toNumber())
        .eq('boost_type', BOOST_TYPE_MAPPING[boostType.toNumber()])
        .eq('is_active', true);

      if (error) {
        console.error('❌ Failed to expire promotion in Supabase:', error);
        return;
      }

      console.log('✅ Promotion expired in Supabase');

      // Émettre un événement pour rafraîchir l'UI
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('promotionUpdated', { 
          detail: { type: 'expired', campaignAddress, roundNumber: roundNumber.toNumber() } 
        }));
      }

    } catch (error) {
      console.error('❌ Error handling PromotionExpired:', error);
    }
  }

  /**
   * Synchroniser les événements passés (lors de l'initialisation)
   */
  async syncPastEvents(fromBlock = 'earliest') {
    if (!this.contract) {
      console.error('❌ Contract not initialized');
      return false;
    }

    try {
      console.log(`🔍 Syncing past CampaignPromoted events from block ${fromBlock}...`);

      // Récupérer les événements passés
      const filter = this.contract.filters.CampaignPromoted();
      const events = await this.contract.queryFilter(filter, fromBlock);

      console.log(`📊 Found ${events.length} past promotion events`);

      // Traiter chaque événement
      for (const event of events) {
        const args = event.args;
        
        // Vérifier si l'événement existe déjà
        const { data: existing } = await supabase
          .from('campaign_promotions')
          .select('id')
          .eq('tx_hash', event.transactionHash)
          .single();

        if (!existing) {
          await this.handleCampaignPromoted(...args, event);
          // Attendre un peu pour éviter de surcharger Supabase
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log('✅ Past events sync completed');
      return true;

    } catch (error) {
      console.error('❌ Error syncing past events:', error);
      return false;
    }
  }

  /**
   * Obtenir le statut
   */
  getStatus() {
    return {
      network: this.network,
      isListening: this.isListening,
      contractAddress: this.config?.promotionManager,
      isInitialized: !!this.contract
    };
  }
}

// Instance globale
let globalListener = null;

/**
 * Obtenir l'instance globale du listener
 */
export function getPromotionListener(network = 'baseSepolia') {
  if (!globalListener || globalListener.network !== network) {
    globalListener = new PromotionListener(network);
  }
  return globalListener;
}

/**
 * Initialiser et démarrer l'écoute automatiquement
 */
export async function initializePromotionListener(network = 'baseSepolia') {
  const listener = getPromotionListener(network);
  
  const success = await listener.startListening();
  if (success) {
    // Synchroniser les événements passés (dernières 24h)
    const oneDayAgo = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
    const fromBlock = Math.max(0, await listener.provider.getBlockNumber() - 7200); // ~24h de blocs
    await listener.syncPastEvents(fromBlock);
  }
  
  return listener;
}
