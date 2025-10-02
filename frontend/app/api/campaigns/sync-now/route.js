import { NextResponse } from 'next/server';
import smartSyncManager from '@/lib/services/smart-sync-manager';

/**
 * API pour synchronisation INTELLIGENTE des campagnes
 * Ne synchronise QUE si des changements sont détectés
 */
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    console.log(`[API] 🧠 Sync ${force ? 'FORCÉE' : 'intelligente'} déclenchée...`);

    // Utiliser la sync intelligente
    const results = force
      ? await smartSyncManager.forceSync()
      : await smartSyncManager.sync();

    // Si skip, retourner immédiatement
    if (results.skipped) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: results.reason,
        message: 'Aucune synchronisation nécessaire'
      });
    }

    return NextResponse.json({
      success: true,
      skipped: false,
      message: `Synchronisation terminée: ${results.processed} campagnes traitées`,
      results
    });

  } catch (error) {
    console.error('[API] ❌ Erreur sync-now:', error);

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
 * GET pour obtenir le statut de synchronisation
 */
export async function GET() {
  try {
    const stats = await smartSyncManager.getStats();

    const { supabaseAdmin } = await import('@/lib/supabase/server.js');

    const { count: campaignCount } = await supabaseAdmin
      .from('campaigns')
      .select('*', { count: 'exact', head: true });

    const { count: txCount } = await supabaseAdmin
      .from('campaign_transactions')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      stats: {
        totalCampaigns: campaignCount || 0,
        totalTransactions: txCount || 0,
        sync: stats
      }
    });

  } catch (error) {
    console.error('[API] ❌ Erreur GET sync-now:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erreur de récupération du statut'
      },
      { status: 500 }
    );
  }
}
