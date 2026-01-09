/**
 * Test simplifié pour déboguer Supabase Storage
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Présente (longueur: ' + supabaseKey.length + ')' : 'Manquante');

const supabase = createClient(supabaseUrl, supabaseKey);

// Test 1: Lister tous les buckets
console.log('\n1️⃣ Liste de tous les buckets:');
const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

if (bucketsError) {
    console.error('❌ Erreur:', bucketsError);
} else {
    console.log('✅ Buckets trouvés:', buckets.length);
    buckets.forEach(b => {
        console.log(`  - ${b.name} (${b.id}) - Public: ${b.public}`);
    });
}

// Test 2: Essayer de créer le bucket via l'API
if (!buckets?.find(b => b.id === 'campaign-documents')) {
    console.log('\n2️⃣ Bucket campaign-documents absent, tentative de création...');
    console.log('⚠️  Note: Cela nécessite des permissions service_role');

    const { data: newBucket, error: createError } = await supabase.storage.createBucket('campaign-documents', {
        public: true,
        fileSizeLimit: 52428800 // 50MB
    });

    if (createError) {
        console.error('❌ Impossible de créer (attendu avec anon key):', createError.message);
    } else {
        console.log('✅ Bucket créé:', newBucket);
    }
}

// Test 3: Uploader un fichier test
console.log('\n3️⃣ Test d\'upload dans campaign-documents:');
const testContent = Buffer.from('Test - ' + new Date().toISOString());
const fileName = `test/test_${Date.now()}.txt`;

const { data: uploadData, error: uploadError } = await supabase.storage
    .from('campaign-documents')
    .upload(fileName, testContent, {
        contentType: 'text/plain'
    });

if (uploadError) {
    console.error('❌ Upload échoué:', uploadError.message);
    console.error('Détails:', uploadError);
} else {
    console.log('✅ Upload réussi:', uploadData.path);

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
        .from('campaign-documents')
        .getPublicUrl(uploadData.path);

    console.log('🔗 URL:', urlData.publicUrl);

    // Nettoyer
    await supabase.storage.from('campaign-documents').remove([uploadData.path]);
    console.log('🗑️  Fichier test supprimé');
}
