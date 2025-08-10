const { ethers } = require('hardhat');

async function main() {
    const Campaign = await ethers.getContractFactory('Campaign');
    const DivarProxy = await ethers.getContractFactory('DivarProxy');
    const proxy = DivarProxy.attach('0x89Eba0c82c1f16433473A9A06690BfaAC2c7a1b4');
    
    console.log('⏳ Mise à jour bytecode Campaign...');
    const tx = await proxy.setCampaignBytecode(Campaign.bytecode);
    const receipt = await tx.wait();
    console.log('✅ Terminé ! Gas:', receipt.gasUsed.toString());
    console.log('🎉 Nouvelles campagnes utiliseront Campaign V2 avec bug fix !');
}

main().catch(console.error);