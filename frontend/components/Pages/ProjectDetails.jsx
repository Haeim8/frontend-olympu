"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiManager } from '@/lib/services/api-manager';

// Import des composants modulaires
import ProjectHeader from '@/components/project/ProjectHeader';
import ShareSelector from '@/components/project/ShareSelector';
import ProjectOverview from '@/components/project/ProjectOverview';
import ProjectDetailsTab from '@/components/project/ProjectDetailsTab';
import ProjectTransactions from '@/components/project/ProjectTransactions';

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
  const [isFavorite, setIsFavorite] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projectData, setProjectData] = useState({
    ipfs: null
  });

  // Récupérer l'adresse du wallet (remplace useAddress de ThirdWeb)
  const [userAddress, setUserAddress] = useState(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            setUserAddress(accounts[0]);
          }
        })
        .catch(console.error);
    }
  }, []);

  useEffect(() => {
    setShowProjectDetails(!!selectedProject);
  }, [selectedProject]);

  // Fonction pour charger les données avec cache intelligent
  const loadProjectData = useCallback(async () => {
    if (!project?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Utiliser seulement les données blockchain - pas de système centralisé
      const projectDetails = await apiManager.getCampaignData(project.id);

      if (projectDetails) {
        setProjectData(projectDetails);
      }

      // TODO: Récupérer les transactions depuis la blockchain directement
      // Pour l'instant on laisse vide en attendant l'implémentation on-chain
      setTransactions([]);

    } catch (error) {
      console.error('Erreur lors du chargement des données du projet:', error);
      setError(error.message || 'Impossible de charger les données du projet');
    } finally {
      setIsLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    if (project?.id) {
      loadProjectData();
    }
  }, [project?.id, loadProjectData]);

  const handleBuyShares = useCallback(async (nftCount) => {
    if (!userAddress) {
      setError("Veuillez vous connecter à votre portefeuille.");
      return;
    }

    try {
      // Achat direct sans fetchWithRetry - tout sur blockchain
      const totalValue = apiManager.parseEthValue(
        (nftCount * parseFloat(project.sharePrice)).toString()
      );

      const receipt = await buyShares({
        args: [nftCount],
        overrides: { value: totalValue }
      });

      if (receipt?.transactionHash) {
        console.log("Transaction confirmée:", receipt.transactionHash);
        
        // Invalider le cache pour recharger les données mises à jour
        apiManager.invalidateCache(`campaign_${project.id}`);
        apiManager.invalidateCache(`transactions_${project.id}`);
        
        // Recharger les données
        loadProjectData();
        
        setError(null);
      }
    } catch (err) {
      console.error("Erreur lors de l'achat:", err);
      setError(err.message || 'Erreur lors de la transaction');
    }
  }, [userAddress, project.sharePrice, project.id, loadProjectData]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: project.name,
        text: `Découvrez le projet ${project.name} sur Livar`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Vous pouvez ajouter une notification toast ici
    }
  }, [project.name]);

  const handleFavorite = useCallback(() => {
    setIsFavorite(!isFavorite);
    // Vous pouvez ajouter la logique de sauvegarde des favoris ici
  }, [isFavorite]);

  const handleRefresh = useCallback(() => {
    // Vider le cache et recharger
    apiManager.invalidateCache(`campaign_${project.id}`);
    apiManager.invalidateCache(`transactions_${project.id}`);
    loadProjectData();
  }, [project.id, loadProjectData]);


  if (error) {
    return (
      <Dialog open={showProjectDetails} onOpenChange={() => { setShowProjectDetails(false); onClose(); }}>
        <DialogContent className="bg-white dark:bg-neutral-950 text-gray-900 dark:text-gray-100 max-w-2xl">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Erreur de chargement</h3>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-lime-500 hover:bg-lime-600 text-white rounded-lg transition-colors"
              >
                Réessayer
              </button>
              <button
                onClick={() => { setShowProjectDetails(false); onClose(); }}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={showProjectDetails} onOpenChange={() => { setShowProjectDetails(false); onClose(); }}>
      <DialogContent className="bg-white dark:bg-neutral-950 text-gray-900 dark:text-gray-100 max-w-6xl max-h-[95vh] overflow-hidden p-0">
        <div className="flex flex-col h-full max-h-[95vh]">
          {/* Header */}
          <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-neutral-800">
            <ProjectHeader
              project={project}
              isFavorite={isFavorite}
              onFavorite={handleFavorite}
              onShare={handleShare}
            />
          </div>

          {/* Content scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Share Selector */}
            <ShareSelector
              project={project}
              onBuyShares={handleBuyShares}
              isLoading={isLoading}
            />

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full mt-8">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-neutral-800">
                <TabsTrigger value="overview" className="data-[state=active]:bg-lime-500 data-[state=active]:text-white">
                  Vue d'ensemble
                </TabsTrigger>
                <TabsTrigger value="details" className="data-[state=active]:bg-lime-500 data-[state=active]:text-white">
                  Détails
                </TabsTrigger>
                <TabsTrigger value="transactions" className="data-[state=active]:bg-lime-500 data-[state=active]:text-white">
                  Transactions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <ProjectOverview project={project} />
              </TabsContent>

              <TabsContent value="details" className="mt-6">
                <ProjectDetailsTab projectData={projectData} />
              </TabsContent>

              <TabsContent value="transactions" className="mt-6">
                <ProjectTransactions 
                  transactions={transactions} 
                  isLoading={isLoading} 
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}