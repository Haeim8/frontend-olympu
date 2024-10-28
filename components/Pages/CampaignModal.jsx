"use client"

import React, { useState, useEffect } from 'react';
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
import { Info, Upload, Plus, Minus, AlertTriangle, Trash2, CheckCircle } from 'lucide-react';
import { useContract, useContractWrite, useAddress, useChainId } from '@thirdweb-dev/react';
import { ethers } from 'ethers';

// Import du service de stockage Pinata
import { pinataService } from '@/lib/services/storage';

const SECTORS = [
  "Blockchain", "Finance", "Industrie", "Tech", "Influence", "Gaming",
  "NFT", "DeFi", "DAO", "Infrastructure", "Autre"
];

const COUNTRIES = ["Afghanistan", "Afrique du Sud", "Albanie", /* ... */, "Zimbabwe"];

export default function CampaignModal({ showCreateCampaign, setShowCreateCampaign, handleCreateCampaign }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepValidated, setStepValidated] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [campaignCreated, setCampaignCreated] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');

  const address = useAddress();
  const chainId = useChainId();
  const contractAddress = "0xD624ddFe214734dAceA2aacf8bb47e837B5228DD";
  const contractABI = [
    "function createCampaign(string memory _name, string memory _symbol, uint256 _targetAmount, uint256 _sharePrice, uint256 _endTime, bool _certified, address _lawyer, string memory _category, string memory _metadata, uint96 _royaltyFee) external payable",
    "event CampaignCreated(address indexed campaignAddress, address indexed startup, string name, bool certified, address indexed lawyer, uint256 timestamp)"
  ];

  const { contract } = useContract(contractAddress, contractABI);
  const { mutateAsync: createCampaign, isLoading: writeLoading } = useContractWrite(contract, "createCampaign");

  const [formData, setFormData] = useState({
    creatorAddress: '',
    name: '',
    symbol: '',
    sector: '',
    otherSector: '',
    nationality: '',
    description: '',
    sharePrice: '',
    numberOfShares: '',
    targetAmount: '',
    endDate: '',
    royaltyFee: '0',
    royaltyReceiver: '',
    documents: [],
    whitepaper: null,
    pitchDeck: null,
    legalDocuments: null,
    media: [],
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
  });

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
        [field]: [...prev[field], ...newFiles]
      }));
    }
  };

  const removeFile = (index, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
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

  const handleSocialChange = (network, value) => {
    setFormData(prev => ({
      ...prev,
      socials: { ...prev.socials, [network]: value }
    }));
  };

  const removeSocial = (network) => {
    setFormData(prev => ({
      ...prev,
      socials: { ...prev.socials, [network]: '' }
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
        if (!formData.nationality) errors.nationality = "La nationalité est requise";
        if (!formData.description) errors.description = "La description est requise";
        if (!formData.sharePrice || parseFloat(formData.sharePrice) <= 0) errors.sharePrice = "Le prix par part doit être supérieur à 0";
        if (!formData.numberOfShares || parseInt(formData.numberOfShares) <= 0) errors.numberOfShares = "Le nombre de parts doit être supérieur à 0";
        if (!formData.endDate || new Date(formData.endDate).getTime() <= Date.now()) {
          errors.endDate = "La date de fin doit être dans le futur";
        }
        break;
      case 2:
        if (formData.documents.length === 0) errors.documents = "Au moins un document est requis";
        break;
      case 3:
        if (formData.teamMembers.length === 0) errors.team = "Au moins un membre d'équipe est requis";
        if (formData.certified && !formData.lawyer.address) errors.lawyer = "L'adresse de l'avocat est requise pour une campagne certifiée";
        break;
      case 4:
        if (!formData.acceptTerms) errors.terms = "Vous devez accepter les conditions";
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

  const createCampaignFolder = async (campaignData, documents, media) => {
    try {
      setIsLoading(true);
      
      // Créer un dossier pour la campagne
      const campaignFolderName = `campaign_${campaignData.name.replace(/\s+/g, '_').toLowerCase()}`;
      
      // Préparer la structure du dossier
      const folderStructure = {
        metadata: {
          createdAt: new Date().toISOString(),
          version: "1.0.0",
          currentRound: 1
        },
        campaignDetails: {
          name: campaignData.name,
          sector: campaignData.sector,
          description: campaignData.description,
          teamMembers: campaignData.teamMembers,
          investmentTerms: campaignData.investmentTerms,
          companyShares: campaignData.companyShares,
          hasLawyer: campaignData.certified,
          lawyer: campaignData.certified ? campaignData.lawyer : null
        },
        rounds: {
          "round-1": {
            details: {
              sharePrice: campaignData.sharePrice,
              numberOfNFTs: campaignData.numberOfShares,
              goal: campaignData.targetAmount,
              endDate: campaignData.endDate,
              status: "active"
            }
          }
        }
      };

      console.log("Structure du dossier préparée:", folderStructure);

      // Upload des documents
      const uploadedDocs = await Promise.all(
        documents.map(async (file) => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 0
          }));

          const result = await pinataService.uploadFile(file, {
            name: `${campaignFolderName}/documents/${file.name}`,
            keyvalues: {
              round: "1",
              type: "document"
            }
          });

          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 100
          }));

          return {
            name: file.name,
            ipfsHash: result.ipfsHash,
            url: result.gatewayUrl, // Correction ici pour utiliser gatewayUrl
            type: file.type,
            uploadedAt: new Date().toISOString()
          };
        })
      );

      console.log("Documents uploadés:", uploadedDocs);

      // Upload des médias
      const uploadedMedia = await Promise.all(
        media.map(async (file) => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 0
          }));

          const result = await pinataService.uploadFile(file, {
            name: `${campaignFolderName}/media/${file.name}`,
            keyvalues: {
              round: "1",
              type: "media"
            }
          });

          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 100
          }));

          return {
            name: file.name,
            ipfsHash: result.ipfsHash,
            url: result.gatewayUrl, // Correction ici pour utiliser gatewayUrl
            type: file.type,
            uploadedAt: new Date().toISOString()
          };
        })
      );

      console.log("Médias uploadés:", uploadedMedia);

      // Ajouter les documents et médias à la structure
      folderStructure.rounds["round-1"].documents = uploadedDocs;
      folderStructure.rounds["round-1"].media = uploadedMedia;

      // Upload de toute la structure en JSON
      const finalResult = await pinataService.uploadJSON(folderStructure, {
        name: `${campaignFolderName}/campaign_data.json`
      });

      console.log("Structure JSON uploadée:", finalResult);

      return {
        success: true,
        ipfsHash: finalResult.ipfsHash,
        url: finalResult.gatewayUrl,
        data: folderStructure
      };

    } catch (error) {
      console.error("Erreur lors de la création du dossier IPFS:", error);
      throw error;
    } finally {
      setIsLoading(false);
      setUploadProgress({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;
    setIsLoading(true);
    setError(null);
    console.log("Début de la soumission du formulaire");
    try {
      // 1. Créer le dossier IPFS avec tous les documents
      const ipfsResult = await createCampaignFolder(
        formData,
        formData.documents,
        formData.media
      );
      console.log("Dossier IPFS créé:", ipfsResult);

      if (!ipfsResult.success) {
        throw new Error("Échec de l'upload IPFS");
      }

      // 2. Créer la campagne sur la blockchain avec le hash IPFS
      const tx = await createCampaign({
        args: [
          formData.name,
          formData.symbol,
          ethers.utils.parseEther((parseFloat(formData.sharePrice) * parseFloat(formData.numberOfShares)).toFixed(18)),
          ethers.utils.parseEther(formData.sharePrice),
          Math.floor(new Date(formData.endDate).getTime() / 1000),
          formData.certified,
          formData.certified ? formData.lawyer.address : ethers.constants.AddressZero,
          formData.sector === 'Autre' ? formData.otherSector : formData.sector,
          ipfsResult.ipfsHash,
          parseInt(formData.royaltyFee)
        ],
        overrides: {
          value: ethers.utils.parseEther("0.02")
        }
      });
      console.log("Transaction envoyée:", tx);

      // 3. Attendre la confirmation de la transaction
      const receipt = await tx.wait();
      console.log("Transaction confirmée:", receipt);

      // 4. Extraire les informations de l'événement
      const event = receipt.events.find((e) => e.event === 'CampaignCreated');
      const [campaignAddress, creator, name, certified, lawyer, timestamp] = event.args;
      console.log("Événement CampaignCreated:", { campaignAddress, creator, name, certified, lawyer, timestamp });

      setTransactionHash(receipt.transactionHash);

      // 5. Confirmation et nettoyage
      handleCreateCampaign({
        ...formData,
        ipfsHash: ipfsResult.ipfsHash,
        ipfsUrl: ipfsResult.url,
        campaignAddress: campaignAddress,
        name: name
      });
      console.log("handleCreateCampaign appelé");

      setCampaignCreated(true);
      console.log("campaignCreated mis à true");

    } catch (error) {
      console.error("Erreur lors de la création de la campagne:", error);
      setError(error.message || "Erreur lors de la création de la campagne");
    } finally {
      setIsLoading(false);
      console.log("Chargement terminé");
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
        <TooltipContent>
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const renderStepContent = () => {
    switch(currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Informations de Base</h2>
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="creatorAddress">Adresse du créateur</Label>
                <InfoTooltip content="L'adresse Ethereum du créateur de la campagne" />
              </div>
              <Input
                id="creatorAddress"
                name="creatorAddress"
                value={formData.creatorAddress}
                readOnly
                className="bg-gray-100 dark:bg-neutral-800 cursor-not-allowed"
              />
            </div>
            <div>
              <Label htmlFor="name">Nom de la campagne</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nom de votre projet"
                required
              />
              {error?.name && <p className="text-red-500 text-sm">{error.name}</p>}
            </div>
            <div>
              <Label htmlFor="symbol">Symbole</Label>
              <Input
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                placeholder="3-4 caractères (ex: BTC)"
                maxLength={4}
                required
              />
              {error?.symbol && <p className="text-red-500 text-sm">{error.symbol}</p>}
            </div>
            <div>
              <Label htmlFor="sector">Secteur</Label>
              <Select 
                value={formData.sector}
                onValueChange={(value) => handleSelectChange(value, 'sector')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un secteur" />
                </SelectTrigger>
                <SelectContent>
                  {SECTORS.map((sector) => (
                    <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error?.sector && <p className="text-red-500 text-sm">{error.sector}</p>}
            </div>
            {formData.sector === 'Autre' && (
              <div>
                <Label htmlFor="otherSector">Précisez le secteur</Label>
                <Input
                  id="otherSector"
                  name="otherSector"
                  value={formData.otherSector}
                  onChange={handleInputChange}
                  placeholder="Précisez le secteur d'activité"
                  required
                />
                {error?.otherSector && <p className="text-red-500 text-sm">{error.otherSector}</p>}
              </div>
            )}
            <div>
              <Label htmlFor="nationality">Nationalité du Projet</Label>
              <Select
                value={formData.nationality}
                onValueChange={(value) => handleSelectChange(value, 'nationality')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une nationalité" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error?.nationality && <p className="text-red-500 text-sm">{error.nationality}</p>}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Description détaillée de votre projet"
                rows={5}
                required
              />
              {error?.description && <p className="text-red-500 text-sm">{error.description}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sharePrice">Prix par part (ETH)</Label>
                <Input
                  id="sharePrice"
                  name="sharePrice"
                  type="number"
                  step="0.000000000000000001"
                  value={formData.sharePrice}
                  onChange={handleInputChange}
                  required
                />
                {error?.sharePrice && <p className="text-red-500 text-sm">{error.sharePrice}</p>}
              </div>
              <div>
                <Label htmlFor="numberOfShares">Nombre de parts</Label>
                <Input
                  id="numberOfShares"
                  name="numberOfShares"
                  type="number"
                  value={formData.numberOfShares}
                  onChange={handleInputChange}
                  required
                />
                {error?.numberOfShares && <p className="text-red-500 text-sm">{error.numberOfShares}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="targetAmount">Objectif Final (ETH)</Label>
              <Input
                id="targetAmount"
                name="targetAmount"
                value={(parseFloat(formData.sharePrice || 0) * parseFloat(formData.numberOfShares || 0)).toFixed(6)}
                readOnly
                className="bg-gray-100 dark:bg-neutral-800"
              />
            </div>
            <div>
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                name="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="royaltyFee">
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
                />
              </div>
              <div>
                <Label htmlFor="royaltyReceiver">Adresse de réception des royalties</Label>
                <Input
                  id="royaltyReceiver"
                  name="royaltyReceiver"
                  value={formData.royaltyReceiver}
                  onChange={handleInputChange}
                  placeholder="0x..."
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Documents et Médias</h2>
            <div>
              <Label htmlFor="whitepaper">Whitepaper</Label>
              <Input
                id="whitepaper"
                type="file"
                accept=".pdf"
                onChange={(e) => setFormData({...formData, whitepaper: e.target.files[0]})}
                required
              />
              <InfoTooltip content="Document détaillant votre projet, sa technologie et son modèle économique" />
            </div>
            <div>
              <Label htmlFor="pitchDeck">Pitch Deck</Label>
              <Input
                id="pitchDeck"
                type="file"
                accept=".pdf,.ppt,.pptx"
                onChange={(e) => setFormData({...formData, pitchDeck: e.target.files[0]})}
              />
              <InfoTooltip content="Présentation visuelle de votre projet pour les investisseurs" />
            </div>
            <div>
              <Label htmlFor="legalDocuments">Documents Légaux</Label>
              <Input
                id="legalDocuments"
                type="file"
                accept=".pdf"
                onChange={(e) => setFormData({...formData, legalDocuments: e.target.files[0]})}
              />
              <InfoTooltip content="Documents juridiques relatifs à votre projet ou entreprise" />
            </div>
            <div>
              <Label>Documents Additionnels</Label>
              <div className="mt-2 p-4 border rounded-lg space-y-4">
                <Input
                  type="file"
                  multiple
                  onChange={(e) => handleFileChange(e, 'documents')}
                />
                <ScrollArea className="h-32">
                  {formData.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <span className="text-sm">{doc.name}</span>
                      {uploadProgress[doc.name] !== undefined && (
                        <div className="w-24 bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-lime-600 h-2.5 rounded-full"
                            style={{ width: `${uploadProgress[doc.name]}%` }}
                          ></div>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index, 'documents')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
            <div>
              <Label>Médias du Projet</Label>
              <div className="mt-2 p-4 border rounded-lg space-y-4">
                <Input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => handleFileChange(e, 'media')}
                />
                <ScrollArea className="h-32">
                  {formData.media.map((media, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <span className="text-sm">{media.name}</span>
                      {uploadProgress[media.name] !== undefined && (
                        <div className="w-24 bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-lime-600 h-2.5 rounded-full"
                            style={{ width: `${uploadProgress[media.name]}%` }}
                          ></div>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index, 'media')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
            <div>
              <Label htmlFor="roadmap">Roadmap</Label>
              <Textarea
                id="roadmap"
                name="roadmap"
                value={formData.metadata.roadmap}
                onChange={(e) => handleNestedInputChange(e, 'metadata')}
                placeholder="Décrivez les étapes clés de votre projet"
                rows={3}
              />
              <InfoTooltip content="Plan détaillé des étapes futures de votre projet" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="distributeTokens"
                  checked={formData.distributeTokens}
                  onCheckedChange={() => handleCheckboxChange('distributeTokens')}
                />
                <Label htmlFor="distributeTokens">Comptez-vous distribuer des tokens aux VC ?</Label>
              </div>
              {formData.distributeTokens && (
                <div>
                  <Label htmlFor="tokenomics">Tokenomics</Label>
                  <Textarea
                    id="tokenomics"
                    name="tokenomics"
                    value={formData.metadata.tokenomics}
                    onChange={(e) => handleNestedInputChange(e, 'metadata')}
                    placeholder="Décrivez la distribution et l'utilisation des tokens"
                    rows={3}
                  />
                  <InfoTooltip content="Détails sur la distribution et l'utilisation des tokens de votre projet" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vestingPlan"
                  checked={formData.vestingPlan}
                  onCheckedChange={() => handleCheckboxChange('vestingPlan')}
                />
                <Label htmlFor="vestingPlan">Avez-vous un plan de vesting ?</Label>
              </div>
              {formData.vestingPlan && (
                <div>
                  <Label htmlFor="vesting">Vesting</Label>
                  <Textarea
                    id="vesting"
                    name="vesting"
                    value={formData.metadata.vesting}
                    onChange={(e) => handleNestedInputChange(e, 'metadata')}
                    placeholder="Décrivez le calendrier de vesting"
                    rows={3}
                  />
                  <InfoTooltip content="Calendrier de libération progressive des tokens ou actions" />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="useOfFunds">Utilisation des Fonds</Label>
              <Textarea
                id="useOfFunds"
                name="useOfFunds"
                value={formData.metadata.useOfFunds}
                onChange={(e) => handleNestedInputChange(e, 'metadata')}
                placeholder="Décrivez comment les fonds seront utilisés"
                rows={3}
              />
              <InfoTooltip content="Explication détaillée de la manière dont les fonds levés seront utilisés" />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Équipe et Réseaux Sociaux du Projet</h2>
            {formData.teamMembers.map((member, index) => (
              <div key={index} className="p-4 border rounded-md space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Membre {index + 1}</h3>
                  {index > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTeamMember(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div>
                  <Label>Nom du Membre</Label>
                  <Input 
                    value={member.name}
                    onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                    placeholder="Nom du membre"
                  />
                </div>
                <div>
                  <Label>Rôle du Membre</Label>
                  <Input 
                    value={member.role}
                    onChange={(e) => handleTeamMemberChange(index, 'role', e.target.value)}
                    placeholder="Rôle du membre"
                  />
                </div>
                <div>
                  <Label>Twitter</Label>
                  <Input 
                    value={member.socials.twitter}
                    onChange={(e) => handleTeamMemberChange(index, 'socials', e.target.value, 'twitter')}
                    placeholder="Lien Twitter"
                  />
                </div>
                <div>
                  <Label>LinkedIn</Label>
                  <Input 
                    value={member.socials.linkedin}
                    onChange={(e) => handleTeamMemberChange(index, 'socials', e.target.value, 'linkedin')}
                    placeholder="Lien LinkedIn"
                  />
                </div>
              </div>
            ))}
            <Button type="button" onClick={addTeamMember} className="mt-2">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un membre
            </Button>

            <h3 className="text-lg font-semibold mt-6">Réseaux Sociaux du Projet</h3>
            {Object.entries(formData.socials).map(([network, value]) => (
              <div key={network} className="flex items-center space-x-2">
                <Label htmlFor={network}>{network.charAt(0).toUpperCase() + network.slice(1)}</Label>
                <Input 
                  id={network}
                  value={value}
                  onChange={(e) => handleSocialChange(network, e.target.value)}
                  placeholder={`Lien ${network}`}
                />
                <Button type="button" onClick={() => removeSocial(network)} className="bg-red-500 hover:bg-red-600 text-white">
                  <Trash2 className="w-4" />
                </Button>
              </div>
            ))}

            <div className="space-y-4 mt-8">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="certified"
                  checked={formData.certified}
                  onCheckedChange={() => handleCheckboxChange('certified')}
                />
                <Label htmlFor="certified">Campagne Certifiée</Label>
              </div>
              {formData.certified && (
                <div className="p-4 border rounded-lg space-y-4">
                  <div>
                    <Label>Adresse de l'avocat</Label>
                    <Input
                      value={formData.lawyer.address}
                      onChange={(e) => handleNestedInputChange(e, 'lawyer')}
                      name="address"
                      placeholder="Adresse Ethereum de l'avocat"
                      required
                    />
                  </div>
                  <div>
                    <Label>Nom de l'avocat</Label>
                    <Input
                      value={formData.lawyer.name}
                      onChange={(e) => handleNestedInputChange(e, 'lawyer')}
                      name="name"
                      placeholder="Nom complet"
                      required
                    />
                  </div>
                  <div>
                    <Label>Contact</Label>
                    <Input
                      value={formData.lawyer.contact}
                      onChange={(e) => handleNestedInputChange(e, 'lawyer')}
                      name="contact"
                      placeholder="Email ou téléphone"
                      required
                    />
                  </div>
                  <div>
                    <Label>Juridiction</Label>
                    <Input
                      value={formData.lawyer.jurisdiction}
                      onChange={(e) => handleNestedInputChange(e, 'lawyer')}
                      name="jurisdiction"
                      placeholder="Pays ou juridiction"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Vérification et Conditions</h2>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h3 className="font-semibold mb-4">Récapitulatif de la Campagne</h3>
              <div className="space-y-2">
                <p><strong>Nom de la campagne:</strong> {formData.name}</p>
                <p><strong>Symbole:</strong> {formData.symbol}</p>
                <p><strong>Secteur:</strong> {formData.sector}</p>
                <p><strong>Nationalité:</strong> {formData.nationality}</p>
                <p><strong>Prix par part:</strong> {formData.sharePrice} ETH</p>
                <p><strong>Nombre de parts:</strong> {formData.numberOfShares}</p>
                <p><strong>Objectif final:</strong> {(parseFloat(formData.sharePrice || 0) * parseFloat(formData.numberOfShares || 0)).toFixed(6)} ETH</p>
                <p><strong>Date de fin:</strong> {new Date(formData.endDate).toLocaleString()}</p>
                <p><strong>Frais de royalties:</strong> {formData.royaltyFee} basis points</p>
                <p><strong>Campagne certifiée:</strong> {formData.certified ? 'Oui' : 'Non'}</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h3 className="font-semibold mb-4">Frais de création</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Frais de création</span>
                  <span>0.02 ETH</span>
                </div>
                <div className="flex justify-between">
                  <span>Commission plateforme</span>
                  <span>15%</span>
                </div>
                {formData.certified && (
                  <div className="flex justify-between">
                    <span>Frais de certification</span>
                    <span>0.05 ETH</span>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onCheckedChange={() => handleCheckboxChange('acceptTerms')}
                  required
                />
                <Label htmlFor="acceptTerms">
                  J'accepte les conditions générales d'utilisation
                </Label>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle campagne</DialogTitle>
          <DialogDescription>
            Remplissez les détails de votre campagne pour la créer.
          </DialogDescription>
        </DialogHeader>

        {!campaignCreated ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between mb-8">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`flex items-center ${step < currentStep ? 'text-green-500' : step === currentStep ? 'text-blue-500' : 'text-gray-300'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                    ${step < currentStep ? 'border-green-500 bg-green-100' : 
                      step === currentStep ? 'border-blue-500 bg-blue-100' : 
                      'border-gray-300'}`}
                  >
                    {step < currentStep ? '✓' : step}
                  </div>
                  {step < 4 && (
                    <div className={`w-full h-0.5 mx-2 
                      ${step < currentStep ? 'bg-green-500' : 'bg-gray-300'}`} 
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mb-8">
              {renderStepContent()}
            </div>

            <div className="flex justify-between">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviousStep}
                  disabled={currentStep === 1 || isLoading}
                >
                  Précédent
                </Button>
              )}
              
              {currentStep < 4 ? (
                <Button type="button" onClick={handleNextStep} disabled={isLoading}>
                  Suivant
                </Button>
              ) : (
                <Button type="submit" className="bg-lime-600 hover:bg-lime-700" disabled={isLoading || !formData.acceptTerms}>
                  {isLoading ? "Création en cours..." : "Créer la campagne"}
                </Button>
              )}
            </div>
          </form>
        ) : (
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
        )}

        {error && Object.keys(error).length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {Object.values(error).map((err, index) => (
                <div key={index}>{err}</div>
              ))}
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
} 
