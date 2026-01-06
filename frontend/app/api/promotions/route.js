import { NextResponse } from 'next/server';
import { promotions as dbPromotions } from '@/backend/db';
import { promotionCache } from '@/backend/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const includeExpired = searchParams.get('includeExpired') === 'true';

    try {
        // Tenter le cache
        if (!includeExpired) {
            const cached = await promotionCache.getActive();
            if (cached) return NextResponse.json({ promotions: cached });
        }

        const results = await dbPromotions.getActivePromotions(includeExpired);

        if (!includeExpired) {
            await promotionCache.setActive(results);
        }

        return NextResponse.json({ promotions: results });
    } catch (error) {
        console.error('[API Promotions] Error:', error);
        return NextResponse.json({ promotions: [], error: error.message }, { status: 200 });
    }
}
