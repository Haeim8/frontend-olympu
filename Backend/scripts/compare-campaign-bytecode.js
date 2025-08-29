const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 COMPARAISON CAMPAIGN BYTECODE");
    console.log("==================================");
    
    const DIVAR_PROXY_ADDRESS = "0xaB0999Eae920849a41A55eA080d0a4a210156817";
    
    try {
        // Obtenir le bytecode stocké dans le proxy
        const divarProxy = await ethers.getContractAt("DivarProxy", DIVAR_PROXY_ADDRESS);
        const storedBytecode = await divarProxy.campaignBytecode();
        
        console.log("📋 BYTECODE STOCKÉ DANS PROXY:");
        console.log("Longueur:", storedBytecode.length);
        console.log("Hash:", ethers.utils.keccak256(storedBytecode));
        console.log("Preview:", storedBytecode.substring(0, 100));
        
        // Obtenir le bytecode actuel de Campaign
        const Campaign = await ethers.getContractFactory("Campaign");
        const currentBytecode = Campaign.bytecode;
        
        console.log("\n📋 BYTECODE ACTUEL DE CAMPAIGN:");
        console.log("Longueur:", currentBytecode.length);
        console.log("Hash:", ethers.utils.keccak256(currentBytecode));
        console.log("Preview:", currentBytecode.substring(0, 100));
        
        // Comparer
        console.log("\n🔍 COMPARAISON:");
        if (storedBytecode === currentBytecode) {
            console.log("✅ IDENTIQUES - Le bytecode stocké est à jour");
        } else {
            console.log("❌ DIFFÉRENTS - Le bytecode stocké est obsolète !");
            
            if (storedBytecode.length !== currentBytecode.length) {
                console.log("Différence de longueur:");
                console.log("   Stocké:", storedBytecode.length, "caractères");
                console.log("   Actuel:", currentBytecode.length, "caractères");
                console.log("   Différence:", currentBytecode.length - storedBytecode.length);
            }
            
            console.log("\n💡 SOLUTION:");
            console.log("Il faut mettre à jour le bytecode avec setCampaignBytecode()");
        }
        
    } catch (error) {
        console.error("❌ Erreur:", error.message);
    }
}

main().catch(console.error);