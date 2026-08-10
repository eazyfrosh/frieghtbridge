/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Illustrations ship from /public/images. Swap in photography by adding a
    // remote host here and pointing the `src` at it — the components take any URL.
    remotePatterns: [],
  },
};

export default nextConfig;
