// lib/hooks/useCampaignAddress.js

import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import CampaignABI from '@/ABI/CampaignABI.json';

function useCampaignAddress(campaignId) {
  const [campaignData, setCampaignData] = useState(null);
  const [error, setError] = useState(null);

  // Lecture des données de la campagne
  const { 
    data: currentRoundData, 
    isLoading: roundLoading, 
    error: roundError 
  } = useReadContract({
    address: campaignId,
    abi: CampaignABI,
    functionName: 'getCurrentRound',
  });

  // Lecture du créateur de la campagne
  const { 
    data: creatorAddress, 
    isLoading: creatorLoading, 
    error: creatorError 
  } = useReadContract({
    address: campaignId,
    abi: CampaignABI,
    functionName: 'startup',
  });

  const loading = roundLoading || creatorLoading;

  useEffect(() => {
    if (currentRoundData && creatorAddress) {
      try {
        setCampaignData({
          roundNumber: Number(currentRoundData[0]),
          sharePrice: formatEther(currentRoundData[1]),
          targetAmount: formatEther(currentRoundData[2]),
          fundsRaised: formatEther(currentRoundData[3]),
          sharesSold: Number(currentRoundData[4]),
          endTime: new Date(Number(currentRoundData[5]) * 1000),
          isActive: currentRoundData[6],
          isFinalized: currentRoundData[7],
          creatorAddress: creatorAddress
        });
        setError(null);
      } catch (err) {
        console.error("Erreur lors du formatage des données:", err);
        setError(err.message);
      }
    }

    if (roundError || creatorError) {
      setError(roundError?.message || creatorError?.message);
    }
  }, [currentRoundData, creatorAddress, roundError, creatorError]);

  return { campaignData, loading, error };
}

export default useCampaignAddress;