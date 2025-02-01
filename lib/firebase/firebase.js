// lib/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';

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
export { serverTimestamp };

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
export const fetchDocumentsFromFirebase = async (folderPath) => {
  const folderRef = ref(storage, folderPath);
  const files = await listAll(folderRef);
  
  const documents = await Promise.all(
    files.items.map(async (file) => {
      const url = await getDownloadURL(file);
      return {
        name: file.name,
        url: url  // Retourne uniquement le nom et l'URL
      };
    })
  );
  return documents;
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