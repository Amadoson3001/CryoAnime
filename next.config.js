/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'cdn.myanimelist.net',
                port: '',
                pathname: '/images/**',
            },
        ],
        // Optimized device sizes for responsive images
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        // Image sizes for layout="fill" or specific widths
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        // Prefer WebP for better compression
        formats: ['image/webp'],
    },
}

module.exports = nextConfig
