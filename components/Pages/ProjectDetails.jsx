import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Calendar, Share2, Star, Shield } from 'lucide-react';
import { useContract, useContractRead, useContractWrite, useAddress } from '@thirdweb-dev/react';
import { ethers } from 'ethers';

export default function ProjectDetails({ selectedProject, onClose }) {
  const [showProjectDetails, setShowProjectDetails] = useState(true);
  const [nftCount, setNftCount] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const userAddress = useAddress();

  // Initialisation du contrat Campaign
  const { contract: campaignContract } = useContract(selectedProject?.id);

  // Lecture des données du contrat
  const { data: currentRoundData } = useContractRead(
    campaignContract,
    "getCurrentRound"
  );

  const { data: campaignNameData } = useContractRead(
    campaignContract,
    "campaignName"
  );

  const { data: isCertified } = useContractRead(
    campaignContract,
    "certified"
  );

  const { data: lawyerAddress } = useContractRead(
    campaignContract,
    "lawyer"
  );

  const { data: metadataURI } = useContractRead(
    campaignContract,
    "metadata"
  );

  // Fonction d'achat de shares
  const { mutateAsync: buyShares } = useContractWrite(
    campaignContract,
    "buyShares"
  );

  const handleBuyShares = async () => {
    if (!userAddress || !currentRoundData) return;

    try {
      setIsLoading(true);
      const sharePrice = currentRoundData.sharePrice;
      const totalPrice = sharePrice.mul(ethers.BigNumber.from(nftCount));

      const tx = await buyShares({
        args: [nftCount],
        overrides: {
          value: totalPrice
        }
      });

      await tx.wait();
      
    } catch (err) {
      console.error("Erreur lors de l'achat:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentRoundData && campaignNameData) {
      setIsLoading(false);
    }
  }, [currentRoundData, campaignNameData]);

  if (isLoading) {
    return (
      <Dialog open={showProjectDetails} onOpenChange={() => { setShowProjectDetails(false); onClose(); }}>
        <DialogContent>
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={showProjectDetails} onOpenChange={() => { setShowProjectDetails(false); onClose(); }}>
      <DialogContent className="bg-white dark:bg-neutral-950 text-gray-900 dark:text-gray-100 max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-lg shadow-xl">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-3xl font-bold">
                {campaignNameData || "Chargement..."}
              </DialogTitle>
            </div>
            <div className="flex space-x-2">
              {isCertified && (
                <Shield className="h-5 w-5 text-blue-500" title="Projet Certifié" />
              )}
              <Button variant="outline" size="icon" onClick={() => setIsFavorite(!isFavorite)}>
                <Star className={`h-5 w-5 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : ''}`} />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <DollarSign className="h-8 w-8 text-lime-500 mb-2" />
              <h3 className="font-semibold">Objectif</h3>
              <p className="text-2xl font-bold">
                {currentRoundData?.targetAmount ? ethers.utils.formatEther(currentRoundData.targetAmount) : "0"} ETH
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <DollarSign className="h-8 w-8 text-lime-500 mb-2" />
              <h3 className="font-semibold">Prix par Share</h3>
              <p className="text-2xl font-bold">
                {currentRoundData?.sharePrice ? ethers.utils.formatEther(currentRoundData.sharePrice) : "0"} ETH
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold">Statut</h3>
              <div className="flex items-center space-x-2 mt-2">
                <div className={`w-3 h-3 rounded-full ${currentRoundData?.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{currentRoundData?.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {currentRoundData?.isActive && !currentRoundData?.isFinalized && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Acheter des shares</h3>
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="outline"
                    onClick={() => setNftCount(Math.max(1, nftCount - 1))}
                  >
                    -
                  </Button>
                  <span className="text-xl font-bold">{nftCount}</span>
                  <Button 
                    variant="outline"
                    onClick={() => setNftCount(nftCount + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Prix total: {currentRoundData?.sharePrice ? 
                    ethers.utils.formatEther(currentRoundData.sharePrice.mul(ethers.BigNumber.from(nftCount))) : "0"} ETH
                </p>
              </div>

              <Button 
                className="w-full bg-lime-500 hover:bg-lime-600"
                onClick={handleBuyShares}
                disabled={!userAddress || isLoading}
              >
                {isLoading ? "Transaction en cours..." : `Acheter ${nftCount} shares`}
              </Button>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 rounded-lg">
            <p className="text-red-600 dark:text-red-200">{error}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
