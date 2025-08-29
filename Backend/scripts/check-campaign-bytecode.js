const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 VERIFICATION CAMPAIGN BYTECODE");
    console.log("==================================");
    
    const DIVAR_PROXY_ADDRESS = "0xaB0999Eae920849a41A55eA080d0a4a210156817";
    
    try {
        const divarProxy = await ethers.getContractAt("DivarProxy", DIVAR_PROXY_ADDRESS);
        
        console.log("📋 VERIFICATION CONFIGURATION...");
        
        // Vérifier campaignBytecode
        const bytecode = await divarProxy.campaignBytecode();
        console.log("Campaign bytecode longueur:", bytecode.length);
        console.log("Campaign bytecode (100 premiers chars):", bytecode.substring(0, 100));
        
        if (bytecode === "0x" || bytecode.length < 100) {
            console.log("❌ PROBLÈME: campaignBytecode pas configuré !");
            console.log("Il faut configurer le bytecode Campaign dans le proxy.");
            
            // Obtenir le bytecode du contrat Campaign
            console.log("\n🔧 OBTENTION BYTECODE CAMPAIGN...");
            const Campaign = await ethers.getContractFactory("Campaign");
            const campaignBytecode = Campaign.bytecode;
            
            console.log("Bytecode Campaign disponible:");
            console.log("Longueur:", campaignBytecode.length);
            console.log("Preview:", campaignBytecode.substring(0, 100));
            
            console.log("\n📝 COMMANDE POUR CONFIGURER:");
            console.log("Il faut appeler setCampaignBytecode() avec ce bytecode");
            
        } else {
            console.log("✅ Campaign bytecode configuré");
        }
        
        // Vérifier nftRenderer
        const nftRenderer = await divarProxy.nftRenderer();
        console.log("\nNFTRenderer:", nftRenderer);
        
        if (nftRenderer === "0x0000000000000000000000000000000000000000") {
            console.log("❌ NFTRenderer pas configuré");
        } else {
            console.log("✅ NFTRenderer configuré");
        }
        
        // Vérifier owner
        const owner = await divarProxy.owner();
        console.log("Owner:", owner);
        
    } catch (error) {
        console.error("❌ Erreur:", error.message);
    }
}

main().catch(console.error);