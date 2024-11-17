"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Share2, Repeat, FileText, BarChart, Link, AlertTriangle, Plus, Video, Megaphone, ShieldCheck, MessageSquare, Twitter, Github, BookOpen } from 'lucide-react';
import { useAddress, useContract, useContractRead, useContractEvents } from '@thirdweb-dev/react';
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

  const [investors, setInvestors] = useState([]);
  const [isLoadingInvestors, setIsLoadingInvestors] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const { contract: platformContract } = useContract(PLATFORM_ADDRESS, DivarProxyABI);
  const { contract: campaignContract } = useContract(campaignAddress, CampaignABI);

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

  const { data: transferEvents } = useContractEvents(
    campaignContract,
    "Transfer",
    { fromBlock: 0 }
  );

  const { data: dividendEvents } = useContractEvents(
    campaignContract,
    "DividendsDistributed",
    { fromBlock: 0 }
  );

  useEffect(() => {
    if (userCampaigns && userCampaigns.length > 0) {
      setCampaignAddress(userCampaigns[0]);
    }
  }, [userCampaigns]);

  useEffect(() => {
    async function fetchCampaignData() {
      if (!campaignContract || !platformContract) return;
      setIsLoading(true);

      try {
        const [roundData, totalSupply, metadata] = await Promise.all([
          campaignContract.call("getCurrentRound"),
          campaignContract.call("totalSupply"),
          platformContract.call("campaignRegistry", [campaignAddress])
        ]);

        const now = Date.now();
        const endTime = roundData.endTime.toNumber() * 1000;
        const isActive = now < endTime;

        setCampaignData({
          address: campaignAddress,
          name: metadata.name,
          status: isActive ? "En cours" : "Finalisée",
          raised: ethers.utils.formatEther(roundData.fundsRaised),
          goal: ethers.utils.formatEther(roundData.targetAmount),
          investors: totalSupply.toNumber(),
          nftTotal: roundData.targetAmount.div(roundData.sharePrice).toNumber(),
          nftPrice: ethers.utils.formatEther(roundData.sharePrice),
          endDate: new Date(endTime),
          timeRemaining: isActive ? endTime - now : 0,
          lawyer: metadata.lawyer
        });
      } catch (error) {
        console.error("Erreur lors du chargement:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCampaignData();
  }, [campaignContract, campaignAddress, platformContract]);

  useEffect(() => {
    async function fetchInvestments() {
      if (!campaignContract) return;
      setIsLoadingInvestors(true);
      
      try {
        const investorCount = await campaignContract.call("totalSupply");
        const investorsData = [];

        for (let i = 0; i < investorCount; i++) {
          const investorAddress = await campaignContract.call("ownerOf", [i]);
          const shares = await campaignContract.call("balanceOf", [investorAddress]);
          
          investorsData.push({
            address: investorAddress,
            nftCount: shares.toString()
          });
        }

        setInvestors(investorsData);
      } catch (error) {
        console.error("Erreur lors de la récupération des investisseurs:", error);
      } finally {
        setIsLoadingInvestors(false);
      }
    }
  
    fetchInvestments();
  }, [campaignContract]);
  
  useEffect(() => {
    async function fetchTransactions() {
      if (!campaignContract) return;
      setIsLoadingTransactions(true);

      try {
        const events = await campaignContract.events.getEvents("SharesPurchased");
        const formattedTransactions = events.map(event => ({
          address: event.data.investor,
          nftCount: event.data.numShares.toString(),
          amount: ethers.utils.formatEther(event.data.amount),
          timestamp: new Date(event.block.timestamp * 1000).toLocaleString(),
          roundNumber: event.data.roundNumber.toString()
        }));

        setTransactions(formattedTransactions);
      } catch (error) {
        console.error("Erreur lors de la récupération des transactions:", error);
      } finally {
        setIsLoadingTransactions(false);
      }
    }

    fetchTransactions();
  }, [campaignContract]);

  useEffect(() => {
    async function fetchDocuments() {
      if (!campaignContract) return;
      try {
        const docs = await campaignContract.call("getCampaignDocuments");
        setDocuments(docs.map(doc => ({
          name: doc.name,
          url: `https://ipfs.io/ipfs/${doc.ipfsHash}`,
          timestamp: new Date(doc.timestamp.toNumber() * 1000).toLocaleDateString()
        })));
      } catch (error) {
        console.error("Erreur chargement documents:", error);
      }
    }
    fetchDocuments();
  }, [campaignContract]);

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

  const calculateDividendPerNFT = () => {
    const amount = parseFloat(distributeForm.amount);
    if (isNaN(amount) || amount <= 0) return 0;
    return (amount / (campaignData?.nftTotal || 1)).toFixed(6);
  };

  const handleDocumentUpload = async (file) => {
    setIsUploadingDoc(true);
    try {
      const ipfsHash = await uploadToIPFS(file); // Fonction à implémenter selon votre solution IPFS
      await campaignContract.call("addDocument", [ipfsHash, file.name]);
      const docs = await campaignContract.call("getDocuments");
      setDocuments(docs);
    } catch (error) {
      console.error("Erreur upload document:", error);
      alert("Erreur lors de l'upload du document");
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Rendu du composant
  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (!campaignData) {
    return <div>Aucune donnée de campagne disponible.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestion de la Campagne</h1>

      <Card>
        <CardHeader>
          <CardTitle>{campaignData.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              <p className="text-lg font-semibold">{campaignData.status}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Montant Levé</p>
              <p className="text-lg font-semibold">{campaignData.raised} ETH</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Objectif</p>
              <p className="text-lg font-semibold">{campaignData.goal} ETH</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Investisseurs</p>
              <p className="text-lg font-semibold">{campaignData.investors}</p>
            </div>
          </div>
          <Progress 
            value={(parseFloat(campaignData.raised) / parseFloat(campaignData.goal)) * 100} 
            className="mt-4" 
          />
          <p className="text-sm text-muted-foreground mt-2">
            {campaignData.status === "En cours" 
              ? `Temps restant : ${Math.floor(campaignData.timeRemaining / (1000 * 60 * 60 * 24))} jours`
              : "Campagne terminée"}
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
                            <SelectItem value="ETH">ETH</SelectItem>
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
                        disabled={campaignData.status !== "Finalisée"}
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
                      
                      {!campaignData.lawyer && (
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
              <Card>
                <CardHeader>
                  <CardTitle>Historique des Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Adresse</TableHead>
                          <TableHead>NFTs</TableHead>
                          <TableHead>Montant (ETH)</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingTransactions ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center">Chargement...</TableCell>
                          </TableRow>
                        ) : transactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center">Aucune transaction</TableCell>
                          </TableRow>
                        ) : (
                          transactions.map((tx, index) => (
                            <TableRow key={index}>
                              <TableCell>{tx.address.slice(0, 6)}...{tx.address.slice(-4)}</TableCell>
                              <TableCell>{tx.nftCount}</TableCell>
                              <TableCell>{tx.amount}</TableCell>
                              <TableCell>{tx.timestamp}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
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
                      <TableHead>Adresse</TableHead>
                      <TableHead>NFTs détenus</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingInvestors ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center">Chargement...</TableCell>
                      </TableRow>
                    ) : investors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center">Aucun investisseur</TableCell>
                      </TableRow>
                    ) : (
                      investors.map((investor, index) => (
                        <TableRow key={index}>
                          <TableCell>{investor.address.slice(0, 6)}...{investor.address.slice(-4)}</TableCell>
                          <TableCell>{investor.nftCount}</TableCell>
                        </TableRow>
                      ))
                    )}
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
              <Input 
                type="file" 
                onChange={(e) => handleDocumentUpload(e.target.files[0])}
                disabled={isUploadingDoc}
                className="w-60"
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {documents.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    Aucun document
                  </div>
                ) : (
                  documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded">
                      <span className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        {doc.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {doc.timestamp}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => window.open(doc.url)}>
                          Voir
                        </Button>
                      </div>
                    </div>
                  ))
                )}
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
                <Button variant="outline" className="w-full p-4 h-auto flex flex-col items-center gap-2">
                  <svg
                    className="w-6 h-6"
                    viewBox="0 -28.5 256 256"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031Z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="text-sm">Discord</span>
                </Button>
                
                <Button variant="outline" className="w-full p-4 h-auto flex flex-col items-center gap-2">
                  <svg viewBox="0 0 24 24" className="w-6 h-6">
                    <path
                      fill="currentColor"
                      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                    />
                  </svg>
                  <span className="text-sm">Twitter</span>
                </Button>

                <Button variant="outline" className="w-full p-4 h-auto flex flex-col items-center gap-2">
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 98 96"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="text-sm">GitHub</span>
                </Button>

                <Button variant="outline" className="w-full p-4 h-auto flex flex-col items-center gap-2">
                  <svg className="w-6 h-6" viewBox="0 0 1043.63 592.71">
                    <path
                      d="M588.67 296.36c0 163.67-131.78 296.35-294.33 296.35S0 460 0 296.36 131.78 0 294.34 0s294.33 132.69 294.33 296.36M911.56 296.36c0 154.06-65.89 279-147.17 279s-147.17-124.94-147.17-279 65.88-279 147.16-279 147.17 124.9 147.17 279M1043.63 296.36c0 138-23.17 249.94-51.76 249.94s-51.75-111.91-51.75-249.94 23.17-249.94 51.75-249.94 51.76 111.9 51.76 249.94"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="text-sm">Medium</span>
                </Button>

                <Button variant="outline" className="w-full p-4 h-auto flex flex-col items-center gap-2">
                  <MessageSquare className="w-6 h-6" />
                  <span className="text-sm">Forum</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showDistributeDialog} onOpenChange={setShowDistributeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Distribuer des Dividendes</DialogTitle>
          </DialogHeader>
          {/* Contenu du dialogue de distribution */}
        </DialogContent>
      </Dialog>

      <Dialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rouvrir la Campagne</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reopenGoal">Nouvel Objectif (ETH)</Label>
              <Input
                id="reopenGoal"
                type="number"
                value={reopenForm.goal}
                onChange={(e) => setReopenForm(prev => ({ ...prev, goal: e.target.value }))}
                placeholder="Entrez le nouvel objectif"
              />
            </div>
            <div>
              <Label htmlFor="reopenSharePrice">Nouveau Prix des NFTs (ETH)</Label>
              <Input
                id="reopenSharePrice"
                type="number"
                value={reopenForm.sharePrice}
                onChange={(e) => setReopenForm(prev => ({ ...prev, sharePrice: e.target.value }))}
                placeholder="Entrez le nouveau prix des NFTs"
              />
            </div>
            <div>
              <Label htmlFor="reopenEndDate">Nouvelle Date de Fin</Label>
              <Input
                id="reopenEndDate"
                type="date"
                value={reopenForm.endDate}
                onChange={(e) => setReopenForm(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <Button onClick={handleReopenCampaign} className="w-full">
              Rouvrir la Campagne
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promouvoir la Campagne</DialogTitle>
          </DialogHeader>
          {/* Contenu du dialogue de promotion */}
        </DialogContent>
      </Dialog>

      <Dialog open={showCertifyDialog} onOpenChange={setShowCertifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Certifier la Campagne</DialogTitle>
          </DialogHeader>
          {/* Contenu du dialogue de certification */}
        </DialogContent>
      </Dialog>
    </div>
  );
}