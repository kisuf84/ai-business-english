/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      "/content/[library]/[slug]": ["./content-library/**/*", "./generated-content/image-optimized/**/*"],
    },
  },
};

module.exports = nextConfig;
