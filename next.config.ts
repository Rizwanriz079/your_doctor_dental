import type { NextConfig } from "next";

const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:55421");
const isLocalSupabase = ["127.0.0.1", "localhost"].includes(supabaseUrl.hostname);

const nextConfig: NextConfig = {
  // Data must always be fresh: admin changes have to appear on the public site immediately,
  // so pages render dynamically per request instead of using Cache Components.
  cacheComponents: false,
  // Hide the floating Next.js "N" dev indicator (it never appears in production anyway).
  // Compile and runtime errors are still shown in development.
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: supabaseUrl.protocol.replace(":", "") as "http" | "https",
        hostname: supabaseUrl.hostname,
        port: supabaseUrl.port,
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Only needed when Supabase runs locally during development.
    dangerouslyAllowLocalIP: isLocalSupabase && process.env.NODE_ENV !== "production",
  },
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
    // Client router cache: switching back to a recently viewed page is instant instead of
    // re-requesting it and flashing the loading skeleton. Server Actions that call
    // revalidatePath, and router.refresh() (used after admin changes and on realtime events),
    // clear this cache, so edits still show immediately.
    staleTimes: {
      dynamic: 30, // pages reached by a normal navigation
      static: 60, // pages fully prefetched by header/footer links
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
