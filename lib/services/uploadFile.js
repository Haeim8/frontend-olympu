// lib/services/uploadFile.js
import { pinataService } from './storage';

const uploadFile = async (file, path, options = {}) => {
  try {
    // Extraction du nom du fichier et de son type
    const fileName = file.name;
    const fileType = file.type;
    const fileSize = file.size;

    // Analyser le chemin pour extraire des informations supplémentaires
    const pathParts = path.split('/');
    const campaignName = pathParts.find(part => part.startsWith('campaign_')) || 'unknown_campaign';
    const fileCategory = pathParts[pathParts.length - 2] || 'uncategorized';

    const result = await pinataService.uploadFile(file, {
      ...options,
      pinataMetadata: {
        name: fileName,
        keyvalues: {
          originalPath: path,
          uploadTimestamp: new Date().toISOString(),
          fileType: fileType,
          fileSize: fileSize,
          campaignName: campaignName,
          fileCategory: fileCategory,
          ...options.keyvalues
        }
      },
      pinataOptions: {
        cidVersion: 1,
        wrapWithDirectory: false,
        ...options.pinataOptions
      }
    });

    // Retournez les informations complètes
    return {
      url: result.gatewayUrl,
      hash: result.ipfsHash,
      metadata: {
        originalPath: path,
        fileName: fileName,
        fileType: fileType,
        fileSize: fileSize,
        uploadTimestamp: new Date().toISOString(),
        campaignName: campaignName,
        fileCategory: fileCategory
      }
    };
  } catch (error) {
    console.error('Erreur lors de l\'upload de fichier sur Pinata:', error);
    throw error;
  }
};

export default uploadFile;