"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import {
  Arm,
  BODICE,
  CeremonyDefs,
  EDGE,
  GoldBand,
  HEMS,
  Hand,
  Head,
  MIRROR,
  NECKS,
  Sleeve,
  TORSO,
  UidCtx,
  clipOf,
  skirtFor,
} from "@/components/order/ceremony-avatar";

/**
 * La femme qui porte les tenues « en pièces » du catalogue : ensembles (gilet,
 * chemise, veste + jupe ou pantalon), jupe, tailleur pantalon, veste, gilet,
 * tailleur JALOFA EUROPE et tenue de détente. Même rendu réaliste que la
 * tenue de cérémonie (`ceremony-avatar`), dont elle reprend le corps : on
 * l'habille du bas vers le haut — jupe ou pantalon, haut, gilet, veste —
 * d'après les choix de l'étape Style. Le tissu choisi habille les pièces
 * commandées ; les autres restent neutres (blanc, anthracite).
 *
 * Repère (celui de la cérémonie) : viewBox 0 -40 400 1020. Épaules y≈196,
 * taille y=360, hanches y≈450, entrejambe y≈520, sol y≈966.
 */

export const WOMAN_OUTFIT_KEYS = new Set([
  "ensemble",
  "jupe",
  "tailleur-pantalon",
  "veste-femme",
  "gilet-femme",
  "europe-costume-femme",
  "europe-detente-femme",
]);

const ROYAL = "#2c3fb0";
const WHITE = "#f2f2f4";
const CHARCOAL = "#2a2a30";

type Top = {
  kind: "chemise" | "tshirt" | "sweat" | "debardeur";
  col?: string;
  manches?: string;
  fabric: boolean;
};
type Bottom =
  | { kind: "jupe"; coupe: string; hem: number; fente?: string; fabric: boolean }
  | { kind: "pantalon"; coupe: string; hem: number; plis?: string; fabric: boolean };
type Outer =
  | { kind: "gilet"; style: string; col?: string }
  | { kind: "veste"; style: string; col?: string; boutons?: number; bas?: string; manches?: string };

type Plan = {
  top: Top;
  bottom: Bottom;
  outers: Outer[];
  taille?: string;
  poches?: string;
  embro: string[];
  shoes: "escarpins" | "baskets";
};

const SLEEVES: Record<string, string> = {
  longues: "longue",
  "trois-quarts": "trois-quarts",
  courtes: "courte-ajustee",
  sans: "sans",
};

const SKIRTS: Record<string, string> = {
  droite: "crayon",
  crayon: "crayon",
  "jupe-crayon": "crayon",
  evasee: "demi-cercle",
  "jupe-evasee": "demi-cercle",
  plissee: "plissee",
  patineuse: "trois-quarts-cercle",
  portefeuille: "ligne-a",
  sirene: "sirene",
  volants: "ligne-a",
};

