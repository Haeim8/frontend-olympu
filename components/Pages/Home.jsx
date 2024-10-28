"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, ArrowRight, Shield } from 'lucide-react';
import CampaignModal from './CampaignModal';
import ProjectDetails from './ProjectDetails';
import { useContract, useContractRead } from '@thirdweb-dev/react';
import { ethers } from 'ethers';

import FundRaisingPlatformABI from '@/ABI/FundRaisingPlatformABI.json';

const formatEthValue = (value) => {
  try {
    const num = parseFloat(value);
    if (isNaN(num)) return "0";
    
    // Formater le nombre avec un maximum de 3 décimales
    const formatted = num.toFixed(3);
    
    // Supprimer les zéros inutiles à la fin
    return formatted.replace(/\.?0+$/, '');
  } catch {
    return "0";
  }
};

export default function Home() {
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState({});

  const { contract: platformContract, isLoading: contractLoading, error: contractError } = useContract(
    "0xD624ddFe214734dAceA2aacf8bb47e837B5228DD",
    FundRaisingPlatformABI
  );

  const { data: campaignAddresses, isLoading: addressesLoading, error: addressesError } = useContractRead(
    platformContract,
    "getAllCampaigns",
    []
  );

  const fetchCampaignData = async (campaignAddress) => {
    if (!platformContract) {
      console.error("Le contrat plateforme n'est pas disponible");
      return null;
    }

    try {
      console.log("Tentative de récupération pour l'adresse:", campaignAddress);

      const campaignInfo = await platformContract.call("campaignRegistry", [campaignAddress]);
      console.log("Données brutes reçues du registre:", campaignInfo);

      if (!campaignInfo || !campaignInfo.campaignAddress) {
        throw new Error("Données de campagne invalides");
      }

      const formattedData = {
        id: campaignAddress,
        name: `Campaign ${campaignAddress.slice(0, 6)}`,
        sector: campaignInfo.category || "Général",
        sharePrice: ethers.utils.formatEther(campaignInfo.targetAmount),
        raised: "0",
        goal: ethers.utils.formatEther(campaignInfo.targetAmount),
        endDate: new Date(campaignInfo.creationTime.toNumber() * 1000).toLocaleDateString(),
        isActive: campaignInfo.isActive,
        isCertified: campaignInfo.isCertified,
        creator: campaignInfo.creator
      };

      console.log("Données formatées:", formattedData);
      return formattedData;

    } catch (error) {
      console.error(`Erreur pour la campagne ${campaignAddress}:`, error);
      return null;
    }
  };

  useEffect(() => {
    const fetchAllCampaigns = async () => {
      if (!campaignAddresses || !platformContract) {
        console.log("Conditions non remplies:", {
          hasCampaignAddresses: !!campaignAddresses,
          numberOfAddresses: campaignAddresses?.length,
          hasPlatformContract: !!platformContract
        });
        return;
      }

      setIsLoading(true);
      setDebugInfo(prev => ({
        ...prev,
        startFetch: new Date().toISOString()
      }));

      try {
        console.log("Début de la récupération des campagnes. Adresses:", campaignAddresses);
        
        const campaignDataPromises = campaignAddresses.map(fetchCampaignData);
        const campaignsData = await Promise.all(campaignDataPromises);
        
        const validCampaigns = campaignsData.filter(campaign => campaign !== null);
        console.log("Campagnes valides trouvées:", validCampaigns);
        
        setProjects(validCampaigns);
        setDebugInfo(prev => ({
          ...prev,
          campaignsCount: validCampaigns.length,
          fetchComplete: new Date().toISOString()
        }));

      } catch (error) {
        console.error("Erreur lors de la récupération des campagnes:", error);
        setDebugInfo(prev => ({
          ...prev,
          error: error.message
        }));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllCampaigns();
  }, [platformContract, campaignAddresses]);

  return (
    <div className="p-3 md:p-1">
      <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded text-sm">
        <h3 className="font-bold mb-2">Debug Info:</h3>
        <p>Contract Loading: {contractLoading ? "Yes" : "No"}</p>
        <p>Contract Error: {contractError ? contractError.message : "None"}</p>
        <p>Addresses Loading: {addressesLoading ? "Yes" : "No"}</p>
        <p>Campaign Addresses: {campaignAddresses ? campaignAddresses.length : 0}</p>
        <p>Projects Loaded: {projects.length}</p>
        <pre className="mt-2 text-xs">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 md:mb-0">
          Projets en cours de financement
        </h2>
        <Button
          onClick={() => setShowCreateCampaign(true)}
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
              {contractError ? "Erreur de connexion au contrat" : "Aucune campagne disponible pour le moment."}
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
                    <div className="text-gray-900 dark:text-gray-100">{formatEthValue(project.sharePrice)} ETH</div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900 dark:text-gray-100">
                          {formatEthValue(project.raised)} ETH
                        </span>
                        <span className="text-sm text-gray-500">
                          {((parseFloat(project.raised) / parseFloat(project.goal)) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-1">
                        <div
                          className="h-2.5 rounded-full bg-lime-400"
                          style={{
                            width: `${(parseFloat(project.raised) / parseFloat(project.goal)) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-gray-900 dark:text-gray-100">{formatEthValue(project.goal)} ETH</div>
                    <div
                      className="flex justify-end"
                      onClick={() => setSelectedProject(project)}
                    >
                      <div className="group relative inline-flex items-center justify-center p-2 overflow-hidden font-medium text-lime-400 rounded-lg shadow-xl transition duration-300 ease-out bg-gray-50 dark:bg-neutral-900 hover:bg-lime-50 dark:hover:bg-lime-900">
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
          onClose={() => setSelectedProject(null)}
        />
      )}

      <CampaignModal
        showCreateCampaign={showCreateCampaign}
        setShowCreateCampaign={setShowCreateCampaign}
        onCampaignCreated={() => {
          setShowCreateCampaign(false);
        }}
      />
    </div>
  );
}