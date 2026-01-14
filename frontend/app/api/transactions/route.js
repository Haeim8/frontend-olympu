import { NextResponse } from 'next/server';
import { transactions } from '@/backend/db';

export const runtime = 'nodejs';

/**
 * POST /api/transactions
 * Save a new transaction to the database
 */
export async function POST(request) {
    try {
        const txData = await request.json();

        if (!txData.tx_hash || !txData.campaign_address) {
            return NextResponse.json({ error: 'tx_hash and campaign_address required' }, { status: 400 });
        }

        const savedTx = await transactions.insert({
            tx_hash: txData.tx_hash,
            campaign_address: txData.campaign_address,
            investor: txData.investor,
            amount: txData.amount,
            shares: txData.shares,
            round_number: txData.round_number || 1,
            type: txData.type || 'purchase',
            block_number: txData.block_number,
            timestamp: txData.timestamp || new Date().toISOString(),
            commission: txData.commission || '0',
            net_amount: txData.net_amount || txData.amount
        });

        return NextResponse.json({ success: true, transaction: savedTx });
    } catch (error) {
        console.error('[API Transactions] POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