function planFor(key: string, d: Record<string, string>): Plan {
  const plan: Plan = {
    top: { kind: "chemise", col: "rond", manches: "longues", fabric: false },
    bottom: { kind: "pantalon", coupe: "droit", hem: 948, fabric: false },
    outers: [],
    embro: [],
    shoes: "escarpins",
  };
  const embro = (slug: string | undefined) =>
    slug === "riche" ? ["encolure", "plastron"] : slug === "simple" ? ["encolure"] : slug && slug !== "sans" ? [slug] : [];

  switch (key) {
    case "ensemble": {
      const pieces = (d.pieces ?? "gilet-jupe").split("-");
      const hasChemise = pieces.includes("chemise");
      plan.top = {
        kind: "chemise",
        col: hasChemise ? (d.col ?? "classique") : "rond",
        manches: hasChemise ? d.manches : pieces.includes("veste") ? "longues" : "courtes",
        fabric: hasChemise,
      };
      if (pieces.includes("jupe")) {
        plan.bottom = { kind: "jupe", coupe: d.jupe ?? "droite", hem: HEMS[d["longueur-jupe"] ?? "midi"] ?? 780, fabric: true };
      } else {
        plan.bottom = { kind: "pantalon", coupe: d.pantalon ?? "droit", hem: 948, fabric: true };
      }
      if (pieces.includes("gilet")) plan.outers.push({ kind: "gilet", style: d.gilet ?? "droit", col: "v" });
      if (pieces.includes("veste")) plan.outers.push({ kind: "veste", style: d.veste ?? "essentielle" });
      break;
    }
    case "jupe": {
      plan.top = { kind: "chemise", col: "rond", manches: "courtes", fabric: false };
      plan.bottom = { kind: "jupe", coupe: d.coupe ?? "droite", hem: HEMS[d.longueur ?? "genou"] ?? 680, fente: d.fente, fabric: true };
      plan.taille = d.taille;
      plan.poches = d.poches;
      plan.embro = d.broderie && d.broderie !== "sans" ? [`jupe-${d.broderie}`] : [];
      break;
    }
    case "tailleur-pantalon": {
      plan.bottom = {
        kind: "pantalon",
        coupe: d.coupe ?? "palazzo",
        hem: HEMS[d.longueur ?? "longue"] ?? 948,
        plis: d.plis,
        fabric: true,
      };
      plan.taille = d.taille;
      plan.poches = d.poches;
      plan.embro = d.broderie && d.broderie !== "sans" ? [`pantalon-${d.broderie}`] : [];
      break;
    }
    case "veste-femme": {
      plan.outers.push({ kind: "veste", style: d.coupe === "cintre" ? "cintree" : "essentielle", col: d.col ?? "v", manches: d.manches });
      plan.top = { kind: "tshirt", col: "rond", manches: "courtes", fabric: false };
      plan.bottom = { kind: "pantalon", coupe: "droit", hem: 948, fabric: false };
      plan.embro = embro(d.broderie);
      break;
    }
    case "gilet-femme": {
      plan.outers.push({ kind: "gilet", style: d.coupe === "droit" ? "droit" : "cintre", col: d.col ?? "v" });
      plan.embro = embro(d.broderie);
      break;
    }
    case "europe-costume-femme": {
      const bas = d.bas ?? "pantalon-large";
      plan.bottom = bas.startsWith("jupe")
        ? { kind: "jupe", coupe: bas, hem: HEMS[d["longueur-jupe"] ?? "genou"] ?? 680, fabric: true }
        : { kind: "pantalon", coupe: bas === "pantalon-droit" ? "droit" : "large", hem: 948, fabric: true };
      if (bas.startsWith("jupe") && d["ceinture-jupe"] === "avec") plan.taille = "ceinture";
      if (d.gilet === "avec") plan.outers.push({ kind: "gilet", style: "droit", col: "v" });
      plan.outers.push({
        kind: "veste",
        style: d.veste ?? "essentielle",
        boutons: d.boutons === "2" ? 2 : 1,
        bas: d["bas-veste"],
      });
      break;
    }
    case "europe-detente-femme": {
      const haut = d.haut ?? "tshirt";
      plan.top = {
        kind: haut === "chemise" ? "chemise" : haut === "sweat" ? "sweat" : haut === "debardeur" ? "debardeur" : "tshirt",
        col: haut === "chemise" ? "classique" : (d.encolure ?? "rond"),
        manches: haut === "debardeur" ? "sans" : haut === "sweat" ? "longues" : (d.manches ?? "courtes"),
        fabric: true,
      };
      const bas = d.bas ?? "large";
      plan.bottom =
        bas === "jupe"
          ? { kind: "jupe", coupe: "evasee", hem: HEMS.midi, fabric: true }
          : { kind: "pantalon", coupe: bas, hem: bas === "short" ? 600 : bas === "jogging" ? 920 : 948, fabric: true };
      plan.taille = d.taille;
      plan.shoes = "baskets";
      break;
    }
  }
  return plan;
}

// --- Le pantalon -------------------------------------------------------------------

function trouserLeg(coupe: string, hem: number) {
  const p: Record<string, [number, number]> = {
    palazzo: [84, 199],
    pans: [84, 199],
    large: [100, 197],
    "pantalon-large": [100, 197],
    droit: [138, 190],
    "pantalon-droit": [138, 190],
    cigarette: [156, 188],
    evase: [118, 194],
    jogging: [146, 190],
    short: [134, 197],
  };
  if (coupe === "thiaya") {
    return `M158 356 L201 356 L201 640 C196 720 190 860 188 ${hem} L150 ${hem} C120 860 110 700 120 450 C122 410 150 380 158 356 Z`;
  }
  const [out, inn] = p[coupe] ?? p.droit;
  return `M158 356 L201 356 L201 520 C200 640 ${inn} 800 ${inn} ${hem} L${out} ${hem} ` + reverseOuter(out, hem, coupe);
}

