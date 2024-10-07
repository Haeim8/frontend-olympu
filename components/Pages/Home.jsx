"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, ArrowRight } from 'lucide-react';
import CampaignModal from './CampaignModal';
import ProjectDetails from './ProjectDetails';

export default function Home() {
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const projects = [
    { 
      id: 1, 
      name: "Projet A", 
      sector: "Tech", 
      sharePrice: 0.01, 
      raised: 500, 
      goal: 1000, 
      endDate: "2023-12-31",
      description: "Projet A développe une plateforme révolutionnaire d'intelligence artificielle pour optimiser les processus industriels.",
      documents: [
        { name: "Pitch Deck", url: "/documents/pitch_deck.pdf" },
        { name: "Roadmap", url: "/documents/roadmap.pdf" },
      ],
      media: [
        { name: "Présentation du projet", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
        { name: "Démonstration du produit", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" }
      ],
      teamMembers: [
        { name: "Alice Dupont", role: "CEO", twitter: "@alicedupont", facebook: "alice.dupont" },
        { name: "Bob Martin", role: "CTO", twitter: "@bobmartin", facebook: "bob.martin" },
      ],
      hasLawyer: true,
      lawyer: {
        name: "Cabinet Juridique Tech",
        contact: "contact@cabinetjuridiquetech.com",
        phone: "+33 1 23 45 67 89"
      },
      investmentTerms: {
        remunerationType: "Dividendes",
        roi: "Estimé à 3-5 ans",
        tokenDistribution: "N/A"
      },
      companyShares: {
        percentageMinted: 20,
        vertePortalLink: "https://verte.finance/projetA"
      },
      transactions: [
        { id: 1, nftCount: 5, value: 500, totalOwned: 5 },
        { id: 2, nftCount: 3, value: 300, totalOwned: 3 },
      ]
    },
    { 
      id: 2, 
      name: "Projet B", 
      sector: "Finance", 
      sharePrice: 0.50, 
      raised: 200, 
      goal: 500, 
      endDate: "2023-11-30",
      description: "Projet B révolutionne le secteur financier avec une nouvelle approche de la gestion d'actifs.",
      documents: [
        { name: "Business Plan", url: "/documents/business_plan.pdf" },
        { name: "Financial Projections", url: "/documents/financial_projections.pdf" },
      ],
      media: [
        { name: "Présentation du projet", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      ],
      teamMembers: [
        { name: "Claire Leroy", role: "CEO", twitter: "@claireleroy", facebook: "claire.leroy" },
        { name: "David Brown", role: "CFO", twitter: "@davidbrown", facebook: "david.brown" },
      ],
      hasLawyer: false,
      investmentTerms: {
        remunerationType: "Tokens",
        roi: "Variable",
        tokenDistribution: "Trimestrielle"
      },
      companyShares: {
        percentageMinted: 15,
        vertePortalLink: "https://verte.finance/projetB"
      },
      transactions: [
        { id: 1, nftCount: 4, value: 200, totalOwned: 4 },
      ]
    },
  ];

  const handleCreateCampaign = (campaignData) => {
    console.log('Nouvelle campagne créée:', campaignData);
    setShowCreateCampaign(false);
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
      <div className="space-y-6">
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
                {project.raised} USDC
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-1">
                  <div 
                    className={`h-2.5 rounded-full ${project.raised >= 500 ? 'bg-lime-400' : 'bg-lime-400'}`}
                    style={{ width: `${(project.raised / project.goal) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-gray-900 dark:text-gray-100">{project.goal} ETH</div>
              <div 
                className="flex justify-start md:justify-end mt-2 md:mt-0"
                onClick={() => setSelectedProject(project)}
              >
                <div className="group relative inline-flex items-center justify-center p-2 overflow-hidden font-medium text-lime-400 rounded-lg shadow-xl transition duration-300 ease-out bg-gray-50 dark:bg-neutral-900 hover:bg-lime-50 dark:hover:bg-lime-900">
                  <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-lime-600 group-hover:translate-x-0 ease">
                    <ArrowRight className="w-5 h-5" />
                  </span>
                  <span className="absolute flex items-center justify-center w-full h-full text-lime-400 dark:text-lime-400 transition-all duration-300 transform group-hover:translate-x-full ease">
                    <Eye className="w-5 h-5 mr-2" />learn
                  </span>
                  <span className="relative invisible">Voir détails</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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