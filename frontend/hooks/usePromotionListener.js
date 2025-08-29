import { useState, useEffect, useRef } from 'react';
import { getPromotionListener, initializePromotionListener } from '../lib/services/promotion-listener';

export function usePromotionListener(network = 'baseSepolia', autoStart = true) {
  const [status, setStatus] = useState({
    isListening: false,
    isInitialized: false,
    error: null,
    network: network
  });
  
  const [events, setEvents] = useState([]);
  const listenerRef = useRef(null);

  // Gestionnaire d'événements personnalisés
  useEffect(() => {
    const handlePromotionUpdate = (event) => {
      const { type, data, campaignAddress, roundNumber } = event.detail;
      
      setEvents(prev => {
        const newEvent = {
          type,
          timestamp: new Date(),
          ...(data || { campaignAddress, roundNumber })
        };
        
        // Garder seulement les 50 derniers événements
        return [newEvent, ...prev].slice(0, 50);
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('promotionUpdated', handlePromotionUpdate);
      
      return () => {
        window.removeEventListener('promotionUpdated', handlePromotionUpdate);
      };
    }
  }, []);

  // Initialisation du listener
  useEffect(() => {
    if (!autoStart) return;

    const initListener = async () => {
      try {
        setStatus(prev => ({ ...prev, error: null }));
        
        const listener = await initializePromotionListener(network);
        listenerRef.current = listener;
        
        setStatus({
          isListening: listener.isListening,
          isInitialized: !!listener.contract,
          error: null,
          network: listener.network
        });
        
      } catch (error) {
        console.error('Failed to initialize promotion listener:', error);
        setStatus(prev => ({
          ...prev,
          error: error.message
        }));
      }
    };

    initListener();

    // Cleanup au démontage
    return () => {
      if (listenerRef.current) {
        listenerRef.current.stopListening();
      }
    };
  }, [network, autoStart]);

  // Fonctions de contrôle
  const startListening = async () => {
    if (!listenerRef.current) {
      const listener = getPromotionListener(network);
      listenerRef.current = listener;
    }

    try {
      const success = await listenerRef.current.startListening();
      setStatus(prev => ({
        ...prev,
        isListening: success,
        isInitialized: !!listenerRef.current.contract,
        error: success ? null : 'Failed to start listening'
      }));
      
      return success;
    } catch (error) {
      setStatus(prev => ({ ...prev, error: error.message }));
      return false;
    }
  };

  const stopListening = () => {
    if (listenerRef.current) {
      listenerRef.current.stopListening();
      setStatus(prev => ({ ...prev, isListening: false }));
    }
  };

  const syncPastEvents = async (fromBlock = 'earliest') => {
    if (!listenerRef.current) return false;
    
    try {
      return await listenerRef.current.syncPastEvents(fromBlock);
    } catch (error) {
      console.error('Failed to sync past events:', error);
      setStatus(prev => ({ ...prev, error: error.message }));
      return false;
    }
  };

  const getListenerStatus = () => {
    return listenerRef.current ? listenerRef.current.getStatus() : status;
  };

  return {
    status,
    events,
    startListening,
    stopListening,
    syncPastEvents,
    getStatus: getListenerStatus,
    listener: listenerRef.current
  };
}

// Hook pour écouter les mises à jour des promotions
export function usePromotionUpdates() {
  const [lastUpdate, setLastUpdate] = useState(null);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    const handleUpdate = (event) => {
      setLastUpdate({
        type: event.detail.type,
        timestamp: new Date(),
        data: event.detail
      });
      setUpdateCount(prev => prev + 1);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('promotionUpdated', handleUpdate);
      
      return () => {
        window.removeEventListener('promotionUpdated', handleUpdate);
      };
    }
  }, []);

  return {
    lastUpdate,
    updateCount
  };
}