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
import CompanySharesNFTCard from "@/components/nft/CompanySharesNFTCard";
import { pinataService } from '@/lib/services/storage';
import html2canvas from 'html2canvas';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from "@/lib/firebase/firebase";
import { setDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';


const SECTORS = [
  "Blockchain", "Finance", "Industrie", "Tech", "Influence", "Gaming",
  "NFT", "DeFi", "DAO", "Infrastructure", "Autre"
];



export default function CampaignModal({ showCreateCampaign, setShowCreateCampaign, handleCreateCampaign }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepValidated, setStepValidated] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [transactionHash, setTransactionHash] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const address = useAddress();
  const [uploadStatus, setUploadStatus] = useState('');
  const [nftImageUpload, setNftImageUpload] = useState(null);
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
      "stateMutability": "payable"
    },
    {
      "type": "event",
      "name": "CampaignCreated",
      "inputs": [
        { "type": "address", "name": "campaignAddress", "indexed": true },
        { "type": "address", "name": "startup", "indexed": true },
        { "type": "string", "name": "name", "indexed": false },
        { "type": "bool", "name": "certified", "indexed": false },
        { "type": "address", "name": "lawyer", "indexed": true },
        { "type": "uint256", "name": "timestamp", "indexed": false }
      ]
    },
    {
      "type": "function",
      "name": "CAMPAIGN_CREATION_FEE",
      "inputs": [],
      "outputs": [{ "type": "uint256" }],
      "stateMutability": "view"
    }
  ];
  const RenderPreview = () => {
    const previewCanvasRef = useRef(null);
    const [previewError, setPreviewError] = useState(null);
  
    useEffect(() => {
      const updatePreview = async () => {
        if (!cardRef.current || !previewCanvasRef.current) return;
  
        try {
          const canvas = await html2canvas(cardRef.current, {
            scale: 1,
            useCORS: true,
            allowTaint: true,
            backgroundColor: formData.backgroundColor,
            onclone: (clonedDoc) => {
              const clonedElement = clonedDoc.querySelector('#nft-card');
              if (clonedElement) {
                clonedElement.style.transform = 'none';
              }
            }
          });
  
          const previewCanvas = previewCanvasRef.current;
          const ctx = previewCanvas.getContext('2d');
          ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
          ctx.drawImage(
            canvas, 
            0, 
            0, 
            previewCanvas.width, 
            previewCanvas.height
          );
          setPreviewError(null);
        } catch (error) {
          console.error("Erreur prévisualisation:", error);
          setPreviewError("Erreur lors de la génération de la prévisualisation");
        }
      };
  
      const timeoutId = setTimeout(updatePreview, 500);
      return () => clearTimeout(timeoutId);
    }, [formData, cardRef]);
  
    return (
      <div className="relative">
        <canvas
          ref={previewCanvasRef}
          width="400"
          height="300"
          className="border border-gray-200 rounded-lg shadow-sm"
        />
        {previewError && (
          <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-red-100 bg-opacity-75 rounded-lg">
            <p className="text-red-600">{previewError}</p>
          </div>
        )}
      </div>
    );
  };

  const { contract } = useContract(contractAddress, contractABI);
  const { mutateAsync: createCampaign, isLoading: writeLoading } = useContractWrite(contract, "createCampaign");
  const cardRef = useRef(null);

  const [formData, setFormData] = useState({
    creatorAddress: address || '',
    name: '',
    symbol: '',
    sector: '',
    otherSector: '',
    description: '',
    sharePrice: '0',
    numberOfShares: '0',
    targetAmount: '0',
    endDate: '',
    royaltyFee: '0',
    royaltyReceiver: address || '',
    investmentReturns: {
        dividends: {
            enabled: false,
            details: {
                frequency: '',
                percentage: '',
                conditions: ''
            }
        },
        airdrops: {
            enabled: false,
            details: {
                tokenType: '',
                amount: '',
                frequency: '',
                conditions: ''
            }
        },
        governance: {
            enabled: false,
            details: {
                votingRights: '',
                proposalRights: '',
                scope: ''
            }
        },
        earlyAccess: {
            enabled: false,
            details: {
                productType: '',
                discountPercentage: '',
                duration: ''
            }
        },
        revenueSplit: {
            enabled: false,
            details: {
                percentage: '',
                frequency: '',
                threshold: ''
            }
        },
        customReward: {
            enabled: false,
            name: '',
            description: '',
            conditions: ''
        }
    },
    documents: [],
    whitepaper: null,
    pitchDeck: null,
    legalDocuments: null,
    media: [],
    teamMembers: [{ 
        name: '', 
        role: '', 
        socials: { 
            twitter: '', 
            linkedin: '' 
        } 
    }],
    certified: false,
    lawyer: { 
        address: '', 
        name: '', 
        contact: '', 
        jurisdiction: '' 
    },
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
        roi: ''
    },
    companyShares: {
        percentageMinted: '',
        vertePortalLink: ''
    },
    distributeTokens: false,
    vestingPlan: false,
    logo: null,
    backgroundColor: '#1a1b1e',
    textColor: '#ffffff'
});
  
  useEffect(() => {
    if (!contract) {
      console.error("Contract n'est pas initialisé");
      return;
    }
    console.log("Contract initialisé:", contract);
    console.log("Contract address:", contractAddress);
    
    const testContract = async () => {
      try {
        if (contract.call) {
          const fee = await contract.call("CAMPAIGN_CREATION_FEE");
          console.log("Frais de création:", fee.toString());
        }
      } catch (error) {
        console.error("Erreur test contrat:", error);
      }
    };
  
    testContract();
  }, [contract]);

  const handleFileChange = (e, field) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        [field]: newFiles // Toujours assigner un tableau
      }));
    }
  };
  
  // Pour la suppression des fichiers
  const removeFile = (index, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index) // Garder un tableau même vide
    }));
  };

  
  const createNFTMetadata = async (cardRef) => {
    try {
      const cardElement = cardRef.current;
      const canvas = await html2canvas(cardElement);
      const cardBlob = await new Promise(resolve => canvas.toBlob(resolve));
      
      // Créer un objet base avec l'image du NFT
      const metadata = await nftStorage.store({
        name: formData.name,
        description: formData.description,
        image: new File([cardBlob], 'nft-card.png', { type: 'image/png' }),
        properties: {
          symbol: formData.symbol,
          backgroundColor: formData.backgroundColor,
          textColor: formData.textColor,
          creatorAddress: formData.creatorAddress,
          sharePrice: formData.sharePrice,
          totalShares: formData.numberOfShares,
          royaltyFee: formData.royaltyFee,
          sector: formData.sector,
          teamMembers: formData.teamMembers,
          certified: formData.certified,
          optionsRemuneration: formData.optionsRemuneration
        }
      });
  
      // Si un logo existe, l'ajouter aux propriétés
      if (formData.logo) {
        const logoBlob = await fetch(formData.logo).then(r => r.blob());
        metadata.properties.logo = new File([logoBlob], 'logo.png', { type: 'image/png' });
      }
  
      return metadata;
    } catch (error) {
      console.error("Erreur lors de la création des métadonnées:", error);
      throw error;
    }
  };

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

  

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
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
        if (!formData.sharePrice || parseFloat(formData.sharePrice) <= 0) errors.sharePrice = "Le prix par part doit être supérieur à 0";
        if (!formData.numberOfShares || parseInt(formData.numberOfShares) <= 0) errors.numberOfShares = "Le nombre de parts doit être supérieur à 0";
        if (!formData.endDate || new Date(formData.endDate).getTime() <= Date.now()) {
          errors.endDate = "La date de fin doit être dans le futur";
        }
        break;
      case 2:
        if (!formData.whitepaper) errors.whitepaper = "Le whitepaper est requis";
        if (!formData.description) errors.description = "La description est requise";
        break;
      case 3:
        if (formData.teamMembers.length === 0) errors.team = "Au moins un membre d'équipe est requis";
        if (formData.certified) {
          if (!formData.lawyer.address) errors.lawyer = "L'adresse de l'avocat est requise pour une campagne certifiée";
          if (!formData.lawyer.name) errors.lawyerName = "Le nom de l'avocat est requis";
          if (!formData.lawyer.contact) errors.lawyerContact = "Le contact de l'avocat est requis";
          if (!formData.lawyer.jurisdiction) errors.lawyerJurisdiction = "La juridiction de l'avocat est requise";
        }
        break;
      case 4:
        if (!formData.acceptTerms) errors.terms = "Vous devez accepter les conditions";
        break;
      default:
        break;
    }
    setError(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setStepValidated(prev => ({
        ...prev,
        [currentStep]: true
      }));
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => prev - 1);
  };
  
  const getRewardBadgesForSVG = (investmentReturns) => {
    const badges = [];
    if (investmentReturns?.dividends?.enabled) badges.push('Dividendes');
    if (investmentReturns?.airdrops?.enabled) badges.push('Airdrops');
    if (investmentReturns?.revenueSplit?.enabled) badges.push('Revenue Split');
    if (investmentReturns?.customReward?.enabled) badges.push(investmentReturns.customReward.name);
    return badges;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;
    
    setIsLoading(true);
    setStatus('loading');
    setError({});
    
    try {
      // Génération du SVG
      // Remplacer la génération du SVG existante par celle-ci:
const nftSVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 700">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&amp;display=swap');
      .card { filter: drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.1)); }
      .rounded { border-radius: 16px; }
      .badge { border-radius: 9999px; }
    </style>
  </defs>
  <rect width="500" height="700" fill="${formData.backgroundColor}" rx="16" ry="16" class="card rounded"/>
  
  <!-- Header -->
  <g transform="translate(0, 40)">
    <text x="250" y="0" 
      font-family="Inter, sans-serif" 
      font-size="32" 
      font-weight="bold" 
      fill="${formData.textColor}" 
      text-anchor="middle"
    >${formData.name}</text>
    <text x="250" y="40" 
      font-family="Inter, sans-serif" 
      font-size="20" 
      fill="${formData.textColor}" 
      text-anchor="middle"
    >Tokenized Equity</text>
  </g>

  <!-- Logo -->
  <g transform="translate(200, 150)">
    <circle cx="50" cy="50" r="48" fill="${formData.textColor}" class="rounded"/>
    ${formData.logo ? `
      <image 
        x="2" 
        y="2" 
        width="96" 
        height="96" 
        href="${formData.logo}" 
        clip-path="url(#logoClip)"
      />
    ` : `
      <path d="M35 70v-40 M50 60v-40 M65 50v-40" 
        stroke="${formData.backgroundColor}" 
        stroke-width="3"
      />
    `}
  </g>

  <!-- Info Section -->
  <g transform="translate(50, 300)">
    <text font-family="Inter, sans-serif" font-size="16" fill="${formData.textColor}">
      <tspan x="0" y="0">Deployer: ${formData.creatorAddress.slice(0, 6)}...${formData.creatorAddress.slice(-4)}</tspan>
      <tspan x="0" y="40">Token ID: 1</tspan>
      <tspan x="0" y="80">Issued: ${new Date().toISOString().split('T')[0]}</tspan>
      <tspan x="0" y="120">Funding Round: Seed</tspan>
    </text>
  </g>

  <!-- Total Shares Box -->
  <rect x="40" y="500" width="420" height="50" 
    fill="${formData.textColor}20" 
    rx="8" 
    ry="8"
  />
  <text x="50" y="530" 
    font-family="Inter, sans-serif" 
    font-size="16" 
    fill="${formData.textColor}"
  >Total Shares: ${formData.numberOfShares}</text>

  <!-- Rewards Section -->
  <g transform="translate(40, 580)">
    <!-- Badges -->
    ${getRewardBadgesForSVG(formData.investmentReturns).map((badge, i) => `
      <g transform="translate(${i * 110}, 0)">
        <rect width="100" height="30" 
          fill="${formData.textColor}20" 
          rx="15" 
          ry="15"
        />
        <text x="50" y="20" 
          font-family="Inter, sans-serif" 
          font-size="14" 
          fill="${formData.textColor}" 
          text-anchor="middle"
        >${badge}</text>
      </g>
    `).join('')}
  </g>

  <!-- Livar Badge -->
  <g transform="translate(380, 580)">
    <rect width="80" height="30" 
      fill="${formData.certified ? '#10B981' : '#F97316'}" 
      rx="15" 
      ry="15"
    />
    <text x="40" y="20" 
      font-family="Inter, sans-serif" 
      font-size="14" 
      fill="white" 
      text-anchor="middle"
    >Livar</text>
  </g>
