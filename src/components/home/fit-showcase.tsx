import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BatteryFull,
  ChevronRight,
  Eye,
  Heart,
  Ruler,
  Signal,
  Sparkles,
  Wifi,
} from "lucide-react";

import { StyleIcon, type StyleIconName } from "@/components/order/style-icons";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Marketing showcase for the on-app configurator, modelled on Hockerty's
// split-screen "designer" block but rebuilt around JALOFA's real options
// (coupes / cols / broderie from `style-options.ts`, fabric swatches, FCFA).
// Purely decorative & static → server component.

const FABRIC_SWATCHES = ["/fabrics/8.jpg", "/fabrics/2.jpg", "/fabrics/11.jpg", "/fabrics/5.jpg"];
const THREAD_COLORS = ["#b45309", "#1e3a8a", "#0f766e", "#7c2d12", "#a16207", "#171717"];
const COLLARS: StyleIconName[] = ["col-rond", "col-mao", "col-v"];

const FEATURES = [
  { icon: Ruler, label: "Une coupe calculée à partir de vos mesures" },
  { icon: Sparkles, label: "Coupe, col, broderie et tissu au choix" },
  { icon: Eye, label: "Un aperçu en direct de votre tenue" },
];

function OptionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground mb-1 text-[8px] font-semibold tracking-wide uppercase">
      {children}
    </p>
  );
}

