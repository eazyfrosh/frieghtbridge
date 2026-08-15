/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /**
   * Stated explicitly, though Next already ships `firebase-admin` in its
   * built-in externals list — so this line documents the requirement rather
   * than creating it. The SDK resolves several dependencies dynamically, which
   * webpack cannot follow; it has to load from node_modules at runtime.
   *
   * Being external is also what made the jose/CommonJS conflict a *runtime*
   * failure rather than a build one. See the `overrides` note in package.json.
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
