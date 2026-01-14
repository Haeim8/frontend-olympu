import { NextResponse } from 'next/server';
import { documents as dbDocuments } from '@/backend/db';

export const runtime = 'nodejs';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    try {
        const results = await dbDocuments.getByCampaign(address.toLowerCase());
        return NextResponse.json({ documents: results });
    } catch (error) {
        console.error('[API Documents] GET Error:', error);
        return NextResponse.json({ documents: [], error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { campaignAddress, url, name, category } = await request.json();

        if (!campaignAddress || !url) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const document = await dbDocuments.insert({
            campaign_address: campaignAddress.toLowerCase(),
            url: url,
            name,
            category: category || 'other',
            is_public: true
        });

        return NextResponse.json({ success: true, document });
    } catch (error) {
        console.error('[API Documents] POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
