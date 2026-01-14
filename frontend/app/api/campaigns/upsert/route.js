import { NextResponse } from 'next/server';
import { campaigns as dbCampaigns } from '@/backend/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const data = await request.json();

        if (!data.address) {
            return NextResponse.json({ error: 'Missing campaign address' }, { status: 400 });
        }

        const campaign = await dbCampaigns.upsert(data);

        // Sauvegarder le round actuel si présent
        if (data.current_round_data) {
            const { rounds: dbRounds } = await import('@/backend/db');
            await dbRounds.upsert({
                campaign_address: data.address,
                ...data.current_round_data
            });
        }

        // Sauvegarder la finance si présente
        if (data.finance_data) {
            const { finance: dbFinance } = await import('@/backend/db');
            await dbFinance.upsert({
                campaign_address: data.address,
                ...data.finance_data
            });
        }

        return NextResponse.json({ success: true, campaign });
    } catch (error) {
        console.error('[API Upsert] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
