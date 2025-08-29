const { ethers } = require("hardhat");
const axios = require('axios');

// Configuration des réseaux et prix
const NETWORKS = {
    localhost: {
        name: "LOCALHOST (Test)",
        gasPrice: 1.0, // 1 Gwei par défaut en local
        rpcUrl: "http://127.0.0.1:8545"
    },
    base_mainnet: {
        name: "BASE MAINNET",
        gasPrice: null, // Sera récupéré en temps réel
        rpcUrl: "https://mainnet.base.org",
        explorer: "https://basescan.org"
    },
    base_sepolia: {
        name: "BASE SEPOLIA",
        gasPrice: null, // Sera récupéré en temps réel
        rpcUrl: "https://sepolia.base.org",
        explorer: "https://sepolia.basescan.org"
    }
};

// Prix ETH actuel (sera mis à jour)
let ETH_PRICE_USD = 2500;

async function getETHPrice() {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        ETH_PRICE_USD = response.data.ethereum.usd;
        console.log(`💰 Prix ETH actuel: $${ETH_PRICE_USD}`);
        return ETH_PRICE_USD;
    } catch (error) {
        console.log("⚠️ Impossible de récupérer le prix ETH, utilisation de $2500");
        return 2500;
    }
}

async function getGasPrice(provider, networkName) {
    try {
        const gasPrice = await provider.getGasPrice();
        const gasPriceGwei = parseFloat(ethers.utils.formatUnits(gasPrice, "gwei"));
        console.log(`⛽ Gas price ${networkName}: ${gasPriceGwei.toFixed(3)} Gwei`);
        return gasPriceGwei;
    } catch (error) {
        console.log(`❌ Erreur récupération gas price ${networkName}:`, error.message);
        return null;
    }
}

async function estimateContractGas(contractName, constructorArgs = []) {
    try {
        console.log(`📋 Estimation ${contractName}...`);
        
        const ContractFactory = await ethers.getContractFactory(contractName);
        
        // Créer la transaction de déploiement
        const deployTransaction = ContractFactory.getDeployTransaction(...constructorArgs);
        
        // Estimer le gas
        const gasEstimate = await ethers.provider.estimateGas(deployTransaction);
        
        console.log(`   ✅ ${contractName}: ${gasEstimate.toLocaleString()} gas`);
        return gasEstimate;
        
    } catch (error) {
        console.log(`   ❌ ${contractName}: Erreur - ${error.message}`);
        
        // Estimations de fallback basées sur la complexité
        const fallbackGas = {
            "PriceConsumerV3": 800000,
            "DivarProxy": 3000000,
            "CampaignKeeper": 1200000,
            "Campaign": 4000000,
            "NFTRenderer": 600000,
            "RecPromotionManager": 1500000
        };
        
        const estimate = ethers.BigNumber.from(fallbackGas[contractName] || 1000000);
        console.log(`   🔄 ${contractName}: ${estimate.toLocaleString()} gas (estimation fallback)`);
        return estimate;
    }
}

