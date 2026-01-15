/**
 * API Route: /api/investors
 * Récupère les investisseurs d'une campagne depuis les transactions Supabase
 */

import { getSupabase } from '@/backend/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

        const supabase = getSupabase();
        const address = campaignAddress.toLowerCase();

        // Récupérer toutes les transactions de type 'purchase' pour cette campagne
        const { data: transactions, error } = await supabase
            .from('campaign_transactions')
            .select('investor, shares, amount, timestamp')
            .eq('campaign_address', address)
            .eq('type', 'purchase')
            .order('timestamp', { ascending: false });

        if (error) {
            console.error('[API Investors] Erreur Supabase:', error);
            return NextResponse.json(
                { error: 'Erreur lors de la récupération des investisseurs' },
                { status: 500 }
            );
        }

        // Agréger par investisseur
        const investorMap = new Map();

        for (const tx of (transactions || [])) {
            const investorAddr = tx.investor?.toLowerCase();
            if (!investorAddr) continue;

            if (!investorMap.has(investorAddr)) {
                investorMap.set(investorAddr, {
                    address: investorAddr,
                    nftCount: 0,
                    totalInvested: BigInt(0),
                    firstInvestment: tx.timestamp,
                    lastInvestment: tx.timestamp,
                    investmentCount: 0
                });
            }

            const investor = investorMap.get(investorAddr);
            investor.nftCount += parseInt(tx.shares || 0);
            investor.totalInvested += BigInt(tx.amount || 0);
            investor.investmentCount += 1;

            // Mettre à jour les dates
            if (tx.timestamp < investor.firstInvestment) {
                investor.firstInvestment = tx.timestamp;
            }
            if (tx.timestamp > investor.lastInvestment) {
                investor.lastInvestment = tx.timestamp;
            }
        }

        // Convertir en tableau et trier par nombre de parts
        const normalizedInvestors = Array.from(investorMap.values())
            .map(inv => ({
                address: inv.address,
                nftCount: inv.nftCount.toString(),
                totalInvested: inv.totalInvested.toString(),
                firstInvestment: inv.firstInvestment,
                lastInvestment: inv.lastInvestment,
                investmentCount: inv.investmentCount
            }))
            .sort((a, b) => parseInt(b.nftCount) - parseInt(a.nftCount));

        console.log(`[API Investors] ${normalizedInvestors.length} investisseurs pour ${address.slice(0, 10)}...`);

        return NextResponse.json({
            success: true,
            investors: normalizedInvestors,
            count: normalizedInvestors.length
        });

    } catch (error) {
        console.error('[API Investors] Erreur:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', message: error.message },
            { status: 500 }
        );
    }
}
