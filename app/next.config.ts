import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    const cspParts = [
      "default-src 'self'",
      // In development, unsafe-eval is required by Webpack/React hot reloading.
      // In production, it is NOT needed and poses an XSS risk — removed.
      isDev
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        : "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      // Restrict connect-src to known endpoints (Solana RPCs + self)
      [
        "connect-src 'self'",
        "https://api.mainnet-beta.solana.com",
        "https://api.devnet.solana.com",
        "https://rpc.ankr.com",
        "https://solana-mainnet.g.alchemy.com",
        "wss://api.mainnet-beta.solana.com",
        "wss://api.devnet.solana.com",
      ].join(" "),
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: cspParts.join("; "),
          },
          // HSTS: force HTTPS for 1 year, include subdomains, allow preloading
          // Only meaningful in production (browsers ignore it over HTTP)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, x-api-key",
          },
          // Prevent API responses from being cached by CDNs
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
    ];
  },
};

export default nextConfig;
