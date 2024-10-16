"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Moon, Sun, Twitter, MessageCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectWallet, useAddress, useContract, useContractRead } from "@thirdweb-dev/react";
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from "next/navigation";
import FundRaisingPlatformABI from '@/ABI/FundRaisingPlatformABI.json'; // Importer l'ABI
import { ethers } from 'ethers'; // Importer ethers pour manipuler les valeurs ETH

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [formData, setFormData] = useState({
    photo: '',
    username: '',
    xAccount: '',
    socialMedia: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState(null);

  const address = useAddress();
  const router = useRouter();

  // Adresse de votre contrat déployé
  const contractAddress = "0xF334d4CEcB73bc95e032949b9437A1eE6D4C6019"; // Remplacez par votre adresse de contrat

  // Utiliser le hook useContract pour obtenir l'instance du contrat
  const { contract, isLoading: contractLoading, error: contractError } = useContract(contractAddress, FundRaisingPlatformABI);

  // Utiliser useContractRead pour lire le mapping registeredUsers
  const { data: isRegisteredData, isLoading: readLoading, error: readError } = useContractRead(
    contract,
    "registeredUsers",
    [address] // Passer l'adresse dans un tableau
  );

  // Mettre à jour l'état d'inscription basé sur la lecture du contrat
  useEffect(() => {
    if (isRegisteredData !== undefined) {
      setIsRegistered(isRegisteredData);
      console.log(`User registered in contract: ${isRegisteredData}`);
    }
  }, [isRegisteredData]);

  // Détecter le mode sombre
  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);
  }, []);

  // Vérifier le profil utilisateur dans Firebase et l'inscription au contrat
  useEffect(() => {
    if (address) {
      console.log("User is connected with address:", address);
      checkUserProfile();
      // La lecture du smart contract est gérée par useContractRead
    } else {
      console.log("User is not connected");
      setUserExists(false);
      setIsRegistered(false);
    }
  }, [address]);

  // Fonction pour vérifier si un utilisateur a un profil dans Firebase
  const checkUserProfile = async () => {
    if (!address) return;
    const docRef = doc(db, "users", address);
    try {
      const docSnap = await getDoc(docRef);
      console.log(`Checking profile for address: ${address}`);
      console.log(`Document exists: ${docSnap.exists()}`);
      setUserExists(docSnap.exists());
    } catch (error) {
      console.error("Erreur lors de la vérification du profil Firebase:", error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          setFormData(prev => ({ ...prev, photo: event.target.result }));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setRegistrationError(null);

    try {
      // Créer un nouveau profil utilisateur dans Firebase avec les données du formulaire
      await setDoc(doc(db, "users", address), {
        username: formData.username,
        xAccount: formData.xAccount,
        socialMedia: formData.socialMedia,
        photo: formData.photo
      });

      console.log('Profil créé:', formData);
      setShowSignup(false);
      setUserExists(true);

      // Enregistrer l'utilisateur dans le smart contract
      if (contract) {
        setRegistrationLoading(true);
        console.log("Appel de la fonction registerUser avec 0.05 ETH");
        const tx = await contract.call("registerUser", [], { value: ethers.utils.parseEther("0.05") });
        console.log("Transaction réussie:", tx);
        
        // Mise à jour immédiate de l'état d'enregistrement
        setIsRegistered(true);
        // Optionnel : Afficher un message de succès
        alert("Inscription réussie !");
      }
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      setRegistrationError("Échec de l'inscription. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
      setRegistrationLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-zinc-400 dark:text-gray-200 transition-colors duration-200 relative overflow-hidden">
        {/* Starry background */}
        <div className="absolute inset-0 z-0">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill={darkMode ? "#070000b3" : "#ececec"} />
            {[...Array(100)].map((_, i) => (
              <motion.circle
                key={i}
                cx={`${Math.random() * 100}%`}
                cy={`${Math.random() * 100}%`}
                r={Math.random() * 2}
                fill={darkMode ? "#ffffff" : "#000000"}
                animate={{
                  opacity: [0.2, 1, 0.2],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: Math.random() * 6 + 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }} />
            ))}
          </svg>
        </div>

        {/* Success constellation */}
        <svg className="absolute inset-0 z-0" xmlns="http://www.w3.org/2000/svg">
          <g stroke={darkMode ? "#b9f542" : "#7cf503"} strokeWidth="0.5" fill="none">
            <motion.path
              d="M20,20 L40,40 L60,30 L80,50 L100,40"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.3 }}
              transition={{ duration: 6, ease: "easeInOut" }} />
            <motion.circle
              cx="20"
              cy="20"
              r="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1 }} />
            <motion.circle
              cx="40"
              cy="40"
              r="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 2 }} />
            <motion.circle
              cx="60"
              cy="30"
              r="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 3 }} />
            <motion.circle
              cx="80"
              cy="50"
              r="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 4 }} />
            <motion.circle
              cx="100"
              cy="40"
              r="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 5 }} />
          </g>
        </svg>

        {/* Animated laser bridge */}
        <motion.div
          className="absolute inset-0 z-0 opacity-60"
          initial={{ pathLength: 0, pathOffset: 1 }}
          animate={{ pathLength: 1, pathOffset: 0 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none">
            <motion.path
              d="M0,50 Q50,0 100,50 Q50,100 0,50"
              stroke={darkMode ? "#a3e635" : "#a3e635"}
              strokeWidth="0.5"
              fill="none"
              initial={{ pathLength: 0, pathOffset: 1 }}
              animate={{ pathLength: 1, pathOffset: 0 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }} />
          </svg>
        </motion.div>

        <header className="px-4 lg:px-6 h-20 flex items-center justify-between relative z-10 bg-transparent">
          <div className="flex items-center">
            {/* Logo placeholder */}
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://x.com/FinibusApp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              <Twitter size={20} />
              <span className="sr-only">Twitter</span>
            </a>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span className="sr-only">Toggle dark mode</span>
            </Button>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              <MessageCircle size={20} />
              <span className="sr-only">Discord</span>
            </a>

            {/* Bouton de connexion Wallet Thirdweb */}
            <ConnectWallet />
          </div>
        </header>

        <main className="flex-1 relative z-10 flex items-center justify-center">
          <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <motion.div
                className="space-y-4 text-center max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}>
                <motion.div
                  className="inline-block rounded-lg bg-lime-400 px-3 py-1 text-sm text-black"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                  Defi Crowdfunding
                </motion.div>

                <motion.h1
                  className="text-4xl font-bold tracking-tighter md:text-5xl mb-4"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut" }}>
                  Support the future of the ecosystem.
                </motion.h1>
                <motion.p
                  className="max-w-[900px] text-zinc-700 dark:text-zinc-50 md:text-xl/relaxed lg:text-base/relaxed xxl:text-xl/relaxed mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.8 }}>
                  Contribute to the development of cutting-edge Web3 technologies and be a part of the decentralized revolution.
                </motion.p>

                {/* Afficher le bouton ou le formulaire selon le profil */}
                <motion.div
                  className="p-6 rounded-lg bg-white/10 dark:bg-gray-900/10 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}>
                  {address ? (
                    userExists ? (
                      readLoading ? (
                        <p className="text-lime-400">Vérification en cours...</p>
                      ) : isRegistered ? (
                        <Button
                          variant="default"
                          className="bg-lime-400 text-black hover:bg-lime-50 dark:bg-lime-400 dark:hover:bg-lime-50"
                          onClick={() => router.push("/dashboard")}>
                          Launch App
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          className="bg-red-400 text-black hover:bg-red-50 dark:bg-red-400 dark:hover:bg-red-50"
                          onClick={async () => {
                            try {
                              setRegistrationLoading(true);
                              console.log("Appel de la fonction registerUser avec 0.05 ETH");
                              const tx = await contract.call("registerUser", [], { value: ethers.utils.parseEther("0.05") });
                              console.log("Transaction réussie:", tx);
                              
                              // Mise à jour immédiate de l'état d'enregistrement
                              setIsRegistered(true);
                              // Optionnel : Afficher un message de succès
                              alert("Inscription réussie !");
                            } catch (error) {
                              console.error("Erreur lors de l'inscription:", error);
                              setRegistrationError("Échec de l'inscription. Veuillez réessayer.");
                            } finally {
                              setRegistrationLoading(false);
                            }
                          }}>
                          {registrationLoading ? "Registering..." : "Register on Smart Contract"}
                        </Button>
                      )
                    ) : (
                      <Button
                        variant="default"
                        className="bg-lime-400 text-black hover:bg-lime-50 dark:bg-lime-400 dark:hover:bg-lime-50"
                        onClick={() => setShowSignup(true)}>
                        Create Account
                      </Button>
                    )
                  ) : (
                    <p className="text-lime-400">Please connect your wallet</p>
                  )}
                  {/* Afficher les erreurs d'inscription */}
                  {registrationError && (
                    <p className="text-red-500 mt-2">{registrationError}</p>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </section>
        </main>

        <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 relative z-10 bg-transparent">
          <p className="text-xs text-gray-600 dark:text-gray-400">&copy; 2024 django. All rights reserved.</p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <a
              href="#"
              className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:underline underline-offset-4">
              Terms of Service
            </a>
            <a
              href="#"
              className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:underline underline-offset-4">
              Privacy
            </a>
          </nav>
        </footer>
      </div>

      {/* Modal d'inscription */}
      <AnimatePresence>
        {showSignup && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}>
              <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold flex justify-between items-center">
                    Create Account
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-900 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-600"
                      onClick={() => setShowSignup(false)}>
                      <X size={24} />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label
                        htmlFor="photo"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Photo</Label>
                      <Input
                        id="photo"
                        name="photo"
                        type="file"
                        onChange={handlePhotoChange}
                        className="mt-1" />
                      {formData.photo && (
                        <img
                          src={formData.photo}
                          alt="Profile preview"
                          className="mt-2 w-20 h-20 object-cover rounded-full" />
                      )}
                    </div>
                    <div>
                      <Label
                        htmlFor="username"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-700">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        required
                        className="mt-1" />
                    </div>
                    <div>
                      <Label
                        htmlFor="xAccount"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300">X Account</Label>
                      <Input
                        id="xAccount"
                        name="xAccount"
                        value={formData.xAccount}
                        onChange={handleInputChange}
                        className="mt-1" />
                    </div>
                    <div>
                      <Label
                        htmlFor="socialMedia"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300">Other Social Media</Label>
                      <Input
                        id="socialMedia"
                        name="socialMedia"
                        value={formData.socialMedia}
                        onChange={handleInputChange}
                        className="mt-1" />
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting || registrationLoading}
                      className="w-full bg-lime-400 text-black hover:bg-lime-100 dark:bg-lime-400 dark:hover:bg-lime-100">
                      {isSubmitting ? "Creating..." : "Create Account"}
                    </Button>
                  </form>
                  {/* Afficher les erreurs d'inscription */}
                  {registrationError && (
                    <p className="text-red-500 mt-2">{registrationError}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
