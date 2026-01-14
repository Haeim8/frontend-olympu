import { useState, useEffect } from 'react';

/**
 * Hook pour charger les documents d'une campagne depuis Supabase
 * @param {string} campaignAddress - Adresse de la campagne
 * @returns {object} - { documents, loading, error, refresh }
 */
export function useCampaignDocuments(campaignAddress) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDocuments = async () => {
    if (!campaignAddress) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/documents?address=${campaignAddress.toLowerCase()}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Documents from Supabase - url column contains the Supabase storage URL
      const formattedDocs = (data.documents || []).map(doc => ({
        id: doc.id,
        name: doc.name,
        url: doc.url,
        category: doc.category,
        isPublic: doc.is_public,
        createdAt: doc.created_at,
        type: detectFileType(doc.name, doc.url)
      }));

      setDocuments(formattedDocs);
    } catch (err) {
      console.error('[useCampaignDocuments] Error:', err);
      setError(err.message);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [campaignAddress]);

  return {
    documents,
    loading,
    error,
    refresh: loadDocuments
  };
}

/**
 * Détecter le type de fichier depuis le nom ou l'URL
 */
function detectFileType(name, url) {
  const fileName = (name || url || '').toLowerCase();

  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(fileName)) {
    return 'image';
  }
  if (/\.(mp4|webm|mov|avi|mkv)$/i.test(fileName)) {
    return 'video';
  }
  if (/\.pdf$/i.test(fileName)) {
    return 'pdf';
  }
  if (/\.(doc|docx|txt|md)$/i.test(fileName)) {
    return 'document';
  }

  return 'unknown';
}

/**
 * Grouper les documents par catégorie
 */
export function groupDocumentsByCategory(documents) {
  return documents.reduce((acc, doc) => {
    const category = doc.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(doc);
    return acc;
  }, {});
}

export default useCampaignDocuments;
