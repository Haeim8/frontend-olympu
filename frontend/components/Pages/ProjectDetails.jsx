"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiManager } from '@/lib/services/api-manager';
import { useTranslation } from '@/hooks/useLanguage';

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
  const { t } = useTranslation();
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
      // 1. CHECK CACHE ET AFFICHER IMMÉDIATEMENT
      const cacheKey = `campaign_${project.id}`;
      const txCacheKey = `campaign_transactions_${project.id}`;

      const cachedCampaign = apiManager.cache.get(cacheKey);
      const cachedTx = apiManager.cache.get(txCacheKey);

      if (cachedCampaign) {
        console.log('✅ Cache hit - affichage immédiat');
        setProjectData(cachedCampaign);
        setIsLoading(false);

        if (cachedTx?.transactions) {
          setTransactions(cachedTx.transactions);
        }
      } else {
        setIsLoading(true);
      }

      setError(null);

      // 2. REFRESH EN BACKGROUND (ne bloque pas UI)
      const [projectDetails, txData] = await Promise.all([
        apiManager.getCampaignData(project.id, false),
        fetch(`/api/campaigns/${project.id}/transactions`).then(r => r.json())
      ]);

      if (projectDetails) {
        console.log('🔍 ProjectDetails - projectDetails received from apiManager:', {
          address: projectDetails.address,
          name: projectDetails.name,
          metadata_uri: projectDetails.metadata_uri,
          metadataUri: projectDetails.metadataUri,
          hasMetadataUri: !!(projectDetails.metadata_uri || projectDetails.metadataUri),
          allKeys: Object.keys(projectDetails)
        });

        // 🚀 AFFICHER IMMÉDIATEMENT LES DONNÉES DE BASE (sans attendre IPFS)
        const baseData = {
          ...projectDetails,
          ipfs: null, // Sera chargé après
          documents: [],
        };
        setProjectData(baseData);

        // 3️⃣ CHARGER IPFS EN ARRIÈRE-PLAN (NON-BLOQUANT)
        const { getCampaignMetadata } = await import('@/lib/services/ipfs-fetcher.js');
        console.log('🔍 ProjectDetails - Loading IPFS in background...');

        getCampaignMetadata(projectDetails)
          .then(metadata => {
            console.log('🔍 ProjectDetails - IPFS metadata loaded:', metadata);

            const combinedData = {
              ...projectDetails,
              ...metadata.ipfs,
              ipfs: metadata.ipfs,
              documents: metadata.documents,
            };

            console.log('🔍 Combined project data:', combinedData);

            // Mise à jour silencieuse avec données IPFS
            setProjectData(combinedData);
            apiManager.cache.set(cacheKey, combinedData);
          })
          .catch(err => {
            console.warn('⚠️ IPFS loading failed, using base data:', err);
            // Pas grave, on garde les données de base
          });
      }

      // Charger les transactions depuis Supabase
      if (txData?.transactions) {
        setTransactions(txData.transactions);
        apiManager.cache.set(txCacheKey, txData);
        console.log('🔍 Transactions:', txData.transactions);
      }

    } catch (error) {
      console.error('Erreur lors du chargement des données du projet:', error);
      if (!cachedCampaign) {
        setError(error.message || 'Impossible de charger les données du projet');
      }
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
      setError(t('projectDetails.connectWallet'));
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
        console.log('Transaction confirmée', receipt.transactionHash);

        // Invalider le cache pour recharger les données mises à jour
        apiManager.invalidateCache(`campaign_${project.id}`);
        apiManager.invalidateCache(`transactions_${project.id}`);

        // 🚀 SYNC EN ARRIÈRE-PLAN (NON-BLOQUANT)
        // Ne pas attendre la sync pour ne pas bloquer l'UI
        fetch('/api/campaigns/sync-single', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address: project.id }),
        })
          .then(() => {
            console.log('✅ Sync terminée en arrière-plan');
            // Recharger silencieusement après sync
            loadProjectData();
          })
          .catch(syncError => {
            console.warn('⚠️ sync-single après achat échoué:', syncError);
            // Pas grave, recharger quand même
            loadProjectData();
          });

        // Recharger les données IMMÉDIATEMENT (sans attendre la sync)
        loadProjectData();

        setError(null);
      }
    } catch (err) {
      console.error('Erreur lors de l\'achat', err);
      setError(err.message || 'Erreur lors de la transaction');
    }
  }, [userAddress, project.sharePrice, project.id, loadProjectData, t]);

  const handleShare = useCallback(() => {
    // Copier directement le lien dans le presse-papier
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        // Optionnel : afficher une notification de succès
        console.log('Lien copié !');
      })
      .catch(err => {
        console.error('Erreur lors de la copie:', err);
      });
  }, []);

  const handleFavorite = useCallback(() => {
    setIsFavorite(!isFavorite);
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
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('projectDetails.error.title')}</h3>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-lime-500 hover:bg-lime-600 text-white rounded-lg transition-colors"
              >
                {t('projectDetails.error.retry')}
              </button>
              <button
                onClick={() => { setShowProjectDetails(false); onClose(); }}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
              >
                {t('projectDetails.error.close')}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={showProjectDetails} onOpenChange={() => { setShowProjectDetails(false); onClose(); }}>
      <DialogContent className="bg-white dark:bg-neutral-950 text-gray-900 dark:text-gray-100 max-w-6xl w-[95vw] max-h-[95vh] p-0 overflow-hidden border border-gray-200 dark:border-neutral-800">

        {/* Header moderne et compact */}
        <div className="border-b border-gray-200 dark:border-neutral-800 px-6 py-4 bg-gradient-to-r from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-950">
          <ProjectHeader
            project={project}
            projectData={projectData}
            isFavorite={isFavorite}
            onFavorite={handleFavorite}
            onShare={handleShare}
          />
        </div>

        {/* Tabs horizontaux modernes */}
        <Tabs defaultValue="overview" className="flex flex-col h-[calc(95vh-120px)]">
          <TabsList className="w-full bg-gray-100 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 rounded-none px-6 py-2 flex justify-center gap-2">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-lime-500 data-[state=active]:text-white px-6 py-2 rounded-lg transition-all"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="hidden sm:inline">{t('projectDetails.tabs.overview')}</span>
              </div>
            </TabsTrigger>

            <TabsTrigger
              value="details"
              className="data-[state=active]:bg-lime-500 data-[state=active]:text-white px-6 py-2 rounded-lg transition-all"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">{t('projectDetails.tabs.details')}</span>
              </div>
            </TabsTrigger>

            <TabsTrigger
              value="transactions"
              className="data-[state=active]:bg-lime-500 data-[state=active]:text-white px-6 py-2 rounded-lg transition-all"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span className="hidden sm:inline">{t('projectDetails.tabs.transactions')}</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="overview" className="m-0 p-6 space-y-6">
              <ShareSelector
                project={project}
                onBuyShares={handleBuyShares}
                isLoading={isLoading}
              />
              <ProjectOverview project={project} projectData={projectData} />
            </TabsContent>

            <TabsContent value="details" className="m-0 p-6">
              <ProjectDetailsTab projectData={projectData} />
            </TabsContent>

            <TabsContent value="transactions" className="m-0 p-6">
              <ProjectTransactions
                transactions={transactions}
                isLoading={isLoading}
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
