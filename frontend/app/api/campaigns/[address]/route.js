import { NextResponse } from 'next/server';
import { campaigns as dbCampaigns, rounds as dbRounds, finance as dbFinance } from '@/backend/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const rawAddress = params?.address;
  if (!rawAddress) {
    return NextResponse.json({ error: 'Missing campaign address' }, { status: 400 });
  }

  const address = rawAddress.toLowerCase();

  try {
    // Récupérer depuis Supabase
    const campaign = await dbCampaigns.getByAddress(address);

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Récupérer les rounds et la finance
    const [roundsList, financeData] = await Promise.all([
      dbRounds.getByCampaign(address),
      dbFinance.getByCampaign(address)
    ]);

    // Enrichir l'objet campagne
    const enrichedCampaign = {
      ...campaign,
      rounds: roundsList,
      finance: financeData
    };

    return NextResponse.json({ campaign: enrichedCampaign });
  } catch (error) {
    console.error('[API] Error fetching campaign detail:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
