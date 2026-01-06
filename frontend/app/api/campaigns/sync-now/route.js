import { NextResponse } from 'next/server';
import indexer from '@/lib/services/blockchain-indexer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/campaigns/sync-now
 * Declenche une synchronisation manuelle des campagnes blockchain -> PostgreSQL
 */
export async function POST(request) {
    try {
        console.log('[API Sync-Now] Declenchement synchronisation...');

        // Synchroniser les campagnes, transactions et promotions
        await indexer.syncNewCampaigns();
        await indexer.syncAllTransactions();
        await indexer.syncPromotions();

        return NextResponse.json({
            success: true,
            message: 'Synchronisation terminee',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[API Sync-Now] Erreur:', error);

        // En cas d'erreur, on retourne quand meme un succes pour ne pas bloquer l'UI
        // L'erreur est loguee cote serveur
        return NextResponse.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 200 }); // Status 200 pour eviter les erreurs cote client
    }
}

// Support GET aussi pour les tests manuels
export async function GET(request) {
    return POST(request);
}
