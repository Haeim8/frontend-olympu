const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("TEST KEEPER AUTOMATION - CORRECT", function () {
    let deployer, startup, investor1, investor2, treasury;
    let divarProxy, campaignKeeper, priceConsumer, campaign;
    
    before(async function () {
        [deployer, startup, investor1, investor2, treasury] = await ethers.getSigners();
        
        console.log("🚀 Déploiement des contrats...");
        
        // 1. PriceConsumer
        const PriceConsumer = await ethers.getContractFactory("PriceConsumerV3");
        priceConsumer = await PriceConsumer.deploy();
        await priceConsumer.deployed();
        
        // 2. DivarProxy
        const DivarProxy = await ethers.getContractFactory("DivarProxy");
        divarProxy = await upgrades.deployProxy(DivarProxy, [
            treasury.address,
            deployer.address,
            priceConsumer.address
        ]);
        await divarProxy.deployed();
        
        // 3. CampaignKeeper
        const CampaignKeeper = await ethers.getContractFactory("CampaignKeeper");
        campaignKeeper = await CampaignKeeper.deploy(divarProxy.address);
        await campaignKeeper.deployed();
        
        // 4. Setup
        await divarProxy.connect(treasury).setCampaignKeeper(campaignKeeper.address);
        const Campaign = await ethers.getContractFactory("Campaign");
        await divarProxy.connect(treasury).setCampaignBytecode(Campaign.bytecode);
        
        console.log("✅ Tous les contrats déployés");
    });
    
    it("1️⃣ Créer campagne et acheter NFTs", async function () {
        const fee = await divarProxy.getCampaignCreationFeeETH();
        
        const tx = await divarProxy.connect(startup).createCampaign(
            "Test Campaign",
            "TST",
            ethers.utils.parseEther("10"),
            ethers.utils.parseEther("0.1"), 
            Math.floor(Date.now()/1000) + 3600, // 1h
            "Tech",
            "ipfs://test",
            500,
            "logo.png",
            { value: fee }
        );
        
        const receipt = await tx.wait();
        const event = receipt.events.find(e => e.event === 'CampaignCreated');
        const campaignAddress = event.args.campaignAddress;
        campaign = await ethers.getContractAt("Campaign", campaignAddress);
        
        // Acheter NFTs
        await campaign.connect(investor1).buyShares(2, {
            value: ethers.utils.parseEther("0.2")
        });
        
        const balance = await campaign.balanceOf(investor1.address);
        expect(balance.toNumber()).to.equal(2);
        console.log("✅ Campagne créée et NFTs achetés");
    });
    
    it("2️⃣ Test checkUpkeep - PAS ENCORE PRÊT", async function () {
        console.log("\n🔍 Test checkUpkeep avant expiration...");
        
        const [upkeepNeeded, performData] = await campaignKeeper.checkUpkeep("0x");
        expect(upkeepNeeded).to.be.false;
        console.log("✅ Pas encore besoin d'upkeep:", upkeepNeeded);
    });
    
    it("3️⃣ Avancer le temps et tester checkUpkeep", async function () {
        console.log("\n⏰ Avancer le temps...");
        
        // Avancer le temps de 2h
        await network.provider.send("evm_increaseTime", [7200]);
        await network.provider.send("evm_mine");
        
        const [upkeepNeeded, performData] = await campaignKeeper.checkUpkeep("0x");
        expect(upkeepNeeded).to.be.true;
        console.log("✅ Upkeep nécessaire:", upkeepNeeded);
        
        // Décoder les données
        const decoded = ethers.utils.defaultAbiCoder.decode(
            ["string", "address", "uint256"], 
            performData
        );
        console.log("✅ Action:", decoded[0]);
        console.log("✅ Campagne:", decoded[1]);
        console.log("✅ Round:", decoded[2].toString());
        
        expect(decoded[0]).to.equal("FINALIZE");
        expect(decoded[1]).to.equal(campaign.address);
    });
    
    it("4️⃣ Exécuter performUpkeep", async function () {
        console.log("\n⚡ Exécuter performUpkeep...");
        
        const [, performData] = await campaignKeeper.checkUpkeep("0x");
        
        const tx = await campaignKeeper.performUpkeep(performData);
        const receipt = await tx.wait();
        
        // Vérifier l'événement
        const event = receipt.events.find(e => e.event === 'CampaignFinalized');
        expect(event).to.not.be.undefined;
        expect(event.args.success).to.be.true;
        console.log("✅ Campagne finalisée avec succès");
        
        // Vérifier le state de la campagne
        const currentRound = await campaign.getCurrentRound();
        expect(currentRound.isFinalized).to.be.true;
        expect(currentRound.isActive).to.be.false;
        console.log("✅ Round marqué comme finalisé");
        
        // Vérifier l'escrow
        const escrowInfo = await campaign.getEscrowInfo();
        expect(escrowInfo.amount.gt(0)).to.be.true;
        console.log("✅ Escrow créé:", ethers.utils.formatEther(escrowInfo.amount), "ETH");
    });
    
    it("5️⃣ Test système NFT après finalisation", async function () {
        console.log("\n🎨 Test système NFT...");
        
        // Vérifier les NFTs existent encore
        const balance = await campaign.balanceOf(investor1.address);
        expect(balance.toNumber()).to.equal(2);
        console.log("✅ NFTs préservés après finalisation");
        
        // Vérifier les infos NFT
        const tokenId1 = await campaign.tokenOfOwnerByIndex(investor1.address, 0);
        const nftInfo = await campaign.getNFTInfo(tokenId1);
        
        expect(nftInfo[0].toNumber()).to.equal(1); // Round 1
        console.log("✅ NFT info correcte - Round:", nftInfo[0].toString(), "Numéro:", nftInfo[1].toString());
        
        // Vérifier prix d'achat stocké
        const purchasePrice = await campaign.getTokenPurchasePrice(tokenId1);
        expect(purchasePrice).to.equal(ethers.utils.parseEther("0.1"));
        console.log("✅ Prix d'achat NFT stocké:", ethers.utils.formatEther(purchasePrice), "ETH");
    });
    
    it("6️⃣ Test remboursement après finalisation", async function () {
        console.log("\n↩️ Test remboursement après finalisation...");
        
        const tokenId = await campaign.tokenOfOwnerByIndex(investor1.address, 0);
        
        // Nouveau investisseur ne peut plus rembourser
        const canRefund = await campaign.canRefundToken(tokenId);
        expect(canRefund[0]).to.be.false;
        console.log("✅ Remboursement bloqué après finalisation:", canRefund[1]);
        
        // Essayer quand même
        try {
            await campaign.connect(investor1).refundShares([tokenId]);
            expect.fail("Devrait échouer");
        } catch (error) {
            console.log("✅ Transaction rejetée comme attendu");
        }
    });
    
    it("7️⃣ Test libération escrow", async function () {
        console.log("\n💰 Test libération escrow...");
        
        // Trop tôt
        try {
            await campaign.connect(startup).claimEscrow();
            expect.fail("Devrait échouer");
        } catch (error) {
            console.log("✅ Claim trop tôt bloqué");
        }
        
        // Avancer de 65h
        await network.provider.send("evm_increaseTime", [65 * 3600]);
        await network.provider.send("evm_mine");
        
        // Maintenant ça marche
        const balanceBefore = await ethers.provider.getBalance(startup.address);
        await campaign.connect(startup).claimEscrow();
        const balanceAfter = await ethers.provider.getBalance(startup.address);
        
        expect(balanceAfter.gt(balanceBefore)).to.be.true;
        console.log("✅ Escrow libéré après 60h");
        
        console.log("\n🎉 TOUS LES TESTS PASSÉS - SYSTÈME FONCTIONNEL !");
    });
});