const { ethers } = require('ethers');

const DIVAR_PROXY_ADDRESS = "0x89Eba0c82c1f16433473A9A06690BfaAC2c7a1b4";
const QUICKNODE_URL = "https://smart-light-model.base-sepolia.quiknode.pro/7ac25fdedf030b2842f4cb83cdc4dae2ed0a6568/";
const FALLBACK_URL = "https://sepolia.base.org";

// ABI minimal pour les tests
const DIVAR_ABI = [
  "function getAllCampaigns() external view returns (address[] memory)"
];

const CAMPAIGN_ABI = [
  "function name() public view returns (string memory)",
  "function symbol() public view returns (string memory)", 
  "function getCurrentRound() public view returns (uint256)",
  "function totalSupply() public view returns (uint256)",
  "function rounds(uint256) public view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256, bool, bool)"
];

async function testGetAllCampaigns() {
  console.log('🧪 === TEST 1: getAllCampaigns ===');
  
  try {
    const provider = new ethers.providers.JsonRpcProvider(QUICKNODE_URL);
    console.log('✅ Provider connecté');
    
    const divarProxy = new ethers.Contract(DIVAR_PROXY_ADDRESS, DIVAR_ABI, provider);
    console.log('✅ Contrat DivarProxy créé');
    
    console.log('📡 Appel getAllCampaigns()...');
    const campaigns = await divarProxy.getAllCampaigns();
    
    console.log('📊 RÉSULTATS:');
    console.log(`  ➤ Nombre de campagnes: ${campaigns.length}`);
    
    if (campaigns.length > 0) {
      console.log('  ➤ Adresses des campagnes:');
      campaigns.forEach((addr, i) => {
        console.log(`    [${i}] ${addr}`);
      });
      return campaigns;
    } else {
      console.log('⚠️  Aucune campagne trouvée');
      return [];
    }
    
  } catch (error) {
    console.error('❌ ERREUR getAllCampaigns:', error.message);
    return null;
  }
}

async function testCampaignBasicData(campaignAddress) {
  console.log(`\n🧪 === TEST 2: Données de base campagne ${campaignAddress} ===`);
  
  try {
    const provider = new ethers.providers.JsonRpcProvider(QUICKNODE_URL);
    const campaign = new ethers.Contract(campaignAddress, CAMPAIGN_ABI, provider);
    
    console.log('📡 Récupération des données de base...');
    
    // Test une par une pour identifier laquelle pose problème
    try {
      const name = await campaign.name();
      console.log(`  ➤ Name: ${name}`);
    } catch (e) {
      console.log(`  ❌ Name: ${e.message}`);
    }
    
    try {
      const symbol = await campaign.symbol();
      console.log(`  ➤ Symbol: ${symbol}`);
    } catch (e) {
      console.log(`  ❌ Symbol: ${e.message}`);
    }
    
    try {
      const currentRound = await campaign.getCurrentRound();
      console.log(`  ➤ Current Round: ${currentRound.toString()}`);
      
      // Test rounds() avec le numéro de round trouvé
      console.log(`\n📡 Test rounds(${currentRound.toString()})...`);
      const roundData = await campaign.rounds(currentRound);
      
      console.log('  ➤ Round Data (RAW):');
      console.log('    Type:', typeof roundData);
      console.log('    Is Array:', Array.isArray(roundData));
      console.log('    Length:', roundData.length);
      
      if (Array.isArray(roundData)) {
        roundData.forEach((item, i) => {
          console.log(`    [${i}] Type: ${typeof item}, Value: ${item.toString()}`);
        });
      }
      
    } catch (e) {
      console.log(`  ❌ getCurrentRound/rounds: ${e.message}`);
    }
    
  } catch (error) {
    console.error(`❌ ERREUR campagne ${campaignAddress}:`, error.message);
  }
}

async function runAllTests() {
  console.log('🚀 DÉBUT DES TESTS DE DEBUG\n');
  
  // Test 1: getAllCampaigns
  const campaigns = await testGetAllCampaigns();
  
  if (campaigns && campaigns.length > 0) {
    // Test 2: Données de chaque campagne
    for (const campaignAddr of campaigns) {
      await testCampaignBasicData(campaignAddr);
      
      // Délai entre tests
      console.log('\n⏳ Délai 2s...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('🏁 TESTS TERMINÉS');
}

// Exécution
runAllTests().catch(console.error);