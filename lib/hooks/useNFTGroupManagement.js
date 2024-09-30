// lib/hooks/useNFTGroupManagement.js

import { useEffect } from 'react';
import useHasNFT from './useHasNFT';
import { useAccount } from 'wagmi';
import { useUser } from '@/components/shared/UserContext';
import { updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const useNFTGroupManagement = (campaignId) => {
  const { address } = useAccount();
  const { user } = useUser();
  const { hasNFT } = useHasNFT(address, campaignId);

  useEffect(() => {
    const manageGroup = async () => {
      const campaignRef = doc(db, "campaigns", campaignId.toString());
      if (hasNFT) {
        await updateDoc(campaignRef, {
          investors: arrayUnion(user.uid)
        });
      } else {
        await updateDoc(campaignRef, {
          investors: arrayRemove(user.uid)
        });
      }
    };

    if (user && address) {
      manageGroup();
    }
  }, [hasNFT, campaignId, user, address]);
};

export default useNFTGroupManagement;
