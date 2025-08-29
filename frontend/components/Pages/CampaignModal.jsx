"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import html2canvas from 'html2canvas';
import { pinataService } from '@/lib/services/storage';
import { apiManager } from '@/lib/services/api-manager';
import { useTranslation } from '@/hooks/useLanguage';

// Import des composants modulaires
import StepIndicator from '@/components/campaign-creation/CampaignFormSteps';
import CampaignBasicInfo from '@/components/campaign-creation/CampaignBasicInfo';
import CampaignDocuments from '@/components/campaign-creation/CampaignDocuments';
import CampaignTeamSocials from '@/components/campaign-creation/CampaignTeamSocials';
import CampaignNFTPreview from '@/components/campaign-creation/CampaignNFTPreview';
import CampaignReview from '@/components/campaign-creation/CampaignReview';

const INITIAL_FORM_DATA = {
  creatorAddress: '',
  name: '',
  symbol: '',
  sector: '',
  otherSector: '',
  description: '',
  sharePrice: '',
  numberOfShares: '',
  endDate: '',
  royaltyFee: '0',
  royaltyReceiver: '',
  documents: {
    whitepaper: [],
    pitchDeck: [],
    legalDocuments: [],
    media: []
  },
  teamMembers: [{ name: '', role: '', socials: { twitter: '', linkedin: '' } }],
  socials: {
    website: '',
    twitter: '',
    github: '',
    discord: '',
    telegram: '',
    medium: ''
  },
  nftCustomization: {
    backgroundColor: '#ffffff',
    textColor: '#000000',
    logo: null,
    texture: 'default',
  },
  acceptTerms: false
};

// Les contrats sont maintenant gérés par api-manager

