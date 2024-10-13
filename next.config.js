/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Ajouter les extensions au resolve
    config.resolve.extensions = ['.js', '.jsx', '.ts', '.tsx', ...config.resolve.extensions];

    // Supprimer l'alias wagmi
    return config;
  },
};

module.exports = nextConfig;
