"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, User, AtSign, Share2, Sparkles } from "lucide-react";

export function LandingSignupModal({
  showSignup,
  setShowSignup,
  darkMode,
  formData,
  isSubmitting,
  handleInputChange,
  handlePhotoChange,
  handleSubmit,
}) {
  return (
    <AnimatePresence>
      {showSignup && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-lg mx-auto"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <div className="bg-white/10 dark:bg-gray-900/20 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/20 shadow-2xl overflow-hidden">
              {/* Header avec gradient */}
              <div className="bg-gradient-to-r from-lime-500/20 to-green-500/20 p-8 border-b border-white/20 dark:border-gray-700/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-lime-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Créer votre profil
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Rejoignez la communauté Web3
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => setShowSignup(false)}
                    className="p-2 rounded-xl bg-white/10 dark:bg-gray-800/20 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-gray-700/30 transition-all duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={20} />
                  </motion.button>
                </div>
              </div>

              {/* Formulaire */}
              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Photo de profil */}
                  <div className="text-center">
                    <div className="relative inline-block">
                      <div className="w-24 h-24 bg-gradient-to-r from-lime-400/20 to-green-500/20 rounded-2xl border-2 border-dashed border-lime-500/30 flex items-center justify-center mb-4 mx-auto">
                        <Upload className="w-8 h-8 text-lime-500" />
                      </div>
                      <Input
                        id="photo"
                        name="photo"
                        type="file"
                        onChange={handlePhotoChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept="image/*"
                      />
                    </div>
                    <Label htmlFor="photo" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      Photo de profil (optionnel)
                    </Label>
                  </div>

                  {/* Nom d&apos;utilisateur */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <User className="w-4 h-4 text-lime-500" />
                      <span>Nom d&apos;utilisateur</span>
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      placeholder="Votre nom d&apos;utilisateur unique"
                      className="h-12 bg-white/5 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-lime-500 focus:ring-lime-500/20 transition-all duration-200"
                    />
                  </div>

                  {/* Compte X */}
                  <div className="space-y-2">
                    <Label htmlFor="xAccount" className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <AtSign className="w-4 h-4 text-lime-500" />
                      <span>Compte X (Twitter)</span>
                    </Label>
                    <Input
                      id="xAccount"
                      name="xAccount"
                      value={formData.xAccount}
                      onChange={handleInputChange}
                      placeholder="@votre_compte_x"
                      className="h-12 bg-white/5 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-lime-500 focus:ring-lime-500/20 transition-all duration-200"
                    />
                  </div>

                  {/* Autres réseaux sociaux */}
                  <div className="space-y-2">
                    <Label htmlFor="socialMedia" className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Share2 className="w-4 h-4 text-lime-500" />
                      <span>Autres réseaux sociaux</span>
                    </Label>
                    <Input
                      id="socialMedia"
                      name="socialMedia"
                      value={formData.socialMedia}
                      onChange={handleInputChange}
                      placeholder="Discord, LinkedIn, GitHub..."
                      className="h-12 bg-white/5 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-lime-500 focus:ring-lime-500/20 transition-all duration-200"
                    />
                  </div>

                  {/* Info sur les frais */}
                  <div className="bg-lime-500/10 border border-lime-500/20 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-lime-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">ℹ</span>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-lime-700 dark:text-lime-400 mb-1">
                          Frais d&apos;inscription : 0.05 ETH
                        </p>
                        <p className="text-lime-600 dark:text-lime-500 text-xs leading-relaxed">
                          Ces frais permettent de maintenir la sécurité du réseau et de lutter contre le spam. 
                          Ils vous donnent accès à toutes les fonctionnalités de la plateforme.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bouton de soumission */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-14 bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white font-semibold text-lg rounded-xl border-0 shadow-2xl hover:shadow-lime-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                          <span>Création en cours...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Sparkles className="w-5 h-5" />
                          <span>Créer mon compte</span>
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
