"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  BadgeCheck,
  Camera,
  ChevronLeft,
  ChevronRight,
  MessageSquarePlus,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { ReviewStars } from "@/components/catalog/review-stars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  REVIEW_SUBJECT_LABELS,
  type GarmentReview,
  type GarmentReviewSubject,
  type GarmentSocialProof,
} from "@/lib/garment-social-proof";
import { cn } from "@/lib/utils";

/**
 * « Avis clients » d'une fiche vêtement : la note moyenne et sa répartition, les
 * avis illustrés par la photo de leur auteur, et le formulaire pour en déposer
 * un — un avis peut porter sur la pièce OU sur le tailleur qui l'a cousue,
 * c'est le filtre en tête de liste.
 *
 * Les avis déposés ici restent sur l'appareil (`localStorage`) : le schéma ne
 * rattache un avis qu'à une commande livrée chez un tailleur, pas encore à un
 * modèle (cf. `garment-social-proof.ts`). Le jour où la table existe, seuls le
 * chargement et `publish()` changent — la mise en page ne bouge pas.
 */

const STORAGE_PREFIX = "jalofa:avis-vetement:";

/** Côté du carré conservé pour la photo du client, en pixels. */
const PHOTO_SIZE = 256;

/** Écart entre deux cartes du carrousel (gap-4), en pixels. */
const CARD_GAP = 16;

const FILTERS: { value: "all" | GarmentReviewSubject; label: string }[] = [
  { value: "all", label: "Tous les avis" },
  { value: "garment", label: REVIEW_SUBJECT_LABELS.garment },
  { value: "tailor", label: REVIEW_SUBJECT_LABELS.tailor },
];

/** Recadre la photo en carré et la réduit : elle doit tenir dans localStorage. */
async function toSquareDataUrl(file: File): Promise<string | null> {
  try {
    // `from-image` pour qu'une photo prise au téléphone ne parte pas de côté.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = PHOTO_SIZE;
    canvas.height = PHOTO_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // Recadrage centré en largeur mais pris en haut : sur un portrait, c'est là
    // qu'est le visage.
    ctx.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      0,
      side,
      side,
      0,
      0,
      PHOTO_SIZE,
      PHOTO_SIZE,
    );
    bitmap.close();
    return canvas.toDataURL("image/webp", 0.8);
  } catch {
    return null;
  }
}

function monthNow(): string {
  return new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

/** Identifiant d'un avis déposé sur cet appareil — jamais celui d'un avis public. */
function newReviewId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `own-${crypto.randomUUID()}`;
  }
  return `own-${Date.now().toString(36)}`;
}

// --- Les avis déposés sur cet appareil, vus comme un magasin externe ---------
// `useSyncExternalStore` plutôt qu'un effet de synchronisation : le rendu
// serveur ne connaît pas localStorage (instantané vide), le client le lit après
// hydratation, et publier un avis prévient toutes les fiches ouvertes. Les
// instantanés sont mis en cache par clé, sinon React relancerait le rendu à
// l'infini (un `JSON.parse` rend un objet neuf à chaque appel).

const EMPTY: GarmentReview[] = [];
const snapshots = new Map<string, GarmentReview[]>();
const listeners = new Set<() => void>();

function ownSnapshot(key: string): GarmentReview[] {
  const cached = snapshots.get(key);
  if (cached) return cached;
  let stored = EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw) stored = JSON.parse(raw) as GarmentReview[];
  } catch {
    // Stockage indisponible (navigation privée) : seuls les avis publics restent.
  }
  snapshots.set(key, stored);
  return stored;
}

function subscribeOwn(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function saveOwn(key: string, reviews: GarmentReview[]): void {
  snapshots.set(key, reviews);
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(reviews));
  } catch {
    // Quota plein ou stockage refusé : l'avis reste affiché pour cette visite.
  }
  for (const notify of listeners) notify();
}

