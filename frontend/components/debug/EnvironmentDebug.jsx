'use client';

import React, { useState } from 'react';
import { useEnvironment, useEnvironmentOverride } from '../../hooks/useEnvironment';
import { forceEnvironment } from '../../lib/utils/environment';

/**
 * Composant de debug pour tester la détection d'environnement
 * À afficher uniquement en développement
 */
export default function EnvironmentDebug() {
  const environment = useEnvironment();
  const [override, setOverride] = useState('auto');
  const overriddenEnv = useEnvironmentOverride(override);

  // Ne s'affiche qu'en développement
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleOverrideChange = (newOverride) => {
    setOverride(newOverride);
    forceEnvironment(newOverride === 'auto' ? null : newOverride);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/90 text-white p-4 rounded-lg shadow-xl max-w-sm text-xs font-mono">
      <div className="mb-2">
        <h3 className="text-yellow-400 font-bold mb-1">🔍 Environment Debug</h3>
        
        {/* État actuel */}
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${
              environment.isLoading 
                ? 'bg-yellow-500' 
                : environment.isMiniApp 
                  ? 'bg-blue-500' 
                  : 'bg-green-500'
            }`}></span>
            <span className="text-white font-semibold">
              {environment.isLoading 
                ? 'LOADING...' 
                : environment.isMiniApp 
                  ? 'MINI APP' 
                  : 'WEB APP'
              }
            </span>
          </div>
          
          {environment.details && (
            <div className="text-gray-300 text-[10px]">
              Type: {environment.details.type}<br/>
              Frame: {environment.details.details?.inFrame ? 'Yes' : 'No'}<br/>
              UA: {environment.details.details?.userAgent?.substring(0, 20)}...
            </div>
          )}
        </div>

        {/* Contrôles override */}
        <div className="border-t border-gray-600 pt-2">
          <div className="mb-1 text-gray-400">Override (dev only):</div>
          <div className="flex gap-1">
            {['auto', 'webapp', 'miniapp'].map(type => (
              <button
                key={type}
                onClick={() => handleOverrideChange(type)}
                className={`px-2 py-1 rounded text-[10px] transition-colors ${
                  override === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
          
          {overriddenEnv.isOverridden && (
            <div className="mt-1 text-yellow-400 text-[10px]">
              ⚠ Override actif: {overriddenEnv.forcedType}
            </div>
          )}
        </div>

        {/* Infos détaillées */}
        <details className="mt-2 text-[9px]">
          <summary className="cursor-pointer text-gray-400 hover:text-white">
            Détails techniques
          </summary>
          <pre className="mt-1 text-[8px] text-gray-400 overflow-hidden">
            {JSON.stringify(environment.details, null, 1)}
          </pre>
        </details>
      </div>
    </div>
  );
}

/**
 * Version compacte pour la barre de statut
 */
export function EnvironmentIndicator() {
  const { isMiniApp, isLoading } = useEnvironment();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/75 text-white px-2 py-1 rounded text-xs font-mono">
      {isLoading ? (
        <span className="text-yellow-400">🔄 ENV</span>
      ) : (
        <span className={isMiniApp ? 'text-blue-400' : 'text-green-400'}>
          {isMiniApp ? '📱 MINI' : '🌐 WEB'}
        </span>
      )}
    </div>
  );
}