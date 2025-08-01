"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun, Twitter, MessageCircle, Zap } from "lucide-react";
import { ConnectWallet } from "@thirdweb-dev/react";
import { motion } from "framer-motion";

export function LandingHeader({ darkMode, toggleDarkMode }) {
  return (
    <motion.header 
      className="px-6 lg:px-8 h-24 relative z-50 bg-white/10 dark:bg-gray-900/10 backdrop-blur-lg border-b border-white/20 dark:border-gray-700/20"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between h-full max-w-7xl mx-auto">
        {/* Logo section */}
        <motion.div 
          className="flex items-center space-x-3 flex-shrink-0"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-10 h-10 bg-gradient-to-r from-lime-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-lime-400 to-green-500 bg-clip-text text-transparent">
            Livar
          </span>
        </motion.div>

        {/* Navigation principale - centrée */}
        <nav className="hidden lg:flex items-center justify-center flex-1">
          <div className="flex items-center space-x-8">
            <a href="#accueil" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-lime-500 dark:hover:text-lime-400 transition-colors">
              Accueil
            </a>
            <a href="#fonctionnalites" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-lime-500 dark:hover:text-lime-400 transition-colors">
              Fonctionnalités
            </a>
            <a href="#comment-ca-marche" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-lime-500 dark:hover:text-lime-400 transition-colors">
              Comment ça marche
            </a>
            <a href="#projets" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-lime-500 dark:hover:text-lime-400 transition-colors">
              Projets
            </a>
          </div>
        </nav>

        {/* Actions et social */}
        <div className="flex items-center space-x-4 flex-shrink-0">
        {/* Social links */}
        <div className="hidden md:flex items-center space-x-3">
          <motion.a
            href="https://x.com/FinibusApp"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-white/10 dark:bg-gray-800/20 text-gray-700 dark:text-gray-300 hover:text-lime-500 dark:hover:text-lime-400 hover:bg-lime-500/10 transition-all duration-300"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Twitter size={16} />
            <span className="sr-only">Twitter</span>
          </motion.a>
          <motion.a
            href="https://discord.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-white/10 dark:bg-gray-800/20 text-gray-700 dark:text-gray-300 hover:text-lime-500 dark:hover:text-lime-400 hover:bg-lime-500/10 transition-all duration-300"
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageCircle size={16} />
            <span className="sr-only">Discord</span>
          </motion.a>
        </div>

        {/* Theme toggle */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-white/10 dark:bg-gray-800/20 text-gray-700 dark:text-gray-300 hover:text-lime-500 dark:hover:text-lime-400 hover:bg-lime-500/10 border-0 transition-all duration-300"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span className="sr-only">Basculer le mode sombre</span>
          </Button>
        </motion.div>

        {/* Connect Wallet */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="[&>div]:bg-gradient-to-r [&>div]:from-lime-500 [&>div]:to-green-500 [&>div]:border-0 [&>div]:shadow-lg [&>div]:hover:shadow-lime-500/25 [&>div]:transition-all [&>div]:duration-300">
            <ConnectWallet />
          </div>
        </motion.div>
        </div>
      </div>
    </motion.header>
  );
}