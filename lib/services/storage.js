// lib/services/storage.js

import axios from 'axios'; // Importation correcte d'axios

class PinataService {
  constructor() {
    // Récupération des clés API depuis les variables d'environnement
    this.apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    this.secretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
    this.gateway = 'https://gateway.pinata.cloud/ipfs';

    // Création d'une instance axios avec les configurations nécessaires
    this.axiosInstance = axios.create({
      baseURL: 'https://api.pinata.cloud',
      headers: {
        'pinata_api_key': this.apiKey,
        'pinata_secret_api_key': this.secretKey
      }
    });
  }

  /**
   * Méthode pour uploader un fichier unique sur Pinata
   * @param {File} file - Le fichier à uploader
   * @param {Object} options - Options supplémentaires pour l'upload
   * @returns {Object} - Informations sur le fichier uploadé
   */
  async uploadFile(file, options = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Préparation des métadonnées
      const metadata = {
        name: file.name,
        keyvalues: {
          timestamp: new Date().toISOString(),
          ...options.keyvalues
        },
        ...options.pinataMetadata
      };
      formData.append('pinataMetadata', JSON.stringify(metadata));

      // Options de pinning
      const pinataOptions = {
        cidVersion: 1,
        ...options.pinataOptions
      };
      formData.append('pinataOptions', JSON.stringify(pinataOptions));

      // Upload du fichier
      const response = await this.axiosInstance.post('/pinning/pinFileToIPFS', formData, {
        maxContentLength: Infinity,
        headers: formData.getHeaders ? formData.getHeaders() : {}
      });

      return {
        success: true,
        ipfsHash: response.data.IpfsHash,
        gatewayUrl: `${this.gateway}/${response.data.IpfsHash}`,
        metadata: metadata
      };

    } catch (error) {
      console.error('Pinata upload error:', error);
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  /**
   * Méthode pour uploader une structure de dossiers sur Pinata
   * @param {String} directoryName - Nom du dossier principal
   * @param {Array} files - Tableau d'objets contenant le contenu et le chemin relatif des fichiers
   * @returns {Object} - Informations sur le dossier uploadé
   */
  async uploadDirectory(directoryName, files) {
    try {
      const formData = new FormData();

      files.forEach(file => {
        let fileContent;
        
        if (file.content instanceof Blob || file.content instanceof File) {
          fileContent = file.content;
        } else {
          fileContent = new Blob([JSON.stringify(file.content)], { type: 'application/json' });
        }
        
        // file.path doit être le chemin relatif dans le dossier
        formData.append('file', fileContent, file.path);
      });

      // Métadonnées pour le dossier
      const metadata = {
        name: directoryName,
        keyvalues: {
          timestamp: new Date().toISOString(),
        }
      };
      formData.append('pinataMetadata', JSON.stringify(metadata));

      // Options de pinning
      const pinataOptions = {
        cidVersion: 1,
        wrapWithDirectory: false, // Important pour conserver la structure
      };
      formData.append('pinataOptions', JSON.stringify(pinataOptions));

      // Upload de la structure de dossiers
      const response = await this.axiosInstance.post('/pinning/pinFileToIPFS', formData, {
        maxContentLength: Infinity,
        headers: formData.getHeaders ? formData.getHeaders() : {}
      });

      return {
        success: true,
        ipfsHash: response.data.IpfsHash,
        gatewayUrl: `${this.gateway}/${response.data.IpfsHash}`,
        metadata: metadata
      };

    } catch (error) {
      console.error('Pinata upload directory error:', error);
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  /**
   * Méthode pour uploader du JSON sur Pinata
   * @param {Object} data - Données JSON à uploader
   * @param {Object} options - Options supplémentaires pour l'upload
   * @returns {Object} - Informations sur le JSON uploadé
   */
  async uploadJSON(data, options = {}) {
    try {
      const body = {
        pinataMetadata: {
          name: options.name || 'data.json',
          keyvalues: {
            timestamp: new Date().toISOString(),
            ...options.keyvalues
          }
        },
        pinataContent: data,
        pinataOptions: {
          cidVersion: 1,
          ...options.pinataOptions
        }
      };

      const response = await this.axiosInstance.post('/pinning/pinJSONToIPFS', body);

      return {
        success: true,
        ipfsHash: response.data.IpfsHash,
        gatewayUrl: `${this.gateway}/${response.data.IpfsHash}`,
        metadata: body.pinataMetadata
      };

    } catch (error) {
      console.error('Pinata JSON upload error:', error);
      throw new Error(error.response?.data?.message || error.message);
    }
  }
}

export const pinataService = new PinataService();
