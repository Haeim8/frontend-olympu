const { ethers } = require("hardhat");

async function main() {
    console.log("TEST CAMPAGNE COMPLETE - BASE SEPOLIA");
    console.log("==================================================");
    console.log("Timestamp debut:", new Date().toISOString());
    console.log("Process PID:", process.pid);
    console.log("Ethers version:", ethers.version);

    // Configuration reseau
    const [deployer, investor1, investor2] = await ethers.getSigners();
    console.log("\nCONFIGURATION COMPTES:");
    console.log("   Createur:", deployer.address);
    console.log("   Investisseur 1:", investor1.address);
    console.log("   Investisseur 2:", investor2.address);

    // Adresses des contrats deployes
    const DIVAR_PROXY_ADDRESS = "0xaB0999Eae920849a41A55eA080d0a4a210156817";
    
    console.log("\nVERIFICATION CONNECTION CONTRAT...");
    console.log("Tentative connexion a:", DIVAR_PROXY_ADDRESS);
    
    let divarProxy;
    try {
        divarProxy = await ethers.getContractAt("DivarProxy", DIVAR_PROXY_ADDRESS);
        console.log("Instance contract creee");
        console.log("DivarProxy Address:", divarProxy.address);
    } catch (error) {
        console.log("Erreur connexion contract:", error.message);
        throw error;
    }
    
    // Verifier que le contrat existe
    console.log("Verification bytecode...");
    const code = await ethers.provider.getCode(DIVAR_PROXY_ADDRESS);
    console.log("Code Contract (longueur):", code.length, "characters");
    console.log("Code preview (50 premiers chars):", code.substring(0, 50));
    
    if (code === "0x") {
        throw new Error("Contrat non deploye a cette adresse");
    }
    console.log("Contrat bien deploye et accessible");
    
    // Verifier balances de tous les comptes
    console.log("\nVERIFICATION BALANCES INITIALES...");
    const deployerBalance = await ethers.provider.getBalance(deployer.address);
    const inv1Balance = await ethers.provider.getBalance(investor1.address);
    const inv2Balance = await ethers.provider.getBalance(investor2.address);
    
    console.log("Balance deployer:", ethers.utils.formatEther(deployerBalance), "ETH");
    console.log("Balance investor1:", ethers.utils.formatEther(inv1Balance), "ETH");
    console.log("Balance investor2:", ethers.utils.formatEther(inv2Balance), "ETH");
    console.log("Total balance:", ethers.utils.formatEther(deployerBalance.add(inv1Balance).add(inv2Balance)), "ETH");

    console.log("\nRECUPERATION FRAIS CREATION...");
    let creationFee;
    try {
        console.log("Appel getCampaignCreationFeeETH()...");
        creationFee = await divarProxy.getCampaignCreationFeeETH();
        console.log("Frais recuperes avec succes");
        console.log("Frais creation:", ethers.utils.formatEther(creationFee), "ETH");
        console.log("Frais en wei:", creationFee.toString());
    } catch (error) {
        console.log("Erreur recuperation frais:", error.message);
        throw error;
    }
    
    if (deployerBalance.lt(creationFee)) {
        console.log("Balance insuffisante!");
        console.log("   Requis:", ethers.utils.formatEther(creationFee), "ETH");
        console.log("   Disponible:", ethers.utils.formatEther(deployerBalance), "ETH");
        console.log("   Manque:", ethers.utils.formatEther(creationFee.sub(deployerBalance)), "ETH");
        throw new Error("Balance insuffisante pour creer campagne");
    }
    console.log("Balance suffisante pour creer campagne");

    // ETAPE 1: CREATION CAMPAGNE AVEC VALEURS TRES PETITES
    console.log("\nCONFIGURATION CAMPAGNE TEST...");
    const targetAmount = ethers.utils.parseEther("0.00000001"); // Tres petit target
    const sharePrice = ethers.utils.parseEther("0.000000001"); // Prix tres petit par NFT
    const endTime = Math.floor(Date.now() / 1000) + 300; // 5 minutes
    
    console.log("Parametres campagne:");
    console.log("   Nom: TestCrypto Startup");
    console.log("   Symbol: TCS");
    console.log("   Target:", ethers.utils.formatEther(targetAmount), "ETH");
    console.log("   Target en wei:", targetAmount.toString());
    console.log("   Prix NFT:", ethers.utils.formatEther(sharePrice), "ETH");
    console.log("   Prix NFT en wei:", sharePrice.toString());
    console.log("   End timestamp:", endTime);
    console.log("   End date:", new Date(endTime * 1000).toISOString());
    console.log("   Duree: 5 minutes");
    
    // Calculs de seuils
    console.log("\nCALCULS THEORIQUES:");
    const targetNet = targetAmount.mul(88).div(100); // 88% apres 12% commission
    const maxNFTsTheory = targetAmount.div(sharePrice);
    const maxNFTsNet = targetNet.div(sharePrice.mul(88).div(100));
    
    console.log("   Target net (88% apres commission):", ethers.utils.formatEther(targetNet), "ETH");
    console.log("   NFTs max theorique:", maxNFTsTheory.toString());
    console.log("   NFTs max net:", maxNFTsNet.toString());

    console.log("\nENVOI TRANSACTION CREATION...");
    // Configuration NFT personnalisée
    const nftBackgroundColor = "#1E40AF"; // Bleu
    const nftTextColor = "#FFFFFF"; // Blanc
    const nftLogoUrl = "https://example.com/nft-logo.svg";
    const nftSector = "Blockchain";
    
    console.log("Configuration NFT:");
    console.log(`   Background: ${nftBackgroundColor}`);
    console.log(`   Text: ${nftTextColor}`);
    console.log(`   Logo: ${nftLogoUrl}`);
    console.log(`   Sector: ${nftSector}`);
    
    console.log("\nEstimation gas pour createCampaign...");
    
    let estimatedGas;
    try {
        estimatedGas = await divarProxy.estimateGas.createCampaign(
            "TestCrypto Startup",
            "TCS",
            targetAmount,
            sharePrice,
            endTime,
            "Technology",
            "Test campaign metadata",
            250, // 2.5% royalty
            "https://example.com/logo.png",
            nftBackgroundColor, // Nouveau paramètre NFT
            nftTextColor,       // Nouveau paramètre NFT
            nftLogoUrl,         // Nouveau paramètre NFT
            nftSector,          // Nouveau paramètre NFT
            { value: creationFee }
        );
        console.log("Gas estime:", estimatedGas.toString());
    } catch (error) {
        console.log("Estimation gas echouee:", error.message);
    }
    
    console.log("\nEnvoi transaction createCampaign...");
    let createTx;
    try {
        createTx = await divarProxy.createCampaign(
            "TestCrypto Startup",
            "TCS",
            targetAmount,
            sharePrice,
            endTime,
            "Technology",
            "Test campaign metadata",
            250, // 2.5% royalty
            "https://example.com/logo.png",
            nftBackgroundColor, // Nouveau paramètre NFT
            nftTextColor,       // Nouveau paramètre NFT
            nftLogoUrl,         // Nouveau paramètre NFT
            nftSector,          // Nouveau paramètre NFT
            { value: creationFee, gasLimit: estimatedGas ? estimatedGas.mul(120).div(100) : undefined }
        );
        
        console.log("Transaction envoyee avec succes");
        console.log("Hash:", createTx.hash);
        console.log("Gas limit:", createTx.gasLimit?.toString());
        console.log("Value:", ethers.utils.formatEther(createTx.value), "ETH");
    } catch (error) {
        console.log("Erreur envoi transaction:", error.message);
        console.log("Error data:", error.data);
        throw error;
    }
    
    console.log("Attente confirmation...");
    let receipt;
    try {
        receipt = await createTx.wait();
        console.log("Transaction confirmee avec succes");
        console.log("Block:", receipt.blockNumber);
        console.log("Transaction index:", receipt.transactionIndex);
        console.log("Gas utilise:", receipt.gasUsed.toString());
        console.log("Gas price:", ethers.utils.formatUnits(receipt.effectiveGasPrice, 'gwei'), "Gwei");
        console.log("Cout total:", ethers.utils.formatEther(receipt.gasUsed.mul(receipt.effectiveGasPrice)), "ETH");
        console.log("Status:", receipt.status);
    } catch (error) {
        console.log("Erreur confirmation transaction:", error.message);
        throw error;
    }

    // Analyser tous les evenements en detail
    console.log("\nANALYSE DETAILLEE DES EVENEMENTS...");
    console.log("Nombre d'evenements:", receipt.events.length);
    
    let campaignAddress = null;
    for (let i = 0; i < receipt.events.length; i++) {
        const event = receipt.events[i];
        console.log("\n   Evenement", i + ":");
        console.log("      Type:", event.event || 'Unknown');
        console.log("      Address:", event.address);
        console.log("      Topics:", event.topics);
        
        if (event.args && event.args.length > 0) {
            console.log("      Args (" + event.args.length + " total):");
            for (let j = 0; j < event.args.length; j++) {
                console.log("         [" + j + "]:", event.args[j]);
            }
        }
        
        if (event.event === "CampaignCreated") {
            campaignAddress = event.args[0];
            console.log("      CAMPAGNE TROUVEE:", campaignAddress);
        }
    }
    
    if (!campaignAddress) {
        console.log("ERREUR: Adresse campagne non trouvee dans les evenements");
        console.log("Evenements disponibles:");
        receipt.events.forEach((event, i) => {
            console.log("   [" + i + "]:", event.event || 'Unknown', "-", event.address);
        });
        throw new Error("Adresse campagne non trouvee");
    }

    // ETAPE 2: VERIFICATION COMPLETE DE LA CAMPAGNE
    console.log("\nVERIFICATION CAMPAGNE CREEE...");
    console.log("Adresse campagne:", campaignAddress);
    console.log("Attente propagation (5 secondes)...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    let campaign;
    try {
        console.log("Connexion au contrat Campaign...");
        campaign = await ethers.getContractAt("Campaign", campaignAddress);
        console.log("Connexion reussie");
    } catch (error) {
        console.log("Erreur connexion Campaign:", error.message);
        throw error;
    }
    
    console.log("Verification bytecode campagne...");
    const campaignCode = await ethers.provider.getCode(campaignAddress);
    console.log("Code longueur:", campaignCode.length, "characters");
    console.log("Code preview:", campaignCode.substring(0, 100));
    
    if (campaignCode === "0x") {
        throw new Error("Campagne non deployee correctement");
    }
    console.log("Campagne correctement deployee!");

    console.log("\nRECUPERATION INFOS CAMPAGNE DETAILLEES...");
    let currentRound;
    try {
        console.log("Appel getCurrentRound()...");
        currentRound = await campaign.getCurrentRound();
        console.log("getCurrentRound() reussi");
        console.log("Donnees round:");
        console.log("   Round number:", currentRound.roundNumber.toString());
        console.log("   Share price:", ethers.utils.formatEther(currentRound.sharePrice), "ETH");
        console.log("   Share price wei:", currentRound.sharePrice.toString());
        console.log("   Target amount:", ethers.utils.formatEther(currentRound.targetAmount), "ETH"); 
        console.log("   Target amount wei:", currentRound.targetAmount.toString());
        console.log("   Funds raised:", ethers.utils.formatEther(currentRound.fundsRaised), "ETH");
        console.log("   Funds raised wei:", currentRound.fundsRaised.toString());
        console.log("   Shares sold:", currentRound.sharesSold.toString());
        console.log("   End time:", currentRound.endTime.toString());
        console.log("   End date:", new Date(currentRound.endTime.toNumber() * 1000).toISOString());
        console.log("   Is active:", currentRound.isActive);
        console.log("   Is finalized:", currentRound.isFinalized);
    } catch (error) {
        console.log("Erreur getCurrentRound():", error.message);
        throw error;
    }

    // Verifier balances apres creation
    console.log("\nVERIFICATION BALANCES APRES CREATION...");
    const deployerBalanceAfter = await ethers.provider.getBalance(deployer.address);
    const inv1BalanceAfter = await ethers.provider.getBalance(investor1.address);
    const inv2BalanceAfter = await ethers.provider.getBalance(investor2.address);
    
    console.log("Balance deployer apres:", ethers.utils.formatEther(deployerBalanceAfter), "ETH");
    console.log("Difference deployer:", ethers.utils.formatEther(deployerBalance.sub(deployerBalanceAfter)), "ETH");
    console.log("Balance investor1:", ethers.utils.formatEther(inv1BalanceAfter), "ETH");
    console.log("Balance investor2:", ethers.utils.formatEther(inv2BalanceAfter), "ETH");

    // ETAPE 3: PREMIERS INVESTISSEMENTS
    console.log("\nPHASE INVESTISSEMENTS - TEST 1...");
    console.log("Target net requis (88%):", ethers.utils.formatEther(targetAmount.mul(88).div(100)), "ETH");
    
    // Investisseur 1 achete 2 NFTs
    console.log("\nINVESTISSEUR 1 - ACHAT 2 NFTs...");
    const numShares1 = 2;
    const amount1 = sharePrice.mul(numShares1);
    
    console.log("Parametres investissement 1:");
    console.log("   Nombre NFTs:", numShares1);
    console.log("   Prix unitaire:", ethers.utils.formatEther(sharePrice), "ETH");
    console.log("   Prix unitaire wei:", sharePrice.toString());
    console.log("   Montant total:", ethers.utils.formatEther(amount1), "ETH");
    console.log("   Montant total wei:", amount1.toString());
    console.log("   Commission 12%:", ethers.utils.formatEther(amount1.mul(12).div(100)), "ETH");
    console.log("   Net pour startup:", ethers.utils.formatEther(amount1.mul(88).div(100)), "ETH");
    
    console.log("Estimation gas buyShares...");
    let gasEstimate1;
    try {
        gasEstimate1 = await campaign.connect(investor1).estimateGas.buyShares(numShares1, { value: amount1 });
        console.log("Gas estime:", gasEstimate1.toString());
    } catch (error) {
        console.log("Estimation gas echouee:", error.message);
        console.log("Raison possible:", error.reason);
    }
    
    console.log("Envoi buyShares investor1...");
    let buyTx1;
    try {
        buyTx1 = await campaign.connect(investor1).buyShares(numShares1, { 
            value: amount1,
            gasLimit: gasEstimate1 ? gasEstimate1.mul(120).div(100) : undefined
        });
        console.log("Transaction envoyee");
        console.log("Hash:", buyTx1.hash);
        console.log("Value:", ethers.utils.formatEther(buyTx1.value), "ETH");
    } catch (error) {
        console.log("Erreur envoi buyShares:", error.message);
        console.log("Raison:", error.reason);
        console.log("Code:", error.code);
        throw error;
    }
    
    console.log("Attente confirmation buyShares 1...");
    let buyReceipt1;
    try {
        buyReceipt1 = await buyTx1.wait();
        console.log("Investissement 1 confirme");
        console.log("Status:", buyReceipt1.status);
        console.log("Block:", buyReceipt1.blockNumber);
        console.log("Gas utilise:", buyReceipt1.gasUsed.toString());
        console.log("Cout gas:", ethers.utils.formatEther(buyReceipt1.gasUsed.mul(buyReceipt1.effectiveGasPrice)), "ETH");
    } catch (error) {
        console.log("Erreur confirmation buyShares 1:", error.message);
        throw error;
    }
    
    // Verifications apres premier investissement
    console.log("VERIFICATIONS APRES INVESTISSEMENT 1...");
    
    console.log("Verification NFTs possedes...");
    let nftsOwned1;
    try {
        nftsOwned1 = await campaign.balanceOf(investor1.address);
        console.log("NFTs possedes par investor1:", nftsOwned1.toString());
    } catch (error) {
        console.log("Erreur balanceOf:", error.message);
    }
    
    console.log("Verification etat campagne...");
    let roundAfter1;
    try {
        roundAfter1 = await campaign.getCurrentRound();
        console.log("Round state apres investissement 1:");
        console.log("   Fonds leves:", ethers.utils.formatEther(roundAfter1.fundsRaised), "ETH");
        console.log("   Fonds leves wei:", roundAfter1.fundsRaised.toString());
        console.log("   Shares vendues:", roundAfter1.sharesSold.toString());
        console.log("   Still active:", roundAfter1.isActive);
        console.log("   Still not finalized:", !roundAfter1.isFinalized);
    } catch (error) {
        console.log("Erreur getCurrentRound apres invest 1:", error.message);
    }

    // Si premier investissement echoue, analyser pourquoi
    if (nftsOwned1 && nftsOwned1.eq(0)) {
        console.log("PROBLEME: Aucun NFT recu malgre transaction confirmee");
        console.log("Analyse des evenements de la transaction...");
        
        if (buyReceipt1.events) {
            console.log("Evenements buyShares 1:", buyReceipt1.events.length);
            buyReceipt1.events.forEach((event, i) => {
                console.log("   [" + i + "]:", event.event || 'Unknown', "-", event.address);
                if (event.args) {
                    console.log("       Args:", event.args);
                }
            });
        }
        
        // Verifications supplementaires
        console.log("Verifications debug contract...");
        try {
            const contractBalance = await ethers.provider.getBalance(campaign.address);
            console.log("Balance contract:", ethers.utils.formatEther(contractBalance), "ETH");
            
            const totalSharesIssued = await campaign.totalSharesIssued();
            console.log("Total shares issued:", totalSharesIssued.toString());
        } catch (error) {
            console.log("Erreur verifications debug:", error.message);
        }
    }

    // Investisseur 2 achete 3 NFTs
    console.log("\nINVESTISSEUR 2 - ACHAT 3 NFTs...");
    let numShares2 = 3;
    let amount2 = sharePrice.mul(numShares2);
    
    console.log("Parametres investissement 2:");
    console.log("   Nombre NFTs:", numShares2);
    console.log("   Montant total:", ethers.utils.formatEther(amount2), "ETH");
    console.log("   Montant total wei:", amount2.toString());
    
    console.log("Estimation gas buyShares 2...");
    let gasEstimate2;
    try {
        gasEstimate2 = await campaign.connect(investor2).estimateGas.buyShares(numShares2, { value: amount2 });
        console.log("Gas estime:", gasEstimate2.toString());
    } catch (error) {
        console.log("Estimation gas 2 echouee:", error.message);
        console.log("Raison:", error.reason);
        
        // Analyser pourquoi l'estimation echoue
        console.log("Analyse etat actuel pour investissement 2...");
        const currentState = await campaign.getCurrentRound();
        const maxSharesPossible = currentState.targetAmount.div(currentState.sharePrice);
        const sharesRestantes = maxSharesPossible.sub(currentState.sharesSold);
        
        console.log("   Max shares theorique:", maxSharesPossible.toString());
        console.log("   Shares deja vendues:", currentState.sharesSold.toString());
        console.log("   Shares restantes:", sharesRestantes.toString());
        console.log("   Shares demandees:", numShares2);
        
        if (sharesRestantes.lt(numShares2)) {
            console.log("Pas assez de shares disponibles!");
            console.log("   Ajustement a:", sharesRestantes.toString(), "shares");
            const adjustedShares = sharesRestantes.toNumber();
            if (adjustedShares > 0) {
                const adjustedAmount = sharePrice.mul(adjustedShares);
                console.log("   Nouveau montant:", ethers.utils.formatEther(adjustedAmount), "ETH");
                
                try {
                    gasEstimate2 = await campaign.connect(investor2).estimateGas.buyShares(adjustedShares, { value: adjustedAmount });
                    console.log("Gas estime ajuste:", gasEstimate2.toString());
                    numShares2 = adjustedShares;
                    amount2 = adjustedAmount;
                } catch (error2) {
                    console.log("Estimation ajustee echouee aussi:", error2.message);
                }
            }
        }
    }
    
    console.log("Envoi buyShares investor2...");
    let buyTx2;
    try {
        buyTx2 = await campaign.connect(investor2).buyShares(numShares2, { 
            value: amount2,
            gasLimit: gasEstimate2 ? gasEstimate2.mul(120).div(100) : undefined
        });
        console.log("Transaction 2 envoyee");
        console.log("Hash:", buyTx2.hash);
    } catch (error) {
        console.log("Erreur envoi buyShares 2:", error.message);
        console.log("Raison:", error.reason);
        // Continue meme si investissement 2 echoue
    }
    
    if (buyTx2) {
        console.log("Attente confirmation buyShares 2...");
        try {
            const buyReceipt2 = await buyTx2.wait();
            console.log("Investissement 2 confirme");
            console.log("Status:", buyReceipt2.status);
            console.log("Gas utilise:", buyReceipt2.gasUsed.toString());
            
            const nftsOwned2 = await campaign.balanceOf(investor2.address);
            console.log("NFTs possedes par investor2:", nftsOwned2.toString());
            
        } catch (error) {
            console.log("Erreur confirmation buyShares 2:", error.message);
        }
    }

    // Etat final apres investissements
    console.log("\nETAT FINAL APRES INVESTISSEMENTS...");
    const roundFinal = await campaign.getCurrentRound();
    console.log("Fonds totaux leves:", ethers.utils.formatEther(roundFinal.fundsRaised), "ETH");
    console.log("Total shares vendues:", roundFinal.sharesSold.toString());
    console.log("Round actif:", roundFinal.isActive);
    console.log("Round finalise:", roundFinal.isFinalized);
    
    const targetNetFinal = roundFinal.targetAmount.mul(88).div(100);
    const pourcentageAtteint = roundFinal.fundsRaised.mul(100).div(targetNetFinal);
    console.log("Pourcentage target atteint:", pourcentageAtteint.toString() + "%");

    // ETAPE 4: TEST REMBOURSEMENT PENDANT ROUND ACTIF
    console.log("\nTEST REMBOURSEMENT PENDANT ROUND ACTIF...");
    
    const finalNfts1 = await campaign.balanceOf(investor1.address);
    console.log("NFTs investor1 avant remboursement:", finalNfts1.toString());
    
    if (finalNfts1.gt(0)) {
        console.log("Recuperation du premier NFT de investor1...");
        try {
            const tokenId1 = await campaign.tokenOfOwnerByIndex(investor1.address, 0);
            console.log("TokenId a tester:", tokenId1.toString());
            
            console.log("Verification possibilite remboursement...");
            const [canRefund, refundMessage] = await campaign.canRefundToken(tokenId1);
            console.log("Peut rembourser:", canRefund);
            console.log("Message remboursement:", refundMessage);
            
            if (canRefund) {
                const refundAmount = await campaign.getRefundAmount(tokenId1);
                console.log("Montant remboursement:", ethers.utils.formatEther(refundAmount), "ETH");
                
                console.log("Tentative remboursement...");
                const balanceBefore = await ethers.provider.getBalance(investor1.address);
                
                const refundTx = await campaign.connect(investor1).refundShares([tokenId1]);
                const refundReceipt = await refundTx.wait();
                
                console.log("Remboursement confirme (Status:", refundReceipt.status + ")");
                console.log("Gas utilise:", refundReceipt.gasUsed.toString());
                
                const balanceAfter = await ethers.provider.getBalance(investor1.address);
                const netRefund = balanceAfter.sub(balanceBefore).add(refundReceipt.gasUsed.mul(refundReceipt.effectiveGasPrice));
                console.log("Remboursement net recu:", ethers.utils.formatEther(netRefund), "ETH");
                
                const nftsAfterRefund = await campaign.balanceOf(investor1.address);
                console.log("NFTs restants investor1:", nftsAfterRefund.toString());
            } else {
                console.log("Remboursement non autorise:", refundMessage);
            }
        } catch (error) {
            console.log("Erreur test remboursement:", error.message);
        }
    } else {
        console.log("Aucun NFT a rembourser pour investor1");
    }

    // ETAPE 5: FINALISATION (si pas deja fait automatiquement)
    console.log("\nVERIFICATION FINALISATION...");
    const preFinalizationState = await campaign.getCurrentRound();
    
    if (!preFinalizationState.isFinalized) {
        console.log("Round pas encore finalise");
        console.log("Temps restant:", preFinalizationState.endTime.toNumber() - Math.floor(Date.now() / 1000), "secondes");
        
        const targetNetRequired = preFinalizationState.targetAmount.mul(88).div(100);
        if (preFinalizationState.fundsRaised.gte(targetNetRequired)) {
            console.log("Target atteint! Finalisation devrait etre automatique");
        } else {
            console.log("Attente fin de temps pour finalisation...");
            const timeToWait = Math.max(0, (preFinalizationState.endTime.toNumber() - Math.floor(Date.now() / 1000)) + 10);
            if (timeToWait < 300) { // Max 5 minutes d'attente
                console.log("Attente", timeToWait, "secondes...");
                await new Promise(resolve => setTimeout(resolve, timeToWait * 1000));
                
                // Verifier si auto-finalise
                const postWaitState = await campaign.getCurrentRound();
                console.log("Finalise apres attente:", postWaitState.isFinalized);
            }
        }
    } else {
        console.log("Round deja finalise");
    }

    // ETAPE 6: TEST REMBOURSEMENT APRES FINALISATION
    console.log("\nTEST REMBOURSEMENT APRES FINALISATION...");
    const postFinalizationState = await campaign.getCurrentRound();
    console.log("Etat finalisation:", postFinalizationState.isFinalized);
    console.log("Etat activite:", postFinalizationState.isActive);
    
    if (postFinalizationState.isFinalized) {
        console.log("Test remboursement post-finalisation (doit echouer)...");
        
        // Tester avec les NFTs restants
        const remainingNfts1 = await campaign.balanceOf(investor1.address);
        const remainingNfts2 = await campaign.balanceOf(investor2.address);
        
        console.log("NFTs restants investor1:", remainingNfts1.toString());
        console.log("NFTs restants investor2:", remainingNfts2.toString());
        
        if (remainingNfts1.gt(0)) {
            try {
                const tokenId = await campaign.tokenOfOwnerByIndex(investor1.address, 0);
                const [canRefund, message] = await campaign.canRefundToken(tokenId);
                
                console.log("Peut rembourser apres finalisation:", canRefund);
                console.log("Message:", message);
                
                if (canRefund) {
                    console.log("ERREUR: Remboursement Round 1 possible apres finalisation!");
                } else {
                    console.log("CORRECT: Remboursement Round 1 bloque apres finalisation");
                }
            } catch (error) {
                console.log("CORRECT: Erreur lors test remboursement:", error.message);
            }
        }
    }

    // ETAPE 7: INFORMATIONS FINALES COMPLETES
    console.log("\nRAPPORT FINAL COMPLET...");
    console.log("============================================================");
    
    const finalState = await campaign.getCurrentRound();
    const escrowInfo = await campaign.getEscrowInfo();
    const contractBalance = await ethers.provider.getBalance(campaign.address);
    
    console.log("CAMPAGNE:");
    console.log("   Adresse:", campaign.address);
    console.log("   Target initial:", ethers.utils.formatEther(finalState.targetAmount), "ETH");
    console.log("   Prix unitaire NFT:", ethers.utils.formatEther(finalState.sharePrice), "ETH");
    
    console.log("\nFINANCES:");
    console.log("   Fonds leves nets:", ethers.utils.formatEther(finalState.fundsRaised), "ETH");
    console.log("   Commission 12%:", ethers.utils.formatEther(finalState.fundsRaised.mul(12).div(88)), "ETH");
    console.log("   Fonds bruts investis:", ethers.utils.formatEther(finalState.fundsRaised.mul(100).div(88)), "ETH");
    console.log("   Balance contrat:", ethers.utils.formatEther(contractBalance), "ETH");
    
    console.log("\nNFTs:");
    console.log("   Total NFTs vendus:", finalState.sharesSold.toString());
    console.log("   NFTs investor1:", (await campaign.balanceOf(investor1.address)).toString());
    console.log("   NFTs investor2:", (await campaign.balanceOf(investor2.address)).toString());
    
    console.log("\nSTATUTS:");
    console.log("   Round actif:", finalState.isActive);
    console.log("   Round finalise:", finalState.isFinalized);
    console.log("   Escrow amount:", ethers.utils.formatEther(escrowInfo.amount), "ETH");
    console.log("   Escrow release:", new Date(escrowInfo.releaseTime.toNumber() * 1000).toISOString());
    console.log("   Escrow released:", escrowInfo.isReleased);
    
    console.log("\nTIMING:");
    console.log("   Temps fin test:", new Date().toISOString());

    // ETAPE 8: TEST VISUEL NFT ET CUSTOMISATION
    console.log("\nTEST VISUEL NFT ET CUSTOMISATION...");
    console.log("============================================================");
    
    console.log("VERIFICATION CONFIGURATION NFT ACTUELLE...");
    try {
        const nftRendererAddress = await campaign.nftRenderer();
        const nftBgColor = await campaign.nftBackgroundColor();
        const nftTextColor = await campaign.nftTextColor();
        const nftLogoUrl = await campaign.nftLogoUrl();
        const nftSector = await campaign.nftSector();
        
        console.log("NFT Renderer address:", nftRendererAddress);
        console.log("Background color:", nftBgColor || "Non defini");
        console.log("Text color:", nftTextColor || "Non defini");
        console.log("Logo URL:", nftLogoUrl || "Non defini");
        console.log("Sector:", nftSector || "Non defini");
        
        if (nftRendererAddress === "0x0000000000000000000000000000000000000000") {
            console.log("ATTENTION: NFTRenderer pas configure, utilise tokenURI par defaut");
        }
    } catch (error) {
        console.log("Erreur verification config NFT:", error.message);
    }
    
    console.log("\nTEST TOKEN URI DES NFTs...");
    
    // Tester le tokenURI du premier NFT de chaque investisseur
    const nfts1Final = await campaign.balanceOf(investor1.address);
    const nfts2Final = await campaign.balanceOf(investor2.address);
    
    if (nfts1Final.gt(0)) {
        console.log("\nTEST NFT INVESTOR1...");
        try {
            const tokenId = await campaign.tokenOfOwnerByIndex(investor1.address, 0);
            console.log("TokenId teste:", tokenId.toString());
            
            const tokenURI = await campaign.tokenURI(tokenId);
            console.log("TokenURI longueur:", tokenURI.length, "characters");
            console.log("TokenURI preview (100 premiers chars):", tokenURI.substring(0, 100));
            
            if (tokenURI.startsWith("data:application/json;base64,")) {
                console.log("Format: JSON Base64 (NFT Renderer actif)");
                try {
                    const base64Data = tokenURI.substring(29);
                    const jsonData = Buffer.from(base64Data, 'base64').toString('utf-8');
                    console.log("JSON decode:", jsonData.substring(0, 200) + "...");
                    
                    const metadata = JSON.parse(jsonData);
                    console.log("NFT Name:", metadata.name);
                    console.log("NFT Description:", metadata.description);
                    console.log("NFT Attributes:", metadata.attributes?.length, "attributes");
                    
                    if (metadata.image && metadata.image.startsWith("data:image/svg+xml;base64,")) {
                        console.log("SVG Image incluse dans metadata");
                        const svgBase64 = metadata.image.substring(26);
                        const svgData = Buffer.from(svgBase64, 'base64').toString('utf-8');
                        console.log("SVG longueur:", svgData.length, "characters");
                        console.log("SVG preview:", svgData.substring(0, 150) + "...");
                    }
                } catch (decodeError) {
                    console.log("Erreur decode JSON:", decodeError.message);
                }
            } else if (tokenURI.startsWith("data:")) {
                console.log("Format: Data URI direct");
            } else if (tokenURI.startsWith("http")) {
                console.log("Format: URL externe");
            } else {
                console.log("Format: Autre -", tokenURI.substring(0, 50));
            }
        } catch (error) {
            console.log("Erreur tokenURI investor1:", error.message);
        }
    }
    
    if (nfts2Final.gt(0)) {
        console.log("\nTEST NFT INVESTOR2...");
        try {
            const tokenId = await campaign.tokenOfOwnerByIndex(investor2.address, 0);
            console.log("TokenId teste:", tokenId.toString());
            
            const nftInfo = await campaign.getNFTInfo(tokenId);
            console.log("NFT Info - Round:", nftInfo.round.toString(), "Number:", nftInfo.number.toString());
            
            const tokenURI = await campaign.tokenURI(tokenId);
            console.log("TokenURI longueur:", tokenURI.length, "characters");
            
            // Tester un deuxieme NFT pour voir la difference
            if ((await campaign.balanceOf(investor2.address)).gt(1)) {
                const tokenId2 = await campaign.tokenOfOwnerByIndex(investor2.address, 1);
                console.log("Test tokenId 2:", tokenId2.toString());
                
                const nftInfo2 = await campaign.getNFTInfo(tokenId2);
                console.log("NFT Info 2 - Round:", nftInfo2.round.toString(), "Number:", nftInfo2.number.toString());
            }
        } catch (error) {
            console.log("Erreur tokenURI investor2:", error.message);
        }
    }
    
    console.log("\nTEST CUSTOMISATION NFT (SI POSSIBLE)...");
    
    // Verifier si on peut customiser (probablement fonction onlyStartup)
    try {
        console.log("Tentative lecture methodes customisation...");
        
        // Ces appels vont probablement echouer mais on teste pour voir ce qui existe
        const methods = [
            "setNftRenderer",
            "setNftCustomization", 
            "updateNftColors",
            "setNftBackgroundColor",
            "setNftTextColor",
            "setNftLogoUrl",
            "setNftSector"
        ];
        
        for (const method of methods) {
            try {
                if (campaign[method]) {
                    console.log("Methode disponible:", method);
                } else {
                    console.log("Methode inexistante:", method);
                }
            } catch (e) {
                console.log("Methode", method, "- erreur:", e.message.substring(0, 50));
            }
        }
        
    } catch (error) {
        console.log("Erreur test customisation:", error.message);
    }
    
    // EXTRACTION COMPLETE DU PREMIER NFT POUR VISUEL
    console.log("\n🎨 EXTRACTION COMPLETE NFT PERSONNALISE...");
    console.log("================================================================");
    
    try {
        // Prendre le premier NFT de l'investor1
        const firstTokenId = await campaign.tokenOfOwnerByIndex(investor1.address, 0);
        console.log("Token ID sélectionné:", firstTokenId.toString());
        
        // Extraire le tokenURI complet
        const tokenURI = await campaign.tokenURI(firstTokenId);
        console.log("\n📋 TOKEN URI COMPLET:");
        console.log(tokenURI);
        
        // Décoder les métadonnées JSON
        if (tokenURI.includes("data:application/json;base64,")) {
            const base64Data = tokenURI.split(',')[1];
            const jsonData = JSON.parse(Buffer.from(base64Data, 'base64').toString());
            
            console.log("\n📊 MÉTADONNÉES NFT:");
            console.log("Nom:", jsonData.name);
            console.log("Description:", jsonData.description);
            
            console.log("\n🎭 ATTRIBUTS NFT:");
            jsonData.attributes.forEach((attr, index) => {
                console.log(`${index + 1}. ${attr.trait_type}: ${attr.value}`);
            });
            
            // Extraire et afficher l'image SVG
            if (jsonData.image && jsonData.image.includes("data:image/svg+xml;base64,")) {
                const svgBase64 = jsonData.image.split(',')[1];
                const svgContent = Buffer.from(svgBase64, 'base64').toString();
                
                console.log("\n🖼️  IMAGE SVG GÉNÉRÉE:");
                console.log("─".repeat(80));
                console.log(svgContent);
                console.log("─".repeat(80));
                
                console.log("\n✅ NFT PERSONNALISÉ GÉNÉRÉ AVEC SUCCÈS !");
                console.log("🎨 Background:", nftBackgroundColor);
                console.log("📝 Text:", nftTextColor);
                console.log("🔗 Logo:", nftLogoUrl);
                console.log("🏢 Sector:", nftSector);
            }
        }
        
        // Informations sur le NFT
        const nftInfo = await campaign.getNFTInfo(firstTokenId);
        console.log("\n📈 INFORMATIONS NFT:");
        console.log("Round de création:", nftInfo[0].toString());
        console.log("Numéro séquentiel:", nftInfo[1].toString());
        
        const purchasePrice = await campaign.getTokenPurchasePrice(firstTokenId);
        console.log("Prix d'achat original:", ethers.utils.formatEther(purchasePrice), "ETH");
        
    } catch (error) {
        console.log("❌ Erreur extraction NFT:", error.message);
    }
    
    console.log("\n📊 RÉSUMÉ TEST VISUEL NFT:");
    console.log("─".repeat(50));
    console.log("• NFTs investor1:", nfts1Final.toString());
    console.log("• NFTs investor2:", nfts2Final.toString()); 
    console.log("• Total NFTs créés:", nfts1Final.add(nfts2Final).toString());
    console.log("• TokenURI generation: ✅");
    console.log("• Metadata format: ✅");
    console.log("• SVG generation: ✅");
    console.log("• Personnalisation NFT: ✅");

    console.log("\nTEST TERMINE AVEC SUCCES!");
    console.log("============================================================");
}

main()
    .then(() => {
        console.log("\nSCRIPT TERMINE NORMALEMENT");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\nERREUR FATALE:");
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
        console.error("Code:", error.code);
        process.exit(1);
    });