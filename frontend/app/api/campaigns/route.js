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
    // Récupérer depuis PostgreSQL/Supabase (cache)
    const campaignList = await dbCampaigns.getAll({ status, category });

    // Filtrage supplémentaire par créateur si présent
    let results = campaignList;
    if (creator) {
      results = results.filter(c => c.creator?.toLowerCase() === creator.toLowerCase());
    }

    console.log(`[API] ✅ ${results.length} campagnes depuis cache`);

    return NextResponse.json(
      { campaigns: results },
      {
        headers: {
          'Cache-Control': 's-maxage=10, stale-while-revalidate=30',
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
