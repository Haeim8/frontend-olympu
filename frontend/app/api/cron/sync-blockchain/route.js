import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60s max pour plan Hobby Vercel

/**
 * API de synchronisation automatique INCRÉMENTALE pour les tâches cron
 * Endpoint: /api/cron/sync-blockchain
 *
 * NOUVEAU : Utilise le système de checkpoints pour ne synchroniser
 * que les nouveaux blocs depuis la dernière synchronisation
 */
export async function POST(request) {
  const startTime = Date.now();

  try {
    // Vérifier l'authentification (optionnel - ajouter un token secret)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🚀 Démarrage de la synchronisation blockchain via cron...');

    // Import du système d'indexation direct (RPC)
    const { syncCampaigns } = await import('@/lib/indexer/campaign-indexer.js');

    // Exécuter la synchronisation
    const result = await syncCampaigns();

    const finalResult = {
      campaigns: result.processed || 0,
      campaignsNew: 0,
      campaignsUpdated: result.processed || 0,
      transactions: 0,
      errors: [],
      rpcCalls: (result.processed || 0) * 14, // 14 appels RPC par campagne
      blocksScanned: 0 // Aucun scan de blocs
    };
    
    const duration = Date.now() - startTime;
    
    const response = {
      success: true,
      mode: 'direct-rpc',
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      result: {
        campaignsNew: finalResult.campaignsNew || 0,
        campaignsUpdated: finalResult.campaignsUpdated || 0,
        transactions: finalResult.transactions || 0,
        errors: finalResult.errors || []
      },
      performance: {
        rpcCalls: finalResult.rpcCalls || 0,
        blocksScanned: finalResult.blocksScanned || 0,
        estimatedCostUSD: ((finalResult.rpcCalls || 0) * 0.001).toFixed(6)
      },
      stats: {
        totalProcessed: (finalResult.campaignsNew || 0) + (finalResult.campaignsUpdated || 0) + (finalResult.transactions || 0),
        hasErrors: (finalResult.errors || []).length > 0,
        errorCount: (finalResult.errors || []).length
      }
    };

    console.log('✅ Synchronisation incrémentale cron terminée:', response);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('❌ Erreur synchronisation cron:', error);

    const errorResponse = {
      success: false,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      error: {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    };

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}

/**
 * GET endpoint pour vérifier le statut
 */
export async function GET() {
  try {
    // Importer les stats du cache
    const { default: enhancedCache } = await import('@/lib/services/enhanced-cache-manager');
    const cacheStats = enhancedCache.getStats();

    // Vérifier la base de données
    const { supabaseAdmin } = await import('@/lib/supabase/server');
    
    const [campaignsCount, transactionsCount, promotionsCount, lastSync] = await Promise.all([
      supabaseAdmin.from('campaigns').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('campaign_transactions').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('campaign_promotions').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('sync_state').select('*').order('updated_at', { ascending: false }).limit(3)
    ]);

    const status = {
      timestamp: new Date().toISOString(),
      database: {
        campaigns: campaignsCount.count || 0,
        transactions: transactionsCount.count || 0,
        promotions: promotionsCount.count || 0,
        lastSync: lastSync.data || []
      },
      cache: cacheStats,
      health: {
        database: !campaignsCount.error && !transactionsCount.error && !promotionsCount.error,
        cache: cacheStats.hitRate > 50, // Au moins 50% de hit rate
        sync: (lastSync.data || []).length > 0
      }
    };

    return NextResponse.json(status, {
      headers: {
        'Cache-Control': 's-maxage=30, stale-while-revalidate=60'
      }
    });

  } catch (error) {
    console.error('❌ Erreur status check:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: error.message,
      health: {
        database: false,
        cache: false,
        sync: false
      }
    }, { status: 500 });
  }
}