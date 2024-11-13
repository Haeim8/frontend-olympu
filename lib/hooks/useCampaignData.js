// lib/hooks/useCampaignMetadata.js

import { useEffect, useState } from 'react';
import { useContractRead } from '@thirdweb-dev/react';

/**
 * Hook pour récupérer les métadonnées de la campagne depuis IPFS via Pinata.
 * @param {SmartContract} contract - Instance du contrat intelligent.
 * @returns {object} - { metadata, loading, error }
 */
const useCampaignMetadata = (contract) => {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Lire l'URI des métadonnées depuis le contrat
  const { data: metadataURI, isLoading: metadataLoading, error: metadataError } = useContractRead(contract, "metadata", []);

  useEffect(() => {
    if (metadataLoading) return;
    if (metadataError) {
      setError(metadataError.message || 'Erreur lors de la lecture de l\'URI des métadonnées depuis le contrat');
      setLoading(false);
      return;
    }

    if (!metadataURI) {
      setError('Aucune URI des métadonnées trouvée dans le contrat');
      setLoading(false);
      return;
    }

    const fetchMetadata = async () => {
      try {
        // Convertir l'URI IPFS en URL HTTP via le gateway de Pinata
        const url = metadataURI.startsWith('ipfs://') 
          ? metadataURI.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/') 
          : metadataURI;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Échec de la récupération des métadonnées depuis IPFS');
        }
        const data = await response.json();
        setMetadata(data);
      } catch (err) {
        console.error('Erreur lors de la récupération des métadonnées:', err);
        setError(err.message || 'Erreur lors de la récupération des métadonnées');
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [metadataURI, metadataLoading, metadataError]);

  return { metadata, loading, error };
};

export default useCampaignMetadata;
