import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://accounts.google.com https://www.gstatic.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://apis.google.com https://accounts.google.com https://www.googleapis.com https://drive.google.com https://content.googleapis.com https://oauth2.googleapis.com",
              "frame-src 'self' https://accounts.google.com https://drive.google.com https://content.googleapis.com https://docs.google.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
