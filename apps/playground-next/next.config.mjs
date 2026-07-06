/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@cardenelabs/cdl"],
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-dialog"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