async function testDeploymentCosts() {
    console.log("🧪 TEST RÉEL DES COÛTS DE DÉPLOIEMENT - SYSTÈME LIVAR");
    console.log("=" .repeat(80));
    
    // Récupérer le prix ETH
    await getETHPrice();
    
    console.log("\n📊 ESTIMATION DU GAS PAR CONTRAT:\n");
    
    // Configuration des contrats avec leurs paramètres de constructeur
    const contracts = [
        {
            name: "PriceConsumerV3",
            args: ["0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1"] // ETH/USD feed Base
        },
        {
            name: "DivarProxy", 
            args: [] // Constructeur vide (initializable)
        },
        {
            name: "CampaignKeeper",
            args: [] // Constructeur vide
        },
        {
            name: "Campaign",
            args: [
                "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // startup
                "Test Campaign",
                "TEST",
                ethers.utils.parseEther("100"), // target
                ethers.utils.parseEther("0.1"), // share price
                Math.floor(Date.now() / 1000) + 86400, // end time
                "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // treasury
                250, // royalty
                "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // royalty receiver
                "metadata",
                "0x8ba1f109551bD432803012645Hac136c22C85B", // divar proxy
                "0x8ba1f109551bD432803012645Hac136c22C85C" // campaign keeper
            ]
        },
        {
            name: "NFTRenderer",
            args: [] // Constructeur vide
        },
        {
            name: "RecPromotionManager",
            args: [
                "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // treasury
                "0x8ba1f109551bD432803012645Hac136c22C85B", // price consumer
                "0x8ba1f109551bD432803012645Hac136c22C85C" // rec proxy
            ]
        }
    ];
    
    // Estimer le gas pour chaque contrat
    const gasEstimates = {};
    let totalGas = ethers.BigNumber.from(0);
    
    for (const contract of contracts) {
        const gasEstimate = await estimateContractGas(contract.name, contract.args);
        gasEstimates[contract.name] = gasEstimate;
        totalGas = totalGas.add(gasEstimate);
    }
    
    console.log("\n" + "=".repeat(50));
    console.log(`🔥 TOTAL GAS ESTIMÉ: ${totalGas.toLocaleString()} gas`);
    console.log("=".repeat(50));
    
    // Test sur différents réseaux
    console.log("\n💰 ESTIMATION DES COÛTS PAR RÉSEAU:\n");
    
    // Test localhost (réseau de développement)
    const localhostGasPrice = 1.0; // 1 Gwei par défaut
    const localhostCostETH = parseFloat(ethers.utils.formatEther(totalGas.mul(ethers.utils.parseUnits(localhostGasPrice.toString(), "gwei"))));
    const localhostCostUSD = localhostCostETH * ETH_PRICE_USD;
    
    console.log(`📍 ${NETWORKS.localhost.name}:`);
    console.log(`   Gas Price: ${localhostGasPrice} Gwei`);
    console.log(`   Coût: ${localhostCostETH.toFixed(6)} ETH (~$${localhostCostUSD.toFixed(2)})`);
    console.log("");
    
    // Tenter de se connecter aux vrais réseaux pour les prix réels
    for (const [networkKey, network] of Object.entries(NETWORKS)) {
        if (networkKey === 'localhost') continue;
        
        try {
            console.log(`📍 ${network.name}:`);
            
            // Créer un provider pour ce réseau
            const provider = new ethers.providers.JsonRpcProvider(network.rpcUrl);
            
            // Récupérer le prix du gas actuel
            const gasPrice = await getGasPrice(provider, network.name);
            
            if (gasPrice) {
                const costWei = totalGas.mul(ethers.utils.parseUnits(gasPrice.toString(), "gwei"));
                const costETH = parseFloat(ethers.utils.formatEther(costWei));
                const costUSD = costETH * ETH_PRICE_USD;
                
                console.log(`   Gas Price: ${gasPrice.toFixed(3)} Gwei`);
                console.log(`   Coût: ${costETH.toFixed(6)} ETH (~$${costUSD.toFixed(2)})`);
                
                // Alertes selon le coût
                if (costUSD > 50) {
                    console.log(`   ⚠️  ATTENTION: Coût élevé !`);
                } else if (costUSD < 5) {
                    console.log(`   ✅ Coût raisonnable`);
                } else {
                    console.log(`   🔶 Coût modéré`);
                }
            } else {
                console.log(`   ❌ Impossible de récupérer le prix du gas`);
            }
            
            console.log("");
            
        } catch (error) {
            console.log(`   ❌ Erreur connexion: ${error.message}`);
            console.log("");
        }
    }
    
    // Détail par contrat pour analyse
    console.log("🔍 RÉPARTITION DES COÛTS (Base Mainnet estimé à 0.05 Gwei):\n");
    const baseEstimatedGasPrice = 0.05; // Gwei - estimation conservative
    
    Object.entries(gasEstimates).forEach(([contractName, gas]) => {
        const costWei = gas.mul(ethers.utils.parseUnits(baseEstimatedGasPrice.toString(), "gwei"));
        const costETH = parseFloat(ethers.utils.formatEther(costWei));
        const costUSD = costETH * ETH_PRICE_USD;
        const percentage = (gas.toNumber() / totalGas.toNumber() * 100).toFixed(1);
        
        console.log(`${contractName.padEnd(20)}: $${costUSD.toFixed(2).padStart(6)} (${percentage}%)`);
    });
    
    // Calcul final
    const finalCostWei = totalGas.mul(ethers.utils.parseUnits(baseEstimatedGasPrice.toString(), "gwei"));
    const finalCostETH = parseFloat(ethers.utils.formatEther(finalCostWei));
    const finalCostUSD = finalCostETH * ETH_PRICE_USD;
    
    console.log("\n" + "=".repeat(80));
    console.log("🎯 RÉSUMÉ FINAL:");
    console.log(`💰 Coût estimé déploiement complet: $${finalCostUSD.toFixed(2)}`);
    console.log(`⛽ Base gas price utilisé: ${baseEstimatedGasPrice} Gwei`);
    console.log(`🔥 Total gas: ${totalGas.toLocaleString()}`);
    
    console.log("\n💡 RECOMMANDATIONS:");
    if (finalCostUSD < 5) {
        console.log("✅ EXCELLENT: Coût très raisonnable, déploie maintenant !");
    } else if (finalCostUSD < 20) {
        console.log("🔶 MODÉRÉ: Coût acceptable, surveille le gas price");
    } else {
        console.log("⚠️ ÉLEVÉ: Attends un gas price plus bas ou utilise un L2");
    }
    
    console.log(`📊 Budget recommandé: $${Math.ceil(finalCostUSD * 1.5)} (marge 50%)`);
    console.log("=".repeat(80));
}

