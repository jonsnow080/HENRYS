import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import { withSentryConfig } from "@sentry/nextjs";

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

const nextConfig: NextConfig = {
  experimental: {
    mdxRs: true,
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  pageExtensions: ["ts", "tsx", "mdx"],
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default withSentryConfig(withMDX(nextConfig), { silent: true }, {
  hideSourceMaps: true,
});
