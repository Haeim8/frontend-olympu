const { ethers } = require("hardhat");

// Prix du gas actuels (Gwei) - Août 2025
const GAS_PRICES = {
    ethereum_mainnet: 1.314,        // 1.314 Gwei
    base_mainnet: 0.027,           // 0.027 Gwei  
    base_sepolia: 0.1,             // ~0.1 Gwei (estimé testnet)
    sepolia: 10.0                  // ~10 Gwei (testnets ont des prix plus élevés)
};

// Prix ETH actuel (USD) - estimation
const ETH_PRICE_USD = 2500; // $2500 par ETH

async function estimateDeploymentGas() {
    console.log("🔍 ESTIMATION DES COÛTS DE DÉPLOIEMENT - SYSTÈME LIVAR");
    console.log("=" .repeat(80));
    
    // Get contract factories
    const PriceConsumerV3 = await ethers.getContractFactory("PriceConsumerV3");
    const DivarProxy = await ethers.getContractFactory("DivarProxy");
    const CampaignKeeper = await ethers.getContractFactory("CampaignKeeper");
    const Campaign = await ethers.getContractFactory("Campaign");
    const NFTRenderer = await ethers.getContractFactory("NFTRenderer");
    const RecPromotionManager = await ethers.getContractFactory("RecPromotionManager");
    
    // Estimer le gas pour chaque contrat
    console.log("📊 ESTIMATION DU GAS NÉCESSAIRE:\n");
    
    const deploymentTx = await PriceConsumerV3.getDeployTransaction(
        "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1" // Chainlink ETH/USD feed sur Base
    );
    const priceConsumerGas = await ethers.provider.estimateGas(deploymentTx);
    console.log(`PriceConsumerV3: ${priceConsumerGas.toLocaleString()} gas`);
    
    // DivarProxy (contrat upgradeable)
    const divarProxyTx = await DivarProxy.getDeployTransaction();
    const divarProxyGas = await ethers.provider.estimateGas(divarProxyTx);
    console.log(`DivarProxy: ${divarProxyGas.toLocaleString()} gas`);
    
    // CampaignKeeper
    const keeperTx = await CampaignKeeper.getDeployTransaction();
    const keeperGas = await ethers.provider.estimateGas(keeperTx);
    console.log(`CampaignKeeper: ${keeperGas.toLocaleString()} gas`);
    
    // Campaign (contrat principal)
    const campaignTx = await Campaign.getDeployTransaction(
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // startup
        "Test Campaign", "TEST", 
        ethers.utils.parseEther("100"), 
        ethers.utils.parseEther("0.1"),
        Math.floor(Date.now() / 1000) + 86400,
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // treasury
        250, // royalty
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // royalty receiver
        "metadata",
        "0x8ba1f109551bD432803012645Hac136c22C85B",
        "0x8ba1f109551bD432803012645Hac136c22C85C"
    );
    const campaignGas = await ethers.provider.estimateGas(campaignTx);
    console.log(`Campaign: ${campaignGas.toLocaleString()} gas`);
    
    // NFTRenderer
    const rendererTx = await NFTRenderer.getDeployTransaction();
    const rendererGas = await ethers.provider.estimateGas(rendererTx);
    console.log(`NFTRenderer: ${rendererGas.toLocaleString()} gas`);
    
    // RecPromotionManager
    const promotionTx = await RecPromotionManager.getDeployTransaction(
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // treasury
        "0x8ba1f109551bD432803012645Hac136c22C85B", // price consumer
        "0x8ba1f109551bD432803012645Hac136c22C85C"  // rec proxy
    );
    const promotionGas = await ethers.provider.estimateGas(promotionTx);
    console.log(`RecPromotionManager: ${promotionGas.toLocaleString()} gas`);
    
    // Calcul du gas total
    const totalGas = priceConsumerGas
        .add(divarProxyGas)
        .add(keeperGas)
        .add(campaignGas)
        .add(rendererGas)
        .add(promotionGas);
    
    console.log("\n" + "=".repeat(50));
    console.log(`🔥 TOTAL GAS ESTIMÉ: ${totalGas.toLocaleString()} gas`);
    console.log("=".repeat(50));
    
    // Calcul des coûts sur différents réseaux
    console.log("\n💰 ESTIMATION DES COÛTS DE DÉPLOIEMENT:\n");
    
    Object.entries(GAS_PRICES).forEach(([network, gasPriceGwei]) => {
        const networkName = network.replace(/_/g, ' ').toUpperCase();
        const costWei = totalGas.mul(ethers.utils.parseUnits(gasPriceGwei.toString(), "gwei"));
        const costETH = parseFloat(ethers.utils.formatEther(costWei));
        const costUSD = costETH * ETH_PRICE_USD;
        
        console.log(`📍 ${networkName}:`);
        console.log(`   Gas Price: ${gasPriceGwei} Gwei`);
        console.log(`   Coût: ${costETH.toFixed(6)} ETH (~$${costUSD.toFixed(2)})`);
        console.log("");
    });
    
    // Détail par contrat pour Base Mainnet (le plus intéressant)
    console.log("🎯 DÉTAIL COÛTS SUR BASE MAINNET:\n");
    const baseGasPrice = GAS_PRICES.base_mainnet;
    
    const contracts = [
        { name: "PriceConsumerV3", gas: priceConsumerGas },
        { name: "DivarProxy", gas: divarProxyGas },
        { name: "CampaignKeeper", gas: keeperGas },
        { name: "Campaign", gas: campaignGas },
        { name: "NFTRenderer", gas: rendererGas },
        { name: "RecPromotionManager", gas: promotionGas }
    ];
    
    contracts.forEach(contract => {
        const costWei = contract.gas.mul(ethers.utils.parseUnits(baseGasPrice.toString(), "gwei"));
        const costETH = parseFloat(ethers.utils.formatEther(costWei));
        const costUSD = costETH * ETH_PRICE_USD;
        
        console.log(`${contract.name}: ${costETH.toFixed(6)} ETH ($${costUSD.toFixed(2)})`);
    });
    
    console.log("\n" + "=".repeat(80));
    console.log("💡 RECOMMANDATIONS:");
    console.log("✅ Base Mainnet: TRÈS économique - coût total ~$" + 
        (parseFloat(ethers.utils.formatEther(totalGas.mul(ethers.utils.parseUnits(baseGasPrice.toString(), "gwei")))) * ETH_PRICE_USD).toFixed(2));
    console.log("⚠️ Base Sepolia: Coût modéré pour les tests");
    console.log("❌ Ethereum Mainnet: TRÈS CHER - éviter sauf nécessité absolue");
    console.log("=".repeat(80));
}

