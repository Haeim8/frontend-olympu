const { ethers } = require("hardhat");

// Configuration Base Mainnet
const BASE_MAINNET_RPC = "https://mainnet.base.org";

async function getMainnetCosts() {
    console.log("🔍 ANALYSE COÛTS DÉPLOIEMENT - BASE MAINNET");
    console.log("=".repeat(50));
    
    try {
        // Connexion à Base mainnet
        const provider = new ethers.providers.JsonRpcProvider(BASE_MAINNET_RPC);
        
        // Vérifier la connexion
        const network = await provider.getNetwork();
        console.log(`📡 Réseau: ${network.name} (chainId: ${network.chainId})`);
        
        // Prix du gas actuel
        const gasPrice = await provider.getGasPrice();
        const gasPriceGwei = ethers.utils.formatUnits(gasPrice, "gwei");
        console.log(`⛽ Gas Price actuel: ${gasPriceGwei} Gwei`);
        
        // Prix ETH via notre oracle (approximation)
        console.log("\n💰 ESTIMATION PRIX ETH...");
        
        // Estimation basée sur les tailles de nos contrats (données du sepolia)
        const contractSizes = {
            "PriceConsumerV3": 380079,
            "DivarProxy": 2500000, // Estimation proxy + implementation
            "CampaignKeeper": 663030,
            "NFTRenderer": 1334454,
            "RecPromotionManager": 1843836,
            "Configuration": 200000 // setCampaignBytecode, etc.
        };
        
        console.log("\n📊 COÛTS ESTIMÉS PAR CONTRAT:");
        console.log("-".repeat(50));
        
        let totalGas = 0;
        
        for (const [contractName, gasEstimate] of Object.entries(contractSizes)) {
            const gasCost = gasPrice.mul(gasEstimate);
            const costETH = ethers.utils.formatEther(gasCost);
            
            console.log(`${contractName.padEnd(20)} | ${gasEstimate.toLocaleString().padEnd(10)} gas | ${costETH.padEnd(12)} ETH`);
            totalGas += gasEstimate;
        }
        
        console.log("-".repeat(50));
        const totalCostWei = gasPrice.mul(totalGas);
        const totalCostETH = ethers.utils.formatEther(totalCostWei);
        
        console.log(`${'TOTAL DEPLOYMENT'.padEnd(20)} | ${totalGas.toLocaleString().padEnd(10)} gas | ${totalCostETH.padEnd(12)} ETH`);
        
        console.log("\n💵 COÛT EN USD (estimations):");
        const ethPriceEstimates = [3000, 3500, 4000, 4500, 5000];
        
        for (const ethPrice of ethPriceEstimates) {
            const costUSD = parseFloat(totalCostETH) * ethPrice;
            console.log(`   ETH à $${ethPrice}: ~$${costUSD.toFixed(2)} USD`);
        }
        
        console.log("\n⚡ COMPARAISON SEPOLIA vs MAINNET:");
        console.log(`   Sepolia: ~0.000004 ETH (~$0.02 USD)`);
        console.log(`   Mainnet: ~${totalCostETH} ETH`);
        
        const multiplier = parseFloat(totalCostETH) / 0.000004;
        console.log(`   Facteur: ~${multiplier.toFixed(0)}x plus cher`);
        
        return {
            gasPriceGwei: parseFloat(gasPriceGwei),
            totalCostETH: parseFloat(totalCostETH),
            totalGas
        };
        
    } catch (error) {
        console.log("❌ Erreur connexion Base mainnet:", error.message);
        console.log("\n💡 ESTIMATION BASÉE SUR LES DONNÉES PUBLIQUES:");
        console.log("   Gas Price Base mainnet: ~0.05-0.1 Gwei");
        console.log("   Total gas needed: ~6,900,000 gas");
        console.log("   Coût estimé: 0.0003-0.0007 ETH");
        console.log("   En USD (ETH à $4000): ~$1.2-2.8 USD");
        
        return null;
    }
}

// Comparaison avec Ethereum mainnet
async function compareWithEthereum() {
    console.log("\n🔗 COMPARAISON ETHEREUM MAINNET:");
    console.log("-".repeat(50));
    
    try {
        const ethProvider = new ethers.providers.JsonRpcProvider("https://eth.llamarpc.com");
        const ethGasPrice = await ethProvider.getGasPrice();
        const ethGasPriceGwei = ethers.utils.formatUnits(ethGasPrice, "gwei");
        
        console.log(`⛽ Ethereum Gas Price: ${ethGasPriceGwei} Gwei`);
        
        const totalGas = 6900000; // Total estimé
        const ethCostWei = ethGasPrice.mul(totalGas);
        const ethCostETH = ethers.utils.formatEther(ethCostWei);
        
        console.log(`💰 Coût Ethereum: ${ethCostETH} ETH`);
        console.log(`💰 En USD (ETH à $4000): ~$${(parseFloat(ethCostETH) * 4000).toFixed(2)} USD`);
        
    } catch (error) {
        console.log("⚠️ Impossible de récupérer les données Ethereum mainnet");
        console.log("   Estimation basée sur 5 Gwei: ~0.0345 ETH (~$138 USD)");
    }
}

async function main() {
    const results = await getMainnetCosts();
    await compareWithEthereum();
    
    console.log("\n🎯 CONCLUSION:");
    console.log("=".repeat(50));
    console.log("✅ Base mainnet: ~$1-3 USD (très économique)");
    console.log("💰 Ethereum mainnet: ~$50-200 USD (beaucoup plus cher)");
    console.log("🚀 Recommandation: Déployer sur Base mainnet");
}

main().catch(console.error);