/** Le bord extérieur, de l'ourlet jusqu'à la taille. */
function reverseOuter(out: number, hem: number, coupe: string) {
  if (coupe === "evase") return `C${out + 6} ${hem - 160} 150 640 142 520 C138 470 140 410 158 356 Z`;
  return `C${out} ${hem - 160} ${(out + 140) / 2} 600 140 470 C140 420 148 380 158 356 Z`;
}

// --- Les hauts et vestes ---------------------------------------------------------------

const TOP_LONG =
  "M182 146 L218 146 L218 184 C236 188 270 190 286 198 C296 206 294 226 284 248 C274 300 262 330 262 380 " +
  "C262 410 266 430 268 444 Q200 454 132 444 C134 430 138 410 138 380 C138 330 126 300 116 248 " +
  "C106 226 104 206 114 198 C130 190 164 188 182 184 Z";

function vestOpen(len: number, bottomShape: string | undefined) {
  const end =
    bottomShape === "arrondi"
      ? `Q178 ${len + 8} 190 ${len - 6} Q198 ${len - 20} 201 ${len - 26}`
      : bottomShape === "biseaute"
        ? `L170 ${len + 4} L201 ${len - 40}`
        : `L201 ${len + 6}`;
  return (
    `M201 186 L186 186 C164 188 130 190 112 198 C102 206 104 226 114 250 C124 300 138 330 140 362 ` +
    `C138 400 132 430 128 ${len} ${end}`
  );
}

function neckFor(col: string | undefined, depth = 300) {
  switch (col) {
    case "rond":
      return NECKS.rond;
    case "bateau":
      return NECKS.bateau;
    case "v":
    case "chale":
    case "lapel":
      return { l: { x: 112, y: 198 }, r: { x: 288, y: 198 }, path: `L186 186 L200 ${depth} L214 186 L288 198` };
    case "mao":
      return NECKS.montant;
    case "classique":
    case "lavalliere":
    default:
      return { l: { x: 112, y: 198 }, r: { x: 288, y: 198 }, path: "L184 184 L200 224 L216 184 L288 198" };
  }
}

