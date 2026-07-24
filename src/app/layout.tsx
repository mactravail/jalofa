import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import {
  APP_NAME,
  APP_TAGLINE,
  THEME_COLOR_DARK,
  THEME_COLOR_LIGHT,
} from "@/lib/constants";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Le mono ne sert qu'aux numéros de commande / champs carte (dashboard,
// checkout) — jamais sur la home ni les pages vitrine. On l'auto-héberge mais
// sans preload, pour ne pas charger cette fonte sur des routes qui n'en ont
// pas besoin ; elle est récupérée à la demande là où elle apparaît.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

// La fonte du logotype JALOFA (cf. <Wordmark />). Un seul graisse (500) en
// latin : le fichier reste léger, et il est préchargé car le logo est présent
// au-dessus de la ligne de flottaison sur chaque page.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "JALOFA met en relation clients, tailleurs et vendeurs de tissus. Créez un vêtement sur mesure depuis votre téléphone, en Afrique.",
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

// viewport-fit=cover : la page passe sous les encoches / barres système, les
// zones sensibles sont rendues via env(safe-area-inset-*) (cf. bottom nav).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLOR_LIGHT },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLOR_DARK },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
