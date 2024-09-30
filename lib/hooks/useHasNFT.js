import { useContractRead } from 'wagmi';
import FundRaisingPlatformABI from '../../abis/FundRaisingPlatformABI.json';
import CampaignABI from '../../abis/CampaignABI.json'; // Si nécessaire
import { useEffect } from 'react';

const FUNDRAISING_PLATFORM_ADDRESS = '0xF334d4CEcB73bc95e032949b9437A1eE6D4C6019'; // Adresse déployée
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

