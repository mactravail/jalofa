"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import {
  CeremonyDefs,
  GoldBand,
  UidCtx as CeremonyUidCtx,
} from "@/components/order/ceremony-avatar";
import {
  Button,
  EDGE,
  Hand,
  Head,
  MIRROR,
  Neck,
  SHIRT,
  SuitDefs,
  UidCtx as SuitUidCtx,
} from "@/components/order/suit-avatar";

/**
 * L'homme (ou le garçon) qui porte les tenues africaines du catalogue : grand
 * boubou, Baye Lahat, agbada, kaftans, dashiki, costume africain, veste, gilet,
 * chemise, pantalon, bazin, tenue de cérémonie, boubou et ensemble enfant.
 * Même rendu réaliste que le costume (`suit-avatar`) : une figure ombrée que
 * l'on habille couche par couche — pantalon, tunique, boubou ou gilet par-dessus,
 * col, poches, fermeture, broderie dorée, bonnet, écharpe — d'après les choix
 * de l'étape Style. Le tissu choisi habille la tenue.
 *
 * Repère (celui du costume) : viewBox 0 -50 400 1030, axe x=200. Épaules
 * y≈198, aisselles y≈300, taille y≈440, entrejambe y≈600, sol y≈966.
 */

/** Les clés de vêtement (garmentStyleKey) que cet avatar sait habiller. */
export const AFRICAN_MAN_KEYS = new Set([
  "grand-boubou",
  "baye-lahat",
  "agbada",
  "dashiki",
  "costume-africain",
  "costume",
  "kaftan",
  "kaftan-brode",
  "gilet",
  "chemise",
  "pantalon",
  "veste-africaine",
  "ensemble-bazin",
  "tenue-ceremonie",
  "boubou-enfant",
  "ensemble-enfant",
]);

const BASE = "#e8e2d4";
const NEUTRAL_TROUSERS = "#3a3d46";

// --- Géométrie --------------------------------------------------------------------

/** Bord extérieur du bras gauche à la hauteur y. */
const oX = (y: number) => (y <= 310 ? 86 - ((y - 198) * 18) / 112 : 68 + ((y - 310) * 6) / 256);

const ARM =
  "M88 198 C72 214 68 260 70 310 C72 390 72 480 76 572 L124 574 C126 480 127 390 126 320 C124 280 114 250 104 226 Z";

type ManNeck = { path: string; band: string; bottom: number };

const NECKS: Record<string, ManNeck> = {
  rond: { path: "L176 166 Q200 198 224 166", band: "M176 166 Q200 198 224 166", bottom: 182 },
  v: { path: "L178 166 L200 272 L222 166", band: "M178 166 L200 272 L222 166", bottom: 272 },
  "v-haut": { path: "L178 166 L200 262 L222 166", band: "M178 166 L200 262 L222 166", bottom: 262 },
  "v-profond": { path: "L178 166 L200 336 L222 166", band: "M178 166 L200 336 L222 166", bottom: 336 },
  fente: {
    path: "L176 166 Q188 188 196 190 L200 256 L204 190 Q212 188 224 166",
    band: "M176 166 Q188 188 196 190 L200 256 L204 190 Q212 188 224 166",
    bottom: 256,
  },
  carre: {
    path: "L174 166 L176 226 L224 226 L226 166",
    band: "M174 166 L176 226 L224 226 L226 166",
    bottom: 226,
  },
  haut: { path: "L180 166 L180 146 L220 146 L220 166", band: "M182 156 L218 156", bottom: 170 },
  chale: { path: "L172 166 L200 300 L228 166", band: "M172 166 L200 300 L228 166", bottom: 300 },
};

/** Le nom de l'encolure selon le choix « col » / « encolure ». */
function neckKey(slug: string | undefined): { neck: string; collar?: Collar } {
  switch (slug) {
    case "v":
    case "fente":
    case "carre":
    case "chale":
    case "v-haut":
    case "v-profond":
      return { neck: slug, collar: slug === "chale" ? "chale" : undefined };
    case "crante":
      return { neck: "v-profond", collar: "crante" };
    case "mao":
    case "mao-brode":
      return { neck: "haut", collar: "mao" };
    case "officier":
      return { neck: "haut", collar: "officier" };
    case "chemise":
      return { neck: "haut", collar: "chemise" };
    case "ronde":
    case "encolure-brodee":
    case "normal":
    case "rond":
    default:
      return { neck: "rond" };
  }
}

const clipOf = (n: ManNeck) => `M-50 1100 L-50 200 L40 200 ${n.path} L360 200 L450 200 L450 1100 Z`;

type Collar = "mao" | "officier" | "chemise" | "chale" | "crante";

// Demi-silhouettes : chemin ouvert du haut du milieu (x=201) au bas du milieu.

function tunicOpen(len: number, fit: string) {
  const wx = fit === "cintre" ? 140 : fit === "ample" ? 122 : 134;
  const hx = fit === "cintre" ? 136 : fit === "ample" ? 100 : 128;
  return (
    `M201 140 L176 166 L86 198 C102 240 122 284 128 300 C132 360 ${wx} 420 ${wx} 470 ` +
    `C${wx} 560 ${hx} ${Math.max(len - 120, 480)} ${hx} ${len} Q${(hx + 200) / 2} ${len + 4} 201 ${len + 4}`
  );
}

function boubouOpen(w: number, hem: number) {
  return (
    `M201 140 L176 166 C140 172 ${w + 40} 188 ${w + 14} 236 C${w} 300 ${w - 4} 420 ${w} 560 ` +
    `C${w + 6} 700 ${w + 24} 820 ${w + 36} ${hem} Q${(w + 236) / 2} ${hem + 10} 201 ${hem + 8}`
  );
}

function waistcoatOpen(bottom: number, bas: string | undefined) {
  const end =
    bas === "droit"
      ? `L201 ${bottom}`
      : bas === "arrondi"
        ? `Q186 ${bottom + 16} 201 ${bottom + 16}`
        : `L172 ${bottom + 8} L201 ${bottom + 30}`;
  return `M201 140 L178 166 L102 202 C112 240 124 280 128 304 C134 380 136 430 136 ${bottom} ${end}`;
}

function sleevePath(end: number, flare = 0) {
  const top = Math.min(end, 310);
  const drop = flare ? 10 : 0;
  const lower = end > 310 ? `L${oX(end) - flare} ${end + drop} ` : "";
  return (
    `M86 198 C70 214 66 260 ${oX(top)} ${top} ${lower}` +
    `L${128 + flare * 0.5} ${end + drop} L128 300 C126 280 116 250 104 226 C98 214 92 204 86 198 Z`
  );
}

const WIDE_SLEEVE =
  "M86 198 C64 220 50 320 38 520 Q80 540 132 520 L128 300 C126 280 116 250 104 226 C98 214 92 204 86 198 Z";

// --- Le plan d'une tenue --------------------------------------------------------------

type Layer = {
  /** Demi-silhouette ouverte (milieu → bord → milieu), ou fermée (`closed`). */
  open?: string;
  closed?: string;
  neck: string;
  collar?: Collar;
  sleeve?: { end: number; flare?: number; wide?: boolean; cuff?: "band" | "shirt" | "contrast" | "buttons" };
  white?: boolean;
  shade?: "body" | "wide";
  /** Couche du dessous : légèrement assombrie. */
  under?: boolean;
  hem: number;
};

type Plan = {
  layers: Layer[];
  trousers: { kind: string; fabric: boolean };
  shoes: "babouche" | "ville";
  /** Broderies dorées de la couche extérieure. */
  embro: string[];
  pockets: string[];
  closure?: { kind: string; from: number; to: number; count?: number; double?: boolean };
  decor?: string;
  bonnet?: boolean;
  echarpe?: boolean;
  child?: boolean;
  boubouWidth?: number;
};

function sleeveFor(slug: string | undefined): Layer["sleeve"] {
  switch (slug) {
    case "courtes":
      return { end: 336 };
    case "trois-quarts":
      return { end: 460 };
    case "amples":
    case "evasee":
      return { end: 520, wide: true };
    case "poignet":
      return { end: 566, cuff: "band" };
    case "boutons":
      return { end: 566, cuff: "buttons" };
    case "contraste":
      return { end: 566, cuff: "contrast" };
    case "chemise":
      return { end: 560, cuff: "shirt" };
    default:
      return { end: 566 };
  }
}

/** Les zones brodées selon le choix « broderie ». */
function embroFor(slug: string | undefined): string[] {
  switch (slug) {
    case undefined:
    case "sans":
    case "uni":
      return [];
    case "simple":
    case "encolure":
      return ["encolure"];
    case "riche":
      return ["encolure", "plastron", "hem"];
    case "doree":
    case "tout":
      return ["encolure", "plastron", "hem", "manches"];
    default:
      return [slug];
  }
}

function boubouWidth(coupe: string | undefined, manches: string | undefined) {
  let w = 24;
  if (manches === "tres-large" || manches === "cape") w = 6;
  if (manches === "ajustee") w = 58;
  if (coupe === "royal" || coupe === "ample") w -= 10;
  if (coupe === "moderne") w += 18;
  return w;
}

function boubouHem(coupe: string | undefined) {
  if (coupe === "court") return 700;
  if (coupe === "royal") return 924;
  if (coupe === "moderne") return 880;
  return 904;
}