export function GarmentReviews({
  proof,
  garmentName,
  storageKey,
  tailors,
}: {
  proof: GarmentSocialProof;
  garmentName: string;
  /** Identifiant stable du modèle (son slug) — clé des avis déposés ici. */
  storageKey: string;
  /** Ateliers qui cousent ce vêtement : l'auteur d'un avis « tailleur » en désigne un. */
  tailors: { id: string; shop_name: string | null }[];
}) {
  const own = useSyncExternalStore(
    subscribeOwn,
    () => ownSnapshot(storageKey),
    () => EMPTY,
  );
  const [filter, setFilter] = useState<"all" | GarmentReviewSubject>("all");
  const [formOpen, setFormOpen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const all = useMemo(() => [...own, ...proof.reviews], [own, proof.reviews]);
  const shown = filter === "all" ? all : all.filter((r) => r.subject === filter);

  // La moyenne et la répartition intègrent les avis déposés ici : afficher une
  // note qui ignore l'avis qu'on vient de publier serait incompréhensible.
  const reviewCount = proof.reviewCount + own.length;
  const rating =
    (proof.rating * proof.reviewCount + own.reduce((sum, r) => sum + r.rating, 0)) /
    Math.max(reviewCount, 1);
  const distribution = proof.distribution.map((d) => ({
    ...d,
    count: d.count + own.filter((r) => r.rating === d.stars).length,
  }));
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  function publish(review: GarmentReview) {
    saveOwn(storageKey, [review, ...own]);
    setFormOpen(false);
    setFilter("all");
    trackRef.current?.scrollTo({ left: 0, behavior: "smooth" });
    toast.success("Merci ! Votre avis est publié.");
  }

  /** Défile d'une carte : la piste native garde le swipe, les flèches la pilotent. */
  function step(dir: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild as HTMLElement | null;
    const width = card ? card.clientWidth + CARD_GAP : track.clientWidth * 0.85;
    track.scrollBy({ left: dir * width, behavior: "smooth" });
  }

  /** Les flèches s'éteignent en bout de piste, comme sur les rails de l'accueil. */
  function syncArrows(track: HTMLDivElement) {
    setCanPrev(track.scrollLeft > 8);
    setCanNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 8);
  }

  return (
    <section id="avis" className="scroll-mt-24">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h2 className="font-serif text-2xl tracking-tight">Avis clients</h2>
          <p className="text-muted-foreground mt-1 text-sm text-pretty">
            Ce qu&apos;en disent celles et ceux qui ont reçu leur {garmentName} — la
            pièce comme le tailleur.
          </p>
        </div>
        <Button
          variant={formOpen ? "secondary" : "outline"}
          onClick={() => setFormOpen((o) => !o)}
          className="w-full sm:w-auto"
        >
          <MessageSquarePlus className="size-4" />
          {formOpen ? "Fermer" : "Donner mon avis"}
        </Button>
      </div>

      {formOpen && (
        <ReviewForm
          garmentName={garmentName}
          tailors={tailors}
          onPublish={publish}
          onCancel={() => setFormOpen(false)}
        />
      )}

      {/* Moyenne + répartition, sur toute la largeur : la répartition dit si un
          4,6 vient de tout le monde ou de deux extrêmes. Sur mobile la note
          passe en ligne, les barres dessous — rien ne déborde. */}
      <div className="mt-8 grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-10">
        <div className="flex items-center gap-4">
          <p className="flex items-end text-5xl font-semibold leading-none tracking-tighter sm:text-6xl">
            {rating.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}
            <span className="text-muted-foreground pb-0.5 text-xl font-normal sm:text-2xl">
              /5
            </span>
          </p>
          <div className="min-w-0">
            <ReviewStars value={rating} />
            <p className="text-muted-foreground mt-1.5 text-xs text-pretty">
              {reviewCount} avis · {proof.recommendRate} % le recommandent · déjà
              cousu {proof.orders} fois
            </p>
          </div>
        </div>

        <ul className="min-w-0 space-y-1.5">
          {distribution.map((d) => (
            <li key={d.stars} className="flex items-center gap-2">
              <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />
              <span className="text-muted-foreground w-2 shrink-0 text-[11px] tabular-nums">
                {d.stars}
              </span>
              <span className="bg-muted h-2 min-w-0 flex-1 overflow-hidden rounded-full">
                <span
                  className="bg-foreground block h-full rounded-full"
                  style={{ width: `${(d.count / maxCount) * 100}%` }}
                />
              </span>
              <span className="text-muted-foreground w-8 shrink-0 text-right text-[11px] tabular-nums">
                {d.count}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Les avis défilent de gauche à droite : piste native (donc swipe au
          doigt sur mobile), pilotée par les flèches sur grand écran. Les
          marges négatives laissent les cartes filer jusqu'au bord de l'écran
          au lieu de forcer un débordement de la page. */}
      <div className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((f) => {
              const count =
                f.value === "all"
                  ? all.length
                  : all.filter((r) => r.subject === f.value).length;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  aria-pressed={filter === f.value}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    filter === f.value
                      ? "bg-foreground text-background border-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  {f.label}
                  <span className="ml-1.5 tabular-nums opacity-60">{count}</span>
                </button>
              );
            })}
          </div>

          {shown.length > 1 && (
            <div className="hidden shrink-0 gap-2 sm:flex">
              <ScrollArrow side="left" onClick={() => step(-1)} disabled={!canPrev} />
              <ScrollArrow side="right" onClick={() => step(1)} disabled={!canNext} />
            </div>
          )}
        </div>

        {shown.length > 0 ? (
          <div
            ref={trackRef}
            tabIndex={0}
            role="group"
            aria-roledescription="carrousel"
            aria-label="Avis clients"
            onScroll={(e) => syncArrows(e.currentTarget)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") step(-1);
              if (e.key === "ArrowRight") step(1);
            }}
            className="focus-visible:ring-ring/50 -mx-4 mt-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto overscroll-x-contain px-4 pb-2 outline-none [scrollbar-width:none] focus-visible:ring-2 sm:mx-0 sm:scroll-px-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
          >
            {shown.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground mt-4 rounded-2xl border border-dashed px-4 py-8 text-center text-sm">
            Aucun avis sur ce sujet pour l&apos;instant — soyez le premier.
          </p>
        )}

        <p className="text-muted-foreground mt-1 text-xs sm:hidden">
          Faites glisser pour voir les avis suivants.
        </p>
      </div>
    </section>
  );
}

