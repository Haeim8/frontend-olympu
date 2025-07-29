"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useContract, useContractWrite, useAddress } from '@thirdweb-dev/react';
import { ethers } from 'ethers';
import html2canvas from 'html2canvas';
import { pinataService } from '@/lib/services/storage';
import { apiManager } from '@/lib/services/api-manager';

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

const CONTRACT_ADDRESS = "0x9fc348c0f4f4b1Ad6CaB657a7C519381FC5D3941";
const CONTRACT_ABI = [
  {
    "inputs": [
      { "type": "string", "name": "_name" },
      { "type": "string", "name": "_symbol" },
      { "type": "uint256", "name": "_targetAmount" },
      { "type": "uint256", "name": "_sharePrice" },
      { "type": "uint256", "name": "_endTime" },
      { "type": "string", "name": "_category" },
      { "type": "string", "name": "_metadata" },
      { "type": "uint96", "name": "_royaltyFee" },
      { "type": "string", "name": "_logo" }
    ],
    "name": "createCampaign",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "type": "function",
    "name": "getCampaignCreationFeeETH", 
    "inputs": [],
    "outputs": [{ "type": "uint256" }],
    "stateMutability": "view"
  }
];

export default function CampaignModal({ 
  showCreateCampaign, 
  setShowCreateCampaign, 
  onCampaignCreated 
}) {
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
  const address = useAddress();
  const { contract } = useContract(CONTRACT_ADDRESS, CONTRACT_ABI);
  const { mutateAsync: createCampaign, isLoading: writeLoading } = useContractWrite(contract, "createCampaign");

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
      setFormData(INITIAL_FORM_DATA);
      setErrors({});
      setStatus('idle');
      setTransactionHash('');
      setCardImage(null);
      
      // Optionnel: Vider le cache si nécessaire pour libérer la mémoire
      // apiManager.clearCache(); // Décommentez si vous voulez vider le cache à chaque fermeture
    }
  }, [showCreateCampaign]);

  // Validation des étapes
  const validateStep = useCallback((step) => {
    const newErrors = {};
    
    switch(step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = "Le nom est requis";
        if (!formData.symbol.trim()) newErrors.symbol = "Le symbole est requis";
        if (!formData.sector) newErrors.sector = "Le secteur est requis";
        if (formData.sector === 'Autre' && !formData.otherSector.trim()) {
          newErrors.otherSector = "Veuillez préciser le secteur";
        }
        if (!formData.description.trim()) newErrors.description = "La description est requise";
        if (!formData.sharePrice || parseFloat(formData.sharePrice) <= 0) {
          newErrors.sharePrice = "Le prix par part doit être supérieur à 0";
        }
        if (!formData.numberOfShares || parseInt(formData.numberOfShares) <= 0) {
          newErrors.numberOfShares = "Le nombre de parts doit être supérieur à 0";
        }
        if (!formData.endDate || new Date(formData.endDate).getTime() <= Date.now()) {
          newErrors.endDate = "La date de fin doit être dans le futur";
        }
        if (!formData.royaltyReceiver.trim()) {
          newErrors.royaltyReceiver = "L'adresse de réception est requise";
        }
        break;
      
      case 2:
        if (!formData.documents.whitepaper?.length) {
          newErrors.whitepaper = "Le whitepaper est requis";
        }
        break;
      
      case 3:
        if (!formData.teamMembers.some(member => member.name.trim())) {
          newErrors.team = "Au moins un membre d'équipe avec un nom est requis";
        }
        break;
      
      case 4:
        // Pas de validation spécifique pour l'aperçu NFT
        break;
      
      case 5:
        if (!formData.acceptTerms) {
          newErrors.terms = "Vous devez accepter les conditions";
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

  // Création du dossier IPFS avec retry logic
  const createCampaignFolder = useCallback(async (campaignData) => {
    const campaignFolderName = `campaign_${campaignData.name.replace(/\s+/g, '_').toLowerCase()}`;
    const filesToUpload = [];

    // Métadonnées NFT
    const nftMetadata = {
      name: campaignData.name,
      description: campaignData.description || "",
      image: `ipfs://${campaignFolderName}/nft-card.png`,
      attributes: [
        { trait_type: "Sector", value: campaignData.sector === 'Autre' ? campaignData.otherSector : campaignData.sector },
        { trait_type: "Background Color", value: campaignData.nftCustomization.backgroundColor },
        { trait_type: "Text Color", value: campaignData.nftCustomization.textColor }
      ]
    };

    filesToUpload.push({
      content: new Blob([JSON.stringify(nftMetadata, null, 2)], { type: 'application/json' }),
      path: `${campaignFolderName}/nft-metadata.json`
    });

    // Ajout de l'image de la carte
    if (cardImage) {
      filesToUpload.push({
        content: cardImage,
        path: `${campaignFolderName}/nft-card.png`
      });
    }

    // Documents
    Object.entries(campaignData.documents).forEach(([docType, files]) => {
      if (files && files.length > 0) {
        files.forEach(file => {
          filesToUpload.push({
            content: file,
            path: `${campaignFolderName}/documents/${docType}/${file.name}`
          });
        });
      }
    });

    // Métadonnées de campagne
    const contractMetadata = {
      name: campaignData.name,
      symbol: campaignData.symbol,
      sharePrice: campaignData.sharePrice,
      numberOfShares: campaignData.numberOfShares,
      targetAmount: (parseFloat(campaignData.sharePrice) * parseFloat(campaignData.numberOfShares)).toString(),
      endTime: Math.floor(new Date(campaignData.endDate).getTime() / 1000),
      sector: campaignData.sector,
      royaltyFee: campaignData.royaltyFee,
      socials: campaignData.socials,
      teamMembers: campaignData.teamMembers
    };

    filesToUpload.push({
      content: new Blob([JSON.stringify(contractMetadata, null, 2)], { type: 'application/json' }),
      path: `${campaignFolderName}/metadata.json`
    });

    // Upload sur IPFS avec retry logic d'api-manager
    const result = await apiManager.fetchWithRetry(async () => {
      return await pinataService.uploadDirectory(campaignFolderName, filesToUpload);
    });
    
    if (!result.success) {
      throw new Error("Échec de l'upload IPFS");
    }

    return {
      success: true,
      ipfsHash: result.ipfsHash,
      campaignFolderName: campaignFolderName
    };
  }, [cardImage]);

  // Soumission du formulaire
  const handleSubmit = useCallback(async () => {
    if (!validateStep(5)) return;
    if (status === 'loading' || status === 'success') return;

    setStatus('loading');
    setErrors({});

    try {
      // Créer le dossier IPFS
      const ipfsResult = await createCampaignFolder(formData);
      if (!ipfsResult.success) {
        throw new Error("Échec de l'upload IPFS");
      }

      const { campaignFolderName } = ipfsResult;
      const metadataURI = `ipfs://${ipfsResult.ipfsHash}/${campaignFolderName}/nft-metadata.json`;
      const sharePriceWei = ethers.utils.parseEther(formData.sharePrice);
      const targetAmountWei = sharePriceWei.mul(ethers.BigNumber.from(formData.numberOfShares));

      // Obtenir les frais de création avec retry logic
      const campaignFee = await apiManager.fetchWithRetry(async () => {
        return await contract.call("getCampaignCreationFeeETH", []);
      });

      // Créer la campagne sur la blockchain avec retry logic
      const result = await apiManager.fetchWithRetry(async () => {
        return await createCampaign({
          args: [
            formData.name,
            formData.symbol,
            targetAmountWei,
            sharePriceWei,
            Math.floor(new Date(formData.endDate).getTime() / 1000),
            formData.sector,
            metadataURI,
            ethers.BigNumber.from(formData.royaltyFee),
            ""
          ],
          overrides: {
            value: campaignFee
          }
        });
      });

      const receipt = result.receipt;
      const event = receipt.events?.find(e => e.event === 'CampaignCreated');
      const campaignAddress = event?.args?.campaignAddress;
      
      setTransactionHash(receipt.transactionHash);
      setStatus('success');
      
      // Précharger les données de la nouvelle campagne dans le cache
      if (campaignAddress) {
        try {
          // Ajouter la nouvelle campagne au cache des campagnes
          await apiManager.getAllCampaigns(false); // Force refresh
          
          // Précharger les données de la campagne nouvellement créée
          setTimeout(async () => {
            await apiManager.getCampaignData(campaignAddress, false);
            await apiManager.preloadCampaignDetails(campaignAddress);
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
  }, [formData, validateStep, status, createCampaignFolder, contract, createCampaign, onCampaignCreated]);

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
            contractAddress={CONTRACT_ADDRESS}
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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden bg-white dark:bg-neutral-900 border-0 shadow-2xl">
        <DialogHeader className="pb-0">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Créer une nouvelle campagne
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Lancez votre campagne de financement en quelques étapes simples
          </DialogDescription>
        </DialogHeader>

        {/* Indicateur d'étapes */}
        {status === 'idle' && (
          <StepIndicator currentStep={currentStep} totalSteps={5} />
        )}

        {/* Contenu principal avec hauteur fixe */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <ScrollArea className="flex-1 px-2">
            <div className="min-h-[400px] pb-4">
              {renderStepContent()}
            </div>
          </ScrollArea>

          {/* Navigation fixe en bas */}
          {status === 'idle' && (
            <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
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