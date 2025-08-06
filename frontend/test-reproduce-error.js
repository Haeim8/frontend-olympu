const { ethers } = require('ethers');

const DIVAR_PROXY_ADDRESS = "0x89Eba0c82c1f16433473A9A06690BfaAC2c7a1b4";
const QUICKNODE_URL = "https://smart-light-model.base-sepolia.quiknode.pro/7ac25fdedf030b2842f4cb83cdc4dae2ed0a6568/";

// Reproduction exacte de l'erreur du frontend
async function reproduceError() {
  console.log('🧪 === REPRODUCTION EXACTE DE L\'ERREUR ===');
  
  try {
    const provider = new ethers.providers.JsonRpcProvider(QUICKNODE_URL);
    
    // 1. Récupérer les campagnes
    const divarProxy = new ethers.Contract(DIVAR_PROXY_ADDRESS, [
      "function getAllCampaigns() external view returns (address[] memory)"
    ], provider);
    
    const campaigns = await divarProxy.getAllCampaigns();
    console.log(`📊 ${campaigns.length} campagnes trouvées`);
    
    if (campaigns.length === 0) return;
    
    const campaignAddr = campaigns[0];
    console.log(`🎯 Test avec: ${campaignAddr}`);
    
    // 2. Reproduction exacte de getCampaignData
    console.log('\n📡 Reproduction getCampaignData...');
    
    const campaign = new ethers.Contract(campaignAddr, [
      "function name() public view returns (string memory)",
      "function symbol() public view returns (string memory)",
      "function getCurrentRound() public view returns (uint256)",
      "function totalSupply() public view returns (uint256)",
      "function rounds(uint256) public view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256, bool, bool)"
    ], provider);
    
    const divarProxyFull = new ethers.Contract(DIVAR_PROXY_ADDRESS, [
      "function campaignRegistry(address) external view returns (tuple(address creator, string category, string metadata, string logo))"
    ], provider);
    
    console.log('Step 1: Appels Promise.all...');
    const [name, symbol, currentRound, totalShares, registry] = await Promise.all([
      campaign.name(),
      campaign.symbol(), 
      campaign.getCurrentRound(),
      campaign.totalSupply(),
      divarProxyFull.campaignRegistry(campaignAddr)
    ]);
    
    console.log('✅ Promise.all réussi:');
    console.log(`  Name: ${name}`);
    console.log(`  Symbol: ${symbol}`);
    console.log(`  CurrentRound: ${currentRound.toString()}`);
    console.log(`  TotalShares: ${totalShares.toString()}`);
    console.log(`  Registry Creator: ${registry.creator}`);
    
    console.log('\nStep 2: Appel rounds()...');
    const roundData = await campaign.rounds(currentRound);
    
    console.log('✅ rounds() réussi:');
    console.log('  Type:', typeof roundData);
    console.log('  Array:', Array.isArray(roundData));
    console.log('  Length:', roundData?.length);
    
    if (Array.isArray(roundData)) {
      console.log('\n📊 Analyse détaillée de roundData:');
      roundData.forEach((item, i) => {
        console.log(`[${i}] Type: ${typeof item}`);
        console.log(`    Value: ${item}`);
        console.log(`    ToString: ${item.toString()}`);
        
        if (typeof item === 'object') {
          console.log(`    Has _hex: ${item._hex !== undefined}`);
          console.log(`    Has type: ${item.type !== undefined}`);
          if (item._hex) console.log(`    _hex: ${item._hex}`);
          if (item.type) console.log(`    type: ${item.type}`);
        }
        console.log('');
      });
    }
    
    // 3. Test formatEthValue exact du frontend
    console.log('\n🧪 Test formatEthValue exacte...');
    
    function formatEthValue(value) {
      console.log(`\nformatEthValue input:`, value);
      console.log(`  Type: ${typeof value}`);
      console.log(`  Array: ${Array.isArray(value)}`);
      
      if (!value) return "0";
      
      try {
        // PROTECTION: Si c'est un array, on ne traite pas
        if (Array.isArray(value)) {
          console.warn('formatEthValue reçoit un array, valeur ignorée:', value);
          return "0";
        }

        let numericValue;
        
        // Si c'est un objet BigNumber avec .hex
        if (typeof value === 'object' && value.hex) {
          numericValue = parseInt(value.hex, 16);
        } 
        // Si c'est déjà une string hex
        else if (typeof value === 'string' && value.startsWith('0x')) {
          numericValue = parseInt(value, 16);
        }
        // Si c'est un BigNumber objet avec toString()
        else if (typeof value === 'object' && typeof value.toString === 'function') {
          const strValue = value.toString();
          numericValue = parseFloat(strValue);
        }
        // Si c'est un nombre ou string normale
        else {
          numericValue = parseFloat(value.toString());
        }
        
        if (numericValue === 0 || isNaN(numericValue)) return "0";
        
        // Conversion de Wei vers Ether (diviser par 10^18)
        const ethValue = numericValue / Math.pow(10, 18);
        return ethValue.toFixed(6); // Limite à 6 décimales
      } catch (error) {
        console.error('Erreur formatEthValue:', error, 'value:', value);
        return "0";
      }
    }
    
    // Test sur les index problématiques
    console.log('\n🔍 Test formatEthValue sur les index:');
    const testIndexes = [1, 2, 3]; // sharePrice, targetAmount, fundsRaised
    
    for (const idx of testIndexes) {
      if (roundData[idx] !== undefined) {
        console.log(`\n--- Index ${idx} ---`);
        const result = formatEthValue(roundData[idx]);
        console.log(`Result: ${result}`);
      }
    }
    
    // 4. Construction complète de campaignData comme dans le frontend
    console.log('\n🔧 Construction campaignData complète...');
    
    try {
      const campaignData = {
        address: campaignAddr,
        id: campaignAddr,
        name,
        symbol,
        currentRound: currentRound.toString(),
        totalShares: totalShares.toString(),
        
        // Données du round (en utilisant les index corrects)
        roundNumber: roundData[0].toString(),
        sharePrice: formatEthValue(roundData[1]),
        targetAmount: formatEthValue(roundData[2]),
        fundsRaised: formatEthValue(roundData[3]),
        sharesSold: roundData[4].toString(),
        startTime: roundData[5].toString(),
        endTime: roundData[6].toString(),
        isActive: roundData[7],
        isFinalized: roundData[8],
        
        // Données du registry
        creator: registry.creator,
        category: registry.category,
        metadata: registry.metadata,
        logo: registry.logo,
        
        // Propriétés OBLIGATOIRES pour CampaignCard
        goal: formatEthValue(roundData[2]),
        raised: formatEthValue(roundData[3]),
        sector: registry.category,
        endDate: new Date(parseInt(roundData[6]) * 1000).toISOString(),
        
        // Propriétés calculées
        progressPercentage: roundData[2].toString() !== '0' ? 
          (parseFloat(formatEthValue(roundData[3])) / parseFloat(formatEthValue(roundData[2]))) * 100 : 0,
        investors: Math.floor(Math.random() * 50) + 10,
        isCertified: Math.random() > 0.7
      };
      
      console.log('✅ CampaignData créé avec succès:');
      console.log(JSON.stringify(campaignData, null, 2));
      
    } catch (e) {
      console.log('❌ Erreur construction campaignData:', e.message);
      console.log('Stack:', e.stack);
    }
    
  } catch (error) {
    console.error('❌ ERREUR REPRODUCTION:', error.message);
    console.error('Stack:', error.stack);
    
    // Log détaillé pour comprendre
    if (error.code === 'INVALID_ARGUMENT') {
      console.log('\n🔍 ANALYSE ERREUR INVALID_ARGUMENT:');
      console.log('Code:', error.code);
      console.log('Argument:', error.argument);
      console.log('Value:', error.value);
      console.log('Reason:', error.reason);
    }
  }
}

// Exécution
reproduceError().catch(console.error);