"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi'; // Import wagmi
import { useUser } from '@/components/shared/UserContext'; // Importer le contexte utilisateur
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InfoIcon, Home, Wallet, MessageSquare, Newspaper, Sun, Moon, Share2, FileText, X, ArrowLeft, Bell, Star, ChevronDown, Upload, Menu } from "lucide-react";

export default function AppInterface() {
  const { user } = useUser(); // Accéder au pseudonyme
  const { address, isConnected } = useAccount(); // Accéder à l'adresse du wallet

  const [activePage, setActivePage] = useState('home');
  const [darkMode, setDarkMode] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [shareCount, setShareCount] = useState(1);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    campaignName: '',
    startup: '',
    sharePrice: '',
    totalShares: '',
    endTime: '',
    sector: '',
    description: '',
    lawyer: false,
    lawyerWallet: '',
    lawyerContact: '',
    lawyerFirm: '',
    lawyerInfo: '',
    termsAccepted: false,
    documents: []
  });
  const [favorites, setFavorites] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [nfts, setNfts] = useState([]);
  const [selectedNFT, setSelectedNFT] = useState(null);

  const projects = [
    { id: 1, name: "Projet A", sector: "Tech", sharePrice: 100, raised: 500, goal: 1000, endDate: "2023-12-31" },
    { id: 2, name: "Projet B", sector: "Finance", sharePrice: 50, raised: 200, goal: 500, endDate: "2023-11-30" },
  ];

  const walletInfo = {
    pnl: "+500 USDC",
    investedValue: "2000 USDC",
    projectsInvested: 5,
    unlockTime: "30 jours"
  };

  const transactions = [
    { id: 1, type: 'Achat', project: 'Projet A', amount: '100 USDC', date: '2023-09-01' },
    { id: 2, type: 'Vente', project: 'Projet B', amount: '50 USDC', date: '2023-09-15' },
    { id: 3, type: 'Achat', project: 'Projet C', amount: '200 USDC', date: '2023-09-30' },
  ];

  const notifications = [
    { id: 1, message: "Nouvelle campagne lancée : Projet X", date: "2023-09-25" },
    { id: 2, message: "Votre investissement dans Projet A a été confirmé", date: "2023-09-24" },
    { id: 3, message: "Rappel : La campagne Projet B se termine dans 3 jours", date: "2023-09-23" },
  ];

  const changePage = (page) => {
    setActivePage(page);
    setShowCreateCampaign(false);
    setShowMobileMenu(false);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    console.log("Mode sombre:", !darkMode);
    if (darkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const handleInvest = () => {
    console.log(`Investissement de ${shareCount} parts dans ${selectedProject.name}`);
    // Logique d'investissement à implémenter
  };

  const handleCreateCampaign = (e) => {
    e.preventDefault();
    console.log('Formulaire soumis:', campaignForm);
    // Logique de création de campagne à implémenter
    setShowCreateCampaign(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCampaignForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setCampaignForm(prev => ({
      ...prev,
      [name]: value
    }));
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

  const removeDocument = (index) => {
    setCampaignForm(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const toggleFavorite = (projectId) => {
    setFavorites(prev => 
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  useEffect(() => {
    const sharePrice = parseFloat(campaignForm.sharePrice) || 0;
    const totalShares = parseInt(campaignForm.totalShares) || 0;
    const targetAmount = sharePrice * totalShares;
    console.log(`Montant cible calculé: ${targetAmount} USDC`);
  }, [campaignForm.sharePrice, campaignForm.totalShares]);

  useEffect(() => {
    // Simuler la récupération des NFTs depuis une API ou un contrat intelligent
    const fetchNFTs = async () => {
      // Remplacez ceci par votre logique de récupération réelle
      const fetchedNFTs = [
        { id: 1, name: "Campagne Alpha", logo: "/images/nft-alpha.png", minted: 150 },
        { id: 2, name: "Campagne Beta", logo: "/images/nft-beta.png", minted: 75 },
        { id: 3, name: "Campagne Gamma", logo: "/images/nft-gamma.png", minted: 200 },
      ];
      setNfts(fetchedNFTs);
    };

    fetchNFTs();
  }, []);

  const renderContent = () => {
    if (showCreateCampaign) {
      return (
        <Card className="w-full bg-white dark:bg-gray-950 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCreateCampaign(false)}
                className="mr-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                <ArrowLeft className="h-6 w-6" />
              </Button>
              Créer une nouvelle campagne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <InfoIcon className="h-4 w-4 text-blue-700 dark:text-blue-300" />
              <AlertTitle className="text-blue-900 dark:text-blue-100">Information importante</AlertTitle>
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                L'application applique une commission de 15% sur tout achat de la campagne.
              </AlertDescription>
            </Alert>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <Label htmlFor="campaignName" className="text-gray-800 dark:text-gray-200">Nom de la campagne</Label>
                <Input
                  id="campaignName"
                  name="campaignName"
                  value={campaignForm.campaignName}
                  onChange={handleInputChange}
                  required
                  className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="startup" className="text-gray-800 dark:text-gray-200">Adresse de la startup</Label>
                <Input
                  id="startup"
                  name="startup"
                  value={campaignForm.startup}
                  onChange={handleInputChange}
                  required
                  className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="sector" className="text-gray-800 dark:text-gray-200">Secteur d'activité</Label>
                <Select name="sector" onValueChange={(value) => handleSelectChange("sector", value)}>
                  <SelectTrigger className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700">
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
                <Label htmlFor="description" className="text-gray-800 dark:text-gray-200">Description du projet</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={campaignForm.description}
                  onChange={handleInputChange}
                  required
                  className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="sharePrice" className="text-gray-800 dark:text-gray-200">Prix par part (en USDC)</Label>
                <Input
                  id="sharePrice"
                  name="sharePrice"
                  type="number"
                  value={campaignForm.sharePrice}
                  onChange={handleInputChange}
                  required
                  className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="totalShares" className="text-gray-800 dark:text-gray-200">Nombre total de parts</Label>
                <Input
                  id="totalShares"
                  name="totalShares"
                  type="number"
                  value={campaignForm.totalShares}
                  onChange={handleInputChange}
                  required
                  className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="endTime" className="text-gray-800 dark:text-gray-200">Date de fin</Label>
                <Input
                  id="endTime"
                  name="endTime"
                  type="datetime-local"
                  value={campaignForm.endTime}
                  onChange={handleInputChange}
                  required
                  className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="documents" className="text-gray-800 dark:text-gray-200">Documents de la campagne</Label>
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
                    onClick={() => document.getElementById('documents')?.click()}
                    className="bg-lime-500 hover:bg-lime-600 text-white font-bold"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Parcourir
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {campaignForm.documents.length} fichier(s) sélectionné(s)
                  </span>
                </div>
                {campaignForm.documents.length > 0 && (
                  <ScrollArea className="h-32 w-full border rounded-md mt-2 p-2 bg-gray-50 dark:bg-gray-900">
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
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </ScrollArea>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lawyer"
                  name="lawyer"
                  checked={campaignForm.lawyer}
                  onCheckedChange={(checked) => setCampaignForm(prev => ({ ...prev, lawyer: checked }))}
                  className="text-lime-500 dark:text-lime-400"
                />
                <Label htmlFor="lawyer" className="text-gray-800 dark:text-gray-200">Campagne avec avocat</Label>
              </div>
              {campaignForm.lawyer && (
                <>
                  <div>
                    <Label htmlFor="lawyerWallet" className="text-gray-800 dark:text-gray-200">Adresse du portefeuille de l'avocat</Label>
                    <Input
                      id="lawyerWallet"
                      name="lawyerWallet"
                      value={campaignForm.lawyerWallet}
                      onChange={handleInputChange}
                      required
                      className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lawyerContact" className="text-gray-800 dark:text-gray-200">Contact de l'avocat</Label>
                    <Input
                      id="lawyerContact"
                      name="lawyerContact"
                      value={campaignForm.lawyerContact}
                      onChange={handleInputChange}
                      required
                      className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lawyerFirm" className="text-gray-800 dark:text-gray-200">Cabinet d'avocats</Label>
                    <Input
                      id="lawyerFirm"
                      name="lawyerFirm"
                      value={campaignForm.lawyerFirm}
                      onChange={handleInputChange}
                      required
                      className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lawyerInfo" className="text-gray-800 dark:text-gray-200">Informations supplémentaires sur l'avocat</Label>
                    <Textarea
                      id="lawyerInfo"
                      name="lawyerInfo"
                      value={campaignForm.lawyerInfo}
                      onChange={handleInputChange}
                      className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                    />
                  </div>
                </>
              )}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="termsAccepted"
                  name="termsAccepted"
                  checked={campaignForm.termsAccepted}
                  onCheckedChange={(checked) => setCampaignForm(prev => ({ ...prev, termsAccepted: checked }))}
                  required
                  className="text-lime-500 dark:text-lime-400"
                />
                <Label htmlFor="termsAccepted" className="text-gray-800 dark:text-gray-200">
                  J'accepte les conditions générales d'utilisation et je décharge l'application de toute responsabilité
                </Label>
              </div>
              <Button type="submit" className="w-full bg-lime-500 hover:bg-lime-600 text-white font-bold" disabled={!campaignForm.termsAccepted}>
                Créer la campagne
              </Button>
            </form>
          </CardContent>
        </Card>
      )
    }

    switch (activePage) {
      case 'home':
        return (
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
                        onClick={() => setSelectedProject(project)}
                        className="w-full md:w-auto bg-lime-500 hover:bg-lime-600 text-white font-bold transition-all duration-300 ease-in-out transform hover:scale-105"
                      >
                        Voir détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        );
      case 'wallet':
        return (
          <div className="space-y-8">
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Votre portefeuille</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">PNL</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{walletInfo.pnl}</p>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Valeur investie</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{walletInfo.investedValue}</p>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Projets investis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{walletInfo.projectsInvested}</p>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Temps avant déblocage</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{walletInfo.unlockTime}</p>
                </CardContent>
              </Card>
            </div>

            {/* Section des NFTs */}
            <div className="mt-8">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Vos NFTs</h3>
              {nfts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {nfts.map((nft) => (
                    <Card
                      key={nft.id}
                      className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                      onClick={() => setSelectedNFT(nft)}
                    >
                      <CardContent className="flex items-center space-x-4 p-4">
                        <img src={nft.logo} alt={`${nft.name} Logo`} className="w-12 h-12 object-contain" />
                        <div>
                          <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">{nft.name}</h4>
                          <p className="text-sm text-gray-700 dark:text-gray-300">NFTs Mintés : {nft.minted}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-700 dark:text-gray-300">Vous n'avez aucun NFT pour le moment.</p>
              )}
            </div>
          </div>
        );
      case 'discussions':
        return (
          <Card className="bg-white dark:bg-gray-950 shadow-md">
            <CardContent>
              <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Discussions</h2>
              <p className="text-gray-700 dark:text-gray-300">Fonctionnalité de discussions à implémenter.</p>
            </CardContent>
          </Card>
        );
      case 'news':
        return (
          <Card className="bg-white dark:bg-gray-950 shadow-md">
            <CardContent>
              <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Actualités</h2>
              <p className="text-gray-700 dark:text-gray-300">Fonctionnalité d'actualités à implémenter.</p>
            </CardContent>
          </Card>
        );
      case 'favorites':
        return (
          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Levées de fonds favorites</h2>
            {projects.filter(project => favorites.includes(project.id)).map((project) => (
              <Card key={project.id} className="w-full bg-white dark:bg-gray-950 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center p-4">
                  <div className="text-gray-900 dark:text-gray-100 font-semibold">{project.name}</div>
                  <div className="text-gray-700 dark:text-gray-300">{project.sector}</div>
                  <div className="text-gray-900 dark:text-gray-100">{project.sharePrice} USDC</div>
                  <div className="text-gray-900 dark:text-gray-100">{project.raised} USDC</div>
                  <div className="text-gray-900 dark:text-gray-100">{project.goal} USDC</div>
                  <div className="flex justify-start md:justify-end mt-2 md:mt-0">
                    <Button 
                      onClick={() => setSelectedProject(project)}
                      className="w-full md:w-auto bg-lime-500 hover:bg-lime-600 text-white font-bold transition-all duration-300 ease-in-out transform hover:scale-105"
                    >
                      Voir détails
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      default:
        return <Card className="bg-white dark:bg-gray-950 shadow-md"><CardContent><p className="text-gray-900 dark:text-gray-100">Page non trouvée</p></CardContent></Card>;
    }
  }

  return (
    <div className={`flex flex-col h-screen ${darkMode ? 'dark' : ''}`}>
      <header className="p-4 md:p-6 flex justify-between items-center bg-white dark:bg-gray-950 shadow-sm">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 mr-2">
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">CryptoComfort</h1>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
              <Bell className="h-5 w-5" />
            </Button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-950 rounded-md shadow-lg z-10">
                <div className="p-2">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Notifications</h3>
                  {notifications.map((notification) => (
                    <div key={notification.id} className="mb-2 p-2 bg-gray-100 dark:bg-gray-900 rounded">
                      <p className="text-sm text-gray-900 dark:text-gray-100">{notification.message}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{notification.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <div className="relative">
            <Button variant="ghost" className="hidden md:flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700" />
              <span className="text-gray-900 dark:text-gray-100">{user.username || 'Utilisateur'}</span> {/* Afficher le pseudonyme */}
              {isConnected && address && (
                <span className="text-gray-600 dark:text-gray-300 ml-2 truncate w-24" title={address}>
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              )}
              <ChevronDown className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            </Button>
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className={`${showMobileMenu ? 'block' : 'hidden'} md:block w-16 border-r flex-shrink-0 bg-white dark:bg-gray-950 dark:border-gray-800 overflow-y-auto`}>
          <nav className="flex flex-col p-4 space-y-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => changePage('home')}
              className={`justify-center ${activePage === 'home' ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
              title="Accueil">
              <Home className="h-5 w-5 text-lime-400" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => changePage('wallet')}
              className={`justify-center ${activePage === 'wallet' ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
              title="Portefeuille">
              <Wallet className="h-5 w-5 text-lime-400" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => changePage('discussions')}
              className={`justify-center ${activePage === 'discussions' ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
              title="Discussions">
              <MessageSquare className="h-5 w-5 text-lime-400" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => changePage('news')}
              className={`justify-center ${activePage === 'news' ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
              title="Actualités">
              <Newspaper className="h-5 w-5 text-lime-400" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => changePage('favorites')}
              className={`justify-center ${activePage === 'favorites' ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
              title="Favoris">
              <Star className="h-5 w-5 text-lime-400" />
            </Button>
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-8 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
          {renderContent()}
        </main>
      </div>
      
      {/* Modale pour le NFT Sélectionné */}
      {selectedNFT && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-lg relative bg-white dark:bg-gray-950 shadow-2xl p-6">
            <Button
              className="absolute top-2 right-2 p-1 rounded-full transition-all duration-300 ease-in-out bg-red-600 hover:bg-red-700 text-white"
              onClick={() => setSelectedNFT(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">{selectedNFT.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <img src={selectedNFT.logo} alt={`${selectedNFT.name} Logo`} className="w-24 h-24 object-contain mx-auto mb-4" />
              <p className="text-gray-700 dark:text-gray-300">NFTs Mintés : {selectedNFT.minted}</p>
              {/* Ajoutez ici plus de détails si nécessaire */}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modale pour la Déconnexion (Optionnel) */}
      {/* Vous pouvez ajouter une modale pour la déconnexion si nécessaire */}
    </div>
  )
}
