// News.jsx
'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, ArrowRight } from 'lucide-react';
import ModalArticle from './ModalArticle';
import ProjectDetails from './ProjectDetails';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { ethers } from 'ethers';
import DivarProxyABI from '@/ABI/DivarProxyABI.json';
import CampaignABI from '@/ABI/CampaignABI.json';

const formatEthValue = (value) => {
  if (!value) return "0";
  try {
    return ethers.utils.formatEther(value.toString());
  } catch (error) {
    console.error("Erreur formatage:", error);
    return "0";
  }
};

const CarteArticle = ({ article, onClick }) => (
  <Card className="bg-white dark:bg-neutral-900 shadow hover:shadow-md transition-shadow duration-300">
    {article.image && (
      <img src={article.image} alt={article.titre} className="w-full h-48 object-cover rounded-t-lg" />
    )}
    <CardContent className="p-4">
      <div className="flex justify-between items-start mb-2">
        <Badge variant="secondary" className="bg-lime-100 text-lime-800 dark:bg-lime-700 dark:text-lime-100">
          {article.dateCreation ? new Date(article.dateCreation).toLocaleDateString() : 'Date inconnue'}
        </Badge>
      </div>
      <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-2">{article.titre}</h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">{article.contenu}</p>
      <div className="flex justify-between items-center">
        <Button variant="link" size="sm" className="text-lime-600 dark:text-lime-400 p-0" onClick={() => onClick(article)}>
          Lire <ExternalLink className="ml-1 h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-neutral-600 hover:text-lime-600 dark:text-neutral-400 dark:hover:text-lime-400"
          onClick={() => onClick(article, true)}
        >
          Voir campagne <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default function Actualites() {
  const [filtreNom, setFiltreNom] = useState('');
  const [filtreDate, setFiltreDate] = useState('');
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    const fetchAllArticles = async () => {
      setIsLoading(true);
      try {
        const campaignsRef = collection(db, 'campaign_fire');
        const campaignsSnapshot = await getDocs(campaignsRef);
        
        const allArticles = [];
        
        for (const campaignDoc of campaignsSnapshot.docs) {
          const campaignName = campaignDoc.id;
          const newsRef = collection(db, 'campaign_fire', campaignName, 'news');
          const newsSnapshot = await getDocs(newsRef);
          
          newsSnapshot.docs.forEach(newsDoc => {
            allArticles.push({
              ...newsDoc.data(),
              id: newsDoc.id,
              campaignName: campaignName
            });
          });
        }
        
        allArticles.sort((a, b) => {
          const dateA = a.dateCreation ? new Date(a.dateCreation) : new Date(0);
          const dateB = b.dateCreation ? new Date(b.dateCreation) : new Date(0);
          return dateB - dateA;
        });
        
        setArticles(allArticles);
      } catch (error) {
        console.error("Erreur lors de la récupération des articles:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllArticles();
  }, []);

  const filteredArticles = articles.filter(article => {
    const matchName = article.titre.toLowerCase().includes(filtreNom.toLowerCase());
    const matchDate = !filtreDate || (article.dateCreation && new Date(article.dateCreation) >= new Date(filtreDate));
    return matchName && matchDate;
  });

  // Dans News.jsx
  const handleArticleClick = async (article, showProject = false) => {
    if (showProject && article.campaignName) {
      try {
        const provider = new ethers.providers.JsonRpcProvider(
          `https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
        );
  
        const contract = new ethers.Contract(
          "0x9fc348c0f4f4b1Ad6CaB657a7C519381FC5D3941",
          DivarProxyABI,
          provider
        );
  
        const allCampaigns = await contract.getAllCampaigns();
        
        for (const address of allCampaigns) {
          const campaignInfo = await contract.campaignRegistry(address);
          if (campaignInfo.name === article.campaignName) {
            const campaign = new ethers.Contract(address, CampaignABI, provider);
            const roundInfo = await campaign.getCurrentRound();
  
            setSelectedProject({
              id: address,
              name: campaignInfo.name,
              sector: campaignInfo.category,
              sharePrice: formatEthValue(roundInfo.sharePrice),
              raised: formatEthValue(roundInfo.fundsRaised),
              goal: formatEthValue(campaignInfo.targetAmount),
              endDate: new Date(campaignInfo.creationTime.toNumber() * 1000).toLocaleDateString(),
              isActive: roundInfo.isActive,
              isFinalized: roundInfo.isFinalized,
              creator: campaignInfo.creator,
              creationTime: campaignInfo.creationTime.toNumber()
            });
            setShowProjectDetails(true);
            return;
          }
        }
      } catch (error) {
        console.error("Erreur:", error);
      }
    } else {
      setSelectedArticle(article);
      setShowArticleModal(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 dark:bg-neutral-900">
      <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-8">
        Actualités Livar
      </h1>
      
      <div className="mb-8 p-4 bg-white dark:bg-neutral-800 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Rechercher par titre"
            value={filtreNom}
            onChange={(e) => setFiltreNom(e.target.value)}
            className="bg-gray-100 dark:bg-neutral-700"
          />
          <Input
            type="date"
            value={filtreDate}
            onChange={(e) => setFiltreDate(e.target.value)}
            className="bg-gray-100 dark:bg-neutral-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map(article => (
          <CarteArticle 
            key={article.id} 
            article={article}
            onClick={handleArticleClick}
          />
        ))}
      </div>

      {selectedArticle && (
        <ModalArticle 
          article={selectedArticle}
          isOpen={showArticleModal}
          onClose={() => {
            setShowArticleModal(false);
            setSelectedArticle(null);
          }}
        />
      )}

      {selectedProject && (
        <ProjectDetails
          selectedProject={selectedProject}
          onClose={() => {
            setShowProjectDetails(false);
            setSelectedProject(null);
          }}
        />
      )}
    </div>
  );
}