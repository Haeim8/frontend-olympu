// lib/hooks/useCampaignAddress.js

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase'; // Assurez-vous que le chemin est correct
import { utils } from 'ethers';

/**
 * Hook pour récupérer l'adresse du contrat de la campagne depuis Firebase.
 * @param {string} campaignId - ID de la campagne.
 * @returns {object} - { address, loading, error }
 */
const useCampaignAddress = (campaignId) => {
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!campaignId) {
      setLoading(false);
      return;
    }

    const fetchAddress = async () => {
      try {
        const docRef = doc(db, 'campaigns', campaignId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (utils.isAddress(data.contractAddress)) {
            setAddress(data.contractAddress);
          } else {
            throw new Error('Adresse du contrat invalide dans Firebase.');
          }
        } else {
          throw new Error('Aucune campagne trouvée avec cet ID.');
        }
      } catch (err) {
        setError(err.message || 'Erreur lors de la récupération de l\'adresse du contrat.');
      } finally {
        setLoading(false);
      }
    };

    fetchAddress();
  }, [campaignId]);

  return { address, loading, error };
};

export default useCampaignAddress;