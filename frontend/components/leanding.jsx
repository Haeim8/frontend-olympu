"use client";

import { useState, useEffect } from "react";
import { useAddress } from "@thirdweb-dev/react";
import { db } from "@/lib/firebase/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

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

export default function Home({ onAccessInterface }) {
  const [darkMode, setDarkMode] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [formData, setFormData] = useState({
    photo: "",
    username: "",
    xAccount: "",
    socialMedia: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const address = useAddress();
  const router = useRouter();

  // Vérifier si l'utilisateur a un profil Firebase
  useEffect(() => {
    const checkUserProfile = async () => {
      if (address) {
        try {
          const userDoc = await getDoc(doc(db, "users", address));
          setUserExists(userDoc.exists());
        } catch (error) {
          console.error("Erreur lors de la vérification du profil:", error);
        }
      }
    };
    checkUserProfile();
  }, [address]);

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
      alert("Profil créé avec succès !");
      
    } catch (error) {
      console.error("Erreur lors de la création du profil:", error);
      alert("Erreur lors de la création du profil. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
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
          setShowSignup={setShowSignup}
          onAccessInterface={onAccessInterface}
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