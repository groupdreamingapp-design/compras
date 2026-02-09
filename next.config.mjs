/** @type {import('next').NextConfig} */
const nextConfig = {
    // Configuración base para estabilizar la compilación
    reactStrictMode: true,
    // Forzamos el uso de Webpack para evitar bloqueos de Turbopack en este entorno
    webpack: (config, { isServer }) => {
        if (!isServer) {
            // Ignorar módulos de Node.js y firebase-admin en el cliente
            config.resolve.alias = {
                ...config.resolve.alias,
                'firebase-admin': false,
            };
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                child_process: false,
                http: false,
                https: false,
                os: false,
                path: false,
                zlib: false,
            };
        } else {
            config.externals.push('sql.js');
        }
        return config;
    },
    // Eliminamos outputFileTracingRoot absoluto que falla en Vercel
    turbopack: {},
};

export default nextConfig;
