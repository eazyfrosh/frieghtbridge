/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /**
   * Keep the Admin SDK out of the bundler and let it load from node_modules at
   * runtime. It resolves several dependencies dynamically, which webpack
   * cannot follow — bundling it can produce a serverless function that builds
   * fine and then throws on first use.
   */
  serverExternalPackages: ['firebase-admin'],
  images: {
    formats: ['image/avif', 'image/webp'],
    // All imagery is local. Add a host here if you later serve photos from a
    // CDN and point `HERO_MEDIA`/`IMAGERY` in lib/site.ts at it.
    remotePatterns: [],
  },
};

export default nextConfig;
