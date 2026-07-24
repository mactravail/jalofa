import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
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
      // Same for the fabric: it is now chosen before the configurator (on the
      // garment or fabric page), never inside it — so the old « Tissu » step
      // route is gone. Send stale links to the catalogue rather than a 404.
      { source: "/commande/nouvelle/tissu", destination: "/modeles", permanent: false },
    ];
  },
};

/**
 * En développement, Next relance `generateStaticParams` à CHAQUE requête sur une
 * route dynamique de l'App Router (/modeles/[id], /tissus/[id], /tailleurs/[id]…)
 * dans un worker `jest-worker`. Par défaut ce worker est un **processus enfant**
 * forké à chaque navigation : s'il meurt (mémoire, disque lent, fork qui rate
 * sous Windows), la page remonte « Jest worker encountered 2 child process
 * exceptions, exceeding retry limit » — une erreur du serveur de dev, sans aucun
 * rapport avec le code de la page.
 *
 * `workerThreads` fait tourner ce worker dans un *thread* du même processus :
 * plus de fork par requête, donc plus de crash de processus enfant (et des
 * navigations sensiblement plus rapides en local).
 *
 * Réservé au serveur de dev : en build, les workers de rendu restent des
 * processus séparés, comme sur Vercel.
 */
export default function config(phase: string): NextConfig {
  if (phase !== PHASE_DEVELOPMENT_SERVER) return nextConfig;
  return {
    ...nextConfig,
    experimental: { ...nextConfig.experimental, workerThreads: true },
  };
}
