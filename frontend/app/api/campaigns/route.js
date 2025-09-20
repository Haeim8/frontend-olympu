import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabase/server';
import { mapCampaignRow } from './utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const creator = searchParams.get('creator');
  const status = searchParams.get('status');

  try {
    let query = supabaseAdmin
      .from('campaigns')
      .select('*')
      .order('updated_at', { ascending: false });

    if (creator) {
      query = query.eq('creator', creator.toLowerCase());
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const campaigns = (data ?? []).map(mapCampaignRow);

    return NextResponse.json(
      { campaigns },
      {
        headers: {
          'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
        },
      },
    );
  } catch (error) {
    console.error('[API] campaigns fetch error', error);

    return NextResponse.json(
      {
        campaigns: [],
        error: 'Impossible de récupérer les campagnes pour le moment.',
      },
      { status: 200 },
    );
  }
}
