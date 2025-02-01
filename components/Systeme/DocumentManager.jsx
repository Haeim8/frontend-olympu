import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Loader, Trash } from 'lucide-react';
import { fetchDocumentsFromFirebase, uploadToFirebaseFolder, deleteFileFromFirebase } from '@/lib/firebase/firebase';


export default function DocumentManager({ campaignData, onUpdate }) {
  const [documents, setDocuments] = useState({
    whitepaper: [],
    pitchDeck: [], 
    legal: [],
    media: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);


  useEffect(() => {
    if (campaignData?.folderName) {
      loadDocuments();
    }
  }, [campaignData]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      
      // Charger les documents avec les mêmes chemins que ProjectDetails
      const [whitepaperFiles, pitchDeckFiles, legalFiles, mediaFiles] = await Promise.all([
        fetchDocumentsFromFirebase(`${campaignData.folderName}/whitepaper`),
        fetchDocumentsFromFirebase(`${campaignData.folderName}/pitch-deck`),
        fetchDocumentsFromFirebase(`${campaignData.folderName}/legal`),
        fetchDocumentsFromFirebase(`${campaignData.folderName}/media`)
      ]);

      setDocuments({
        whitepaper: whitepaperFiles,
        pitchDeck: pitchDeckFiles,
        legal: legalFiles,
        media: mediaFiles
      });

    } catch (error) {
      console.error("Erreur:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (file, section) => {
    try {
      setIsLoading(true);

      const folderPath = section === 'pitchDeck' ? 'pitch-deck' : section;
      const url = await uploadToFirebaseFolder(
        `${campaignData.folderName}/${folderPath}`, 
        file
      );

      setDocuments(prev => ({
        ...prev,
        [section]: [...prev[section], { name: file.name, url }]
      }));

    } catch (err) {
      console.error("Erreur upload:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (section, fileName) => {
    try {
      setIsLoading(true);
      
      const folderPath = section === 'pitchDeck' ? 'pitch-deck' : section;
      await deleteFileFromFirebase(
        `${campaignData.folderName}/${folderPath}`, 
        fileName
      );

      setDocuments(prev => ({
        ...prev,
        [section]: prev[section].filter(doc => doc.name !== fileName)
      }));

    } catch (err) {
      console.error("Erreur suppression:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
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