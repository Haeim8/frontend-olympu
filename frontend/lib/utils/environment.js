/**
 * Utilitaires de détection d'environnement pour Mini App vs Web App
 */

/**
 * Détecte si l'application s'exécute dans un contexte Mini App (Base App/Farcaster)
 * @returns {boolean} True si Mini App, false si Web App
 */
export function isMiniApp() {
  // Protection SSR
  if (typeof window === 'undefined') return false;
  
  try {
    // Méthode 1: Détection frame/iframe
    const inFrame = window.parent !== window && window.top !== window;
    
    // Méthode 2: User Agent Farcaster
    const userAgent = navigator.userAgent || '';
    const isFarcaster = userAgent.includes('Farcaster');
    
    // Méthode 3: User Agent Base App
    const isBaseApp = userAgent.includes('Base') || userAgent.includes('base-app');
    
    // Méthode 4: Paramètres URL spécifiques Mini App
    const urlParams = new URLSearchParams(window.location.search);
    const hasFrameParams = urlParams.has('frame') || urlParams.has('miniapp');
    
    // Méthode 5: Présence SDK Farcaster dans window
    const hasFarcasterSDK = typeof window.parent?.postMessage === 'function' && 
                           window.location !== window.parent?.location;
    
    // Méthode 6: Vérification domaine parent
    let parentDomain = null;
    try {
      parentDomain = window.parent?.location?.hostname;
    } catch (e) {
      // Cross-origin restrictions - probablement une frame
      parentDomain = 'cross-origin';
    }
    
    const isInCrossOriginFrame = parentDomain === 'cross-origin';
    
    // Résultat final
    const detected = inFrame || isFarcaster || isBaseApp || hasFrameParams || 
                    hasFarcasterSDK || isInCrossOriginFrame;
    
    // Debug en développement
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Environment Detection:', {
        inFrame,
        isFarcaster,
        isBaseApp, 
        hasFrameParams,
        hasFarcasterSDK,
        isInCrossOriginFrame,
        userAgent: userAgent.substring(0, 100),
        result: detected ? 'MINI_APP' : 'WEB_APP'
      });
    }
    
    return detected;
    
  } catch (error) {
    console.warn('Erreur détection environnement:', error);
    return false; // Fallback vers Web App
  }
}

/**
 * Détecte le type d'environnement détaillé
 * @returns {string} Type d'environnement
 */
export function getEnvironmentType() {
  if (typeof window === 'undefined') return 'SERVER';
  
  if (isMiniApp()) {
    const userAgent = navigator.userAgent || '';
    
    if (userAgent.includes('Farcaster')) return 'FARCASTER_FRAME';
    if (userAgent.includes('Base')) return 'BASE_APP';
    if (window.parent !== window) return 'IFRAME_EMBED';
    
    return 'MINI_APP_GENERIC';
  }
  
  return 'WEB_APP';
}

/**
 * Obtient les informations détaillées de l'environnement
 * @returns {object} Informations environnement
 */
export function getEnvironmentInfo() {
  if (typeof window === 'undefined') {
    return {
      type: 'SERVER',
      isMiniApp: false,
      isWebApp: false,
      isServer: true,
      details: {}
    };
  }
  
  const type = getEnvironmentType();
  const isMA = isMiniApp();
  
  return {
    type,
    isMiniApp: isMA,
    isWebApp: !isMA,
    isServer: false,
    details: {
      userAgent: navigator.userAgent,
      inFrame: window.parent !== window,
      referrer: document.referrer,
      origin: window.location.origin,
      search: window.location.search,
      timestamp: Date.now()
    }
  };
}

/**
 * Force l'environnement pour les tests (dev seulement)
 * @param {'miniapp'|'webapp'|null} type Type forcé ou null pour auto
 */
export function forceEnvironment(type) {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('forceEnvironment() disponible en développement uniquement');
    return;
  }
  
  if (typeof window !== 'undefined') {
    if (type === 'miniapp') {
      window.__LIVAR_FORCE_MINIAPP = true;
    } else if (type === 'webapp') {
      window.__LIVAR_FORCE_WEBAPP = true;
    } else {
      delete window.__LIVAR_FORCE_MINIAPP;
      delete window.__LIVAR_FORCE_WEBAPP;
    }
    
    // console.log('🔧 Environment forcé:', type || 'AUTO');
  }
}

/**
 * Version avec override pour tests
 */
export function isMiniAppWithOverride() {
  if (typeof window !== 'undefined') {
    if (window.__LIVAR_FORCE_MINIAPP) return true;
    if (window.__LIVAR_FORCE_WEBAPP) return false;
  }
  
  return isMiniApp();
}