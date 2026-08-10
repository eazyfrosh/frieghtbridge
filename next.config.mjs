/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // All imagery is local. Add a host here if you later serve photos from a
    // CDN and point `HERO_MEDIA`/`IMAGERY` in lib/site.ts at it.
    remotePatterns: [],
  },
};

export default nextConfig;
