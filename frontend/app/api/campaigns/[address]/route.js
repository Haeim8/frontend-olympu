import { NextResponse } from 'next/server';
import { campaigns as dbCampaigns, rounds as dbRounds, finance as dbFinance } from '@/backend/db';
import { campaignCache } from '@/backend/redis';

export const runtime = 'nodejs';
export const revalidate = 60;

export async function GET(request, { params }) {
  const rawAddress = params?.address;
  if (!rawAddress) {
    return NextResponse.json({ error: 'Missing campaign address' }, { status: 400 });
  }

  const address = rawAddress.toLowerCase();

  try {
    // Vérifier le cache Redis
    const cached = await campaignCache.getOne(address);
    if (cached) {
      console.log('[API] Cache hit:', address);
      return NextResponse.json({ campaign: cached });
    }

    // Récupérer depuis PostgreSQL
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

    // Mettre en cache
    await campaignCache.setOne(address, enrichedCampaign);

    return NextResponse.json({ campaign: enrichedCampaign });
  } catch (error) {
    console.error('[API] Error fetching campaign detail:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
