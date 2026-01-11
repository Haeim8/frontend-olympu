/**
 * API Route: /api/investors
 * Récupère les investisseurs d'une campagne depuis Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Force dynamic rendering (uses request.url)
export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const campaignAddress = searchParams.get('campaign');

        if (!campaignAddress) {
            return NextResponse.json(
                { error: 'Paramètre campaign requis' },
                { status: 400 }
            );
        }

        // Récupérer les investisseurs depuis la table campaign_investors
        const { data: investors, error } = await supabase
            .from('campaign_investors')
            .select('*')
            .eq('campaign_address', campaignAddress.toLowerCase())
            .order('total_shares', { ascending: false });

        if (error) {
            console.error('[API Investors] Erreur Supabase:', error);
            return NextResponse.json(
                { error: 'Erreur lors de la récupération des investisseurs' },
                { status: 500 }
            );
        }

        // Normaliser les données pour le frontend
        const normalizedInvestors = (investors || []).map(inv => ({
            address: inv.investor_address,
            nftCount: inv.total_shares || '0',
            totalInvested: inv.total_invested || '0',
            firstInvestment: inv.first_investment_date,
            lastInvestment: inv.last_investment_date,
            investmentCount: inv.investment_count || 0
        }));

        return NextResponse.json({
            success: true,
            investors: normalizedInvestors,
            count: normalizedInvestors.length
        });

    } catch (error) {
        console.error('[API Investors] Erreur:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
