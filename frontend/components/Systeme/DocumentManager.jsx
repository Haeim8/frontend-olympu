import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Loader, Trash } from 'lucide-react';
import { pinataService } from '@/lib/services/storage';
import { useReadContract, useWriteContract } from 'wagmi';
import CampaignABI from '@/ABI/CampaignABI.json';

const PINATA_GATEWAY = "https://jade-hilarious-gecko-392.mypinata.cloud/ipfs";

export default function DocumentManager({ campaignData, onUpdate }) {
  const [documents, setDocuments] = useState({
    whitepaper: [],
    pitchDeck: [], 
    legal: [],
    media: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Lire les métadonnées du contrat avec Wagmi
  const { data: metadata } = useReadContract({
    address: campaignData?.address,
    abi: CampaignABI,
    functionName: 'metadata',
    enabled: !!campaignData?.address
  });

  useEffect(() => {
    if (campaignData?.ipfsHash && metadata) {
      loadDocuments();
    }
  }, [campaignData, metadata]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!metadata) {
        throw new Error("Métadonnées non disponibles");
      }

      console.log("Métadonnées brutes:", metadata);

      // Extraire le CID
      const [, cid] = metadata.match(/ipfs:\/\/(.*?)\//);
      if (!cid) throw new Error("CID IPFS invalide");

      // Construire l'URL de base
      const baseUrl = `${PINATA_GATEWAY}/${cid}`;
      console.log("URL de base:", baseUrl);

      // Récupérer les informations de la campagne
      const response = await fetch(`${baseUrl}/campaign-info.json`);
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      
      const campaignInfo = await response.json();

      // Mettre à jour l'état des documents
      if (campaignInfo.documents) {
        setDocuments({
          whitepaper: campaignInfo.documents.whitepaper ? [{
            name: campaignInfo.documents.whitepaper.split('/').pop(),
            url: `${baseUrl}/whitepaper/${campaignInfo.documents.whitepaper.split('/').pop()}`
          }] : [],
          pitchDeck: campaignInfo.documents.pitchDeck ? [{
            name: campaignInfo.documents.pitchDeck.split('/').pop(),
            url: `${baseUrl}/pitch-deck/${campaignInfo.documents.pitchDeck.split('/').pop()}`
          }] : [],
          // Ici on change legal pour legalDocuments
          legal: Array.isArray(campaignInfo.documents.legalDocuments) 
            ? campaignInfo.documents.legalDocuments.map(doc => ({
                name: doc.split('/').pop(),
                url: `${baseUrl}/legal/${doc.split('/').pop()}`
              }))
            : [],
          media: Array.isArray(campaignInfo.documents.media)
            ? campaignInfo.documents.media.map(media => ({
                name: media.split('/').pop(),
                url: `${baseUrl}/media/${media.split('/').pop()}`
              }))
            : []
        });
      }

    } catch (error) {
      console.error("Erreur lors de l'initialisation:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (file, section) => {
    try {
      setIsLoading(true);
      setError(null);
  
      const result = await pinataService.updateDirectoryWithFile(
        campaignData.ipfsHash, 
        file,
        section
      );
  
      if (result.success) {
        setDocuments(prev => ({
          ...prev,
          [section]: [...prev[section], {
            name: file.name,
            url: `${PINATA_GATEWAY}/${result.ipfsHash}/${section === 'pitchDeck' ? 'pitch-deck' : section}/${file.name}`,
            hash: result.ipfsHash
          }]
        }));
      }
  
    } catch (err) {
      console.error("Erreur upload:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (section, fileName) => {
    try {
      // 1. Télécharger le dossier actuel
      const currentFiles = await pinataService.downloadDirectory(campaignData.ipfsHash);
  
      // 2. Filtrer le fichier à supprimer
      const updatedFiles = currentFiles.filter(
        file => file.path !== `${section}/${fileName}`
      );
  
      // 3. Mettre à jour IPFS
      await pinataService.updateDirectory(campaignData.ipfsHash, updatedFiles);
  
      // 4. Mettre à jour l'UI
      const updatedDocs = {
        ...documents,
        [section]: documents[section].filter(doc => doc.name !== fileName)
      };
  
      setDocuments(updatedDocs);
      if (onUpdate) {
        onUpdate(updatedDocs);
      }
  
    } catch (err) {
      console.error("Erreur suppression:", err);
      setError("Erreur lors de la suppression");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {['whitepaper', 'pitchDeck', 'legal', 'media'].map((section) => (
          <Card key={section}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span className="capitalize">{section}</span>
                <Input
                  type="file"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], section)}
                  className="w-60"
                  accept={section === 'media' ? 'image/*,video/*' : '.pdf,.doc,.docx'}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!documents[section] || documents[section].length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Aucun document</p>
                ) : (
                  documents[section].map((doc, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>{doc.name}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.url)}
                        >
                          Voir
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(section, doc.name)}
                          className="text-red-500"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}