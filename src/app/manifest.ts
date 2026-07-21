import type { MetadataRoute } from "next";

import { APP_NAME, APP_TAGLINE, THEME_COLOR_LIGHT } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${APP_NAME} — ${APP_TAGLINE}`,
    short_name: APP_NAME,
    description:
      "JALOFA met en relation clients, tailleurs et vendeurs de tissus. Créez un vêtement sur mesure depuis votre téléphone.",
    lang: "fr",
    dir: "ltr",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: THEME_COLOR_LIGHT,
    theme_color: THEME_COLOR_LIGHT,
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Créer une tenue", url: "/modeles" },
      { name: "Tissus", url: "/tissus" },
      { name: "Mes commandes", url: "/compte/commandes" },
    ],
  };
}
