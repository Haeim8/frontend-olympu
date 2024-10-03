/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Ajouter les extensions au resolve
    config.resolve.extensions = ['.js', '.jsx', '.ts', '.tsx', ...config.resolve.extensions];
    
    // Ajouter un alias pour wagmi
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      wagmi: require('path').resolve(__dirname, 'node_modules/wagmi/dist'),
    };
    
    return config;
  },
};

module.exports = nextConfig;
