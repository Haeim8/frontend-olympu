// frontend/components/Pages/ProjectDetails.jsx

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Calendar, Share2, Star } from 'lucide-react';
import { ethers } from 'ethers';
import { useContract, useContractWrite, useAddress } from '@thirdweb-dev/react';
import CampaignABI from '@/ABI/CampaignABI.json';

const DEFAULT_PROJECT = {
  name: "Nom du projet",
  raised: "0",
  goal: "0",
  sharePrice: "0",
  endDate: "Non spécifié",
  description: "",
};

export default function ProjectDetails({ selectedProject, onClose }) {
  const project = { ...DEFAULT_PROJECT, ...selectedProject };
  const [showProjectDetails, setShowProjectDetails] = useState(true);
  const [nftCount, setNftCount] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const userAddress = useAddress();

  const { contract: campaignContract } = useContract(project.id, CampaignABI);
  const { mutateAsync: buyShares, isLoading: buying } = useContractWrite(campaignContract, "buyShares");

  useEffect(() => {
    setShowProjectDetails(!!selectedProject);
  }, [selectedProject]);

  useEffect(() => {
    if (!project?.id) return;

    const loadEvents = async () => {
      try {
        setIsLoading(true);
        const provider = new ethers.providers.JsonRpcProvider(
          {
            url: `https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
            chainId: 84532,
            name: 'Base Sepolia',
            network: {
              chainId: 84532,
              name: 'Base Sepolia'
            }
          }
        );

        await provider.ready;
        await provider._networkPromise;

        const contract = new ethers.Contract(project.id, CampaignABI, provider);

        const purchaseFilter = contract.filters.SharesPurchased();
        const refundFilter = contract.filters.SharesRefunded();
        
        const [purchaseEvents, refundEvents] = await Promise.all([
          contract.queryFilter(purchaseFilter),
          contract.queryFilter(refundFilter)
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

        setTransactions(allTxs);
        setError(null);
        
      } catch (err) {
        console.error("Erreur de connexion au provider:", err);
        setError("Erreur de connexion au réseau Base Sepolia");
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
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
  
    const getButtonMessage = () => {
      if (isCampaignEnded) return "Campagne terminée";
      if (isOutOfShares) return "Plus de shares disponibles";
      if (buying) return "Achat en cours...";
      return `Acheter ${nftCount} Share${nftCount > 1 ? 's' : ''}`;
    };
  
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Carte du NFT à gauche */}
        <Card className="bg-gradient-to-br from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-800 border border-lime-400 dark:border-lime-400 shadow-lg rounded-xl overflow-hidden">
          <CardContent className="p-6">
            <div className="aspect-square w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center mb-4">
              {/* Template du NFT */}
              <div className="w-full h-full p-4">
                <div className="w-full h-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center space-y-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{project.name}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{`Total Shares: ${project.numberOfShares || '1,000,000'}`}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{`Deployer: ${project.id?.slice(0, 6)}...${project.id?.slice(-4)}`}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
    
        {/* Carte du sélecteur à droite */}
        <Card className="bg-gradient-to-br from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-800 border border-lime-400 dark:border-lime-400 shadow-lg rounded-xl overflow-hidden">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Sélectionner le nombre de Shares
            </h3>
            <div className="flex items-center justify-center mb-4 space-x-4">
              <Button
                onClick={() => setNftCount(Math.max(1, nftCount - 1))}
                className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-900 hover:bg-gray-300 dark:hover:bg-neutral-800"
                disabled={isDisabled}
              >
                -
              </Button>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{nftCount}</span>
              <Button
                onClick={() => setNftCount(nftCount + 1)}
                className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-900 hover:bg-gray-300 dark:hover:bg-neutral-800"
                disabled={isDisabled}
              >
                +
              </Button>
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
              className={`w-full ${
                isDisabled 
                  ? 'bg-red-500 hover:bg-red-600 cursor-not-allowed opacity-50' 
                  : 'bg-lime-500 hover:bg-lime-600'
              } text-white`}
              disabled={isDisabled}
            >
              {getButtonMessage()}
            </Button>
            {isDisabled && (
              <p className="text-sm text-red-500 mt-2 text-center">
                {isCampaignEnded ? "Cette campagne est terminée" : "Tous les shares ont été vendus"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
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