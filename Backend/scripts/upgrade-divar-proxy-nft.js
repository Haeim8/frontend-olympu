const { ethers, upgrades } = require("hardhat");

async function main() {
    console.log("🔄 UPGRADE DIVARPROXY AVEC INTEGRATION NFT");
    console.log("==========================================");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    console.log("Balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");
    
    // Adresses existantes sur Base Sepolia
    const DIVAR_PROXY_ADDRESS = "0xaB0999Eae920849a41A55eA080d0a4a210156817";
    const NFT_RENDERER_ADDRESS = "0x291E1ac04617dCdA2676a50E9dc59EF45Ff812d7";
    
    console.log("\nAdresses existantes:");
    console.log("DivarProxy (proxy):", DIVAR_PROXY_ADDRESS);
    console.log("NFTRenderer:", NFT_RENDERER_ADDRESS);
    
    try {
        // Vérifier l'état actuel du proxy
        console.log("\n📋 VERIFICATION ETAT ACTUEL...");
        const currentDivarProxy = await ethers.getContractAt("DivarProxy", DIVAR_PROXY_ADDRESS);
        
        try {
            const currentVersion = await currentDivarProxy.getVersion();
            console.log("Version actuelle:", currentVersion);
        } catch (e) {
            console.log("Version actuelle: non disponible");
        }
        
        try {
            const currentNftRenderer = await currentDivarProxy.nftRenderer();
            console.log("NFTRenderer actuel:", currentNftRenderer);
            
            if (currentNftRenderer !== "0x0000000000000000000000000000000000000000") {
                console.log("⚠️  NFTRenderer déjà configuré ! Upgrade peut-être inutile.");
                console.log("Voulez-vous continuer ? (Ce script va quand même upgrade l'implementation)");
            }
        } catch (e) {
            console.log("NFTRenderer actuel: non accessible (ancienne version)");
        }
        
        // Compiler et déployer la nouvelle implementation
        console.log("\n🔨 COMPILATION NOUVELLE IMPLEMENTATION...");
        const DivarProxyV2 = await ethers.getContractFactory("DivarProxy");
        console.log("Factory créée avec succès");
        
        // Upgrade via OpenZeppelin
        console.log("\n⬆️  UPGRADE EN COURS...");
        console.log("Cela peut prendre plusieurs minutes...");
        
        const upgraded = await upgrades.upgradeProxy(DIVAR_PROXY_ADDRESS, DivarProxyV2);
        console.log("Upgrade transaction envoyée...");
        
        await upgraded.deployed();
        console.log("✅ Upgrade terminé !");
        console.log("Adresse proxy (inchangée):", upgraded.address);
        
        // Vérifier la nouvelle version
        console.log("\n🔍 VERIFICATION POST-UPGRADE...");
        try {
            const newVersion = await upgraded.getVersion();
            console.log("Nouvelle version:", newVersion);
        } catch (e) {
            console.log("Version: non disponible");
        }
        
        // Vérifier si nftRenderer est accessible
        try {
            const nftRenderer = await upgraded.nftRenderer();
            console.log("NFTRenderer configuré:", nftRenderer);
            
            if (nftRenderer === "0x0000000000000000000000000000000000000000") {
                console.log("⚠️  NFTRenderer n'est pas encore configuré.");
                console.log("Il faudra peut-être re-initialiser ou configurer manuellement.");
            }
        } catch (e) {
            console.log("NFTRenderer: erreur d'accès -", e.message);
        }
        
        console.log("✅ Implementation upgradée avec succès !");
        
        console.log("\n🎉 UPGRADE TERMINÉ AVEC SUCCÈS !");
        console.log("✅ DivarProxy upgraded avec intégration NFT");
        console.log("✅ NFTRenderer address:", NFT_RENDERER_ADDRESS);
        console.log("✅ Proxy address:", DIVAR_PROXY_ADDRESS);
        
    } catch (error) {
        console.error("\n❌ ERREUR DURANTE L'UPGRADE:");
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        
        if (error.message.includes("proxy admin")) {
            console.error("\n💡 SOLUTION POSSIBLE:");
            console.error("Le deployer doit être le propriétaire du proxy admin.");
            console.error("Vérifiez que vous utilisez le bon wallet.");
        }
        
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });