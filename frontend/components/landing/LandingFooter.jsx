"use client";

import { motion } from "framer-motion";
import { Heart, Zap } from "lucide-react";
import { useTranslation } from '@/hooks/useLanguage';

export function LandingFooter({ darkMode }) {
  const { t } = useTranslation();
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
              {t('landing.footer.description')}
            </p>
          </div>

          {/* Liens */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">{t('landing.footer.platform')}</h4>
            <nav className="space-y-2">
              <a href="#" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-lime-500 dark:hover:text-lime-400 transition-colors">
                {t('landing.footer.howItWorks')}
              </a>
              <a href="#" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-lime-500 dark:hover:text-lime-400 transition-colors">
                {t('landing.footer.ongoingProjects')}
              </a>
              <a href="#" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-lime-500 dark:hover:text-lime-400 transition-colors">
                {t('landing.footer.documentation')}
              </a>
            </nav>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">{t('landing.footer.support')}</h4>
            <nav className="space-y-2">
              <a href="#" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-lime-500 dark:hover:text-lime-400 transition-colors">
                {t('landing.footer.helpCenter')}
              </a>
              <a href="#" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-lime-500 dark:hover:text-lime-400 transition-colors">
                {t('social.discord')}
              </a>
              <a href="#" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-lime-500 dark:hover:text-lime-400 transition-colors">
                {t('landing.footer.contact')}
              </a>
            </nav>
          </div>
        </div>

        {/* Ligne de séparation */}
        <div className="border-t border-gray-200/20 dark:border-gray-700/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span>{t('landing.footer.copyright')}</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <span>{t('landing.footer.madeWith')}</span>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Heart className="w-4 h-4 text-red-500 fill-current" />
                </motion.div>
                <span>{t('landing.footer.forWeb3Community')}</span>
              </span>
            </div>

            {/* Liens légaux */}
            <nav className="flex space-x-6">
              <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-lime-500 dark:hover:text-lime-400 transition-colors">
                {t('landing.footer.termsOfUse')}
              </a>
              <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-lime-500 dark:hover:text-lime-400 transition-colors">
                {t('landing.footer.privacyPolicy')}
              </a>
              <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-lime-500 dark:hover:text-lime-400 transition-colors">
                {t('landing.footer.legalNotices')}
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}