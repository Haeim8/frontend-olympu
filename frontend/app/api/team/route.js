import { NextResponse } from 'next/server';
import { teamMembers } from '@/backend/db';

export const runtime = 'nodejs';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    try {
        const members = await teamMembers.getByCampaign(address.toLowerCase());
        return NextResponse.json({ teamMembers: members });
    } catch (error) {
        console.error('[API Team] GET Error:', error);
        return NextResponse.json({ teamMembers: [], error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { campaignAddress, members } = await request.json();

        if (!campaignAddress) {
            return NextResponse.json({ error: 'campaignAddress required' }, { status: 400 });
        }

        const savedMembers = await teamMembers.saveByCampaign(campaignAddress, members || []);
        return NextResponse.json({ success: true, teamMembers: savedMembers });
    } catch (error) {
        console.error('[API Team] POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
