"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Info, Upload, DollarSign, Calendar, FileText, Twitter, Facebook, Play, Share2, Star, X } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [nftCount, setNftCount] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    sector: '',
    description: '',
    sharePrice: '',
    totalShares: '',
    goal: '',
    endDate: '',
    documents: [],
    media: [],
    teamMembers: [{ name: '', role: '', twitter: '', facebook: '' }],
    hasLawyer: false,
    lawyer: {
      name: '',
      contact: '',
      phone: ''
    },
    investmentTerms: {
      remunerationType: '',
      roi: '',
      tokenDistribution: ''
    },
    companyShares: {
      percentageMinted: '',
      vertePortalLink: ''
    },
    acceptTerms: false
  });

  const projects = [
    { 
      id: 1, 
      name: "Projet A", 
      sector: "Tech", 
      sharePrice: 100, 
      raised: 500, 
      goal: 1000, 
      endDate: "2023-12-31",
      description: "Projet A développe une plateforme révolutionnaire d'intelligence artificielle pour optimiser les processus industriels.",
      documents: [
        { name: "Pitch Deck", url: "/documents/pitch_deck.pdf" },
        { name: "Roadmap", url: "/documents/roadmap.pdf" },
      ],
      media: [
        { name: "Présentation du projet", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
        { name: "Démonstration du produit", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" }
      ],
      teamMembers: [
        { name: "Alice Dupont", role: "CEO", twitter: "@alicedupont", facebook: "alice.dupont" },
        { name: "Bob Martin", role: "CTO", twitter: "@bobmartin", facebook: "bob.martin" },
      ],
      hasLawyer: true,
      lawyer: {
        name: "Cabinet Juridique Tech",
        contact: "contact@cabinetjuridiquetech.com",
        phone: "+33 1 23 45 67 89"
      },
      investmentTerms: {
        remunerationType: "Dividendes",
        roi: "Estimé à 3-5 ans",
        tokenDistribution: "N/A"
      },
      companyShares: {
        percentageMinted: 20,
        vertePortalLink: "https://verte.finance/projetA"
      },
      transactions: [
        { id: 1, nftCount: 5, value: 500, totalOwned: 5 },
        { id: 2, nftCount: 3, value: 300, totalOwned: 3 },
      ]
    },
    { 
      id: 2, 
      name: "Projet B", 
      sector: "Finance", 
      sharePrice: 50, 
      raised: 200, 
      goal: 500, 
      endDate: "2023-11-30",
      description: "Projet B révolutionne le secteur financier avec une nouvelle approche de la gestion d'actifs.",
      documents: [
        { name: "Business Plan", url: "/documents/business_plan.pdf" },
        { name: "Financial Projections", url: "/documents/financial_projections.pdf" },
      ],
      media: [
        { name: "Présentation du projet", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      ],
      teamMembers: [
        { name: "Claire Leroy", role: "CEO", twitter: "@claireleroy", facebook: "claire.leroy" },
        { name: "David Brown", role: "CFO", twitter: "@davidbrown", facebook: "david.brown" },
      ],
      hasLawyer: false,
      investmentTerms: {
        remunerationType: "Tokens",
        roi: "Variable",
        tokenDistribution: "Trimestrielle"
      },
      companyShares: {
        percentageMinted: 15,
        vertePortalLink: "https://verte.finance/projetB"
      },
      transactions: [
        { id: 1, nftCount: 4, value: 200, totalOwned: 4 },
      ]
    },
  ];

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

  const handleSelectChange = (value) => {
    setCampaignForm(prev => ({ ...prev, sector: value }));
  };

  const handleCheckboxChange = (name) => {
    setCampaignForm(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newDocuments = Array.from(e.target.files);
      setCampaignForm(prev => ({
        ...prev,
        documents: [...prev.documents, ...newDocuments]
      }));
    }
  };

  const handleMediaChange = (e) => {
    if (e.target.files) {
      const newMedia = Array.from(e.target.files);
      setCampaignForm(prev => ({
        ...prev,
        media: [...prev.media, ...newMedia]
      }));
    }
  };

  const removeDocument = (index) => {
    setCampaignForm(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const removeMedia = (index) => {
    setCampaignForm(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!campaignForm.acceptTerms) {
      alert("Veuillez accepter les conditions générales d'utilisation.");
      return;
    }
    console.log('Formulaire soumis:', campaignForm);
    setShowCreateCampaign(false);
  };

  const handleMint = () => {
    if (selectedProject) {
      console.log(`Minting ${nftCount} NFTs for a total of ${nftCount * selectedProject.sharePrice} USDC`);
      // Implement minting logic here to interact with the smart contract
    }
  };

  const handleShare = () => {
    console.log("Sharing project");
    // Implement share logic here
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    console.log(isFavorite ? "Removed from favorites" : "Added to favorites");
    // Implement favorite logic here
  };

  const NFTSelector = () => (
    <Card className="mt-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
      <CardHeader>
        <CardTitle className="text-xl text-center">Minter des NFT</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-4">
        <div className="text-center">
          <Label htmlFor="nftCount" className="text-sm">Nombre de NFT</Label>
          <Input
            id="nftCount"
            type="number"
            value={nftCount}
            onChange={(e) => setNftCount(Math.max(1, parseInt(e.target.value)))}
            min="1"
            className="w-24 mt-1 text-center bg-gray-100 dark:bg-gray-700"
          />
        </div>
        <p className="text-sm">Prix total : <span className="font-bold">{nftCount * (selectedProject?.sharePrice || 0)} USDC</span></p>
        <Button onClick={handleMint} className="w-full bg-lime-500 hover:bg-lime-600 text-white text-sm font-bold py-2 px-4 rounded">
          Mint : {nftCount} NFT{nftCount > 1 ? 's' : ''}
        </Button>
      </CardContent>
    </Card>
  );

  const renderProjectDetails = () => (
    <Dialog open={showProjectDetails} onOpenChange={setShowProjectDetails}>
      <DialogContent className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 max-w-3xl max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <DialogTitle className="text-2xl font-bold">{selectedProject?.name}</DialogTitle>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleFavorite}>
              <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-400' : ''}`} />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setShowProjectDetails(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <NFTSelector />
        <Tabs defaultValue="overview" className="w-full mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="details">Détails et Documents</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <DollarSign className="w-6 h-6 mx-auto text-lime-500" />
                    <h3 className="mt-1 text-sm font-semibold">Levée en cours</h3>
                    <p className="text-lg font-bold">{selectedProject?.raised.toLocaleString()} USDC</p>
                    <p className="text-xs text-gray-500">sur {selectedProject?.goal.toLocaleString()} USDC</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <DollarSign className="w-6 h-6 mx-auto text-lime-500" />
                    <h3 className="mt-1 text-sm font-semibold">Prix unitaire NFT</h3>
                    <p className="text-lg font-bold">{selectedProject?.sharePrice} USDC</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <Calendar className="w-6 h-6 mx-auto text-lime-500" />
                    <h3 className="mt-1 text-sm font-semibold">Date de fin</h3>
                    <p className="text-lg font-bold">{selectedProject?.endDate}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-lime-600 bg-lime-200">
                    Progression
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-lime-600">
                    {((selectedProject?.raised / selectedProject?.goal) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-lime-200">
                <div style={{ width: `${(selectedProject?.raised / selectedProject?.goal) *

 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-lime-500"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Documents légaux</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {selectedProject?.documents.map((doc, index) => (
                    <li key={index}>{doc.name}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Équipe</h3>
                {selectedProject?.teamMembers.map((member, index) => (
                  <div key={index} className="mb-2 text-sm">
                    <p><strong>{member.name}</strong> - {member.role}</p>
                    <div className="flex space-x-2 mt-1">
                      <a href={`https://twitter.com/${member.twitter}`} target="_blank" rel="noopener noreferrer" className="text-lime-500 hover:text-lime-600">
                        <Twitter className="w-4 h-4" />
                      </a>
                      <a href={`https://facebook.com/${member.facebook}`} target="_blank" rel="noopener noreferrer" className="text-lime-500 hover:text-lime-600">
                        <Facebook className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {selectedProject?.hasLawyer && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Avocat associé</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm"><strong>Nom :</strong> {selectedProject?.lawyer.name}</p>
                  <p className="text-sm"><strong>Contact :</strong> {selectedProject?.lawyer.contact}</p>
                  <p className="text-sm"><strong>Téléphone :</strong> {selectedProject?.lawyer.phone}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="details" className="mt-4 space-y-4">
            <h3 className="text-xl font-semibold">Résumé du projet</h3>
            <p className="text-sm">{selectedProject?.description}</p>
            <h3 className="text-xl font-semibold">Conditions de rémunération des investisseurs</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li><strong>Type de rémunération :</strong> {selectedProject?.investmentTerms.remunerationType}</li>
              <li><strong>Distribution de tokens :</strong> {selectedProject?.investmentTerms.tokenDistribution}</li>
              <li><strong>Temps de retour sur investissement estimé :</strong> {selectedProject?.investmentTerms.roi}</li>
            </ul>
            <h3 className="text-xl font-semibold">Informations sur les parts de la société</h3>
            <p className="text-sm"><strong>Pourcentage de la société minté :</strong> {selectedProject?.companyShares.percentageMinted}%</p>
            <p className="text-sm"><strong>Lien vers le portail Verte :</strong> <a href={selectedProject?.companyShares.vertePortalLink} target="_blank" rel="noopener noreferrer" className="text-lime-500 hover:underline">{selectedProject?.companyShares.vertePortalLink}</a></p>
            <h3 className="text-xl font-semibold">Documents légaux de la société</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedProject?.documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <span className="flex items-center text-sm">
                    <FileText className="w-4 h-4 mr-2" />
                    {doc.name}
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">Télécharger</a>
                  </Button>
                </div>
              ))}
            </div>
            <h3 className="text-xl font-semibold">Médias</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedProject?.media.map((media, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="text-base font-semibold">{media.name}</h4>
                  <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
                    <iframe
                      src={media.url}
                      title={media.name}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="transactions" className="mt-4 space-y-4">
            <h3 className="text-xl font-semibold">Historique des transactions</h3>
            <p className="text-sm"><strong>Nombre d'investisseurs uniques :</strong> {selectedProject?.transactions.length}</p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre de NFT</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valeur</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">NFT en possession</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {selectedProject?.transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{transaction.id}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{transaction.nftCount}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{transaction.value} USDC</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{transaction.totalOwned}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );

  const renderCreateCampaignForm = () => (
    <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
      <DialogContent className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Créer une nouvelle campagne</DialogTitle>
        </DialogHeader>
        <Alert className="mb-6 bg-red-900 border-red-700 text-white">
          <Info className="h-4 w-4" />
          <AlertDescription>
            L'application applique une commission de 15% sur tout achat de la campagne.
          </AlertDescription>
        </Alert>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Nom de la campagne</Label>
            <Input
              id="name"
              name="name"
              value={campaignForm.name}
              onChange={handleInputChange}
              className="bg-gray-100 dark:bg-gray-800"
              required
            />
          </div>

          <div>
            <Label htmlFor="sector">Secteur d'activité</Label>
            <Select onValueChange={handleSelectChange} required>
              <SelectTrigger className="bg-gray-100 dark:bg-gray-800">
                <SelectValue placeholder="Sélectionnez un secteur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tech">Technologie</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="health">Santé</SelectItem>
                <SelectItem value="education">Éducation</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description du projet</Label>
            <Textarea
              id="description"
              name="description"
              value={campaignForm.description}
              onChange={handleInputChange}
              placeholder="Veuillez renseigner ce champ."
              className="bg-gray-100 dark:bg-gray-800"
              required
            />
          </div>

          <div>
            <Label htmlFor="sharePrice">Prix par part (en USDC)</Label>
            <Input
              id="sharePrice"
              name="sharePrice"
              type="number"
              value={campaignForm.sharePrice}
              onChange={handleInputChange}
              className="bg-gray-100 dark:bg-gray-800"
              required
            />
          </div>

          <div>
            <Label htmlFor="totalShares">Nombre total de parts</Label>
            <Input
              id="totalShares"
              name="totalShares"
              type="number"
              value={campaignForm.totalShares}
              onChange={handleInputChange}
              className="bg-gray-100 dark:bg-gray-800"
              required
            />
          </div>

          <div>
            <Label htmlFor="goal">Objectif de levée (en USDC)</Label>
            <Input
              id="goal"
              name="goal"
              type="number"
              value={campaignForm.goal}
              onChange={handleInputChange}
              className="bg-gray-100 dark:bg-gray-800"
              required
            />
          </div>

          <div>
            <Label htmlFor="endDate">Date de fin</Label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              value={campaignForm.endDate}
              onChange={handleInputChange}
              className="bg-gray-100 dark:bg-gray-800"
              required
            />
          </div>

          <div>
            <Label htmlFor="documents">Documents de la campagne</Label>
            <div className="mt-2 flex items-center space-x-2">
              <Input
                id="documents"
                name="documents"
                type="file"
                onChange={handleFileChange}
                multiple
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => document.getElementById('documents').click()}
                className="bg-lime-500 hover:bg-lime-600 text-white font-bold"
              >
                <Upload className="w-4 h-4 mr-2" />
                Parcourir
              </Button>
              <span className="text-sm text-gray-400">
                {campaignForm.documents.length} fichier(s) sélectionné(s)
              </span>
            </div>
            {campaignForm.documents.length > 0 && (
              <ScrollArea className="h-32 w-full border rounded-md mt-2 p-2 bg-gray-100 dark:bg-gray-800">
                {campaignForm.documents.map((file, index) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Supprimer
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            )}
          </div>

          <div>
            <Label htmlFor="media">Médias de la campagne</Label>
            <div className="mt-2 flex items-center space-x-2">
              <Input
                id="media"
                name="media"
                type="file"
                onChange={handleMediaChange}
                multiple
                accept="video/*"
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => document.getElementById('media').click()}
                className="bg-lime-500 hover:bg-lime-600 text-white font-bold"
              >
                <Upload className="w-4 h-4 mr-2" />
                Ajouter des médias
              </Button>
              <span className="text-sm text-gray-400">
                {campaignForm.media.length} média(s) sélectionné(s)
              </span>
            </div>
            {campaignForm.media.length > 0 && (
              <ScrollArea className="h-32 w-full border rounded-md mt-2 p-2 bg-gray-100 dark:bg-gray-800">
                {campaignForm.media.map((file, index) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMedia(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Supprimer
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            )}
          </div>

          <div>
            <Label>Équipe</Label>
            {campaignForm.teamMembers.map((member, index) => (
              <div key={index} className="mt-2 space-y-2">
                <Input
                  placeholder="Nom"
                  value={member.name}
                  onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                  className="bg-gray-100 dark:bg-gray-800"
                />
                <Input
                  placeholder="Rôle"
                  value={member.role}
                  onChange={(e) => handleTeamMemberChange(index, 'role', e.target.value)}
                  className="bg-gray-100 dark:bg-gray-800"
                />
                <Input
                  placeholder="Twitter"
                  value={member.twitter}
                  onChange={(e) => handleTeamMemberChange(index, 'twitter', e.target.value)}
                  className="bg-gray-100 dark:bg-gray-800"
                />
                <Input
                  placeholder="Facebook"
                  value={member.facebook}
                  onChange={(e) => handleTeamMemberChange(index, 'facebook', e.target.value)}
                  className="bg-gray-100 dark:bg-gray-800"
                />
                <Button
                  type="button"
                  onClick={() => removeTeamMember(index)}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Supprimer ce membre
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={addTeamMember}
              className="mt-2 bg-lime-500 hover:bg-lime-600 text-white"
            >
              Ajouter un membre
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasLawyer"
              checked={campaignForm.hasLawyer}
              onCheckedChange={() => handleCheckboxChange('hasLawyer')}
            />
            <Label htmlFor="hasLawyer">Campagne avec avocat</Label>
          </div>

          {campaignForm.hasLawyer && (
            <>
              <div>
                <Label htmlFor="lawyerName">Nom de l'avocat</Label>
                <Input
                  id="lawyerName"
                  name="name"
                  value={campaignForm.lawyer.name}
                  onChange={(e) => handleNestedInputChange(e, 'lawyer')}
                  className="bg-gray-100 dark:bg-gray-800"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lawyerContact">Contact de l'avocat</Label>
                <Input
                  id="lawyerContact"
                  name="contact"
                  value={campaignForm.lawyer.contact}
                  onChange={(e) => handleNestedInputChange(e, 'lawyer')}
                  className="bg-gray-100 dark:bg-gray-800"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lawyerPhone">Téléphone de l'avocat</Label>
                <Input
                  id="lawyerPhone"
                  name="phone"
                  value={campaignForm.lawyer.phone}
                  onChange={(e) => handleNestedInputChange(e, 'lawyer')}
                  className="bg-gray-100 dark:bg-gray-800"
                  required
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="remunerationType">Type de rémunération</Label>
            <Input
              id="remunerationType"
              name="remunerationType"
              value={campaignForm.investmentTerms.remunerationType}
              onChange={(e) => handleNestedInputChange(e, 'investmentTerms')}
              className="bg-gray-100 dark:bg-gray-800"
              required
            />
          </div>

          <div>
            <Label htmlFor="roi">Temps de retour sur investissement estimé</Label>
            <Input
              id="roi"
              name="roi"
              value={campaignForm.investmentTerms.roi}
              onChange={(e) => handleNestedInputChange(e, 'investmentTerms')}
              className="bg-gray-100 dark:bg-gray-800"
              required
            />
          </div>

          <div>
            <Label htmlFor="tokenDistribution">Distribution de tokens</Label>
            <Input
              id="tokenDistribution"
              name="tokenDistribution"
              value={campaignForm.investmentTerms.tokenDistribution}
              onChange={(e) => handleNestedInputChange(e, 'investmentTerms')}
              className="bg-gray-100 dark:bg-gray-800"
              required
            />
          </div>

          <div>
            <Label htmlFor="percentageMinted">Pourcentage de la société minté</Label>
            <Input
              id="percentageMinted"
              name="percentageMinted"
              type="number"
              value={campaignForm.companyShares.percentageMinted}
              onChange={(e) => handleNestedInputChange(e, 'companyShares')}
              className="bg-gray-100 dark:bg-gray-800"
              required
            />
          </div>

          <div>
            <Label htmlFor="vertePortalLink">Lien vers le portail Verte</Label>
            <Input
              id="vertePortalLink"
              name="vertePortalLink"
              value={campaignForm.companyShares.vertePortalLink}
              onChange={(e) => handleNestedInputChange(e, 'companyShares')}
              className="bg-gray-100 dark:bg-gray-800"
              required
            />
          </div>

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
          </div>

          <Button type="submit" className="w-full bg-lime-600 hover:bg-lime-700 text-white" disabled={!campaignForm.acceptTerms}>
            Créer la campagne
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );

  const renderContent = () => (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 md:mb-0">Projets en cours de financement</h2>
        <Button 
          onClick={() => setShowCreateCampaign(true)}
          className="w-full md:w-auto bg-lime-500 hover:bg-lime-600 text-white font-bold transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          Créer campagne
        </Button>
      </div>
      <div className="space-y-6">
        <div className="hidden md:grid grid-cols-6 gap-4 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-t-lg">
          <div className="font-semibold text-sm text-gray-700 dark:text-gray-300">Nom</div>
          <div className="font-semibold text-sm text-gray-700 dark:text-gray-300">Secteur</div>
          <div className="font-semibold text-sm text-gray-700 dark:text-gray-300">Prix unitaire</div>
          <div className="font-semibold text-sm text-gray-700 dark:text-gray-300">Levée en cours</div>
          <div className="font-semibold text-sm text-gray-700 dark:text-gray-300">Objectif</div>
          <div className="font-semibold text-sm text-gray-700 dark:text-gray-300 text-right">Action</div>
        </div>
        {projects.map((project) => (
          <Card key={project.id} className="w-full bg-white dark:bg-gray-950 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center p-4">
              <div className="text-gray-900 dark:text-gray-100 font-semibold">{project.name}</div>
              <div className="text-gray-700 dark:text-gray-300">{project.sector}</div>
              <div className="text-gray-900 dark:text-gray-100">{project.sharePrice} USDC</div>
              <div className="text-gray-900 dark:text-gray-100">
                {project.raised} USDC
                <Progress 
                  value={(project.raised / project.goal) * 100} 
                  className="h-2 mt-1 bg-gray-200 dark:bg-gray-700"
                >
                  <div className="h-full bg-lime-400" style={{ width: `${(project.raised / project.goal) * 100}%` }} />
                </Progress>
              </div>
              <div className="text-gray-900 dark:text-gray-100">{project.goal} USDC</div>
              <div className="flex justify-start md:justify-end mt-2 md:mt-0">
                <Button 
                  onClick={() => {
                    setSelectedProject(project);
                    setShowProjectDetails(true);
                  }}
                  className="w-full md:w-auto bg-lime-500 hover:bg-lime-600 text-white font-bold transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                  Voir détails
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {renderProjectDetails()}
      {renderCreateCampaignForm()}
    </>
  );

  return (
    <div className="p-4 md:p-8">
      {renderContent()}
    </div>
  );
}