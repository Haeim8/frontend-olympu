const { ethers } = require("hardhat");

async function main() {
    console.log("🔧 CONFIGURATION NFTRENDERER");
    console.log("============================");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    console.log("Balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");
    
    // Adresses
    const DIVAR_PROXY_ADDRESS = "0xaB0999Eae920849a41A55eA080d0a4a210156817";
    const NFT_RENDERER_ADDRESS = "0x291E1ac04617dCdA2676a50E9dc59EF45Ff812d7";
    
    console.log("\nAdresses:");
    console.log("DivarProxy:", DIVAR_PROXY_ADDRESS);
    console.log("NFTRenderer:", NFT_RENDERER_ADDRESS);
    
    try {
        // Connecter au proxy
        const divarProxy = await ethers.getContractAt("DivarProxy", DIVAR_PROXY_ADDRESS);
        
        // Vérifier état actuel
        console.log("\n📋 VERIFICATION ETAT ACTUEL...");
        const currentNftRenderer = await divarProxy.nftRenderer();
        console.log("NFTRenderer actuel:", currentNftRenderer);
        
        if (currentNftRenderer === NFT_RENDERER_ADDRESS) {
            console.log("✅ NFTRenderer déjà configuré correctement !");
            return;
        }
        
        // Vérifier qu'on est le owner
        const owner = await divarProxy.owner();
        console.log("Owner du proxy:", owner);
        console.log("Notre address:", deployer.address);
        
        if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
            console.log("❌ ERREUR: Pas le owner du proxy !");
            return;
        }
        
        // Configurer nftRenderer
        console.log("\n🔧 CONFIGURATION NFTRENDERER...");
        const tx = await divarProxy.setNFTRenderer(NFT_RENDERER_ADDRESS);
        console.log("Transaction envoyée:", tx.hash);
        
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmée !");
        console.log("Gas utilisé:", receipt.gasUsed.toString());
        
        // Vérifier
        const newNftRenderer = await divarProxy.nftRenderer();
        console.log("NFTRenderer configuré:", newNftRenderer);
        
        if (newNftRenderer === NFT_RENDERER_ADDRESS) {
            console.log("🎉 CONFIGURATION REUSSIE !");
        } else {
            console.log("❌ Configuration échouée");
        }
        
    } catch (error) {
        console.error("\n❌ ERREUR:");
        console.error("Message:", error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });