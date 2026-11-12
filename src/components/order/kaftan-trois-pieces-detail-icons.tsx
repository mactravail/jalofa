// Planches du KAFTAN 3 PIÈCES (slug `kaftan-brode`) — le kaftan à manches
// longues, son pantalon, et par-dessus la troisième pièce : un long gilet SANS
// MANCHES, porté ouvert (ni bouton ni fermeture) ou fermé devant.
//
// Ici : l'ensemble entier (coupe, broderie) et le gilet dessiné seul (ouvert
// ou fermé, encolure). Le col, les manches et le pantalon du kaftan
// réutilisent les planches du kaftan 2 pièces (`kf-*`).

import type { ReactNode } from "react";
import { Embroidery, Mirror, Seam } from "@/components/order/baye-lahat-detail-icons";

type IconDef = { viewBox: string; body: ReactNode };

function mirrored(half: ReactNode): ReactNode {
  return (
    <>
      {half}
      <Mirror>{half}</Mirror>
    </>
  );
}

type Length = "genou" | "cuisse" | "cheville";
type Front = "ouvert" | "ferme";
type Neck = "ronde" | "v";
type Brod = "sans" | "gilet" | "kaftan" | "tout";

/** Le bas du gilet, et son coin (il s'évase un peu). */
const LENGTHS: Record<Length, { hem: number; hemX: number }> = {
  cuisse: { hem: 56, hemX: 18.2 },
  genou: { hem: 66, hemX: 17.4 },
  cheville: { hem: 80, hemX: 16.2 },
};

/**
 * Moitié gauche du gilet sans manches : épaule, emmanchure, côté, bas, puis
 * l'encolure et le bord du devant.
 */
function vestHalf(length: Length, front: Front, neck: Neck, brod: Brod): ReactNode {
  const { hem, hemX } = LENGTHS[length];
  // le bord du devant : il s'arrête avant le milieu quand le gilet est ouvert
  const edgeX = front === "ouvert" ? 28.6 : 32;
  const neckline =
    neck === "ronde"
      ? front === "ouvert"
        ? "M26.4 5.2Q27.2 11 29.4 12.4"
        : "M26.4 5.2Q27.4 11.6 32 12"
      : front === "ouvert"
        ? "M26.4 5.2 29.2 18"
        : "M26.4 5.2 32 24";
  const neckEnd = neck === "ronde" ? (front === "ouvert" ? [29.4, 12.4] : [32, 12]) : front === "ouvert" ? [29.2, 18] : [32, 24];
  const embroidered = brod === "gilet" || brod === "tout";
  return (
    <>
      <path d={`M26.4 5.2 19.4 7.6Q21.6 14 20.6 22L${hemX} ${hem}H${edgeX}`} />
      <path d={neckline} />
      {front === "ouvert" && <path d={`M${neckEnd[0]} ${neckEnd[1]}L${edgeX} ${hem}`} />}
      {embroidered && (
        <>
          {front === "ouvert" && <Embroidery d={`M${neckEnd[0] - 1.4} ${neckEnd[1] + 1}L${edgeX - 1.4} ${hem - 1.4}`} />}
          <Embroidery d={`M${hemX + 1.2} ${hem - 1.6}H${edgeX - 1.4}`} />
        </>
      )}
    </>
  );
}

/** Le gilet seul (sans le kaftan dessous). */
function vest(front: Front, neck: Neck): ReactNode {
  return (
    <>
      {mirrored(vestHalf("genou", front, neck, "sans"))}
      {/* le haut du dos, qui relie les deux pans */}
      <Seam>
        <path d="M26.4 5.2Q32 7.6 37.6 5.2" />
      </Seam>
      {front === "ferme" && (
        <>
          <path d={`M32 ${neck === "ronde" ? 12 : 24}V66`} />
          {(neck === "ronde" ? [17, 27, 37, 47] : [28, 36, 44, 52]).map((y) => (
            <circle key={y} cx={32} cy={y} r={0.9} />
          ))}
        </>
      )}
    </>
  );
}

/** L'ensemble : le kaftan à manches longues, le gilet ouvert par-dessus, le pantalon. */
function ensemble(length: Length, brod: Brod = "sans"): ReactNode {
  const { hem } = LENGTHS[length];
  // le kaftan s'arrête au-dessus du bas du gilet
  const kHem = Math.min(56, hem - 4);
  const kaftanBrode = brod === "kaftan" || brod === "tout";
  const pantsTop = hem + 0.6;
  return (
    <>
      {mirrored(
        <>
          {/* la manche du kaftan, qui sort de l'emmanchure du gilet */}
          <path d="M19.4 7.6C16.4 12 14 30 12.6 50L17.4 51C18.4 40 19.6 30 20.6 22" />
          <Seam>
            <path d="M12.9 47.4 17.6 48.4" />
          </Seam>
          {/* le col rond du kaftan, et son bas qu'on voit entre les pans */}
          <path d="M27.2 6Q28 10.4 32 10.8" />
          <path d={`M28.7 ${kHem}Q30.4 ${kHem + 0.6} 32 ${kHem + 0.8}`} />
          {kaftanBrode && <Embroidery d="M28.8 11.6Q30.2 12.6 32 12.8" />}
          {/* le pantalon, sous le gilet */}
          {pantsTop < 84 && (
            <>
              <path d={`M20.2 ${pantsTop}L19.8 86H29.6L30.6 ${Math.max(kHem + 3, 60)}`} />
              <Seam>
                <path d={`M25 ${pantsTop + 1}V85.4`} />
              </Seam>
            </>
          )}
          {vestHalf(length, "ouvert", "ronde", brod)}
        </>,
      )}
      {/* l'entrejambe, visible entre les pans */}
      {hem > 60 && <path d={`M30.6 ${Math.max(kHem + 3, 60)}Q31.6 ${kHem + 1.8} 32 ${kHem + 1.6}`} />}
      {/* la petite patte boutonnée du kaftan */}
      <path d="M30.6 10.8V20H33.4V10.8" />
      <circle cx={32} cy={13.6} r={0.6} />
      <circle cx={32} cy={17.4} r={0.6} />
      {kaftanBrode && (
        <>
          <Embroidery d="M29.8 12V24" />
          <Embroidery d="M34.2 12V24" />
        </>
      )}
    </>
  );
}

const BOX = "0 0 64 88";
/** Le gilet seul, en portrait. */
const VEST_BOX = "4 0 56 72";

const ICONS = {
  // === Coupe : la longueur du gilet ===========================================
  "k3-coupe-cuisse": { viewBox: BOX, body: ensemble("cuisse") },
  "k3-coupe-genou": { viewBox: BOX, body: ensemble("genou") },
  "k3-coupe-cheville": { viewBox: BOX, body: ensemble("cheville") },

  // === Le gilet : ouvert ou fermé =============================================
  "k3-gilet-ouvert": { viewBox: VEST_BOX, body: vest("ouvert", "ronde") },
  "k3-gilet-ferme": { viewBox: VEST_BOX, body: vest("ferme", "ronde") },

  // === Encolure du gilet ======================================================
  "k3-encolure-ronde": { viewBox: VEST_BOX, body: vest("ouvert", "ronde") },
  "k3-encolure-v": { viewBox: VEST_BOX, body: vest("ouvert", "v") },

  // === Broderie (sur l'ensemble) ==============================================
  "k3-brod-sans": { viewBox: BOX, body: ensemble("genou", "sans") },
  "k3-brod-gilet": { viewBox: BOX, body: ensemble("genou", "gilet") },
  "k3-brod-kaftan": { viewBox: BOX, body: ensemble("genou", "kaftan") },
  "k3-brod-tout": { viewBox: BOX, body: ensemble("genou", "tout") },
} satisfies Record<string, IconDef>;

export type KaftanTroisPiecesDetailIconName = keyof typeof ICONS;

export function isKaftanTroisPiecesArt(name: string): name is KaftanTroisPiecesDetailIconName {
  return name in ICONS;
}

/** Tout est en portrait : l'ensemble et le gilet seul. */
export function kaftanTroisPiecesArtIsTall(): boolean {
  return true;
}

export function KaftanTroisPiecesDetailIcon({
  name,
  className,
}: {
  name: KaftanTroisPiecesDetailIconName;
  className?: string;
}) {
  const icon: IconDef = ICONS[name];
  return (
    <svg
      viewBox={icon.viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icon.body}
    </svg>
  );
}
