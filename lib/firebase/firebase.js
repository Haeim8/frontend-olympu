// frontend/lib/firebase/firebase.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD0tK5k8OSUvF0E1lPJoJKX7yCoFXryUnU",
  authDomain: "finibus-fb8ea.firebaseapp.com",
  projectId: "finibus-fb8ea",
  storageBucket: "finibus-fb8ea.appspot.com",
  messagingSenderId: "674435373362",
  appId: "1:674435373362:web:cf2b3546bc4fa918069f2b",
  measurementId: "G-S4XSTMXDE8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
