import { cn } from "@/lib/utils";

/**
 * Badges des moyens de paiement acceptés (Orange Money, Wave, Free Money,
 * Visa, Mastercard). SVG inline : aucun fichier image, net à toute taille.
 */

type Logo = { name: string; svg: React.ReactNode };

const FONT = "Arial, Helvetica, sans-serif";

const LOGOS: Logo[] = [
  {
    name: "Orange Money",
    svg: (
      <svg viewBox="0 0 48 30" aria-hidden="true" className="h-full w-full">
        <rect width="48" height="30" rx="4" fill="#FF7900" />
        <rect x="5" y="5" width="8" height="8" fill="#fff" />
        <text x="5" y="20.5" fill="#fff" fontFamily={FONT} fontSize="6.4" fontWeight="700">
          orange
        </text>
        <text x="5" y="26.5" fill="#000" fontFamily={FONT} fontSize="5.6" fontWeight="700">
          money
        </text>
      </svg>
    ),
  },
  {
    name: "Wave",
    svg: (
      <svg viewBox="0 0 48 30" aria-hidden="true" className="h-full w-full">
        <rect width="48" height="30" rx="4" fill="#1DC8F2" />
        <text
          x="24"
          y="19.5"
          textAnchor="middle"
          fill="#fff"
          fontFamily={FONT}
          fontSize="12"
          fontWeight="800"
        >
          wave
        </text>
      </svg>
    ),
  },
  {
    name: "Free Money",
    svg: (
      <svg viewBox="0 0 48 30" aria-hidden="true" className="h-full w-full">
        <rect width="48" height="30" rx="4" fill="#CD1E25" />
        <text
          x="24"
          y="15"
          textAnchor="middle"
          fill="#fff"
          fontFamily={FONT}
          fontSize="9.5"
          fontWeight="800"
          fontStyle="italic"
        >
          free
        </text>
        <text
          x="24"
          y="23.5"
          textAnchor="middle"
          fill="#fff"
          fontFamily={FONT}
          fontSize="6"
          fontWeight="700"
        >
          money
        </text>
      </svg>
    ),
  },
  {
    name: "Visa",
    svg: (
      <svg viewBox="0 0 48 30" aria-hidden="true" className="h-full w-full">
        <rect width="48" height="30" rx="4" fill="#fff" />
        <text
          x="24"
          y="19.5"
          textAnchor="middle"
          fill="#1A1F71"
          fontFamily={FONT}
          fontSize="12.5"
          fontWeight="900"
          fontStyle="italic"
        >
          VISA
        </text>
      </svg>
    ),
  },
  {
    name: "Mastercard",
    svg: (
      <svg viewBox="0 0 48 30" aria-hidden="true" className="h-full w-full">
        <rect width="48" height="30" rx="4" fill="#fff" />
        <circle cx="19" cy="15" r="8.5" fill="#EB001B" />
        <circle cx="29" cy="15" r="8.5" fill="#F79E1B" />
        <path d="M24 8.1a8.5 8.5 0 0 1 0 13.8a8.5 8.5 0 0 1 0-13.8z" fill="#FF5F00" />
      </svg>
    ),
  },
];

export function PaymentLogos({ className }: { className?: string }) {
  return (
    <ul
      aria-label="Moyens de paiement acceptés"
      className={cn("flex flex-wrap items-center justify-center gap-2", className)}
    >
      {LOGOS.map((logo) => (
        <li
          key={logo.name}
          title={logo.name}
          className="h-7 w-11 overflow-hidden rounded-[4px] ring-1 ring-white/10"
        >
          <span className="sr-only">{logo.name}</span>
          {logo.svg}
        </li>
      ))}
    </ul>
  );
}
