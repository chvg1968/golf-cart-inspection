const Airtable = require('airtable');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configuración de imágenes sin optimización
  images: {
    unoptimized: true,
    domains: [
      'hebbkx1anhila5yf.public.blob.vercel-storage.com',
      'localhost',
      'golfcartinsp.netlify.app'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**'
      }
    ]
  },

  // Generación de rutas estáticas
  async generateStaticParams() {
    try {
      // Configurar Airtable
      const base = new Airtable({ 
        apiKey: process.env.AIRTABLE_API_KEY 
      }).base(process.env.AIRTABLE_BASE_ID);

      // Recuperar registros de inspección
      const records = await base(process.env.AIRTABLE_TABLE_NAME)
        .select({
          fields: [
            'Inspection ID', 
            'Property', 
            'Golf Cart Number', 
            'Inspection Date'
          ],
          maxRecords: 500  // Ajustar según necesidad
        })
        .all();

      // Mapear IDs para generación de páginas
      return records.map(record => {
        const property = record.get('Property') || 'unknown';
        const cartNumber = record.get('Golf Cart Number') || 'unknown';
        const date = record.get('Inspection Date') || 'unknown';
        const inspectionId = record.get('Inspection ID') || '';

        return {
          inspectionId: encodeURIComponent(
            `${property}-${cartNumber}-${date}-${inspectionId}`
          )
        };
      });
    } catch (error) {
      console.error('Error generando páginas estáticas:', error);
      return [];
    }
  },

  // Deshabilitar SWC y usar Babel
  swcMinify: false,

  // Reescrituras para manejar URLs
  async rewrites() {
    return [
      // Normalizar URLs con doble barra
      {
        source: '//signature/:path*',
        destination: '/signature/:path*'
      },
      {
        source: '/signature//:path*',
        destination: '/signature/:path*'
      }
    ];
  },

  // Redirecciones para URLs
  async redirects() {
    return [
      // Eliminar barras dobles
      {
        source: '//signature/:path*',
        destination: '/signature/:path*',
        permanent: true
      },
      {
        source: '/signature//:path*',
        destination: '/signature/:path*',
        permanent: true
      },
      // Redirigir URLs con formato antiguo
      {
        source: '/signature/:property-:cartNumber-:date-:randomId',
        destination: '/signature/[inspectionId]',
        permanent: true
      }
    ];
  },

  // Configuraciones de seguridad
  headers() {
    return [
      {
        source: '/signature/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          },
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0'
          }
        ]
      }
    ];
  },

  // Configuración de webpack
  webpack: (config, { isServer }) => {
    // Configuraciones de fallback para módulos
    config.resolve.fallback = { 
      fs: false,
      net: false, 
      tls: false 
    };

    return config;
  }
};

module.exports = nextConfig;
