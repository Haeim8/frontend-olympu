#!/usr/bin/env node

/**
 * Script pour debugger le problème de liaison CID IPFS <-> Campagne
 */

const { ethers } = require('ethers');

// Configuration
const contractAddresses = {
  DivarProxy: "0x89Eba0c82c1f16433473A9A06690BfaAC2c7a1b4"
};

async function debugCampaignIPFS() {
  console.log('🔍 === DEBUG CAMPAGNE IPFS ===\n');
  
  try {
    // 1. Connexion au provider
    console.log('1. Connexion à la blockchain...');
    const provider = new ethers.providers.JsonRpcProvider('https://sepolia.base.org');
    const blockNumber = await provider.getBlockNumber();
    console.log('✅ Connecté au bloc:', blockNumber);
    
    // 2. Récupération des campagnes
    console.log('\n2. Récupération des campagnes...');
    
    // ABI minimal pour DivarProxy (structure correcte)
    const divarProxyABI = [
      "function getAllCampaigns() external view returns (address[])",
      "function getCampaignRegistry(address _campaign) external view returns (tuple(address campaignAddress, address creator, uint256 creationTime, uint256 targetAmount, string category, bool isActive, string name, string metadata, string logo, address escrowAddress))"
    ];
    
    const divarProxy = new ethers.Contract(
      contractAddresses.DivarProxy,
      divarProxyABI,
      provider
    );
    
    const campaigns = await divarProxy.getAllCampaigns();
    console.log('✅ Campagnes trouvées:', campaigns.length);
    
    if (campaigns.length === 0) {
      console.log('❌ Aucune campagne trouvée!');
      return;
    }
    
    // 3. Analyser la dernière campagne (la plus récente)
    const lastCampaign = campaigns[campaigns.length - 1];
    console.log('\n3. Analyse de la dernière campagne:', lastCampaign);
    
    try {
      const registry = await divarProxy.getCampaignRegistry(lastCampaign);
      console.log('\n📊 DONNÉES CAMPAGNE:');
      console.log('   Adresse:', registry.campaignAddress);
      console.log('   Créateur:', registry.creator);
      console.log('   Nom:', registry.name);
      console.log('   Catégorie:', registry.category);
      console.log('   Active:', registry.isActive);
      console.log('   📝 METADATA (CID):', registry.metadata);
      console.log('   Logo:', registry.logo);
      
      // 4. Vérifier le format du CID
      if (!registry.metadata) {
        console.log('❌ PROBLÈME: Metadata vide!');
        return;
      }
      
      if (!registry.metadata.startsWith('ipfs://')) {
        console.log('❌ PROBLÈME: Metadata ne commence pas par "ipfs://"');
        console.log('   Format actuel:', registry.metadata);
        return;
      }
      
      const cid = registry.metadata.replace('ipfs://', '');
      console.log('✅ CID extrait:', cid);
      
      // 5. Tester l'accès IPFS
      console.log('\n4. Test d\'accès IPFS...');
      
      const gateways = [
        `https://${cid}.ipfs.w3s.link/campaign-data.json`,
        `https://ipfs.io/ipfs/${cid}/campaign-data.json`,
        `https://gateway.pinata.cloud/ipfs/${cid}/campaign-data.json`
      ];
      
      for (const gateway of gateways) {
        try {
          console.log('   Tentative:', gateway);
          const response = await fetch(gateway);
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ IPFS accessible via:', gateway);
            console.log('📄 Données trouvées:');
            console.log('   Name:', data.name);
            console.log('   Description:', data.description);
            console.log('   Sector:', data.sector);
            console.log('   Team members:', data.teamMembers?.length || 0);
            console.log('   Socials:', Object.keys(data.socials || {}).length);
            return true;
          } else {
            console.log('   ❌ HTTP', response.status);
          }
        } catch (error) {
          console.log('   ❌ Erreur:', error.message);
        }
      }
      
      console.log('❌ PROBLÈME: Aucun gateway IPFS accessible!');
      console.log('💡 Le CID existe sur blockchain mais les données ne sont pas accessibles');
      
    } catch (error) {
      console.log('❌ Erreur lecture registry:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Erreur générale:', error.message);
  }
}

// Fonction pour vérifier une adresse de campagne spécifique
async function debugSpecificCampaign(campaignAddress) {
  if (!campaignAddress) {
    console.log('❌ Adresse de campagne requise');
    return;
  }
  
  console.log('🎯 Debug campagne spécifique:', campaignAddress);
  // Implement specific campaign debug logic here
}

if (require.main === module) {
  const campaignAddress = process.argv[2];
  
  if (campaignAddress) {
    debugSpecificCampaign(campaignAddress)
      .then(() => process.exit(0))
      .catch(error => {
        console.error('Erreur:', error);
        process.exit(1);
      });
  } else {
    debugCampaignIPFS()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('Erreur:', error);
        process.exit(1);
      });
  }
}

module.exports = { debugCampaignIPFS, debugSpecificCampaign };