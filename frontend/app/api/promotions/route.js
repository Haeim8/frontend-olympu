import { NextResponse } from 'next/server';
import { promotions as dbPromotions } from '@/backend/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const includeExpired = searchParams.get('includeExpired') === 'true';

    try {
        const results = await dbPromotions.getActivePromotions(includeExpired);
        return NextResponse.json({ promotions: results });
    } catch (error) {
        console.error('[API Promotions] Error:', error);
        return NextResponse.json({ promotions: [], error: error.message }, { status: 200 });
    }
}
