import { NextResponse } from 'next/server';
import { campaigns as dbCampaigns } from '@/backend/db';
import { campaignCache } from '@/backend/redis';

export const runtime = 'nodejs';

export async function POST(request) {
    try {
        const data = await request.json();

        if (!data.address) {
            return NextResponse.json({ error: 'Missing campaign address' }, { status: 400 });
        }

        const campaign = await dbCampaigns.upsert(data);

        // Invalider le cache
        await campaignCache.invalidate(data.address.toLowerCase());
        await campaignCache.invalidateAll();

        return NextResponse.json({ success: true, campaign });
    } catch (error) {
        console.error('[API Upsert] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
