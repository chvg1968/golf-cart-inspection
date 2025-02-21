const Airtable = require('airtable');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configuración de imágenes
  images: {
    unoptimized: true
  },

  // Configuración de webpack básica
  webpack: (config) => {
    config.resolve.fallback = { 
      fs: false,
      net: false, 
      tls: false 
    };
    return config;
  },

  // Configuración de compilación para Babel
  compiler: {
    // Deshabilitar transformaciones específicas
    reactRemoveProperties: false,
    removeConsole: false
  }
};

module.exports = nextConfig;
