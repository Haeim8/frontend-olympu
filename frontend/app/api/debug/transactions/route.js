import { NextResponse } from 'next/server';
import { getSupabase } from '@/backend/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DEBUG ENDPOINT - Vérifie directement Supabase
 * Usage: /api/debug/transactions?address=0x...
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address')?.toLowerCase() || '';

    try {
        const supabase = getSupabase();

        // 1. Compter toutes les transactions
        const { count: totalCount, error: countError } = await supabase
            .from('campaign_transactions')
            .select('*', { count: 'exact', head: true });

        // 2. Chercher pour cette adresse spécifique
        const { data: specificTxs, error: specificError } = await supabase
            .from('campaign_transactions')
            .select('tx_hash, campaign_address, investor, amount, shares, block_number')
            .eq('campaign_address', address)
            .limit(10);

        // 3. Lister TOUTES les adresses de campagne distinctes
        const { data: allTxs, error: allError } = await supabase
            .from('campaign_transactions')
            .select('campaign_address')
            .limit(50);

        const distinctAddresses = [...new Set((allTxs || []).map(t => t.campaign_address))];

        return NextResponse.json({
            debug: true,
            requestedAddress: address,
            totalTransactionsInDB: totalCount,
            countError: countError?.message || null,
            transactionsForAddress: specificTxs || [],
            specificError: specificError?.message || null,
            allDistinctCampaignAddresses: distinctAddresses,
            allError: allError?.message || null,
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + '...',
            hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY
        });
    } catch (error) {
        return NextResponse.json({
            error: error.message,
            stack: error.stack?.split('\n').slice(0, 5)
        }, { status: 500 });
    }
}
