import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects: async () => {
    return [
      {
        source: "/api/auth/:path*",
        destination: "/auth/:path*",
        permanent: false,
      },
    ];
  },
  /* config options here */
};

export default nextConfig;
