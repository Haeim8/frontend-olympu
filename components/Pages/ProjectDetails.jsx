// frontend/components/Pages/ProjectDetails.jsx

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Calendar, FileText, Twitter, Facebook, Share2, Star } from 'lucide-react';
import { ethers } from 'ethers';
import { useContract, useContractRead, useContractWrite, useAddress } from '@thirdweb-dev/react';
import CampaignABI from '@/ABI/CampaignABI.json';

const DEFAULT_PROJECT = {
  name: "Nom du projet",
  raised: "0",
  goal: "0",
  sharePrice: "0",
  endDate: "Non spécifié",
  documents: [],
  media: [],
  teamMembers: [],
  lawyer: {
    name: "",
    contact: "",
    phone: ""
  },
  description: "",
  hasLawyer: false
};

export default function ProjectDetails({ selectedProject, onClose }) {
  const project = { ...DEFAULT_PROJECT, ...selectedProject };
  const [showProjectDetails, setShowProjectDetails] = useState(true);
  const [nftCount, setNftCount] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [investmentTerms, setInvestmentTerms] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companyShares, setCompanyShares] = useState(null);

  const userAddress = useAddress();

  useEffect(() => {
    setShowProjectDetails(!!selectedProject);
  }, [selectedProject]);

  // Utiliser useContract pour obtenir l'instance du contrat Campaign
  const { contract: campaignContract, isLoading: contractLoading } = useContract(
    project.id, 
    CampaignABI
  );

  // Utiliser useContractWrite pour l'achat de shares
  const { mutateAsync: buyShares, isLoading: buying } = useContractWrite(
    campaignContract,
    "buyShares"
  );
  // Utiliser useContractRead pour lire les données
  const { data: remunerationType } = useContractRead(
    campaignContract,
    "remunerationType",
    []
  );

  const { data: tokenDistribution } = useContractRead(
    campaignContract,
    "tokenDistribution",
    []
  );

  const { data: roi } = useContractRead(
    campaignContract,
    "roi",
    []
  );

  const { data: txs } = useContractRead(
    campaignContract,
    "getAllTransactions",
    []
  );

  const { data: sharesMinted } = useContractRead(
    campaignContract,
    "sharesMinted",
    []
  );

  const { data: vertePortalLink } = useContractRead(
    campaignContract,
    "vertePortalLink",
    []
  );

  const { data: totalSupply } = useContractRead(
    campaignContract,
    "totalSupply",
    []
  );

  // Effet pour récupérer les données du contrat
  useEffect(() => {
    const fetchContractData = async () => {
      if (!selectedProject) {
        setIsLoading(false);
        return;
      }

      try {
        if (remunerationType && tokenDistribution && roi) {
          setInvestmentTerms({
            remunerationType,
            tokenDistribution,
            roi: roi.toString(),
          });
        }

        if (txs) {
          const formattedTxs = txs.map(tx => ({
            id: tx.id.toNumber(),
            nftCount: tx.nftCount.toNumber(),
            value: ethers.utils.formatEther(tx.value),
            totalOwned: tx.totalOwned.toNumber(),
          }));
          setTransactions(formattedTxs);
        }

        setCompanyShares({
          percentageMinted: sharesMinted ? sharesMinted.toNumber() : 0,
          vertePortalLink: vertePortalLink || '',
        });

        setIsLoading(false);
      } catch (err) {
        console.error("Erreur lors de la récupération des données:", err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchContractData();
  }, [selectedProject, remunerationType, tokenDistribution, roi, txs, sharesMinted, vertePortalLink]);

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
        overrides: {
          value: totalValue
        }
      });
      console.log("Transaction confirmée:", receipt.transactionHash);
      alert("Shares achetés avec succès!");
    } catch (err) {
      console.error("Erreur lors de l'achat:", err);
      setError(err.message);
      alert(err.message);
    }
  };

  const handleShare = () => {
    console.log("Partage du projet");
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const ShareSelector = () => {
    if (!project) return null;

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
                className="w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-900"
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
            disabled={buying || isLoading}
          >
            {buying ? "Achat en cours..." : `Acheter ${nftCount} Share${nftCount > 1 ? 's' : ''}`}
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <Dialog open={showProjectDetails} onOpenChange={() => { setShowProjectDetails(false); onClose(); }}>
        <DialogContent>
          <p className="text-red-500">{error}</p>
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoading) {
    return (
      <Dialog open={showProjectDetails} onOpenChange={() => { setShowProjectDetails(false); onClose(); }}>
        <DialogContent>
          <p>Chargement des détails...</p>
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
              <h3 className="text-2xl font-semibold mb-4">Description</h3>
              <p className="text-gray-600 dark:text-gray-300">{project.description}</p>
            </div>

            {investmentTerms && (
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg">
                <h3 className="text-2xl font-semibold mb-4">Termes d'investissement</h3>
                <ul className="space-y-2">
                  <li>Type: {investmentTerms.remunerationType}</li>
                  <li>Distribution: {investmentTerms.tokenDistribution}</li>
                  <li>ROI estimé: {investmentTerms.roi} jours</li>
                </ul>
              </div>
            )}
          </TabsContent>

          <TabsContent value="transactions" className="mt-6 space-y-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shares
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valeur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{tx.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{tx.nftCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{tx.value} ETH</td>
                      <td className="px-6 py-4 whitespace-nowrap">{tx.totalOwned}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}