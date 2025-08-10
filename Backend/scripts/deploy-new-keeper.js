const { ethers } = require("hardhat");

async function main() {
    console.log("🤖 === DÉPLOIEMENT NOUVEAU CAMPAIGNKEEPER ===");
    
    const PROXY_ADDRESS = "0x89Eba0c82c1f16433473A9A06690BfaAC2c7a1b4";
    const OLD_KEEPER = "0x7BA165d19De799DA8070D3c1C061933551726D1E";
    
    console.log("📍 DivarProxy:", PROXY_ADDRESS);
    console.log("📍 Ancien Keeper:", OLD_KEEPER);
    
    try {
        // Déployer nouveau CampaignKeeper
        console.log("\n🚀 Déploiement nouveau CampaignKeeper...");
        const CampaignKeeper = await ethers.getContractFactory("CampaignKeeper");
        const newKeeper = await CampaignKeeper.deploy(PROXY_ADDRESS, {
            gasLimit: 3000000,
            gasPrice: ethers.utils.parseUnits("25", "gwei")
        });
        await newKeeper.deployed();
        
        console.log("✅ Nouveau CampaignKeeper déployé:", newKeeper.address);
        
        // Mettre à jour dans le proxy
        console.log("\n🔄 Mise à jour dans DivarProxy...");
        const DivarProxy = await ethers.getContractFactory("DivarProxy");
        const proxy = DivarProxy.attach(PROXY_ADDRESS);
        
        const [deployer] = await ethers.getSigners();
        const nonce = await deployer.getTransactionCount("pending");
        
        const updateTx = await proxy.setCampaignKeeper(newKeeper.address, {
            gasLimit: 500000,
            gasPrice: ethers.utils.parseUnits("30", "gwei"),
            nonce: nonce
        });
        await updateTx.wait();
        
        console.log("✅ CampaignKeeper mis à jour dans le proxy");
        
        // Vérification
        const currentKeeper = await proxy.campaignKeeper();
        console.log("📍 Keeper dans proxy:", currentKeeper);
        console.log("✅ Correspondance:", currentKeeper === newKeeper.address ? "OUI" : "NON");
        
        console.log("\n🎉 NOUVEAU CAMPAIGNKEEPER OPÉRATIONNEL !");
        console.log("📍 Nouvelle adresse:", newKeeper.address);
        console.log("⚠️  N'oublie pas de mettre à jour Chainlink Keeper !");
        
    } catch (error) {
        console.error("❌ ERREUR:", error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });