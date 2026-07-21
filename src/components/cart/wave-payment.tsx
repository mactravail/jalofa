"use client";

import { useMemo } from "react";
import { ScanLine } from "lucide-react";

import { formatPrice } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Couleur de marque Wave (bleu cyan).
const WAVE_BLUE = "#1DC4FF";

// ---------------------------------------------------------------------------
// Logo Wave
// ---------------------------------------------------------------------------

export function WaveMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="Wave"
    >
      <rect width="40" height="40" rx="9" fill={WAVE_BLUE} />
      <path
        d="M8 19 Q14 11 20 19 T32 19"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M8 26 Q14 18 20 26 T32 26"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// QR code
// ---------------------------------------------------------------------------

// Générateur déterministe : le même montant produit toujours le même visuel.
// La passerelle de paiement étant simulée pour le MVP, ce QR est illustratif.
function buildQrMatrix(seed: number, size: number): boolean[][] {
  const m = Array.from({ length: size }, () => Array<boolean>(size).fill(false));

  // PRNG mulberry32 — pseudo-aléatoire stable à partir d'une graine.
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const finderZones = [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ];

  const inFinder = (r: number, c: number) =>
    finderZones.some(
      ([zr, zc]) => r >= zr - 1 && r <= zr + 7 && c >= zc - 1 && c <= zc + 7,
    );

  const drawFinder = (zr: number, zc: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const border = r === 0 || r === 6 || c === 0 || c === 6;
        const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        m[zr + r][zc + c] = border || core;
      }
    }
  };

  finderZones.forEach(([zr, zc]) => drawFinder(zr, zc));

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (inFinder(r, c)) continue;
      m[r][c] = rand() > 0.52;
    }
  }

  return m;
}

function QrCode({ seed, className }: { seed: number; className?: string }) {
  const size = 25;
  const matrix = useMemo(() => buildQrMatrix(seed, size), [seed]);

  return (
    <svg
      viewBox={`-2 -2 ${size + 4} ${size + 4}`}
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label="QR code de paiement Wave"
    >
      <rect x={-2} y={-2} width={size + 4} height={size + 4} fill="#fff" />
      {matrix.flatMap((row, r) =>
        row.map((on, c) =>
          on ? (
            <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#0B1220" />
          ) : null,
        ),
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Panneau de paiement Wave
// ---------------------------------------------------------------------------

export function WaveQrPayment({ total }: { total: number }) {
  return (
    <div className="bg-muted/30 mt-3 rounded-xl border p-4">
      <div className="flex items-center gap-2">
        <WaveMark className="size-6" />
        <p className="text-sm font-medium">Payer avec Wave</p>
      </div>

      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5">
        <div className="rounded-xl border bg-white p-3 shadow-sm">
          <QrCode seed={Math.round(total)} className="size-40" />
        </div>

        <div className="text-center sm:text-left">
          <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs sm:justify-start">
            <ScanLine className="size-3.5" />
            Scannez pour payer
          </p>
          <p className="mt-1 text-sm">
            Ouvrez l&apos;application{" "}
            <span className="font-semibold" style={{ color: WAVE_BLUE }}>
              Wave
            </span>{" "}
            et scannez ce code pour régler
          </p>
          <p className="mt-1 text-2xl font-bold" style={{ color: WAVE_BLUE }}>
            {formatPrice(total)}
          </p>

          <ol className="text-muted-foreground mt-3 list-inside list-decimal space-y-1 text-xs">
            <li>Ouvrez Wave et appuyez sur « Payer ».</li>
            <li>Scannez ce QR code.</li>
            <li>Validez le montant pour confirmer.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
