"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, TrendingUp, Users, Clock, CheckCircle } from "lucide-react";

export function ProjectsSection({ darkMode }) {
  const projects = [
    {
      title: "EcoChain",
      description: "Plateforme de compensation carbone sur blockchain avec tokenisation des crédits CO2",
      raised: "45.2",
      target: "100",
      backers: 234,
      timeLeft: "12 jours",
      status: "active",
      image: "🌱",
      tags: ["DeFi", "Green Tech", "NFT"],
      progress: 45
    },
    {
      title: "MetaLearn",
      description: "Éducation décentralisée avec certificats NFT et récompenses en tokens pour les apprenants",
      raised: "78.9",
      target: "80",
      backers: 456,
      timeLeft: "3 jours",
      status: "nearly_funded",
      image: "📚",
      tags: ["Education", "NFT", "DAO"],
      progress: 98
    },
    {
      title: "DeFi Insurance",
      description: "Assurance décentralisée pour protocoles DeFi avec mécanisme de gouvernance communautaire",
      raised: "120.0",
      target: "100",
      backers: 789,
      timeLeft: "Financé",
      status: "funded",
      image: "🛡️",
      tags: ["DeFi", "Insurance", "Governance"],
      progress: 100
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "from-blue-400 to-blue-600";
      case "nearly_funded": return "from-orange-400 to-orange-600";
      case "funded": return "from-green-400 to-green-600";
      default: return "from-gray-400 to-gray-600";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active": return Clock;
      case "nearly_funded": return TrendingUp;
      case "funded": return CheckCircle;
      default: return Clock;
    }
  };

  return (
    <section id="projets" className="relative z-10 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Titre */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-lime-400 to-green-500 bg-clip-text text-transparent">
            Projets en cours
          </h2>
          <p className={`text-sm max-w-2xl mx-auto ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Découvrez les projets Web3 innovants qui façonnent l'avenir. 
            Chaque projet est vérifié et audité par notre communauté.
          </p>
        </motion.div>

        {/* Projets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {projects.map((project, index) => {
            const StatusIcon = getStatusIcon(project.status);
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <Card className={`h-full ${
                  darkMode 
                    ? "bg-white/5 border border-white/10" 
                    : "bg-white/80 border border-white/30"
                } backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all duration-300`}>
                  <CardContent className="p-6">
                    {/* Header avec emoji et statut */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-3xl">{project.image}</div>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full bg-gradient-to-r ${getStatusColor(project.status)} text-white text-xs`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{project.timeLeft}</span>
                      </div>
                    </div>

                    {/* Titre et description */}
                    <div className="mb-4">
                      <h3 className={`text-lg font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {project.title}
                      </h3>
                      <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {project.description}
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className={`px-2 py-1 rounded-md text-xs font-medium ${
                            darkMode 
                              ? "bg-lime-500/20 text-lime-400" 
                              : "bg-lime-500/20 text-lime-600"
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                          {project.raised} ETH levés
                        </span>
                        <span className="text-lime-500 font-medium">
                          {project.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-lime-400 to-green-500 rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${project.progress}%` }}
                          transition={{ duration: 1.5, delay: index * 0.2 }}
                          viewport={{ once: true }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm mb-4">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-lime-500" />
                        <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                          {project.backers} contributeurs
                        </span>
                      </div>
                      <span className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Objectif: {project.target} ETH
                      </span>
                    </div>

                    {/* Bouton */}
                    <Button
                      className="w-full bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white border-0 text-sm"
                      disabled={project.status === 'funded'}
                    >
                      {project.status === 'funded' ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Projet financé
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Voir le projet
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <Button
            className="px-8 py-3 bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white border-0 font-semibold shadow-xl"
          >
            Voir tous les projets
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}