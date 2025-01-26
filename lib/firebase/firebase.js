import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
 * Upload un fichier vers Firebase Storage
 * @param {File} file - Le fichier à uploader
 * @param {string} path - Le chemin dans Firebase Storage (par défaut : 'documents')
 * @returns {Promise<string>} - L'URL de téléchargement du fichier uploadé
 */
export const uploadDocument = async (file, path = 'documents') => {
  try {
    // Crée une référence pour le fichier dans Firebase Storage
    const storageRef = ref(storage, `${path}/${file.name}`);

    // Upload du fichier
    await uploadBytes(storageRef, file);

    // Récupère l'URL de téléchargement
    const downloadURL = await getDownloadURL(storageRef);

    // Retourne l'URL du fichier uploadé
    return downloadURL;
  } catch (error) {
    console.error('Erreur lors de l\'upload du document :', error);
    throw error; // Propage l'erreur pour la gérer dans le composant
  }
};