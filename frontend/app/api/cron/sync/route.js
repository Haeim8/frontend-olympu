import { NextResponse } from 'next/server';
import indexer from '@/lib/services/blockchain-indexer.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * Route API pour Vercel Cron
 * Déclenche un passage de l'indexeur
 */
export async function GET(request) {
    const authHeader = request.headers.get('authorization');
    const userAgent = request.headers.get('user-agent') || '';
    const { searchParams } = new URL(request.url);
    const debugKey = searchParams.get('key');

    // Détection simplifiée pour Vercel Cron
    const isVercelSystem = userAgent.includes('vercel-cron') || userAgent.includes('Vercel-Cron');
    const hasCorrectSecret = process.env.CRON_SECRET && (authHeader === `Bearer ${process.env.CRON_SECRET}` || debugKey === process.env.CRON_SECRET);

    // En production, on accepte soit le secret, soit l'agent Vercel si le secret n'est pas prêt
    if (process.env.NODE_ENV === 'production') {
        if (!hasCorrectSecret && !isVercelSystem) {
            console.warn('[Cron] Accès refusé:', { userAgent, hasSecret: !!process.env.CRON_SECRET });
            return NextResponse.json({
                error: 'Unauthorized',
                details: 'Accès réservé au système Vercel Cron ou avec clé ?key='
            }, { status: 401 });
        }
    }

    try {
        console.log(`[Cron] Déclenchement (Agent: ${userAgent.slice(0, 20)}...)`);
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
