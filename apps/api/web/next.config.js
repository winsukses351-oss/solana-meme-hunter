/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@solana-trader/shared"],
  output: "standalone",
}

module.exports = nextConfig
