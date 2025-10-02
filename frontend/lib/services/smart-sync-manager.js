/**
 * 🧠 GESTIONNAIRE DE SYNCHRONISATION INTELLIGENT
 *
 * Philosophie :
 * 1. Charger depuis la DB IMMÉDIATEMENT
 * 2. Vérifier s'il y a des changements blockchain
 * 3. Ne synchroniser QUE si nécessaire
 * 4. Mettre à jour silencieusement en arrière-plan
 */

// Import dynamique de supabaseAdmin pour éviter les erreurs côté client
let supabaseAdmin = null;

async function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseModule = await import('@/lib/supabase/server.js');
    supabaseAdmin = supabaseModule.supabaseAdmin;
  }
  return supabaseAdmin;
}

class SmartSyncManager {
  constructor() {
    this.lastCheck = null;
    this.isSyncing = false;
    this.syncInterval = 5 * 60 * 1000; // 5 minutes minimum entre syncs
    this.checkInterval = 30 * 1000; // Vérifier toutes les 30 secondes
  }

  /**
   * Vérifie s'il faut synchroniser
   * @returns {Promise<boolean>} true si sync nécessaire
   */
  async shouldSync() {
    // 1. Ne pas sync si déjà en cours
    if (this.isSyncing) {
      console.log('[SmartSync] ⏭️ Sync déjà en cours, skip');
      return false;
    }

    // 2. Ne pas sync si dernière sync < 5 minutes
    if (this.lastCheck && (Date.now() - this.lastCheck) < this.syncInterval) {
      const remaining = Math.ceil((this.syncInterval - (Date.now() - this.lastCheck)) / 1000);
      console.log(`[SmartSync] ⏭️ Dernière sync il y a moins de 5min, attendre ${remaining}s`);
      return false;
    }

    // 3. Vérifier s'il y a de nouveaux événements blockchain
    try {
      const hasChanges = await this.detectBlockchainChanges();
      if (!hasChanges) {
        console.log('[SmartSync] ✅ Aucun changement blockchain détecté, skip sync');
        this.lastCheck = Date.now();
        return false;
      }

      console.log('[SmartSync] 🔔 Changements détectés, sync nécessaire');
      return true;
    } catch (error) {
      console.error('[SmartSync] ❌ Erreur détection changements:', error);
      // En cas d'erreur, on sync quand même par sécurité
      return true;
    }
  }

  /**
   * Détecte les changements blockchain sans tout synchroniser
   * Vérifie juste si le dernier bloc scanné est différent du bloc actuel
   */
  async detectBlockchainChanges() {
    try {
      // Récupérer le dernier bloc scanné depuis la DB
      const supabase = await getSupabaseAdmin();
      const { data: syncState } = await supabase
        .from('sync_state')
        .select('last_block, updated_at')
        .eq('id', 'campaigns')
        .maybeSingle();

      if (!syncState) {
        console.log('[SmartSync] Première sync, nécessaire');
        return true;
      }

      // Récupérer le bloc actuel (via API blockchain légère)
      const currentBlock = await this.getCurrentBlockNumber();
      const lastSyncedBlock = BigInt(syncState.last_block || 0);

      // Si différence > 100 blocs (environ 3-4 minutes sur Base), sync nécessaire
      const blockDiff = currentBlock - lastSyncedBlock;

      if (blockDiff > 100n) {
        console.log(`[SmartSync] 📊 ${blockDiff} nouveaux blocs détectés`);
        return true;
      }

      console.log(`[SmartSync] ✅ Seulement ${blockDiff} nouveaux blocs, pas besoin de sync`);
      return false;

    } catch (error) {
      console.error('[SmartSync] Erreur détection:', error);
      return true; // En cas d'erreur, sync par sécurité
    }
  }

  /**
   * Récupère le numéro de bloc actuel (léger)
   */
  async getCurrentBlockNumber() {
    const { createPublicClient, http } = await import('viem');
    const { baseSepolia } = await import('viem/chains');

    const RPC_API_KEY = process.env.CDP_API_KEY ||
                        process.env.NEXT_PUBLIC_CDP_CLIENT_API_KEY ||
                        process.env.NEXT_PUBLIC_CDP_PROJECT_ID;

    const RPC_URL = RPC_API_KEY
      ? `https://api.developer.coinbase.com/rpc/v1/base-sepolia/${RPC_API_KEY}`
      : 'https://sepolia.base.org';

    const client = createPublicClient({
      chain: baseSepolia,
      transport: http(RPC_URL),
    });

    return await client.getBlockNumber();
  }

  /**
   * Lance une synchronisation intelligente
   */
  async sync() {
    if (this.isSyncing) {
      console.log('[SmartSync] ⏭️ Sync déjà en cours');
      return { skipped: true, reason: 'already_syncing' };
    }

    const shouldSync = await this.shouldSync();
    if (!shouldSync) {
      return { skipped: true, reason: 'no_changes' };
    }

    this.isSyncing = true;
    console.log('[SmartSync] 🔄 Synchronisation démarrée...');

    try {
      const { syncCampaigns } = await import('@/lib/indexer/campaign-indexer.js');
      const results = await syncCampaigns();

      this.lastCheck = Date.now();
      console.log('[SmartSync] ✅ Synchronisation terminée:', results);

      return { success: true, ...results };
    } catch (error) {
      console.error('[SmartSync] ❌ Erreur sync:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Lance une sync forcée (pour bouton refresh manuel)
   */
  async forceSync() {
    console.log('[SmartSync] 🔄 Synchronisation FORCÉE...');
    this.lastCheck = null; // Reset le timer
    return await this.sync();
  }

  /**
   * Récupère les statistiques de sync
   */
  async getStats() {
    try {
      const supabase = await getSupabaseAdmin();
      const { data: syncState } = await supabase
        .from('sync_state')
        .select('*')
        .eq('id', 'campaigns')
        .maybeSingle();

      const currentBlock = await this.getCurrentBlockNumber();
      const lastSyncedBlock = BigInt(syncState?.last_block || 0);
      const blocksBehind = currentBlock - lastSyncedBlock;

      return {
        lastSyncedBlock: syncState?.last_block || 0,
        lastSyncedAt: syncState?.updated_at || null,
        currentBlock: currentBlock.toString(),
        blocksBehind: blocksBehind.toString(),
        isSyncing: this.isSyncing,
        nextSyncIn: this.lastCheck
          ? Math.max(0, this.syncInterval - (Date.now() - this.lastCheck))
          : 0,
      };
    } catch (error) {
      console.error('[SmartSync] Erreur stats:', error);
      return null;
    }
  }
}

// Instance singleton
const smartSyncManager = new SmartSyncManager();

export default smartSyncManager;
export { SmartSyncManager };
