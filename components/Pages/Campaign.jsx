"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Share2, Repeat, FileText, BarChart, Link, AlertTriangle, Home, Wallet, MessageSquare, Newspaper, Sun, Moon, ChevronDown, Menu, Plus, Video, Megaphone, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

export default function campaign() {
  const [darkMode, setDarkMode] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activePage, setActivePage] = useState('campaigns');
  const [showDistributeDialog, setShowDistributeDialog] = useState(false);
  const [distributeForm, setDistributeForm] = useState({
    amount: "",
    token: "USDC",
    message: ""
  });
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [reopenForm, setReopenForm] = useState({
    goal: "",
    sharePrice: "",
    endDate: ""
  });
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [showCertifyDialog, setShowCertifyDialog] = useState(false);

  const campaign = {
    id: 1,
    name: "Tech Startup A",
    status: "En cours",
    raised: 750000,
    goal: 1000000,
    investors: 150,
    nftTotal: 1000,
    nftPrice: 1000,
    endDate: "2023-12-31T23:59:59",
    lawyer: null,
    firstRound: {
      raised: 750000,
      investors: 150,
      endDate: "2023-06-30"
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleDistributeChange = (field, value) => {
    setDistributeForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDistributeDividends = () => {
    const amount = parseFloat(distributeForm.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Veuillez entrer un montant valide.");
      return;
    }
    alert(`Distribution de ${amount} ${distributeForm.token} confirmée. Message : ${distributeForm.message}`);
    setDistributeForm({ amount: "", token: "USDC", message: "" });
  };

  const calculateDividendPerNFT = () => {
    const amount = parseFloat(distributeForm.amount);
    if (isNaN(amount) || amount <= 0) return 0;
    return (amount / campaign.nftTotal).toFixed(6);
  };

  const handleReopenCampaign = () => {
    if (parseFloat(reopenForm.sharePrice) < campaign.nftPrice) {
      alert("Le nouveau prix des NFT ne peut pas être inférieur au prix du tour précédent.");
      return;
    }
    alert(`Campagne réouverte avec un nouvel objectif de ${reopenForm.goal} USDC et un prix de NFT de ${reopenForm.sharePrice} USDC.`);
    setShowReopenDialog(false);
    setReopenForm({ goal: "", sharePrice: "", endDate: "" });
  };

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
              <span className="text-gray-900 dark:text-gray-100">John Doe</span>
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
              onClick={() => setActivePage('home')}
              className={`justify-center ${activePage === 'home' ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
              title="Accueil">
              <Home className="h-5 w-5 text-lime-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActivePage('wallet')}
              className={`justify-center ${activePage === 'wallet' ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
              title="Portefeuille">
              <Wallet className="h-5 w-5 text-lime-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActivePage('campaigns')}
              className={`justify-center ${activePage === 'campaigns' ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
              title="Campagnes">
              <BarChart className="h-5 w-5 text-lime-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActivePage('discussions')}
              className={`justify-center ${activePage === 'discussions' ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
              title="Discussions">
              <MessageSquare className="h-5 w-5 text-lime-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActivePage('news')}
              className={`justify-center ${activePage === 'news' ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
              title="Actualités">
              <Newspaper className="h-5 w-5 text-lime-500" />
            </Button>
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-8 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestion de la Campagne</h1>

            <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">{campaign.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Statut</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{campaign.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Montant Levé</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{campaign.raised.toLocaleString()} USDC</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Objectif</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{campaign.goal.toLocaleString()} USDC</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Investisseurs</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{campaign.investors}</p>
                  </div>
                </div>
                <Progress value={(campaign.raised / campaign.goal) * 100} className="mt-4 bg-gray-200 dark:bg-gray-700" indicatorClassName="bg-green-500" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Temps restant : {new Date(campaign.endDate).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Tabs defaultValue="finance" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800">
                <TabsTrigger 
                  value="finance" 
                  className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-950 dark:data-[state=active]:text-gray-100"
                >
                  Finance
                </TabsTrigger>
                <TabsTrigger 
                  value="investors" 
                  className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-950 dark:data-[state=active]:text-gray-100"
                >
                  Investisseurs
                </TabsTrigger>
                <TabsTrigger 
                  value="documents" 
                  className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-950 dark:data-[state=active]:text-gray-100"
                >
                  Documents
                </TabsTrigger>
                <TabsTrigger 
                  value="social" 
                  className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-950 dark:data-[state=active]:text-gray-100"
                >
                  Social
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="finance">
                <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-gray-100">Gestion Financière</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-gray-900 dark:text-gray-100">Distribution de Dividendes</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="distributeAmount" className="text-gray-700 dark:text-gray-300">Montant à distribuer</Label>
                              <Input
                                id="distributeAmount"
                                type="number"
                                value={distributeForm.amount}
                                onChange={(e) => handleDistributeChange('amount', e.target.value)}
                                placeholder="Entrez le montant"
                                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              />
                            </div>
                            <div>
                              <Label htmlFor="distributeToken" className="text-gray-700 dark:text-gray-300">Token à distribuer</Label>
                              <Select onValueChange={(value) => handleDistributeChange('token', value)} defaultValue={distributeForm.token}>
                                <SelectTrigger className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                                  <SelectValue placeholder="Sélectionnez un token" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="USDC">USDC</SelectItem>
                                  <SelectItem value="ETH">ETH</SelectItem>
                                  <SelectItem value="BTC">BTC</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="distributeMessage" className="text-gray-700 dark:text-gray-300">Message (optionnel)</Label>
                              <Input
                                id="distributeMessage"
                                value={distributeForm.message}
                                onChange={(e) => handleDistributeChange('message', e.target.value)}
                                placeholder="Message pour les investisseurs"
                                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              />
                            </div>
                            {distributeForm.amount && (
                              <Alert className="bg-gray-100 dark:bg-gray-800">
                                <AlertTitle>Aperçu de la distribution</AlertTitle>
                                <AlertDescription>
                                  Chaque NFT recevra {calculateDividendPerNFT()} {distributeForm.token}
                                </AlertDescription>
                              </Alert>
                            )}
                            <Button onClick={handleDistributeDividends} className="w-full bg-lime-500 hover:bg-lime-600 text-white">
                              Distribuer les Dividendes
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-gray-900 dark:text-gray-100">Actions de Campagne</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <Button 
                              className="w-full bg-lime-500 hover:bg-lime-600 text-white" 
                              onClick={() => setShowReopenDialog(true)}
                              disabled={campaign.status !== "Finalisée"}
                            >
                              <Repeat className="mr-2 h-4 w-4" />
                              Rouvrir la Campagne
                            </Button>
                            <Button className="w-full bg-lime-500 hover:bg-lime-600 text-white">
                              <Share2 className="mr-2 h-4 w-4" />
                              Partager la Campagne
                            </Button>
                            <Button className="w-full bg-lime-500 hover:bg-lime-600 text-white">
                              <Video className="mr-2 h-4 w-4" />
                              Démarrer Live
                            </Button>
                            <Button className="w-full bg-lime-500 hover:bg-lime-600 text-white" onClick={() => setShowPromoteDialog(true)}>
                              <Megaphone className="mr-2 h-4 w-4" />
                              Promouvoir la Campagne
                            </Button>
                            {!campaign.lawyer && (
                              <Button className="w-full bg-lime-500 hover:bg-lime-600 text-white" onClick={() => setShowCertifyDialog(true)}>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Certifier la Campagne
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="investors">
                <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-gray-100">Liste des Investisseurs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-100 dark:bg-gray-800">
                            <TableHead className="text-gray-900 dark:text-gray-100">Nom</TableHead>
                            <TableHead className="text-gray-900 dark:text-gray-100">Montant Investi</TableHead>
                            <TableHead className="text-gray-900 dark:text-gray-100">NFTs</TableHead>
                            <TableHead className="text-gray-900 dark:text-gray-100">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="bg-white dark:bg-gray-950">
                            <TableCell className="text-gray-900 dark:text-gray-100">John Doe</TableCell>
                            <TableCell className="text-gray-900 dark:text-gray-100">10,000 USDC</TableCell>
                            <TableCell className="text-gray-900 dark:text-gray-100">10</TableCell>
                            <TableCell className="text-gray-900 dark:text-gray-100">2023-05-15</TableCell>
                          </TableRow>
                          <TableRow className="bg-white dark:bg-gray-950">
                            <TableCell className="text-gray-900 dark:text-gray-100">Jane Smith</TableCell>
                            <TableCell className="text-gray-900 dark:text-gray-100">25,000 USDC</TableCell>
                            <TableCell className="text-gray-900 dark:text-gray-100">25</TableCell>
                            <TableCell className="text-gray-900 dark:text-gray-100">2023-05-17</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="documents">
                <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-gray-900 dark:text-gray-100">Documents Légaux</CardTitle>
                    <Button className="bg-lime-500 hover:bg-lime-600 text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter un document
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded">
                        <span className="text-gray-900 dark:text-gray-100">Whitepaper.pdf</span>
                        <Button variant="ghost" size="sm" className="text-lime-500 hover:text-lime-600">
                          <FileText className="h-4 w-4 mr-2" />
                          Voir
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded">
                        <span className="text-gray-900 dark:text-gray-100">Contrat_Investissement.pdf</span>
                        <Button variant="ghost" size="sm" className="text-lime-500 hover:text-lime-600">
                          <FileText className="h-4 w-4 mr-2" />
                          Voir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="social">
                <Card className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-gray-100">Réseaux Sociaux et Communication</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                      <Button variant="outline" className="w-full p-2 h-auto bg-white dark:bg-gray-800 flex items-center justify-center">
                        <Image src="/discord-logo.svg" alt="Discord" width={24} height={24} />
                      </Button>
                      <Button variant="outline" className="w-full p-2 h-auto bg-white dark:bg-gray-800 flex items-center justify-center">
                        <Image src="/x-logo.svg" alt="X (Twitter)" width={24} height={24} />
                      </Button>
                      <Button variant="outline" className="w-full p-2 h-auto bg-white dark:bg-gray-800 flex items-center justify-center">
                        <Image src="/medium-logo.svg" alt="Medium" width={24} height={24} />
                      </Button>
                      <Button variant="outline" className="w-full p-2 h-auto bg-white dark:bg-gray-800 flex items-center justify-center">
                        <Image src="/github-logo.svg" alt="GitHub" width={24} height={24} />
                      </Button>
                      <Button variant="outline" className="w-full p-2 h-auto bg-white dark:bg-gray-800 flex items-center justify-center">
                        <Image src="/reddit-logo.svg" alt="Reddit" width={24} height={24} />
                      </Button>
                    </div>
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Derniers Articles</h3>
                      <div className="space-y-2">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                          <a href="#" className="text-lime-500 hover:text-lime-600 hover:underline">Notre vision pour l'avenir de la technologie</a>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Publié le 2023-09-15</p>
                        </div>
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                          <a href="#" className="text-lime-500 hover:text-lime-600 hover:underline">Comment nous utilisons l'IA pour révolutionner l'industrie</a>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Publié le 2023-08-30</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Dialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
              <DialogContent className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
                <DialogHeader>
                  <DialogTitle>Rouvrir la Campagne</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reopenGoal">Nouvel objectif de levée (USDC)</Label>
                    <Input
                      id="reopenGoal"
                      type="number"
                      value={reopenForm.goal}
                      onChange={(e) => setReopenForm({...reopenForm, goal: e.target.value})}
                      placeholder="Entrez le nouvel objectif"
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reopenSharePrice">Nouveau prix par NFT (USDC)</Label>
                    <Input
                      id="reopenSharePrice"
                      type="number"
                      value={reopenForm.sharePrice}
                      onChange={(e) => setReopenForm({...reopenForm, sharePrice: e.target.value})}
                      placeholder="Entrez le nouveau prix par NFT"
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reopenEndDate">Nouvelle date de fin</Label>
                    <Input
                      id="reopenEndDate"
                      type="datetime-local"
                      value={reopenForm.endDate}
                      onChange={(e) => setReopenForm({...reopenForm, endDate: e.target.value})}
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <Button onClick={handleReopenCampaign} className="w-full bg-lime-500 hover:bg-lime-600 text-white">Confirmer la Réouverture</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
              <DialogContent className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
                <DialogHeader>
                  <DialogTitle>Promouvoir la Campagne</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p>Choisissez votre méthode de paiement pour promouvoir la campagne :</p>
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">Payer en Fiat</Button>
                  <Button className="w-full bg-lime-500 hover:bg-lime-600 text-white">Payer en Crypto</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showCertifyDialog} onOpenChange={setShowCertifyDialog}>
              <DialogContent className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
                <DialogHeader>
                  <DialogTitle>Certifier la Campagne</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p>Pour certifier votre campagne, veuillez fournir les informations suivantes :</p>
                  <Input placeholder="Nom complet" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                  <Input placeholder="Numéro d'identification" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                  <Input placeholder="Pays" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                  <Input type="file" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                  <Button className="w-full bg-lime-500 hover:bg-lime-600 text-white">Soumettre pour Certification</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}