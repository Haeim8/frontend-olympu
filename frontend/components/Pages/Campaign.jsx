"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAddress } from '@thirdweb-dev/react';
import { apiManager } from '@/lib/services/api-manager';

// Import des composants modulaires
import CampaignHeader from '@/components/campaign/CampaignHeader';
import DividendDistribution from '@/components/campaign/finance/DividendDistribution';
import CampaignActions from '@/components/campaign/finance/CampaignActions';
import TransactionHistory from '@/components/campaign/finance/TransactionHistory';
import CampaignInvestors from '@/components/campaign/CampaignInvestors';
import CampaignDocuments from '@/components/campaign/CampaignDocuments';
import CampaignSocial from '@/components/campaign/CampaignSocial';
import LiveScheduler from '@/components/campaign/LiveScheduler';

// Import des dialogs
import ReopenCampaignDialog from '@/components/campaign/dialogs/ReopenCampaignDialog';
import PromoteCampaignDialog from '@/components/campaign/dialogs/PromoteCampaignDialog';
import CertifyCampaignDialog from '@/components/campaign/dialogs/CertifyCampaignDialog';

export default function Campaign() {
  const address = useAddress();
  
  // États principaux
  const [campaignAddress, setCampaignAddress] = useState(null);
  const [campaignData, setCampaignData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États des dialogs
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [showCertifyDialog, setShowCertifyDialog] = useState(false);

  // Initialisation et récupération de l'adresse de campagne
  useEffect(() => {
    async function initializeCampaign() {
      if (!address) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Récupérer les campagnes de l'utilisateur via le cache intelligent
        const campaigns = await apiManager.getAllCampaigns();
        
        // Filtrer les campagnes créées par cet utilisateur
        const userCampaigns = [];
        for (const campaignAddr of campaigns) {
          const campaignInfo = await apiManager.getCampaignData(campaignAddr);
          if (campaignInfo && campaignInfo.creator.toLowerCase() === address.toLowerCase()) {
            userCampaigns.push(campaignAddr);
          }
        }
        
        if (userCampaigns.length > 0) {
          setCampaignAddress(userCampaigns[0]); // Première campagne trouvée
        } else {
          setError("Aucune campagne trouvée pour cette adresse");
        }
        
      } catch (err) {
        console.error('Erreur initialisation campagne:', err);
        setError('Impossible de charger les données de campagne');
      } finally {
        setIsLoading(false);
      }
    }

    initializeCampaign();
  }, [address]);

  // Chargement des données de campagne avec cache intelligent
  useEffect(() => {
    async function loadCampaignData() {
      if (!campaignAddress) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Utilisation du cache intelligent pour récupérer les données
        const data = await apiManager.getCampaignData(campaignAddress);
        
        if (data) {
          // Enrichir les données avec des calculs supplémentaires
          const enrichedData = {
            ...data,
            nftTotal: Math.floor(parseFloat(data.goal) / parseFloat(data.sharePrice)),
            timeRemaining: data.isActive ? 
              Math.max(0, new Date(data.endDate).getTime() - Date.now()) : 0
          };
          
          setCampaignData(enrichedData);
          
          // Précharger les données connexes en arrière-plan
          apiManager.preloadCampaignDetails(campaignAddress);
          
        } else {
          setError("Impossible de charger les données de campagne");
        }
        
      } catch (err) {
        console.error('Erreur chargement campagne:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    }

    loadCampaignData();
  }, [campaignAddress]);

  // Préchargement intelligent au survol
  const handlePreloadHover = useCallback((identifier) => {
    if (identifier && identifier !== campaignAddress) {
      apiManager.preloadCampaignDetails(identifier);
    }
  }, [campaignAddress]);

  // Gestionnaires d'événements pour les actions
  const handleDistributionComplete = useCallback(() => {
    // Invalider le cache et recharger les données
    apiManager.invalidateCampaignCache(campaignAddress);
    // Recharger les données en force (sans cache)
    apiManager.getCampaignData(campaignAddress, false).then(setCampaignData);
  }, [campaignAddress]);

  const handleActionComplete = useCallback((actionType) => {
    // Invalider le cache selon le type d'action
    switch (actionType) {
      case 'escrow_released':
      case 'campaign_reopened':
        apiManager.invalidateCampaignCache(campaignAddress);
        // Recharger toutes les données
        apiManager.getCampaignData(campaignAddress, false).then(setCampaignData);
        break;
      default:
        // Invalidation partielle pour d'autres actions
        apiManager.invalidateCampaignCache(campaignAddress);
    }
  }, [campaignAddress]);

  const handleDocumentUpdate = useCallback(() => {
    // Invalider seulement le cache des documents
    apiManager.cache.invalidate(`campaign_documents_${campaignAddress}`);
  }, [campaignAddress]);

  const handleSocialUpdate = useCallback((socialData) => {
    // Mettre à jour les données sociales localement
    console.log('Social links updated:', socialData);
  }, []);

  // Gestionnaires des dialogs
  const handleReopenSuccess = useCallback(() => {
    handleActionComplete('campaign_reopened');
  }, [handleActionComplete]);

  const handlePromoteSuccess = useCallback((promotionData) => {
    console.log('Campaign promoted:', promotionData);
  }, []);

  const handleCertifySuccess = useCallback((certificationData) => {
    console.log('Campaign certification requested:', certificationData);
    // Mettre à jour le statut de certification
    setCampaignData(prev => prev ? { ...prev, certificationPending: true } : null);
  }, []);

  // Gestionnaires pour les sessions live
  const handleScheduleLive = useCallback((sessionData) => {
    console.log('Live session scheduled:', sessionData);
    // Ici on appellerait le smart contract pour programmer la session
    // et envoyer les notifications aux holders NFT
  }, []);

  const handleStartLive = useCallback(() => {
    console.log('Starting live session');
    // Rediriger vers la page live
    if (typeof window !== 'undefined') {
      window.open(`/campaign/${campaignAddress}/live`, '_blank');
    }
  }, [campaignAddress]);

  // Rendu conditionnel pour les états d'erreur
  if (!address) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600 dark:text-gray-400">
          Veuillez connecter votre portefeuille pour accéder à la gestion de campagne.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      {/* Header de campagne */}
      <CampaignHeader 
        campaignData={campaignData}
        isLoading={isLoading}
        error={error}
      />

      {/* Interface principale avec onglets */}
      {!isLoading && !error && campaignData && (
        <Tabs defaultValue="finance" className="space-y-6">
          <TabsList className="bg-gray-100 dark:bg-neutral-900 p-1 rounded-lg">
            <TabsTrigger 
              value="finance" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 px-6 py-2"
            >
              Finance
            </TabsTrigger>
            <TabsTrigger 
              value="investors" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 px-6 py-2"
            >
              Investisseurs
            </TabsTrigger>
            <TabsTrigger 
              value="documents" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 px-6 py-2"
            >
              Documents
            </TabsTrigger>
            <TabsTrigger 
              value="social" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 px-6 py-2"
            >
              Social
            </TabsTrigger>
            <TabsTrigger 
              value="live" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 px-6 py-2"
            >
              Sessions Live
            </TabsTrigger>
          </TabsList>

          {/* Onglet Finance */}
          <TabsContent value="finance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DividendDistribution
                campaignData={campaignData}
                campaignAddress={campaignAddress}
                onDistributionComplete={handleDistributionComplete}
              />
              <CampaignActions
                campaignData={campaignData}
                campaignAddress={campaignAddress}
                onReopenClick={() => setShowReopenDialog(true)}
                onPromoteClick={() => setShowPromoteDialog(true)}
                onCertifyClick={() => setShowCertifyDialog(true)}
                onActionComplete={handleActionComplete}
              />
            </div>
            <TransactionHistory
              campaignAddress={campaignAddress}
              onPreloadHover={handlePreloadHover}
            />
          </TabsContent>

          {/* Onglet Investisseurs */}
          <TabsContent value="investors">
            <CampaignInvestors
              campaignAddress={campaignAddress}
              onPreloadHover={handlePreloadHover}
            />
          </TabsContent>

          {/* Onglet Documents */}
          <TabsContent value="documents">
            <CampaignDocuments
              campaignAddress={campaignAddress}
              campaignData={campaignData}
              onDocumentUpdate={handleDocumentUpdate}
            />
          </TabsContent>

          {/* Onglet Social */}
          <TabsContent value="social">
            <CampaignSocial
              campaignData={campaignData}
              campaignAddress={campaignAddress}
              onSocialUpdate={handleSocialUpdate}
            />
          </TabsContent>

          {/* Onglet Sessions Live */}
          <TabsContent value="live">
            <LiveScheduler
              campaignData={campaignData}
              onScheduleLive={handleScheduleLive}
              onStartLive={handleStartLive}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Dialogs modaux */}
      <ReopenCampaignDialog
        isOpen={showReopenDialog}
        onClose={() => setShowReopenDialog(false)}
        campaignData={campaignData}
        campaignAddress={campaignAddress}
        onSuccess={handleReopenSuccess}
      />

      <PromoteCampaignDialog
        isOpen={showPromoteDialog}
        onClose={() => setShowPromoteDialog(false)}
        campaignData={campaignData}
        campaignAddress={campaignAddress}
        onSuccess={handlePromoteSuccess}
      />

      <CertifyCampaignDialog
        isOpen={showCertifyDialog}
        onClose={() => setShowCertifyDialog(false)}
        campaignData={campaignData}
        campaignAddress={campaignAddress}
        onSuccess={handleCertifySuccess}
      />

      {/* Debug info en développement */}
      {process.env.NODE_ENV === 'development' && campaignData && (
        <div className="mt-8 p-4 bg-gray-100 dark:bg-neutral-900 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Debug Info (dev only)
          </h3>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <p>Campaign Address: {campaignAddress}</p>
            <p>Cache Stats: {JSON.stringify(apiManager.getCacheStats(), null, 2)}</p>
          </div>
        </div>
      )}
    </div>
  );
}