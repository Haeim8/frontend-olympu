import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabase/server';
import { mapCampaignRow } from '../utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const rawAddress = params?.address;
  if (!rawAddress) {
    return NextResponse.json({ error: 'Missing campaign address' }, { status: 400 });
  }

  const address = rawAddress.toLowerCase();

  const { data, error } = await supabaseAdmin
    .from('campaigns')
    .select('*')
    .eq('address', address)
    .maybeSingle();

  if (error) {
    console.error('[API] campaign detail fetch error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  return NextResponse.json({ campaign: mapCampaignRow(data) });
}
