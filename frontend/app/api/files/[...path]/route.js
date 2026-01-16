/**
 * API Route: /api/files/[...path]
 * Proxy pour les fichiers Supabase Storage - masque l'URL réelle
 */

import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request, { params }) {
    try {
        const pathSegments = params.path || [];
        const filePath = pathSegments.join('/');

        if (!filePath) {
            return NextResponse.json({ error: 'Path required' }, { status: 400 });
        }

        // Construire l'URL Supabase (masquée côté client)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const bucketUrl = `${supabaseUrl}/storage/v1/object/public/campaign-documents/${filePath}`;

        // Fetch le fichier depuis Supabase
        const response = await fetch(bucketUrl);

        if (!response.ok) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Récupérer le content-type
        const contentType = response.headers.get('content-type') || 'application/octet-stream';

        // Retourner le fichier directement
        const blob = await response.blob();

        return new NextResponse(blob, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=3600',
            },
        });

    } catch (error) {
        console.error('[Files API] Error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}