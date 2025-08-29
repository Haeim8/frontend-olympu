const { ethers } = require("hardhat");

async function main() {
    console.log("🔄 MISE À JOUR CAMPAIGN BYTECODE");
    console.log("=================================");
    
    const DIVAR_PROXY_ADDRESS = "0xaB0999Eae920849a41A55eA080d0a4a210156817";
    
    try {
        const [deployer] = await ethers.getSigners();
        console.log("Deployer:", deployer.address);
        console.log("Balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");
        
        const divarProxy = await ethers.getContractAt("DivarProxy", DIVAR_PROXY_ADDRESS);
        
        // Obtenir le nouveau bytecode Campaign
        const Campaign = await ethers.getContractFactory("Campaign");
        const newBytecode = Campaign.bytecode;
        
        console.log("Nouveau bytecode Campaign:");
        console.log("Longueur:", newBytecode.length);
        console.log("Hash:", ethers.utils.keccak256(newBytecode));
        
        // Mettre à jour le bytecode
        console.log("\n🔧 MISE À JOUR...");
        const tx = await divarProxy.setCampaignBytecode(newBytecode);
        console.log("Transaction envoyée:", tx.hash);
        
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmée !");
        console.log("Gas utilisé:", receipt.gasUsed.toString());
        
        // Vérifier
        const updatedBytecode = await divarProxy.campaignBytecode();
        console.log("\n📋 VERIFICATION:");
        console.log("Longueur après update:", updatedBytecode.length);
        
        if (updatedBytecode === newBytecode) {
            console.log("🎉 BYTECODE MIS À JOUR AVEC SUCCÈS !");
            console.log("Le proxy peut maintenant déployer Campaign avec NFT !");
        } else {
            console.log("❌ Erreur lors de la mise à jour");
        }
        
    } catch (error) {
        console.error("❌ Erreur:", error.message);
    }
}

main().catch(console.error);