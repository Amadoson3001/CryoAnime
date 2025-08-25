/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'cdn.myanimelist.net',
                port: '',
                pathname: '/images/anime/**',
            },
        ],
        // Limit image device sizes to reduce generated URLs
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        // Limit image sizes to reduce generated URLs
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        unoptimized: true
    },
}

module.exports = nextConfig
