const { ethers } = require("hardhat");

async function debugCampaign() {
    console.log("🔍 DEBUG CAMPAGNE - BASE SEPOLIA");
    console.log("=".repeat(50));
    
    const campaignAddress = "0xAe85110Fc08D812a173a5ae08EE2da3363f0e4e6";
    console.log(`📍 Adresse campagne: ${campaignAddress}`);
    
    try {
        // Connecter à la campagne
        const Campaign = await ethers.getContractFactory("Campaign");
        const campaign = Campaign.attach(campaignAddress);
        
        console.log("✅ Contrat Campaign connecté");
        
        // Test 1: Vérifier le nom de la campagne
        console.log("\n🧪 TEST 1: Informations de base");
        try {
            const name = await campaign.name();
            console.log(`📝 Nom: ${name}`);
        } catch (error) {
            console.log(`❌ Erreur nom: ${error.message}`);
        }
        
        try {
            const symbol = await campaign.symbol();
            console.log(`🏷️ Symbole: ${symbol}`);
        } catch (error) {
            console.log(`❌ Erreur symbole: ${error.message}`);
        }
        
        // Test 2: Variables publiques
        console.log("\n🧪 TEST 2: Variables publiques");
        try {
            const startup = await campaign.startup();
            console.log(`👤 Startup: ${startup}`);
        } catch (error) {
            console.log(`❌ Erreur startup: ${error.message}`);
        }
        
        try {
            const currentRoundNumber = await campaign.currentRound();
            console.log(`📊 Current Round Number: ${currentRoundNumber}`);
        } catch (error) {
            console.log(`❌ Erreur currentRound: ${error.message}`);
        }
        
        // Test 3: getCurrentRound avec call statique
        console.log("\n🧪 TEST 3: getCurrentRound()");
        try {
            const result = await campaign.callStatic.getCurrentRound();
            console.log(`✅ getCurrentRound réussi:`);
            console.log(`   Round: ${result[0]}`);
            console.log(`   Price: ${ethers.utils.formatEther(result[1])} ETH`);
            console.log(`   Target: ${ethers.utils.formatEther(result[2])} ETH`);
            console.log(`   Raised: ${ethers.utils.formatEther(result[3])} ETH`);
            console.log(`   Shares: ${result[4]}`);
            console.log(`   End: ${new Date(result[5].toNumber() * 1000)}`);
            console.log(`   Active: ${result[6]}`);
            console.log(`   Finalized: ${result[7]}`);
        } catch (error) {
            console.log(`❌ Erreur getCurrentRound: ${error.message}`);
            console.log(`   Data: ${error.data || 'no data'}`);
            console.log(`   Code: ${error.code || 'no code'}`);
        }
        
        // Test 4: Accès direct aux rounds
        console.log("\n🧪 TEST 4: Accès direct aux rounds");
        try {
            // Test round 0
            console.log("Tentative round 0...");
            const round0 = await campaign.rounds(0);
            console.log(`Round 0: ${round0}`);
        } catch (error) {
            console.log(`❌ Round 0 inexistant: ${error.message}`);
        }
        
        try {
            // Test round 1
            console.log("Tentative round 1...");
            const round1 = await campaign.rounds(1);
            console.log(`✅ Round 1 existe:`);
            console.log(`   Round Number: ${round1.roundNumber}`);
            console.log(`   Share Price: ${ethers.utils.formatEther(round1.sharePrice)} ETH`);
            console.log(`   Target: ${ethers.utils.formatEther(round1.targetAmount)} ETH`);
            console.log(`   Raised: ${ethers.utils.formatEther(round1.fundsRaised)} ETH`);
            console.log(`   Shares: ${round1.sharesSold}`);
            console.log(`   Active: ${round1.isActive}`);
            console.log(`   Finalized: ${round1.isFinalized}`);
        } catch (error) {
            console.log(`❌ Round 1 erreur: ${error.message}`);
        }
        
        // Test 5: Vérifier le code du contrat
        console.log("\n🧪 TEST 5: Vérifications contrat");
        const code = await ethers.provider.getCode(campaignAddress);
        console.log(`📄 Code size: ${code.length} caractères`);
        
        if (code === "0x") {
            console.log("❌ PROBLÈME: Pas de code déployé !");
        } else {
            console.log("✅ Code déployé correctement");
        }
        
    } catch (error) {
        console.log(`💥 Erreur fatale: ${error.message}`);
    }
}

debugCampaign().catch(console.error);