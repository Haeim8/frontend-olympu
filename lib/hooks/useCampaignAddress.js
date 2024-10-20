// lib/hooks/useCampaignAddress.js

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase'; // Assurez-vous que le chemin est correct
import { utils } from 'ethers';

/**
 * Hook pour récupérer les informations de la campagne depuis Firebase.
 * @param {string} campaignId - ID de la campagne (qui est l'adresse du contrat).
 * @returns {object} - { campaignData, loading, error }
 */
const useCampaignAddress = (campaignId) => {
  const [campaignData, setCampaignData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!campaignId) {
      console.log("Aucun ID de campagne fourni.");
      setLoading(false);
      return;
    }

    const fetchCampaignData = async () => {
      try {
        const docRef = doc(db, 'campaigns', campaignId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const fetchedAddress = data.creatorAddress ? data.creatorAddress.trim() : null;
          console.log("Données de la campagne récupérées :", data);

          if (fetchedAddress && utils.isAddress(fetchedAddress)) {
            setCampaignData(data);
          } else {
            throw new Error('Adresse du créateur invalide dans Firebase.');
          }
        } else {
          throw new Error('Aucune campagne trouvée avec cet ID.');
        }
      } catch (err) {
        console.error("Erreur dans useCampaignAddress :", err);
        setError(err.message || 'Erreur lors de la récupération des données de la campagne.');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignData();
  }, [campaignId]);

  return { campaignData, loading, error };
};

export default useCampaignAddress;