function ScrollArrow({
  side,
  onClick,
  disabled,
}: {
  side: "left" | "right";
  onClick: () => void;
  disabled: boolean;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === "left" ? "Avis précédents" : "Avis suivants"}
      className="hover:bg-muted flex size-9 items-center justify-center rounded-full border transition-colors disabled:opacity-30"
    >
      <Icon className="size-4" />
    </button>
  );
}

/** Photo d'un client. Les avis déposés ici en portent une locale (`data:`), que
 *  l'optimiseur d'images de Next ne traite pas — celle-là s'affiche telle quelle. */
function ClientPhoto({ src, alt, sizes }: { src: string; alt: string; sizes: string }) {
  if (src.startsWith("data:")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className="size-full object-cover" />;
  }
  return <Image src={src} alt={alt} fill sizes={sizes} className="object-cover object-top" />;
}

function ReviewCard({ review }: { review: GarmentReview }) {
  return (
    // Largeur figée : c'est ce qui fait un carrousel plutôt qu'une pile. Sur
    // mobile la carte s'arrête avant le bord opposé, pour montrer qu'il y en a
    // une autre derrière — 86vw et pas moins, sinon la citation tombe sous les
    // 40 signes par ligne et se hache.
    <article className="bg-card flex w-[min(21rem,86vw)] shrink-0 snap-start flex-col rounded-2xl border p-5 sm:p-6">
      <header className="flex items-center gap-3">
        <span className="bg-muted relative size-11 shrink-0 overflow-hidden rounded-full sm:size-12">
          {review.photo ? (
            <ClientPhoto src={review.photo} alt={review.author} sizes="48px" />
          ) : (
            <span className="flex size-full items-center justify-center text-sm font-semibold">
              {review.author
                .split(" ")
                .map((w) => w[0])
                .join("")}
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-medium sm:text-base">
            <span className="truncate">{review.author}</span>
            {review.own ? (
              <Badge variant="secondary" className="shrink-0">
                Votre avis
              </Badge>
            ) : (
              <BadgeCheck
                className="text-muted-foreground size-4 shrink-0"
                aria-label="Achat vérifié"
              />
            )}
          </p>
          {/* Ville et mois en capitales fines : une ligne de service, qui ne
              vient pas concurrencer la citation. */}
          <p className="text-muted-foreground mt-1 truncate text-[10px] font-semibold tracking-[0.16em] uppercase">
            {review.city} · {review.date}
          </p>
        </div>
      </header>

      <ReviewStars value={review.rating} size="size-3.5" className="mt-4" />

      {/* La citation est le cœur de la carte : serif, interligne aéré, et
          césure « équilibrée » pour qu'aucune ligne ne finisse seule. Les
          guillemets sont collés au texte par une espace fine insécable (U+202F),
          la règle française — sinon un guillemet part à la ligne tout seul. */}
      <blockquote className="mt-3 flex-1 font-serif text-[1.0625rem] leading-[1.6] text-pretty sm:text-lg">
        «&#8239;{review.body}&#8239;»
      </blockquote>

      <footer className="text-muted-foreground mt-5 space-y-2 border-t pt-4 text-xs">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <Badge variant="outline" className="font-normal">
            {REVIEW_SUBJECT_LABELS[review.subject]}
          </Badge>
          {review.context && <span className="min-w-0 truncate">{review.context}</span>}
        </div>
        {/* Un atelier saisi à la main n'a pas de fiche : on le cite sans lien. */}
        {review.tailor &&
          (review.tailor.id ? (
            <p className="truncate">
              Cousu par{" "}
              <Link
                href={`/tailleurs/${review.tailor.id}`}
                className="hover:text-foreground underline-offset-4 hover:underline"
              >
                {review.tailor.name}
              </Link>
            </p>
          ) : (
            <p className="truncate">Cousu par {review.tailor.name}</p>
          ))}
      </footer>
    </article>
  );
}

function ReviewForm({
  garmentName,
  tailors,
  onPublish,
  onCancel,
}: {
  garmentName: string;
  tailors: { id: string; shop_name: string | null }[];
  onPublish: (review: GarmentReview) => void;
  onCancel: () => void;
}) {
  const named = tailors.filter((t) => t.shop_name);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [subject, setSubject] = useState<GarmentReviewSubject>("garment");
  const [tailorId, setTailorId] = useState(named[0]?.id ?? "");
  // Repli quand aucun atelier n'est encore listé sur ce vêtement : le client
  // écrit le nom du sien, cité alors sans lien vers une fiche.
  const [tailorName, setTailorName] = useState("");
  const [author, setAuthor] = useState("");
  const [city, setCity] = useState("");
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // `items` donne au déclencheur le libellé de la valeur choisie (Base UI).
  const tailorItems: Record<string, string> = Object.fromEntries(
    named.map((t) => [t.id, t.shop_name!]),
  );
  const active = hover || rating;

  async function handlePhoto(file: File | null) {
    if (!file) return setPhoto(null);
    const url = await toSquareDataUrl(file);
    if (!url) {
      setError("Cette photo n'a pas pu être lue. Essayez-en une autre.");
      return;
    }
    setPhoto(url);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === 0) return setError("Choisissez une note de 1 à 5 étoiles.");
    if (!author.trim()) return setError("Indiquez le nom qui signera votre avis.");
    if (body.trim().length < 10) return setError("Racontez-nous un peu plus votre expérience.");

    const shop = named.find((t) => t.id === tailorId);
    const typed = tailorName.trim();
    onPublish({
      id: newReviewId(),
      author: author.trim(),
      city: city.trim() || "Sénégal",
      photo,
      rating,
      date: monthNow(),
      body: body.trim(),
      subject,
      tailor: shop
        ? { id: shop.id, name: shop.shop_name! }
        : typed
          ? { id: "", name: typed }
          : null,
      context: "",
      own: true,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card mt-6 space-y-5 rounded-2xl border p-5 sm:p-6">
      <div>
        <h3 className="font-semibold">Votre avis sur {garmentName}</h3>
        <p className="text-muted-foreground text-sm">
          Parlez du vêtement reçu ou du tailleur qui l&apos;a cousu — les deux
          aident le prochain client.
        </p>
      </div>

      {error && (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Votre note</Label>
          <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
            {Array.from({ length: 5 }, (_, i) => {
              const value = i + 1;
              return (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} étoile${value > 1 ? "s" : ""}`}
                  onMouseEnter={() => setHover(value)}
                  onClick={() => setRating(value)}
                  className="rounded-sm p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "size-7",
                      value <= active
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Votre avis porte sur</Label>
          <div className="flex gap-2">
            {(["garment", "tailor"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSubject(value)}
                aria-pressed={subject === value}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  subject === value
                    ? "bg-foreground text-background border-foreground"
                    : "hover:bg-muted",
                )}
              >
                {REVIEW_SUBJECT_LABELS[value]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={named.length ? undefined : "garment-review-tailor"}>
          Le tailleur qui a cousu votre pièce
        </Label>
        {named.length > 0 ? (
          <Select
            value={tailorId}
            onValueChange={(v) => setTailorId(v as string)}
            items={tailorItems}
          >
            <SelectTrigger className="w-full sm:max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {named.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.shop_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="garment-review-tailor"
            value={tailorName}
            onChange={(e) => setTailorName(e.target.value)}
            placeholder="Nom de l'atelier (facultatif)"
            maxLength={80}
            className="sm:max-w-xs"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="garment-review-body">Votre expérience</Label>
        <Textarea
          id="garment-review-body"
          rows={4}
          maxLength={1000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="La coupe, les finitions, les délais, l'accueil du tailleur…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="garment-review-author">Votre nom</Label>
          <Input
            id="garment-review-author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Aminata D."
            maxLength={60}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="garment-review-city">Votre ville</Label>
          <Input
            id="garment-review-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Dakar"
            maxLength={60}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="garment-review-photo">Votre photo (facultatif)</Label>
        <div className="flex items-center gap-4">
          <span className="bg-muted text-muted-foreground relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border">
            {photo ? (
              <ClientPhoto src={photo} alt="Votre photo" sizes="64px" />
            ) : (
              <Camera className="size-5" />
            )}
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <Input
              id="garment-review-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(e) => handlePhoto(e.target.files?.[0] ?? null)}
              className="h-auto py-1.5"
            />
            <p className="text-muted-foreground text-xs">
              Elle apparaît à côté de votre avis. Recadrée et allégée sur votre
              appareil.
            </p>
          </div>
          {photo && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Retirer la photo"
              onClick={() => setPhoto(null)}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">Publier mon avis</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <p className="text-muted-foreground text-xs">
          Votre avis est publié sur cette fiche depuis votre appareil.
        </p>
      </div>
    </form>
  );
}