export default function CampaignModal({ 
  showCreateCampaign, 
  setShowCreateCampaign, 
  onCampaignCreated 
}) {
  const { t } = useTranslation();
  
  // États
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [transactionHash, setTransactionHash] = useState('');
  const [cardImage, setCardImage] = useState(null);

  // Refs
  const cardRef = useRef(null);

  // Hooks blockchain
  const { address } = useAccount();
  const [writeLoading, setWriteLoading] = useState(false);

  // Initialisation de l'adresse
  useEffect(() => {
    console.log('CampaignModal - Address from useAddress:', address);
    if (address) {
      setFormData(prev => ({
        ...prev,
        creatorAddress: address,
        royaltyReceiver: address
      }));
    } else {
      // Fallback: essayer de récupérer l'adresse depuis localStorage ou window.ethereum
      const tryGetAddress = async () => {
        try {
          if (typeof window !== 'undefined' && window.ethereum) {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
              console.log('Fallback address found:', accounts[0]);
              setFormData(prev => ({
                ...prev,
                creatorAddress: accounts[0],
                royaltyReceiver: accounts[0]
              }));
            }
          }
        } catch (error) {
          console.error('Error getting fallback address:', error);
        }
      };
      tryGetAddress();
    }
  }, [address]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!showCreateCampaign) {
      setCurrentStep(1);
      // Reset mais garde l'adresse si elle existe
      setFormData({
        ...INITIAL_FORM_DATA,
        creatorAddress: address || '',
        royaltyReceiver: address || ''
      });
      setErrors({});
      setStatus('idle');
      setTransactionHash('');
      setCardImage(null);
    } else {
      // Quand le modal s'ouvre, s'assurer que l'adresse est définie
      if (address) {
        console.log('Modal opened - setting address:', address);
        setFormData(prev => ({
          ...prev,
          creatorAddress: address,
          royaltyReceiver: address
        }));
      }
    }
  }, [showCreateCampaign, address]);

  // Validation des étapes
  const validateStep = useCallback((step) => {
    const newErrors = {};
    
    switch(step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = t('campaign.validation.nameRequired');
        if (!formData.symbol.trim()) newErrors.symbol = t('campaign.validation.symbolRequired');
        if (!formData.sector) newErrors.sector = t('campaign.validation.sectorRequired');
        if (formData.sector === 'Autre' && !formData.otherSector.trim()) {
          newErrors.otherSector = t('campaign.validation.specifySector');
        }
        if (!formData.description.trim()) newErrors.description = t('campaign.validation.descriptionRequired');
        if (!formData.sharePrice || parseFloat(formData.sharePrice) <= 0) {
          newErrors.sharePrice = t('campaign.validation.sharePricePositive');
        }
        if (!formData.numberOfShares || parseInt(formData.numberOfShares) <= 0) {
          newErrors.numberOfShares = t('campaign.validation.sharesPositive');
        }
        if (!formData.endDate || new Date(formData.endDate).getTime() <= Date.now()) {
          newErrors.endDate = t('campaign.validation.futureDateRequired');
        }
        if (!formData.royaltyReceiver.trim()) {
          newErrors.royaltyReceiver = t('campaign.validation.receiverRequired');
        }
        break;
      
      case 2:
        if (!formData.documents.whitepaper?.length) {
          newErrors.whitepaper = t('campaign.validation.whitepaperRequired');
        }
        break;
      
      case 3:
        if (!formData.teamMembers.some(member => member.name.trim())) {
          newErrors.team = t('campaign.validation.teamMemberRequired');
        }
        break;
      
      case 4:
        // Pas de validation spécifique pour l'aperçu NFT
        break;
      
      case 5:
        if (!formData.acceptTerms) {
          newErrors.terms = t('campaign.validation.termsRequired');
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Gestionnaires d'événements
  const handleInputChange = useCallback((e, nestedField = null) => {
    const { name, value } = e.target;
    
    if (nestedField) {
      setFormData(prev => ({
        ...prev,
        [nestedField]: {
          ...prev[nestedField],
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleSelectChange = useCallback((value, field) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleFileChange = useCallback((e, field) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [field]: newFiles
        }
      }));
    }
  }, []);

  const handleRemoveFile = useCallback((index, field) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: prev.documents[field].filter((_, i) => i !== index)
      }
    }));
  }, []);

  const handleTeamMemberChange = useCallback((index, field, value, socialField = null) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member, i) => {
        if (i === index) {
          if (socialField) {
            return { ...member, socials: { ...member.socials, [socialField]: value } };
          }
          return { ...member, [field]: value };
        }
        return member;
      })
    }));
  }, []);

  const handleAddTeamMember = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, { name: '', role: '', socials: { twitter: '', linkedin: '' } }]
    }));
  }, []);

  const handleRemoveTeamMember = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index)
    }));
  }, []);

  const handleNFTCustomizationChange = useCallback((customization) => {
    setFormData(prev => ({
      ...prev,
      nftCustomization: customization
    }));
  }, []);

  const handleAcceptTerms = useCallback(() => {
    setFormData(prev => ({ ...prev, acceptTerms: !prev.acceptTerms }));
  }, []);

  // Navigation entre les étapes
  const handleNextStep = useCallback(async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    // Capturer l'image NFT à l'étape 4
    if (currentStep === 4) {
      try {
        const image = await html2canvas(cardRef.current);
        const blob = await new Promise(resolve => image.toBlob(resolve, 'image/png'));
        setCardImage(blob);
      } catch (error) {
        console.error("Erreur lors de la capture de la carte:", error);
        return;
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, 5));
  }, [currentStep, validateStep]);

  const handlePreviousStep = useCallback(() => {
    if (currentStep === 5) {
      setCardImage(null);
    }
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, [currentStep]);

  // Upload IPFS avec Web3.Storage
  const uploadToIPFS = useCallback(async (campaignData) => {
    try {
      const { create } = await import('@storacha/client');
      const client = await create();
      await client.login(process.env.NEXT_PUBLIC_W3UP_EMAIL);
      
      // Vérifier et définir l'espace de travail
      const spaces = Array.from(client.spaces());
      if (spaces.length === 0) {
        // Créer un nouvel espace si aucun n'existe
        await client.createSpace('livar-campaigns');
      } else {
        // Utiliser le premier espace disponible
        client.setCurrentSpace(spaces[0].did());
      }
      
      const files = [];
      const documentReferences = {};
      
      // D'abord traiter les documents pour créer les références
      Object.entries(campaignData.documents).forEach(([docType, docFiles]) => {
        if (docFiles && docFiles.length > 0) {
          documentReferences[docType] = [];
          docFiles.forEach(file => {
            const fileName = `${docType}_${file.name}`;
            documentReferences[docType].push({
              name: file.name,
              fileName: fileName,
              type: file.type,
              size: file.size
            });
            files.push(new File([file], fileName, { type: file.type }));
          });
        }
      });
      
      // Métadonnées campagne (JSON principal) avec références aux documents
      const campaignMetadata = {
        name: campaignData.name,
        description: campaignData.description,
        sector: campaignData.sector === 'Autre' ? campaignData.otherSector : campaignData.sector,
        sharePrice: campaignData.sharePrice,
        numberOfShares: campaignData.numberOfShares,
        endTime: Math.floor(new Date(campaignData.endDate).getTime() / 1000),
        teamMembers: campaignData.teamMembers,
        socials: campaignData.socials,
        royaltyFee: campaignData.royaltyFee,
        documents: documentReferences  // ✅ Ajout des références aux fichiers
      };
      
      files.push(new File([JSON.stringify(campaignMetadata, null, 2)], 'campaign-data.json', { type: 'application/json' }));
      
      // Métadonnées NFT
      const nftMetadata = {
        name: campaignData.name,
        description: campaignData.description || "",
        attributes: [
          { trait_type: "Sector", value: campaignData.sector === 'Autre' ? campaignData.otherSector : campaignData.sector },
          { trait_type: "Background Color", value: campaignData.nftCustomization.backgroundColor },
          { trait_type: "Text Color", value: campaignData.nftCustomization.textColor }
        ]
      };
      
      files.push(new File([JSON.stringify(nftMetadata, null, 2)], 'nft-metadata.json', { type: 'application/json' }));
      
      // Image NFT card
      if (cardImage) {
        files.push(new File([cardImage], 'nft-card.png', { type: 'image/png' }));
      }
      
      const cid = await client.uploadDirectory(files);
      
      return {
        success: true,
        ipfsHash: cid,
        campaignFolderName: `campaign_${campaignData.name.replace(/\s+/g, '_').toLowerCase()}`
      };
      
    } catch (error) {
      console.error('Erreur upload IPFS:', error);
      throw new Error(`Échec upload IPFS: ${error.message}`);
    }
  }, [cardImage]);

  // Soumission du formulaire
  const handleSubmit = useCallback(async () => {
    if (!validateStep(5)) return;
    if (status === 'loading' || status === 'success') return;

    setStatus('loading');
    setErrors({});

    try {
      // Upload sur IPFS
      const ipfsResult = await uploadToIPFS(formData);
      if (!ipfsResult.success) {
        throw new Error("Échec de l'upload IPFS");
      }

      const metadataURI = `ipfs://${ipfsResult.ipfsHash}`;
      const sharePriceWei = ethers.utils.parseEther(formData.sharePrice);
      const targetAmountWei = sharePriceWei.mul(ethers.BigNumber.from(formData.numberOfShares));

      // Obtenir les frais de création avec retry logic
      const feeData = await apiManager.getCampaignCreationFee();
      const campaignFee = feeData.raw;

      // Créer la campagne sur la blockchain avec api-manager
      setWriteLoading(true);
      const result = await apiManager.createCampaign({
        name: formData.name,
        symbol: formData.symbol,
        targetAmount: targetAmountWei,
        sharePrice: sharePriceWei,
        endTime: Math.floor(new Date(formData.endDate).getTime() / 1000),
        category: formData.sector, // _category parameter
        metadata: metadataURI, // _metadata parameter
        royaltyFee: ethers.BigNumber.from(formData.royaltyFee),
        logo: "" // _logo parameter (empty string for now)
      });
      setWriteLoading(false);

      if (!result.success) {
        throw new Error(result.error);
      }

      const campaignAddress = result.campaignAddress;
      
      setTransactionHash(result.txHash);
      setStatus('success');
      
      // Précharger les données de la nouvelle campagne dans le cache
      if (campaignAddress) {
        try {
          // Ajouter la nouvelle campagne au cache des campagnes
          await apiManager.getAllCampaigns(false); // Force refresh
          
          // Précharger les données de la campagne nouvellement créée
          setTimeout(async () => {
            await apiManager.getCampaignData(campaignAddress, false);
          }, 2000); // Délai pour laisser la blockchain se synchroniser
          
        } catch (cacheError) {
          console.warn('Erreur lors de la mise en cache:', cacheError);
          // Ne pas faire échouer la création pour des erreurs de cache
        }
      }
      
      // Notifier le parent
      if (onCampaignCreated) {
        onCampaignCreated();
      }

    } catch (error) {
      console.error("Erreur:", error);
      setStatus('error');
      setErrors({ 
        general: error.code === "INSUFFICIENT_FUNDS" 
          ? "Fonds insuffisants pour créer la campagne" 
          : error.message 
      });
    }
  }, [formData, validateStep, status, uploadToIPFS, address, onCampaignCreated]);

  // Rendu du contenu selon l'étape
  const renderStepContent = () => {
    if (status === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-lime-600" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Création de la campagne en cours...
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Upload IPFS et transaction blockchain en cours
          </p>
        </div>
      );
    }

    if (status === 'success') {
      return (
        <div className="text-center py-16 space-y-6">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Campagne créée avec succès !
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Votre campagne "{formData.name}" est maintenant en ligne
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-neutral-900 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Hash de transaction:
            </p>
            <a 
              href={`https://sepolia.basescan.org/tx/${transactionHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-lime-600 hover:text-lime-700 dark:text-lime-400 text-sm font-mono break-all underline"
            >
              {transactionHash}
            </a>
          </div>
          <Button 
            onClick={() => {
              setShowCreateCampaign(false);
              // Invalider le cache des campagnes pour forcer le refresh lors du prochain chargement
              apiManager.cache.invalidate('campaigns_all');
            }}
            className="bg-lime-500 hover:bg-lime-600 text-white"
          >
            Fermer
          </Button>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="text-center py-16 space-y-6">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-red-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">
              Échec de la création
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {errors.general}
            </p>
          </div>
          <Button 
            onClick={() => setStatus('idle')}
            variant="outline"
          >
            Réessayer
          </Button>
        </div>
      );
    }

    // Rendu normal des étapes
    switch(currentStep) {
      case 1:
        return (
          <CampaignBasicInfo
            formData={formData}
            error={errors}
            onInputChange={handleInputChange}
            onSelectChange={handleSelectChange}
          />
        );
      case 2:
        return (
          <CampaignDocuments
            formData={formData}
            error={errors}
            onFileChange={handleFileChange}
            onRemoveFile={handleRemoveFile}
          />
        );
      case 3:
        return (
          <CampaignTeamSocials
            formData={formData}
            onInputChange={handleInputChange}
            onTeamMemberChange={handleTeamMemberChange}
            onAddTeamMember={handleAddTeamMember}
            onRemoveTeamMember={handleRemoveTeamMember}
          />
        );
      case 4:
        return (
          <CampaignNFTPreview
            ref={cardRef}
            formData={formData}
            contractAddress={apiManager.contractAddresses.DivarProxy}
            onCustomizationChange={handleNFTCustomizationChange}
          />
        );
      case 5:
        return (
          <CampaignReview
            formData={formData}
            error={errors}
            isLoading={writeLoading}
            onAcceptTerms={handleAcceptTerms}
            onSubmit={handleSubmit}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
      <DialogContent className="sm:max-w-4xl h-[90vh] max-h-[90vh] flex flex-col bg-white dark:bg-neutral-900 border-0 shadow-2xl">
        <DialogHeader className="pb-4 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Créer une nouvelle campagne
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Lancez votre campagne de financement en quelques étapes simples
          </DialogDescription>
        </DialogHeader>

        {/* Indicateur d'étapes */}
        {status === 'idle' && (
          <div className="flex-shrink-0 mb-4">
            <StepIndicator currentStep={currentStep} totalSteps={5} />
          </div>
        )}

        {/* Contenu principal scrollable */}
        <div className="flex flex-col flex-1 min-h-0">
          <ScrollArea className="flex-1 px-2">
            <div className="pb-6">
              {renderStepContent()}
            </div>
          </ScrollArea>

          {/* Navigation fixe en bas */}
          {status === 'idle' && (
            <div className="flex justify-between items-center pt-4 px-2 border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={handlePreviousStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-2 font-semibold border-2 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" />
              Précédent
            </Button>

            <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-neutral-800 px-3 py-1 rounded-full font-medium">
              Étape {currentStep} sur 5
            </div>

            {currentStep < 5 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white flex items-center gap-2 px-6 py-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                Suivant
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <div />
            )}
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}