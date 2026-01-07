// next.config.mjs
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_NFT_STORAGE_KEY: process.env.NEXT_PUBLIC_NFT_STORAGE_KEY,
  },
  webpack: (config, { isServer }) => {
    config.resolve.extensions = ['.js', '.jsx', '.ts', '.tsx', ...config.resolve.extensions];
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': path.resolve(__dirname, './lib/shims/asyncStorage'),
    };

    // Ignorer pino-pretty (dépendance optionnelle de WalletConnect)
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'pino-pretty': false,
    };

    // Ignorer les warnings pour les modules optionnels
    config.ignoreWarnings = [
      { module: /node_modules\/pino/ },
    ];

    return config;
  },
};

export default nextConfig;
