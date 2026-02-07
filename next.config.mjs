/** @type {import('next').NextConfig} */
const nextConfig = {
    // Configuración base para estabilizar la compilación
    reactStrictMode: true,
    // Forzamos el uso de Webpack para evitar bloqueos de Turbopack en este entorno
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.externals.push('sql.js');
        }
        return config;
    },
};

export default nextConfig;
