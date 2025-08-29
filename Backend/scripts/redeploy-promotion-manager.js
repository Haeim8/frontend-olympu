const { ethers } = require("hardhat");

async function main() {
    console.log("🔄 REDÉPLOIEMENT RECPROMOTIONMANAGER");
    console.log("===================================");
    
    // Adresses correctes
    const DIVAR_PROXY_ADDRESS = "0xaB0999Eae920849a41A55eA080d0a4a210156817";
    const PRICE_CONSUMER_ADDRESS = "0x0888C31a910c44a5291F9E4f6Eb440Df74f581Db";
    
    try {
        const [deployer] = await ethers.getSigners();
        console.log("Deployer:", deployer.address);
        console.log("Balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");
        
        // Déployer RecPromotionManager avec BONS paramètres
        console.log("\n🚀 DÉPLOIEMENT RECPROMOTIONMANAGER...");
        
        const RecPromotionManager = await ethers.getContractFactory("RecPromotionManager");
        const recPromotionManager = await RecPromotionManager.deploy(
            DIVAR_PROXY_ADDRESS,    // _recProxy (DivarProxy)
            PRICE_CONSUMER_ADDRESS, // _priceConsumer  
            deployer.address        // _treasury (deployer)
        );
        
        await recPromotionManager.deployed();
        console.log("✅ RecPromotionManager déployé:", recPromotionManager.address);
        
        // Vérifier la configuration
        console.log("\n🔍 VÉRIFICATION CONFIGURATION...");
        const recProxy = await recPromotionManager.recProxy();
        const priceConsumer = await recPromotionManager.priceConsumer();
        const treasury = await recPromotionManager.treasury();
        
        console.log("Configuration:");
        console.log("- RecProxy:", recProxy, recProxy === DIVAR_PROXY_ADDRESS ? "✅" : "❌");
        console.log("- PriceConsumer:", priceConsumer, priceConsumer === PRICE_CONSUMER_ADDRESS ? "✅" : "❌");
        console.log("- Treasury:", treasury, treasury === deployer.address ? "✅" : "❌");
        
        console.log("\n🎉 REDÉPLOIEMENT TERMINÉ !");
        console.log("Nouvelle adresse RecPromotionManager:", recPromotionManager.address);
        
    } catch (error) {
        console.error("❌ Erreur:", error.message);
    }
}

main().catch(console.error);