async function main() {
    try {
        await estimateDeploymentGas();
    } catch (error) {
        console.error("❌ Erreur lors de l'estimation:", error);
        
        // Estimation approximative basée sur des contrats similaires
        console.log("\n📋 ESTIMATION APPROXIMATIVE BASÉE SUR LA COMPLEXITÉ:");
        console.log("=" .repeat(60));
        
        const estimatedGas = {
            PriceConsumerV3: 800000,       // ~800k gas
            DivarProxy: 3000000,          // ~3M gas (upgradeable)
            CampaignKeeper: 1200000,      // ~1.2M gas
            Campaign: 4000000,            // ~4M gas (contrat principal complexe)
            NFTRenderer: 600000,          // ~600k gas
            RecPromotionManager: 1500000  // ~1.5M gas
        };
        
        const totalEstimatedGas = Object.values(estimatedGas).reduce((a, b) => a + b, 0);
        
        console.log("📊 ESTIMATION GAS APPROXIMATIVE:");
        Object.entries(estimatedGas).forEach(([contract, gas]) => {
            console.log(`${contract}: ${gas.toLocaleString()} gas`);
        });
        
        console.log(`\n🔥 TOTAL ESTIMÉ: ${totalEstimatedGas.toLocaleString()} gas`);
        
        console.log("\n💰 COÛTS APPROXIMATIFS:");
        Object.entries(GAS_PRICES).forEach(([network, gasPriceGwei]) => {
            const networkName = network.replace(/_/g, ' ').toUpperCase();
            const costETH = (totalEstimatedGas * gasPriceGwei) / 1000000000; // conversion gwei to ETH
            const costUSD = costETH * ETH_PRICE_USD;
            
            console.log(`📍 ${networkName}: ${costETH.toFixed(6)} ETH (~$${costUSD.toFixed(2)})`);
        });
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});