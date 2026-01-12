import { NextResponse } from 'next/server';
import indexer from '@/lib/services/blockchain-indexer.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Route API pour Vercel Cron
 * Déclenche un passage de l'indexeur
 */
export async function GET(request) {
    // Vérification de l'en-tête Cron de Vercel (Sécurité)
    // Note: En production, Vercel ajoute cet en-tête pour les requêtes Cron
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('[Cron] Déclenchement de la synchronisation...');
        const result = await indexer.syncNext();

        return NextResponse.json({
            success: true,
            message: 'Synchronisation blockchain effectuée',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Cron] Erreur:', error.message);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
