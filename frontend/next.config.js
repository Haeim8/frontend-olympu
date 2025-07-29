/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_NFT_STORAGE_KEY: process.env.NEXT_PUBLIC_NFT_STORAGE_KEY,
  },
  webpack: (config) => {
    config.resolve.extensions = ['.js', '.jsx', '.ts', '.tsx', ...config.resolve.extensions];
    return config;
  },
};

module.exports = nextConfig;