// Fonction pour monitorer le gas en temps réel
async function monitorGasPrice(networkName = "base_mainnet", duration = 60) {
    console.log(`\n🔍 MONITORING GAS PRICE - ${networkName.toUpperCase()}`);
    console.log(`⏰ Durée: ${duration} secondes\n`);
    
    const network = NETWORKS[networkName];
    if (!network) {
        console.log("❌ Réseau non supporté");
        return;
    }
    
    try {
        const provider = new ethers.providers.JsonRpcProvider(network.rpcUrl);
        const interval = 10; // Vérification toutes les 10 secondes
        const checks = duration / interval;
        
        const gasPrices = [];
        
        for (let i = 0; i < checks; i++) {
            try {
                const gasPrice = await getGasPrice(provider, network.name);
                if (gasPrice) {
                    gasPrices.push(gasPrice);
                    
                    // Calcul du coût estimé
                    const estimatedGas = 11100000; // Gas total estimé
                    const costETH = (estimatedGas * gasPrice) / 1000000000; // Conversion en ETH
                    const costUSD = costETH * ETH_PRICE_USD;
                    
                    console.log(`[${new Date().toLocaleTimeString()}] ${gasPrice.toFixed(3)} Gwei → $${costUSD.toFixed(2)}`);
                }
            } catch (error) {
                console.log(`[${new Date().toLocaleTimeString()}] ❌ Erreur: ${error.message}`);
            }
            
            if (i < checks - 1) {
                await new Promise(resolve => setTimeout(resolve, interval * 1000));
            }
        }
        
        // Statistiques finales
        if (gasPrices.length > 0) {
            const avgGasPrice = gasPrices.reduce((a, b) => a + b, 0) / gasPrices.length;
            const minGasPrice = Math.min(...gasPrices);
            const maxGasPrice = Math.max(...gasPrices);
            
            console.log("\n📊 STATISTIQUES:");
            console.log(`   Moyenne: ${avgGasPrice.toFixed(3)} Gwei`);
            console.log(`   Minimum: ${minGasPrice.toFixed(3)} Gwei`);
            console.log(`   Maximum: ${maxGasPrice.toFixed(3)} Gwei`);
            
            const avgCost = (11100000 * avgGasPrice / 1000000000) * ETH_PRICE_USD;
            const minCost = (11100000 * minGasPrice / 1000000000) * ETH_PRICE_USD;
            
            console.log(`\n💰 COÛTS ESTIMÉS:`);
            console.log(`   Coût moyen: $${avgCost.toFixed(2)}`);
            console.log(`   Coût minimum: $${minCost.toFixed(2)}`);
        }
        
    } catch (error) {
        console.log("❌ Erreur monitoring:", error.message);
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length > 0 && args[0] === "monitor") {
        const network = args[1] || "base_mainnet";
        const duration = parseInt(args[2]) || 60;
        await monitorGasPrice(network, duration);
    } else {
        await testDeploymentCosts();
    }
}

// Gestion des erreurs
main().catch((error) => {
    console.error("❌ Erreur fatale:", error);
    process.exitCode = 1;
});

module.exports = {
    testDeploymentCosts,
    monitorGasPrice
};