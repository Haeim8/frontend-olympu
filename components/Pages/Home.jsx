//frontend/components/Home.jsx

"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, ArrowRight } from 'lucide-react';
import CampaignModal from './CampaignModal';
import ProjectDetails from './ProjectDetails';

import { db } from "@/lib/firebase/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Home() {
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const campaignsCollection = collection(db, "campaigns");
        const campaignSnapshot = await getDocs(campaignsCollection);
        const campaignsData = [];

        campaignSnapshot.forEach(doc => {
          const data = doc.data();
          const campaignData = {
            id: doc.id,
            name: data.name,
            sector: data.sector || "N/A",
            sharePrice: data.sharePrice,
            raised: data.raised || 0,
            goal: data.goal,
            endDate: data.endDate,
            description: data.description || "",
            documents: data.documents || [],
            media: data.media || [],
            teamMembers: data.teamMembers || [],
            hasLawyer: data.hasLawyer || false,
            lawyer: data.hasLawyer ? data.lawyer : {},
            royaltyFee: data.royaltyFee || 0,
            investmentTerms: data.investmentTerms || {},
            transactions: data.transactions || [],
            companyShares: data.companyShares || {},
            // Ajoutez d'autres champs si nécessaire
          };

          campaignsData.push(campaignData);
        });

        setProjects(campaignsData);
        setIsLoading(false);
      } catch (error) {
        console.error("Erreur lors de la récupération des campagnes depuis Firestore:", error);
        setIsLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  const handleCreateCampaign = (campaignData) => {
    console.log('Nouvelle campagne créée:', campaignData);
    setShowCreateCampaign(false);
    // Rafraîchir la liste des campagnes
    setIsLoading(true);
    setProjects([]);

    const fetchCampaigns = async () => {
      try {
        const campaignsCollection = collection(db, "campaigns");
        const campaignSnapshot = await getDocs(campaignsCollection);
        const campaignsData = [];

        campaignSnapshot.forEach(doc => {
          const data = doc.data();
          const campaignData = {
            id: doc.id,
            name: data.name,
            sector: data.sector || "N/A",
            sharePrice: data.sharePrice,
            raised: data.raised || 0,
            goal: data.goal,
            endDate: data.endDate,
            description: data.description || "",
            documents: data.documents || [],
            media: data.media || [],
            teamMembers: data.teamMembers || [],
            hasLawyer: data.hasLawyer || false,
            lawyer: data.hasLawyer ? data.lawyer : {},
            royaltyFee: data.royaltyFee || 0,
            investmentTerms: data.investmentTerms || {},
            transactions: data.transactions || [],
            companyShares: data.companyShares || {},
            // Ajoutez d'autres champs si nécessaire
          };

          campaignsData.push(campaignData);
        });

        setProjects(campaignsData);
        setIsLoading(false);
      } catch (error) {
        console.error("Erreur lors de la récupération des campagnes depuis Firestore:", error);
        setIsLoading(false);
      }
    };

    fetchCampaigns();
  };

  const handleCloseProjectDetails = () => {
    setSelectedProject(null);
  };

  return (
    <div className="p-3 md:p-1">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 md:mb-0">Projets en cours de financement</h2>
        <Button
          onClick={() => setShowCreateCampaign(true)}
          className="w-full md:w-auto bg-lime-400 hover:bg-lime-400 text-white font-bold transition-all duration-300 ease-in-out transform hover:scale-100"
        >
          Créer campagne
        </Button>
      </div>
      {isLoading ? (
        <p>Chargement des campagnes...</p>
      ) : (
        <div className="space-y-6">
          {projects.length === 0 ? (
            <p>Aucune campagne disponible pour le moment.</p>
          ) : (
            <>
              <div className="hidden md:grid grid-cols-6 gap-4 px-4 py-2 bg-gray-50 dark:bg-neutral-950 rounded-t-lg">
                <div className="font-semibold text-sm text-gray-950 dark:text-gray-300">Nom</div>
                <div className="font-semibold text-sm text-gray-950 dark:text-gray-300">Secteur</div>
                <div className="font-semibold text-sm text-gray-950 dark:text-gray-300">Prix unitaire</div>
                <div className="font-semibold text-sm text-gray-950 dark:text-gray-300">Levée en cours</div>
                <div className="font-semibold text-sm text-gray-950 dark:text-gray-300">Objectif</div>
                <div className="font-semibold text-sm text-gray-700 dark:text-gray-300 text-right">Action</div>
              </div>
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="w-full bg-white dark:bg-neutral-950 shadow-md hover:shadow-lg transition-all duration-300 border-spacing-0.5 border-gray-700 rounded-lg overflow-hidden"
                >
                  <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center p-4">
                    <div className="text-gray-900 dark:text-gray-100 font-semibold">{project.name}</div>
                    <div className="text-gray-700 dark:text-gray-300">{project.sector}</div>
                    <div className="text-gray-900 dark:text-gray-100">{project.sharePrice} ETH</div>
                    <div className="text-gray-900 dark:text-gray-100">
                      {project.raised} ETH
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-1">
                        <div
                          className={`h-2.5 rounded-full bg-lime-400`}
                          style={{ width: `${(parseFloat(project.raised) / parseFloat(project.goal)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-gray-900 dark:text-gray-100">{project.goal} ETH</div>
                    <div
                      className="flex justify-start md:justify-end mt-2 md:mt-0 cursor-pointer"
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
          onClose={handleCloseProjectDetails}
        />
      )}
      <CampaignModal
        showCreateCampaign={showCreateCampaign}
        setShowCreateCampaign={setShowCreateCampaign}
        handleCreateCampaign={handleCreateCampaign}
      />
    </div>
  );
}
