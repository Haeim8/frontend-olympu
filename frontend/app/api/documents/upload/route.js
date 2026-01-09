import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

export const runtime = 'nodejs';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// Tailles maximales pour compression (en bytes)
const MAX_IMAGE_SIZE = 500 * 1024; // 500KB pour images
const MAX_PDF_SIZE = 2 * 1024 * 1024; // 2MB pour PDFs
const IMAGE_QUALITY = 85; // Qualité de compression pour images

/**
 * Compresser une image avec sharp
 */
async function compressImage(buffer, mimeType) {
    try {
        let image = sharp(buffer);
        const metadata = await image.metadata();

        // Redimensionner si trop grande
        if (metadata.width > 1920) {
            image = image.resize(1920, null, { withoutEnlargement: true });
        }

        // Compresser selon le format
        if (mimeType === 'image/png') {
            image = image.png({ quality: IMAGE_QUALITY, compressionLevel: 9 });
        } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
            image = image.jpeg({ quality: IMAGE_QUALITY, progressive: true });
        } else if (mimeType === 'image/webp') {
            image = image.webp({ quality: IMAGE_QUALITY });
        } else {
            // Convertir en WebP par défaut pour meilleure compression
            image = image.webp({ quality: IMAGE_QUALITY });
        }

        return await image.toBuffer();
    } catch (error) {
        console.error('[Compress] Image compression failed:', error);
        return buffer; // Retourner le buffer original si échec
    }
}

/**
 * Compresser un PDF (simplifié - juste limiter la taille)
 */
async function compressPDF(buffer) {
    // Pour une vraie compression PDF, il faudrait utiliser une lib comme pdf-lib
    // Ici on retourne juste le buffer si < MAX_PDF_SIZE
    if (buffer.length <= MAX_PDF_SIZE) {
        return buffer;
    }

    // Si trop gros, on retourne une erreur
    throw new Error(`PDF trop volumineux (${(buffer.length / 1024 / 1024).toFixed(2)}MB). Maximum: ${MAX_PDF_SIZE / 1024 / 1024}MB`);
}

/**
 * Upload un fichier vers Supabase Storage avec compression
 */
export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const category = formData.get('category') || 'other';
        const campaignAddress = formData.get('campaignAddress');

        if (!file) {
            return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
        }

        if (!campaignAddress) {
            return NextResponse.json({ error: 'Adresse de campagne requise' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        let buffer = Buffer.from(bytes);
        const originalSize = buffer.length;

        // Compresser selon le type
        const isImage = file.type.startsWith('image/');
        const isPDF = file.type === 'application/pdf';

        if (isImage) {
            console.log(`[Upload] Compression image: ${file.name} (${(originalSize / 1024).toFixed(2)}KB)`);
            buffer = await compressImage(buffer, file.type);
        } else if (isPDF) {
            console.log(`[Upload] Vérification PDF: ${file.name} (${(originalSize / 1024 / 1024).toFixed(2)}MB)`);
            buffer = await compressPDF(buffer);
        }

        const compressedSize = buffer.length;
        const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);

        console.log(`[Upload] Compression: ${(originalSize / 1024).toFixed(2)}KB -> ${(compressedSize / 1024).toFixed(2)}KB (${compressionRatio}% réduit)`);

        // Générer le chemin de stockage
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `campaigns/${campaignAddress.toLowerCase()}/${category}/${timestamp}_${sanitizedName}`;

        // Upload vers Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('campaign-documents')
            .upload(filePath, buffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('[Upload] Supabase Storage error:', uploadError);
            throw uploadError;
        }

        // Obtenir l'URL publique
        const { data: { publicUrl } } = supabase.storage
            .from('campaign-documents')
            .getPublicUrl(filePath);

        // Enregistrer dans la base de données
        const { data: docData, error: dbError } = await supabase
            .from('campaign_documents')
            .insert({
                campaign_address: campaignAddress.toLowerCase(),
                ipfs_hash: publicUrl, // Réutiliser ce champ pour l'URL
                name: file.name,
                category: category,
                is_public: true,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (dbError) {
            console.error('[Upload] Database error:', dbError);
            // Ne pas throw, le fichier est déjà uploadé
        }

        return NextResponse.json({
            success: true,
            url: publicUrl,
            name: file.name,
            category: category,
            originalSize: originalSize,
            compressedSize: compressedSize,
            compressionRatio: `${compressionRatio}%`,
            documentId: docData?.id
        });

    } catch (error) {
        console.error('[API Documents Upload] Error:', error);
        return NextResponse.json({
            error: error.message || 'Upload échoué',
            success: false
        }, { status: 500 });
    }
}
