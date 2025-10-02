'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  RefreshCw, 
  Database, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  TrendingUp,
  Zap,
  Eye,
  Download
} from 'lucide-react';

/**
 * Panneau de debugging pour la synchronisation blockchain
 */
export default function SyncDebugPanel() {
  const [syncStatus, setSyncStatus] = useState(null);
  const [cacheStats, setCacheStats] = useState(null);
  const [monitorStats, setMonitorStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Charger les données initiales
  useEffect(() => {
    loadAllData();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadAllData();
    }, 5000); // Toutes les 5 secondes

    return () => clearInterval(interval);
  }, [autoRefresh]);

  /**
   * Charger toutes les données de debugging
   */
  const loadAllData = async () => {
    try {
      setIsLoading(true);

      // Charger le statut de synchronisation
      const syncResponse = await fetch('/api/campaigns/sync-now', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (syncResponse.ok) {
        const syncData = await syncResponse.json();
        setSyncStatus(syncData);
      }

      // Charger les stats du cache
      try {
        const { default: enhancedCache } = await import('@/lib/services/enhanced-cache-manager');
        const cacheData = enhancedCache.getStats();
        setCacheStats(cacheData);
      } catch (error) {
        console.warn('Impossible de charger les stats du cache:', error);
      }

      // Charger les stats du monitor
      try {
        const { default: syncMonitor } = await import('@/lib/services/sync-monitor');
        const monitorData = syncMonitor.getStats();
        const recentLogs = syncMonitor.getRecentLogs(100);
        const activeAlerts = syncMonitor.getActiveAlerts();
        
        setMonitorStats(monitorData);
        setLogs(recentLogs);
        setAlerts(activeAlerts);
      } catch (error) {
        console.warn('Impossible de charger les stats du monitor:', error);
      }

    } catch (error) {
      console.error('Erreur chargement données debug:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Déclencher une synchronisation manuelle
   */
  const triggerSync = async (force = false) => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/campaigns/sync-now', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Synchronisation réussie!\n${result.result.campaigns} campagnes, ${result.result.transactions} transactions, ${result.result.promotions} promotions`);
      } else {
        alert(`Erreur de synchronisation: ${result.error?.message || 'Erreur inconnue'}`);
      }

      // Recharger les données
      await loadAllData();

    } catch (error) {
      console.error('Erreur synchronisation:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Vider le cache
   */
  const clearCache = async () => {
    try {
      const { default: enhancedCache } = await import('@/lib/services/enhanced-cache-manager');
      enhancedCache.clear();
      alert('Cache vidé avec succès!');
      await loadAllData();
    } catch (error) {
      console.error('Erreur vidage cache:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  /**
   * Exporter les données de debug
   */
  const exportDebugData = async () => {
    try {
      const { default: syncMonitor } = await import('@/lib/services/sync-monitor');
      const debugData = {
        timestamp: new Date().toISOString(),
        syncStatus,
        cacheStats,
        monitorStats,
        logs: logs.slice(0, 200), // Limiter pour éviter les gros fichiers
        alerts
      };

      const blob = new Blob([JSON.stringify(debugData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `livar-debug-${new Date().toISOString().slice(0, 19)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Erreur export:', error);
      alert(`Erreur export: ${error.message}`);
    }
  };

  /**
   * Formater la durée
   */
  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  /**
   * Formater la date
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('fr-FR');
  };

  /**
   * Obtenir la couleur du badge selon le niveau
   */
  const getLevelColor = (level) => {
    const colors = {
      info: 'bg-blue-100 text-blue-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      critical: 'bg-red-200 text-red-900',
      alert: 'bg-purple-100 text-purple-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Debug Synchronisation Blockchain</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <Activity className="w-4 h-4 mr-2" />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAllData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportDebugData}
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Alertes actives */}
      {alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Alertes Actives ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <Badge className={getLevelColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <span className="ml-2">{alert.message}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(alert.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Actions Rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button
              onClick={() => triggerSync(false)}
              disabled={isLoading}
              className="flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Normale
            </Button>
            <Button
              onClick={() => triggerSync(true)}
              disabled={isLoading}
              variant="outline"
              className="flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Forcée
            </Button>
            <Button
              onClick={clearCache}
              disabled={isLoading}
              variant="outline"
              className="flex items-center"
            >
              <Database className="w-4 h-4 mr-2" />
              Vider Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Onglets de données */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
          <TabsTrigger value="sync">Synchronisation</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="database">Base de données</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Statut général */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Statut Général</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {syncStatus?.health?.isHealthy ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={syncStatus?.health?.isHealthy ? 'text-green-700' : 'text-red-700'}>
                    {syncStatus?.health?.isHealthy ? 'Système OK' : 'Problèmes détectés'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Dernière sync */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Dernière Sync</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      {syncStatus?.recentActivity?.updatedInLastHour || 0} mises à jour (1h)
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {syncStatus?.health?.lastSyncAge !== null 
                      ? `Il y a ${syncStatus.health.lastSyncAge} min`
                      : 'Jamais synchronisé'
                    }
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance cache */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Performance Cache</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">
                      {cacheStats?.hitRate || 0}% hit rate
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {cacheStats?.memoryEntries || 0} entrées en mémoire
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Métriques détaillées */}
          {monitorStats && (
            <Card>
              <CardHeader>
                <CardTitle>Métriques de Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {monitorStats.totalSyncs}
                    </div>
                    <div className="text-sm text-gray-500">Total Syncs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {monitorStats.successfulSyncs}
                    </div>
                    <div className="text-sm text-gray-500">Succès</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {monitorStats.failedSyncs}
                    </div>
                    <div className="text-sm text-gray-500">Échecs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatDuration(monitorStats.averageSyncTime)}
                    </div>
                    <div className="text-sm text-gray-500">Temps Moyen</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Synchronisation */}
        <TabsContent value="sync" className="space-y-4">
          {syncStatus && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>États de Synchronisation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {syncStatus.syncStates?.map((state) => (
                      <div key={state.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{state.id}</div>
                          <div className="text-sm text-gray-500">
                            Bloc: {state.last_block}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            {formatDate(state.updated_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activité Récente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium">Campagnes Récentes</div>
                      <div className="text-sm text-gray-600">
                        {syncStatus.recentActivity?.campaigns?.length || 0} campagnes
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Transactions Récentes</div>
                      <div className="text-sm text-gray-600">
                        {syncStatus.recentActivity?.transactions?.length || 0} transactions
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Cache */}
        <TabsContent value="cache" className="space-y-4">
          {cacheStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques du Cache</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Hits:</span>
                      <span className="font-mono">{cacheStats.hits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Misses:</span>
                      <span className="font-mono">{cacheStats.misses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hit Rate:</span>
                      <span className="font-mono">{cacheStats.hitRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Entrées Mémoire:</span>
                      <span className="font-mono">{cacheStats.memoryEntries}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Appels RPC:</span>
                      <span className="font-mono">{cacheStats.rpcCalls}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Erreurs:</span>
                      <span className="font-mono">{cacheStats.errors}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>État du Préchargement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>En cours:</span>
                      <span className={cacheStats.isPreloading ? 'text-green-600' : 'text-gray-500'}>
                        {cacheStats.isPreloading ? 'Oui' : 'Non'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Queue:</span>
                      <span className="font-mono">{cacheStats.preloadQueueSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Circuit Breaker:</span>
                      <span className="font-mono">{cacheStats.circuitBreakerEntries}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Logs Récents ({logs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                      <Badge className={getLevelColor(log.level)} variant="outline">
                        {log.level}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">{log.message}</div>
                        {log.data && (
                          <div className="text-xs text-gray-500 mt-1 font-mono">
                            {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Base de données */}
        <TabsContent value="database" className="space-y-4">
          {syncStatus?.database && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Campagnes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {syncStatus.database.campaigns}
                  </div>
                  <div className="text-sm text-gray-500">Total en base</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {syncStatus.database.transactions}
                  </div>
                  <div className="text-sm text-gray-500">Total en base</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Promotions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {syncStatus.database.promotions}
                  </div>
                  <div className="text-sm text-gray-500">Total en base</div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}