"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

export function LandingInfoSection({ darkMode }) {
  const features = [
    {
      title: "Financement Décentralisé",
      description: "Accédez à un financement sans intermédiaires grâce à notre plateforme DeFi innovante.",
      icon: "💸",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Gouvernance Communautaire", 
      description: "Participez aux décisions importantes et votez sur l'avenir des projets financés.",
      icon: "🏛️",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      title: "Récompenses Transparentes",
      description: "Recevez des récompenses proportionnelles à votre contribution, le tout enregistré sur la blockchain.",
      icon: "🏆",
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      title: "Sécurité Maximale",
      description: "Vos fonds sont sécurisés par des contrats intelligents audités et des protocoles de sécurité avancés.",
      icon: "🔒",
      gradient: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <section id="fonctionnalites" className="relative z-10 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Titre principal */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-lime-400 to-green-500 bg-clip-text text-transparent">
            Pourquoi choisir notre plateforme?
          </h2>
          <p className={`text-sm max-w-2xl mx-auto leading-relaxed ${
            darkMode ? "text-gray-300" : "text-gray-700"
          }`}>
            Notre plateforme de financement participatif décentralisée offre des avantages uniques 
            pour les créateurs et les investisseurs dans l'écosystème Web3.
          </p>
        </motion.div>

        {/* Grille des fonctionnalités */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.05,
                rotateY: 5,
                transition: { duration: 0.3 }
              }}
            >
              <Card className={`h-full ${
                darkMode 
                  ? "bg-white/5 border border-white/10" 
                  : "bg-white/80 border border-white/30"
              } backdrop-blur-md shadow-2xl hover:shadow-lime-500/20 transition-all duration-300`}>
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-2xl shadow-lg transform hover:rotate-12 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className={`text-lg font-bold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {feature.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Section CTA finale */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Card className={`${darkMode 
            ? "bg-gradient-to-r from-lime-500/10 to-green-500/10 border-lime-500/20" 
            : "bg-gradient-to-r from-lime-500/20 to-green-500/20 border-lime-500/30"
          } backdrop-blur-md shadow-2xl`}>
            <CardContent className="p-8 text-center">
              <div className="max-w-3xl mx-auto">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-lime-400 to-green-500 bg-clip-text text-transparent">
                  Prêt à rejoindre la révolution DeFi?
                </h3>
                <p className={`text-base ${darkMode ? "text-gray-300" : "text-gray-700"} mb-6 leading-relaxed`}>
                  Connectez votre portefeuille, créez votre profil et commencez à participer à des projets 
                  innovants qui façonnent l'avenir de la finance décentralisée.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-lime-500">+10K</div>
                    <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Utilisateurs actifs</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-lime-500">€2.5M</div>
                    <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Fonds levés</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-lime-500">150+</div>
                    <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Projets financés</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}