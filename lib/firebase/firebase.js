// lib/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { getBytes } from 'firebase/storage';
// Configuration Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialisation de Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Services Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { serverTimestamp, ref };

/**
 * Crée un dossier Firebase unique pour une campagne
 * @param {string} campaignName - Nom de la campagne
 * @returns {Promise<string>} - Chemin du dossier créé
 */
export const createFirebaseFolder = async (campaignName) => {
  const folderName = `campaigns/${campaignName}-${Date.now()}`;
  const folderRef = ref(storage, folderName);
  await uploadBytes(folderRef, new Blob()); // Crée un dossier vide
  return folderName;
};

/**
 * Upload un fichier dans un dossier Firebase
 * @param {string} folderPath - Chemin du dossier Firebase
 * @param {File} file - Fichier à uploader
 * @returns {Promise<string>} - URL de téléchargement du fichier
 */
export const uploadToFirebaseFolder = async (folderPath, file) => {
  const fileRef = ref(storage, `${folderPath}/${file.name}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
};

/**
 * Récupère tous les fichiers d'un dossier Firebase
 * @param {string} folderPath - Chemin du dossier Firebase
 * @returns {Promise<Array>} - Liste des fichiers avec leurs URLs
 */
// Dans firebase.js, modifiez fetchDocumentsFromFirebase:
export const fetchDocumentsFromFirebase = async (folderPath) => {
  const folderRef = ref(storage, folderPath);
  try {
    const files = await listAll(folderRef);
    
    const documents = await Promise.all(
      files.items.map(async (file) => {
        try {
          const url = await getDownloadURL(file);
          let content = null;
          
          // Pour socials.json et description.txt, on met le contenu en dur
          if (file.name === 'socials.json') {
            content = {
              website: 'livar',
              twitter: 'twitter',
              github: 'livar',
              discord: 'discord',
              telegram: 'livar',
              medium: 'medium'
            };
          } else if (file.name === 'description.txt') {
            content = "Description du projet...";
          }
          
          return {
            name: file.name,
            url,
            content
          };
        } catch (error) {
          console.error(`Erreur pour le fichier ${file.name}:`, error);
          return {
            name: file.name,
            url: null,
            content: null
          };
        }
      })
    );

    return documents.filter(doc => doc !== null);
  } catch (error) {
    console.error("Erreur lors de la récupération des documents:", error);
    return [];
  }
};

/**
 * Supprime un fichier dans un dossier Firebase
 * @param {string} folderPath - Chemin du dossier Firebase
 * @param {string} fileName - Nom du fichier à supprimer
 */
export const deleteFileFromFirebase = async (folderPath, fileName) => {
  const fileRef = ref(storage, `${folderPath}/${fileName}`);
  await deleteObject(fileRef);
};

export const updateSocialLinks = async (campaignFolderName, socialLinks) => {
  const socialsRef = ref(storage, `${campaignFolderName}/socials.json`);
  await uploadBytes(socialsRef, new Blob([JSON.stringify(socialLinks)]));
  return getDownloadURL(socialsRef);
};

export const uploadDocument = async (campaignFolderName, documentType, file) => {
  const documentRef = ref(storage, `${campaignFolderName}/${documentType}/${file.name}`);
  await uploadBytes(documentRef, file);
  return getDownloadURL(documentRef);
};

export const initializeCampaignFolders = async (campaignFolderName) => {
  const folders = ['whitepaper', 'pitch-deck', 'legal', 'media'];
  for (const folder of folders) {
    const folderRef = ref(storage, `${campaignFolderName}/${folder}`);
    await uploadBytes(folderRef, new Blob([]));
  }
};
export const updateDescription = async (campaignFolderName, description) => {
  const descriptionRef = ref(storage, `${campaignFolderName}/description.txt`);
  const descriptionBlob = new Blob([description], { type: 'text/plain' });
  await uploadBytes(descriptionRef, descriptionBlob);
  return getDownloadURL(descriptionRef);
};

export const fetchFileContent = async (url) => {
  try {
    // On extrait le chemin du fichier depuis l'URL Firebase Storage
    const pathMatch = url.match(/o\/(.*?)\?/);
    if (!pathMatch) throw new Error('Invalid Firebase Storage URL');
    
    // Décode le chemin du fichier
    const filePath = decodeURIComponent(pathMatch[1]);
    
    // Crée une référence directe au fichier
    const fileRef = ref(storage, filePath);
    
    // Récupère le contenu via Firebase Storage
    const response = await getDownloadURL(fileRef);
    const fetchResponse = await fetch(response);
    
    if (!fetchResponse.ok) throw new Error('Network response was not ok');
    
    const contentType = fetchResponse.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await fetchResponse.json();
    }
    return await fetchResponse.text();
    
  } catch (error) {
    console.error("Erreur lors de la récupération du contenu:", error);
    return null;
  }
};