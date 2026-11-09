/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/content/[library]/[slug]": ["./content-library/**/*", "./generated-content/image-optimized/**/*"],
    "/apps/corporate/runtime/[[...assetPath]]": ["./private-product-workspaces/corporate/**/*"],
    "/apps/academy/runtime/[[...assetPath]]": ["./private-product-workspaces/academy/**/*"],
  },
};

module.exports = nextConfig;
