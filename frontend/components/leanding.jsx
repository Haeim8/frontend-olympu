"use client";

import { useState, useEffect } from "react";
import { useAddress, useContract, useContractRead } from "@thirdweb-dev/react";
import { db } from "@/lib/firebase/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import FundRaisingPlatformABI from "@/ABI/DivarProxyABI.json";

// Composants réutilisables - Version ShadCN
import { LandingHeader } from "./landing/LandingHeader";
import { LandingHero } from "./landing/LandingHero";
import { LandingInfoSection } from "./landing/LandingInfoSection";
import { BlockchainStats } from "./landing/BlockchainStats";
import { HowItWorks } from "./landing/HowItWorks";
import { ProjectsSection } from "./landing/ProjectsSection";
import { LandingFooter } from "./landing/LandingFooter";
import { LandingSignupModal } from "./landing/LandingSignupModal";
import { LandingBackground } from "./landing/LandingBackground";

export default function Home({ onAccessInterface, userExists: propUserExists, isRegistered: propIsRegistered }) {
  const [darkMode, setDarkMode] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [userExists, setUserExists] = useState(propUserExists || false);
  const [isRegistered, setIsRegistered] = useState(propIsRegistered || false);
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

  const { contract } = useContract(contractAddress, FundRaisingPlatformABI);

  const { data: isRegisteredData, isLoading: readLoading, error: readError } = useContractRead(
    contract,
    "isUserRegistered",
    [address]
  );

  const { data: registrationFeeETH, isLoading: isFeeLoading } = useContractRead(
    contract,
    "getRegistrationFeeETH",
    []
  );

  // Mettre à jour les états locaux quand les props changent
  useEffect(() => {
    if (propUserExists !== undefined) {
      setUserExists(propUserExists);
    }
  }, [propUserExists]);

  useEffect(() => {
    if (propIsRegistered !== undefined) {
      setIsRegistered(propIsRegistered);
    }
  }, [propIsRegistered]);

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

  // Pas besoin de dupliquer la vérification - on utilise les props de app/page.js

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

      if (contract && registrationFeeETH) {
        setRegistrationLoading(true);
        console.log("Appel de la fonction registerUser");
        const tx = await contract.call("registerUser", [], {
          value: registrationFeeETH
        });
        
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

  const handleRegisterOnContract = async () => {
    try {
      setRegistrationLoading(true);
      console.log("Appel de la fonction registerUser");
      const tx = await contract.call("registerUser", [], {
        value: registrationFeeETH
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
  };

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""} text-sm`}>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200 relative overflow-hidden">
        
        <LandingBackground darkMode={darkMode} />
        
        <LandingHeader 
          darkMode={darkMode} 
          toggleDarkMode={toggleDarkMode} 
        />
        
        <LandingHero
          darkMode={darkMode}
          address={address}
          userExists={userExists}
          isRegistered={isRegistered}
          readLoading={readLoading}
          registrationLoading={registrationLoading}
          registrationError={registrationError}
          setShowSignup={setShowSignup}
          handleRegisterOnContract={handleRegisterOnContract}
          router={router}
          isFeeLoading={isFeeLoading}
        />
        
        <LandingInfoSection darkMode={darkMode} />
        
        <BlockchainStats darkMode={darkMode} />
        
        <HowItWorks darkMode={darkMode} />
        
        <ProjectsSection darkMode={darkMode} />
        
        <LandingFooter darkMode={darkMode} />
        
        <LandingSignupModal
          showSignup={showSignup}
          setShowSignup={setShowSignup}
          darkMode={darkMode}
          formData={formData}
          isSubmitting={isSubmitting}
          handleInputChange={handleInputChange}
          handlePhotoChange={handlePhotoChange}
          handleSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}