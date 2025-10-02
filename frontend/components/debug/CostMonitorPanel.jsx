'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * PANNEAU DE SURVEILLANCE DES COÛTS
 * Surveille et contrôle les coûts RPC
 */
export default function CostMonitorPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [costEstimate, setCostEstimate] = useState(null);

  // Charger les statistiques
  const loadStats = async () => {
    try {
      const response = await fetch('/api/campaigns/sync-direct?action=missing');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.result);
        
        // Calculer l'estimation des coûts
        const estimate = {
          directCalls: data.result.total * 2, // 2 appels par campagne (données + transactions)
          oldSystemCalls: data.result.total * 1000, // Estimation ancien système
          savings: Math.round((1 - (data.result.total * 2) / (data.result.total * 1000)) * 100)
        };
        setCostEstimate(estimate);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  // Synchronisation économique
  const runEconomicSync = async (action = 'sync') => {
    setLoading(true);
    try {
      const response = await fetch('/api/campaigns/sync-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLastSync(data);
        await loadStats(); // Recharger les stats
      } else {
        console.error('Erreur sync:', data.error);
      }
    } catch (error) {
      console.error('Erreur sync:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Alerte économique */}
      <Alert className="border-green-200 bg-green-50">
        <AlertDescription className="text-green-800">
          <strong>💰 SYSTÈME ÉCONOMIQUE ACTIVÉ</strong><br />
          Ce nouveau système interroge directement les contrats individuels au lieu de scanner toute la blockchain.
          Économie estimée : {costEstimate?.savings || 99}% des coûts RPC !
        </AlertDescription>
      </Alert>

      {/* Statistiques des coûts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              💰 Système Économique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {costEstimate?.directCalls || 0}
            </div>
            <p className="text-xs text-green-600">appels RPC nécessaires</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              🔥 Ancien Système
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {costEstimate?.oldSystemCalls?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-red-600">appels RPC (évités !)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">
              📊 Économies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {costEstimate?.savings || 99}%
            </div>
            <p className="text-xs text-blue-600">de coûts économisés</p>
          </CardContent>
        </Card>
      </div>

      {/* État de la base de données */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 État de la Base de Données
              <Badge variant="outline">
                {stats.inDatabase}/{stats.total} campagnes
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-lg font-semibold">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Blockchain</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{stats.inDatabase}</div>
                <div className="text-sm text-gray-600">En Base</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-orange-600">{stats.missing}</div>
                <div className="text-sm text-gray-600">Manquantes</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">
                  {Math.round((stats.inDatabase / stats.total) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Complétude</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions de synchronisation */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Actions Économiques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => runEconomicSync('missing')}
              disabled={loading}
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              🔍 Vérifier Données Manquantes
            </Button>
            
            <Button
              onClick={() => runEconomicSync('sync')}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              💰 Sync Économique Complète
            </Button>
            
            <Button
              onClick={loadStats}
              disabled={loading}
              variant="outline"
            >
              🔄 Actualiser Stats
            </Button>
          </div>
          
          {loading && (
            <div className="mt-4 text-sm text-gray-600">
              ⏳ Synchronisation en cours... (mode économique)
            </div>
          )}
        </CardContent>
      </Card>

      {/* Résultat de la dernière synchronisation */}
      {lastSync && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ✅ Dernière Synchronisation
              <Badge variant="outline">
                {new Date(lastSync.timestamp).toLocaleTimeString()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Campagnes traitées:</span>
                <Badge>{lastSync.result?.campaigns || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Transactions récupérées:</span>
                <Badge>{lastSync.result?.transactions || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Coût estimé:</span>
                <Badge className="bg-green-100 text-green-800">
                  {lastSync.cost_estimate || 'Économique !'}
                </Badge>
              </div>
              {lastSync.result?.errors && lastSync.result.errors.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-medium text-red-600">
                    ⚠️ {lastSync.result.errors.length} erreurs:
                  </div>
                  <div className="text-xs text-red-500 mt-1">
                    {lastSync.result.errors.slice(0, 3).map((error, i) => (
                      <div key={i}>• {error.campaign || error.type}: {error.error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guide d'utilisation */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Guide d'Utilisation Économique</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div><strong>💰 Sync Économique:</strong> Interroge directement chaque contrat (2 appels RPC par campagne)</div>
            <div><strong>🔍 Vérifier Manquantes:</strong> Compare blockchain vs base de données (1 appel RPC)</div>
            <div><strong>⚠️ Éviter:</strong> L'ancien système qui scanne toute la blockchain (1000+ appels RPC)</div>
            <div><strong>💡 Recommandation:</strong> Utiliser la sync économique 1-2 fois par jour maximum</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}