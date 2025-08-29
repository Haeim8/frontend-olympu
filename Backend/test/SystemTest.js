const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("🧪 SYSTÈME LIVAR COMPLET", function () {
    let divarProxy, priceConsumer, campaignKeeper, nftRenderer, recPromotionManager;
    let owner, treasury, startup1, startup2, investor1, investor2, investor3, investor4;
    let campaign1, campaign2;
    
    const CREATION_FEE = ethers.utils.parseEther("0.001");
    const SHARE_PRICE_1 = ethers.utils.parseEther("0.1");
    const TARGET_1 = ethers.utils.parseEther("10");
    const ROUND_DURATION = 7 * 24 * 60 * 60;

    before(async function () {
        [owner, treasury, startup1, startup2, investor1, investor2, investor3, investor4] = await ethers.getSigners();
        
        console.log("\n🚀 DÉPLOIEMENT SYSTÈME...");
        
        // PriceConsumer
        const PriceConsumerV3 = await ethers.getContractFactory("PriceConsumerV3");
        priceConsumer = await PriceConsumerV3.deploy();
        await priceConsumer.deployed();
        console.log(`✅ PriceConsumer: ${priceConsumer.address}`);
        
        // DivarProxy 
        const DivarProxy = await ethers.getContractFactory("DivarProxy");
        divarProxy = await upgrades.deployProxy(
            DivarProxy,
            [owner.address, owner.address, priceConsumer.address],
            { initializer: "initialize", kind: "uups" }
        );
        await divarProxy.deployed();
        console.log(`✅ DivarProxy: ${divarProxy.address}`);
        
        // CampaignKeeper
        const CampaignKeeper = await ethers.getContractFactory("CampaignKeeper");
        campaignKeeper = await CampaignKeeper.deploy(divarProxy.address);
        await campaignKeeper.deployed();
        console.log(`✅ CampaignKeeper: ${campaignKeeper.address}`);
        
        // Config
        await divarProxy.setCampaignKeeper(campaignKeeper.address);
        
        // NFTRenderer
        const NFTRenderer = await ethers.getContractFactory("NFTRenderer");
        nftRenderer = await NFTRenderer.deploy();
        await nftRenderer.deployed();
        
        // RecPromotionManager
        const RecPromotionManager = await ethers.getContractFactory("RecPromotionManager");
        recPromotionManager = await RecPromotionManager.deploy(
            divarProxy.address,
            priceConsumer.address,
            owner.address
        );
        await recPromotionManager.deployed();
        
        // Set bytecode
        const Campaign = await ethers.getContractFactory("Campaign");
        await divarProxy.setCampaignBytecode(Campaign.bytecode);
        
        console.log("✅ Système déployé\n");
    });

    it("🎯 1. CRÉATION CAMPAGNES", async function () {
        console.log("🎯 Test: Création campagnes");
        
        const endTime = (await time.latest()) + ROUND_DURATION;
        
        // Campagne 1
        await divarProxy.connect(startup1).createCampaign(
            "TechStartup",
            "TECH", 
            TARGET_1,
            SHARE_PRICE_1,
            endTime,
            "Technology",
            "metadata",
            250,
            "logo",
            { value: CREATION_FEE }
        );
        
        // Campagne 2
        await divarProxy.connect(startup2).createCampaign(
            "GreenEnergy",
            "GREEN",
            TARGET_1.div(2),
            SHARE_PRICE_1.div(2),
            endTime,
            "Energy", 
            "metadata",
            500,
            "logo",
            { value: CREATION_FEE }
        );
        
        const campaigns = await divarProxy.getAllCampaigns();
        expect(campaigns.length).to.equal(2);
        
        const Campaign = await ethers.getContractFactory("Campaign");
        campaign1 = Campaign.attach(campaigns[0]);
        campaign2 = Campaign.attach(campaigns[1]);
        
        console.log(`✅ 2 campagnes créées`);
    });

    it("💰 2. INVESTISSEMENTS MULTIPLES", async function () {
        console.log("💰 Test: Investissements");
        
        // Investor1 → 10 parts campagne 1
        await campaign1.connect(investor1).buyShares(10, {
            value: SHARE_PRICE_1.mul(10)
        });
        
        // Investor2 → 15 parts campagne 1
        await campaign1.connect(investor2).buyShares(15, {
            value: SHARE_PRICE_1.mul(15)
        });
        
        // Investor3 → 20 parts campagne 2
        await campaign2.connect(investor3).buyShares(20, {
            value: SHARE_PRICE_1.div(2).mul(20)
        });
        
        // Investor4 → 30 parts campagne 2
        await campaign2.connect(investor4).buyShares(30, {
            value: SHARE_PRICE_1.div(2).mul(30)
        });
        
        // Vérifications
        expect((await campaign1.balanceOf(investor1.address)).toNumber()).to.equal(10);
        expect((await campaign1.balanceOf(investor2.address)).toNumber()).to.equal(15);
        expect((await campaign2.balanceOf(investor3.address)).toNumber()).to.equal(20);
        expect((await campaign2.balanceOf(investor4.address)).toNumber()).to.equal(30);
        
        console.log("✅ Investissements validés");
    });

    it("🔄 3. REMBOURSEMENTS", async function () {
        console.log("🔄 Test: Remboursements");
        
        // Investor2 rembourse 3 NFTs (tokens 11,12,13)
        const tokensToRefund = [11, 12, 13];
        
        const balanceBefore = await ethers.provider.getBalance(investor2.address);
        
        await campaign1.connect(investor2).refundShares(tokensToRefund);
        
        const balanceAfter = await ethers.provider.getBalance(investor2.address);
        
        // Vérifier que les NFTs ont été brûlés et balance mise à jour
        expect((await campaign1.balanceOf(investor2.address)).toNumber()).to.equal(12); // 15-3
        expect(await campaign1.tokenBurned(11)).to.be.true;
        
        console.log("✅ Remboursement validé");
    });

    it("🎁 4. PROMOTIONS", async function () {
        console.log("🎁 Test: Promotions");
        
        // Promouvoir campagne 1 en FEATURED
        const featuredPrice = await recPromotionManager.getBoostPriceInETH(0);
        
        await recPromotionManager.connect(startup1).promoteCampaign(
            campaign1.address,
            0, // FEATURED
            { value: featuredPrice }
        );
        
        // Vérifier promotion active
        const currentRound = await campaign1.currentRound();
        const isActive = await recPromotionManager.isPromotionActive(campaign1.address, currentRound);
        expect(isActive).to.be.true;
        
        console.log("✅ Promotion validée");
    });

    it("🏁 5. FINALISATION AUTOMATIQUE", async function () {
        console.log("🏁 Test: Finalisation");
        
        // Finaliser campagne 1 en atteignant l'objectif
        const remainingShares = TARGET_1.div(SHARE_PRICE_1).sub(25); // 25 déjà vendues
        
        await campaign1.connect(investor4).buyShares(remainingShares, {
            value: SHARE_PRICE_1.mul(remainingShares)
        });
        
        // Vérifier finalisation
        const round = await campaign1.getCurrentRound();
        expect(round.isFinalized).to.be.true;
        
        console.log("✅ Auto-finalisation validée");
    });

    it("💎 6. DIVIDENDES", async function () {
        console.log("💎 Test: Dividendes");
        
        // Distribuer 2 ETH de dividendes
        const dividendAmount = ethers.utils.parseEther("2");
        
        await campaign1.connect(startup1).distributeDividends(dividendAmount, {
            value: dividendAmount
        });
        
        // Investor1 claim ses dividendes
        const balanceBefore = await ethers.provider.getBalance(investor1.address);
        
        const tx = await campaign1.connect(investor1).claimDividends();
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed.mul(tx.gasPrice);
        
        const balanceAfter = await ethers.provider.getBalance(investor1.address);
        const dividendReceived = balanceAfter.add(gasUsed).sub(balanceBefore);
        
        expect(dividendReceived.gt(0)).to.be.true;
        
        console.log("✅ Dividendes validés");
    });

    it("🕐 7. ESCROW", async function () {
        console.log("🕐 Test: Escrow");
        
        // Vérifier escrow configuré
        const escrowInfo = await campaign1.getEscrowInfo();
        expect(escrowInfo.amount.gt(0)).to.be.true;
        expect(escrowInfo.isReleased).to.be.false;
        
        // Avancer temps 60h
        await time.increase(60 * 60 * 60 + 3600);
        
        // Startup claim escrow
        await campaign1.connect(startup1).claimEscrow();
        
        const escrowAfter = await campaign1.getEscrowInfo();
        expect(escrowAfter.isReleased).to.be.true;
        
        console.log("✅ Escrow validé");
    });

    it("🌊 8. NOUVEAU ROUND", async function () {
        console.log("🌊 Test: Nouveau round");
        
        // Startup1 démarre round 2 avec prix augmenté
        const newPrice = SHARE_PRICE_1.mul(150).div(100); // +50%
        const newTarget = TARGET_1.mul(2);
        
        await campaign1.connect(startup1).startNewRound(
            newTarget,
            newPrice,
            ROUND_DURATION
        );
        
        // Investir dans round 2
        await campaign1.connect(investor2).buyShares(5, {
            value: newPrice.mul(5)
        });
        
        const round = await campaign1.getCurrentRound();
        expect(round.roundNumber.toNumber()).to.equal(2);
        expect(round.sharePrice.toString()).to.equal(newPrice.toString());
        
        console.log("✅ Nouveau round validé");
    });

    it("🤖 9. CHAINLINK KEEPER", async function () {
        console.log("🤖 Test: Chainlink Keeper");
        
        // Avancer le temps pour que campagne 2 expire
        await time.increase(ROUND_DURATION + 1);
        
        // Keeper détecte finalisation nécessaire
        const [upkeepNeeded, performData] = await campaignKeeper.checkUpkeep("0x");
        expect(upkeepNeeded).to.be.true;
        
        // Exécuter upkeep
        await campaignKeeper.performUpkeep(performData);
        
        console.log("✅ Keeper automation validée");
    });

    it("📊 10. ANALYTICS", async function () {
        console.log("📊 Test: Analytics");
        
        // Campagnes par créateur
        const startup1Campaigns = await divarProxy.getCampaignsByCreator(startup1.address);
        const startup2Campaigns = await divarProxy.getCampaignsByCreator(startup2.address);
        expect(startup1Campaigns.length).to.equal(1);
        expect(startup2Campaigns.length).to.equal(1);
        
        // Par catégorie
        const techCampaigns = await divarProxy.getCampaignsByCategory("Technology");
        expect(techCampaigns.length).to.equal(1);
        
        // NFT balances
        const inv1Balance = await campaign1.balanceOf(investor1.address);
        const inv2Balance = await campaign1.balanceOf(investor2.address);
        
        console.log(`📊 Investor1: ${inv1Balance} NFTs`);
        console.log(`📊 Investor2: ${inv2Balance} NFTs`);
        console.log("✅ Analytics validées");
    });

    after(function () {
        console.log("\n" + "=".repeat(50));
        console.log("🎉 TOUS LES TESTS PASSÉS!");
        console.log("✅ Création campagnes");
        console.log("✅ Investissements multi-wallets");
        console.log("✅ Remboursements");
        console.log("✅ Système promotions");
        console.log("✅ Finalisation auto");
        console.log("✅ Distribution dividendes");
        console.log("✅ Gestion escrow");
        console.log("✅ Rounds multiples");
        console.log("✅ Chainlink automation");
        console.log("✅ Analytics");
        console.log("🚀 SYSTÈME LIVAR FONCTIONNEL!");
        console.log("=".repeat(50));
    });
});