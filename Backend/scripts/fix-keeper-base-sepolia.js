const { ethers } = require("hardhat");

async function main() {
    console.log("🔗 === FIX KEEPER BASE SEPOLIA ===");
    
    const PROXY_ADDRESS = "0x89Eba0c82c1f16433473A9A06690BfaAC2c7a1b4";
    const NEW_KEEPER = "0x08e496854b3E7232d69D51d09281e9cc8F19c1C0";
    
    // FIX BASE SEPOLIA - GAS MANUAL
    const gasConfig = {
        maxFeePerGas: ethers.utils.parseUnits("2", "gwei"),
        maxPriorityFeePerGas: ethers.utils.parseUnits("1", "gwei"),
        gasLimit: 300000
    };
    
    console.log("📍 Proxy:", PROXY_ADDRESS);
    console.log("📍 Keeper:", NEW_KEEPER);
    console.log("⛽ Gas Config:", {
        maxFee: "2 gwei",
        priority: "1 gwei",
        limit: "300k"
    });
    
    const DivarProxy = await ethers.getContractFactory("DivarProxy");
    const proxy = DivarProxy.attach(PROXY_ADDRESS);
    
    console.log("🔄 Connexion keeper...");
    
    const tx = await proxy.setCampaignKeeper(NEW_KEEPER, gasConfig);
    console.log("📤 TX envoyée:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ CONFIRMÉ ! Gas:", receipt.gasUsed.toString());
    
    // Vérif
    const current = await proxy.campaignKeeper();
    console.log("📍 Keeper actuel:", current);
    
    if (current.toLowerCase() === NEW_KEEPER.toLowerCase()) {
        console.log("🎉 SUCCÈS TOTAL !");
    } else {
        console.log("❌ ÉCHEC");
    }
}

main().catch(console.error);