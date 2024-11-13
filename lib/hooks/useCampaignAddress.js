// lib/services/pinata.js
import axios from 'axios';

class PinataService {
  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    this.secretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
    this.gateway = 'https://gateway.pinata.cloud/ipfs';
    
    if (!this.apiKey || !this.secretKey) {
      throw new Error('Clés API Pinata manquantes');
    }

    this.axiosInstance = axios.create({
      baseURL: 'https://api.pinata.cloud',
      headers: {
        'pinata_api_key': this.apiKey,
        'pinata_secret_api_key': this.secretKey,
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  async uploadCampaignData(campaignData, files) {
    try {
      // Upload des fichiers d'abord
      const uploadedFiles = await Promise.all(
        files.map(async file => {
          const result = await this.uploadFile(file);
          return {
            name: file.name,
            ipfsHash: result.ipfsHash,
            url: result.gatewayUrl
          };
        })
      );

      // Création des métadonnées de la campagne
      const metadata = {
        name: campaignData.name,
        description: campaignData.description,
        files: uploadedFiles,
        attributes: {
          sector: campaignData.sector,
          targetAmount: campaignData.targetAmount,
          sharePrice: campaignData.sharePrice,
          endDate: campaignData.endDate
        },
        created: new Date().toISOString()
      };

      // Upload des métadonnées
      const result = await this.uploadJSON(metadata, {
        name: `campaign_${campaignData.name.toLowerCase().replace(/\s+/g, '_')}`
      });

      return {
        success: true,
        metadataHash: result.ipfsHash,
        metadataUrl: result.gatewayUrl,
        files: uploadedFiles
      };

    } catch (error) {
      console.error('Erreur lors de l\'upload de la campagne:', error);
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Vos méthodes existantes uploadFile, uploadDirectory, uploadJSON restent inchangées
}

export const pinataService = new PinataService();
