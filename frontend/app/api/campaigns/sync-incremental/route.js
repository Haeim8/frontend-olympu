import { NextResponse } from 'next/server';

/**
 * API ROUTE POUR LA SYNCHRONISATION INCRÉMENTALE
 *
 * Cette route utilise le système de checkpoints pour ne synchroniser
 * que les nouveaux blocs depuis la dernière synchronisation.
 *
 * ÉCONOMIQUE ET INTELLIGENT !
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action = 'sync', campaignAddress } = body;

    console.log(`🔄 API Sync Incrémental - Action: ${action}`);

    // Import dynamique de l'indexer complet
    const { syncCampaigns } = await import('@/lib/indexer/campaign-indexer.js');

    switch (action) {
      case 'sync':
      case 'full-sync':
        // Synchronisation complète incrémentale (campagnes + tous événements)
        console.log('🔄 Démarrage synchronisation complète incrémentale...');
        const results = await syncCampaigns();

        return NextResponse.json({
          success: true,
          action,
          results,
          message: results.skipped
            ? 'Synchronisation déjà à jour'
            : `Synchronisation terminée: ${results.processed} campagnes traitées`,
        });

      case 'status':
        // Obtenir le statut de synchronisation
        const { supabaseAdmin } = await import('@/lib/supabase/server.js');

        const { data: syncStates } = await supabaseAdmin
          .from('sync_state')
          .select('*')
          .in('id', ['campaigns', 'campaign_transactions']);

        const { count: campaignCount } = await supabaseAdmin
          .from('campaigns')
          .select('*', { count: 'exact', head: true });

        const { count: txCount } = await supabaseAdmin
          .from('campaign_transactions')
          .select('*', { count: 'exact', head: true });

        return NextResponse.json({
          success: true,
          action: 'status',
          syncStates: syncStates || [],
          stats: {
            totalCampaigns: campaignCount || 0,
            totalTransactions: txCount || 0
          },
          message: 'Statut de synchronisation récupéré'
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Action inconnue: ${action}`,
            availableActions: ['sync', 'full-sync', 'status']
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Erreur API sync-incremental:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erreur de synchronisation',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Méthode GET pour obtenir le statut de synchronisation
 */
export async function GET() {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase/server.js');

    const { data: syncStates } = await supabaseAdmin
      .from('sync_state')
      .select('*')
      .in('id', ['campaigns', 'campaign_transactions']);

    const { count: campaignCount } = await supabaseAdmin
      .from('campaigns')
      .select('*', { count: 'exact', head: true });

    const { count: txCount } = await supabaseAdmin
      .from('campaign_transactions')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      syncStates: syncStates || [],
      stats: {
        totalCampaigns: campaignCount || 0,
        totalTransactions: txCount || 0
      },
      message: 'Statut de synchronisation récupéré'
    });
  } catch (error) {
    console.error('❌ Erreur GET sync-incremental:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erreur de récupération du statut'
      },
      { status: 500 }
    );
  }
}