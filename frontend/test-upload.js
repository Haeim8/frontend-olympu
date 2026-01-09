/**
 * Script de test pour l'upload de documents vers Supabase
 * Usage: node test-upload.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables Supabase manquantes dans .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBucketExists() {
    console.log('\n📦 Test 1: Vérification du bucket...');

    const { data, error } = await supabase.storage.getBucket('campaign-documents');

    if (error) {
        console.error('❌ Bucket introuvable:', error.message);
        console.log('\n💡 Créez le bucket avec ce SQL:');
        console.log(`
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-documents', 'campaign-documents', true)
ON CONFLICT (id) DO NOTHING;
        `);
        return false;
    }

    console.log('✅ Bucket trouvé:', data.name, '- Public:', data.public);
    return true;
}

async function testUpload() {
    console.log('\n📤 Test 2: Upload d\'un fichier test...');

    // Créer un fichier test
    const testContent = 'Test upload Supabase - ' + new Date().toISOString();
    const testFile = Buffer.from(testContent);
    const fileName = `test/test_${Date.now()}.txt`;

    const { data, error } = await supabase.storage
        .from('campaign-documents')
        .upload(fileName, testFile, {
            contentType: 'text/plain',
            cacheControl: '3600'
        });

    if (error) {
        console.error('❌ Upload échoué:', error.message);
        return null;
    }

    console.log('✅ Fichier uploadé:', data.path);
    return data.path;
}

async function testPublicUrl(filePath) {
    console.log('\n🔗 Test 3: Récupération de l\'URL publique...');

    const { data } = supabase.storage
        .from('campaign-documents')
        .getPublicUrl(filePath);

    console.log('✅ URL publique:', data.publicUrl);

    // Tester l'accès
    try {
        const response = await fetch(data.publicUrl);
        if (response.ok) {
            const content = await response.text();
            console.log('✅ Fichier accessible publiquement');
            console.log('📄 Contenu:', content);
        } else {
            console.error('❌ Fichier non accessible:', response.status);
        }
    } catch (err) {
        console.error('❌ Erreur fetch:', err.message);
    }
}

async function testDelete(filePath) {
    console.log('\n🗑️  Test 4: Suppression du fichier test...');

    const { error } = await supabase.storage
        .from('campaign-documents')
        .remove([filePath]);

    if (error) {
        console.error('❌ Suppression échouée:', error.message);
        return;
    }

    console.log('✅ Fichier supprimé');
}

async function testDatabaseInsert() {
    console.log('\n💾 Test 5: Insertion dans campaign_documents...');

    const testDoc = {
        campaign_address: '0xtest123',
        ipfs_hash: 'https://test-url.com/test.pdf',
        name: 'Test Document',
        category: 'whitepaper',
        is_public: true
    };

    const { data, error } = await supabase
        .from('campaign_documents')
        .insert(testDoc)
        .select()
        .single();

    if (error) {
        console.error('❌ Insertion échouée:', error.message);
        return null;
    }

    console.log('✅ Document inséré avec ID:', data.id);
    return data.id;
}

async function testDatabaseDelete(id) {
    console.log('\n🗑️  Test 6: Suppression du document test...');

    const { error } = await supabase
        .from('campaign_documents')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('❌ Suppression échouée:', error.message);
        return;
    }

    console.log('✅ Document supprimé de la DB');
}

// Exécuter tous les tests
async function runAllTests() {
    console.log('🚀 Démarrage des tests Supabase Storage...\n');
    console.log('📍 URL:', supabaseUrl);

    const bucketOk = await testBucketExists();
    if (!bucketOk) {
        console.log('\n❌ Tests arrêtés: créez d\'abord le bucket');
        process.exit(1);
    }

    const uploadedPath = await testUpload();
    if (uploadedPath) {
        await testPublicUrl(uploadedPath);
        await testDelete(uploadedPath);
    }

    const docId = await testDatabaseInsert();
    if (docId) {
        await testDatabaseDelete(docId);
    }

    console.log('\n✅ Tous les tests terminés!\n');
}

runAllTests().catch(console.error);
