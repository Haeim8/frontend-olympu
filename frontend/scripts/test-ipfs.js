#!/usr/bin/env node

/**
 * Test isolé pour diagnostiquer les problèmes IPFS/Storacha
 */

async function testStorachaUpload() {
  console.log('🧪 === TEST UPLOAD STORACHA ===\n');
  
  try {
    console.log('1. Import du client Storacha...');
    const { create } = await import('@storacha/client');
    console.log('✅ Client importé');
    
    console.log('2. Création du client...');
    const client = create();
    console.log('✅ Client créé');
    
    console.log('3. Tentative de login...');
    console.log('   Email:', process.env.NEXT_PUBLIC_W3UP_EMAIL);
    
    try {
      await client.login(process.env.NEXT_PUBLIC_W3UP_EMAIL);
      console.log('✅ Login réussi');
    } catch (loginError) {
      console.log('❌ Erreur login:', loginError.message);
      console.log('💡 Essaye: npx @storacha/cli login zifou.rail.91290@gmail.com');
      return false;
    }
    
    console.log('4. Vérification des espaces...');
    const spaces = Array.from(client.spaces());
    console.log('📦 Espaces disponibles:', spaces.length);
    
    if (spaces.length === 0) {
      console.log('❌ Aucun espace disponible');
      console.log('💡 Crée un espace avec: npx @storacha/cli space create');
      return false;
    }
    
    console.log('5. Test d\'upload simple...');
    const testFile = new File(['Test content'], 'test.txt', { type: 'text/plain' });
    
    console.log('   Tentative d\'upload du fichier test...');
    const startTime = Date.now();
    
    try {
      const cid = await client.uploadFile(testFile);
      const uploadTime = Date.now() - startTime;
      console.log('✅ Upload réussi!');
      console.log('📝 CID:', cid.toString());
      console.log('⏱️  Temps:', uploadTime + 'ms');
      return true;
    } catch (uploadError) {
      const uploadTime = Date.now() - startTime;
      console.log('❌ Erreur upload après', uploadTime + 'ms');
      console.log('   Message:', uploadError.message);
      console.log('   Stack:', uploadError.stack);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Erreur générale:', error.message);
    console.log('   Stack:', error.stack);
    return false;
  }
}

async function testWithTimeout() {
  console.log('🚀 Démarrage test IPFS avec timeout...\n');
  
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('TIMEOUT après 30 secondes')), 30000);
  });
  
  try {
    const result = await Promise.race([
      testStorachaUpload(),
      timeoutPromise
    ]);
    
    if (result) {
      console.log('\n🎉 Test IPFS réussi - Upload fonctionne!');
      console.log('💡 Le problème vient probablement d\'autre chose');
    } else {
      console.log('\n⚠️  Test IPFS échoué - Problème de configuration');
    }
    
    return result;
  } catch (error) {
    if (error.message.includes('TIMEOUT')) {
      console.log('\n⏰ TIMEOUT - Upload trop lent ou bloqué');
      console.log('💡 Problème de connexion réseau ou serveur Storacha');
    } else {
      console.log('\n❌ Erreur inattendue:', error.message);
    }
    return false;
  }
}

// Variables d'environnement (simulation)
process.env.NEXT_PUBLIC_W3UP_EMAIL = 'zifou.rail.91290@gmail.com';

if (require.main === module) {
  testWithTimeout()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { testStorachaUpload };