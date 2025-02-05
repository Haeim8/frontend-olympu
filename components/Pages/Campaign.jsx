"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Share2, Repeat, FileText, BarChart, Link, AlertTriangle, Plus, Megaphone, ShieldCheck, MessageSquare, Twitter, Github, BookOpen, Globe, Send } from 'lucide-react';
import { useAddress, useContract, useContractRead, useContractWrite } from '@thirdweb-dev/react';
import { ethers } from 'ethers';
import DivarProxyABI from '@/ABI/DivarProxyABI.json';
import CampaignABI from '@/ABI/CampaignABI.json';
import DocumentManager from '@/components/Systeme/DocumentManager';
import { updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

// Version nettoyée des imports
import { 
  uploadToFirebaseFolder, 
  fetchDocumentsFromFirebase, 
  fetchFileContent,
  readFileContent,
  writeFileContent,
  loadStorageFile,
  storage 
} from '@/lib/firebase/firebase';

const PINATA_GATEWAY = "https://jade-hilarious-gecko-392.mypinata.cloud/ipfs";
const PLATFORM_ADDRESS = "0x9fc348c0f4f4b1Ad6CaB657a7C519381FC5D3941";

export default function Campaign() {
  const address = useAddress();
  const [campaignAddress, setCampaignAddress] = useState(null);
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
  const { contract: platformContract } = useContract(PLATFORM_ADDRESS, DivarProxyABI);
  const { contract: campaignContract } = useContract(campaignAddress, CampaignABI);
  const [isReleasingEscrow, setIsReleasingEscrow] = useState(false);
  const [escrowReleaseError, setEscrowReleaseError] = useState(null);
  const { mutateAsync: claimEscrow } = useContractWrite(campaignContract, "claimEscrow");
  const [socials, setSocials] = useState({
    website: '',
    twitter: '',
    github: '',
    discord: '',
    telegram: '',
    medium: ''
  });
  const [description, setDescription] = useState('');
  const [isEditingSocials, setIsEditingSocials] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false); 

  const { data: userCampaigns } = useContractRead(
    platformContract, 
    "getCampaignsByCreator",
    [address]
  );
  const [campaignData, setCampaignData] = useState(null);
  const [documents, setDocuments] = useState({
    whitepaper: [],
    pitchDeck: [], 
    legal: [],
    media: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  

  const handleSaveDescription = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      // Mettre à jour dans Firestore
      await updateDoc(doc(db, "campaign_fire", campaignData.name), {
        description: description
      });
      
      setIsEditingDescription(false);
    } catch (error) {
      console.error("Erreur sauvegarde description:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveSocials = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      // Mettre à jour dans Firestore
      await updateDoc(doc(db, "campaign_fire", campaignData.name), {
        social: socials
      });
      
      setIsEditingSocials(false);
    } catch (error) {
      console.error("Erreur sauvegarde socials:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    const initializeAndFetchData = async () => {
      if (!campaignContract || !platformContract) return;
      setIsLoading(true);
      
      try {
        // 1. D'abord récupérer les métadonnées IPFS
        const metadataURI = await campaignContract.call("metadata");
        const cid = metadataURI.replace('ipfs://', '').split('/')[0];
        const basePath = `${PINATA_GATEWAY}/${cid}/metadata.json`;
        
        const response = await fetch(basePath);
        const metadata = await response.json();
        const campaignFolder = metadata.external_url.split('/').pop();

        // 2. Ensuite charger les autres données du contrat
        const [name, roundData, totalSupply] = await Promise.all([
          campaignContract.call("name"),
          campaignContract.call("getCurrentRound"),
          campaignContract.call("totalSupply")
        ]);
  
        const now = Date.now();
        const endTime = roundData.endTime ? roundData.endTime.toNumber() * 1000 : 0;
  
        setCampaignData({
          name,
          status: now < endTime ? "En cours" : "Finalisée",
          raised: ethers.utils.formatEther(roundData.fundsRaised),
          goal: ethers.utils.formatEther(roundData.targetAmount),
          investors: totalSupply.toString(),
          timeRemaining: endTime - now,
          folderName: campaignFolder
        });
        
      } catch (error) {
        console.error("Erreur:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
 
    if (campaignAddress && campaignContract && platformContract) {
      initializeAndFetchData();
    }
  }, [campaignContract, campaignAddress, platformContract]);

  useEffect(() => {
    const loadCampaignDocuments = async () => {
      if (!campaignData?.folderName) return;
    
      try {
        // Construire le chemin complet avec "campaigns/"
        const fullPath = `campaigns/${campaignData.folderName}`;
        
        // Récupérer les infos de Firestore
        const campaignDoc = await getDoc(doc(db, "campaign_fire", campaignData.name));
        if (campaignDoc.exists()) {
          const data = campaignDoc.data();
          setDescription(data.description || '');
          setSocials(data.social || {
            website: '',
            twitter: '',
            github: '',
            discord: '',
            telegram: '',
            medium: ''
          });
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };
    
    loadCampaignDocuments();
  }, [campaignData?.folderName]);


  
  useEffect(() => {
    if (userCampaigns && userCampaigns.length > 0) {
      setCampaignAddress(userCampaigns[0]);
    }
  }, [userCampaigns]);

  const handleNewsPublish = async () => {
    try {
      setIsLoading(true);
  
      const newsData = {
        title: newsForm.title,
        content: newsForm.content,
        timestamp: new Date().toISOString()
      };
  
      // Créer un sous-dossier news dans le dossier de la campagne
      const newsFolder = `${campaignAddress}/news`;
  
      // Si des pièces jointes, les uploader
      if (newsForm.attachments.length > 0) {
        const attachmentUploads = await Promise.all(
          Array.from(newsForm.attachments).map(file => 
            uploadToFirebaseFolder(`${newsFolder}/attachments`, file)
          )
        );
        newsData.attachments = attachmentUploads;
      }
  
      // Sauvegarder les données de l'actualité
      const newsFile = new Blob([JSON.stringify(newsData)], { type: 'application/json' });
      await uploadToFirebaseFolder(newsFolder, new File([newsFile], `${Date.now()}.json`));
  
      setShowPromoteDialog(false);
      setNewsForm({ title: '', content: '', attachments: [] });
      alert("Actualité publiée avec succès!");
      
    } catch (error) {
      console.error("Erreur publication:", error);
      alert("Erreur lors de la publication");
    } finally {
      setIsLoading(false);
    }
  }; 

  

  const handleReleaseEscrow = async () => {
    try {
      setIsReleasingEscrow(true);
      setEscrowReleaseError(null);
  
      // Correction ici - on appelle claimEscrow sans arguments
      const tx = await claimEscrow({ args: [] }); // On passe un objet avec un tableau args vide
      await tx.wait();
      
      alert("Escrow libéré avec succès !");
    } catch (error) {
      console.error("Erreur lors de la libération de l'escrow:", error);
      setEscrowReleaseError(error.message);
      alert(error.message);
    } finally {
      setIsReleasingEscrow(false);
    }
  };

  useEffect(() => {
    if (!campaignAddress) return;

    const loadEvents = async () => {
      setIsLoadingTransactions(true);
      setIsLoadingInvestors(true);

      const provider = new ethers.providers.JsonRpcProvider(
        {
          url: `https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
          chainId: 84532,
          name: 'Base Sepolia',
          network: {
            chainId: 84532,
            name: 'Base Sepolia'
          }
        }
      );

      try {
        await provider.ready;
        await provider._networkPromise;

        const contract = new ethers.Contract(campaignAddress, CampaignABI, provider);

        const purchaseFilter = contract.filters.SharesPurchased();
        const refundFilter = contract.filters.SharesRefunded();
        
        const [purchaseEvents, refundEvents] = await Promise.all([
          contract.queryFilter(purchaseFilter),
          contract.queryFilter(refundFilter)
        ]);

        const allTxs = [
          ...purchaseEvents.map(event => ({
            id: event.blockNumber,
            type: 'Achat',
            investor: event.args.investor,
            nftCount: event.args.numShares.toString(),
            value: ethers.utils.formatEther(event.args.value || "0")
          })),
          ...refundEvents.map(event => ({
            id: event.blockNumber,
            type: 'Remboursement',
            investor: event.args.investor,
            nftCount: event.args.numShares.toString(),
            value: ethers.utils.formatEther(event.args.refundAmount || "0")
          }))
        ].sort((a,b) => b.id - a.id);

        setTransactions(allTxs);
            
        const investorsMap = new Map();
        allTxs.forEach(tx => {
          if (tx.type === 'Achat') {
            const currentCount = investorsMap.get(tx.investor) || 0;
            investorsMap.set(tx.investor, currentCount + parseInt(tx.nftCount));
          } else if (tx.type === 'Remboursement') {
            const currentCount = investorsMap.get(tx.investor) || 0;
            investorsMap.set(tx.investor, Math.max(0, currentCount - parseInt(tx.nftCount)));
          }
        });

        const investorsList = Array.from(investorsMap.entries())
          .filter(([_, count]) => count > 0)
          .map(([address, nftCount]) => ({
            address,
            nftCount: nftCount.toString()
          }));

        setInvestors(investorsList);
        setError(null);
            
      } catch (err) {
        console.error("Erreur de connexion au provider:", err);
        setError("Erreur de connexion au réseau Base Sepolia");
      } finally {
        setIsLoadingTransactions(false);
        setIsLoadingInvestors(false);
      }
    };

    loadEvents();
}, [campaignAddress]);

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
    return (amount / (campaignData?.nftTotal || 1)).toFixed(0);
  };



const [newsForm, setNewsForm] = useState({
  title: '',
  content: '',
  attachments: []
});

const handleNewsFormChange = (field, value) => {
  setNewsForm(prev => ({ ...prev, [field]: value }));
};



  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return <div>Erreur : {error}</div>;
  }

  if (!campaignData) {
    return <div>Aucune donnée de campagne disponible.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestion de la Campagne</h1>

      <Card className="bg-white dark:bg-neutral-950 border-0 dark:border-0">
  <CardHeader>
    <CardTitle className="text-gray-900 dark:text-gray-100">{campaignData.name}</CardTitle>
  </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Statut</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{campaignData.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Montant Levé</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{campaignData.raised} ETH</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Objectif</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{campaignData.goal} ETH</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Investisseurs</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{campaignData.investors}</p>
            </div>
          </div>
          <Progress 
            value={(parseFloat(campaignData.raised) / parseFloat(campaignData.goal)) * 100} 
            className="mt-4 bg-lime-200 dark:bg-lime-900" 
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {campaignData.status === "En cours" 
              ? `Temps restant : ${Math.floor(campaignData.timeRemaining / (1000 * 60 * 60 * 24))} jours`
              : "Campagne terminée"}
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="finance" className="space-y-4">
        <TabsList className="bg-gray-100 dark:bg-neutral-900">
          <TabsTrigger value="finance" className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800">Finance</TabsTrigger>
          <TabsTrigger value="investors" className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800">Investisseurs</TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800">Documents</TabsTrigger>
          <TabsTrigger value="social" className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800">Social</TabsTrigger>
        </TabsList>

        <TabsContent value="finance">
          <Card className="bg-white dark:bg-neutral-950 border-0 dark:border-0">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Gestion Financière</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white dark:bg-neutral-950 border-0 dark:border-0">
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
                          className="bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="distributeToken" className="text-gray-700 dark:text-gray-300">Token à distribuer</Label>
                        <Select onValueChange={(value) => handleDistributeChange('token', value)} defaultValue={distributeForm.token}>
                          <SelectTrigger className="bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-gray-100">
                            <SelectValue placeholder="Sélectionnez un token" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ETH">ETH</SelectItem>
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
                          className="bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      {distributeForm.amount && (
                        <Alert className="bg-lime-100 dark:bg-lime-900 border-lime-200 dark:border-lime-800">
                          <AlertTitle className="text-lime-800 dark:text-lime-200">Aperçu de la distribution</AlertTitle>
                          <AlertDescription className="text-lime-700 dark:text-lime-300">
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
                <Card className="bg-white dark:bg-neutral-950 border-0 dark:border-0">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-gray-100">Actions de Campagne</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button 
                        className="w-full bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-neutral-700" 
                        onClick={() => setShowReopenDialog(true)}
                        disabled={campaignData.status !== "Finalisée"}
                      >
                        <Repeat className="mr-2 h-4 w-4" />
                        Rouvrir la Campagne
                      </Button>
                      
                      <Button className="w-full bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-neutral-700">
                        <Share2 className="mr-2 h-4 w-4" />
                        Partager la Campagne
                      </Button>
                      
                     <Button 
  className="w-full bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-neutral-700"
  onClick={handleReleaseEscrow}
  disabled={isReleasingEscrow}
>
  <DollarSign className="mr-2 h-4 w-4" />
  {isReleasingEscrow ? "Libération en cours..." : "Libérer l'Escrow"}
</Button>
                      
                      <Button 
                        className="w-full bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-neutral-700" 
                        onClick={() => setShowPromoteDialog(true)}
                      >
                        <Megaphone className="mr-2 h-4 w-4" />
                        Promouvoir la Campagne
                      </Button>
                      
                      {!campaignData.lawyer && (
                        <Button 
                          className="w-full bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-neutral-700" 
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
              <Card className="bg-white dark:bg-neutral-950 border-0 dark:border-0">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Historique des Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-gray-700 dark:text-gray-300">Type</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Adresse</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">NFTs</TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">Montant (ETH)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingTransactions ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-gray-500 dark:text-gray-400">Chargement...</TableCell>
                          </TableRow>
                        ) : transactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-gray-500 dark:text-gray-400">Aucune transaction</TableCell>
                          </TableRow>
                        ) : (
                          transactions.map((tx, index) => (
                            <TableRow key={index}>
                              <TableCell className="text-gray-900 dark:text-gray-100">{tx.type}</TableCell>
                              <TableCell className="text-gray-900 dark:text-gray-100">{tx.investor.slice(0, 6)}...{tx.investor.slice(-4)}</TableCell>
                              <TableCell className="text-gray-900 dark:text-gray-100">{tx.nftCount}</TableCell>
                              <TableCell className="text-gray-900 dark:text-gray-100">{tx.value}</TableCell>
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
          <Card className="bg-white dark:bg-neutral-950 border-0 dark:border-0">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Liste des Investisseurs</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-700 dark:text-gray-300">Adresse</TableHead>
                      <TableHead className="text-gray-700 dark:text-gray-300">NFTs détenus</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingInvestors ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-gray-500 dark:text-gray-400">Chargement...</TableCell>
                      </TableRow>
                    ) : investors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-gray-500 dark:text-gray-400">Aucun investisseur</TableCell>
                      </TableRow>
                    ) : (
                      investors.map((investor, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-gray-900 dark:text-gray-100">{investor.address.slice(0, 6)}...{investor.address.slice(-4)}</TableCell>
                          <TableCell className="text-gray-900 dark:text-gray-100">{investor.nftCount}</TableCell>
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
        <DocumentManager 
  campaignData={{
    folderName: campaignData?.folderName, // Le nom du dossier qu'on a récupéré d'IPFS
    contractAddress: campaignAddress // Passer l'adresse du contrat
  }}
  onUpdate={(docs) => {
    setCampaignData(prev => ({
      ...prev,
      documents: docs
    }));
  }}
/>
</TabsContent>

<TabsContent value="social">
  <Card className="bg-white dark:bg-neutral-950 border-0 dark:border-0">
    <CardHeader>
      <CardTitle className="text-gray-900 dark:text-gray-100">Description du Projet</CardTitle>
    </CardHeader>
    <CardContent>
      {isEditingDescription ? (
        <form onSubmit={handleSaveDescription} className="space-y-4">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-32 bg-gray-50 dark:bg-neutral-900"
            placeholder="Description du projet..."
          />
          <div className="flex space-x-2">
            <Button type="submit" className="bg-lime-500 hover:bg-lime-600">
              Sauvegarder
            </Button>
            <Button type="button" onClick={() => setIsEditingDescription(false)} variant="outline">
              Annuler
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">{description || "Aucune description"}</p>
          <Button onClick={() => setIsEditingDescription(true)} variant="outline">
            Modifier la description
          </Button>
        </div>
      )}
    </CardContent>
  </Card>

  <Card className="mt-6 bg-white dark:bg-neutral-950 border-0 dark:border-0">
    <CardHeader>
      <CardTitle className="text-gray-900 dark:text-gray-100">Réseaux Sociaux</CardTitle>
    </CardHeader>
    <CardContent>
      {isEditingSocials ? (
        <form onSubmit={handleSaveSocials} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="website">Site Web</Label>
              <Input
                id="website"
                value={socials.website}
                onChange={(e) => setSocials(prev => ({ ...prev, website: e.target.value }))}
                className="bg-gray-50 dark:bg-neutral-900"
                placeholder="URL du site web"
              />
            </div>
            <div>
              <Label htmlFor="twitter">Twitter</Label>
              <Input
                id="twitter"
                value={socials.twitter}
                onChange={(e) => setSocials(prev => ({ ...prev, twitter: e.target.value }))}
                className="bg-gray-50 dark:bg-neutral-900"
                placeholder="@username"
              />
            </div>
            <div>
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                value={socials.github}
                onChange={(e) => setSocials(prev => ({ ...prev, github: e.target.value }))}
                className="bg-gray-50 dark:bg-neutral-900"
                placeholder="username"
              />
            </div>
            <div>
              <Label htmlFor="discord">Discord</Label>
              <Input
                id="discord"
                value={socials.discord}
                onChange={(e) => setSocials(prev => ({ ...prev, discord: e.target.value }))}
                className="bg-gray-50 dark:bg-neutral-900"
                placeholder="Invitation Discord"
              />
            </div>
            <div>
              <Label htmlFor="telegram">Telegram</Label>
              <Input
                id="telegram"
                value={socials.telegram}
                onChange={(e) => setSocials(prev => ({ ...prev, telegram: e.target.value }))}
                className="bg-gray-50 dark:bg-neutral-900"
                placeholder="username"
              />
            </div>
            <div>
              <Label htmlFor="medium">Medium</Label>
              <Input
                id="medium"
                value={socials.medium}
                onChange={(e) => setSocials(prev => ({ ...prev, medium: e.target.value }))}
                className="bg-gray-50 dark:bg-neutral-900"
                placeholder="@username"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <Button type="submit" className="bg-lime-500 hover:bg-lime-600">
              Sauvegarder
            </Button>
            <Button type="button" onClick={() => setIsEditingSocials(false)} variant="outline">
              Annuler
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(socials).map(([platform, value]) => (
              <div key={platform} className="flex items-center space-x-2">
                {platform === 'website' && <Globe className="h-5 w-5 text-lime-500" />}
                {platform === 'twitter' && <Twitter className="h-5 w-5 text-lime-500" />}
                {platform === 'github' && <Github className="h-5 w-5 text-lime-500" />}
                {platform === 'discord' && <MessageSquare className="h-5 w-5 text-lime-500" />}
                {platform === 'telegram' && <Send className="h-5 w-5 text-lime-500" />}
                {platform === 'medium' && <BookOpen className="h-5 w-5 text-lime-500" />}
                <span className="text-gray-700 dark:text-gray-300">{value || "Non défini"}</span>
              </div>
            ))}
          </div>
          <Button onClick={() => setIsEditingSocials(true)} variant="outline">
            Modifier les réseaux sociaux
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>
      </Tabs>

      <Dialog open={showDistributeDialog} onOpenChange={setShowDistributeDialog}>
        <DialogContent className="bg-white dark:bg-neutral-950">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Distribuer des Dividendes</DialogTitle>
          </DialogHeader>
          {/* Contenu du dialogue de distribution */}
        </DialogContent>
      </Dialog>

      <Dialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
        <DialogContent className="bg-white dark:bg-neutral-950">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Rouvrir la Campagne</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reopenGoal" className="text-gray-700 dark:text-gray-300">Nouvel Objectif (ETH)</Label>
              <Input
                id="reopenGoal"
                type="number"
                value={reopenForm.goal}
                onChange={(e) => setReopenForm(prev => ({ ...prev, goal: e.target.value }))}
                placeholder="Entrez le nouvel objectif"
                className="bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <Label htmlFor="reopenSharePrice" className="text-gray-700 dark:text-gray-300">Nouveau Prix des NFTs (ETH)</Label>
              <Input
                id="reopenSharePrice"
                type="number"
                value={reopenForm.sharePrice}
                onChange={(e) => setReopenForm(prev => ({ ...prev, sharePrice: e.target.value }))}
                placeholder="Entrez le nouveau prix des NFTs"
                className="bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <Label htmlFor="reopenEndDate" className="text-gray-700 dark:text-gray-300">Nouvelle Date de Fin</Label>
              <Input
                id="reopenEndDate"
                type="date"
                value={reopenForm.endDate}
                onChange={(e) => setReopenForm(prev => ({ ...prev, endDate: e.target.value }))}
                className="bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <Button onClick={handleReopenCampaign} className="w-full bg-lime-500 hover:bg-lime-600 text-white">
              Rouvrir la Campagne
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
  <DialogContent className="bg-white dark:bg-neutral-950">
    <DialogHeader>
      <DialogTitle className="text-gray-900 dark:text-gray-100">Publier une actualité</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <Input
        placeholder="Titre de l'actualité"
        value={newsForm.title}
        onChange={(e) => handleNewsFormChange('title', e.target.value)}
        className="bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
      />
      <Textarea
        placeholder="Contenu de l'actualité"
        value={newsForm.content}
        onChange={(e) => handleNewsFormChange('content', e.target.value)}
        className="bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
      />
      <Input 
        type="file" 
        onChange={(e) => handleNewsFormChange('attachments', e.target.files)}
        multiple
        className="bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-gray-100"
      />
      <Button 
        onClick={handleNewsPublish}
        className="w-full bg-lime-500 hover:bg-lime-600 text-white"
      >
        Publier
      </Button>
    </div>
  </DialogContent>
</Dialog>

      <Dialog open={showCertifyDialog} onOpenChange={setShowCertifyDialog}>
        <DialogContent className="bg-white dark:bg-neutral-950">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Certifier la Campagne</DialogTitle>
          </DialogHeader>
          {/* Contenu du dialogue de certification */}
        </DialogContent>
      </Dialog>
    </div>
  );
}