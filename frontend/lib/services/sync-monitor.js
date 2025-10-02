/**
 * Système de monitoring et debugging pour la synchronisation blockchain
 */

class SyncMonitor {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.metrics = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      totalCampaigns: 0,
      totalTransactions: 0,
      totalPromotions: 0,
      averageSyncTime: 0,
      lastSyncTime: null,
      errors: []
    };
    
    this.alerts = [];
    this.thresholds = {
      maxSyncTime: 300000, // 5 minutes
      maxErrorRate: 0.1,   // 10%
      maxConsecutiveFailures: 3
    };
    
    this.consecutiveFailures = 0;
    this.isMonitoring = false;
  }

  /**
   * Démarrer le monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.log('info', 'Monitoring démarré');
    
    // Vérification périodique de la santé du système
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Toutes les minutes
    
    // Nettoyage périodique des logs
    this.cleanupInterval = setInterval(() => {
      this.cleanupLogs();
    }, 300000); // Toutes les 5 minutes
  }

  /**
   * Arrêter le monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.log('info', 'Monitoring arrêté');
  }

  /**
   * Logger un événement
   */
  log(level, message, data = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      id: Date.now() + Math.random()
    };
    
    this.logs.unshift(logEntry);
    
    // Limiter le nombre de logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    
    // Console log pour le développement
    if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
      const emoji = this.getLevelEmoji(level);
      console.log(`${emoji} [SyncMonitor] ${message}`, data || '');
    }
    
    // Déclencher des alertes si nécessaire
    if (level === 'error') {
      this.handleError(message, data);
    }
  }

  /**
   * Enregistrer le début d'une synchronisation
   */
  startSync(type = 'full') {
    const syncId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.log('info', `Début de synchronisation ${type}`, { syncId, type });
    
    return {
      syncId,
      startTime: Date.now(),
      type
    };
  }

  /**
   * Enregistrer la fin d'une synchronisation
   */
  endSync(syncSession, result) {
    const endTime = Date.now();
    const duration = endTime - syncSession.startTime;
    
    this.metrics.totalSyncs++;
    
    if (result.success !== false) {
      this.metrics.successfulSyncs++;
      this.consecutiveFailures = 0;
      
      // Mettre à jour les métriques
      this.metrics.totalCampaigns += result.campaigns || 0;
      this.metrics.totalTransactions += result.transactions || 0;
      this.metrics.totalPromotions += result.promotions || 0;
      this.metrics.lastSyncTime = endTime;
      
      // Calculer le temps moyen
      this.updateAverageSyncTime(duration);
      
      this.log('success', `Synchronisation ${syncSession.type} terminée`, {
        syncId: syncSession.syncId,
        duration: `${duration}ms`,
        result
      });
      
    } else {
      this.metrics.failedSyncs++;
      this.consecutiveFailures++;
      
      this.log('error', `Synchronisation ${syncSession.type} échouée`, {
        syncId: syncSession.syncId,
        duration: `${duration}ms`,
        error: result.error
      });
    }
    
    // Vérifier les seuils d'alerte
    this.checkThresholds(duration);
  }

  /**
   * Enregistrer une erreur
   */
  handleError(message, data) {
    this.metrics.errors.push({
      timestamp: new Date().toISOString(),
      message,
      data
    });
    
    // Garder seulement les 100 dernières erreurs
    if (this.metrics.errors.length > 100) {
      this.metrics.errors = this.metrics.errors.slice(-100);
    }
    
    // Créer une alerte si nécessaire
    this.createAlert('error', message, data);
  }

  /**
   * Vérifier les seuils d'alerte
   */
  checkThresholds(lastSyncDuration) {
    // Temps de synchronisation trop long
    if (lastSyncDuration > this.thresholds.maxSyncTime) {
      this.createAlert('warning', `Synchronisation lente: ${lastSyncDuration}ms`, {
        threshold: this.thresholds.maxSyncTime,
        actual: lastSyncDuration
      });
    }
    
    // Taux d'erreur trop élevé
    const errorRate = this.metrics.totalSyncs > 0 
      ? this.metrics.failedSyncs / this.metrics.totalSyncs 
      : 0;
    
    if (errorRate > this.thresholds.maxErrorRate) {
      this.createAlert('critical', `Taux d'erreur élevé: ${Math.round(errorRate * 100)}%`, {
        threshold: this.thresholds.maxErrorRate,
        actual: errorRate,
        failedSyncs: this.metrics.failedSyncs,
        totalSyncs: this.metrics.totalSyncs
      });
    }
    
    // Échecs consécutifs
    if (this.consecutiveFailures >= this.thresholds.maxConsecutiveFailures) {
      this.createAlert('critical', `${this.consecutiveFailures} échecs consécutifs`, {
        consecutiveFailures: this.consecutiveFailures,
        threshold: this.thresholds.maxConsecutiveFailures
      });
    }
  }

  /**
   * Créer une alerte
   */
  createAlert(severity, message, data) {
    const alert = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      severity,
      message,
      data,
      acknowledged: false
    };
    
    this.alerts.unshift(alert);
    
    // Garder seulement les 50 dernières alertes
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(0, 50);
    }
    
    this.log('alert', `Alerte ${severity}: ${message}`, data);
  }

  /**
   * Acquitter une alerte
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
    }
  }

  /**
   * Vérification de santé du système
   */
  async performHealthCheck() {
    try {
      const healthData = await this.checkSystemHealth();
      
      if (!healthData.isHealthy) {
        this.createAlert('warning', 'Système en mauvaise santé', healthData);
      }
      
      this.log('info', 'Vérification de santé effectuée', healthData);
      
    } catch (error) {
      this.log('error', 'Erreur lors de la vérification de santé', error);
    }
  }

  /**
   * Vérifier la santé du système
   */
  async checkSystemHealth() {
    const health = {
      timestamp: new Date().toISOString(),
      isHealthy: true,
      issues: []
    };
    
    try {
      // Vérifier la base de données
      const dbHealth = await this.checkDatabaseHealth();
      health.database = dbHealth;
      
      if (!dbHealth.isHealthy) {
        health.isHealthy = false;
        health.issues.push('Base de données inaccessible');
      }
      
      // Vérifier le cache
      const cacheHealth = await this.checkCacheHealth();
      health.cache = cacheHealth;
      
      if (!cacheHealth.isHealthy) {
        health.isHealthy = false;
        health.issues.push('Cache en mauvais état');
      }
      
      // Vérifier la synchronisation
      const syncHealth = this.checkSyncHealth();
      health.sync = syncHealth;
      
      if (!syncHealth.isHealthy) {
        health.isHealthy = false;
        health.issues.push('Synchronisation en retard');
      }
      
    } catch (error) {
      health.isHealthy = false;
      health.issues.push(`Erreur vérification: ${error.message}`);
    }
    
    return health;
  }

  /**
   * Vérifier la santé de la base de données
   */
  async checkDatabaseHealth() {
    try {
      // Test de connexion simple
      const response = await fetch('/api/cron/sync-blockchain', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          isHealthy: data.health?.database !== false,
          lastCheck: new Date().toISOString(),
          details: data.database || {}
        };
      } else {
        return {
          isHealthy: false,
          lastCheck: new Date().toISOString(),
          error: `HTTP ${response.status}`
        };
      }
      
    } catch (error) {
      return {
        isHealthy: false,
        lastCheck: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Vérifier la santé du cache
   */
  async checkCacheHealth() {
    try {
      const { default: enhancedCache } = await import('./enhanced-cache-manager');
      const stats = enhancedCache.getStats();
      
      return {
        isHealthy: stats.hitRate > 30, // Au moins 30% de hit rate
        lastCheck: new Date().toISOString(),
        stats
      };
      
    } catch (error) {
      return {
        isHealthy: false,
        lastCheck: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Vérifier la santé de la synchronisation
   */
  checkSyncHealth() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    const isHealthy = this.metrics.lastSyncTime && 
                     (now - this.metrics.lastSyncTime) < maxAge &&
                     this.consecutiveFailures < this.thresholds.maxConsecutiveFailures;
    
    return {
      isHealthy,
      lastCheck: new Date().toISOString(),
      lastSyncAge: this.metrics.lastSyncTime ? now - this.metrics.lastSyncTime : null,
      consecutiveFailures: this.consecutiveFailures
    };
  }

  /**
   * Mettre à jour le temps moyen de synchronisation
   */
  updateAverageSyncTime(newDuration) {
    if (this.metrics.averageSyncTime === 0) {
      this.metrics.averageSyncTime = newDuration;
    } else {
      // Moyenne mobile pondérée
      this.metrics.averageSyncTime = (this.metrics.averageSyncTime * 0.8) + (newDuration * 0.2);
    }
  }

  /**
   * Nettoyer les anciens logs
   */
  cleanupLogs() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // Garder les logs récents et tous les logs d'erreur/alerte
    this.logs = this.logs.filter(log => {
      const logTime = new Date(log.timestamp).getTime();
      return logTime > oneHourAgo || ['error', 'alert', 'critical'].includes(log.level);
    });
    
    // Garder les alertes non acquittées et récentes
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => {
      const alertTime = new Date(alert.timestamp).getTime();
      return !alert.acknowledged || alertTime > oneDayAgo;
    });
  }

  /**
   * Obtenir l'emoji pour un niveau de log
   */
  getLevelEmoji(level) {
    const emojis = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      critical: '🚨',
      alert: '🔔'
    };
    return emojis[level] || '📝';
  }

  /**
   * Obtenir les statistiques complètes
   */
  getStats() {
    const now = Date.now();
    
    return {
      ...this.metrics,
      monitoring: {
        isActive: this.isMonitoring,
        uptime: this.isMonitoring ? now - this.startTime : 0,
        consecutiveFailures: this.consecutiveFailures
      },
      logs: {
        total: this.logs.length,
        recent: this.logs.filter(log => {
          const logTime = new Date(log.timestamp).getTime();
          return (now - logTime) < 60000; // Dernière minute
        }).length
      },
      alerts: {
        total: this.alerts.length,
        unacknowledged: this.alerts.filter(a => !a.acknowledged).length,
        critical: this.alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length
      }
    };
  }

  /**
   * Obtenir les logs récents
   */
  getRecentLogs(limit = 50, level = null) {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }
    
    return filteredLogs.slice(0, limit);
  }

  /**
   * Obtenir les alertes actives
   */
  getActiveAlerts() {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  /**
   * Exporter les données de monitoring
   */
  exportData() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      logs: this.logs,
      alerts: this.alerts,
      thresholds: this.thresholds,
      isMonitoring: this.isMonitoring
    };
  }

  /**
   * Importer des données de monitoring
   */
  importData(data) {
    if (data.metrics) {
      this.metrics = { ...this.metrics, ...data.metrics };
    }
    
    if (data.logs) {
      this.logs = data.logs.slice(0, this.maxLogs);
    }
    
    if (data.alerts) {
      this.alerts = data.alerts.slice(0, 50);
    }
    
    if (data.thresholds) {
      this.thresholds = { ...this.thresholds, ...data.thresholds };
    }
  }

  /**
   * Réinitialiser les métriques
   */
  resetMetrics() {
    this.metrics = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      totalCampaigns: 0,
      totalTransactions: 0,
      totalPromotions: 0,
      averageSyncTime: 0,
      lastSyncTime: null,
      errors: []
    };
    
    this.consecutiveFailures = 0;
    this.log('info', 'Métriques réinitialisées');
  }
}

// Instance singleton
const syncMonitor = new SyncMonitor();

// Auto-start en développement
if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
  syncMonitor.startMonitoring();
}

export default syncMonitor;
export { SyncMonitor };