function planFor(key: string, d: Record<string, string>): Plan {
  const plan: Plan = {
    layers: [],
    trousers: { kind: "droit", fabric: true },
    shoes: "babouche",
    embro: [],
    pockets: [],
  };
  const boubou = (coupe: string | undefined, col: string | undefined, manches?: string): Layer => {
    const w = boubouWidth(coupe, manches);
    plan.boubouWidth = w;
    const { neck, collar } = neckKey(col);
    return { open: boubouOpen(w, boubouHem(coupe)), neck, collar, shade: "wide", hem: boubouHem(coupe) };
  };
  const tunic = (len: number, fit: string, col: string | undefined, manches: string | undefined, under = false): Layer => {
    const { neck, collar } = neckKey(col);
    return { open: tunicOpen(len, fit), neck, collar, sleeve: sleeveFor(manches), under, hem: len };
  };

  switch (key) {
    case "grand-boubou": {
      const len = d.kaftan === "court" ? 620 : d.kaftan === "long" ? 900 : 760;
      plan.layers.push(tunic(len, "droit", d["kaftan-col"] === "chemise" ? "chemise" : d["kaftan-col"] === "mao" ? "mao" : "rond", d["kaftan-manches"] === "courtes" ? "courtes" : "longues", true));
      plan.layers.push(boubou(d.coupe, d.col, d.manches));
      plan.trousers.kind = d.pantalon === "droit" ? "droit" : d.pantalon === "thiaya-large" ? "thiaya-large" : "thiaya";
      plan.embro = embroFor(d.broderie === "doree" ? "doree" : d.broderie);
      if (d.col === "encolure-brodee" || d.col === "mao-brode") plan.embro.push("encolure");
      if (d.manches === "bord-brode") plan.embro.push("bord");
      plan.pockets = d.poches && d.poches !== "sans" ? [d.poches] : [];
      break;
    }
    case "baye-lahat": {
      if (d.coupe === "trois-pieces") plan.layers.push(tunic(760, "droit", "rond", "longues", true));
      plan.layers.push(boubou(d.coupe === "trois-pieces" ? "classique" : d.coupe, d.col));
      plan.trousers =
        d.pantalon === "sans"
          ? { kind: "droit", fabric: false }
          : { kind: d.pantalon === "droit" ? "droit" : d.pantalon === "thiaya-large" ? "thiaya-large" : "thiaya", fabric: true };
      plan.embro = embroFor(d.broderie);
      plan.pockets = d.poches && d.poches !== "sans" ? [d.poches] : [];
      plan.echarpe = d.echarpe === "avec";
      break;
    }
    case "agbada": {
      plan.layers.push(tunic(760, "droit", d.dessous === "mao" ? "mao" : "chemise", "longues", true));
      plan.layers.push(boubou(d.coupe, d.col));
      plan.trousers.kind = d.pantalon === "ajuste" ? "ajuste" : "droit";
      plan.embro = embroFor(d.broderie);
      plan.pockets = [`agbada-${d.poche ?? "carree"}`];
      plan.bonnet = d.bonnet !== "sans";
      break;
    }
    case "dashiki": {
      const len = d.coupe === "longue" ? 760 : 600;
      plan.layers.push(tunic(len, d.coupe === "ajustee" ? "cintre" : "ample", d.col ?? "v", d.manches ?? "courtes"));
      plan.trousers =
        d.pantalon === "sans" ? { kind: "droit", fabric: false } : { kind: d.pantalon === "saroual" ? "thiaya" : "droit", fabric: true };
      plan.embro = embroFor(d.broderie ?? "plastron");
      plan.pockets = d.poches && d.poches !== "sans" ? [d.poches] : [];
      break;
    }
    case "costume-africain":
    case "costume": {
      const len = d.coupe === "tunique" ? 760 : d.coupe === "longue" ? 920 : 600;
      plan.layers.push(tunic(len, "cintre", d.col ?? "mao", d.manches));
      plan.trousers.kind = d.pantalon === "ajuste" ? "ajuste" : "droit";
      plan.shoes = "ville";
      plan.closure = { kind: d.fermeture ?? "boutons", from: 182, to: len - 30 };
      plan.decor = d.decor;
      plan.pockets = d.poches && d.poches !== "sans" ? [d.poches] : [];
      break;
    }
    case "veste-africaine": {
      const len = d.coupe === "senghor" ? 640 : 600;
      plan.layers.push(tunic(len, "cintre", d.col ?? "mao", d.manches));
      plan.trousers.kind = "droit";
      plan.shoes = "ville";
      plan.closure = { kind: "boutons", from: NECKS[neckKey(d.col).neck].bottom + 12, to: len - 30 };
      plan.embro = embroFor(d.broderie);
      plan.pockets = ["poitrine"];
      break;
    }
    case "kaftan": {
      const len = d.coupe === "long" ? 930 : 880;
      plan.layers.push(tunic(len, d.coupe === "cintre" ? "cintre" : "droit", d.col, d.manches === "courtes" ? "courtes" : d.manches === "poignet" ? "poignet" : "longues"));
      plan.trousers.kind = d.pantalon === "saroual" ? "thiaya" : d.pantalon === "coulisse" ? "coulisse" : "droit";
      if (d.patte && d.patte !== "sans") {
        plan.closure = { kind: d.patte === "cachee" ? "cachee" : "patte", from: NECKS[neckKey(d.col).neck].bottom + 4, to: d.patte === "courte" ? 280 : 400 };
      }
      plan.embro = embroFor(d.broderie);
      plan.pockets = d.poche && d.poche !== "sans" ? [d.poche] : [];
      break;
    }
    case "kaftan-brode": {
      const len = d.coupe === "genou" ? 720 : d.coupe === "cuisse" ? 620 : 900;
      plan.layers.push(tunic(len, "droit", d["kaftan-col"], d["kaftan-manches"] === "poignet" ? "poignet" : "longues"));
      const neck = d.encolure === "v" ? "v" : "rond";
      const giletLen = Math.min(len + 20, 920);
      plan.layers.push(
        d.gilet === "ferme"
          ? { open: waistcoatOpen(giletLen, "droit"), neck, hem: giletLen }
          : {
              closed: `M178 166 L102 202 C112 240 124 280 128 304 C132 400 130 600 128 ${giletLen} L168 ${giletLen + 2} C168 600 170 420 182 ${neck === "v" ? 250 : 190} Z`,
              neck,
              hem: giletLen,
            },
      );
      if (d.gilet === "ferme") plan.closure = { kind: "boutons", from: 210, to: giletLen - 40 };
      plan.trousers.kind = d.pantalon === "saroual" ? "thiaya" : d.pantalon === "coulisse" ? "coulisse" : "droit";
      plan.embro =
        d.broderie === "tout"
          ? ["gilet-bord", "encolure", "plastron"]
          : d.broderie === "gilet"
            ? ["gilet-bord"]
            : d.broderie === "kaftan"
              ? ["plastron"]
              : [];
      plan.bonnet = d.bonnet === "avec";
      break;
    }
    case "gilet": {
      plan.layers.push({ open: tunicOpen(560, "droit"), neck: "haut", collar: "chemise", sleeve: { end: 566 }, white: true, hem: 560 });
      const bottom = d.coupe === "long" ? 600 : 500;
      const { neck, collar } = neckKey(d.col ?? "v-profond");
      plan.layers.push({ open: waistcoatOpen(bottom, d.bas), neck, collar, hem: bottom });
      plan.trousers = { kind: "droit", fabric: false };
      plan.shoes = "ville";
      const n = d.boutonnage === "3" ? 3 : d.boutonnage === "5" ? 5 : 4;
      plan.closure = {
        kind: d.boutonnage === "croise" ? "croise" : "boutons",
        from: NECKS[neck].bottom + 14,
        to: bottom - 14,
        count: n,
      };
      plan.pockets = d.poches && d.poches !== "sans" ? [`gilet-${d.poches}`] : [];
      break;
    }
    case "chemise": {
      const fit = d.coupe === "cintree" ? "cintre" : d.coupe === "dashiki" ? "ample" : "droit";
      plan.layers.push(tunic(600, fit, d.col, d.manches));
      plan.trousers = { kind: "droit", fabric: false };
      plan.embro = d.broderie === "riche" ? ["encolure", "plastron"] : embroFor(d.broderie);
      break;
    }
    case "pantalon": {
      plan.layers.push({ open: tunicOpen(560, "droit"), neck: "rond", sleeve: { end: 336 }, white: true, hem: 560 });
      plan.trousers.kind = d.coupe === "saroual" ? "thiaya" : d.coupe === "cintre" ? "ajuste" : "droit";
      if (d.broderie === "simple") plan.embro = ["pantalon"];
      break;
    }
    case "ensemble-bazin":
    case "tenue-ceremonie": {
      const coupe = d.coupe;
      if (coupe === "trois-pieces" || coupe === "boubou") {
        plan.layers.push(tunic(760, "droit", "rond", "longues", true));
        plan.layers.push(boubou("classique", d.col, d.manches === "amples" ? "evasee" : "ajustee"));
        plan.trousers.kind = "thiaya";
      } else if (coupe === "senghor") {
        plan.layers.push(tunic(760, "cintre", d.col ?? "mao", "longues"));
        plan.closure = { kind: "boutons", from: 182, to: 730 };
        plan.trousers.kind = "droit";
      } else {
        plan.layers.push(tunic(coupe === "ample" ? 880 : 860, coupe === "ample" ? "ample" : "droit", d.col, d.manches));
        plan.trousers.kind = "droit";
      }
      plan.embro = embroFor(d.broderie);
      break;
    }
    case "boubou-enfant": {
      plan.child = true;
      plan.layers.push(tunic(760, "droit", "rond", "longues", true));
      plan.layers.push({ ...boubou(d.coupe === "court" ? "court" : "classique", "rond", d.manches === "courtes" ? "ajustee" : "evasee") });
      plan.embro = embroFor(d.broderie);
      break;
    }
    case "ensemble-enfant":
    default: {
      plan.child = key === "ensemble-enfant";
      plan.layers.push(tunic(plan.child ? 700 : 760, d.coupe === "ample" ? "ample" : "droit", d.col, d.manches));
      plan.embro = embroFor(d.broderie);
      break;
    }
  }
  return plan;
}

