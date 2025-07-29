"use client";

import { motion } from "framer-motion";
import { Wallet, UserPlus, Rocket, Trophy, ArrowRight } from "lucide-react";

export function HowItWorks({ darkMode }) {
  const steps = [
    {
      icon: Wallet,
      title: "Connectez votre wallet",
      description: "Utilisez MetaMask, WalletConnect ou tout autre wallet compatible Ethereum",
      color: "from-blue-400 to-blue-600",
      delay: 0
    },
    {
      icon: UserPlus,
      title: "Créez votre profil",
      description: "Inscrivez-vous sur la plateforme avec 0.05 ETH pour sécuriser votre compte",
      color: "from-purple-400 to-purple-600",
      delay: 0.1
    },
    {
      icon: Rocket,
      title: "Explorez les projets",
      description: "Découvrez et financez des projets Web3 innovants qui vous passionnent",
      color: "from-lime-400 to-green-600",
      delay: 0.2
    },
    {
      icon: Trophy,
      title: "Récoltez les rewards",
      description: "Gagnez des tokens et participez à la gouvernance des projets soutenus",
      color: "from-yellow-400 to-orange-600",
      delay: 0.3
    }
  ];

  return (
    <section id="comment-ca-marche" className="relative z-10 py-16 px-4">
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
            Comment ça marche ?
          </h2>
          <p className={`text-sm max-w-2xl mx-auto ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Rejoindre la révolution DeFi n'a jamais été aussi simple. 
            Suivez ces 4 étapes pour commencer votre aventure Web3.
          </p>
        </motion.div>

        {/* Étapes */}
        <div className="relative">
          {/* Ligne de connexion pour desktop */}
          <div className="hidden md:block absolute top-20 left-1/2 transform -translate-x-1/2 w-full max-w-4xl">
            <div className={`h-0.5 ${darkMode ? "bg-gradient-to-r from-transparent via-lime-500/30 to-transparent" : "bg-gradient-to-r from-transparent via-lime-500/40 to-transparent"}`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: step.delay }}
                viewport={{ once: true }}
              >
                {/* Numéro d'étape */}
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-center shadow-lg`}>
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-lime-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                      {index + 1}
                    </div>
                  </div>
                </div>

                {/* Contenu */}
                <div className="text-center space-y-3">
                  <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {step.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {step.description}
                  </p>
                </div>

                {/* Flèche pour mobile */}
                {index < steps.length - 1 && (
                  <div className="md:hidden flex justify-center mt-6">
                    <ArrowRight className="w-5 h-5 text-lime-500" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${darkMode ? "bg-lime-500/10 border border-lime-500/20" : "bg-lime-500/20 border border-lime-500/30"} backdrop-blur-sm`}>
            <div className="w-2 h-2 bg-lime-500 rounded-full animate-pulse"></div>
            <span className={`text-sm font-medium ${darkMode ? "text-lime-400" : "text-lime-600"}`}>
              Prêt en moins de 2 minutes
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}