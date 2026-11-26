import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Permite subir fotos de perfil de hasta ~5 MB desde el formulario.
    serverActions: { bodySizeLimit: "5mb" },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
};

export default nextConfig;