export function FitShowcase() {
  return (
    <section className="bg-secondary/30 border-y">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:py-24 lg:grid-cols-2">
        {/* Left — copy */}
        <div>
          <span className="text-primary text-sm font-semibold tracking-wide uppercase">
            Le configurateur JALOFA
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl">
            La technologie au service d&apos;une coupe parfaite
          </h2>
          {/* Intro trop longue sur mobile → réservée au desktop */}
          <p className="text-muted-foreground mt-5 hidden max-w-md text-lg text-pretty md:block">
            Quand votre tenue est confectionnée avec soin, ça se ressent. Avant que nos
            tailleurs ne la réalisent à la main, notre configurateur vous laisse composer
            chaque détail — coupe, col, broderie et tissu — pendant que notre algorithme
            calcule une taille qui vous va vraiment.
          </p>

          <ul className="mt-6 space-y-3">
            {FEATURES.map((feature) => (
              <li key={feature.label} className="flex items-center gap-3 text-sm">
                <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                  <feature.icon className="size-4" />
                </span>
                <span className="font-medium">{feature.label}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/modeles"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "mt-8 h-11 rounded-full px-6 text-base",
            )}
          >
            Personnaliser ma tenue <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Right — configurator mockup inside an iPhone frame.
            Le téléphone est dimensionné par sa HAUTEUR (min(30rem, 58vh)) : la largeur
            découle du ratio, donc l'appareil tient toujours en entier dans un écran. */}
        <div className="flex w-full min-w-0 justify-center">
          {/* Châssis : tranche titane + boutons latéraux */}
          <div className="relative aspect-[9/19.5] h-[min(30rem,58vh)] max-w-full rounded-[2.25rem] bg-neutral-900 p-[3px] shadow-2xl ring-1 ring-black/10 dark:bg-neutral-800">
            <div className="bg-primary/10 absolute -inset-5 -z-10 rounded-[3rem] blur-2xl" />

            <span className="absolute top-[14%] -left-[3px] h-[4%] w-[3px] rounded-l-sm bg-neutral-700" />
            <span className="absolute top-[21%] -left-[3px] h-[7%] w-[3px] rounded-l-sm bg-neutral-700" />
            <span className="absolute top-[30%] -left-[3px] h-[7%] w-[3px] rounded-l-sm bg-neutral-700" />
            <span className="absolute top-[24%] -right-[3px] h-[10%] w-[3px] rounded-r-sm bg-neutral-700" />

            <div className="bg-card relative flex h-full flex-col overflow-hidden rounded-[2.1rem]">
              {/* Dynamic Island */}
              <span className="absolute top-1.5 left-1/2 z-20 h-5 w-16 -translate-x-1/2 rounded-full bg-black" />

              {/* Barre d'état iOS */}
              <div className="flex items-center justify-between px-3.5 pt-2 pb-1 text-[8px] font-semibold">
                <span>9:41</span>
                <span className="flex items-center gap-0.5">
                  <Signal className="size-2.5" />
                  <Wifi className="size-2.5" />
                  <BatteryFull className="size-3" />
                </span>
              </div>

              {/* Screen header */}
              <div className="flex items-center justify-between border-b px-3 pb-1.5">
                <span className="bg-primary/10 text-primary flex size-5 items-center justify-center rounded-md text-[10px] font-bold">
                  J
                </span>
                <nav className="flex items-center gap-0.5 text-[8px] font-medium tracking-wide uppercase">
                  <span className="text-muted-foreground">Tissu</span>
                  <ChevronRight className="text-muted-foreground/40 size-2.5" />
                  <span className="text-muted-foreground">Style</span>
                  <ChevronRight className="text-muted-foreground/40 size-2.5" />
                  <span className="text-primary border-primary border-b-2 pb-0.5">Finitions</span>
                </nav>
              </div>

              {/* Screen body */}
              <div className="flex min-h-0 flex-1 flex-col">
                {/* Options rail */}
                <aside className="space-y-2.5 border-b p-3">
                  <div>
                    <OptionLabel>Tissu</OptionLabel>
                    <div className="grid grid-cols-4 gap-1">
                      {FABRIC_SWATCHES.map((src, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={src}
                          src={src}
                          alt=""
                          className={cn(
                            "aspect-square w-full rounded-md object-cover",
                            i === 0 ? "ring-primary ring-2" : "opacity-90",
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <OptionLabel>Col</OptionLabel>
                    <div className="grid grid-cols-3 gap-1">
                      {COLLARS.map((name, i) => (
                        <div
                          key={name}
                          className={cn(
                            "flex aspect-4/3 items-center justify-center rounded-md border",
                            i === 1
                              ? "border-primary bg-primary/5 text-primary"
                              : "text-muted-foreground",
                          )}
                        >
                          <StyleIcon name={name} className="h-5 w-7" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <OptionLabel>Fil de broderie</OptionLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {THREAD_COLORS.map((color, i) => (
                        <span
                          key={color}
                          style={{ backgroundColor: color }}
                          className={cn(
                            "size-4 rounded-full border border-black/10",
                            i === 4 && "ring-primary ring-offset-card ring-2 ring-offset-1",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </aside>

                {/* Live preview */}
                <div className="from-muted/60 to-background relative min-h-[6rem] flex-1 bg-gradient-to-b">
                  <Image
                    src="/models/grand-boubou.jpg"
                    alt="Grand boubou sur mesure"
                    fill
                    sizes="240px"
                    className="object-cover"
                  />

                  {/* Selected-detail chips */}
                  <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
                    {["Grand boubou", "Col Mao brodé"].map((label) => (
                      <span
                        key={label}
                        className="bg-background/85 rounded-full px-2 py-0.5 text-[9px] font-medium shadow-sm backdrop-blur"
                      >
                        {label}
                      </span>
                    ))}
                  </div>

                  {/* Price card */}
                  <div className="bg-card/95 absolute right-2 bottom-4 w-28 rounded-lg border p-2 shadow-lg backdrop-blur">
                    <p className="text-muted-foreground text-[8px] font-medium tracking-wide uppercase">
                      Sur mesure
                    </p>
                    <p className="text-[11px] font-bold">Grand boubou</p>
                    <p className="text-primary text-sm font-bold">{formatPrice(45000)}</p>
                    <p className="text-muted-foreground text-[8px]">Tissu · Wax premium</p>
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="bg-primary text-primary-foreground flex-1 rounded-md py-1 text-center text-[9px] font-semibold">
                        Suivant
                      </span>
                      <span className="text-muted-foreground rounded-md border p-1">
                        <Heart className="size-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barre d'accueil iOS */}
              <span className="absolute bottom-1 left-1/2 z-20 h-[3px] w-20 -translate-x-1/2 rounded-full bg-white/80" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
