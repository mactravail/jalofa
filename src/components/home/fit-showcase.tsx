import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, Eye, Heart, Ruler, Sparkles } from "lucide-react";

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
const SLEEVES: StyleIconName[] = ["manche-longue", "manche-ample"];

const FEATURES = [
  { icon: Ruler, label: "Une coupe calculée à partir de vos mesures" },
  { icon: Sparkles, label: "Coupe, col, broderie et tissu au choix" },
  { icon: Eye, label: "Un aperçu en direct de votre tenue" },
];

function OptionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground mb-1.5 text-[10px] font-semibold tracking-wide uppercase">
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
          <p className="text-muted-foreground mt-5 max-w-md text-lg text-pretty">
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

        {/* Right — configurator mockup inside a tablet frame */}
        <div className="relative mx-auto w-full min-w-0 max-w-xl">
          <div className="bg-primary/10 absolute -inset-4 -z-10 rounded-[2.5rem] blur-2xl" />

          <div className="rounded-[2rem] border border-black/10 bg-neutral-900 p-2.5 shadow-2xl dark:bg-neutral-950">
            <div className="bg-card overflow-hidden rounded-[1.35rem]">
              {/* Screen header */}
              <div className="flex items-center justify-between border-b px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-md text-xs font-bold">
                    J
                  </span>
                  <span className="text-xs font-semibold tracking-tight">JALOFA</span>
                </div>
                <nav className="flex items-center gap-1.5 text-[10px] font-medium tracking-wide uppercase">
                  <span className="text-muted-foreground">Tissu</span>
                  <ChevronRight className="text-muted-foreground/40 size-3" />
                  <span className="text-muted-foreground">Style</span>
                  <ChevronRight className="text-muted-foreground/40 size-3" />
                  <span className="text-primary border-primary border-b-2 pb-0.5">Finitions</span>
                </nav>
              </div>

              {/* Screen body */}
              <div className="grid sm:grid-cols-[8.5rem_1fr]">
                {/* Options rail */}
                <aside className="space-y-4 border-b p-3 sm:border-r sm:border-b-0">
                  <div>
                    <OptionLabel>Tissu</OptionLabel>
                    <div className="grid grid-cols-4 gap-1.5">
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
                    <div className="grid grid-cols-3 gap-1.5">
                      {COLLARS.map((name, i) => (
                        <div
                          key={name}
                          className={cn(
                            "flex aspect-square items-center justify-center rounded-md border",
                            i === 1
                              ? "border-primary bg-primary/5 text-primary"
                              : "text-muted-foreground",
                          )}
                        >
                          <StyleIcon name={name} className="h-6 w-8" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <OptionLabel>Fil de broderie</OptionLabel>
                    <div className="flex flex-wrap gap-2">
                      {THREAD_COLORS.map((color, i) => (
                        <span
                          key={color}
                          style={{ backgroundColor: color }}
                          className={cn(
                            "size-5 rounded-full border border-black/10",
                            i === 4 && "ring-primary ring-offset-card ring-2 ring-offset-2",
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="hidden sm:block">
                    <OptionLabel>Manches</OptionLabel>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SLEEVES.map((name, i) => (
                        <div
                          key={name}
                          className={cn(
                            "flex aspect-4/3 items-center justify-center rounded-md border",
                            i === 0
                              ? "border-primary bg-primary/5 text-primary"
                              : "text-muted-foreground",
                          )}
                        >
                          <StyleIcon name={name} className="h-8 w-6" />
                        </div>
                      ))}
                    </div>
                  </div>
                </aside>

                {/* Live preview */}
                <div className="from-muted/60 to-background relative min-h-[20rem] bg-gradient-to-b sm:min-h-[24rem]">
                  <Image
                    src="/models/grand-boubou.jpg"
                    alt="Grand boubou sur mesure"
                    fill
                    sizes="(max-width: 1024px) 60vw, 30vw"
                    className="object-cover"
                  />

                  {/* Selected-detail chips */}
                  <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
                    {["Grand boubou", "Col Mao brodé"].map((label) => (
                      <span
                        key={label}
                        className="bg-background/85 rounded-full px-2.5 py-1 text-[11px] font-medium shadow-sm backdrop-blur"
                      >
                        {label}
                      </span>
                    ))}
                  </div>

                  {/* Price card */}
                  <div className="bg-card/95 absolute right-3 bottom-3 w-40 rounded-xl border p-3 shadow-lg backdrop-blur">
                    <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                      Sur mesure
                    </p>
                    <p className="text-sm font-bold">Grand boubou</p>
                    <p className="text-primary mt-0.5 text-lg font-bold">{formatPrice(45000)}</p>
                    <p className="text-muted-foreground text-[10px]">Tissu · Wax premium</p>
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <span className="bg-primary text-primary-foreground flex-1 rounded-md py-1.5 text-center text-xs font-semibold">
                        Suivant
                      </span>
                      <span className="text-muted-foreground rounded-md border p-1.5">
                        <Heart className="size-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