</svg>`;;

      // Convertir le SVG en fichier
      const blob = new Blob([nftSVG], { type: 'image/svg+xml' });
      const nftFile = new File([blob], `${formData.name}-nft.svg`, { type: 'image/svg+xml' });

      // Upload NFT sur Pinata
      const nftImageUpload = await pinataService.uploadFile(nftFile, {
        pinataMetadata: {
          name: `${formData.name} NFT`,
          keyvalues: {
            type: 'nft-image',
            symbol: formData.symbol
          }
        }
      });

      console.log("Réponse de Pinata:", nftImageUpload);

      // Upload documents sur Firebase
      const storage = getStorage();
      const documentsUrls = {};

      if (formData.whitepaper?.length) {
        const whitepaperRef = ref(storage, `projects/${formData.name}/whitepaper/${formData.whitepaper[0].name}`);
        await uploadBytes(whitepaperRef, formData.whitepaper[0]);
        documentsUrls.whitepaper = await getDownloadURL(whitepaperRef);
      }

      if (formData.pitchDeck?.length) {
        const pitchDeckRef = ref(storage, `projects/${formData.name}/pitchDeck/${formData.pitchDeck[0].name}`);
        await uploadBytes(pitchDeckRef, formData.pitchDeck[0]);
        documentsUrls.pitchDeck = await getDownloadURL(pitchDeckRef);
      }

      if (formData.legalDocuments?.length) {
        const legalDocsPromises = formData.legalDocuments.map(async (doc) => {
          const docRef = ref(storage, `projects/${formData.name}/legal/${doc.name}`);
          await uploadBytes(docRef, doc);
          return getDownloadURL(docRef);
        });
        documentsUrls.legal = await Promise.all(legalDocsPromises);
      }

      // Création et upload métadonnées
      const nftMetadata = {
        name: formData.name,
        description: formData.description,
        image: nftImageUpload.gatewayUrl,
        properties: {
          symbol: formData.symbol,
          backgroundColor: formData.backgroundColor,
          textColor: formData.textColor,
          creatorAddress: formData.creatorAddress,
          sharePrice: formData.sharePrice,
          totalShares: formData.numberOfShares,
          royaltyFee: formData.royaltyFee,
          sector: formData.sector,
          teamMembers: formData.teamMembers,
          certified: formData.certified,
          documents: documentsUrls,
          optionsRemuneration: formData.optionsRemuneration
        }
      };

      const metadataUpload = await pinataService.uploadJSON(nftMetadata, {
        name: `${formData.name}-metadata`
      });

      // Sauvegarde Firebase
     // Sauvegarde Firebase
const projectData = {
  name: formData.name,
  symbol: formData.symbol,
  description: formData.description,
  sector: formData.sector,
  creatorAddress: address,
  team: formData.teamMembers,
  documents: documentsUrls,
  certified: formData.certified,
  createdAt: serverTimestamp(),
  nftMetadata: metadataUpload.gatewayUrl,
  investmentReturns: {
    dividends: formData.investmentReturns.dividends.enabled ? {
      frequency: formData.investmentReturns.dividends.details.frequency,
      percentage: formData.investmentReturns.dividends.details.percentage,
      conditions: formData.investmentReturns.dividends.details.conditions
    } : null,
    airdrops: formData.investmentReturns.airdrops.enabled ? {
      tokenType: formData.investmentReturns.airdrops.details.tokenType,
      amount: formData.investmentReturns.airdrops.details.amount,
      frequency: formData.investmentReturns.airdrops.details.frequency
    } : null,
    revenueSplit: formData.investmentReturns.revenueSplit.enabled ? {
      percentage: formData.investmentReturns.revenueSplit.details.percentage,
      frequency: formData.investmentReturns.revenueSplit.details.frequency,
      threshold: formData.investmentReturns.revenueSplit.details.threshold
    } : null,
    customReward: formData.investmentReturns.customReward.enabled ? {
      name: formData.investmentReturns.customReward.name,
      description: formData.investmentReturns.customReward.description,
      conditions: formData.investmentReturns.customReward.conditions
    } : null
  }
};

await setDoc(doc(db, "projects", formData.name), projectData);

      // Déploiement blockchain
      if (!contract) {
        throw new Error("Contract non initialisé");
      }

      const targetAmount = ethers.utils.parseEther(
        (parseFloat(formData.sharePrice) * parseFloat(formData.numberOfShares)).toString()
      );
      const sharePrice = ethers.utils.parseEther(formData.sharePrice);

      console.log("Paramètres de la transaction:", {
        name: formData.name,
        symbol: formData.symbol,
        targetAmount: targetAmount.toString(),
        sharePrice: sharePrice.toString(),
        endTime: Math.floor(new Date(formData.endDate).getTime() / 1000),
        sector: formData.sector,
        metadataUrl: metadataUpload.gatewayUrl,
        royaltyFee: formData.royaltyFee
      });

      const tx = await createCampaign({
        args: [
          formData.name,
          formData.symbol,
          targetAmount,
          sharePrice,
          Math.floor(new Date(formData.endDate).getTime() / 1000),
          formData.sector,
          metadataUpload.gatewayUrl,
          formData.royaltyFee,
          formData.logo || ""
        ],
        overrides: {
          value: ethers.utils.parseEther("0.05"),
          gasLimit: 3000000
        }
      });

      console.log("Transaction envoyée:", tx);
      const receipt = await tx.wait();
      setTransactionHash(receipt.transactionHash);

      // Mise à jour Firebase avec les infos de la transaction
      await updateDoc(doc(db, "projects", formData.name), {
        contractAddress: receipt.contractAddress,
        transactionHash: receipt.transactionHash
      });

      setStatus('success');
    } catch (error) {
      console.error("Erreur détaillée:", error);
      setStatus('error');
      
      // Message d'erreur plus descriptif selon le type d'erreur
      if (error.code === 4001) {
        setError({
          general: "Transaction rejetée. Vous pouvez réessayer quand vous voulez."
        });
      } else if (error.message?.includes('insufficient funds')) {
        setError({
          general: "Fonds insuffisants pour créer la campagne. Vérifiez que vous avez assez d'ETH pour couvrir les frais (0.05 ETH + gas)."
        });
      } else {
        setError({
          general: error.message || "Une erreur est survenue lors de la création de la campagne. Veuillez réessayer."
        });
      }
    } finally {
      setIsLoading(false);
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
          <p className="text-lg text-gray-850 dark:text-gray-300">
            Création de la campagne en cours...
          </p>
          {uploadStatus && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {uploadStatus}
            </p>
          )}
        </div>
      );
    }
  
    if (status === 'error') {
      return (
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 backdrop-blur-sm w-full max-w-lg rounded-xl p-8 border border-red-500/20 shadow-xl">
            <h3 className="text-2xl font-semibold text-red-400 text-center mb-2">
              Transaction échouée
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="bg-red-950/20 rounded-lg p-4 border border-red-500/20">
                <p className="text-base text-gray-200">
                  La création de votre campagne n'a pas pu être finalisée car la transaction a été rejetée.
                </p>
              </div>
              
              <div className="bg-neutral-900/50 rounded-lg p-4 text-sm text-gray-400 font-mono">
                <p className="mb-2">Détails de l'erreur :</p>
                <div className="text-xs overflow-x-auto">
                  {error.general}
                </div>
              </div>
            </div>
  
            <div className="flex justify-center gap-4 pt-2">
              <Button 
                onClick={() => {
                  setStatus('idle');
                  setError({});
                }}
                className="bg-lime-500 hover:bg-lime-600 text-white px-8 py-2 rounded-full transition-all duration-200 transform hover:scale-105"
              >
                Réessayer
              </Button>
              <Button 
                onClick={() => setShowCreateCampaign(false)}
                variant="outline"
                className="border border-red-500/50 text-red-400 hover:bg-red-950/30 px-8 py-2 rounded-full transition-all duration-200"
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (status === 'success') {
      return (
        <div className="text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h3 className="text-2xl font-bold">Campagne "{formData.name}" créée avec succès!</h3>
          <p>Votre campagne a été créée et est maintenant visible sur la plateforme.</p>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
            <p className="font-semibold">Hash de la transaction:</p>
            <a 
              href={`https://sepolia.basescan.org/tx/${transactionHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline break-all"
            >
              {transactionHash}
            </a>
          </div>
          <Button onClick={() => setShowCreateCampaign(false)} className="mt-4">
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
                value={formData.creatorAddress}
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
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Description et Documents</h2>
                  
                  <div className="mb-6">
                      <Label htmlFor="description" className="text-gray-900 dark:text-gray-100">Description du Projet</Label>
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
      
                  {/* Section Retours sur Investissement */}
                  <div className="border rounded-lg p-4 space-y-4 mb-6">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Options de Retour sur Investissement</h3>
                      
                      {/* Dividendes */}
                      <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                              <Checkbox
                                  checked={formData.investmentReturns.dividends.enabled}
                                  onCheckedChange={(checked) => {
                                      setFormData(prev => ({
                                          ...prev,
                                          investmentReturns: {
                                              ...prev.investmentReturns,
                                              dividends: {
                                                  ...prev.investmentReturns.dividends,
                                                  enabled: checked
                                              }
                                          }
                                      }));
                                  }}
                              />
                              <Label className="text-gray-900 dark:text-gray-100">Distribution de Dividendes</Label>
                          </div>
                          
                          {formData.investmentReturns.dividends.enabled && (
                              <div className="ml-6 space-y-2">
                                  <Select
                                      value={formData.investmentReturns.dividends.details.frequency}
                                      onValueChange={(value) => {
                                          setFormData(prev => ({
                                              ...prev,
                                              investmentReturns: {
                                                  ...prev.investmentReturns,
                                                  dividends: {
                                                      ...prev.investmentReturns.dividends,
                                                      details: {
                                                          ...prev.investmentReturns.dividends.details,
                                                          frequency: value
                                                      }
                                                  }
                                              }
                                          }));
                                      }}
                                  >
                                      <SelectTrigger className="text-gray-900 dark:text-gray-100">
                                          <SelectValue placeholder="Fréquence de distribution" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="monthly">Mensuelle</SelectItem>
                                          <SelectItem value="quarterly">Trimestrielle</SelectItem>
                                          <SelectItem value="annual">Annuelle</SelectItem>
                                      </SelectContent>
                                  </Select>
      
                                  <Input
                                      type="number"
                                      placeholder="Pourcentage des bénéfices (%)"
                                      value={formData.investmentReturns.dividends.details.percentage}
                                      onChange={(e) => {
                                          setFormData(prev => ({
                                              ...prev,
                                              investmentReturns: {
                                                  ...prev.investmentReturns,
                                                  dividends: {
                                                      ...prev.investmentReturns.dividends,
                                                      details: {
                                                          ...prev.investmentReturns.dividends.details,
                                                          percentage: e.target.value
                                                      }
                                                  }
                                              }
                                          }));
                                      }}
                                      className="text-gray-900 dark:text-gray-100"
                                  />
      
                                  <Input
                                      placeholder="Conditions spécifiques (optionnel)"
                                      value={formData.investmentReturns.dividends.details.conditions}
                                      onChange={(e) => {
                                          setFormData(prev => ({
                                              ...prev,
                                              investmentReturns: {
                                                  ...prev.investmentReturns,
                                                  dividends: {
                                                      ...prev.investmentReturns.dividends,
                                                      details: {
                                                          ...prev.investmentReturns.dividends.details,
                                                          conditions: e.target.value
                                                      }
                                                  }
                                              }
                                          }));
                                      }}
                                      className="text-gray-900 dark:text-gray-100"
                                  />
                              </div>
                          )}
                      </div>
      
                      {/* Airdrops */}
                      <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                              <Checkbox
                                  checked={formData.investmentReturns.airdrops.enabled}
                                  onCheckedChange={(checked) => {
                                      setFormData(prev => ({
                                          ...prev,
                                          investmentReturns: {
                                              ...prev.investmentReturns,
                                              airdrops: {
                                                  ...prev.investmentReturns.airdrops,
                                                  enabled: checked
                                              }
                                          }
                                      }));
                                  }}
                              />
                              <Label className="text-gray-900 dark:text-gray-100">Airdrops</Label>
                          </div>
      
                          {formData.investmentReturns.airdrops.enabled && (
                              <div className="ml-6 space-y-2">
                                  <Input
                                      placeholder="Type de token"
                                      value={formData.investmentReturns.airdrops.details.tokenType}
                                      onChange={(e) => {
                                          setFormData(prev => ({
                                              ...prev,
                                              investmentReturns: {
                                                  ...prev.investmentReturns,
                                                  airdrops: {
                                                      ...prev.investmentReturns.airdrops,
                                                      details: {
                                                          ...prev.investmentReturns.airdrops.details,
                                                          tokenType: e.target.value
                                                      }
                                                  }
                                              }
                                          }));
                                      }}
                                      className="text-gray-900 dark:text-gray-100"
                                  />
                                  <Input
                                      type="number"
                                      placeholder="Quantité par NFT"
                                      value={formData.investmentReturns.airdrops.details.amount}
                                      onChange={(e) => {
                                          setFormData(prev => ({
                                              ...prev,
                                              investmentReturns: {
                                                  ...prev.investmentReturns,
                                                  airdrops: {
                                                      ...prev.investmentReturns.airdrops,
                                                      details: {
                                                          ...prev.investmentReturns.airdrops.details,
                                                          amount: e.target.value
                                                      }
                                                  }
                                              }
                                          }));
                                      }}
                                      className="text-gray-900 dark:text-gray-100"
                                  />
                                  <Select
                                      value={formData.investmentReturns.airdrops.details.frequency}
                                      onValueChange={(value) => {
                                          setFormData(prev => ({
                                              ...prev,
                                              investmentReturns: {
                                                  ...prev.investmentReturns,
                                                  airdrops: {
                                                      ...prev.investmentReturns.airdrops,
                                                      details: {
                                                          ...prev.investmentReturns.airdrops.details,
                                                          frequency: value
                                                      }
                                                  }
                                              }
                                          }));
                                      }}
                                  >
                                      <SelectTrigger className="text-gray-900 dark:text-gray-100">
                                          <SelectValue placeholder="Fréquence des airdrops" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="monthly">Mensuel</SelectItem>
                                          <SelectItem value="quarterly">Trimestriel</SelectItem>
                                          <SelectItem value="annual">Annuel</SelectItem>
                                          <SelectItem value="oneTime">Unique</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                          )}
                      </div>
      
                      {/* Partage des revenus */}
                      <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                              <Checkbox
                                  checked={formData.investmentReturns.revenueSplit.enabled}
                                  onCheckedChange={(checked) => {
                                      setFormData(prev => ({
                                          ...prev,
                                          investmentReturns: {
                                              ...prev.investmentReturns,
                                              revenueSplit: {
                                                  ...prev.investmentReturns.revenueSplit,
                                                  enabled: checked
                                              }
                                          }
                                      }));
                                  }}
                              />
                              <Label className="text-gray-900 dark:text-gray-100">Partage des Revenus</Label>
                          </div>
      
                          {formData.investmentReturns.revenueSplit.enabled && (
                              <div className="ml-6 space-y-2">
                                  <Input
                                      type="number"
                                      placeholder="Pourcentage du chiffre d'affaires (%)"
                                      value={formData.investmentReturns.revenueSplit.details.percentage}
                                      onChange={(e) => {
                                          setFormData(prev => ({
                                              ...prev,
                                              investmentReturns: {
                                                  ...prev.investmentReturns,
                                                  revenueSplit: {
                                                      ...prev.investmentReturns.revenueSplit,
                                                      details: {
                                                          ...prev.investmentReturns.revenueSplit.details,
                                                          percentage: e.target.value
                                                      }
                                                  }
                                              }
                                          }));
                                      }}
                                      className="text-gray-900 dark:text-gray-100"
                                  />
                                  <Select
                                      value={formData.investmentReturns.revenueSplit.details.frequency}
                                      onValueChange={(value) => {
                                          setFormData(prev => ({
                                              ...prev,
                                              investmentReturns: {
                                                  ...prev.investmentReturns,
                                                  revenueSplit: {
                                                      ...prev.investmentReturns.revenueSplit,
                                                      details: {
                                                          ...prev.investmentReturns.revenueSplit.details,
                                                          frequency: value
                                                      }
                                                  }
                                              }
                                          }));
                                      }}
                                  >
                                      <SelectTrigger className="text-gray-900 dark:text-gray-100">
                                          <SelectValue placeholder="Fréquence de distribution" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="monthly">Mensuelle</SelectItem>
                                          <SelectItem value="quarterly">Trimestrielle</SelectItem>
                                          <SelectItem value="annual">Annuelle</SelectItem>
                                      </SelectContent>
                                  </Select>
                                  <Input
                                      placeholder="Seuil minimum de déclenchement (optionnel)"
                                      value={formData.investmentReturns.revenueSplit.details.threshold}
                                      onChange={(e) => {
                                          setFormData(prev => ({
                                              ...prev,
                                              investmentReturns: {
                                                  ...prev.investmentReturns,
                                                  revenueSplit: {
                                                      ...prev.investmentReturns.revenueSplit,
                                                      details: {
                                                          ...prev.investmentReturns.revenueSplit.details,
                                                          threshold: e.target.value
                                                      }
                                                  }
                                              }
                                          }));
                                      }}
                                      className="text-gray-900 dark:text-gray-100"
                                  />
                              </div>
                          )}
                      </div>
      
                      {/* Récompense personnalisée */}
                      <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                              <Checkbox
                                  checked={formData.investmentReturns.customReward.enabled}
                                  onCheckedChange={(checked) => {
                                      setFormData(prev => ({
                                          ...prev,
                                          investmentReturns: {
                                              ...prev.investmentReturns,
                                              customReward: {
                                                  ...prev.investmentReturns.customReward,
                                                  enabled: checked
                                              }
                                          }
                                      }));
                                  }}
                              />
                              <Label className="text-gray-900 dark:text-gray-100">Récompense Personnalisée</Label>
                          </div>
      
                          {formData.investmentReturns.customReward.enabled && (
                              <div className="ml-6 space-y-2">
                                  <Input
                                      placeholder="Nom de la récompense"
                                      value={formData.investmentReturns.customReward.name}
                                      onChange={(e) => {
                                          setFormData(prev => ({
                                              ...prev,
                                              investmentReturns: {
                                                  ...prev.investmentReturns,
                                                  customReward: {
                                                      ...prev.investmentReturns.customReward,
                                                      name: e.target.value
                                                  }
                                              }
                                          }));
                                      }}
                                      className="text-gray-900 dark:text-gray-100"
                                  />
                                  <Textarea
                                      placeholder="Description détaillée de la récompense"
                                      value={formData.investmentReturns.customReward.description}
                                      onChange={(e) => {
                                          setFormData(prev => ({
                                              ...prev,
                                              investmentReturns: {
                                                  ...prev.investmentReturns,
                                                  customReward: {
                                                      ...prev.investmentReturns.customReward,
                                                      description: e.target.value
                                                  }
                                              }
                                          }));
                                      }}
                                      className="text-gray-900 dark:text-gray-100"
                                  />
                                  <Input
                                      placeholder="Conditions d'obtention (optionnel)"
                                      value={formData.investmentReturns.customReward.conditions}
                                      onChange={(e) => {
                                          setFormData(prev => ({
                                              ...prev,
                                              investmentReturns: {
                                                ...prev.investmentReturns,
                                                customReward: {
                                                    ...prev.investmentReturns.customReward,
                                                    conditions: e.target.value
                                                }
                                            }
                                        }));
                                    }}
                                    className="text-gray-900 dark:text-gray-100"
                                />
                            </div>
                        )}
                    </div>
                </div>
    
                {/* Section Documents */}
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
                    />
                </div>
    
                {['whitepaper', 'pitchDeck', 'legalDocuments', 'media'].map((field) => (
                    formData[field] && formData[field].length > 0 && (
                        <div key={field} className="mt-2">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                {field.charAt(0).toUpperCase() + field.slice(1)}:
                            </h3>
                            <ul className="list-disc pl-5">
                                {Array.isArray(formData[field]) ? (
                                    formData[field].map((file, index) => (
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
                                        <span className="text-gray-900 dark:text-gray-100">{formData[field].name}</span>
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
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Équipe et Certification</h2>
            <div>
              <Label className="text-gray-900 dark:text-gray-100">Membres de l'équipe</Label>
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
              <Button onClick={addTeamMember} className="mt-2">
                <Plus className="mr-2 h-4 w-4" /> Ajouter un membre
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="certified"
                checked={formData.certified}
                onCheckedChange={() => handleCheckboxChange('certified')}
              />
              <Label htmlFor="certified" className="text-gray-900 dark:text-gray-100">Campagne certifiée</Label>
            </div>
            {formData.certified && (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Informations de l'avocat</h3>
                <Input
                  placeholder="Adresse Ethereum de l'avocat"
                  value={formData.lawyer.address}
                  onChange={(e) => handleNestedInputChange(e, 'lawyer')}
                  name="address"
                  className="text-gray-900 dark:text-gray-100"
                />
                <Input
                  placeholder="Nom de l'avocat"
                  value={formData.lawyer.name}
                  onChange={(e) => handleNestedInputChange(e, 'lawyer')}
                  name="name"
                  className="text-gray-900 dark:text-gray-100"
                />
                <Input
                  placeholder="Contact de l'avocat"
                  value={formData.lawyer.contact}
                  onChange={(e) => handleNestedInputChange(e, 'lawyer')}
                  name="contact"
                  className="text-gray-900 dark:text-gray-100"
                />
                <Input
                  placeholder="Juridiction de l'avocat"
                  value={formData.lawyer.jurisdiction}
                  onChange={(e) => handleNestedInputChange(e, 'lawyer')}
                  name="jurisdiction"
                  className="text-gray-900 dark:text-gray-100"
                />
              </div>
            )}
          </div>
        );
        case 4:
          return (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Vérification et Soumission</h2>
              
              {/* Résumé de la campagne */}
              <div className="space-y-2 mb-8">
                <h3 className="font-semibold">Résumé de la campagne</h3>
                <p><strong>Nom:</strong> {formData.name}</p>
                <p><strong>Symbole:</strong> {formData.symbol}</p>
                <p><strong>Secteur:</strong> {formData.sector}</p>
                <p><strong>Objectif:</strong> {(parseFloat(formData.sharePrice || 0) * parseFloat(formData.numberOfShares || 0)).toFixed(6)} ETH</p>
                <p><strong>Date de fin:</strong> {new Date(formData.endDate).toLocaleString()}</p>
                <p><strong>Campagne certifiée:</strong> {formData.certified ? 'Oui' : 'Non'}</p>
              </div>
        
              {/* NFT Card - Version unique et principale */}
              <div className="max-w-2xl mx-auto mb-8">
                <CompanySharesNFTCard
                  name={formData.name}
                  symbol={formData.symbol}
                  creatorAddress={formData.creatorAddress}
                  tokenId="1"
                  issueDate={new Date().toISOString().split('T')[0]}
                  fundingRound="Seed"
                  smartContract={contractAddress}
                  totalShares={formData.numberOfShares}
                  backgroundColor={formData.backgroundColor}
                  textColor={formData.textColor}
                  logoUrl={formData.logo}
                  niveauLivar={formData.certified ? "vert" : "orange"}
                  investmentReturns={formData.investmentReturns} 
                  isPreview={false}
                />
              </div>
        
              {/* Contrôles de personnalisation directement sous la carte */}
              <div className="max-w-2xl mx-auto space-y-4">
                <h3 className="font-semibold">Personnalisation</h3>
                <div>
                  <Label htmlFor="logo">Logo de la société</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="backgroundColor">Couleur de fond</Label>
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="h-10 w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="textColor">Couleur du texte</Label>
                    <Input
                      id="textColor"
                      type="color"
                      value={formData.textColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, textColor: e.target.value }))}
                      className="h-10 w-full"
                    />
                  </div>
                </div>
              </div>
        
              <Alert className="mt-8">
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
                  J'accepte les conditions générales et je confirme que toutes les informations 
                  fournies sont exactes.
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
        <div 
  ref={cardRef} 
  style={{
    position: 'fixed',
    left: '-9999px',
    width: '400px',
    height: '560px',
    backgroundColor: 'transparent',
    pointerEvents: 'none'
  }}
>
  <CompanySharesNFTCard
    name={formData.name}
    symbol={formData.symbol}
    creatorAddress={formData.creatorAddress}
    tokenId="1"
    issueDate={new Date().toISOString().split('T')[0]}
    fundingRound="Seed"
    smartContract={contractAddress}
    totalShares={formData.numberOfShares}
    backgroundColor={formData.backgroundColor}
    textColor={formData.textColor}
    logoUrl={formData.logo}
    niveauLivar={formData.certified ? "vert" : "orange"}
    investmentReturns={formData.investmentReturns}  // <- AJOUTER CETTE LIGNE
    isPreview={true}
  />
</div>
        
        {/* Boutons de navigation */}
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
            <Button 
              type="submit" 
              disabled={!formData.acceptTerms || isLoading}
            >
              {isLoading ? 'Création en cours...' : 'Créer la campagne (0.05 ETH + gas)'}
            </Button>
          )}
        </div>
        </form>
              </DialogContent>
            </Dialog>
          );
        }