import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jalofa.com").replace(/\/+$/, "");

// Google peut tout lire sauf les espaces privés (compte, pros, admin, paiement).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/admin",
        "/compte",
        "/tailleur/espace",
        "/vendeur/espace",
        "/caisse",
        "/panier",
        "/paiement",
        "/commande/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
