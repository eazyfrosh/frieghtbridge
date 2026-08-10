/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Hosts allowed to serve optimised images. Add your own here if the hero
    // photo (see `HERO_MEDIA` in lib/site.ts) is served from somewhere else.
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
  },
};

export default nextConfig;
