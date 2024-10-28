// lib/firebase/uploadFile.js

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

const uploadFile = async (file, path) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
};

export default uploadFile;
