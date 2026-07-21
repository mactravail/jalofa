import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Swatch uploads travel through `saveFabric`. Resized photos land well under
    // the 1 Mo default, but this leaves room for browsers where the client-side
    // resize falls back to the original. Kept under Vercel's ~4,5 Mo request cap
    // and mirrored by MAX_UPLOAD_BYTES in `src/lib/image.ts`.
    serverActions: { bodySizeLimit: "4mb" },
  },
  images: {
    // AVIF d'abord (≈ 20-30 % plus léger que le WebP) puis repli WebP : moins
    // d'octets sur la donnée mobile, décisif sur le marché visé. Next encode à
    // la demande et met chaque format en cache.
    formats: ["image/avif", "image/webp"],
    // Qualité unique autorisée (défaut Next 16). Suffisante pour des photos de
    // mode et cohérente avec l'absence de prop `quality` dans le code.
    qualities: [75],
    // Les visuels catalogue changent peu : on garde les dérivés optimisés en
    // cache 31 jours pour éviter de les ré-encoder à chaque requête.
    minimumCacheTTL: 2678400,
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async redirects() {
    return [
      // The configurator used to open the whole model catalogue as its first
      // step; the garment is now chosen in /modeles and can never be swapped
      // mid-flow. Old links / bookmarks land on the catalogue instead of a 404.
      { source: "/commande/nouvelle/modele", destination: "/modeles", permanent: false },
    ];
  },
};

export default nextConfig;
