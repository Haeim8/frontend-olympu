"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAddress, useContract, useContractRead } from "@thirdweb-dev/react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { ethers } from "ethers"
import FundRaisingPlatformABI from "@/ABI/DivarProxyABI.json"

export const useUserRegistration = () => {
  const [userExists, setUserExists] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [formData, setFormData] = useState({
    photo: "",
    username: "",
    xAccount: "",
    socialMedia: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registrationLoading, setRegistrationLoading] = useState(false)
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const [showSignup, setShowSignup] = useState(false)

  const address = useAddress()
  const contractAddress = "0xEF19D1E5510321a5Fbf7F0F701F8162345c40B90"
  const { contract } = useContract(contractAddress, FundRaisingPlatformABI)

  const {
    data: isRegisteredData,
    isLoading: readLoading,
    error: readError,
  } = useContractRead(contract, "isUserRegistered", [address])

  useEffect(() => {
    if (isRegisteredData !== undefined) {
      setIsRegistered(isRegisteredData)
      console.log(`User registered in contract: ${isRegisteredData}`)
    }
    if (readError) {
      console.error("Erreur lors de la lecture du contrat:", readError)
      setRegistrationError(".")
    }
  }, [isRegisteredData, readError])

  useEffect(() => {
    if (address) {
      console.log("User is connected with address:", address)
      checkUserProfileAndContract()
    } else {
      console.log("User is not connected")
      setUserExists(false)
      setIsRegistered(false)
    }
  }, [address, contract])

  const checkUserProfileAndContract = async () => {
    if (!address) return

    const docRef = doc(db, "users", address)
    try {
      const docSnap = await getDoc(docRef)
      console.log(`Checking profile for address: ${address}`)
      console.log(`Document exists: ${docSnap.exists()}`)
      setUserExists(docSnap.exists())
    } catch (error) {
      console.error("Erreur lors de la vérification du profil Firebase:", error)
    }

    if (contract) {
      try {
        const registered = await contract.call("isUserRegistered", [address])
        setIsRegistered(registered)
        console.log(`User registered in contract: ${registered}`)
      } catch (error) {
        console.error("Erreur lors de la lecture de isUserRegistered:", error)
        setRegistrationError(".")
      }
    } else {
      console.error("Erreur lors de la connexion au contrat")
      setRegistrationError("Erreur lors de la connexion au contrat.")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target) {
          setFormData((prev) => ({ ...prev, photo: event.target.result as string }))
        }
      }
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setRegistrationError(null)

    try {
      await setDoc(doc(db, "users", address as string), {
        username: formData.username,
        xAccount: formData.xAccount,
        socialMedia: formData.socialMedia,
        photo: formData.photo,
      })

      console.log("Profil créé:", formData)
      setShowSignup(false)
      setUserExists(true)

      if (contract) {
        setRegistrationLoading(true)
        console.log("Appel de la fonction registerUser avec 0.05 ETH")
        const tx = await contract.call("registerUser", [], { value: ethers.utils.parseEther("0.05") })
        console.log("Transaction réussie:", tx)

        await tx.wait()

        setIsRegistered(true)
        alert("Inscription réussie !")
      }
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error)
      setRegistrationError("Échec de l'inscription. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
      setRegistrationLoading(false)
    }
  }

  const registerOnContract = async () => {
    try {
      setRegistrationLoading(true)
      console.log("Appel de la fonction registerUser avec 0.05 ETH")
      const tx = await contract?.call("registerUser", [], {
        value: ethers.utils.parseEther("0.05"),
      })
      console.log("Transaction réussie:", tx)

      await tx?.wait()

      setIsRegistered(true)
      alert("Inscription réussie !")
      checkUserProfileAndContract()
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error)
      setRegistrationError("Échec de l'inscription. Veuillez réessayer.")
    } finally {
      setRegistrationLoading(false)
    }
  }

  return {
    userExists,
    isRegistered,
    formData,
    isSubmitting,
    registrationLoading,
    registrationError,
    showSignup,
    readLoading,
    setShowSignup,
    handleInputChange,
    handlePhotoChange,
    handleSubmit,
    registerOnContract,
    checkUserProfileAndContract,
  }
}
