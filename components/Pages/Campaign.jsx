"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
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
import { DollarSign, Share2, Repeat, FileText, BarChart, Link, AlertTriangle, Plus, Video, Megaphone, ShieldCheck } from 'lucide-react';
import { useAddress, useContract, useContractRead } from '@thirdweb-dev/react';
import { ethers } from 'ethers';
import DivarProxyABI from '@/ABI/DivarProxyABI.json';
import CampaignABI from '@/ABI/CampaignABI.json';
const PLATFORM_ADDRESS = "0x9fc348c0f4f4b1Ad6CaB657a7C519381FC5D3941";

export default function Campaign() {
  const address = useAddress();
  const [campaignAddress, setCampaignAddress] = useState(null);
  const [campaignData, setCampaignData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDistributeDialog, setShowDistributeDialog] = useState(false);
  const [distributeForm, setDistributeForm] = useState({
    amount: "",
    token: "ETH",
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

  // Connexion aux contrats
  const { contract: platformContract } = useContract(PLATFORM_ADDRESS, DivarProxyABI);
  const { contract: campaignContract } = useContract(campaignAddress, CampaignABI);

  // Lecture des données
  const { data: userCampaigns } = useContractRead(
    platformContract,
    "getCampaignsByCreator",
    [address]
  );

  const { data: currentRound } = useContractRead(
    campaignContract,
    "getCurrentRound",
    []
  );

  useEffect(() => {
    if (userCampaigns && userCampaigns.length > 0) {
      setCampaignAddress(userCampaigns[0]);
    }
  }, [userCampaigns]);

  useEffect(() => {
    async function fetchCampaignData() {
      if (!campaignContract) return;
      setIsLoading(true);

      try {
        const [roundData, totalSupply, metadata] = await Promise.all([
          campaignContract.call("getCurrentRound"),
          campaignContract.call("totalSupply"),
          platformContract.call("campaignRegistry", [campaignAddress])
        ]);

        setCampaignData({
          address: campaignAddress,
          name: metadata.name,
          status: roundData.isActive ? "En cours" : "Finalisée",
          raised: ethers.utils.formatEther(roundData.fundsRaised),
          goal: ethers.utils.formatEther(roundData.targetAmount),
          investors: totalSupply.toNumber(),
          nftTotal: roundData.targetAmount.div(roundData.sharePrice).toNumber(),
          nftPrice: ethers.utils.formatEther(roundData.sharePrice),
          endDate: new Date(roundData.endTime.toNumber() * 1000),
          lawyer: metadata.lawyer
        });
      } catch (error) {
        console.error("Erreur lors du chargement:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCampaignData();
  }, [campaignContract, campaignAddress]);

  const handleDistributeChange = (field, value) => {
    setDistributeForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDistributeDividends = async () => {
    try {
      const amount = ethers.utils.parseEther(distributeForm.amount);
      const tx = await campaignContract.call(
        "distributeDividends",
        [amount],
        { value: amount }
      );
      await tx.wait();
      setDistributeForm({ amount: "", token: "ETH", message: "" });
      alert("Distribution réussie!");
    } catch (error) {
      console.error("Erreur lors de la distribution:", error);
      alert(error.message);
    }
  };

  const calculateDividendPerNFT = () => {
    const amount = parseFloat(distributeForm.amount);
    if (isNaN(amount) || amount <= 0) return 0;
    return (amount / campaignData?.nftTotal || 1).toFixed(6);
  };

  const handleReopenCampaign = async () => {
    try {
      if (parseFloat(reopenForm.sharePrice) < campaignData.nftPrice) {
        throw new Error("Prix des NFTs trop bas");
      }

      const targetAmount = ethers.utils.parseEther(reopenForm.goal);
      const sharePrice = ethers.utils.parseEther(reopenForm.sharePrice);
      const duration = Math.floor((new Date(reopenForm.endDate).getTime() - Date.now()) / 1000);

      const tx = await campaignContract.call(
        "startNewRound",
        [targetAmount, sharePrice, duration]
      );
      await tx.wait();
      
      setShowReopenDialog(false);
      setReopenForm({ goal: "", sharePrice: "", endDate: "" });
      alert("Nouveau round démarré!");
    } catch (error) {
      console.error("Erreur:", error);
      alert(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestion de la Campagne</h1>

      <Card>
        <CardHeader>
          <CardTitle>{campaignData?.name || "Chargement..."}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              <p className="text-lg font-semibold">{campaignData?.status || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Montant Levé</p>
              <p className="text-lg font-semibold">{campaignData?.raised || "0"} ETH</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Objectif</p>
              <p className="text-lg font-semibold">{campaignData?.goal || "0"} ETH</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Investisseurs</p>
              <p className="text-lg font-semibold">{campaignData?.investors || "0"}</p>
            </div>
          </div>
          <Progress 
            value={(parseFloat(campaignData?.raised || 0) / parseFloat(campaignData?.goal || 1)) * 100} 
            className="mt-4" 
          />
          <p className="text-sm text-muted-foreground mt-2">
            Temps restant : {campaignData?.endDate ? new Date(campaignData.endDate).toLocaleString() : "N/A"}
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="finance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="investors">Investisseurs</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>
        
        <TabsContent value="finance">
          <Card>
            <CardHeader>
              <CardTitle>Gestion Financière</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribution de Dividendes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="distributeAmount">Montant à distribuer</Label>
                        <Input
                          id="distributeAmount"
                          type="number"
                          value={distributeForm.amount}
                          onChange={(e) => handleDistributeChange('amount', e.target.value)}
                          placeholder="Entrez le montant"
                        />
                      </div>
                      <div>
                        <Label htmlFor="distributeToken">Token à distribuer</Label>
                        <Select onValueChange={(value) => handleDistributeChange('token', value)} defaultValue={distributeForm.token}>
                          <SelectTrigger>
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
                        <Label htmlFor="distributeMessage">Message (optionnel)</Label>
                        <Input
                          id="distributeMessage"
                          value={distributeForm.message}
                          onChange={(e) => handleDistributeChange('message', e.target.value)}
                          placeholder="Message pour les investisseurs"
                        />
                      </div>
                      {distributeForm.amount && (
                        <Alert>
                          <AlertTitle>Aperçu de la distribution</AlertTitle>
                          <AlertDescription>
                            Chaque NFT recevra {calculateDividendPerNFT()} {distributeForm.token}
                          </AlertDescription>
                        </Alert>
                      )}
                      <Button onClick={handleDistributeDividends} className="w-full">
                        Distribuer les Dividendes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card>
  <CardHeader>
    <CardTitle>Actions de Campagne</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <Button 
        className="w-full" 
        onClick={() => setShowReopenDialog(true)}
        disabled={campaignData?.status !== "Finalisée"}
      >
        <Repeat className="mr-2 h-4 w-4" />
        Rouvrir la Campagne
      </Button>
      
      <Button className="w-full">
        <Share2 className="mr-2 h-4 w-4" />
        Partager la Campagne
      </Button>
      
      <Button className="w-full">
        <Video className="mr-2 h-4 w-4" />
        Démarrer Live
      </Button>
      
      <Button 
        className="w-full" 
        onClick={() => setShowPromoteDialog(true)}
      >
        <Megaphone className="mr-2 h-4 w-4" />
        Promouvoir la Campagne
      </Button>
      
      {!campaignData?.lawyer && (
        <Button 
          className="w-full" 
          onClick={() => setShowCertifyDialog(true)}
        >
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
          <Card>
            <CardHeader>
              <CardTitle>Liste des Investisseurs</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Montant Investi</TableHead>
                      <TableHead>NFTs</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>John Doe</TableCell>
                      <TableCell>10,000 USDC</TableCell>
                      <TableCell>10</TableCell>
                      <TableCell>2023-05-15</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Jane Smith</TableCell>
                      <TableCell>25,000 USDC</TableCell>
                      <TableCell>25</TableCell>
                      <TableCell>2023-05-17</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documents Légaux</CardTitle>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un document
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-secondary rounded">
                  <span>Whitepaper.pdf</span>
                  <Button variant="ghost" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Voir
                  </Button>
                </div>
                <div className="flex items-center justify-between p-2 bg-secondary rounded">
                  <span>Contrat_Investissement.pdf</span>
                  <Button variant="ghost" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Voir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Réseaux Sociaux et Communication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                <Button variant="outline" className="w-full p-2 h-auto">
                  <Image src="/images/discord-logo.svg" alt="Discord" width={24} height={24} />
                </Button>
                <Button variant="outline" className="w-full p-2 h-auto">
                  <Image src="/images/x-logo.svg" alt="X (Twitter)" width={24} height={24} />
                </Button>
                <Button variant="outline" className="w-full p-2 h-auto">
                  <Image src="/images/medium-logo.svg" alt="Medium" width={24} height={24} />
                </Button>
                <Button variant="outline" className="w-full p-2 h-auto">
                  <Image src="/images/github-logo.svg" alt="GitHub" width={24} height={24} />
                </Button>
                <Button variant="outline" className="w-full p-2 h-auto">
                  <Image src="/images/reddit-logo.svg" alt="Reddit" width={24} height={24} />
                </Button>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Derniers Articles</h3>
                <div className="space-y-2">
                  <div className="p-2 bg-secondary rounded">
                    <a href="#" className="text-primary hover:underline">Notre vision pour l'avenir de la technologie</a>
                    <p className="text-sm text-muted-foreground">Publié le 2023-09-15</p>
                  </div>
                  <div className="p-2 bg-secondary rounded">
                    <a href="#" className="text-primary hover:underline">Comment nous utilisons l'IA pour révolutionner l'industrie</a>
                    <p className="text-sm text-muted-foreground">Publié le 2023-08-30</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
        <DialogContent>
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
              />
            </div>
            <div>
              <Label htmlFor="reopenEndDate">Nouvelle date de fin</Label>
              <Input
                id="reopenEndDate"
                type="datetime-local"
                value={reopenForm.endDate}
                onChange={(e) => setReopenForm({...reopenForm, endDate: e.target.value})}
              />
            </div>
            <Button onClick={handleReopenCampaign} className="w-full">Confirmer la Réouverture</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promouvoir la Campagne</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Choisissez votre méthode de paiement pour promouvoir la campagne :</p>
            <Button className="w-full">Payer en Fiat</Button>
            <Button className="w-full">Payer en Crypto</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCertifyDialog} onOpenChange={setShowCertifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Certifier la Campagne</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Pour certifier votre campagne, veuillez fournir les informations suivantes :</p>
            <Input placeholder="Nom complet" />
            <Input placeholder="Numéro d'identification" />
            <Input placeholder="Pays" />
            <Input type="file" />
            <Button className="w-full">Soumettre pour Certification</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}