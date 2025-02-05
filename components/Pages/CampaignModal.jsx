"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Plus, Trash2, CheckCircle } from 'lucide-react';
import { useContract, useContractWrite, useAddress } from '@thirdweb-dev/react';
import { ethers } from 'ethers';
import { pinataService } from '@/lib/services/storage';
import CompanySharesNFTCard from '@/components/nft/CompanySharesNFTCard';
import html2canvas from 'html2canvas';
import { initializeCampaignFolders, uploadDocument, updateSocialLinks, updateDescription } from '@/lib/firebase/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

const SECTORS = [
  "Blockchain", "Finance", "Industrie", "Tech", "Influence", "Gaming",
  "NFT", "DeFi", "DAO", "Infrastructure", "Autre"
];

export default function CampaignModal({ showCreateCampaign, setShowCreateCampaign, }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepValidated, setStepValidated] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState({});
  const [transactionHash, setTransactionHash] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [cardImage, setCardImage] = useState(null); 
  const address = useAddress();
  const contractAddress = "0x9fc348c0f4f4b1Ad6CaB657a7C519381FC5D3941";
  const contractABI = [
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
      "type": "event",
      "name": "CampaignCreated",
      "inputs": [
        { "type": "address", "name": "campaignAddress", "indexed": true },
        { "type": "address", "name": "startup", "indexed": true },
        { "type": "string", "name": "name", "indexed": false },
        { "type": "uint256", "name": "timestamp", "indexed": false }
      ]
    },
    {
      "type": "function",
      "name": "CAMPAIGN_CREATION_FEE_USD",
      "inputs": [],
      "outputs": [{ "type": "uint256" }],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getCampaignCreationFeeETH",
      "inputs": [],
      "outputs": [{ "type": "uint256" }],
      "stateMutability": "view"
    }
  ];

  const { contract } = useContract(contractAddress, contractABI);
  const { mutateAsync: createCampaign, isLoading: writeLoading } = useContractWrite(contract, "createCampaign");
  

  const [formData, setFormData] = useState({
    creatorAddress: '',
    name: '',
    symbol: '',
    sector: '',
    otherSector: '',
    description: '',
    sharePrice: '',
    numberOfShares: '',
    targetAmount: '',
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
    certified: false,
    lawyer: { address: '', name: '', contact: '', jurisdiction: '' },
    acceptTerms: false,
    socials: {
      website: '',
      twitter: '',
      github: '',
      discord: '',
      telegram: '',
      medium: ''
    },
    metadata: {
      roadmap: '',
      tokenomics: '',
      vesting: '',
      useOfFunds: ''
    },
    investmentTerms: {
      remunerationType: '',
      tokenDistribution: '',
      roi: '',
    },
    companyShares: {
      percentageMinted: '',
      vertePortalLink: '',
    },
    distributeTokens: false,
    vestingPlan: false,
   
    nftCustomization: {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      logo: null,
      texture: 'default',
    },
    investmentReturns: {
      dividends: { enabled: false },
      airdrops: { enabled: false },
      revenueSplit: { enabled: false },
      customReward: { enabled: false, name: '' }
    },
    verifications: {
      kycCompleted: false,
      legalVerification: false
    }
 
  });

  const cardRef = useRef(null); 

  useEffect(() => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(isDark);
  }, []);
  
  useEffect(() => {
    if (address) {
      setFormData(prev => ({
        ...prev,
        creatorAddress: address,
        royaltyReceiver: address
      }));
    }
  }, [address]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedInputChange = (e, nestedField) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [nestedField]: {
        ...prev[nestedField],
        [name]: value
      }
    }));
  };

  const handleSelectChange = (value, field) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (name) => {
    setFormData(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleFileChange = (e, field) => {
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
  };

  const removeFile = (index, field) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: prev.documents[field].filter((_, i) => i !== index)
      }
    }));
  };

  const addTeamMember = () => {
    setFormData(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, { name: '', role: '', socials: { twitter: '', linkedin: '' } }]
    }));
  };

  const removeTeamMember = (index) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index)
    }));
  };

  const handleTeamMemberChange = (index, field, value, socialField = null) => {
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
  };

  const validateStep = (step) => {
    const errors = {};
    switch(step) {
      case 1:
        if (!formData.name) errors.name = "Le nom est requis";
        if (!formData.symbol) errors.symbol = "Le symbole est requis";
        if (!formData.sector) errors.sector = "Le secteur est requis";
        if (formData.sector === 'Autre' && !formData.otherSector) errors.otherSector = "Veuillez préciser le secteur";
        if (!formData.description) errors.description = "La description est requise";
        if (!formData.sharePrice || parseFloat(formData.sharePrice) <= 0) errors.sharePrice = "Le prix par part doit être supérieur à 0";
        if (!formData.numberOfShares || parseInt(formData.numberOfShares) <= 0) errors.numberOfShares = "Le nombre de parts doit être supérieur à 0";
        if (!formData.endDate || new Date(formData.endDate).getTime() <= Date.now()) {
          errors.endDate = "La date de fin doit être dans le futur";
        }
        break;
      case 2:
        if (!formData.whitepaper) errors.whitepaper = "Le whitepaper est requis";
        break;
      case 3:
        if (formData.teamMembers.length === 0) errors.team = "Au moins un membre d'équipe est requis";
        break;
        case 4:
          break;
        case 5:
          if (!formData.acceptTerms) errors.terms = "Vous devez accepter les conditions";
          default:
        break;
    }
    setError(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = async () => {
    if (currentStep === 4) {
      try {
        // Capturer l'image quand on valide l'étape 4
        const image = await html2canvas(cardRef.current);
        const blob = await new Promise(resolve => image.toBlob(resolve, 'image/png'));
        setCardImage(blob);
      } catch (error) {
        console.error("Erreur lors de la capture de la carte:", error);
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePreviousStep = () => {
    // Si on revient en arrière depuis l'étape après la preview, on vide l'image
    if (currentStep === 5) {
      setCardImage(null);
    }
    setCurrentStep(prev => prev - 1);
  };

  const createCampaignFolder = async (campaignData) => {
    try {
      setIsLoading(true);
      
      const campaignFolderName = `campaign_${campaignData.name.replace(/\s+/g, '_').toLowerCase()}`;
  
      // Upload des métadonnées NFT sur IPFS (reste pareil)
      const metadata = {
        name: campaignData.name,
        image: `ipfs://${campaignFolderName}/nft-card.png`,
        external_url: `https://firebase-storage-url/${campaignFolderName}`
      };
  
      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
      const metadataFile = new File([metadataBlob], 'metadata.json');
  
      const ipfsResult = await pinataService.uploadDirectory(campaignFolderName, [
        {
          content: campaignData.cardImage,
          path: `${campaignFolderName}/nft-card.png`
        },
        {
          content: metadataFile,
          path: `${campaignFolderName}/metadata.json`
        }
      ]);
  
      if (!ipfsResult.success) {
        throw new Error("Échec de l'upload des métadonnées NFT");
      }
  
      // Initialiser les dossiers Firebase Storage pour les documents (reste pareil)
      await initializeCampaignFolders(campaignFolderName);
  
      // Stocker description, socials et teamMembers dans Firestore
      await setDoc(doc(db, "campaign_fire", campaignData.name), {
        description: campaignData.description,
        social: campaignData.socials,
        teamMembers: campaignData.teamMembers
      });
  
      // Upload des documents sur Firebase Storage (reste pareil)
      const uploadPromises = [];
      const documents = {};
  
      if (campaignData.documents.whitepaper?.length) {
        uploadPromises.push(
          uploadDocument(campaignFolderName, 'whitepaper', campaignData.documents.whitepaper[0])
            .then(url => { documents.whitepaper = url; })
        );
      }
  
      if (campaignData.documents.pitchDeck?.length) {
        uploadPromises.push(
          uploadDocument(campaignFolderName, 'pitch-deck', campaignData.documents.pitchDeck[0])
            .then(url => { documents.pitchDeck = url; })
        );
      }
  
      if (campaignData.documents.legalDocuments?.length) {
        documents.legal = [];
        uploadPromises.push(
          ...campaignData.documents.legalDocuments.map(doc =>
            uploadDocument(campaignFolderName, 'legal', doc)
              .then(url => { documents.legal.push(url); })
          )
        );
      }
  
      if (campaignData.documents.media?.length) {
        documents.media = [];
        uploadPromises.push(
          ...campaignData.documents.media.map(media =>
            uploadDocument(campaignFolderName, 'media', media)
              .then(url => { documents.media.push(url); })
          )
        );
      }
  
      await Promise.all(uploadPromises);
  
      return {
        success: true,
        ipfsHash: ipfsResult.ipfsHash,
        metadataUri: `ipfs://${ipfsResult.ipfsHash}/${campaignFolderName}/metadata.json`,
        campaignFolderName
      };
  
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
   const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;
    if (isLoading || status === 'success') return;
   
    setIsLoading(true); 
    setStatus('loading');
    setError({});
   
    try {
        // 1. Upload image NFT + création métadonnées minimales sur IPFS
        const result = await createCampaignFolder({
          ...formData,
          cardImage: cardImage
        });
        
        if (!result.success) {
            throw new Error("Échec de l'upload IPFS");
        }
   
        // 2. Convertir les montants en Wei  
        const sharePriceWei = ethers.utils.parseEther(formData.sharePrice);
        const targetAmountWei = sharePriceWei.mul(ethers.BigNumber.from(formData.numberOfShares));
   
        // 3. Obtenir les frais de création
        const campaignFee = await contract.call("getCampaignCreationFeeETH", []);
   
        // 4. Créer le contrat avec les infos fixes uniquement 
        const result2 = await createCampaign({
          args: [
              formData.name,
              formData.symbol,
              targetAmountWei,
              sharePriceWei,
              Math.floor(new Date(formData.endDate).getTime() / 1000),
              formData.sector,
              result.metadataUri,
              ethers.BigNumber.from(formData.royaltyFee),
              formData.logo || ""
          ],
          overrides: {
              value: campaignFee
          }
      });
   
        const receipt = result2.receipt;
        const event = receipt.events.find(e => e.event === 'CampaignCreated');
        const campaignAddress = event.args.campaignAddress;
   
        setTransactionHash(receipt.transactionHash);
        setStatus('success');
        
        // Reset complet du formulaire
        setFormData({
            creatorAddress: '',
            name: '',
            symbol: '',
            sector: '',
            otherSector: '',
            description: '',
            sharePrice: '',
            numberOfShares: '', 
            targetAmount: '',
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
            certified: false,
            lawyer: { address: '', name: '', contact: '', jurisdiction: '' },
            acceptTerms: false,
            socials: {
                website: '',
                twitter: '',
                github: '',
                discord: '',
                telegram: '',
                medium: ''
            },
            metadata: {
                roadmap: '',
                tokenomics: '',
                vesting: '',
                useOfFunds: ''
            },
            investmentTerms: {
                remunerationType: '',
                tokenDistribution: '',
                roi: '',
            },
            companyShares: {
                percentageMinted: '',
                vertePortalLink: '',
            },
            distributeTokens: false,
            vestingPlan: false,
            nftCustomization: {
                backgroundColor: '#ffffff',
                textColor: '#000000',
                logo: null,
                texture: 'default',
            },
            investmentReturns: {
                dividends: { enabled: false },
                airdrops: { enabled: false },
                revenueSplit: { enabled: false },
                customReward: { enabled: false, name: '' }
            },
            verifications: {
                kycCompleted: false,
                legalVerification: false
            }
        });
        setIsLoading(false);
        setStatus('idle');
   
    } catch (error) {
        console.error("Erreur:", error);
        setStatus('error');
        setError({ 
            general: error.code === "INSUFFICIENT_FUNDS" 
                ? "Fonds insuffisants pour créer la campagne" 
                : error.message 
        });
    } finally {
        if (status !== 'success') {
            setIsLoading(false);
        }
    }
 };

  const InfoTooltip = ({ content }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" className="p-0 h-4 w-4 rounded-full">
            <Info className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="text-gray-900 dark:text-gray-100">
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const renderStepContent = () => {
    if (status === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lime-400"></div>
          <p className="text-lg text-gray-850 dark:text-gray-300">Création de la campagne en cours...</p>
        </div>
      );
    }

    if (status === 'success') {
      return (
        <div className="text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Campagne "{formData.name}" créée avec succès!
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            Votre campagne a été créée et est maintenant visible sur la plateforme.
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              Hash de la transaction:
            </p>
            <a 
              href={`https://sepolia.basescan.org/tx/${transactionHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-lime-600 hover:text-lime-700 dark:text-lime-400 dark:hover:text-lime-500 break-all underline"
            >
              {transactionHash}
            </a>
          </div>
          <Button 
            onClick={() => setShowCreateCampaign(false)} 
            className="mt-4 bg-lime-500 hover:bg-lime-600 text-white"
          >
            Fermer
          </Button>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="text-center space-y-4">
          <div className="p-4 bg-red-100 dark:bg-red-900 rounded-lg">
            <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">Échec de la création de la campagne</h3>
            <p className="text-gray-700 dark:text-gray-300">{error.general}</p>
          </div>
          <Button onClick={() => setStatus('idle')} className="mt-4">
            Fermer
          </Button>
        </div>
      );
    }

    switch(currentStep) {
      case 1:
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Informations de Base</h2>
      <div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="creatorAddress" className="text-gray-900 dark:text-gray-100">Adresse du créateur</Label>
          <InfoTooltip content="L'adresse Ethereum du créateur de la campagne" />
        </div>
        <Input
          id="creatorAddress"
          name="creatorAddress"
          readOnly
          className="bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 cursor-not-allowed"
        />
      </div>
      <div>
        <Label htmlFor="name" className="text-gray-900 dark:text-gray-100">Nom de la campagne</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Nom de votre projet"
          required
          className="text-gray-900 dark:text-gray-100"
        />
        {error?.name && <p className="text-red-500 text-sm">{error.name}</p>}
      </div>
      <div>
        <Label htmlFor="symbol" className="text-gray-900 dark:text-gray-100">Symbole</Label>
        <Input
          id="symbol"
          name="symbol"
          value={formData.symbol}
          onChange={handleInputChange}
          placeholder="3-4 caractères (ex: BTC)"
          maxLength={4}
          required
          className="text-gray-900 dark:text-gray-100"
        />
        {error?.symbol && <p className="text-red-500 text-sm">{error.symbol}</p>}
      </div>
      <div>
        <Label htmlFor="sector" className="text-gray-900 dark:text-gray-100">Secteur</Label>
        <Select 
          value={formData.sector}
          onValueChange={(value) => handleSelectChange(value, 'sector')}
        >
          <SelectTrigger className="text-gray-900 dark:text-gray-100">
            <SelectValue placeholder="Choisir un secteur" className="text-gray-900 dark:text-gray-100" />
          </SelectTrigger>
          <SelectContent>
            {SECTORS.map((sector) => (
              <SelectItem key={sector} value={sector} className="text-gray-900 dark:text-gray-100">
                {sector}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error?.sector && <p className="text-red-500 text-sm">{error.sector}</p>}
      </div>
      {formData.sector === 'Autre' && (
        <div>
          <Label htmlFor="otherSector" className="text-gray-900 dark:text-gray-100">Précisez le secteur</Label>
          <Input
            id="otherSector"
            name="otherSector"
            value={formData.otherSector}
            onChange={handleInputChange}
            placeholder="Précisez le secteur d'activité"
            required
            className="text-gray-900 dark:text-gray-100"
          />
          {error?.otherSector && <p className="text-red-500 text-sm">{error.otherSector}</p>}
        </div>
      )}
      
      <div>
        <Label htmlFor="description" className="text-gray-900 dark:text-gray-100">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Description détaillée de votre projet"
          rows={5}
          required
          className="text-gray-900 dark:text-gray-100"
        />
        {error?.description && <p className="text-red-500 text-sm">{error.description}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sharePrice" className="text-gray-900 dark:text-gray-100">Prix par part (ETH)</Label>
          <Input
            id="sharePrice"
            name="sharePrice"
            type="number"
            step="0.000000000000000001"
            value={formData.sharePrice}
            onChange={handleInputChange}
            required
            className="text-gray-900 dark:text-gray-100"
          />
          {error?.sharePrice && <p className="text-red-500 text-sm">{error.sharePrice}</p>}
        </div>
        <div>
          <Label htmlFor="numberOfShares" className="text-gray-900 dark:text-gray-100">Nombre de parts</Label>
          <Input
            id="numberOfShares"
            name="numberOfShares"
            type="number"
            value={formData.numberOfShares}
            onChange={handleInputChange}
            required
            className="text-gray-900 dark:text-gray-100"
          />
          {error?.numberOfShares && <p className="text-red-500 text-sm">{error.numberOfShares}</p>}
        </div>
      </div>
      <div>
        <Label htmlFor="targetAmount" className="text-gray-900 dark:text-gray-100">Objectif Final (ETH)</Label>
        <Input
          id="targetAmount"
          name="targetAmount"
          value={(parseFloat(formData.sharePrice || 0) * parseFloat(formData.numberOfShares || 0)).toFixed(6)}
          readOnly
          className="bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
        />
      </div>
      <div>
        <Label htmlFor="endDate" className="text-gray-900 dark:text-gray-100">Date de fin</Label>
        <Input
          id="endDate"
          name="endDate"
          type="datetime-local"
          value={formData.endDate}
          onChange={handleInputChange}
          required
          className="text-gray-900 dark:text-gray-100"
        />
        {error?.endDate && <p className="text-red-500 text-sm">{error.endDate}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="royaltyFee" className="text-gray-900 dark:text-gray-100">
            Frais de royalties (basis points)
            <InfoTooltip content="100 basis points = 1%" />
          </Label>
          <Input
            id="royaltyFee"
            name="royaltyFee"
            type="number"
            min="0"
            max="10000"
            value={formData.royaltyFee}
            onChange={handleInputChange}
            required
            className="text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <Label htmlFor="royaltyReceiver" className="text-gray-900 dark:text-gray-100">Adresse de réception des royalties</Label>
          <Input
            id="royaltyReceiver"
            name="royaltyReceiver"
            value={formData.royaltyReceiver}
            onChange={handleInputChange}
            placeholder="0x..."
            required
            className="text-gray-900 dark:text-gray-100"
          />
          {error?.royaltyReceiver && <p className="text-red-500 text-sm">{error.royaltyReceiver}</p>}
        </div>
      </div>
    </div>
  );
  case 2:
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Documents et Médias</h2>
        <div>
          <Label htmlFor="whitepaper" className="text-gray-900 dark:text-gray-100">Whitepaper</Label>
          <Input
            id="whitepaper"
            name="whitepaper"
            type="file"
            onChange={(e) => handleFileChange(e, 'whitepaper')}
            accept=".pdf,.doc,.docx"
            required
            className="text-gray-900 dark:text-gray-100"
            key={`whitepaper-${currentStep}`}  // Ajout d'une clé unique
          />
          {error?.whitepaper && <p className="text-red-500 text-sm">{error.whitepaper}</p>}
        </div>
        <div>
          <Label htmlFor="pitchDeck" className="text-gray-900 dark:text-gray-100">Pitch Deck</Label>
          <Input
            id="pitchDeck"
            name="pitchDeck"
            type="file"
            onChange={(e) => handleFileChange(e, 'pitchDeck')}
            accept=".pdf,.ppt,.pptx"
            className="text-gray-900 dark:text-gray-100"
            key={`pitchDeck-${currentStep}`}  // Ajout d'une clé unique
          />
        </div>
        <div>
          <Label htmlFor="legalDocuments" className="text-gray-900 dark:text-gray-100">Documents Légaux</Label>
          <Input
            id="legalDocuments"
            name="legalDocuments"
            type="file"
            onChange={(e) => handleFileChange(e, 'legalDocuments')}
            accept=".pdf,.doc,.docx"
            multiple
            className="text-gray-900 dark:text-gray-100"
            key={`legalDocuments-${currentStep}`}  // Ajout d'une clé unique
          />
        </div>
        <div>
          <Label htmlFor="media" className="text-gray-900 dark:text-gray-100">Médias (images, vidéos)</Label>
          <Input
            id="media"
            name="media"
            type="file"
            onChange={(e) => handleFileChange(e, 'media')}
            accept="image/*,video/*"
            multiple
            className="text-gray-900 dark:text-gray-100"
            key={`media-${currentStep}`}  // Ajout d'une clé unique
          />
        </div>
        {['whitepaper', 'pitchDeck', 'legalDocuments', 'media'].map((field) => (
          formData.documents[field] && formData.documents[field].length > 0 && (
            <div key={field} className="mt-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {field.charAt(0).toUpperCase() + field.slice(1)}:
              </h3>
              <ul className="list-disc pl-5">
                {Array.isArray(formData.documents[field]) ? (
                  formData.documents[field].map((file, index) => (
                    <li key={index} className="flex justify-between items-center">
                      <span className="text-gray-900 dark:text-gray-100">{file.name}</span>
                      <Button
                        onClick={() => removeFile(index, field)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))
                ) : (
                  <li className="flex justify-between items-center">
                    <span className="text-gray-900 dark:text-gray-100">{formData.documents[field].name}</span>
                    <Button
                      onClick={() => removeFile(0, field)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                )}
              </ul>
            </div>
          )
        ))}
      </div>
    );
      case 3:
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Réseaux Sociaux et Équipe</h2>
      
      {/* Réseaux sociaux du projet */}
      <div className="space-y-4 mb-8">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Réseaux Sociaux du Projet</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="website" className="text-gray-900 dark:text-gray-100">Site Web</Label>
            <Input
              id="website"
              name="website"
              value={formData.socials.website}
              onChange={(e) => handleNestedInputChange(e, 'socials')}
              placeholder="https://"
              className="text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <Label htmlFor="twitter" className="text-gray-900 dark:text-gray-100">Twitter</Label>
            <Input
              id="twitter"
              name="twitter"
              value={formData.socials.twitter}
              onChange={(e) => handleNestedInputChange(e, 'socials')}
              placeholder="@username"
              className="text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <Label htmlFor="github" className="text-gray-900 dark:text-gray-100">GitHub</Label>
            <Input
              id="github"
              name="github"
              value={formData.socials.github}
              onChange={(e) => handleNestedInputChange(e, 'socials')}
              placeholder="username"
              className="text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <Label htmlFor="discord" className="text-gray-900 dark:text-gray-100">Discord</Label>
            <Input
              id="discord"
              name="discord"
              value={formData.socials.discord}
              onChange={(e) => handleNestedInputChange(e, 'socials')}
              placeholder="Invite Link"
              className="text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <Label htmlFor="telegram" className="text-gray-900 dark:text-gray-100">Telegram</Label>
            <Input
              id="telegram"
              name="telegram"
              value={formData.socials.telegram}
              onChange={(e) => handleNestedInputChange(e, 'socials')}
              placeholder="t.me/"
              className="text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <Label htmlFor="medium" className="text-gray-900 dark:text-gray-100">Medium</Label>
            <Input
              id="medium"
              name="medium"
              value={formData.socials.medium}
              onChange={(e) => handleNestedInputChange(e, 'socials')}
              placeholder="@username"
              className="text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Section équipe */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Membres de l'équipe</h3>
        {formData.teamMembers.map((member, index) => (
          <div key={index} className="mb-4 p-4 border rounded-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Membre {index + 1}</h3>
              {index > 0 && (
                <Button
                  onClick={() => removeTeamMember(index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Nom"
                value={member.name}
                onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                className="text-gray-900 dark:text-gray-100"
              />
              <Input
                placeholder="Rôle"
                value={member.role}
                onChange={(e) => handleTeamMemberChange(index, 'role', e.target.value)}
                className="text-gray-900 dark:text-gray-100"
              />
              <Input
                placeholder="Twitter"
                value={member.socials.twitter}
                onChange={(e) => handleTeamMemberChange(index, 'socials', e.target.value, 'twitter')}
                className="text-gray-900 dark:text-gray-100"
              />
              <Input
                placeholder="LinkedIn"
                value={member.socials.linkedin}
                onChange={(e) => handleTeamMemberChange(index, 'socials', e.target.value, 'linkedin')}
                className="text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        ))}
        <Button onClick={addTeamMember} type="button" className="mt-2">
          <Plus className="mr-2 h-4 w-4" /> Ajouter un membre
        </Button>
      </div>
    </div>
  );
      case 4:
  return (
    <div className="flex flex-col space-y-6 w-full">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
        Prévisualisation du NFT
      </h2>
      
      {/* Preview mis à jour avec les données du formulaire */}
      <div className="w-full flex justify-center mb-6">
        <div ref={cardRef}>
          <CompanySharesNFTCard
            name={formData.name}
            creatorAddress={formData.creatorAddress}
            tokenId="Preview"
            sector={formData.sector === 'Autre' ? formData.otherSector : formData.sector}
            issueDate={new Date().toLocaleDateString()}
            smartContract={contractAddress}
            backgroundColor={formData.nftCustomization.backgroundColor}
            textColor={formData.nftCustomization.textColor}
            logoUrl={formData.nftCustomization.logo}
            niveauLivar={false ? "vert" : "orange"}
            investmentReturns={formData.investmentReturns}
            isPreview={true}
          />
        </div>
      </div>

      {/* Contrôles de personnalisation */}
      <div className="w-full space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div>
          <Label className="text-gray-900 dark:text-gray-100">Logo de la campagne</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setFormData(prev => ({
                  ...prev,
                  nftCustomization: {
                    ...prev.nftCustomization,
                    logo: file
                  }
                }));
              }
            }}
            className="text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-900 dark:text-gray-100">Couleur de fond</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="color"
                value={formData.nftCustomization.backgroundColor}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    nftCustomization: {
                      ...prev.nftCustomization,
                      backgroundColor: e.target.value
                    }
                  }));
                }}
                className="h-10 w-16"
              />
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {formData.nftCustomization.backgroundColor}
              </span>
            </div>
          </div>

          <div>
            <Label className="text-gray-900 dark:text-gray-100">Couleur du texte</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="color"
                value={formData.nftCustomization.textColor}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    nftCustomization: {
                      ...prev.nftCustomization,
                      textColor: e.target.value
                    }
                  }));
                }}
                className="h-10 w-16"
              />
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {formData.nftCustomization.textColor}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Vérification et Soumission</h2>
            <div className="space-y-2">
              <h3 className="font-semibold">Résumé de la campagne</h3>
              <p className="text-gray-900 dark:text-gray-100"><strong className="text-gray-900 dark:text-gray-100">Nom:</strong> {formData.name}</p>
              <p><strong>Symbole:</strong> {formData.symbol}</p>
              <p><strong>Secteur:</strong> {formData.sector}</p>
              <p><strong>Objectif:</strong> {(parseFloat(formData.sharePrice || 0) * parseFloat(formData.numberOfShares || 0)).toFixed(6)} ETH</p>
              <p><strong>Date de fin:</strong> {new Date(formData.endDate).toLocaleString()}</p>
            </div>
            <Alert>
              <AlertDescription>
                Veuillez vérifier attentivement toutes les informations avant de soumettre votre campagne.
                Une fois soumise, ces informations ne pourront plus être modifiées.
              </AlertDescription>
            </Alert>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="acceptTerms"
                checked={formData.acceptTerms}
                onCheckedChange={() => handleCheckboxChange('acceptTerms')}
              />
              <Label htmlFor="acceptTerms">
                J'accepte les conditions générales et je confirme que toutes les informations fournies sont exactes.
              </Label>
            </div>
            {error?.terms && <p className="text-red-500 text-sm">{error.terms}</p>}
            {error?.general && <p className="text-red-500 text-sm">{error.general}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
        <DialogTitle className="text-gray-900 dark:text-gray-100">Créer une nouvelle campagne</DialogTitle>
        <DialogDescription className="text-gray-900 dark:text-gray-100">
            Remplissez les informations nécessaires pour lancer votre campagne de financement.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[60vh] px-4">
            {renderStepContent()}
          </ScrollArea>
          <div className="mt-4 flex justify-between">
            {currentStep > 1 && status === 'idle' && (
              <Button type="button" onClick={handlePreviousStep}>
                Précédent
              </Button>
            )}
            {currentStep < 4 && status === 'idle' && (
              <Button type="button" onClick={handleNextStep}>
                Suivant
              </Button>
            )}
           {currentStep === 4 && status === 'idle' && (
  <Button type="button" onClick={handleNextStep} className="bg-lime-500 hover:bg-lime-600 text-white">
    Suivant
  </Button>
)}

{currentStep === 5 && status === 'idle' && (
  <Button 
    type="submit" 
    disabled={!formData.acceptTerms || isLoading}
    className="bg-lime-500 hover:bg-lime-600 text-white"
  >
    {isLoading ? 'Création en cours...' : 'Créer la campagne'}
  </Button>
)}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
