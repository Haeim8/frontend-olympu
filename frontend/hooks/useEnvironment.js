import { useState, useEffect } from 'react';
import { isMiniAppWithOverride, getEnvironmentInfo } from '../lib/utils/environment';

/**
 * Hook pour détecter l'environnement d'exécution (Mini App vs Web App)
 * @returns {object} Informations sur l'environnement
 */
export function useEnvironment() {
  const [environment, setEnvironment] = useState({
    type: 'loading',
    isMiniApp: false,
    isWebApp: false,
    isLoading: true,
    details: null
  });

  useEffect(() => {
    // Attendre que le DOM soit complètement chargé
    const detectEnvironment = () => {
      try {
        const envInfo = getEnvironmentInfo();
        const isMini = isMiniAppWithOverride();
        
        setEnvironment({
          type: isMini ? 'miniapp' : 'webapp',
          isMiniApp: isMini,
          isWebApp: !isMini,
          isLoading: false,
          details: envInfo
        });

        // Debug log
        if (process.env.NODE_ENV === 'development') {
          console.log('🎯 Environment détecté:', {
            type: isMini ? 'MINI_APP' : 'WEB_APP',
            details: envInfo
          });
        }

      } catch (error) {
        console.error('Erreur détection environnement:', error);
        
        // Fallback sécurisé vers Web App
        setEnvironment({
          type: 'webapp',
          isMiniApp: false,
          isWebApp: true,
          isLoading: false,
          details: { error: error.message }
        });
      }
    };

    // Détecter immédiatement si possible
    if (document.readyState === 'complete') {
      detectEnvironment();
    } else {
      // Sinon attendre le chargement complet
      window.addEventListener('load', detectEnvironment);
      
      // Timeout de sécurité après 2 secondes
      const timeout = setTimeout(detectEnvironment, 2000);
      
      return () => {
        window.removeEventListener('load', detectEnvironment);
        clearTimeout(timeout);
      };
    }
  }, []);

  return environment;
}

/**
 * Hook simplifié qui retourne juste si on est dans une Mini App
 * @returns {boolean|null} True si Mini App, false si Web App, null si loading
 */
export function useIsMiniApp() {
  const { isMiniApp, isLoading } = useEnvironment();
  return isLoading ? null : isMiniApp;
}

/**
 * Hook pour forcer un environnement en développement
 * @param {'miniapp'|'webapp'|'auto'} forcedType Type forcé
 */
export function useEnvironmentOverride(forcedType = 'auto') {
  const [overridden, setOverridden] = useState(false);
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && forcedType !== 'auto') {
      if (typeof window !== 'undefined') {
        if (forcedType === 'miniapp') {
          window.__LIVAR_FORCE_MINIAPP = true;
          delete window.__LIVAR_FORCE_WEBAPP;
        } else if (forcedType === 'webapp') {
          window.__LIVAR_FORCE_WEBAPP = true;
          delete window.__LIVAR_FORCE_MINIAPP;
        }
        setOverridden(true);
        
        console.log('🔧 Environment override activé:', forcedType);
      }
    } else {
      // Nettoyer les overrides
      if (typeof window !== 'undefined') {
        delete window.__LIVAR_FORCE_MINIAPP;
        delete window.__LIVAR_FORCE_WEBAPP;
      }
      setOverridden(false);
    }
  }, [forcedType]);
  
  const { environment } = useEnvironment();
  
  return {
    ...environment,
    isOverridden: overridden,
    forcedType: forcedType !== 'auto' ? forcedType : null
  };
}