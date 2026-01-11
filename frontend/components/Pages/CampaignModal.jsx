"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, ArrowLeft, ArrowRight, Loader2, Sparkles, X } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import html2canvas from 'html2canvas';
import { apiManager } from '@/lib/services/api-manager';
import { useTranslation } from '@/hooks/useLanguage';
import { motion, AnimatePresence } from 'framer-motion';

// Import des composants modulaires
import StepIndicator from '@/components/campaign-creation/CampaignFormSteps';
import CampaignBasicInfo from '@/components/campaign-creation/CampaignBasicInfo';
import CampaignDocuments from '@/components/campaign-creation/CampaignDocuments';
import CampaignTeamSocials from '@/components/campaign-creation/CampaignTeamSocials';
import CampaignNFTPreview from '@/components/campaign-creation/CampaignNFTPreview';
import CampaignReview from '@/components/campaign-creation/CampaignReview';

const REQUIRED_CHAIN = {
  id: 84532,
  hex: '0x14a34',
  params: {
    chainId: '0x14a34',
    chainName: 'Base Sepolia',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://sepolia.base.org'],
    blockExplorerUrls: ['https://sepolia.basescan.org'],
  },
};

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
    medium: '',
    farcaster: '',
    base: ''
  },
  nftCustomization: {
    backgroundColor: '#ffffff',
    textColor: '#000000',
    logo: null,
    texture: 'default',
  },
  acceptTerms: false
};