// --- Rendu ---------------------------------------------------------------------------

function HalfShape({
  layer,
  fill,
  U,
}: {
  layer: Layer;
  fill: string;
  U: (n: string) => string;
}) {
  const shade = layer.shade === "wide" ? U("am-wide-shade") : U("sa-body-shade");
  const closedD = layer.closed ?? `${layer.open} Z`;
  const strokeD = layer.closed ?? layer.open!;
  return (
    <>
      {[0, 1].map((k) => (
        <g key={k} transform={k ? MIRROR : undefined}>
          <path d={closedD} fill={fill} />
          <path d={closedD} fill={shade} />
          {layer.under && <path d={closedD} fill="#000" opacity={0.18} />}
          <path d={strokeD} fill="none" stroke={EDGE} strokeWidth={1} />
        </g>
      ))}
    </>
  );
}

function CollarShape({ collar, fill }: { collar: Collar | undefined; fill: string }) {
  if (!collar) return null;
  const stand = "M180 168 C180 158 182 150 184 144 Q200 148 216 144 C218 150 220 158 220 168 Q200 174 180 168 Z";
  switch (collar) {
    case "mao":
      return <path d={stand} fill={fill} stroke={EDGE} strokeWidth={0.9} />;
    case "officier":
      return (
        <g fill={fill} stroke={EDGE} strokeWidth={0.9}>
          <path d="M180 168 C180 158 182 150 184 144 Q192 147 198 148 L198 172 Q188 172 180 168 Z" />
          <path d="M220 168 C220 158 218 150 216 144 Q208 147 202 148 L202 172 Q212 172 220 168 Z" />
        </g>
      );
    case "chemise":
      return (
        <g fill={fill} stroke={EDGE} strokeWidth={0.8}>
          <path d={stand} />
          <path d="M199 176 L183 158 L176 178 L185 202 Z" />
          <path d="M201 176 L217 158 L224 178 L215 202 Z" />
        </g>
      );
    case "chale":
      return (
        <g fill={fill} stroke={EDGE} strokeWidth={0.9}>
          <path d="M178 160 L200 300 L192 304 L162 182 C164 170 170 164 178 160 Z" />
          <path d="M222 160 L200 300 L208 304 L238 182 C236 170 230 164 222 160 Z" />
        </g>
      );
    case "crante":
      return (
        <g fill={fill} stroke={EDGE} strokeWidth={0.9}>
          <path d="M180 166 L200 336 L192 336 L164 214 L170 206 L162 196 L176 166 Z" />
          <path d="M220 166 L200 336 L208 336 L236 214 L230 206 L238 196 L224 166 Z" />
        </g>
      );
  }
}

