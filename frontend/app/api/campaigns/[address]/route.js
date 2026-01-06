import { NextResponse } from 'next/server';
import { campaigns as dbCampaigns } from '@/backend/db';
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

    // Mettre en cache
    await campaignCache.setOne(address, campaign);

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('[API] Error fetching campaign detail:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
