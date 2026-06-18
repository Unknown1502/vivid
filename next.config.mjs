/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep type-checking strict at build time; skip ESLint so a stray lint rule
  // never blocks a deploy. Vivid's correctness contract lives in TypeScript + Zod.
  eslint: { ignoreDuringBuilds: true },
  reactStrictMode: true,
};

export default nextConfig;
