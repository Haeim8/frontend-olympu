// Test rapide pour vérifier si les campagnes se chargent
import { ethers } from 'ethers';

async function testCampaignLoading() {
  console.log('🧪 Test de chargement des campagnes...');
  
  try {
    // Configuration RPC
    const quicknodeUrl = process.env.NEXT_PUBLIC_QUICKNODE_HTTP_URL;
    const fallbackUrl = "https://sepolia.base.org";
    
    const provider = new ethers.providers.JsonRpcProvider(quicknodeUrl || fallbackUrl);
    console.log('✅ Provider RPC connecté');
    
    // Adresse DivarProxy
    const divarProxyAddress = "0x89Eba0c82c1f16433473A9A06690BfaAC2c7a1b4";
    
    // ABI simplifié pour getAllCampaigns
    const abi = [
      "function getAllCampaigns() external view returns (address[] memory)"
    ];
    
    const contract = new ethers.Contract(divarProxyAddress, abi, provider);
    console.log('✅ Contrat DivarProxy créé');
    
    // Test getAllCampaigns
    console.log('📡 Appel getAllCampaigns()...');
    const campaigns = await contract.getAllCampaigns();
    
    console.log('📊 RÉSULTATS:');
    console.log('  - Nombre de campagnes:', campaigns.length);
    console.log('  - Adresses des campagnes:', campaigns);
    
    if (campaigns.length > 0) {
      console.log('✅ SUCCESS: Des campagnes existent sur le réseau!');
      return { success: true, campaigns };
    } else {
      console.log('⚠️  WARNING: Aucune campagne trouvée sur le réseau');
      return { success: true, campaigns: [] };
    }
    
  } catch (error) {
    console.error('❌ ERROR: Échec du test:', error.message);
    return { success: false, error: error.message };
  }
}

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testCampaignLoading;
} else if (typeof window !== 'undefined') {
  window.testCampaignLoading = testCampaignLoading;
}

console.log('🎯 Script de test créé. Utilisez testCampaignLoading() pour tester.');