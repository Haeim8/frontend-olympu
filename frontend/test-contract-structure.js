const { ethers } = require('ethers');

const DIVAR_PROXY_ADDRESS = "0x89Eba0c82c1f16433473A9A06690BfaAC2c7a1b4";
const QUICKNODE_URL = "https://smart-light-model.base-sepolia.quiknode.pro/7ac25fdedf030b2842f4cb83cdc4dae2ed0a6568/";

async function testContractStructure() {
  console.log('🧪 === TEST STRUCTURE CONTRAT ===');
  
  try {
    const provider = new ethers.providers.JsonRpcProvider(QUICKNODE_URL);
    
    // Test 1: Vérifier que DivarProxy fonctionne
    console.log('\n1. 📡 Test DivarProxy.getAllCampaigns()');
    const divarProxy = new ethers.Contract(DIVAR_PROXY_ADDRESS, [
      "function getAllCampaigns() external view returns (address[] memory)"
    ], provider);
    
    const campaigns = await divarProxy.getAllCampaigns();
    console.log(`  ✅ ${campaigns.length} campagnes trouvées`);
    
    if (campaigns.length === 0) {
      console.log('  ⚠️  PROBLÈME: Aucune campagne sur le réseau');
      return;
    }
    
    campaigns.forEach((addr, i) => {
      console.log(`  [${i}] ${addr}`);
    });
    
    // Test 2: Vérifier qu'on peut accéder aux contrats Campaign
    console.log(`\n2. 📡 Test accès Campaign ${campaigns[0]}`);
    
    // Test les fonctions une par une
    const simpleFunctions = [
      "function name() public view returns (string memory)",
      "function symbol() public view returns (string memory)",
      "function totalSupply() public view returns (uint256)"
    ];
    
    for (const funcAbi of simpleFunctions) {
      try {
        const testContract = new ethers.Contract(campaigns[0], [funcAbi], provider);
        const funcName = funcAbi.split(' ')[1].split('(')[0];
        const result = await testContract[funcName]();
        console.log(`  ✅ ${funcName}(): ${result.toString()}`);
      } catch (e) {
        console.log(`  ❌ ${funcAbi}: ${e.message}`);
      }
    }
    
    // Test 3: getCurrentRound spécifiquement
    console.log(`\n3. 📡 Test getCurrentRound()`);
    try {
      const campaign = new ethers.Contract(campaigns[0], [
        "function getCurrentRound() public view returns (uint256)"
      ], provider);
      
      const currentRound = await campaign.getCurrentRound();
      console.log(`  ✅ getCurrentRound(): ${currentRound.toString()}`);
      
      // Test 4: Structure rounds() - TEST CRUCIAL
      console.log(`\n4. 📡 Test rounds(${currentRound.toString()}) - CRUCIAL`);
      
      // D'abord regarder le bytecode pour comprendre
      const code = await provider.getCode(campaigns[0]);
      console.log(`  ➤ Bytecode length: ${code.length} characters`);
      console.log(`  ➤ Contract exists: ${code !== '0x'}`);
      
      if (code === '0x') {
        console.log('  ❌ PROBLÈME: Le contrat n\'existe pas à cette adresse');
        return;
      }
      
      // Test différentes signatures pour rounds()
      const roundsSignatures = [
        "function rounds(uint256) public view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256, bool, bool)",
        "function rounds(uint256) public view returns (tuple(uint256, uint256, uint256, uint256, uint256, uint256, uint256, bool, bool))"
      ];
      
      for (let i = 0; i < roundsSignatures.length; i++) {
        console.log(`\n  Signature ${i + 1}:`);
        try {
          const testCampaign = new ethers.Contract(campaigns[0], [roundsSignatures[i]], provider);
          const roundData = await testCampaign.rounds(currentRound);
          
          console.log(`    ✅ Signature ${i + 1} fonctionne!`);
          console.log(`    ➤ Type: ${typeof roundData}`);
          console.log(`    ➤ Array: ${Array.isArray(roundData)}`);
          console.log(`    ➤ Length: ${roundData?.length}`);
          
          if (Array.isArray(roundData)) {
            console.log(`    ➤ Valeurs:`);
            roundData.forEach((val, idx) => {
              const type = typeof val;
              const strVal = val?.toString?.() || 'N/A';
              console.log(`      [${idx}] ${type}: ${strVal}`);
            });
          } else if (typeof roundData === 'object') {
            console.log(`    ➤ Propriétés object:`);
            for (const key in roundData) {
              if (roundData.hasOwnProperty(key)) {
                console.log(`      ${key}: ${roundData[key]?.toString?.()}`);
              }
            }
          }
          
          break; // Si ça marche, on s'arrête
          
        } catch (e) {
          console.log(`    ❌ Signature ${i + 1} échoue: ${e.message}`);
        }
      }
      
    } catch (e) {
      console.log(`  ❌ getCurrentRound error: ${e.message}`);
    }
    
    // Test 5: Test sur la 2ème campagne s'il y en a une
    if (campaigns.length > 1) {
      console.log(`\n5. 📡 Test campagne 2: ${campaigns[1]}`);
      try {
        const campaign2 = new ethers.Contract(campaigns[1], [
          "function name() public view returns (string memory)",
          "function getCurrentRound() public view returns (uint256)"
        ], provider);
        
        const name = await campaign2.name();
        const round = await campaign2.getCurrentRound();
        console.log(`  ✅ Name: ${name}`);
        console.log(`  ✅ Round: ${round.toString()}`);
        
      } catch (e) {
        console.log(`  ❌ Campagne 2 error: ${e.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ ERREUR GÉNÉRALE:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Exécution
testContractStructure().catch(console.error);