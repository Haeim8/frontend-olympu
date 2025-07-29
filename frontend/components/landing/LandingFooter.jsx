"use client";

import { motion } from "framer-motion";
import { Heart, Zap } from "lucide-react";

export function LandingFooter({ darkMode }) {
  return (
    <footer className="relative z-10 bg-white/5 dark:bg-gray-900/20 backdrop-blur-lg border-t border-white/10 dark:border-gray-700/20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo et description */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-lime-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-lime-400 to-green-500 bg-clip-text text-transparent">
                Livar
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-md leading-relaxed">
              La première plateforme de financement participatif entièrement décentralisée. 
              Construisons ensemble l'avenir de la finance Web3.
            </p>
          </div>

          {/* Liens */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Plateforme</h4>
            <nav className="space-y-2">
              <a href="#" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-lime-500 dark:hover:text-lime-400 transition-colors">
                Comment ça marche
              </a>
              <a href="#" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-lime-500 dark:hover:text-lime-400 transition-colors">
                Projets en cours
              </a>
              <a href="#" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-lime-500 dark:hover:text-lime-400 transition-colors">
                Documentation
              </a>
            </nav>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Support</h4>
            <nav className="space-y-2">
              <a href="#" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-lime-500 dark:hover:text-lime-400 transition-colors">
                Centre d'aide
              </a>
              <a href="#" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-lime-500 dark:hover:text-lime-400 transition-colors">
                Discord
              </a>
              <a href="#" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-lime-500 dark:hover:text-lime-400 transition-colors">
                Contact
              </a>
            </nav>
          </div>
        </div>

        {/* Ligne de séparation */}
        <div className="border-t border-gray-200/20 dark:border-gray-700/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span>&copy; 2024 Livar. Tous droits réservés.</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <span>Fait avec</span>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Heart className="w-4 h-4 text-red-500 fill-current" />
                </motion.div>
                <span>pour la communauté Web3</span>
              </span>
            </div>

            {/* Liens légaux */}
            <nav className="flex space-x-6">
              <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-lime-500 dark:hover:text-lime-400 transition-colors">
                Conditions d'utilisation
              </a>
              <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-lime-500 dark:hover:text-lime-400 transition-colors">
                Politique de confidentialité
              </a>
              <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-lime-500 dark:hover:text-lime-400 transition-colors">
                Mentions légales
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}