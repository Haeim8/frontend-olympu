"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, ArrowRight, Shield } from 'lucide-react';
import CampaignModal from './CampaignModal';
import ProjectDetails from './ProjectDetails';
import { useContract, useContractRead, useContractEvents } from '@thirdweb-dev/react';
import { ethers } from 'ethers';

const PLATFORM_ADDRESS = "0x9fc348c0f4f4b1Ad6CaB657a7C519381FC5D3941";

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
        {"name": "isCertified", "type": "bool"},
        {"name": "lawyer", "type": "address"},
        {"name": "creationTime", "type": "uint256"},
        {"name": "targetAmount", "type": "uint256"},
        {"name": "category", "type": "string"},
        {"name": "isActive", "type": "bool"},
        {"name": "name", "type": "string"}  // Ajout du champ name
      ],
      "type": "tuple"
    }],
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

  const { contract: platformContract } = useContract(
    PLATFORM_ADDRESS,
    PLATFORM_ABI
  );

  const { data: campaignAddresses, isLoading: addressesLoading } = useContractRead(
    platformContract,
    "getAllCampaigns"
  );

  const fetchCampaignName = async (campaignAddress) => {
    try {
      const events = await platformContract.events.getEvents("CampaignCreated", {
        filters: {
          campaignAddress: campaignAddress
        }
      });
      
      if (events && events.length > 0) {
        return events[0].data.name;
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération du nom pour ${campaignAddress}:`, error);
    }
    return null;
  };

  const fetchCampaignData = async (campaignAddress) => {
    if (!platformContract) {
      console.log("Contract not initialized");
      return null;
    }

    try {
      // Récupération des données de base
      const campaignInfo = await platformContract.call("campaignRegistry", [campaignAddress]);
      
      if (!campaignInfo || !campaignInfo.campaignAddress) {
        console.log(`Invalid data for campaign ${campaignAddress}`);
        return null;
      }

      // Récupération du nom via l'événement
      const name = await fetchCampaignName(campaignAddress);

      const formattedData = {
        id: campaignAddress,
        name: name || `Campagne ${campaignInfo.creationTime.toString()}`,
        sector: campaignInfo.category || "Général",
        sharePrice: formatEthValue(campaignInfo.targetAmount),
        raised: "0",
        goal: formatEthValue(campaignInfo.targetAmount),
        endDate: new Date(campaignInfo.creationTime.toNumber() * 1000).toLocaleDateString(),
        isActive: campaignInfo.isActive,
        isCertified: campaignInfo.isCertified,
        creator: campaignInfo.creator,
        lawyer: campaignInfo.lawyer,
        creationTime: campaignInfo.creationTime.toNumber()
      };

      return formattedData;

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
      const campaignDataPromises = campaignAddresses.map(fetchCampaignData);
      const campaignsData = await Promise.all(campaignDataPromises);
      const validCampaigns = campaignsData.filter(campaign => campaign !== null);
      
      // Trier les campagnes par date de création (les plus récentes d'abord)
      validCampaigns.sort((a, b) => b.creationTime - a.creationTime);
      
      setProjects(validCampaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setError("Erreur lors de la récupération des campagnes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!addressesLoading && platformContract) {
      fetchAllCampaigns();
    }
  }, [platformContract, campaignAddresses, addressesLoading]);

  // Écouter les nouveaux événements de création de campagne
  useEffect(() => {
    if (platformContract) {
      const unsubscribe = platformContract.events.addEventListener(
        "CampaignCreated",
        (event) => {
          console.log("Nouvelle campagne créée:", event);
          fetchAllCampaigns();
        }
      );

      return () => {
        unsubscribe();
      };
    }
  }, [platformContract]);

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
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-1">
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
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 md:mb-0">
          Projets en cours de financement
        </h2>
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
        <div className="space-y-6">
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
                <div className="font-semibold text-sm text-gray-950 dark:text-gray-300 text-right">Action</div>
              </div>

              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="w-full bg-white dark:bg-neutral-950 shadow-md hover:shadow-lg transition-all duration-300"
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
    </div>
  );
}