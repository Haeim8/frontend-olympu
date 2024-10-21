// frontend/app/ProjectDetails.jsx

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Calendar, FileText, Twitter, Facebook, Share2, Star } from 'lucide-react';
import { ethers } from 'ethers';

import { useContract, useContractRead, useContractWrite, useAddress } from '@thirdweb-dev/react';
import CampaignABI from '@/ABI/CampaignABI.json'; // Import de l'ABI de la Campaign

import useCampaignAddress from '@/lib/hooks/useCampaignAddress'; // Hook personnalisé

export default function ProjectDetails({ selectedProject, onClose }) {
  const [showProjectDetails, setShowProjectDetails] = useState(true);
  const [nftCount, setNftCount] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [investmentTerms, setInvestmentTerms] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companyShares, setCompanyShares] = useState(null);

  const userAddress = useAddress(); // Obtenir l'adresse connectée
  const { campaignData, loading: addressLoading, error: addressError } = useCampaignAddress(selectedProject?.id);

  useEffect(() => {
    setShowProjectDetails(!!selectedProject);
  }, [selectedProject]);

  // Log pour vérifier le contenu de selectedProject
  useEffect(() => {
    console.log("Selected Project:", selectedProject);
  }, [selectedProject]);

  // Log pour vérifier les données récupérées
  useEffect(() => {
    console.log("Données de la campagne récupérées :", campaignData);
    if (campaignData && !ethers.utils.isAddress(campaignData.creatorAddress)) {
      setError("Adresse du créateur de la campagne invalide.");
      setIsLoading(false);
    }
  }, [campaignData]);

  // Utiliser useContract pour obtenir l'instance du contrat Campaign
  const { contract: campaignContract, isLoading: contractLoading, error: contractError } = useContract(selectedProject?.id, CampaignABI);

  // Utiliser useContractWrite pour l'achat de shares (équivalent de mint)
  const { mutateAsync: buyShares, isLoading: buying, error: buyError } = useContractWrite(campaignContract, "buyShares");

  // Utiliser useContractRead pour lire les données depuis le contrat Campaign
  const { data: remunerationType, isLoading: rmTypeLoading, error: rmTypeError } = useContractRead(
    campaignContract,
    "remunerationType",
    []
  );

  const { data: tokenDistribution, isLoading: tokenDistLoading, error: tokenDistError } = useContractRead(
    campaignContract,
    "tokenDistribution",
    []
  );

  const { data: roi, isLoading: roiLoading, error: roiError } = useContractRead(
    campaignContract,
    "roi",
    []
  );

  const { data: txs, isLoading: txsLoading, error: txsError } = useContractRead(
    campaignContract,
    "getAllTransactions",
    []
  );

  // Récupérer les parts de la société depuis la Campaign
  const { data: sharesMinted, isLoading: sharesMintedLoading, error: sharesMintedError } = useContractRead(
    campaignContract,
    "sharesMinted",
    []
  );

  // Récupérer les informations de la société via la Campaign
  const { data: vertePortalLink, isLoading: portalLoading, error: portalError } = useContractRead(
    campaignContract,
    "vertePortalLink",
    []
  );

  // Lecture de totalSupply depuis le contrat Campaign
  const { data: totalSupply, isLoading: totalSupplyLoading, error: totalSupplyError } = useContractRead(
    campaignContract,
    "totalSupply",
    []
  );

  // Ajouter des logs pour vérifier le contrat et ses fonctions
  useEffect(() => {
    if (campaignContract) {
      console.log("Contrat Campaign :", campaignContract);
      // Inspection des propriétés disponibles
      for (const key in campaignContract) {
        console.log(`Propriété : ${key}`);
      }
      // Exemple : Vérifier si buyShares existe
      if (campaignContract.buyShares) {
        console.log("La fonction buyShares est disponible.");
      } else {
        console.log("La fonction buyShares n'est pas disponible.");
      }
    } else {
      console.log("Le contrat Campaign n'est pas chargé.");
    }
  }, [campaignContract]);

  // Ajouter des logs pour vérifier les états de chargement
  useEffect(() => {
    console.log("buying :", buying);
    console.log("contractLoading :", contractLoading);
    console.log("addressLoading :", addressLoading);
    console.log("totalSupplyLoading :", totalSupplyLoading);
    if (totalSupplyError) {
      console.error("Erreur lors de la lecture de totalSupply :", totalSupplyError);
    }
  }, [buying, contractLoading, addressLoading, totalSupplyLoading, totalSupplyError]);

  // Vérifier si l'utilisateur connecté est le créateur de la campagne
  useEffect(() => {
    if (campaignData && userAddress && selectedProject) {
      console.log("Adresse du créateur :", campaignData.creatorAddress);
      console.log("Adresse connectée :", userAddress);

      if (campaignData.creatorAddress && userAddress.toLowerCase() === campaignData.creatorAddress.toLowerCase()) {
        setError("Vous ne pouvez pas acheter vos propres shares.");
      } else {
        setError(null);
      }
    }
  }, [campaignData, userAddress, selectedProject]);

  // Récupérer les données du contrat
  useEffect(() => {
    const fetchContractData = async () => {
      if (addressLoading || addressError || contractLoading || contractError) {
        if (addressError) setError(addressError.message || "Erreur lors de la récupération de l'adresse.");
        if (contractError) setError(contractError.message || "Erreur lors de la récupération du contrat.");
        setIsLoading(false);
        return;
      }

      if (!selectedProject || !campaignData) {
        setIsLoading(false);
        return;
      }

      try {
        // Lire les termes d'investissement
        if (remunerationType && tokenDistribution && roi) {
          setInvestmentTerms({
            remunerationType,
            tokenDistribution,
            roi: roi.toString(),
          });
        }

        // Lire les transactions
        if (txs) {
          const formattedTxs = txs.map(tx => ({
            id: tx.id.toNumber(),
            nftCount: tx.nftCount.toNumber(),
            value: ethers.utils.formatEther(tx.value),
            totalOwned: tx.totalOwned.toNumber(),
          }));
          setTransactions(formattedTxs);
        }

        // Définir les parts de la société depuis selectedProject (supposé déjà fourni)
        setCompanyShares({
          percentageMinted: sharesMinted ? sharesMinted.toNumber() : 0,
          vertePortalLink: vertePortalLink || '',
        });

        // Lire totalSupply pour vérifier la supply des NFTs
        if (totalSupply) {
          console.log(`Total Supply: ${totalSupply.toString()}`);
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Erreur lors de la récupération des données du contrat :", err);
        setError(err.message || "Erreur lors de la récupération des données.");
        setIsLoading(false);
      }
    };

    fetchContractData();
  }, [
    selectedProject,
    campaignData,
    campaignContract,
    remunerationType,
    tokenDistribution,
    roi,
    txs,
    sharesMinted,
    vertePortalLink,
    totalSupply,
    addressLoading,
    addressError,
    contractLoading,
    contractError,
    totalSupplyLoading,
    totalSupplyError
  ]);

  // Fonction pour gérer l'achat de shares (équivalent de mint)
  const handleBuyShares = async () => {
    if (!userAddress) {
      alert("Veuillez vous connecter à votre portefeuille.");
      return;
    }

    if (!selectedProject) {
      alert("Aucun projet sélectionné.");
      return;
    }

    try {
      console.log(`Tentative d'achat de ${nftCount} shares pour un total de ${(nftCount * parseFloat(selectedProject.sharePrice)).toFixed(2)} ETH`);

      // Calculer la valeur totale en wei
      const totalValue = ethers.utils.parseEther((nftCount * parseFloat(selectedProject.sharePrice)).toString());
      console.log("Valeur totale calculée :", totalValue.toString());

      // Appeler la fonction buyShares du contrat Campaign avec les bons paramètres
      const receipt = await buyShares({
        args: [nftCount],
        overrides: {
          value: totalValue
        }
      });
      console.log("Transaction confirmée :", receipt.transactionHash);
      alert("Shares achetés avec succès !");
    } catch (err) {
      console.error("Erreur lors de l'achat des shares :", err);
      setError(err.message || "Erreur lors de l'achat des shares.");
      alert(`Erreur lors de l'achat des shares : ${err.message || err}`);
    }
  };

  const handleShare = () => {
    console.log("Partage du projet");
    // Implémenter la logique de partage, par exemple en utilisant l'API de partage Web ou en partageant via les réseaux sociaux
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    console.log(isFavorite ? "Retiré des favoris" : "Ajouté aux favoris");
    // Implémenter la logique de favori, par exemple en sauvegardant dans une base de données ou le stockage local
  };

  // Composant pour sélectionner le nombre de Shares (équivalent de NFTs)
  const ShareSelector = () => {
    if (!selectedProject || !campaignData || !campaignData.creatorAddress) {
      return <p className="text-gray-600 dark:text-gray-300">Chargement des données...</p>; // Ou un indicateur de chargement
    }

    const isCreator = userAddress && campaignData.creatorAddress.toLowerCase() === userAddress.toLowerCase();

    return (
      <Card className="mt-6 bg-gradient-to-br from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-800 border border-lime-400 dark:border-lime-400 shadow-lg rounded-xl overflow-hidden">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Sélectionner le nombre de Shares</h3>
          <div className="flex items-center justify-between mb-4">
            <label htmlFor="shareCount" className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de Shares</label>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setNftCount(Math.max(1, nftCount - 1))}
                className="w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-900 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-neutral-900 transition-colors duration-200"
              >
                -
              </Button>
              <input
                id="shareCount"
                type="number"
                value={nftCount}
                onChange={(e) => setNftCount(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="w-16 text-center bg-white dark:bg-neutral-900 border border-lime-400 dark:border-lime-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              />
              <Button
                onClick={() => setNftCount(nftCount + 1)}
                className="w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-900 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                +
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Prix unitaire</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{selectedProject.sharePrice} ETH</span>
          </div>
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Prix total</span>
            <span className="text-lg font-bold text-lime-600 dark:text-lime-400">{(nftCount * parseFloat(selectedProject.sharePrice)).toFixed(2)} ETH</span>
          </div>
          <Button
            onClick={handleBuyShares}
            className="w-full bg-lime-500 hover:bg-lime-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-opacity-50"
            disabled={buying || contractLoading || addressLoading || error !== null || isCreator}
          >
            {isCreator ? "Vous ne pouvez pas acheter vos propres shares" : (buying ? "Achat en cours..." : `Acheter : ${nftCount} Share${nftCount > 1 ? 's' : ''}`)}
          </Button>
          {buyError && (
            <p className="text-red-500 mt-2">Erreur lors de l'achat des shares : {buyError.message}</p>
          )}
          {isCreator && (
            <p className="text-red-500 mt-2">Vous ne pouvez pas acheter vos propres shares.</p>
          )}
        </CardContent>
      </Card>
    );
  };

  // Affichage des messages d'erreur critiques
  if (error) {
    return (
      <Dialog open={showProjectDetails} onOpenChange={() => { setShowProjectDetails(false); onClose(); }}>
        <DialogContent className="bg-white dark:bg-neutral-950 text-gray-900 dark:text-gray-100 max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-lg shadow-xl">
          <p className="text-red-500">{error}</p>
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoading) {
    return (
      <Dialog open={showProjectDetails} onOpenChange={() => { setShowProjectDetails(false); onClose(); }}>
        <DialogContent className="bg-white dark:bg-neutral-950 text-gray-900 dark:text-gray-100 max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-lg shadow-xl">
          <p>Chargement des détails du projet...</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={showProjectDetails} onOpenChange={() => { setShowProjectDetails(false); onClose(); }}>
      <DialogContent className="bg-white dark:bg-neutral-950 text-gray-900 dark:text-gray-100 max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-gray-900 dark:text-white">{selectedProject.name}</DialogTitle>
            <DialogDescription>
              Consultez les détails de votre campagne et achetez des shares pour investir.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handleShare} className="hover:bg-gray-100 dark:hover:bg-neutral-950 transition-colors duration-200">
              <Share2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleFavorite} className="hover:bg-gray-100 dark:hover:bg-neutral-950 transition-colors duration-200">
              <Star className={`h-5 w-5 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600 dark:text-gray-400'}`} />
            </Button>
          </div>
        </div>
        <ShareSelector />
        <Tabs defaultValue="overview" className="w-full mt-8">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-neutral-900 rounded-lg p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white rounded-md transition-all duration-200">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="details" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white rounded-md transition-all duration-200">Détails et Documents</TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white rounded-md transition-all duration-200">Transactions</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Contenu de l'onglet Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white dark:bg-neutral-900 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <DollarSign className="w-8 h-8 mx-auto text-lime-500" />
                    <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">Levée en cours</h3>
                    <p className="text-2xl font-bold text-lime-600 dark:text-lime-400">{selectedProject.raised.toLocaleString()} ETH</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">sur {selectedProject.goal.toLocaleString()} ETH</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-neutral-900 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <DollarSign className="w-8 h-8 mx-auto text-lime-500" />
                    <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-white">Prix unitaire Share</h3>
                    <p className="text-2xl font-bold text-lime-600 dark:text-lime-400">{selectedProject.sharePrice} ETH</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-neutral-900 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Calendar className="w-8 h-8 mx-auto text-lime-500" />
                    <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">Date de fin</h3>
                    <p className="text-2xl font-bold text-lime-600 dark:text-lime-400">{selectedProject.endDate}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="bg-gray-50 dark:bg-neutral-900 p-6 rounded-lg shadow-inner">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-lime-600 bg-lime-200 dark:bg-lime-900 dark:text-lime-300">
                    Progression
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-lime-600 dark:text-lime-400">
                    {((parseFloat(selectedProject.raised) / parseFloat(selectedProject.goal)) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-lime-200 dark:bg-lime-900">
                <div
                  style={{ width: `${(parseFloat(selectedProject.raised) / parseFloat(selectedProject.goal)) * 100}%` }}
                  className={`h-2.5 rounded-full bg-lime-500 dark:bg-lime-400 transition-all duration-500 ease-in-out`}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-white">Documents légaux</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  {selectedProject.documents.map((doc, index) => (
                    <li key={index}>{doc.name}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Équipe</h3>
                {selectedProject.teamMembers.map((member, index) => (
                  <div key={index} className="mb-4 text-sm">
                    <p className="font-semibold text-gray-900 dark:text-white">{member.name} - <span className="font-normal text-gray-600 dark:text-gray-400">{member.role}</span></p>
                    <div className="flex space-x-2 mt-2">
                      <a href={`https://twitter.com/${member.twitter}`} target="_blank" rel="noopener noreferrer" className="text-lime-500 hover:text-lime-600 transition-colors duration-200">
                        <Twitter className="w-5 h-5" />
                      </a>
                      <a href={`https://facebook.com/${member.facebook}`} target="_blank" rel="noopener noreferrer" className="text-lime-500 hover:text-lime-600 transition-colors duration-200">
                        <Facebook className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {selectedProject.hasLawyer && (
              <Card className="bg-white dark:bg-neutral-900 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Avocat associé</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Nom :</strong> {selectedProject.lawyer.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Contact :</strong> {selectedProject.lawyer.contact}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300"><strong>Téléphone :</strong> {selectedProject.lawyer.phone}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="details" className="mt-6 space-y-6">
            {/* Contenu de l'onglet Details */}
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Résumé du projet</h3>
              <p className="text-gray-600 dark:text-gray-300">{selectedProject.description}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Conditions de rémunération des investisseurs</h3>
              {isLoading ? (
                <p>Chargement des conditions de rémunération...</p>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : investmentTerms ? (
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li><strong>Type de rémunération :</strong> {investmentTerms.remunerationType}</li>
                  <li><strong>Distribution de tokens :</strong> {investmentTerms.tokenDistribution}</li>
                  <li><strong>Temps de retour sur investissement estimé :</strong> {investmentTerms.roi} jours</li>
                </ul>
              ) : (
                <p>Aucune condition de rémunération disponible.</p>
              )}
            </div>
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Informations sur les parts de la société</h3>
              {companyShares ? (
                <>
                  <p className="text-gray-600 dark:text-gray-300"><strong>Pourcentage de la société minté :</strong> {companyShares.percentageMinted}%</p>
                  <p className="text-gray-600 dark:text-gray-300"><strong>Lien vers le portail Verte :</strong> <a href={companyShares.vertePortalLink} target="_blank" rel="noopener noreferrer" className="text-lime-500 hover:text-lime-600 hover:underline transition-colors duration-200">{companyShares.vertePortalLink}</a></p>
                </>
              ) : (
                <p className="text-gray-600 dark:text-gray-300">Aucune information sur les parts de la société disponible.</p>
              )}
            </div>
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Documents légaux de la société</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedProject.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-950 rounded-lg">
                    <span className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <FileText className="w-5 h-5 mr-2 text-lime-500" />
                      {doc.name}
                    </span>
                    <Button variant="outline" size="sm" asChild className="hover:bg-lime-50 dark:hover:bg-lime-900 transition-colors duration-200">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">Télécharger</a>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Médias</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedProject.media.map((media, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{media.name}</h4>
                    <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
                      <iframe
                        src={media.url}
                        title={media.name}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute top-0 left-0 w-full h-full rounded-lg shadow-md"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="transactions" className="mt-6 space-y-6">
            {/* Contenu de l'onglet Transactions */}
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Historique des transactions</h3>
              {isLoading ? (
                <p>Chargement des transactions...</p>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : transactions && transactions.length > 0 ? (
                <>
                  <p className="text-gray-600 dark:text-gray-300 mb-4"><strong>Nombre d'investisseurs uniques :</strong> {transactions.length}</p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-900">
                      <thead className="bg-gray-50 dark:bg-neutral-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre de Shares</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valeur</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Shares en possession</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 dark:bg-neutral-950 dark:divide-lime-400">
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-lime-700 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{transaction.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{transaction.nftCount}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{transaction.value} ETH</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{transaction.totalOwned}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-gray-600 dark:text-gray-300">Aucune transaction disponible pour le moment.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
