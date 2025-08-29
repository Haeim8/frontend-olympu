const { ethers } = require("hardhat");

async function deploySimple(contractName, constructorArgs = []) {
    console.log(`📦 Déploiement ${contractName}...`);
    
    const ContractFactory = await ethers.getContractFactory(contractName);
    const contract = await ContractFactory.deploy(...constructorArgs);
    
    console.log(`🚀 Transaction: ${contract.deployTransaction.hash}`);
    await contract.deployed();
    console.log(`✅ ${contractName}: ${contract.address}`);
    
    return contract;
}

async function main() {
    console.log("🚀 DÉPLOIEMENT SIMPLE - BASE SEPOLIA");
    console.log("=".repeat(50));
    
    const [deployer] = await ethers.getSigners();
    console.log(`👤 Déployeur: ${deployer.address}`);
    
    const balance = await deployer.getBalance();
    console.log(`💰 Balance: ${ethers.utils.formatEther(balance)} ETH`);
    
    try {
        // 1. PriceConsumerV3
        const priceConsumer = await deploySimple("PriceConsumerV3", []);
        
        // 2. DivarProxy en mode normal (pas upgradeable)
        const divarProxy = await deploySimple("DivarProxy", []);
        
        // 3. Initialiser DivarProxy
        console.log("🔧 Initialisation DivarProxy...");
        const initTx = await divarProxy.initialize(
            deployer.address,     // treasury
            deployer.address,     // campaignKeeper temporaire  
            priceConsumer.address // priceConsumer
        );
        await initTx.wait();
        console.log("✅ DivarProxy initialisé");
        
        // 4. CampaignKeeper
        const campaignKeeper = await deploySimple("CampaignKeeper", [divarProxy.address]);
        
        // 5. Configuration
        console.log("🔧 Configuration...");
        await divarProxy.setCampaignKeeper(campaignKeeper.address);
        
        const CampaignFactory = await ethers.getContractFactory("Campaign");
        await divarProxy.setCampaignBytecode(CampaignFactory.bytecode);
        
        console.log("🎉 DÉPLOIEMENT SIMPLE TERMINÉ !");
        console.log(`DivarProxy: ${divarProxy.address}`);
        console.log(`CampaignKeeper: ${campaignKeeper.address}`);
        console.log(`PriceConsumer: ${priceConsumer.address}`);
        
    } catch (error) {
        console.log("❌ ERREUR:", error.message);
        throw error;
    }
}

main().catch(console.error);