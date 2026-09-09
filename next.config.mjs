/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Mengabaikan error TypeScript saat build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Mengabaikan warning ESLint saat build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
