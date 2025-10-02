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
    // Vérifier que Supabase est configuré
    if (!supabaseAdmin) {
      console.error('[API] ⚠️ Supabase client non initialisé');
      return NextResponse.json(
        { campaigns: [], error: 'Database non configurée' },
        { status: 200 }
      );
    }

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
      console.error('[API] campaigns fetch error', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    const campaigns = (data ?? []).map(mapCampaignRow);

    console.log(`[API] ✅ ${campaigns.length} campagnes récupérées`);

    return NextResponse.json(
      { campaigns },
      {
        headers: {
          'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
        },
      },
    );
  } catch (error) {
    console.error('[API] campaigns fetch error', {
      message: error?.message || 'Unknown error',
      details: error?.details || error?.toString(),
      hint: error?.hint || '',
      code: error?.code || ''
    });

    return NextResponse.json(
      {
        campaigns: [],
        error: 'Impossible de récupérer les campagnes pour le moment.',
      },
      { status: 200 },
    );
  }
}