export default function CampaignModal({
  showCreateCampaign,
  setShowCreateCampaign,
  onCampaignCreated
}) {
  const { t } = useTranslation();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [transactionHash, setTransactionHash] = useState('');
  const [cardImage, setCardImage] = useState(null);

  const cardRef = useRef(null);
  const submitRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { address, connector } = useAccount();
  const [writeLoading, setWriteLoading] = useState(false);
  const draftRestoredRef = useRef(false);

  // Helper pour les brouillons (inchangé sur le fond, mais peut être optimisé)
  const getDraftKey = useCallback((addr) => `livar_campaign_draft_${addr ? addr.toLowerCase() : 'guest'}`, []);

  const fileToDataURL = useCallback((file) => new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    if (file._base64) return resolve(file._base64);
    const reader = new FileReader();
    reader.onload = () => {
      file._base64 = reader.result;
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  }), []);

  const blobToDataURL = useCallback((blob) => new Promise((resolve, reject) => {
    if (!blob) return resolve(null);
    if (blob._base64) return resolve(blob._base64);
    const reader = new FileReader();
    reader.onload = () => {
      blob._base64 = reader.result;
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  }), []);

  const dataURLToFile = useCallback(async (dataUrl, name, type, lastModified) => {
    if (!dataUrl) return null;
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], name, { type: type || blob.type || 'application/octet-stream', lastModified: lastModified || Date.now() });
    file._base64 = dataUrl;
    return file;
  }, []);

  const deserializeDraft = useCallback(async (storedDraft) => {
    const parsed = JSON.parse(storedDraft);
    const draft = { ...INITIAL_FORM_DATA, ...parsed };

    if (parsed.documents) {
      const restoredDocuments = {};
      await Promise.all(Object.entries(parsed.documents).map(async ([docType, docArray]) => {
        restoredDocuments[docType] = await Promise.all((docArray || []).map(async (doc) => {
          return dataURLToFile(doc.dataUrl, doc.name, doc.type, doc.lastModified);
        }));
      }));
      draft.documents = restoredDocuments;
    }

    if (parsed.cardImageDataUrl) {
      const restoredCard = await dataURLToFile(parsed.cardImageDataUrl, 'card.png', parsed.cardImageMimeType || 'image/png');
      draft._restoredCardImage = restoredCard;
    }

    return draft;
  }, [dataURLToFile]);

  const serializeDraft = useCallback(async (data, cardImageValue) => {
    const serialized = { ...data };
    const documents = {};
    await Promise.all(Object.entries(data.documents).map(async ([docType, docFiles]) => {
      documents[docType] = await Promise.all((docFiles || []).map(async (file) => {
        const dataUrl = await fileToDataURL(file);
        return {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          dataUrl,
        };
      }));
    }));
    serialized.documents = documents;

    if (cardImageValue) {
      const dataUrl = await blobToDataURL(cardImageValue);
      serialized.cardImageDataUrl = dataUrl;
      serialized.cardImageMimeType = cardImageValue.type || 'image/png';
    } else {
      serialized.cardImageDataUrl = null;
      serialized.cardImageMimeType = null;
    }
    return serialized;
  }, [fileToDataURL, blobToDataURL]);

  const clearDraft = useCallback((addr) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(getDraftKey(addr));
  }, [getDraftKey]);

  useEffect(() => {
    if (address) {
      setFormData(prev => ({
        ...prev,
        creatorAddress: address,
        royaltyReceiver: address
      }));
    }
  }, [address]);

  useEffect(() => {
    if (!showCreateCampaign) {
      setCurrentStep(1);
      setFormData({
        ...INITIAL_FORM_DATA,
        creatorAddress: address || '',
        royaltyReceiver: address || ''
      });
      setErrors({});
      setStatus('idle');
      setTransactionHash('');
      setCardImage(null);
      draftRestoredRef.current = false;
    } else {
      if (address) {
        setFormData(prev => ({
          ...prev,
          creatorAddress: address,
          royaltyReceiver: address
        }));
      }
    }
  }, [showCreateCampaign, address]);

  // Draft restoration logic
  useEffect(() => {
    if (!showCreateCampaign || draftRestoredRef.current) return;
    if (typeof window === 'undefined') return;
    const draftKey = getDraftKey(address);
    const storedDraft = window.localStorage.getItem(draftKey);
    if (!storedDraft) {
      draftRestoredRef.current = true;
      return;
    }
    (async () => {
      try {
        const restored = await deserializeDraft(storedDraft);
        const { _restoredCardImage, ...restForm } = restored;
        setFormData(prev => ({ ...prev, ...restForm }));
        if (_restoredCardImage) {
          setCardImage(_restoredCardImage);
        }
      } catch (error) {
        console.warn('Impossible de restaurer le brouillon:', error);
      } finally {
        draftRestoredRef.current = true;
      }
    })();
  }, [showCreateCampaign, address, deserializeDraft, getDraftKey]);

  // Auto-save logic
  useEffect(() => {
    if (!showCreateCampaign) return;
    if (status === 'success') return;
    if (typeof window === 'undefined') return;

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      try {
        const serialized = await serializeDraft(formData, cardImage);
        if (cancelled) return;
        window.localStorage.setItem(getDraftKey(address), JSON.stringify(serialized));
      } catch (error) {
        // Silently fail on draft save errors to avoid spam
      }
    }, 1000);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [formData, cardImage, address, showCreateCampaign, status, serializeDraft, getDraftKey]);


  const validateStep = useCallback((step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = t('campaign.validation.nameRequired', 'Nom requis');
        if (!formData.symbol.trim()) newErrors.symbol = t('campaign.validation.symbolRequired', 'Symbole requis');
        if (!formData.sector) newErrors.sector = t('campaign.validation.sectorRequired', 'Secteur requis');
        if (formData.sector === 'Autre' && !formData.otherSector.trim()) {
          newErrors.otherSector = t('campaign.validation.specifySector', 'Précisez le secteur');
        }
        if (!formData.description.trim()) newErrors.description = t('campaign.validation.descriptionRequired', 'Description requise');
        if (!formData.sharePrice || parseFloat(formData.sharePrice) <= 0) {
          newErrors.sharePrice = t('campaign.validation.sharePricePositive', 'Prix > 0');
        }
        if (!formData.numberOfShares || parseInt(formData.numberOfShares) <= 0) {
          newErrors.numberOfShares = t('campaign.validation.sharesPositive', 'Parts > 0');
        }
        if (!formData.endDate || new Date(formData.endDate).getTime() <= Date.now()) {
          newErrors.endDate = t('campaign.validation.futureDateRequired', 'Date future requise');
        }
        break;

      case 2:
        if (!formData.documents.whitepaper?.length) {
          newErrors.whitepaper = t('campaign.validation.whitepaperRequired', 'Whitepaper requis');
        }
        break;

      case 3:
        if (!formData.teamMembers.some(member => member.name.trim())) {
          newErrors.team = t('campaign.validation.teamMemberRequired', 'Au moins 1 membre');
        }
        break;

      case 5:
        if (!formData.acceptTerms) {
          newErrors.terms = t('campaign.validation.termsRequired', 'Acceptez les conditions');
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const resolveExternalProvider = useCallback(async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return window.ethereum;
    }
    throw new Error('No wallet provider found');
  }, []);

  const ensureCorrectChain = useCallback(async (web3Provider) => {
    const network = await web3Provider.getNetwork();
    if (network.chainId === REQUIRED_CHAIN.id) return;

    try {
      await web3Provider.send('wallet_switchEthereumChain', [{ chainId: REQUIRED_CHAIN.hex }]);
    } catch (switchError) {
      if (switchError?.code === 4902 || switchError?.data?.originalError?.code === 4902) {
        await web3Provider.send('wallet_addEthereumChain', [REQUIRED_CHAIN.params]);
        return;
      }
      throw new Error('Veuillez changer de réseau vers Base Sepolia');
    }
  }, []);

  // Handlers
  const handleInputChange = useCallback((e, nestedField = null) => {
    const { name, value } = e.target;
    if (nestedField) {
      setFormData(prev => ({ ...prev, [nestedField]: { ...prev[nestedField], [name]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleSelectChange = useCallback((value, field) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleFileChange = useCallback((e, field) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        documents: { ...prev.documents, [field]: Array.from(e.target.files) }
      }));
    }
  }, []);

  const handleRemoveFile = useCallback((index, field) => {
    setFormData(prev => ({
      ...prev,
      documents: { ...prev.documents, [field]: prev.documents[field].filter((_, i) => i !== index) }
    }));
  }, []);

  const handleTeamMemberChange = useCallback((index, field, value, socialField = null) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member, i) => {
        if (i === index) {
          if (socialField) return { ...member, socials: { ...member.socials, [socialField]: value } };
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
    setFormData(prev => ({ ...prev, nftCustomization: customization }));
  }, []);

  const handleAcceptTerms = useCallback(() => {
    setFormData(prev => ({ ...prev, acceptTerms: !prev.acceptTerms }));
  }, []);

  // Reset complet du formulaire
  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setCurrentStep(1);
    setStatus('idle');
    setTransactionHash('');
    setCardImage(null);
    setErrors({});
    setIsSubmitting(false);
    submitRef.current = false;
    draftRestoredRef.current = false;
    // Supprimer le brouillon du localStorage
    if (address && typeof window !== 'undefined') {
      window.localStorage.removeItem(getDraftKey(address));
    }
  }, [address, getDraftKey]);

  const handleNextStep = useCallback(async () => {
    if (!validateStep(currentStep)) return;
    if (currentStep === 4) {
      try {
        const image = await html2canvas(cardRef.current, { useCORS: true, scale: 2 });
        const blob = await new Promise(resolve => image.toBlob(resolve, 'image/png'));
        setCardImage(blob);
      } catch (error) {
        console.error("Capture failed:", error);
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 5));
  }, [currentStep, validateStep]);

  const handlePreviousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const handleSubmit = useCallback(async () => {
    // Protection contre double-clic et React StrictMode
    if (isSubmitting || submitRef.current) {
      console.log('[Campaign] Soumission déjà en cours, ignorée');
      return;
    }
    submitRef.current = true;
    setIsSubmitting(true);

    if (!validateStep(5)) {
      submitRef.current = false;
      setIsSubmitting(false);
      return;
    }

    if (!address) {
      setErrors({ general: t('campaign.errors.walletNotConnected', "Wallet non connecté") });
      submitRef.current = false;
      setIsSubmitting(false);
      return;
    }

    setStatus('loading');

    try {
      // 1. Initialiser le provider et le signer
      if (!window.ethereum) throw new Error("Fournisseur Ethereum introuvable");
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = await provider.getSigner();

      // 2. Préparer les données pour le contrat (SANS uploader les documents)
      const dataToSubmit = {
        ...formData,
        projectName: formData.name,
        tokenSymbol: formData.symbol,
        fundingGoal: formData.sharePrice * formData.numberOfShares,
        metadataUri: JSON.stringify({
          sector: formData.sector === 'Autre' ? formData.otherSector : formData.sector,
          socials: formData.socials,
          team: formData.teamMembers
        })
      };

      // 3. CRÉER LA CAMPAGNE ON-CHAIN D'ABORD (transaction blockchain)
      console.log('[Campaign] Création de la campagne on-chain...');
      const result = await apiManager.createCampaign(dataToSubmit, signer);

      if (!result.success || !result.address) {
        throw new Error("La création a échoué sans adresse de contrat valide");
      }


      const realCampaignAddress = result.address.toLowerCase();
      console.log('[Campaign] Campagne créée:', realCampaignAddress);

      // Note: L'upsert Supabase est déjà fait dans apiManager.createCampaign()
      // Pas besoin de le refaire ici

      // 4. SEULEMENT MAINTENANT, uploader les documents (la campagne existe on-chain ET dans Supabase)
      const uploadedDocs = {};

      // Mapping des catégories frontend → catégories Supabase (CHECK constraint)
      const categoryMapping = {
        whitepaper: 'whitepaper',
        pitchDeck: 'marketing',    // pitchDeck → marketing
        legalDocuments: 'legal',   // legalDocuments → legal  
        media: 'other'             // media → other
      };

      for (const [type, files] of Object.entries(formData.documents)) {
        if (!files || files.length === 0) continue;

        const dbCategory = categoryMapping[type] || 'other';
        uploadedDocs[type] = [];
        for (const file of files) {
          try {
            const uploadFd = new FormData();
            uploadFd.append('file', file);
            uploadFd.append('category', dbCategory);
            uploadFd.append('campaignAddress', realCampaignAddress);

            const res = await fetch('/api/documents/upload', { method: 'POST', body: uploadFd });
            const uploadResult = await res.json();

            if (uploadResult.success) {
              uploadedDocs[type].push({
                name: file.name,
                url: uploadResult.url,
                category: type,
                originalSize: uploadResult.originalSize,
                compressedSize: uploadResult.compressedSize,
                compressionRatio: uploadResult.compressionRatio
              });

              // 5. Enregistrer le document dans la DB avec la vraie adresse
              await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  campaignAddress: realCampaignAddress,
                  url: uploadResult.url,
                  name: file.name,
                  category: dbCategory
                })
              });

              console.log(`[Upload] ${file.name}: ${uploadResult.compressionRatio} compression`);
            } else {
              console.error(`[Upload] Échec pour ${file.name}:`, uploadResult.error);
              // On continue même si un document échoue, la campagne est déjà créée
            }
          } catch (uploadError) {
            console.error(`[Upload] Erreur pour ${file.name}:`, uploadError);
            // On continue même si un document échoue
          }
        }
      }

      setStatus('success');
      setTransactionHash(result.txHash);
      if (onCampaignCreated) onCampaignCreated(result.address);

    } catch (e) {
      console.error("[Submit] Error:", e);
      setStatus('error');
      // Traduire les erreurs courantes si nécessaire
      const errorMsg = e.reason || e.message || t('campaign.errors.generic');
      setErrors({ general: errorMsg });
    } finally {
      // Reset des flags en cas d'erreur (mais pas en cas de succès car la modal se ferme)
      if (status !== 'success') {
        submitRef.current = false;
        setIsSubmitting(false);
      }
    }
  }, [validateStep, address, formData, onCampaignCreated, t, isSubmitting, status]);


  // RENDERERS
  const renderStepContent = () => {
    if (status === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            <Loader2 className="w-16 h-16 animate-spin text-primary relative z-10" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-foreground">
              {t('campaign.creation.creating', 'Création en cours...')}
            </h3>
            <p className="text-muted-foreground">
              {t('campaign.creation.wait', 'Veuillez patienter pendant que nous déployons votre campagne sur la blockchain.')}
            </p>
          </div>
        </div>
      );
    }

    if (status === 'success') {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-4"
          >
            <CheckCircle className="w-12 h-12 text-green-500" />
          </motion.div>

          <h3 className="text-3xl font-bold text-foreground">
            {t('campaign.creation.success', 'Félicitations !')}
          </h3>
          <p className="text-lg text-muted-foreground max-w-md">
            {t('campaign.creation.successDesc', 'Votre campagne a été créée avec succès sur la blockchain.')}
          </p>

          {transactionHash && (
            <div className="p-4 rounded-xl bg-muted/50 border border-border w-full max-w-md break-all font-mono text-xs text-muted-foreground">
              Tx: {transactionHash}
            </div>
          )}

          <Button
            onClick={() => {
              resetForm();
              setShowCreateCampaign(false);
            }}
            className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary/25"
          >
            {t('campaign.creation.viewCampaign', 'Voir ma campagne')}
          </Button>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return <CampaignBasicInfo formData={formData} onInputChange={handleInputChange} onSelectChange={handleSelectChange} error={errors} />;
      case 2:
        return <CampaignDocuments formData={formData} onFileChange={handleFileChange} onRemoveFile={handleRemoveFile} error={errors} />;
      case 3:
        return <CampaignTeamSocials formData={formData} onTeamMemberChange={handleTeamMemberChange} onAddTeamMember={handleAddTeamMember} onRemoveTeamMember={handleRemoveTeamMember} onInputChange={handleInputChange} error={errors} />;
      case 4:
        return <CampaignNFTPreview formData={formData} onCustomizationChange={handleNFTCustomizationChange} ref={cardRef} />;
      case 5:
        return <CampaignReview formData={formData} cardImage={cardImage} onAcceptTerms={handleAcceptTerms} error={errors} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0 glass-card border-border overflow-hidden flex flex-col">

        {/* Header Fixed */}
        <div className="p-6 border-b border-border/50 bg-background/50 backdrop-blur-xl z-20 sticky top-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {t('campaign.create.title', 'Lancer une Campagne')}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {t('campaign.create.subtitle', 'Transformez votre vision en réalité.')}
                </p>
              </div>
            </div>
            {/* Close button is handled by DialogPrimitive internally usually, but we can add custom if needed */}
          </div>

          {status !== 'success' && status !== 'loading' && (
            <StepIndicator currentStep={currentStep} totalSteps={5} />
          )}
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 bg-background/30">
          <div className="p-6 md:p-10 max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Footer Fixed */}
        {status !== 'success' && status !== 'loading' && (
          <div className="p-6 border-t border-border/50 bg-background/50 backdrop-blur-xl z-20 flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={handlePreviousStep}
              disabled={currentStep === 1}
              className="hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('previous', 'Précédent')}
            </Button>

            {currentStep < 5 ? (
              <Button
                onClick={handleNextStep}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20"
              >
                {t('next', 'Suivant')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-bold px-8 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? t('campaign.submitting', 'Création en cours...') : t('campaign.submit', 'Lancer la Campagne')}
                {isSubmitting ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Sparkles className="w-4 h-4 ml-2" />}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
