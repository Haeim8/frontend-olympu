//frontend/components/pages/campaignmodal.jsx
"use client";

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
import { Info, Upload, Plus, Minus } from 'lucide-react';
import { useContract, useContractWrite, useAddress } from '@thirdweb-dev/react';
import { ethers } from 'ethers';
import { db, storage } from "@/lib/firebase/firebase";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function CampaignModal({ showCreateCampaign, setShowCreateCampaign, handleCreateCampaign }) {
  // Adresse du contrat FundRaisingPlatform
  const contractAddress = "0xF334d4CEcB73bc95e032949b9437A1eE6D4C6019";
  
  // ABI du contrat FundRaisingPlatform (inclure uniquement les fonctions nécessaires)
  const contractABI = [
    "function createCampaign(string memory _name, uint256 _targetAmount, uint256 _sharePrice, uint256 _endTime, bool _certified, address _lawyer, uint96 _royaltyFee) external payable",
    "event CampaignCreated(address indexed campaignAddress, address indexed startup, bool certified, address indexed lawyer)"
  ];

  // Utiliser les hooks de Thirdweb
  const address = useAddress();
  const { contract, isLoading: contractLoading, error: contractError } = useContract(contractAddress, contractABI);
  const { mutateAsync: createCampaign, isLoading: writeLoading } = useContractWrite(contract, "createCampaign");

  // État du formulaire
  const initialFormState = {
    creatorAddress: address || '', // Initialiser avec l'adresse
    name: '',
    sector: '',
    description: '',
    sharePrice: '',
    numberOfNFTs: '',
    goal: '',
    endDate: '',
    documents: [],
    media: [],
    teamMembers: [{ name: '', role: '', twitter: '', facebook: '' }],
    hasLawyer: false,
    lawyer: {
      name: '',
      contact: '',
      phone: '',
      address: '',
    },
    royaltyFee: '',
    investmentTerms: {
      remunerationType: '',
      tokenDistribution: '',
      roi: '',
    },
    companyShares: {
      percentageMinted: '',
      vertePortalLink: '',
    },
    acceptTerms: false
  };

  const [campaignForm, setCampaignForm] = useState(() => {
    // Charger depuis le stockage local si disponible
    const savedForm = localStorage.getItem('campaignForm');
    return savedForm ? JSON.parse(savedForm) : initialFormState;
  });

  // Sauvegarder le formulaire à chaque changement
  useEffect(() => {
    localStorage.setItem('campaignForm', JSON.stringify(campaignForm));
  }, [campaignForm]);

  // Mettre à jour l'adresse du créateur lorsque l'adresse change
  useEffect(() => {
    if (address) {
      setCampaignForm(prev => ({
        ...prev,
        creatorAddress: address
      }));
    }
  }, [address]);

  // Calcul automatique de l'objectif de levée
  useEffect(() => {
    const sharePrice = parseFloat(campaignForm.sharePrice);
    const numberOfNFTs = parseInt(campaignForm.numberOfNFTs);
    if (!isNaN(sharePrice) && !isNaN(numberOfNFTs)) {
      setCampaignForm(prev => ({
        ...prev,
        goal: (sharePrice * numberOfNFTs).toString()
      }));
    } else {
      setCampaignForm(prev => ({
        ...prev,
        goal: ''
      }));
    }
  }, [campaignForm.sharePrice, campaignForm.numberOfNFTs]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCampaignForm(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedInputChange = (e, nestedField) => {
    const { name, value } = e.target;
    setCampaignForm(prev => ({
      ...prev,
      [nestedField]: {
        ...prev[nestedField],
        [name]: value
      }
    }));
  };

  const handleSelectChange = (value, field) => {
    setCampaignForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (name, nestedField = null) => {
    if (nestedField) {
      setCampaignForm(prev => ({
        ...prev,
        [nestedField]: {
          ...prev[nestedField],
          [name]: !prev[nestedField][name]
        }
      }));
    } else {
      setCampaignForm(prev => ({ ...prev, [name]: !prev[name] }));
    }
  };

  const handleFileChange = (e, field) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setCampaignForm(prev => ({
        ...prev,
        [field]: [...prev[field], ...newFiles]
      }));
    }
  };

  const removeFile = (index, field) => {
    setCampaignForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const addTeamMember = () => {
    setCampaignForm(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, { name: '', role: '', twitter: '', facebook: '' }]
    }));
  };

  const removeTeamMember = (index) => {
    setCampaignForm(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index)
    }));
  };

  const handleTeamMemberChange = (index, field, value) => {
    setCampaignForm(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      )
    }));
  };

  // Fonction pour gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!campaignForm.acceptTerms) {
      alert("Veuillez accepter les conditions générales d'utilisation.");
      return;
    }

    if (!contract) {
      console.error("Contrat non initialisé");
      alert("Erreur : le contrat n'est pas disponible. Veuillez vérifier votre connexion.");
      return;
    }

    // Validation des champs requis
    if (!campaignForm.name || !campaignForm.sharePrice || !campaignForm.numberOfNFTs || !campaignForm.endDate || !campaignForm.royaltyFee) {
      alert("Veuillez remplir tous les champs requis.");
      return;
    }

    try {
      console.log("Début de la soumission du formulaire");

      // Gestion de l'adresse de l'avocat
      let lawyerAddress = ethers.constants.AddressZero;
      if (campaignForm.hasLawyer) {
        // Vérifier si 'lawyer.address' est une adresse Ethereum valide
        if (ethers.utils.isAddress(campaignForm.lawyer.address)) {
          lawyerAddress = campaignForm.lawyer.address;
        } else {
          alert("Veuillez fournir une adresse Ethereum valide pour l'avocat.");
          return;
        }
      }

      // Préparation des paramètres
      const name = campaignForm.name;
      const sharePrice = ethers.utils.parseEther(campaignForm.sharePrice.toString());
      const numberOfNFTs = parseInt(campaignForm.numberOfNFTs);
      const targetAmount = sharePrice.mul(numberOfNFTs);
      const endDateTimestamp = Math.floor(new Date(campaignForm.endDate).getTime() / 1000);
      const certified = campaignForm.hasLawyer;
      const royaltyFee = parseInt(campaignForm.royaltyFee);

      // Validation des paramètres
      if (numberOfNFTs <= 0) {
        alert("Le nombre de NFTs doit être supérieur à zéro.");
        return;
      }
      if (royaltyFee < 0 || royaltyFee > 10000) { // 10000 basis points = 100%
        alert("Les frais de royalties doivent être compris entre 0 et 10000 basis points.");
        return;
      }

      // Affichage des paramètres pour vérification
      console.log("Paramètres pour createCampaign :", {
        name,
        targetAmount: targetAmount.toString(),
        sharePrice: sharePrice.toString(),
        endDateTimestamp,
        certified,
        lawyerAddress,
        royaltyFee,
      });

      // Appel de la fonction createCampaign via Thirdweb
      console.log("Appel de la fonction createCampaign du contrat");
      const tx = await createCampaign({
        args: [
          name,
          targetAmount,
          sharePrice,
          endDateTimestamp,
          certified,
          lawyerAddress,
          royaltyFee
        ],
        overrides: {
          value: ethers.utils.parseEther("0.02") // Frais de création de campagne
        }
      });

      console.log("Transaction envoyée :", tx);

      // Accéder directement à tx.receipt
      const receipt = tx.receipt;

      if (receipt) {
        console.log("Transaction confirmée :", receipt.transactionHash);

        // Vérifier les événements dans le reçu
        const event = receipt.events.find((e) => e.event === "CampaignCreated");

        if (!event) {
          console.error("Événement CampaignCreated introuvable dans le receipt :", receipt);
          alert("Erreur lors de la création de la campagne. L'événement CampaignCreated n'a pas été émis.");
          return;
        }

        const campaignAddress = event.args.campaignAddress;

        console.log("Adresse de la campagne créée :", campaignAddress);

        // Upload des documents vers Firebase Storage
        const documentsURLs = [];
        for (const file of campaignForm.documents) {
          const storageRef = ref(storage, `campaigns/${campaignAddress}/documents/${file.name}`);
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);
          documentsURLs.push({ name: file.name, url: downloadURL });
          console.log(`Document ${file.name} uploadé avec succès`);
        }

        // Upload des médias vers Firebase Storage
        const mediaURLs = [];
        for (const file of campaignForm.media) {
          const storageRef = ref(storage, `campaigns/${campaignAddress}/media/${file.name}`);
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);
          mediaURLs.push({ name: file.name, url: downloadURL });
          console.log(`Média ${file.name} uploadé avec succès`);
        }

        // Enregistrer les données supplémentaires dans Firebase
        await setDoc(doc(db, "campaigns", campaignAddress), {
          creatorAddress: campaignForm.creatorAddress,
          name: campaignForm.name,
          sector: campaignForm.sector,
          description: campaignForm.description,
          sharePrice: campaignForm.sharePrice,
          numberOfNFTs: campaignForm.numberOfNFTs,
          goal: campaignForm.goal,
          endDate: campaignForm.endDate,
          documents: documentsURLs,
          media: mediaURLs,
          teamMembers: campaignForm.teamMembers,
          hasLawyer: campaignForm.hasLawyer,
          lawyer: campaignForm.hasLawyer ? campaignForm.lawyer : null,
          royaltyFee: campaignForm.royaltyFee,
          investmentTerms: campaignForm.investmentTerms,
          companyShares: campaignForm.companyShares,
          timestamp: new Date(),
        });

        console.log("Données de la campagne enregistrées dans Firebase");

        // Réinitialiser le formulaire et le stockage local
        setCampaignForm(initialFormState);
        localStorage.removeItem('campaignForm');

        console.log("Campagne créée avec succès:", campaignAddress);
        handleCreateCampaign(campaignForm); // Gérer la logique après la création de la campagne
        setShowCreateCampaign(false); // Fermer le modal après la soumission
      } else {
        // Si tx.receipt n'existe pas
        console.log("Transaction envoyée et confirmée :", tx);
        alert("La transaction a été envoyée, mais la confirmation n'a pas pu être récupérée automatiquement.");
      }
    } catch (error) {
      console.error("Erreur lors de la création de la campagne :", error);
      alert(`Erreur lors de la création de la campagne : ${error.message || error}`);
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

  return (
    <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
      <DialogContent className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-gray-50 max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Créer une nouvelle campagne</DialogTitle>
          <DialogDescription>
            Remplissez les détails de votre campagne pour la créer.
          </DialogDescription>
        </DialogHeader>
        <Alert className="mb-6 bg-red-900 border-red-700 text-white">
          <Info className="h-4 w-4" />
          <AlertDescription>
            L'application applique une commission de 15% sur tout achat de la campagne.
          </AlertDescription>
        </Alert>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Adresse du créateur (Lecture seule) */}
          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="creatorAddress">Adresse du créateur</Label>
              <InfoTooltip content="L'adresse Ethereum du créateur de la campagne est renseignée automatiquement." />
            </div>
            <Input
              id="creatorAddress"
              name="creatorAddress"
              type="text"
              value={campaignForm.creatorAddress}
              readOnly
              className="bg-gray-100 dark:bg-neutral-800 cursor-not-allowed"
              required
            />
          </div>

          {/* Nom de la campagne */}
          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="name">Nom de la campagne</Label>
              <InfoTooltip content="Donnez un nom unique et descriptif à votre campagne." />
            </div>
            <Input
              id="name"
              name="name"
              value={campaignForm.name}
              onChange={handleInputChange}
              className="bg-gray-50 dark:bg-neutral-900"
              required
            />
          </div>

          {/* Secteur d'activité */}
          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="sector">Secteur d'activité</Label>
              <InfoTooltip content="Choisissez le secteur qui correspond le mieux à votre projet." />
            </div>
            <Select onValueChange={(value) => handleSelectChange(value, 'sector')} required>
              <SelectTrigger className="bg-gray-50 dark:bg-neutral-900">
                <SelectValue placeholder="Sélectionnez un secteur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Technologie">Technologie</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Santé">Santé</SelectItem>
                <SelectItem value="Éducation">Éducation</SelectItem>
                <SelectItem value="Autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description du projet */}
          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="description">Description du projet</Label>
              <InfoTooltip content="Décrivez votre projet en détail. Soyez clair et concis." />
            </div>
            <Textarea
              id="description"
              name="description"
              value={campaignForm.description}
              onChange={handleInputChange}
              placeholder="Veuillez renseigner ce champ."
              className="bg-gray-50 dark:bg-neutral-900"
              required
            />
          </div>

          {/* Prix par part */}
          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="sharePrice">Prix par part (en ETH)</Label>
              <InfoTooltip content="Définissez le prix d'une part de votre projet en ETH." />
            </div>
            <Input
              id="sharePrice"
              name="sharePrice"
              type="number"
              step="any"
              min="0.000000000000000001"
              value={campaignForm.sharePrice}
              onChange={handleInputChange}
              className="bg-gray-50 dark:bg-neutral-900"
              required
            />
          </div>

          {/* Nombre de NFTs à Mint */}
          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="numberOfNFTs">Nombre de NFTs à Mint</Label>
              <InfoTooltip content="Définissez le nombre de NFTs que vous souhaitez mint pour cette campagne." />
            </div>
            <Input
              id="numberOfNFTs"
              name="numberOfNFTs"
              type="number"
              min="1"
              value={campaignForm.numberOfNFTs}
              onChange={handleInputChange}
              className="bg-gray-50 dark:bg-neutral-900"
              required
            />
          </div>

          {/* Objectif de levée (Calculé Automatiquement) */}
          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="goal">Objectif de levée (en ETH)</Label>
              <InfoTooltip content="Ce champ est calculé automatiquement en fonction du nombre de NFTs et du prix par NFT." />
            </div>
            <Input
              id="goal"
              name="goal"
              type="text"
              value={campaignForm.goal}
              readOnly
              className="bg-gray-100 dark:bg-neutral-800 cursor-not-allowed"
            />
          </div>

          {/* Date de fin */}
          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="endDate">Date de fin</Label>
              <InfoTooltip content="Choisissez la date de clôture de votre campagne." />
            </div>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              value={campaignForm.endDate}
              onChange={handleInputChange}
              className="bg-gray-50 dark:bg-neutral-900"
              required
            />
          </div>

          {/* Frais de Royalties */}
          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="royaltyFee">Frais de Royalties (en basis points)</Label>
              <InfoTooltip content="Définissez les frais de royalties en basis points (1% = 100 basis points)." />
            </div>
            <Input
              id="royaltyFee"
              name="royaltyFee"
              type="number"
              min="0"
              max="10000"
              value={campaignForm.royaltyFee}
              onChange={handleInputChange}
              className="bg-gray-50 dark:bg-neutral-900"
              required
            />
          </div>

          {/* Conditions de rémunération des investisseurs */}
          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="remunerationType">Type de rémunération</Label>
              <InfoTooltip content="Définissez le type de rémunération pour les investisseurs." />
            </div>
            <Input
              id="remunerationType"
              name="remunerationType"
              value={campaignForm.investmentTerms.remunerationType}
              onChange={(e) => handleNestedInputChange(e, 'investmentTerms')}
              className="bg-gray-50 dark:bg-neutral-900"
              required
            />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="tokenDistribution">Distribution de tokens</Label>
              <InfoTooltip content="Définissez comment les tokens seront distribués aux investisseurs." />
            </div>
            <Input
              id="tokenDistribution"
              name="tokenDistribution"
              value={campaignForm.investmentTerms.tokenDistribution}
              onChange={(e) => handleNestedInputChange(e, 'investmentTerms')}
              className="bg-gray-50 dark:bg-neutral-900"
              required
            />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="roi">Temps de retour sur investissement estimé</Label>
              <InfoTooltip content="Indiquez le temps estimé pour le retour sur investissement." />
            </div>
            <Input
              id="roi"
              name="roi"
              value={campaignForm.investmentTerms.roi}
              onChange={(e) => handleNestedInputChange(e, 'investmentTerms')}
              className="bg-gray-50 dark:bg-neutral-900"
              required
            />
          </div>

          {/* Part de la société */}
          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="percentageMinted">Pourcentage de la société minté</Label>
              <InfoTooltip content="Indiquez le pourcentage de la société qui a été minté." />
            </div>
            <Input
              id="percentageMinted"
              name="percentageMinted"
              type="number"
              min="0"
              max="100"
              value={campaignForm.companyShares.percentageMinted}
              onChange={(e) => handleNestedInputChange(e, 'companyShares')}
              className="bg-gray-50 dark:bg-neutral-900"
              required
            />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="vertePortalLink">Lien vers le portail Verte</Label>
              <InfoTooltip content="Entrez le lien vers le portail Verte de votre société." />
            </div>
            <Input
              id="vertePortalLink"
              name="vertePortalLink"
              type="url"
              value={campaignForm.companyShares.vertePortalLink}
              onChange={(e) => handleNestedInputChange(e, 'companyShares')}
              className="bg-gray-50 dark:bg-neutral-900"
              required
            />
          </div>

          {/* Campagne avec avocat */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasLawyer"
              checked={campaignForm.hasLawyer}
              onCheckedChange={() => handleCheckboxChange('hasLawyer')}
            />
            <Label htmlFor="hasLawyer">Campagne avec avocat</Label>
            <InfoTooltip content="Cochez cette case si votre campagne est assistée par un avocat." />
          </div>

          {/* Informations sur l'avocat */}
          {campaignForm.hasLawyer && (
            <>
              <div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="lawyerName">Nom de l'avocat</Label>
                  <InfoTooltip content="Entrez le nom complet de l'avocat associé à votre campagne." />
                </div>
                <Input
                  id="lawyerName"
                  name="name"
                  value={campaignForm.lawyer.name}
                  onChange={(e) => handleNestedInputChange(e, 'lawyer')}
                  className="bg-gray-50 dark:bg-neutral-900"
                  required
                />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="lawyerContact">Contact de l'avocat</Label>
                  <InfoTooltip content="Fournissez une adresse e-mail pour contacter l'avocat." />
                </div>
                <Input
                  id="lawyerContact"
                  name="contact"
                  value={campaignForm.lawyer.contact}
                  onChange={(e) => handleNestedInputChange(e, 'lawyer')}
                  className="bg-gray-50 dark:bg-neutral-900"
                  required
                />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="lawyerPhone">Téléphone de l'avocat</Label>
                  <InfoTooltip content="Indiquez le numéro de téléphone professionnel de l'avocat." />
                </div>
                <Input
                  id="lawyerPhone"
                  name="phone"
                  value={campaignForm.lawyer.phone}
                  onChange={(e) => handleNestedInputChange(e, 'lawyer')}
                  className="bg-gray-50 dark:bg-neutral-900"
                />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="lawyerAddress">Adresse Ethereum de l'avocat</Label>
                  <InfoTooltip content="Entrez l'adresse Ethereum de l'avocat." />
                </div>
                <Input
                  id="lawyerAddress"
                  name="address"
                  value={campaignForm.lawyer.address}
                  onChange={(e) => handleNestedInputChange(e, 'lawyer')}
                  className="bg-gray-50 dark:bg-neutral-900"
                  required
                />
              </div>
            </>
          )}

          {/* Équipe */}
          <div>
            <div className="flex items-center space-x-2">
              <Label>Équipe</Label>
              <InfoTooltip content="Ajoutez les membres clés de votre équipe et leurs rôles." />
            </div>
            {campaignForm.teamMembers.map((member, index) => (
              <div key={index} className="mt-2 space-y-2 p-4 bg-gray-100 dark:bg-neutral-900 rounded-md">
                <Input
                  placeholder="Nom"
                  value={member.name}
                  onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                  className="bg-white dark:bg-neutral-900"
                />
                <Input
                  placeholder="Rôle"
                  value={member.role}
                  onChange={(e) => handleTeamMemberChange(index, 'role', e.target.value)}
                  className="bg-white dark:bg-neutral-900"
                />
                <Input
                  placeholder="Twitter"
                  value={member.twitter}
                  onChange={(e) => handleTeamMemberChange(index, 'twitter', e.target.value)}
                  className="bg-white dark:bg-neutral-900"
                />
                <Input
                  placeholder="Facebook"
                  value={member.facebook}
                  onChange={(e) => handleTeamMemberChange(index, 'facebook', e.target.value)}
                  className="bg-white dark:bg-neutral-900"
                />
                <Button
                  type="button"
                  onClick={() => removeTeamMember(index)}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Minus className="w-4 h-4 mr-2" />
                  Supprimer ce membre
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={addTeamMember}
              className="mt-2 bg-lime-500 hover:bg-lime-400 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un membre
            </Button>
          </div>

          {/* Documents de la campagne */}
          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="documents">Documents de la campagne</Label>
              <InfoTooltip content="Téléchargez les documents pertinents pour votre campagne (business plan, pitch deck, etc.)." />
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <Input
                id="documents"
                name="documents"
                type="file"
                onChange={(e) => handleFileChange(e, 'documents')}
                multiple
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => document.getElementById('documents').click()}
                className="bg-lime-500 hover:bg-lime-400 text-white font-bold"
              >
                <Upload className="w-4 h-4 mr-2" />
                Parcourir
              </Button>
              <span className="text-sm text-gray-400">
                {campaignForm.documents.length} fichier(s) sélectionné(s)
              </span>
            </div>
            {campaignForm.documents.length > 0 && (
              <ScrollArea className="h-32 w-full border rounded-md mt-2 p-2 bg-gray-50 dark:bg-neutral-900">
                {campaignForm.documents.map((file, index) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <span className="text-sm text-neutral-900 dark:text-gray-300">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index, 'documents')}
                      className="text-red-500 hover:text-red-700"
                    >
                      Supprimer
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            )}
          </div>

          {/* Médias de la campagne */}
          <div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="media">Médias de la campagne</Label>
              <InfoTooltip content="Ajoutez des vidéos ou autres médias pour présenter votre projet." />
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <Input
                id="media"
                name="media"
                type="file"
                onChange={(e) => handleFileChange(e, 'media')}
                multiple
                accept="video/*"
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => document.getElementById('media').click()}
                className="bg-lime-500 hover:bg-lime-400 text-white font-bold"
              >
                <Upload className="w-4 h-4 mr-2" />
                Ajouter des médias
              </Button>
              <span className="text-sm text-gray-400">
                {campaignForm.media.length} média(s) sélectionné(s)
              </span>
            </div>
            {campaignForm.media.length > 0 && (
              <ScrollArea className="h-32 w-full border rounded-md mt-2 p-2 bg-gray-50 dark:bg-neutral-900">
                {campaignForm.media.map((file, index) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <span className="text-sm text-neutral-900 dark:text-gray-300">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index, 'media')}
                      className="text-red-500 hover:text-red-700"
                    >
                      Supprimer
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            )}
          </div>

          {/* Acceptation des conditions */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="acceptTerms"
              checked={campaignForm.acceptTerms}
              onCheckedChange={() => handleCheckboxChange('acceptTerms')}
              required
            />
            <Label htmlFor="acceptTerms">
              J'accepte les conditions générales d'utilisation et je décharge l'application de toute responsabilité
            </Label>
            <InfoTooltip content="En cochant cette case, vous acceptez nos conditions d'utilisation et notre politique de confidentialité." />
          </div>

          {/* Bouton de soumission */}
          <Button type="submit" className="w-full bg-lime-600 hover:bg-lime-700 text-white" disabled={!campaignForm.acceptTerms || writeLoading}>
            {writeLoading ? "Création en cours..." : "Créer la campagne"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