function Trousers({ kind, fill, U }: { kind: string; fill: string; U: (n: string) => string }) {
  let leg: string;
  let cuff = false;
  switch (kind) {
    case "thiaya":
    case "thiaya-large": {
      const w = kind === "thiaya-large" ? 96 : 110;
      leg = `M${w} 480 L201 480 L201 720 C194 790 186 880 184 930 L150 930 C${w + 18} 880 ${w - 4} 700 ${w} 480 Z`;
      cuff = true;
      break;
    }
    case "coulisse":
      leg = "M124 480 L201 480 L201 600 C196 700 192 820 190 930 L140 930 C134 760 126 620 124 480 Z";
      cuff = true;
      break;
    case "ajuste":
      leg = "M128 480 L201 480 L201 600 C197 700 192 820 189 944 L150 944 C142 760 132 620 128 480 Z";
      break;
    default:
      leg = "M124 480 L201 480 L201 600 C196 700 192 820 190 944 L140 944 C132 760 126 620 124 480 Z";
  }
  return (
    <>
      {[0, 1].map((k) => (
        <g key={k} transform={k ? MIRROR : undefined}>
          <path d={leg} fill={fill} />
          <path d={leg} fill={U("sa-leg-shade")} />
          <path d={leg} fill="none" stroke={EDGE} strokeWidth={0.9} />
          {cuff && <path d="M148 918 L188 918 L186 934 L150 934 Z" fill={fill} stroke={EDGE} strokeWidth={0.8} />}
          {cuff && (
            <g stroke="rgba(0,0,0,0.3)" strokeWidth={1}>
              {[154, 162, 170, 178].map((x) => (
                <path key={x} d={`M${x} 904 L${x + 1} 918`} />
              ))}
            </g>
          )}
        </g>
      ))}
    </>
  );
}

function Shoes({ kind, U }: { kind: Plan["shoes"]; U: (n: string) => string }) {
  const d =
    kind === "babouche"
      ? "M140 942 C152 934 182 934 192 942 C198 952 194 962 184 966 L150 968 C134 968 126 958 140 942 Z"
      : "M136 940 C150 936 180 936 192 940 C197 950 195 961 187 965 C168 970 146 970 132 964 C126 957 128 946 136 940 Z";
  return (
    <>
      {[0, 1].map((k) => (
        <g key={k} transform={k ? MIRROR : undefined}>
          <path d={d} fill={kind === "babouche" ? U("am-babouche") : U("sa-shoe")} stroke="rgba(0,0,0,0.6)" strokeWidth={0.8} />
          <path d="M148 944 C160 940 176 940 186 944" stroke="rgba(255,255,255,0.25)" strokeWidth={1.4} fill="none" />
        </g>
      ))}
    </>
  );
}

function Sleeves({ layer, fill, U }: { layer: Layer; fill: string; U: (n: string) => string }) {
  const s = layer.sleeve;
  if (!s) return null;
  const d = s.wide ? WIDE_SLEEVE : sleevePath(s.end, 0);
  return (
    <>
      {[0, 1].map((k) => (
        <g key={k} transform={k ? MIRROR : undefined}>
          <path d={d} fill={fill} />
          <path d={d} fill={U("sa-sleeve-shade")} />
          {layer.under && <path d={d} fill="#000" opacity={0.18} />}
          <path d={d} fill="none" stroke={EDGE} strokeWidth={1} />
          <g stroke="rgba(0,0,0,0.3)" strokeWidth={2.2} fill="none" filter={U("sa-blur-s")}>
            {s.end > 400 && !s.wide && <path d="M76 400 C90 406 106 406 122 398" />}
          </g>
          {s.cuff === "band" && <path d={`M${oX(546)} 546 L128 546 L128 566 L${oX(566)} 566 Z`} fill={fill} stroke={EDGE} strokeWidth={0.9} />}
          {s.cuff === "contrast" && <path d={`M${oX(540)} 540 L128 540 L128 566 L${oX(566)} 566 Z`} fill="#15161b" stroke={EDGE} strokeWidth={0.9} />}
          {s.cuff === "shirt" && <path d="M74 560 L128 562 L127 574 L76 572 Z" fill={SHIRT} stroke="rgba(0,0,0,0.3)" strokeWidth={0.8} />}
          {s.cuff === "buttons" &&
            [534, 544, 554].map((y) => <circle key={y} cx={80} cy={y} r={2.4} fill={U("sa-horn")} />)}
        </g>
      ))}
    </>
  );
}

