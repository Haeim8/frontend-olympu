"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Shield, Zap } from "lucide-react";
import { useTranslation } from '@/hooks/useLanguage';

export function LandingHero({
  darkMode,
  address,
  onAccessInterface,
}) {
  const { t } = useTranslation();
  return (
    <main id="accueil" className="flex-1 relative z-10 flex items-center justify-center min-h-[60vh]">
      <section className="w-full py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {/* Badge animé */}
            <motion.div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-lime-500/20 to-green-500/20 border border-lime-500/30 backdrop-blur-sm"
              animate={{ 
                boxShadow: [
                  "0 0 15px rgba(132, 204, 22, 0.3)",
                  "0 0 30px rgba(132, 204, 22, 0.5)",
                  "0 0 15px rgba(132, 204, 22, 0.3)"
                ]
              }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <Sparkles className="w-3 h-3 text-lime-400" />
              <span className="text-xs font-medium text-lime-400">{t('crowdfundingDefi')}</span>
              <Sparkles className="w-3 h-3 text-lime-400" />
            </motion.div>

            {/* Titre principal */}
            <div className="space-y-4">
              <motion.h1
                className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                <span className={`${darkMode 
                  ? "bg-gradient-to-r from-gray-100 via-white to-gray-100 bg-clip-text text-transparent" 
                  : "text-gray-900"
                }`}>
                  {t('support')}
                </span>
                <br />
                <span className="bg-gradient-to-r from-lime-400 via-green-500 to-lime-400 bg-clip-text text-transparent">
                  {t('future')}
                </span>
                <br />
                <span className={`${darkMode 
                  ? "bg-gradient-to-r from-gray-100 via-white to-gray-100 bg-clip-text text-transparent" 
                  : "text-gray-900"
                }`}>
                  {t('ecosystem')}
                </span>
              </motion.h1>

              <motion.p
                className={`text-base md:text-lg max-w-3xl mx-auto leading-relaxed ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
              >
                {t('contributeText')}{" "}
                <span className="font-semibold text-lime-500">{t('web3Advanced')}</span> {t('andBePart')}
              </motion.p>
            </div>

            {/* CTA Section */}
            <motion.div
              className="flex flex-col items-center space-y-4 pt-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              {/* Status et boutons */}
              <div className="flex flex-col items-center space-y-3">
                {address ? (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      className="px-6 py-3 text-sm font-semibold bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white border-0 shadow-xl hover:shadow-lime-500/25 transition-all duration-300"
                      onClick={onAccessInterface}
                    >
                      <Zap className="w-4 h-4 mr-2" />
{t('launchApp', 'Lancer l\'App')}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                ) : (
                  <div className="text-center space-y-2">
                    <p className="text-sm text-lime-400 font-medium">{t('connectWallet', 'Veuillez connecter votre portefeuille')}</p>
                    <div className={`flex items-center justify-center space-x-1 text-xs ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}>
                      <Shield className="w-3 h-3" />
                      <span>{t('landing.hero.secureConnectionRequired')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats en bas */}
              <motion.div
                className={`grid grid-cols-3 gap-6 pt-8 border-t ${
                  darkMode ? "border-gray-700/30" : "border-gray-300/30"
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
              >
                <div className="text-center">
                  <div className="text-xl font-bold text-lime-500">24/7</div>
                  <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{t('landing.stats.activeSupport')}</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-lime-500">{t('landing.stats.free')}</div>
                  <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{t('landing.stats.registration')}</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-lime-500">100%</div>
                  <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{t('landing.stats.decentralized')}</div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}