"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Calendar, Share2, Star, FileText, Globe, Twitter, Github, MessageSquare, Send, BookOpen } from 'lucide-react';
import { ethers } from 'ethers';
import { useContract, useContractWrite, useAddress } from '@thirdweb-dev/react';
import CampaignABI from '@/ABI/CampaignABI.json';
import { fetchDocumentsFromFirebase } from '@/lib/firebase/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/firebase';

const DEFAULT_PROJECT = {
  name: "Nom du projet",
  raised: "0",
  goal: "0",
  sharePrice: "0",
  endDate: "Non spécifié",
  description: "",
};

const PINATA_GATEWAY = "https://jade-hilarious-gecko-392.mypinata.cloud/ipfs";

const DocumentLink = ({ title, url }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg">
    <div className="flex items-center">
      <FileText className="h-5 w-5 text-lime-500 mr-3" />
      <span className="text-gray-900 dark:text-gray-100">{title}</span>
    </div>
    <Button variant="outline" size="sm" onClick={() => window.open(url)}>
      Voir
    </Button>
  </div>
);

export default function ProjectDetails({ selectedProject, onClose }) {
  const project = { ...DEFAULT_PROJECT, ...selectedProject };
  const [showProjectDetails, setShowProjectDetails] = useState(true);
  const [nftCount, setNftCount] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projectData, setProjectData] = useState({
    ipfs: null
  });

  const userAddress = useAddress();

  const { contract: campaignContract } = useContract(project.id, CampaignABI);
  const { mutateAsync: buyShares, isLoading: buying } = useContractWrite(campaignContract, "buyShares");

  useEffect(() => {
    setShowProjectDetails(!!selectedProject);
  }, [selectedProject]);

  useEffect(() => {
    if (!project?.id) return;
  
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        const provider = new ethers.providers.JsonRpcProvider(
          `https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
        );
    
        const contract = new ethers.Contract(project.id, CampaignABI, provider);
    
        // 1. Récupérer les métadonnées IPFS
        const metadataURI = await contract.metadata();
        const cid = metadataURI.replace('ipfs://', '').split('/')[0];
        const basePath = `${PINATA_GATEWAY}/${cid}/metadata.json`;
        
        console.log("1. Chemin IPFS:", basePath);
        
        const response = await fetch(basePath);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const metadata = await response.json();
        console.log("2. Métadonnées IPFS:", metadata);
    
        // 2. Extraire le nom du dossier de campagne pour Firebase
        const campaignFolderName = metadata.external_url.split('/').pop();
        console.log("3. Nom du dossier:", campaignFolderName);
    
        // 3. Récupérer les fichiers
        console.log("4. Début récupération fichiers Firebase");
        const [rootFiles, whitepaperFiles, pitchDeckFiles, legalFiles, mediaFiles] = await Promise.all([
          fetchDocumentsFromFirebase(campaignFolderName),
          fetchDocumentsFromFirebase(`${campaignFolderName}/whitepaper`),
          fetchDocumentsFromFirebase(`${campaignFolderName}/pitch-deck`),
          fetchDocumentsFromFirebase(`${campaignFolderName}/legal`),
          fetchDocumentsFromFirebase(`${campaignFolderName}/media`)
        ]);
    
        console.log("5. Fichiers racine:", rootFiles);
    
        // 4. Récupérer description.txt et socials.json avec leur contenu
        const descriptionFile = rootFiles.find(f => f.name === 'description.txt');
        const socialsFile = rootFiles.find(f => f.name === 'socials.json');
    
        console.log("10. Fichier description trouvé:", descriptionFile);
        console.log("11. Fichier socials trouvé:", socialsFile);
    
        // 5. Utiliser directement content au lieu de fetch
        // 5. Utiliser directement content au lieu de fetch
let description = '';
let socials = {};  // Initialize empty socials object

if (descriptionFile?.content) {
  description = descriptionFile.content;
  console.log("12. Description depuis Firebase:", description);
} else if (metadata.description) {
  description = metadata.description;
  console.log("13. Description depuis IPFS:", description);
}

if (socialsFile) {
  try {
    // On utilise le fait que le fichier est déjà récupéré par fetchDocumentsFromFirebase
    const rawSocials = {
      website: 'livar',
      twitter: 'twitter', 
      github: 'livar',
      discord: 'discord',
      telegram: 'livar',
      medium: 'medium'
    };

    socials = {
      website: rawSocials.website ? (rawSocials.website.startsWith('http') ? rawSocials.website : `https://${rawSocials.website}`) : null,
      twitter: rawSocials.twitter ? `https://twitter.com/${rawSocials.twitter.replace('@', '')}` : null,
      github: rawSocials.github ? `https://github.com/${rawSocials.github}` : null,
      discord: rawSocials.discord ? (rawSocials.discord.startsWith('http') ? rawSocials.discord : `https://discord.gg/${rawSocials.discord}`) : null,
      telegram: rawSocials.telegram ? `https://t.me/${rawSocials.telegram}` : null,
      medium: rawSocials.medium ? `https://medium.com/${rawSocials.medium.replace('@', '')}` : null
    };

    // Filtrer les valeurs null
    socials = Object.fromEntries(
      Object.entries(socials)
        .filter(([_, value]) => value !== null)
    );

    console.log("Socials après formatage:", socials);
  } catch (err) {
    console.error("Erreur récupération socials:", err);
    socials = {};
  }
}
    
        // 6. Construction du projectMetadata
        const projectMetadata = {
          ...metadata,
          description: description,
          firebase: {
            documents: {
              whitepaper: whitepaperFiles.length > 0 ? whitepaperFiles[0].url : null,
              pitchDeck: pitchDeckFiles.length > 0 ? pitchDeckFiles[0].url : null,
              legalDocuments: legalFiles.map(doc => doc.url),
              media: mediaFiles.map(doc => doc.url)
            },
            socials: socials
          }
        };
    
        console.log("16. ProjectMetadata final:", projectMetadata);
        setProjectData(projectMetadata);
    
        // 7. Transactions blockchain
        const [purchaseEvents, refundEvents] = await Promise.all([
          contract.queryFilter(contract.filters.SharesPurchased()),
          contract.queryFilter(contract.filters.SharesRefunded())
        ]);
    
        const allTxs = [
          ...purchaseEvents.map(event => ({
            id: event.blockNumber,
            type: 'Achat',
            investor: event.args.investor,
            nftCount: event.args.numShares.toString(),
            value: ethers.utils.formatEther(event.args.value || "0")
          })),
          ...refundEvents.map(event => ({
            id: event.blockNumber,
            type: 'Remboursement',
            investor: event.args.investor,
            nftCount: event.args.numShares.toString(),
            value: ethers.utils.formatEther(event.args.refundAmount || "0")
          }))
        ].sort((a,b) => b.id - a.id);
    
        console.log("17. Transactions:", allTxs);
        setTransactions(allTxs);
        setError(null);
    
      } catch (err) {
        console.error("18. Erreur globale:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [project?.id]);

  const handleBuyShares = async () => {
    if (!userAddress) {
      alert("Veuillez vous connecter à votre portefeuille.");
      return;
    }

    try {
      const totalValue = ethers.utils.parseEther(
        (nftCount * parseFloat(project.sharePrice)).toString()
      );

      const receipt = await buyShares({
        args: [nftCount],
        overrides: { value: totalValue }
      });
      console.log("Transaction confirmée:", receipt.transactionHash);
      alert("Shares achetés avec succès!");
    } catch (err) {
      console.error("Erreur lors de l'achat:", err);
      setError(err.message);
      alert(err.message);
    }
  };

  const handleShare = () => console.log("Partage du projet");
  const handleFavorite = () => setIsFavorite(!isFavorite);

  const ShareSelector = () => {
    if (!project) return null;

    const isCampaignEnded = new Date(project.endDate) < new Date();
    const isOutOfShares = project.raised >= project.goal;
    const isDisabled = isCampaignEnded || isOutOfShares || buying || isLoading;

    return (
      <Card className="mt-6 bg-gradient-to-br from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-800 border border-lime-400 dark:border-lime-400 shadow-lg rounded-xl overflow-hidden">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Sélectionner le nombre de Shares
          </h3>
          <div className="flex items-center justify-between mb-4">
            <label htmlFor="shareCount" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombre de Shares
            </label>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setNftCount(Math.max(1, nftCount - 1))}
                className="w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-900"
              >
                -
              </Button>
              <input
                id="shareCount"
                type="number"
                value={nftCount}
                onChange={(e) => setNftCount(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="w-16 text-center bg-white dark:bg-neutral-900 border border-lime-400"
              />
              <Button
                onClick={() => setNftCount(nftCount + 1)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-neutral-950"
              >
                +
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Prix unitaire</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{project.sharePrice} ETH</span>
          </div>
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Prix total</span>
            <span className="text-lg font-bold text-lime-600 dark:text-lime-400">
              {(nftCount * parseFloat(project.sharePrice)).toFixed(2)} ETH
            </span>
          </div>
          <Button
            onClick={handleBuyShares}
            className="w-full bg-lime-500 hover:bg-lime-600 text-white"
            disabled={isDisabled}
          >
            {buying ? "Achat en cours..." : 
             isCampaignEnded ? "Campagne terminée" :
             isOutOfShares ? "Plus de shares disponibles" :
             `Acheter ${nftCount} Share${nftCount > 1 ? 's' : ''}`}
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <Dialog open={showProjectDetails} onOpenChange={() => { setShowProjectDetails(false); onClose(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erreur</DialogTitle>
            <DialogDescription>
              Une erreur s'est produite lors du chargement des détails.
            </DialogDescription>
          </DialogHeader>
          <p className="text-red-500">{error}</p>
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoading) {
    return (
      <Dialog open={showProjectDetails} onOpenChange={() => { setShowProjectDetails(false); onClose(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chargement</DialogTitle>
            <DialogDescription>
              Chargement des détails de la campagne en cours...
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={showProjectDetails} onOpenChange={() => { setShowProjectDetails(false); onClose(); }}>
      <DialogContent className="bg-white dark:bg-neutral-950 text-gray-900 dark:text-gray-100 max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-gray-900 dark:text-white">
              {project.name}
            </DialogTitle>
            <DialogDescription>
              Consultez les détails et achetez des shares pour investir.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleFavorite}>
              <Star className={`h-5 w-5 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : ''}`} />
            </Button>
          </div>
        </div>

        <ShareSelector />

        <div className="flex items-center justify-center space-x-6 mt-8 mb-4">
        {projectData?.firebase?.socials && (
          <>
            {projectData.firebase.socials.website && (
              <Button variant="ghost" size="icon" asChild>
                <a href={projectData.firebase.socials.website} target="_blank" rel="noopener noreferrer" className="text-lime-500 hover:text-lime-600">
                  <Globe className="h-6 w-6" />
                </a>
              </Button>
            )}
            {projectData.firebase.socials.twitter && (
              <Button variant="ghost" size="icon" asChild>
                <a href={projectData.firebase.socials.twitter} target="_blank" rel="noopener noreferrer" className="text-lime-500 hover:text-lime-600">
                  <Twitter className="h-6 w-6" />
                </a>
              </Button>
            )}
            {projectData.firebase.socials.github && (
              <Button variant="ghost" size="icon" asChild>
                <a href={projectData.firebase.socials.github} target="_blank" rel="noopener noreferrer" className="text-lime-500 hover:text-lime-600">
                  <Github className="h-6 w-6" />
                </a>
              </Button>
            )}
            {projectData.firebase.socials.discord && (
              <Button variant="ghost" size="icon" asChild>
                <a href={projectData.firebase.socials.discord} target="_blank" rel="noopener noreferrer" className="text-lime-500 hover:text-lime-600">
                  <MessageSquare className="h-6 w-6" />
                </a>
              </Button>
            )}
            {projectData.firebase.socials.telegram && (
              <Button variant="ghost" size="icon" asChild>
                <a href={projectData.firebase.socials.telegram} target="_blank" rel="noopener noreferrer" className="text-lime-500 hover:text-lime-600">
                  <Send className="h-6 w-6" />
                </a>
              </Button>
            )}
            {projectData.firebase.socials.medium && (
              <Button variant="ghost" size="icon" asChild>
                <a href={projectData.firebase.socials.medium} target="_blank" rel="noopener noreferrer" className="text-lime-500 hover:text-lime-600">
                  <BookOpen className="h-6 w-6" />
                </a>
              </Button>
            )}
          </>
        )}
      </div>

        <Tabs defaultValue="overview" className="w-full mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="details">Détails</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <DollarSign className="w-8 h-8 mx-auto text-lime-500" />
                    <h3 className="mt-2 text-lg font-semibold">Levée en cours</h3>
                    <p className="text-2xl font-bold text-lime-600">{project.raised} ETH</p>
                    <p className="text-sm text-gray-500">sur {project.goal} ETH</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <DollarSign className="w-8 h-8 mx-auto text-lime-500" />
                    <h3 className="mt-2 text-lg font-semibold">Prix unitaire</h3>
                    <p className="text-2xl font-bold text-lime-600">{project.sharePrice} ETH</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Calendar className="w-8 h-8 mx-auto text-lime-500" />
                    <h3 className="mt-2 text-lg font-semibold">Date de fin</h3>
                    <p className="text-2xl font-bold text-lime-600">{project.endDate}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-gray-50 dark:bg-neutral-900 p-6 rounded-lg">
              <div className="flex mb-2 items-center justify-between">
                <span className="text-xs font-semibold">Progression</span>
                <span className="text-xs font-semibold">
                  {((parseFloat(project.raised) / parseFloat(project.goal)) * 100).toFixed(2)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-neutral-800 rounded-full">
              <div
                  style={{ width: `${(parseFloat(project.raised) / parseFloat(project.goal)) * 100}%` }}
                  className="h-full bg-lime-500 rounded-full"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-6 space-y-6">
  <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg">
    {/* Description du projet */}
    <div className="mb-8">
      <h3 className="text-2xl font-semibold mb-4">Description</h3>
      <p className="text-gray-600 dark:text-gray-300">
      {projectData.description}
      </p>
    </div>

    {/* Documents */}
    <div className="mb-8">
      <h3 className="text-2xl font-semibold mb-4">Documents</h3>
      <div className="space-y-4">
        {projectData.firebase?.documents?.whitepaper && (
          <DocumentLink
            title="Whitepaper"
            url={projectData.firebase.documents.whitepaper}
          />
        )}
        {projectData.firebase?.documents?.pitchDeck && (
          <DocumentLink
            title="Pitch Deck"
            url={projectData.firebase.documents.pitchDeck}
          />
        )}
        {projectData.firebase?.documents?.legalDocuments && (
          Array.isArray(projectData.firebase.documents.legalDocuments) 
            ? projectData.firebase.documents.legalDocuments.map((doc, index) => (
                <DocumentLink
                  key={index}
                  title={`Document légal ${index + 1}`}
                  url={doc}
                />
              ))
            : <DocumentLink
                title="Document légal"
                url={projectData.firebase.documents.legalDocuments}
              />
        )}
        {(!projectData.firebase?.documents || Object.keys(projectData.firebase?.documents).length === 0) && (
          <p className="text-gray-500 text-center">Aucun document disponible</p>
        )}
      </div>
    </div>
    <div className="mb-8">
      <h3 className="text-2xl font-semibold mb-4">Médias</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {projectData.firebase?.documents?.media && 
          projectData.firebase.documents.media.map((media, index) => (
            <div key={index} className="relative group">
              <img 
                src={media}
                alt={`Media ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => window.open(media, '_blank')}
                >
                  Voir
                </Button>
              </div>
            </div>
          ))
        }
        {(!projectData.firebase?.documents?.media || projectData.firebase.documents.media.length === 0) && (
          <p className="text-gray-500 text-center col-span-full">Aucun média disponible</p>
        )}
      </div>
    </div>
    
    {/* Autres données de Firebase */}
    {projectData.firebase?.investmentReturns && (
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-4">Retours sur investissement</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(projectData.firebase.investmentReturns)
            .filter(([key, value]) => value.enabled)
            .map(([key, value]) => (
              <div key={key} className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg">
                <h4 className="font-semibold text-lg mb-2">{key.charAt(0).toUpperCase() + key.slice(1)}</h4>
                {value.details && (
                  <div className="space-y-1 text-sm">
                    {Object.entries(value.details).map(([detailKey, detailValue]) => (
                      <p key={detailKey} className="text-gray-600 dark:text-gray-400">
                        {detailKey}: {detailValue}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    )}
  </div>
</TabsContent>

          <TabsContent value="transactions" className="mt-6 space-y-6">
            <div className="w-full overflow-x-auto relative max-w-full">
              <div className="min-w-max">
                <table className="w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Investor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shares</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                          Aucune transaction disponible
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{tx.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                            {tx.investor.slice(0, 6)}...{tx.investor.slice(-4)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{tx.nftCount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{tx.value} ETH</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}