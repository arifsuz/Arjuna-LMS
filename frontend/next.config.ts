import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          process.env.INTERNAL_API_URL ||
          (process.env.NODE_ENV === "production"
            ? "https://arjuna-api.sandiwarno.tech/api/:path*"
            : "http://localhost:4000/api/:path*"),
      },
    ];
  },
};

export default nextConfig;
