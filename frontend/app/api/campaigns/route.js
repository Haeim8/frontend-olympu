import { NextResponse } from 'next/server';
import { campaigns as dbCampaigns } from '@/backend/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const creator = searchParams.get('creator');
  const refresh = searchParams.get('refresh') === 'true';

  try {
    let campaignList = await dbCampaigns.getAll({ status, category });

    if (creator) {
      campaignList = campaignList.filter(c => c.creator?.toLowerCase() === creator.toLowerCase());
    }

    console.log(`[API] ✅ ${campaignList.length} campagnes depuis Supabase (cache)`);

    return NextResponse.json(
      { campaigns: campaignList },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
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
