import { NextResponse } from 'next/server';
import { campaigns as dbCampaigns } from '@/backend/db';
import { campaignCache } from '@/backend/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const creator = searchParams.get('creator');

  try {
    // Tenter de récupérer depuis le cache Redis
    const cached = await campaignCache.getList();
    if (cached) {
      console.log('[API] Cache hit: campaigns list');
      let filtered = cached;

      if (status) filtered = filtered.filter(c => c.status === status);
      if (category) filtered = filtered.filter(c => c.category === category);
      if (creator) filtered = filtered.filter(c => c.creator?.toLowerCase() === creator.toLowerCase());

      return NextResponse.json({ campaigns: filtered });
    }

    // Récupérer depuis PostgreSQL
    const campaignList = await dbCampaigns.getAll({ status, category });

    // Filtrage supplémentaire par créateur si présent
    let results = campaignList;
    if (creator) {
      results = results.filter(c => c.creator?.toLowerCase() === creator.toLowerCase());
    }

    // Mettre en cache la liste complète pour les futurs appels (Redis gère le TTL)
    await campaignCache.setList(campaignList);

    console.log(`[API] ✅ ${results.length} campagnes récupérées depuis PostgreSQL`);

    return NextResponse.json(
      { campaigns: results },
      {
        headers: {
          'Cache-Control': 's-maxage=60, stale-while-revalidate=120',
        },
      },
    );
  } catch (error) {
    console.error('[API] Error fetching campaigns:', error);

    return NextResponse.json(
      {
        campaigns: [],
        error: 'Impossible de récupérer les campagnes.',
      },
      { status: 200 },
    );
  }
}
