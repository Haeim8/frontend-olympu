import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Gateways IPFS optimisés pour Web3.Storage (ordre de priorité basé sur diagnostic)
const IPFS_GATEWAYS = [
  'https://w3s.link/ipfs/',           // Web3.Storage - priorité 1 (détecté par diag)
  'https://dag.w3s.link/ipfs/',       // Web3.Storage DAG - priorité 2 (détecté par diag)
  'https://dweb.link/ipfs/',          // IPFS Foundation
  'https://4everland.io/ipfs/',       // 4everland CDN
  'https://ipfs.io/ipfs/',            // IPFS.io (fallback)
  'https://gateway.pinata.cloud/ipfs/' // Pinata (fallback)
];

/**
 * API Route pour fetch IPFS côté serveur
 * Meilleure performance et timeout que côté client
 */
export async function GET(request, { params }) {
  const { hash } = params;

  if (!hash) {
    return NextResponse.json(
      { error: 'IPFS hash is required' },
      { status: 400 }
    );
  }

  // Essayer les gateways un par un
  for (let i = 0; i < IPFS_GATEWAYS.length; i++) {
    const gateway = IPFS_GATEWAYS[i];

    // Essayer d'abord campaign-data.json (structure répertoire)
    const metadataUrl = `${gateway}${hash}/campaign-data.json`;
    const directUrl = `${gateway}${hash}`;

    try {
      console.log(`[IPFS API] Trying gateway ${i}: ${metadataUrl}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(metadataUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log(`[IPFS API] ✅ Success with gateway ${i}`);

        return NextResponse.json(data, {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200', // Cache 1h
          },
        });
      }

      // Fallback: essayer le hash direct
      console.log(`[IPFS API] Trying direct URL: ${directUrl}`);
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 10000);

      const directResponse = await fetch(directUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller2.signal,
      });

      clearTimeout(timeoutId2);

      if (directResponse.ok) {
        const data = await directResponse.json();
        console.log(`[IPFS API] ✅ Success with direct URL on gateway ${i}`);

        return NextResponse.json(data, {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          },
        });
      }

    } catch (error) {
      console.warn(`[IPFS API] Gateway ${i} failed:`, error.message);
      // Continue to next gateway
    }
  }

  // Tous les gateways ont échoué
  console.error(`[IPFS API] ❌ All gateways failed for hash: ${hash}`);

  return NextResponse.json(
    { error: 'Failed to fetch from all IPFS gateways', hash },
    { status: 502 }
  );
}
