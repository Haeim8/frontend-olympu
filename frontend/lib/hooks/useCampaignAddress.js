// lib/hooks/useCampaignAddress.js

import { useState, useEffect } from 'react';
import { useContract } from '@thirdweb-dev/react';
import { ethers } from 'ethers';

function useCampaignAddress(campaignId) {
  const [campaignData, setCampaignData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { contract } = useContract(campaignId);

  useEffect(() => {
    async function fetchCampaignData() {
      if (!campaignId || !contract) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await contract.call("getCurrentRound");
        
        setCampaignData({
          roundNumber: data.roundNumber.toNumber(),
          sharePrice: ethers.utils.formatEther(data.sharePrice),
          targetAmount: ethers.utils.formatEther(data.targetAmount),
          fundsRaised: ethers.utils.formatEther(data.fundsRaised),
          sharesSold: data.sharesSold.toNumber(),
          endTime: new Date(data.endTime.toNumber() * 1000),
          isActive: data.isActive,
          isFinalized: data.isFinalized,
          creatorAddress: await contract.call("startup")
        });
      } catch (err) {
        console.error("Erreur lors de la récupération des données:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCampaignData();
  }, [campaignId, contract]);

  return { campaignData, loading, error };
}

export default useCampaignAddress;