export function WomanOutfitAvatar({
  garmentKey,
  details,
  fabricImage,
  className,
}: {
  /** La clé du vêtement (`garmentStyleKey`). */
  garmentKey: string;
  /** Les choix du configurateur (groupe → option). */
  details: Record<string, string>;
  /** La photo du tissu choisi : elle habille les pièces commandées. */
  fabricImage?: string | null;
  className?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const U = (name: string) => `url(#${name}-${uid})`;
  const fabric = fabricImage ? U("wo-fab") : U("wo-plain");
  const plan = planFor(garmentKey, details);

  const shaded = (d: string, f: string, key?: string | number) => (
    <g key={key}>
      <path d={d} fill={f} stroke={EDGE} strokeWidth={1} />
      <path d={d} fill={U("cv-body-shade")} />
    </g>
  );
  const halves = (open: string, f: string) =>
    [0, 1].map((k) => (
      <g key={k} transform={k ? MIRROR : undefined}>
        <path d={`${open} Z`} fill={f} />
        <path d={`${open} Z`} fill={U("cv-body-shade")} />
        <path d={open} fill="none" stroke={EDGE} strokeWidth={1} />
      </g>
    ));

  const topFill = plan.top.fabric ? fabric : WHITE;
  const bottomFill = plan.bottom.fabric ? fabric : CHARCOAL;
  const veste = plan.outers.find((o) => o.kind === "veste") as Extract<Outer, { kind: "veste" }> | undefined;
  const gilet = plan.outers.find((o) => o.kind === "gilet") as Extract<Outer, { kind: "gilet" }> | undefined;
  const tucked = plan.top.kind === "chemise" && !(plan.bottom.kind === "pantalon" && plan.top.fabric && garmentKey === "europe-detente-femme");
  const topNeck = neckFor(plan.top.kind === "debardeur" ? "debardeur" : plan.top.col);
  const topClip = plan.top.kind === "debardeur" ? NECKS.tiffany : topNeck;
  const hem = plan.bottom.hem;

  // --- Le bas
  const bottomEl = (() => {
    const b = plan.bottom;
    if (b.kind === "jupe") {
      const skirt = skirtFor(SKIRTS[b.coupe] ?? "crayon", b.hem);
      return (
        <g>
          {shaded(skirt.d, bottomFill)}
          <g stroke="rgba(0,0,0,0.3)" strokeWidth={b.coupe === "plissee" ? 1 : 3} fill="none" filter={b.coupe === "plissee" ? undefined : U("cv-blur")}>
            {skirt.folds.map((f) => (
              <path key={f} d={f} />
            ))}
          </g>
          {b.coupe === "portefeuille" && <path d={`M232 362 C224 500 212 640 196 ${b.hem}`} stroke={EDGE} strokeWidth={1.2} fill="none" />}
          {b.coupe === "volants" &&
            [b.hem - 140, b.hem - 70].map((y) => (
              <path key={y} d={`M${150 - (y - 500) * 0.05} ${y} Q200 ${y + 10} ${250 + (y - 500) * 0.05} ${y}`} stroke={EDGE} strokeWidth={1.2} fill="none" />
            ))}
          {b.fente === "devant" && <path d={`M192 ${b.hem} L200 ${b.hem - 150} L208 ${b.hem} Z`} fill={U("cv-skin-arm")} />}
          {b.fente === "cote" && <path d={`M${skirt.hemR - 30} ${b.hem} L${skirt.hemR - 24} ${b.hem - 140} L${skirt.hemR - 10} ${b.hem} Z`} fill={U("cv-skin-arm")} />}
        </g>
      );
    }
    const leg = trouserLeg(b.coupe, b.hem);
    return (
      <g>
        {[0, 1].map((k) => (
          <g key={k} transform={k ? MIRROR : undefined}>
            <path d={leg} fill={bottomFill} />
            <path d={leg} fill={U("cv-body-shade")} />
            <path d={leg} fill="none" stroke={EDGE} strokeWidth={1} />
            <path d={`M170 ${b.coupe === "short" ? 400 : 420} L${b.coupe === "palazzo" || b.coupe === "pans" ? 150 : 166} ${b.hem - 4}`} stroke="rgba(0,0,0,0.25)" strokeWidth={1} />
            {(b.plis === "un" || b.plis === "deux" || b.coupe === "pans") && (
              <path d="M180 360 C178 400 176 440 172 480" stroke="rgba(0,0,0,0.4)" strokeWidth={1} fill="none" />
            )}
            {b.plis === "deux" && <path d="M188 360 C187 396 185 430 182 466" stroke="rgba(0,0,0,0.4)" strokeWidth={1} fill="none" />}
            {b.coupe === "jogging" && <path d={`M147 ${b.hem - 18} L189 ${b.hem - 18} L189 ${b.hem} L147 ${b.hem} Z`} fill={bottomFill} stroke={EDGE} strokeWidth={0.9} />}
          </g>
        ))}
      </g>
    );
  })();

  // --- Le haut
  const topEl = (() => {
    const t = plan.top;
    const d = t.kind === "chemise" && tucked ? BODICE : TOP_LONG;
    return (
      <g>
        <g clipPath={U("wo-top-clip")}>
          {shaded(d, topFill)}
          {t.kind === "sweat" && <path d="M134 430 Q200 440 266 430 L268 446 Q200 456 132 446 Z" fill={topFill} stroke={EDGE} strokeWidth={0.9} />}
          {t.kind === "chemise" && (
            <g>
              <path d={`M196 224 L196 ${tucked ? 364 : 446} M204 224 L204 ${tucked ? 364 : 446}`} stroke="rgba(0,0,0,0.3)" strokeWidth={0.9} />
              {[250, 290, 330].map((y) => (
                <circle key={y} cx={200} cy={y} r={2.2} fill="#fff" stroke="rgba(0,0,0,0.4)" strokeWidth={0.5} />
              ))}
            </g>
          )}
        </g>
        {t.kind === "chemise" && (t.col === "classique" || !t.col) && (
          <g fill={topFill} stroke={EDGE} strokeWidth={0.8}>
            <path d="M199 222 L184 182 L174 196 L186 230 Z" />
            <path d="M201 222 L216 182 L226 196 L214 230 Z" />
          </g>
        )}
        {t.kind === "chemise" && t.col === "lavalliere" && (
          <g fill={topFill} stroke={EDGE} strokeWidth={0.8}>
            <path d="M200 222 C190 212 178 214 180 224 C182 234 194 230 200 222 Z" />
            <path d="M200 222 C210 212 222 214 220 224 C218 234 206 230 200 222 Z" />
            <path d="M197 226 C194 250 190 270 188 290 L194 291 C196 270 199 250 201 228 Z" />
            <path d="M203 226 C205 250 207 266 211 284 L216 281 C212 264 207 248 204 226 Z" />
          </g>
        )}
      </g>
    );
  })();

  // --- Gilet
  const giletEl = gilet && (() => {
    const len = gilet.style === "long" ? 640 : 452;
    const vNeck = { l: { x: 112, y: 198 }, r: { x: 288, y: 198 }, path: `L184 186 L200 ${veste ? 262 : 300} L216 186 L288 198` };
    const open = `M201 140 L184 186 L132 200 C134 240 140 300 142 362 C138 400 134 430 132 ${len} L201 ${len + 6}`;
    return (
      <g>
        <clipPath id={`wo-gilet-clip-${uid}`}>
          <path d={clipOf(gilet.col === "rond" ? NECKS.rond : gilet.col === "bateau" ? NECKS.bateau : vNeck)} />
        </clipPath>
        <g clipPath={U("wo-gilet-clip")}>{halves(open, fabric)}</g>
        {gilet.style === "croise"
          ? [310, 360, 410].flatMap((y) => [
              <circle key={`a${y}`} cx={186} cy={y} r={3.6} fill={U("wo-btn")} />,
              <circle key={`b${y}`} cx={214} cy={y} r={3.6} fill={U("wo-btn")} />,
            ])
          : [316, 352, 388, 424].map((y) => <circle key={y} cx={200} cy={y} r={3.4} fill={U("wo-btn")} />)}
        {gilet.style === "ceinture" && (
          <g>
            <path d="M140 356 Q200 366 260 356 L260 372 Q200 382 140 372 Z" fill={fabric} stroke={EDGE} strokeWidth={0.9} />
            <path d="M200 366 L188 400 M200 366 L210 404" stroke={EDGE} strokeWidth={4} />
          </g>
        )}
      </g>
    );
  })();

  // --- Veste
  const vesteEl = veste && (() => {
    const len = veste.style === "heritage" ? 520 : veste.style === "cintree" ? 450 : 476;
    const col = veste.col ?? "lapel";
    const depth = veste.boutons === 2 ? 300 : 324;
    const neck = neckFor(col === "rond" || col === "bateau" ? col : "lapel", depth);
    const lapels = col === "lapel" || col === "chale";
    const lapel =
      col === "chale"
        ? `M186 186 L201 ${depth} C186 ${depth - 40} 160 250 162 200 C166 190 176 186 186 186 Z`
        : `M186 186 L201 ${depth} C186 ${depth - 40} 166 262 156 228 L164 222 L158 210 L182 186 Z`;
    const buttons =
      veste.style === "croisee"
        ? [depth + 10, depth + 60].flatMap((y) => [
            { x: 184, y },
            { x: 216, y },
          ])
        : veste.boutons === 2
          ? [
              { x: 200, y: depth + 8 },
              { x: 200, y: depth + 60 },
            ]
          : [{ x: 200, y: depth + 10 }];
    const sleeve = veste.manches === "courtes" ? "courte-ajustee" : "longue";
    return (
      <g>
        <clipPath id={`wo-veste-clip-${uid}`}>
          <path d={clipOf(neck)} />
        </clipPath>
        <g clipPath={U("wo-veste-clip")}>{halves(vestOpen(len, veste.bas), fabric)}</g>
        {lapels &&
          [0, 1].map((k) => (
            <g key={k} transform={k ? MIRROR : undefined}>
              <path d={lapel} fill="#000" opacity={0.3} transform="translate(2 3)" filter={U("cv-blur")} />
              {shaded(lapel, fabric)}
            </g>
          ))}
        {[0, 1].map((k) => (
          <g key={k} transform={k ? MIRROR : undefined}>
            <path d={`M140 ${len - 50} L178 ${len - 50} L178 ${len - 38} L140 ${len - 38} Z`} fill={fabric} stroke={EDGE} strokeWidth={0.8} />
          </g>
        ))}
        {buttons.map((b) => (
          <circle key={`${b.x}-${b.y}`} cx={b.x} cy={b.y} r={4.6} fill={U("wo-btn")} stroke="rgba(0,0,0,0.5)" strokeWidth={0.6} />
        ))}
        {[0, 1].map((k) => (
          <g key={k} transform={k ? MIRROR : undefined}>
            <Sleeve slug={sleeve} fill={fabric} />
          </g>
        ))}
      </g>
    );
  })();

  const taille = plan.taille;
  const waistY = 360;
  /** La ceinture du bas : sous un haut porté dehors. */
  const tailleEl = (
    <>
        {taille === "haute" && <path d={`M150 ${waistY - 24} Q200 ${waistY - 18} 250 ${waistY - 24} L246 ${waistY + 4} Q200 ${waistY + 10} 154 ${waistY + 4} Z`} fill={bottomFill} stroke={EDGE} strokeWidth={0.9} />}
        {taille === "nouer" && (
          <g>
            <path d="M154 352 Q200 360 246 352 L246 368 Q200 376 154 368 Z" fill={bottomFill} stroke={EDGE} strokeWidth={0.9} />
            <path d="M210 360 C226 346 240 352 232 364 C240 376 226 382 210 368 M210 364 L218 420 M210 364 L228 414" stroke={EDGE} strokeWidth={6} fill="none" strokeLinecap="round" />
          </g>
        )}
        {(taille === "elastique" || taille === "cordon") && (
          <g>
            <path d="M156 352 Q200 360 244 352 L244 370 Q200 378 156 370 Z" fill={bottomFill} stroke={EDGE} strokeWidth={0.9} />
            <g stroke="rgba(0,0,0,0.35)" strokeWidth={0.8}>
              {[164, 176, 188, 200, 212, 224, 236].map((x) => (
                <path key={x} d={`M${x} 356 L${x} 370`} />
              ))}
            </g>
            {taille === "cordon" && <path d="M196 368 L190 410 M204 368 L210 412" stroke="#f4f4f6" strokeWidth={2.4} />}
          </g>
        )}
        {taille === "ceinture" && <path d="M156 352 Q200 360 244 352 L244 366 Q200 374 156 366 Z" fill={CHARCOAL} stroke={EDGE} strokeWidth={0.9} />}

    </>
  );
  const outerNeck = veste ? null : gilet ? null : topNeck;

  return (
    <svg
      viewBox="0 -40 400 1020"
      role="img"
      aria-label="Femme en tenue"
      className={cn("h-full w-auto", className)}
    >
      <UidCtx.Provider value={uid}>
        <defs>
          <CeremonyDefs uid={uid} />
          {fabricImage && (
            <pattern id={`wo-fab-${uid}`} patternUnits="userSpaceOnUse" width={200} height={200}>
              <rect width={200} height={200} fill={ROYAL} />
              <image href={fabricImage} width={200} height={200} preserveAspectRatio="xMidYMid slice" />
            </pattern>
          )}
          <pattern id={`wo-plain-${uid}`} patternUnits="userSpaceOnUse" width={6} height={6}>
            <rect width={6} height={6} fill={ROYAL} />
            <circle cx={3} cy={3} r={0.6} fill="rgba(255,255,255,0.08)" />
          </pattern>
          <radialGradient id={`wo-btn-${uid}`} cx="0.35" cy="0.35" r="0.8">
            <stop offset="0" stopColor="#e9d58c" />
            <stop offset="1" stopColor="#8a6a1f" />
          </radialGradient>
          <clipPath id={`wo-top-clip-${uid}`}>
            <path d={clipOf(topClip)} />
          </clipPath>
        </defs>

        <ellipse cx={200} cy={968} rx={130} ry={10} fill="#000" opacity={0.35} filter={U("cv-blur")} />

        {/* Jambes et chaussures */}
        {[0, 1].map((k) => (
          <g key={k} transform={k ? MIRROR : undefined}>
            <path d="M152 450 L196 450 L188 932 L172 932 Z" fill={U("cv-skin-arm")} />
            {plan.shoes === "baskets" ? (
              <path d="M160 928 L194 928 C198 944 198 958 190 966 L162 966 C156 958 156 940 160 928 Z" fill="#f4f4f6" stroke="rgba(0,0,0,0.4)" strokeWidth={0.8} />
            ) : (
              <path d="M166 926 L192 926 C196 940 194 954 188 962 L178 966 C170 964 166 950 166 926 Z" fill="#141418" stroke="rgba(0,0,0,0.6)" strokeWidth={0.7} />
            )}
          </g>
        ))}

        <path d={TORSO} fill={U("cv-torso")} />
        {[0, 1].map((k) => (
          <g key={k} transform={k ? MIRROR : undefined}>
            <Arm />
          </g>
        ))}

        {/* Du dessous au-dessus */}
        {tucked ? (
          <>
            {topEl}
            {bottomEl}
            {tailleEl}
          </>
        ) : (
          <>
            {bottomEl}
            {tailleEl}
            {topEl}
          </>
        )}

        {/* Poches du bas */}
        {plan.poches === "biais" || plan.poches === "italiennes" ? (
          <g stroke="rgba(0,0,0,0.5)" strokeWidth={1.2}>
            <path d="M152 380 L162 430" />
            <path d="M248 380 L238 430" />
          </g>
        ) : plan.poches === "plaquees" ? (
          [0, 1].map((k) => (
            <path key={k} d="M146 420 L182 420 L182 470 L146 470 Z" fill={bottomFill} stroke={EDGE} strokeWidth={0.9} transform={k ? MIRROR : undefined} />
          ))
        ) : null}

        {/* Manches du haut (sous la veste, s'il y en a une) */}
        {[0, 1].map((k) => (
          <g key={k} transform={k ? MIRROR : undefined}>
            <Sleeve slug={SLEEVES[plan.top.manches ?? "longues"] ?? "longue"} fill={topFill} />
          </g>
        ))}

        {giletEl}
        {vesteEl}

        {/* Broderie dorée */}
        {plan.embro.includes("encolure") && outerNeck && <GoldBand d={(outerNeck as { band?: string }).band ?? "M170 184 Q200 214 230 184"} w={8} />}
        {plan.embro.includes("encolure") && !outerNeck && <GoldBand d={`M186 188 L200 ${veste ? 300 : 290} L214 188`} w={7} />}
        {plan.embro.includes("plastron") && <GoldBand d="M200 230 L200 340" w={14} />}
        {plan.embro.includes("jupe-bas") && plan.bottom.kind === "jupe" && (
          <GoldBand d={`M${200 - 60 - (hem - 600) * 0.06} ${hem - 12} Q200 ${hem} ${260 + (hem - 600) * 0.06} ${hem - 12}`} w={10} />
        )}
        {(plan.embro.includes("jupe-ceinture") || plan.embro.includes("pantalon-taille")) && <GoldBand d="M158 362 Q200 370 242 362" w={9} />}
        {(plan.embro.includes("jupe-cote") || plan.embro.includes("pantalon-cotes")) && (
          <>
            <GoldBand d={`M150 380 L${plan.bottom.kind === "jupe" ? 140 : 140} ${hem - 20}`} w={7} />
            <g transform={MIRROR}>
              <GoldBand d={`M150 380 L140 ${hem - 20}`} w={7} />
            </g>
          </>
        )}
        {plan.embro.includes("pantalon-bas") &&
          [0, 1].map((k) => (
            <g key={k} transform={k ? MIRROR : undefined}>
              <GoldBand d={`M120 ${hem - 12} L194 ${hem - 12}`} w={8} />
            </g>
          ))}

        {/* Mains */}
        {[0, 1].map((k) => (
          <g key={k} transform={k ? MIRROR : undefined}>
            <Hand />
          </g>
        ))}

        <Head foulard={undefined} />
      </UidCtx.Provider>
    </svg>
  );
}
