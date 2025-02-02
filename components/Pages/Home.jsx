"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, ArrowRight, Shield, ChevronDown } from 'lucide-react';
import CampaignModal from './CampaignModal';
import ProjectDetails from './ProjectDetails';
import { useContract, useContractRead } from '@thirdweb-dev/react';
import { ethers } from 'ethers';


const PLATFORM_ADDRESS = "0x9fc348c0f4f4b1Ad6CaB657a7C519381FC5D3941";
const PROVIDER_URL = `https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY2}`;
const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
const campaignCache = new Map();
const BATCH_SIZE = 30;
const BATCH_DELAY = 500;

const PLATFORM_ABI = [
  {
    "inputs": [],
    "name": "getAllCampaigns",
    "outputs": [{"type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"type": "address"}],
    "name": "campaignRegistry",
    "outputs": [{
      "components": [
        {"name": "campaignAddress", "type": "address"},
        {"name": "creator", "type": "address"},
        {"name": "creationTime", "type": "uint256"},
        {"name": "targetAmount", "type": "uint256"},
        {"name": "category", "type": "string"},
        {"name": "isActive", "type": "bool"},
        {"name": "name", "type": "string"},
        {"name": "metadata", "type": "string"}
      ],
      "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  }
];

const CAMPAIGN_ABI = [
  {
    "inputs": [],
    "name": "getCurrentRound",
    "outputs": [
      { "name": "roundNumber", "type": "uint256" },
      { "name": "sharePrice", "type": "uint256" },
      { "name": "targetAmount", "type": "uint256" },
      { "name": "fundsRaised", "type": "uint256" },
      { "name": "sharesSold", "type": "uint256" },
      { "name": "endTime", "type": "uint256" },
      { "name": "isActive", "type": "bool" },
      { "name": "isFinalized", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const formatEthValue = (value) => {
  if (!value) return "0";
  try {
    const formattedValue = ethers.utils.formatEther(value.toString());
    return parseFloat(formattedValue).toFixed(6);
  } catch (error) {
    console.error("Erreur de formatage:", error);
    return "0";
  }
};

export default function Home() {
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFinalized, setShowFinalized] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { contract: platformContract } = useContract(
    PLATFORM_ADDRESS,
    PLATFORM_ABI
  );




  const { data: campaignAddresses, isLoading: addressesLoading } = useContractRead(
    platformContract,
    "getAllCampaigns"
  );
 

  const getCachedCampaignData = async (address) => {
    if (campaignCache.has(address)) {
      return campaignCache.get(address);
    }
    
    const data = await fetchCampaignData(address);
    if (data) {
      campaignCache.set(address, data);
    }
    return data;
  };

  


  const fetchCampaignData = async (campaignAddress) => {
    if (!platformContract) return null;
  
    try { 
      const campaign = new ethers.Contract(campaignAddress, CAMPAIGN_ABI, provider);
      
      // Faire les appels en parallèle plutôt qu'en série
      const [campaignInfo, roundInfo] = await Promise.all([
        platformContract.call("campaignRegistry", [campaignAddress]),
        campaign.getCurrentRound()
      ]);
  
      if (!campaignInfo || !campaignInfo.campaignAddress) {
        return null;
      }
  
      return {
        id: campaignAddress,
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
      };
    } catch (error) {
      console.error(`Error fetching campaign ${campaignAddress}:`, error);
      return null;
    }
  };

  const fetchAllCampaigns = async () => {
    if (!campaignAddresses || !platformContract) {
      setIsLoading(false);
      return;
    }
  
    setIsLoading(true);
    setError(null);
  
    try {
      const results = []; // ← Il manquait cette déclaration
  
      // Pré-filtrer les adresses
      const validAddresses = campaignAddresses.filter(addr => ethers.utils.isAddress(addr));
  
      for (let i = 0; i < validAddresses.length; i += BATCH_SIZE) {
        const batch = validAddresses.slice(i, i + BATCH_SIZE);
        
        const batchPromises = batch.map(address => 
          getCachedCampaignData(address).catch(error => {
            console.error(`Failed to fetch campaign ${address}:`, error);
            return null;
          })
        );
  
        const batchResults = await Promise.all(batchPromises);
        const validResults = batchResults.filter(result => result !== null);
        results.push(...validResults); // On ajoute les nouveaux résultats
  
        const validCampaigns = results.filter(campaign => campaign !== null);
        validCampaigns.sort((a, b) => b.creationTime - a.creationTime);
        setProjects(validCampaigns);
  
        if (i + BATCH_SIZE < validAddresses.length) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      }
  
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setError("Impossible de charger les campagnes. Veuillez réessayer plus tard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!addressesLoading && platformContract) {
      fetchAllCampaigns();
    }
  }, [platformContract, campaignAddresses, addressesLoading]);

  const handleCreateCampaign = () => {
    setShowCreateCampaign(true);
  };

  const handleCampaignCreated = () => {
    setShowCreateCampaign(false);
    fetchAllCampaigns();
  };

  const handleViewDetails = (project) => {
    setSelectedProject(project);
  };

  const handleCloseDetails = () => {
    setSelectedProject(null);
  };

  const renderProgressBar = (raised, goal) => {
    const progress = ((parseFloat(raised) / parseFloat(goal)) * 100) || 0;
    return (
      <div>
        <div className="flex items-center justify-between">
          <span className="text-gray-900 dark:text-gray-100">
            {raised} ETH
          </span>
          <span className="text-sm text-gray-500">
            {progress.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-500 dark:bg-gray-700 rounded-full h-2.5 mt-1">
          <div
            className="h-2.5 rounded-full bg-lime-400"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900 rounded-lg">
        <p className="text-red-600 dark:text-red-200">{error}</p>
        <Button 
          onClick={fetchAllCampaigns}
          className="mt-4 bg-red-600 text-white hover:bg-red-700"
        >
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-1">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="relative mb-4 md:mb-0">
          <div 
            onClick={() => setMenuOpen(!menuOpen)} 
            className="flex items-center gap-2 cursor-pointer"
          >
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Projets en cours de financement
            </h2>
            <ChevronDown className={`h-5 w-5 transition-transform ${menuOpen ? 'transform rotate-180' : ''}`} />
          </div>
          {menuOpen && (
           <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-neutral-950 rounded-lg shadow-lg z-50">
           <div className="py-1">
             <button
               onClick={() => {
                 setShowFinalized(false);
                 setMenuOpen(false);
               }}
               className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-900 dark:text-white"
             >
               Campagnes en cours
             </button>
             <button
               onClick={() => {
                 setShowFinalized(true);
                 setMenuOpen(false);
               }}
               className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-900 dark:text-white"
             >
               Campagnes finalisées
             </button>
           </div>
         </div>
         
         
          )}
        </div>
        <Button
          onClick={handleCreateCampaign}
          className="w-full md:w-auto bg-lime-400 hover:bg-lime-400 text-white font-bold"
        >
          Créer campagne
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {!projects || projects.length === 0 ? (
            <p className="text-center text-gray-600 dark:text-gray-400">
              Aucune campagne disponible pour le moment.
            </p>
          ) : (
            <>
              <div className="hidden md:grid grid-cols-6 gap-4 px-4 py-2 bg-gray-50 dark:bg-neutral-950 rounded-t-lg">
                <div className="font-semibold text-sm text-gray-950 dark:text-gray-300">Nom</div>
                <div className="font-semibold text-sm text-gray-950 dark:text-gray-300">Secteur</div>
                <div className="font-semibold text-sm text-gray-950 dark:text-gray-300">Prix unitaire</div>
                <div className="font-semibold text-sm text-gray-950 dark:text-gray-300">Levée en cours</div>
                <div className="font-semibold text-sm text-gray-950 dark:text-gray-300">Objectif</div>
              </div>

              {projects
                .filter(project => showFinalized ? project.isFinalized : (!project.isFinalized && project.isActive))
                .map((project) => (
                <Card
                  key={project.id}
                  className="w-full bg-white dark:bg-neutral-950 shadow-md hover:shadow-lg transition-all duration-300 border-0 dark:border-0"
                >
                  <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center p-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {project.name}
                      </span>
                      {project.isCertified && (
                        <Shield className="h-4 w-4 text-blue-500" title="Certifié" />
                      )}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">{project.sector}</div>
                    <div className="text-gray-900 dark:text-gray-100">{project.sharePrice} ETH</div>
                    <div>{renderProgressBar(project.raised, project.goal)}</div>
                    <div className="text-gray-900 dark:text-gray-100">{project.goal} ETH</div>
                    <div className="flex justify-end">
                      <div 
                        className="group relative inline-flex items-center justify-center p-2 overflow-hidden font-medium text-lime-400 rounded-lg shadow-xl transition duration-300 ease-out bg-gray-50 dark:bg-neutral-900 hover:bg-lime-50 dark:hover:bg-lime-900 cursor-pointer"
                        onClick={() => handleViewDetails(project)}
                      >
                        <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-lime-600 group-hover:translate-x-0 ease">
                          <ArrowRight className="w-5 h-5" />
                        </span>
                        <span className="absolute flex items-center justify-center w-full h-full text-lime-400 dark:text-lime-400 transition-all duration-300 transform group-hover:translate-x-full ease">
                          <Eye className="w-5 h-5 mr-2" />Voir
                        </span>
                        <span className="relative invisible">Voir détails</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {selectedProject && (
        <ProjectDetails
          selectedProject={selectedProject}
          onClose={handleCloseDetails}
        />
      )}

      <CampaignModal
        showCreateCampaign={showCreateCampaign}
        setShowCreateCampaign={setShowCreateCampaign}
        onCampaignCreated={handleCampaignCreated}
      />

      {menuOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}
