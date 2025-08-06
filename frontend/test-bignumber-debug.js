const { ethers } = require('ethers');

const DIVAR_PROXY_ADDRESS = "0x89Eba0c82c1f16433473A9A06690BfaAC2c7a1b4";
const QUICKNODE_URL = "https://smart-light-model.base-sepolia.quiknode.pro/7ac25fdedf030b2842f4cb83cdc4dae2ed0a6568/";

// ABI exact d'après les erreurs dans la console
const CAMPAIGN_ABI = [
  "function rounds(uint256) public view returns (tuple(uint256 roundNumber, uint256 sharePrice, uint256 targetAmount, uint256 fundsRaised, uint256 sharesSold, uint256 startTime, uint256 endTime, bool isActive, bool isFinalized))"
];

const DIVAR_ABI = [
  "function getAllCampaigns() external view returns (address[] memory)",
  "function campaignRegistry(address) external view returns (tuple(address creator, string category, string metadata, string logo))"
];

async function testBigNumberIssue() {
  console.log('🧪 === TEST BIGNUMBER DEBUG ===');
  
  try {
    const provider = new ethers.providers.JsonRpcProvider(QUICKNODE_URL);
    const divarProxy = new ethers.Contract(DIVAR_PROXY_ADDRESS, DIVAR_ABI, provider);
    
    // Récupérer les campagnes
    const campaigns = await divarProxy.getAllCampaigns();
    console.log(`📊 ${campaigns.length} campagnes trouvées`);
    
    if (campaigns.length === 0) {
      console.log('⚠️  Aucune campagne à tester');
      return;
    }
    
    const campaignAddr = campaigns[0];
    console.log(`\n🎯 Test avec campagne: ${campaignAddr}`);
    
    // Test avec l'ABI simple d'abord
    const simpleCampaign = new ethers.Contract(campaignAddr, [
      "function getCurrentRound() public view returns (uint256)",
      "function rounds(uint256) public view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256, bool, bool)"
    ], provider);
    
    console.log('📡 getCurrentRound()...');
    const currentRound = await simpleCampaign.getCurrentRound();
    console.log(`  ➤ Current Round: ${currentRound.toString()}`);
    
    console.log('\n📡 rounds() avec ABI simple...');
    const roundDataSimple = await simpleCampaign.rounds(currentRound);
    console.log('  ➤ Données rounds (format array):');
    console.log('    Type:', typeof roundDataSimple);
    console.log('    Length:', roundDataSimple?.length);
    
    if (Array.isArray(roundDataSimple)) {
      roundDataSimple.forEach((item, i) => {
        console.log(`    [${i}] ${typeof item}: ${item.toString()}`);
        
        // Test BigNumber operations
        if (typeof item === 'object' && item._hex !== undefined) {
          console.log(`      ↳ _hex: ${item._hex}`);
          console.log(`      ↳ toString(): ${item.toString()}`);
        }
      });
    }
    
    // Test formatEthValue manually
    console.log('\n🧪 Test formatEthValue sur chaque valeur:');
    if (Array.isArray(roundDataSimple) && roundDataSimple.length >= 9) {
      const testValues = [
        { name: 'sharePrice', index: 1, value: roundDataSimple[1] },
        { name: 'targetAmount', index: 2, value: roundDataSimple[2] },
        { name: 'fundsRaised', index: 3, value: roundDataSimple[3] }
      ];
      
      for (const test of testValues) {
        try {
          console.log(`\n  ➤ ${test.name} (index ${test.index}):`);
          console.log(`    Value type: ${typeof test.value}`);
          console.log(`    Raw value: ${test.value}`);
          
          // Tentative de conversion manuelle
          let numericValue;
          if (typeof test.value === 'object' && test.value._hex) {
            numericValue = parseInt(test.value._hex, 16);
            console.log(`    Hex to number: ${numericValue}`);
            
            // Conversion Wei vers ETH
            const ethValue = numericValue / Math.pow(10, 18);
            console.log(`    ETH value: ${ethValue}`);
          } else if (typeof test.value === 'string') {
            numericValue = parseFloat(test.value);
            console.log(`    Parsed: ${numericValue}`);
          }
          
        } catch (e) {
          console.log(`    ❌ Erreur ${test.name}: ${e.message}`);
        }
      }
    }
    
    // Test registry data
    console.log('\n📡 Test campaignRegistry...');
    try {
      const registryData = await divarProxy.campaignRegistry(campaignAddr);
      console.log('  ➤ Registry data:');
      console.log(`    Creator: ${registryData.creator}`);
      console.log(`    Category: ${registryData.category}`);
      console.log(`    Metadata: ${registryData.metadata}`);
      console.log(`    Logo: ${registryData.logo}`);
    } catch (e) {
      console.log(`  ❌ Registry error: ${e.message}`);
    }
    
  } catch (error) {
    console.error('❌ ERREUR GÉNÉRALE:', error);
    console.error('Stack:', error.stack);
  }
}

// Exécution
testBigNumberIssue().catch(console.error);