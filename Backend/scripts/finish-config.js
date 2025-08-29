const { ethers } = require("hardhat");

// Addresses déjà déployées
const DEPLOYED_ADDRESSES = {
    divarProxy: "0x784bdd6c63eD466BBF133B3853461d83AB433771",
    campaignKeeper: "0xE725A3a2d1D5D26f6BB1aa95D090D93e310ba9EE"
};

async function finishConfiguration() {
    console.log("🔧 FINALISATION CONFIG - PAS DE REDÉPLOIEMENT");
    console.log("=".repeat(50));
    
    const [deployer] = await ethers.getSigners();
    console.log(`👤 Configurateur: ${deployer.address}`);
    
    const balance = await deployer.getBalance();
    console.log(`💰 Balance: ${ethers.utils.formatEther(balance)} ETH`);
    
    // Connecter aux contrats existants
    const DivarProxy = await ethers.getContractFactory("DivarProxy");
    const divarProxy = DivarProxy.attach(DEPLOYED_ADDRESSES.divarProxy);
    
    try {
        // Configurer le bytecode Campaign
        console.log("\n📝 Configuration bytecode Campaign...");
        const CampaignFactory = await ethers.getContractFactory("Campaign");
        
        // Estimation du gas pour être sûr
        const gasEstimate = await divarProxy.estimateGas.setCampaignBytecode(CampaignFactory.bytecode);
        console.log(`⛽ Gas estimé: ${gasEstimate.toLocaleString()}`);
        
        const gasPrice = await ethers.provider.getGasPrice();
        const cost = gasEstimate.mul(gasPrice);
        console.log(`💰 Coût: ${ethers.utils.formatEther(cost)} ETH`);
        
        // Vérifier qu'on a assez
        if (balance.lt(cost.mul(2))) { // marge x2
            console.log("❌ PAS ASSEZ D'ETH pour cette config !");
            console.log(`   Besoin: ${ethers.utils.formatEther(cost.mul(2))} ETH`);
            console.log(`   Disponible: ${ethers.utils.formatEther(balance)} ETH`);
            return false;
        }
        
        // Exécuter
        const tx = await divarProxy.setCampaignBytecode(CampaignFactory.bytecode);
        console.log(`🚀 Transaction: ${tx.hash}`);
        
        await tx.wait();
        console.log("✅ Bytecode Campaign configuré !");
        
        console.log("\n🎉 SYSTÈME LIVAR 100% FONCTIONNEL !");
        console.log("\n📋 ADDRESSES FINALES:");
        console.log(`DivarProxy: ${DEPLOYED_ADDRESSES.divarProxy}`);
        console.log(`CampaignKeeper: ${DEPLOYED_ADDRESSES.campaignKeeper}`);
        
        console.log("\n🔗 VÉRIFIER SUR:");
        console.log(`https://sepolia.basescan.org/address/${DEPLOYED_ADDRESSES.divarProxy}`);
        
        return true;
        
    } catch (error) {
        console.log("❌ ERREUR CONFIG:", error.message);
        return false;
    }
}

async function main() {
    const success = await finishConfiguration();
    
    if (success) {
        console.log("✅ CONFIG TERMINÉE - SYSTÈME PRÊT !");
    } else {
        console.log("❌ CONFIG ÉCHOUÉ - NEED MORE ETH");
    }
}

main().catch(console.error);