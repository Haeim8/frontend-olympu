"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Moon, Sun, Twitter, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ConnectWallet, useAddress, useContract, useContractRead } from "@thirdweb-dev/react";
import { db } from "@/lib/firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import  DivarProxyABI from "@/ABI/DivarProxyABI.json";
import { ethers } from "ethers";

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [formData, setFormData] = useState({
    photo: "",
    username: "",
    xAccount: "",
    socialMedia: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState(null);

  const address = useAddress();
  const router = useRouter();

  const contractAddress = "0x9fc348c0f4f4b1Ad6CaB657a7C519381FC5D3941";

  const { contract } = useContract(contractAddress, DivarProxyABI);

  const { data: isRegisteredData, isLoading: readLoading, error: readError } = useContractRead(
    contract,
    "isUserRegistered",
    [address]
  );

  useEffect(() => {
    if (isRegisteredData !== undefined) {
      setIsRegistered(isRegisteredData);
      console.log(`User registered in contract: ${isRegisteredData}`);
    }
    if (readError) {
      console.error("Erreur lors de la lecture du contrat:", readError);
      setRegistrationError(".");
    }
  }, [isRegisteredData, readError]);

  useEffect(() => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(isDark);
  }, []);

  useEffect(() => {
    if (address) {
      console.log("User is connected with address:", address);
      checkUserProfileAndContract();
    } else {
      console.log("User is not connected");
      setUserExists(false);
      setIsRegistered(false);
    }
  }, [address, contract]);

  const checkUserProfileAndContract = async () => {
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

    if (contract) {
      try {
        const registered = await contract.call("isUserRegistered", [address]);
        setIsRegistered(registered);
        console.log(`User registered in contract: ${registered}`);
      } catch (error) {
        console.error("Erreur lors de la lecture de isUserRegistered:", error);
        setRegistrationError(".");
      }
    } else {
      console.error("Erreur lors de la connexion au contrat");
      setRegistrationError("Erreur lors de la connexion au contrat.");
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          setFormData((prev) => ({ ...prev, photo: event.target.result }));
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
      await setDoc(doc(db, "users", address), {
        username: formData.username,
        xAccount: formData.xAccount,
        socialMedia: formData.socialMedia,
        photo: formData.photo,
      });

      console.log("Profil créé:", formData);
      setShowSignup(false);
      setUserExists(true);

      if (contract) {
        setRegistrationLoading(true);
        console.log("Appel de la fonction registerUser avec 0.05 ETH");
        const tx = await contract.call("registerUser", [], { value: ethers.utils.parseEther("0.05") });
        console.log("Transaction réussie:", tx);

        await tx.wait();

        setIsRegistered(true);
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
    <div className={`min-h-screen ${darkMode ? "dark" : ""} text-sm`}>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill={darkMode ? "#070000b3" : "#ececec"} />
            {[...Array(100)].map((_, i) => (
              <motion.circle
                key={i}
                cx={`${Math.random() * 100}%`}
                cy={`${Math.random() * 100}%`}
                r={Math.random() * 2}
                fill={darkMode ? "#ffffff58" : "#000000"}
                animate={{
                  opacity: [0.2, 1, 0.2],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: Math.random() * 6 + 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </svg>
        </div>

        <svg className="absolute inset-0 z-0" xmlns="http://www.w3.org/2000/svg">
          <g stroke={darkMode ? "#b9f542" : "#7cf503"} strokeWidth="0.5" fill="none">
            <motion.path
              d="M20,20 L40,40 L60,30 L80,50 L100,40"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.3 }}
              transition={{ duration: 6, ease: "easeInOut" }}
            />
            <motion.circle
              cx="20"
              cy="20"
              r="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1 }}
            />
            <motion.circle
              cx="40"
              cy="40"
              r="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 2 }}
            />
            <motion.circle
              cx="60"
              cy="30"
              r="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 3 }}
            />
            <motion.circle
              cx="80"
              cy="50"
              r="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 4 }}
            />
            <motion.circle
              cx="100"
              cy="40"
              r="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 5 }}
            />
          </g>
        </svg>

        <motion.div
          className="absolute inset-0 z-0 opacity-60"
          initial={{ pathLength: 0, pathOffset: 1 }}
          animate={{ pathLength: 1, pathOffset: 0 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.path
              d="M0,50 Q50,0 100,50 Q50,100 0,50"
              stroke={darkMode ? "#a3e635" : "#a3e635"}
              strokeWidth="0.5"
              fill="none"
              initial={{ pathLength: 0, pathOffset: 1 }}
              animate={{ pathLength: 1, pathOffset: 0 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
          </svg>
        </motion.div>

        <header className="px-4 lg:px-6 h-20 flex items-center justify-between relative z-10 bg-transparent">
          <div className="flex items-center">
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://x.com/FinibusApp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              <Twitter size={20} />
              <span className="sr-only">Twitter</span>
            </a>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              <MessageCircle size={20} />
              <span className="sr-only">Discord</span>
            </a>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span className="sr-only">Basculer le mode sombre</span>
            </Button>
            <ConnectWallet />
          </div>
        </header>

        <main className="flex-1 relative z-10 flex items-center justify-center">
          <section className="w-full py-8 md:py-12 lg:py-16">
            <div className="container px-4 md:px-6">
              <motion.div
                className="space-y-4 text-center max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <motion.div
                  className="inline-block rounded-lg bg-lime-500 px-3 py-1 text-sm text-white font-medium"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  Financement Participatif DeFi
                </motion.div>

                <motion.div
                  className="p-6 rounded-lg bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm shadow-xl max-w-2xl mx-auto w-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                >
                  <motion.h1
                    className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter mb-4 text-gray-900 dark:text-white"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut" }}
                  >
                    Soutenez l'avenir de l'écosystème.
                  </motion.h1>
                  <motion.p
                className="text-gray-900 dark:text-gray-100 text-sm sm:text-base mb-6"
              initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
               >
                Contribuez au développement des technologies Web3 de pointe et faites partie de la révolution décentralisée.
                </motion.p>
                  {address ? (
                    userExists ? (
                      readLoading ? (
                        <p className="text-lime-400">Vérification en cours...</p>
                      ) : isRegistered ? (
                        <Button
                          variant="default"
                          className="bg-lime-500 text-white hover:bg-lime-600 dark:bg-lime-500 dark:hover:bg-lime-600 font-medium shadow-lg w-full sm:w-auto"
                          onClick={() => router.push("/app")}
                        >
                          Lancer l'App
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          className="bg-red-500 text-white hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600 font-medium shadow-lg w-full sm:w-auto"
                          onClick={async () => {
                            try {
                              setRegistrationLoading(true);
                              console.log("Appel de la fonction registerUser avec 0.05 ETH");
                              const tx = await contract.call("registerUser", [], {
                                value: ethers.utils.parseEther("0.05"),
                              });
                              console.log("Transaction réussie:", tx);

                              await tx.wait();

                              setIsRegistered(true);
                              

                              alert("Inscription réussie !");
                              checkUserProfileAndContract();
                            } catch (error) {
                              console.error("Erreur lors de l'inscription:", error);
                              setRegistrationError("Échec de l'inscription. Veuillez réessayer.");
                            } finally {
                              setRegistrationLoading(false);
                            }
                          }}
                          disabled={registrationLoading}
                        >
                          {registrationLoading ? "Inscription en cours..." : "S'inscrire sur le Smart Contract"}
                        </Button>
                      )
                    ) : (
                      <Button
                        variant="default"
                        className="bg-lime-500 text-white hover:bg-lime-600 dark:bg-lime-500 dark:hover:bg-lime-600 font-medium shadow-lg w-full sm:w-auto"
                        onClick={() => setShowSignup(true)}
                      >
                        Créer un Compte
                      </Button>
                    )
                  ) : (
                    <p className="text-lime-400">Veuillez connecter votre portefeuille</p>
                  )}
                  {registrationError && <p className="text-red-500 mt-2">{registrationError}</p>}
                </motion.div>
              </motion.div>
            </div>
          </section>
        </main>

        <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 relative z-10 bg-transparent">
          <p className="text-xs text-gray-600 dark:text-gray-400">&copy; 2024 django. Tous droits réservés.</p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <a
              href="#"
              className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:underline underline-offset-4"
            >
              Conditions d'utilisation
            </a>
            <a
              href="#"
              className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:underline underline-offset-4"
            >
              Confidentialité
            </a>
          </nav>
        </footer>
      </div>

      <AnimatePresence>
        {showSignup && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
            >
            <Card className={`w-full max-w-md mx-auto ${darkMode ? "bg-black" : "bg-white"}`}>
  <CardHeader>
    <CardTitle className={`text-2xl font-bold flex justify-between items-center ${darkMode ? "text-white" : "text-gray-900"}`}>
      Créer un Compte
      <Button
        variant="ghost"
        size="icon"
        className={`${darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}`}
        onClick={() => setShowSignup(false)}
      >
        <X size={24} />
      </Button>
    </CardTitle>
  </CardHeader>
  <CardContent>
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="photo" className={`block text-sm font-medium ${darkMode ? "text-white" : "text-gray-700"}`}>
          Photo de Profil
        </Label>
        <Input
          id="photo"
          name="photo"
          type="file"
          onChange={handlePhotoChange}
          className={`mt-1 ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
        />
      </div>
      <div>
        <Label htmlFor="username" className={`block text-sm font-medium ${darkMode ? "text-white" : "text-gray-700"}`}>
          Nom d'utilisateur
        </Label>
        <Input
          id="username"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
          required
          className={`mt-1 ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
        />
      </div>
      <div>
        <Label htmlFor="xAccount" className={`block text-sm font-medium ${darkMode ? "text-white" : "text-gray-700"}`}>
          Compte X
        </Label>
        <Input
          id="xAccount"
          name="xAccount"
          value={formData.xAccount}
          onChange={handleInputChange}
          className={`mt-1 ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
        />
      </div>
      <div>
        <Label htmlFor="socialMedia" className={`block text-sm font-medium ${darkMode ? "text-white" : "text-gray-700"}`}>
          Autres Réseaux Sociaux
        </Label>
        <Input
          id="socialMedia"
          name="socialMedia"
          value={formData.socialMedia}
          onChange={handleInputChange}
          className={`mt-1 ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
        />
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-lime-500 text-white hover:bg-lime-600 dark:bg-lime-600 dark:hover:bg-lime-700 font-medium shadow-lg"
      >
        {isSubmitting ? "Création..." : "Créer un Compte"}
      </Button>
    </form>
  </CardContent>
</Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

