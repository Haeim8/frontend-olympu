/**
 * Test de compression d'images avec sharp
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function testImageCompression() {
    console.log('🖼️  Test de compression d\'images avec sharp\n');

    // Créer une image de test (100x100 rouge)
    const testImage = await sharp({
        create: {
            width: 2000,
            height: 2000,
            channels: 4,
            background: { r: 255, g: 0, b: 0, alpha: 1 }
        }
    })
    .png()
    .toBuffer();

    console.log(`📦 Image originale (PNG): ${(testImage.length / 1024).toFixed(2)} KB`);

    // Test 1: Compression PNG
    const compressedPng = await sharp(testImage)
        .resize(1920, null, { withoutEnlargement: true })
        .png({ quality: 85, compressionLevel: 9 })
        .toBuffer();

    console.log(`📦 PNG compressé (qualité 85): ${(compressedPng.length / 1024).toFixed(2)} KB`);
    console.log(`   → Réduction: ${((1 - compressedPng.length / testImage.length) * 100).toFixed(2)}%\n`);

    // Test 2: Conversion en WebP
    const webpImage = await sharp(testImage)
        .resize(1920, null, { withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

    console.log(`📦 Converti en WebP (qualité 85): ${(webpImage.length / 1024).toFixed(2)} KB`);
    console.log(`   → Réduction vs original: ${((1 - webpImage.length / testImage.length) * 100).toFixed(2)}%`);
    console.log(`   → Réduction vs PNG compressé: ${((1 - webpImage.length / compressedPng.length) * 100).toFixed(2)}%\n`);

    // Test 3: JPEG
    const jpegImage = await sharp(testImage)
        .resize(1920, null, { withoutEnlargement: true })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();

    console.log(`📦 Converti en JPEG (qualité 85): ${(jpegImage.length / 1024).toFixed(2)} KB`);
    console.log(`   → Réduction: ${((1 - jpegImage.length / testImage.length) * 100).toFixed(2)}%\n`);

    console.log('✅ Tests de compression terminés!\n');
    console.log('📊 Résumé:');
    console.log(`   Format le plus efficace: ${webpImage.length < jpegImage.length ? 'WebP' : 'JPEG'}`);
    console.log(`   Meilleure compression: ${Math.max(
        (1 - compressedPng.length / testImage.length) * 100,
        (1 - webpImage.length / testImage.length) * 100,
        (1 - jpegImage.length / testImage.length) * 100
    ).toFixed(2)}%`);
}

testImageCompression().catch(console.error);