function star(cx: number, cy: number, r: number, n = 8) {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const rad = i % 2 ? r * 0.45 : r;
    const a = (Math.PI * i) / n - Math.PI / 2;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(" L")} Z`;
}

const PLASTRON = "M168 170 Q200 206 232 170 L250 230 C246 290 226 330 200 348 C174 330 154 290 150 230 Z";

function Pocket({ kind, embroidered, fill, U }: { kind: string; embroidered: boolean; fill: string; U: (n: string) => string }) {
  const outline = (d: string) => (
    <g>
      <path d={d} fill={fill} stroke={EDGE} strokeWidth={0.9} />
      <path d={d} fill="#000" opacity={0.08} />
      {embroidered && <path d={d} fill="none" stroke={U("cv-embro")} strokeWidth={4} />}
    </g>
  );
  switch (kind) {
    case "poitrine":
    case "poitrine-brodee":
    case "poche":
      return outline("M226 292 L262 292 L262 330 Q244 336 226 330 Z");
    case "passepoilee":
      return <rect x={226} y={300} width={36} height={5} rx={1} fill={fill} stroke={EDGE} strokeWidth={0.8} />;
    case "pochette":
      return (
        <g>
          <path d="M232 296 L252 292 L258 304 L238 306 Z" fill="#f2f2f4" stroke="rgba(0,0,0,0.3)" strokeWidth={0.6} />
          <rect x={226} y={304} width={36} height={5} rx={1} fill={fill} stroke={EDGE} strokeWidth={0.8} />
        </g>
      );
    case "devant":
      return outline("M206 360 L276 360 L276 440 Q241 452 206 440 Z");
    case "agbada-carree":
      return outline("M210 300 L290 300 L290 400 L210 400 Z");
    case "agbada-arrondie":
      return outline("M210 300 L290 300 L290 380 Q250 420 210 380 Z");
    case "agbada-pointe":
      return outline("M210 300 L290 300 L290 380 L250 420 L210 380 Z");
    case "rabat":
      return (
        <>
          {[0, 1].map((k) => (
            <g key={k} transform={k ? MIRROR : undefined}>
              <path d="M140 500 L186 500 L186 514 Q186 518 182 518 L144 518 Q140 518 140 514 Z" fill={fill} stroke={EDGE} strokeWidth={0.9} />
            </g>
          ))}
        </>
      );
    case "laterales":
    case "cotes":
      return (
        <g stroke="rgba(0,0,0,0.5)" strokeWidth={1.2}>
          <path d="M140 470 L146 530" />
          <path d="M260 470 L254 530" />
        </g>
      );
    case "gilet-deux":
    case "gilet-trois":
    case "gilet-rabat":
      return (
        <g>
          {[0, 1].map((k) => (
            <g key={k} transform={k ? MIRROR : undefined}>
              {kind === "gilet-rabat" ? (
                <path d="M144 440 L180 440 L180 452 L144 452 Z" fill={fill} stroke={EDGE} strokeWidth={0.8} />
              ) : (
                <rect x={144} y={444} width={36} height={4} fill={fill} stroke={EDGE} strokeWidth={0.8} />
              )}
            </g>
          ))}
          {kind === "gilet-trois" && <rect x={226} y={300} width={30} height={4} fill={fill} stroke={EDGE} strokeWidth={0.8} />}
        </g>
      );
    default:
      return null;
  }
}

export function AfricanManAvatar({
  garmentKey,
  details,
  fabricImage,
  className,
}: {
  /** La clé du vêtement (`garmentStyleKey`). */
  garmentKey: string;
  /** Les choix du configurateur (groupe → option). */
  details: Record<string, string>;
  /** La photo du tissu choisi : elle habille la tenue. */
  fabricImage?: string | null;
  className?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const U = (name: string) => `url(#${name}-${uid})`;
  const fill = fabricImage ? U("am-fab") : U("am-plain");
  const plan = planFor(garmentKey, details);
  const outer = plan.layers[plan.layers.length - 1];
  const outerNeck = NECKS[outer.neck] ?? NECKS.rond;
  const isBoubou = outer.shade === "wide";
  const w = plan.boubouWidth ?? 24;
  const trousersFill = plan.trousers.fabric ? fill : NEUTRAL_TROUSERS;

  const layerFill = (l: Layer) => (l.white ? SHIRT : fill);

  const figure = (
    <g>
      <ellipse cx={200} cy={966} rx={isBoubou ? 170 : 110} ry={9} fill="#000" opacity={0.35} filter={U("sa-blur")} />

      {/* Bras nus (visibles sous une manche courte) */}
      {[0, 1].map((k) => (
        <path key={k} d={ARM} fill={U("sa-skin-hand")} transform={k ? MIRROR : undefined} />
      ))}

      <Trousers kind={plan.trousers.kind} fill={trousersFill} U={U} />
      <Shoes kind={plan.shoes} U={U} />

      <Neck />
      <path d="M170 160 L230 160 L240 360 L160 360 Z" fill={U("sa-neck")} />

      {plan.layers.map((layer, i) => {
        const neck = NECKS[layer.neck] ?? NECKS.rond;
        const lf = layerFill(layer);
        const isOuter = i === plan.layers.length - 1;
        return (
          <g key={i}>
            {layer.sleeve && !isBoubou && <Sleeves layer={layer} fill={lf} U={U} />}
            {layer.sleeve && isBoubou && !isOuter && <Sleeves layer={layer} fill={lf} U={U} />}
            <g clipPath={U(`am-clip-${i}`)}>
              <HalfShape layer={layer} fill={lf} U={U} />
              {/* Plis du boubou */}
              {layer.shade === "wide" && (
                <g stroke="rgba(0,0,0,0.35)" strokeWidth={3} fill="none" filter={U("sa-blur")}>
                  <path d={`M${w + 6} 560 C${w + 40} 580 100 590 128 600`} />
                  <path d={`M${400 - w - 6} 560 C${360 - w} 580 300 590 272 600`} />
                  <path d={`M130 300 C120 500 110 700 ${w + 60} ${layer.hem - 10}`} />
                  <path d={`M270 300 C280 500 290 700 ${340 - w} ${layer.hem - 10}`} />
                  <path d="M170 360 C166 560 162 760 160 900" />
                  <path d="M230 360 C234 560 238 760 240 900" />
                </g>
              )}
              {isOuter && plan.decor === "matelasse" && (
                <path d={`${layer.open} Z`} fill={U("am-quilt")} />
              )}
              {isOuter && plan.decor === "matelasse" && (
                <path d={`${layer.open} Z`} fill={U("am-quilt")} transform={MIRROR} />
              )}
            </g>
            <CollarShape collar={layer.collar} fill={lf} />
            {/* Ombre portée sous la couche extérieure */}
            {isOuter && plan.layers.length > 1 && (
              <path d={neck.band} stroke="rgba(0,0,0,0.25)" strokeWidth={2} fill="none" />
            )}
          </g>
        );
      })}

      {/* Fermeture, décor et poches de la couche extérieure */}
      {plan.decor === "bandes" && (
        <g fill="#000" opacity={0.3}>
          <rect x={184} y={180} width={7} height={outer.hem - 186} />
          <rect x={209} y={180} width={7} height={outer.hem - 186} />
        </g>
      )}
      {plan.decor === "lisere" && (
        <g fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.4}>
          <path d={outerNeck.band} />
          <path d={`M200 ${outerNeck.bottom} L200 ${outer.hem}`} />
        </g>
      )}
      {plan.closure && <Closure c={plan.closure} U={U} />}
      {plan.pockets.map((p) => (
        <Pocket key={p} kind={p} embroidered={p.endsWith("brodee") || plan.embro.includes("poche")} fill={fill} U={U} />
      ))}

      {/* Broderie dorée */}
      <g clipPath={U(`am-clip-${plan.layers.length - 1}`)}>
        {plan.embro.includes("plastron") && (
          <g>
            <path d={PLASTRON} fill={U("cv-embro")} opacity={0.92} />
            <path d={PLASTRON} fill="none" stroke="#7a5a14" strokeWidth={2} />
          </g>
        )}
        {plan.embro.includes("segou") && (
          <g>
            <path d="M160 190 L240 190 L240 330 L160 330 Z" fill={U("cv-embro")} opacity={0.92} />
            <path d="M160 190 L240 190 L240 330 L160 330 Z M160 230 L180 210 L200 230 L220 210 L240 230 M160 290 L180 270 L200 290 L220 270 L240 290" fill="none" stroke="#7a5a14" strokeWidth={2} />
          </g>
        )}
        {plan.embro.includes("etoile") && (
          <path d={star(200, 296, 44)} fill={U("cv-embro")} stroke="#7a5a14" strokeWidth={2} />
        )}
      </g>
      {plan.embro.includes("encolure") && <GoldBand d={outerNeck.band} w={9} />}
      {plan.embro.includes("devant") && <GoldBand d={`M200 ${outerNeck.bottom + 4} L200 ${outer.hem - 10}`} w={14} />}
      {plan.embro.includes("chevrons") && (
        <g fill="none" stroke={GOLD_STROKE} strokeWidth={2.4}>
          {Array.from({ length: 8 }, (_, i) => outerNeck.bottom + 16 + i * 22).map((y) => (
            <path key={y} d={`M186 ${y} L200 ${y + 10} L214 ${y}`} />
          ))}
        </g>
      )}
      {plan.embro.includes("pointilles") && (
        <g fill={GOLD_STROKE}>
          {Array.from({ length: 14 }, (_, i) => outerNeck.bottom + 12 + i * 14).flatMap((y) => [
            <circle key={`l${y}`} cx={190} cy={y} r={1.8} />,
            <circle key={`r${y}`} cx={210} cy={y} r={1.8} />,
          ])}
        </g>
      )}
      {plan.embro.includes("hem") && (
        <GoldBand
          d={isBoubou ? `M${w + 40} ${outer.hem - 10} Q200 ${outer.hem + 2} ${360 - w} ${outer.hem - 10}` : `M134 ${outer.hem - 10} L266 ${outer.hem - 10}`}
          w={12}
        />
      )}
      {plan.embro.includes("bord") && (
        <>
          <GoldBand d={`M${w + 14} 236 C${w} 300 ${w - 4} 420 ${w} 560`} w={10} />
          <g transform={MIRROR}>
            <GoldBand d={`M${w + 14} 236 C${w} 300 ${w - 4} 420 ${w} 560`} w={10} />
          </g>
        </>
      )}
      {plan.embro.includes("manches") &&
        outer.sleeve &&
        !outer.sleeve.wide &&
        [0, 1].map((k) => (
          <g key={k} transform={k ? MIRROR : undefined}>
            <GoldBand d={`M${oX(outer.sleeve!.end - 8)} ${outer.sleeve!.end - 8} L126 ${outer.sleeve!.end - 8}`} w={8} />
          </g>
        ))}
      {plan.embro.includes("gilet-bord") &&
        [0, 1].map((k) => (
          <g key={k} transform={k ? MIRROR : undefined}>
            <GoldBand d={`M180 ${outerNeck.bottom} L168 ${outer.hem}`} w={9} />
          </g>
        ))}
      {plan.embro.includes("pantalon") &&
        [0, 1].map((k) => (
          <g key={k} transform={k ? MIRROR : undefined}>
            <GoldBand d="M142 930 L188 930" w={8} />
          </g>
        ))}

      {/* Mains */}
      <Hand />
      <g transform={MIRROR}>
        <Hand />
      </g>

      {/* Écharpe du Baye Lahat */}
      {plan.echarpe &&
        [0, 1].map((k) => (
          <g key={k} transform={k ? MIRROR : undefined}>
            <path d="M184 150 C172 200 166 400 164 700 L192 700 C192 420 194 240 200 170 Z" fill="#f4f1ea" stroke="rgba(0,0,0,0.35)" strokeWidth={0.8} />
            <path d="M166 690 L192 690" stroke={GOLD_STROKE} strokeWidth={3} />
          </g>
        ))}

      <Head beard={!plan.child} />

      {/* Bonnet (fila) */}
      {plan.bonnet && (
        <g>
          <path d="M156 46 C154 10 176 -8 200 -8 C224 -8 246 10 244 46 C226 38 174 38 156 46 Z" fill={fill} stroke={EDGE} strokeWidth={1} />
          <path d="M156 46 C154 10 176 -8 200 -8 C224 -8 246 10 244 46 C226 38 174 38 156 46 Z" fill={U("sa-body-shade")} />
          <GoldBand d="M158 40 C178 34 222 34 242 40" w={6} />
        </g>
      )}
    </g>
  );

  return (
    <svg
      viewBox="0 -50 400 1030"
      role="img"
      aria-label={plan.child ? "Enfant en tenue africaine" : "Homme en tenue africaine"}
      className={cn("h-full w-auto", className)}
    >
      <SuitUidCtx.Provider value={uid}>
        <CeremonyUidCtx.Provider value={uid}>
          <defs>
            <SuitDefs uid={uid} />
            <CeremonyDefs uid={uid} />
            {fabricImage && (
              <pattern id={`am-fab-${uid}`} patternUnits="userSpaceOnUse" width={200} height={200}>
                <rect width={200} height={200} fill={BASE} />
                <image href={fabricImage} width={200} height={200} preserveAspectRatio="xMidYMid slice" />
              </pattern>
            )}
            {/* Bazin uni : léger damassé */}
            <pattern id={`am-plain-${uid}`} patternUnits="userSpaceOnUse" width={14} height={14}>
              <rect width={14} height={14} fill={BASE} />
              <path d="M0 7 Q3.5 3 7 7 T14 7" stroke="rgba(255,255,255,0.35)" strokeWidth={0.8} fill="none" />
            </pattern>
            <pattern id={`am-quilt-${uid}`} patternUnits="userSpaceOnUse" width={16} height={16}>
              <path d="M0 8 L8 0 L16 8 L8 16 Z" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth={0.8} />
            </pattern>
            <linearGradient id={`am-wide-shade-${uid}`} gradientUnits="userSpaceOnUse" x1={0} x2={400} y1={0} y2={0}>
              <stop offset="0" stopColor="#000" stopOpacity={0.5} />
              <stop offset="0.3" stopColor="#000" stopOpacity={0.06} />
              <stop offset="0.5" stopColor="#fff" stopOpacity={0.08} />
              <stop offset="0.7" stopColor="#000" stopOpacity={0.06} />
              <stop offset="1" stopColor="#000" stopOpacity={0.5} />
            </linearGradient>
            <linearGradient id={`am-babouche-${uid}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#d8b25e" />
              <stop offset="1" stopColor="#8f6a24" />
            </linearGradient>
            {plan.layers.map((l, i) => (
              <clipPath key={i} id={`am-clip-${i}-${uid}`}>
                <path d={clipOf(NECKS[l.neck] ?? NECKS.rond)} />
              </clipPath>
            ))}
          </defs>
          {plan.child ? <g transform="translate(70 300) scale(0.66)">{figure}</g> : figure}
        </CeremonyUidCtx.Provider>
      </SuitUidCtx.Provider>
    </svg>
  );
}

const GOLD_STROKE = "#d4af37";

function Closure({ c, U }: { c: NonNullable<Plan["closure"]>; U: (n: string) => string }) {
  const n = c.count ?? Math.max(2, Math.round((c.to - c.from) / 60));
  const ys = Array.from({ length: n }, (_, i) => c.from + ((c.to - c.from) * i) / Math.max(n - 1, 1));
  switch (c.kind) {
    case "cachee":
      return <path d={`M202 ${c.from} L202 ${c.to}`} stroke="rgba(0,0,0,0.45)" strokeWidth={1.2} />;
    case "biais":
      return (
        <g>
          <path d={`M214 170 C232 220 246 270 252 ${c.to}`} stroke="rgba(0,0,0,0.5)" strokeWidth={1.4} fill="none" />
          {[200, 250, 300, 360].map((y) => (
            <Button key={y} x={222 + (y - 200) * 0.2} y={y} r={4.5} />
          ))}
        </g>
      );
    case "demi":
      return (
        <g>
          <path d={`M195 ${c.from} L195 330 L205 330 L205 ${c.from}`} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={1} />
          {[c.from + 20, c.from + 70, c.from + 120].map((y) => (
            <Button key={y} x={200} y={y} r={4.2} />
          ))}
        </g>
      );
    case "patte":
      return (
        <g>
          <path d={`M195 ${c.from} L195 ${c.to} L205 ${c.to} L205 ${c.from}`} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={1} />
          {ys.map((y) => (
            <circle key={y} cx={200} cy={y + 8} r={2.6} fill={U("sa-horn")} />
          ))}
        </g>
      );
    case "croise":
      return (
        <g>
          {[0, 1, 2].flatMap((i) => {
            const y = c.from + 10 + i * ((c.to - c.from - 10) / 2.5);
            return [<Button key={`l${i}`} x={186} y={y} r={4.2} />, <Button key={`r${i}`} x={214} y={y} r={4.2} />];
          })}
        </g>
      );
    default:
      return (
        <g>
          {ys.map((y) => (
            <Button key={y} x={200} y={y} r={4.5} />
          ))}
        </g>
      );
  }
}
