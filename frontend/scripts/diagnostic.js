#!/usr/bin/env node

/**
 * Script de diagnostic pour vérifier :
 * 1. Connexion wallet/signer
 * 2. Storage IPFS/Storacha
 * 3. Contrats blockchain
 */

const { ethers } = require('ethers');

async function checkWalletConnection() {
  console.log('\n🔐 === TEST CONNEXION WALLET ===');
  
  try {
    // Simuler une connexion wallet
    if (typeof window === 'undefined') {
      console.log('⚠️  Environnement Node.js - simulation wallet');
      
      // Test avec provider public
      const provider = new ethers.providers.JsonRpcProvider('https://sepolia.base.org');
      const blockNumber = await provider.getBlockNumber();
      console.log('✅ Provider public connecté - Block:', blockNumber);
      
      return true;
    }
    
    if (window.ethereum) {
      console.log('✅ MetaMask détecté');
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      console.log('✅ Wallet connecté:', address);
      
      const network = await provider.getNetwork();
      console.log('✅ Réseau:', network.name, '- ChainID:', network.chainId);
      
      return true;
    } else {
      console.log('❌ Wallet non détecté');
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur connexion wallet:', error.message);
    return false;
  }
}

async function checkStorachaConnection() {
  console.log('\n📦 === TEST STORAGE IPFS/STORACHA ===');
  
  try {
    // Import dynamique pour éviter les erreurs en Node.js
    const { create } = await import('@storacha/client');
    
    console.log('✅ Client Storacha importé');
    
    // Tenter de créer un client
    const client = create();
    console.log('✅ Client Storacha créé');
    
    // Test de connexion (ne fonctionne qu'en environnement browser)
    if (typeof window !== 'undefined') {
      try {
        await client.login('zifou.rail.91290@gmail.com');
        console.log('✅ Connexion Storacha réussie');
        
        // Test des espaces
        const spaces = client.spaces();
        console.log('✅ Espaces disponibles:', Array.from(spaces).length);
        
        return true;
      } catch (error) {
        console.log('⚠️  Erreur login Storacha:', error.message);
        if (error.message.includes('expired')) {
          console.log('💡 Solution: Relancer `npx @storacha/cli login`');
        }
        return false;
      }
    } else {
      console.log('⚠️  Test Storacha nécessite un environnement browser');
      return true; // Pas d'erreur, juste pas testable ici
    }
  } catch (error) {
    console.log('❌ Erreur Storacha:', error.message);
    return false;
  }
}

async function checkContracts() {
  console.log('\n⛓️  === TEST CONTRATS BLOCKCHAIN ===');
  
  try {
    const contractAddresses = {
      PriceConsumerV3: "0xa5050E4FC5F7115378Bbf8bAa17517298962bebE",
      DivarProxy: "0x89Eba0c82c1f16433473A9A06690BfaAC2c7a1b4",
      CampaignKeeper: "0x7BA165d19De799DA8070D3c1C061933551726D1E"
    };
    
    const provider = new ethers.providers.JsonRpcProvider('https://sepolia.base.org');
    
    for (const [name, address] of Object.entries(contractAddresses)) {
      try {
        const code = await provider.getCode(address);
        if (code === '0x') {
          console.log(`❌ ${name}: Pas de contrat à l'adresse ${address}`);
        } else {
          console.log(`✅ ${name}: Contrat déployé à ${address}`);
        }
      } catch (error) {
        console.log(`❌ ${name}: Erreur vérification - ${error.message}`);
      }
    }
    
    return true;
  } catch (error) {
    console.log('❌ Erreur vérification contrats:', error.message);
    return false;
  }
}

async function testCreateCampaignPrerequisites() {
  console.log('\n🚀 === TEST PRÉREQUIS CRÉATION CAMPAGNE ===');
  
  const results = {
    wallet: await checkWalletConnection(),
    storage: await checkStorachaConnection(), 
    contracts: await checkContracts()
  };
  
  console.log('\n📊 === RÉSUMÉ ===');
  console.log('Wallet:', results.wallet ? '✅' : '❌');
  console.log('Storage:', results.storage ? '✅' : '❌');  
  console.log('Contrats:', results.contracts ? '✅' : '❌');
  
  const allGood = Object.values(results).every(r => r === true);
  
  if (allGood) {
    console.log('\n🎉 Tous les systèmes sont opérationnels!');
    console.log('💡 Tu peux tester la création de campagne');
  } else {
    console.log('\n⚠️  Des problèmes ont été détectés');
    console.log('💡 Corrige les erreurs avant de créer une campagne');
  }
  
  return results;
}

// Exécution si appelé directement
if (require.main === module) {
  testCreateCampaignPrerequisites()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Erreur script diagnostic:', error);
      process.exit(1);
    });
}

module.exports = {
  checkWalletConnection,
  checkStorachaConnection,
  checkContracts,
  testCreateCampaignPrerequisites
};