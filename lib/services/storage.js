// lib/services/storage.js

import axios from 'axios'; // Importation d'axios

class PinataService {
  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    this.secretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
    this.gateway = 'https://gateway.pinata.cloud/ipfs';
    
    this.axiosInstance = axios.create({
      baseURL: 'https://api.pinata.cloud',
      headers: {
        'pinata_api_key': this.apiKey,
        'pinata_secret_api_key': this.secretKey
      }
    });
  }

  async uploadFile(file, options = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Merge custom metadata with defaults
      const metadata = {
        name: file.name,
        keyvalues: {
          timestamp: new Date().toISOString(),
          ...options.keyvalues
        },
        ...options.pinataMetadata
      };

      formData.append('pinataMetadata', JSON.stringify(metadata));
      
      // Add pinning options
      const pinataOptions = {
        cidVersion: 1,
        wrapWithDirectory: true,
        ...options.pinataOptions
      };
      formData.append('pinataOptions', JSON.stringify(pinataOptions));

      const response = await this.axiosInstance.post('/pinning/pinFileToIPFS', formData, {
        maxContentLength: Infinity,
        // Laissez axios gérer le 'Content-Type' automatiquement
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
