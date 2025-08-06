import { useContractRead } from 'thirdweb';
import FundRaisingPlatformABI from '../../abis/FundRaisingPlatformABI.json';
import CampaignABI from 'ABI/CampaignABI.json'; // Si nécessaire
import { useEffect } from 'react';

const FUNDRAISING_PLATFORM_ADDRESS = '0x89Eba0c82c1f16433473A9A06690BfaAC2c7a1b4'; // Adresse déployée DivarProxy
const CAMPAIGN_ADDRESS = '0xYourCampaignContractAddress'; // Adresse déployée

const useHasNFT = (address, campaignId) => {
  const { data, isError, isLoading } = useContractRead({
    address: FUNDRAISING_PLATFORM_ADDRESS,
    abi: FundRaisingPlatformABI,
    functionName: 'balanceOf', // Vérifiez si cette fonction existe dans le contrat FundRaisingPlatform
    args: [address],
  });

  useEffect(() => {
    if (data) {
      console.log(`Balance: ${data.toString()}`);
    }
  }, [data]);

  return { data, isError, isLoading };
};

export default useHasNFT;

