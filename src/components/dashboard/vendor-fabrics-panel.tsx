"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Eye,
  EyeOff,
  ImagePlus,
  Layers,
  Loader2,
  MoreVertical,
  Package,
  Palette,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { FabricColorPicker } from "@/components/dashboard/fabric-color-picker";
import { FabricFormDialog } from "@/components/dashboard/fabric-form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPrice } from "@/lib/constants";
import {
  addFabricColors,
  deleteFabric,
  restockFabric,
  setFabricActive,
  setFabricInStock,
} from "@/lib/actions/fabrics";
import { unwrap } from "@/lib/action-result";
import { fabricColorHex, parseFabricColors } from "@/lib/fabric-colors";
import { resizeImage } from "@/lib/image";
import { isFabricAvailable } from "@/lib/fabric-metrage";
import {
  fabricDiscount,
  fabricStock,
  fabricUnit,
  fabricUnitPrice,
  formatUnits,
} from "@/lib/fabric-specs";
import type { Fabric, FabricCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { T } from "@/components/i18n/t";
import { translateNow } from "@/lib/i18n/translate";

/** Toutes les photos de couleur partent ensemble : sous la limite d'une Server Action. */
const MAX_COLOR_PHOTOS_BYTES = 3.5 * 1024 * 1024;

// Selling cloth is the vendor's whole shop, but only a sideline for a tailor —
// who lands here with nothing listed and no reason to guess why the panel is
// there. Same CRUD either way, so only the framing changes.
const COPY: Record<"tailor" | "vendor", { empty: string }> = {
  tailor: {
    empty:
      "Vous ne vendez pas encore de tissu. Si vous en proposez à vos clients, ajoutez-le ici : il rejoint le catalogue et devient commandable comme celui d'un vendeur.",
  },
  vendor: {
    empty:
      "Aucun tissu dans la boutique JALOFA. Ajoutez le premier : il rejoint le catalogue et devient commandable.",
  },
};

export function VendorFabricsPanel({
  fabrics,
  categories,
  role = "vendor",
  europe = false,
}: {
  fabrics: Fabric[];
  categories: FabricCategory[];
  role?: "tailor" | "vendor";
  /** Boutique en Europe (JALOFA EUROPE) : prix en €, livraison « Europe ». */
  europe?: boolean;
}) {
  const copy = COPY[role];
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Fabric | null>(null);
  // Remonté seulement au changement de tissu ou après l'envoi : fermé par
  // erreur, le formulaire garde sa saisie.
  const [savedSeq, setSavedSeq] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Fabric | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const [stockChangingId, setStockChangingId] = useState<string | null>(null);
  const [, startStockChange] = useTransition();

  const [restockTarget, setRestockTarget] = useState<Fabric | null>(null);
  const [colorsTarget, setColorsTarget] = useState<Fabric | null>(null);

  function toggleStock(fabric: Fabric) {
    const next = !isFabricAvailable(fabric);
    // Épuisé → disponible : c'est un nouveau stock, on demande seulement la quantité.
    if (next) {
      setRestockTarget(fabric);
      return;
    }
    setStockChangingId(fabric.id);
    startStockChange(async () => {
      try {
        unwrap(await setFabricInStock(fabric.id, next));
        toast.success(translateNow(next ? "Tissu disponible." : "Tissu marqué épuisé."));
      } catch (e) {
        toast.error(translateNow(e instanceof Error ? e.message : "Erreur, réessayez."));
      } finally {
        setStockChangingId(null);
      }
    });
  }

  const [visibilityChangingId, setVisibilityChangingId] = useState<string | null>(null);
  const [, startVisibilityChange] = useTransition();

  function toggleVisible(fabric: Fabric) {
    const next = !fabric.is_active;
    setVisibilityChangingId(fabric.id);
    startVisibilityChange(async () => {
      try {
        unwrap(await setFabricActive(fabric.id, next));
        toast.success(
          translateNow(next ? "Tissu remis en boutique." : "Tissu masqué : les clients ne le voient plus."),
        );
      } catch (e) {
        toast.error(translateNow(e instanceof Error ? e.message : "Erreur, réessayez."));
      } finally {
        setVisibilityChangingId(null);
      }
    });
  }

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  // Arrivé depuis le raccourci « Ajouter un tissu » de l'accueil (`?nouveau=1`) :
  // on ouvre le formulaire tout de suite. Lecture côté client (window) plutôt que
  // `useSearchParams` : pas de frontière Suspense à prévoir sur la page.
  const autoOpened = useRef(false);
  useEffect(() => {
    if (autoOpened.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("nouveau") === "1") {
      autoOpened.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormOpen(true);
    }
  }, []);

  function openEdit(fabric: Fabric) {
    setEditing(fabric);
    setFormOpen(true);
  }

  function confirmDelete() {
    const target = deleteTarget;
    if (!target) return;
    startDelete(async () => {
      try {
        unwrap(await deleteFabric(target.id));
        toast.success(translateNow("Tissu supprimé."));
        setDeleteTarget(null);
      } catch (e) {
        toast.error(translateNow(e instanceof Error ? e.message : "Erreur de suppression."));
      }
    });
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          <T vars={{ n: fabrics.length }}>{fabrics.length > 1 ? "{n} tissus en boutique" : "{n} tissu en boutique"}</T>
        </p>
        <Button
          size="sm"
          onClick={openNew}
          className="gap-1.5 bg-fuchsia-500 text-white hover:bg-fuchsia-600"
        >
          <Plus className="size-4" /> <T>Ajouter un tissu</T>
        </Button>
      </div>

      {fabrics.length > 0 && (
        <p className="text-muted-foreground mb-3 text-sm">
          <T>Le stock baisse tout seul à chaque vente. À zéro, le tissu passe « Épuisé ». Nouveau stock ? Touchez « Épuisé » ou « + Stock ».</T>
        </p>
      )}

      {fabrics.length === 0 ? (
        <button
          type="button"
          onClick={openNew}
          className="flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-fuchsia-200 bg-fuchsia-50 p-8 text-center transition-transform active:scale-[0.99] dark:border-fuchsia-900/60 dark:bg-fuchsia-950/30"
        >
          <span className="flex size-14 items-center justify-center rounded-2xl bg-fuchsia-500 text-white">
            <Layers className="size-7" />
          </span>
          <span className="mt-4 text-base font-semibold">
            <T>Ajoutez votre premier tissu</T>
          </span>
          <span className="text-muted-foreground mt-1 max-w-md text-sm">
            <T>{copy.empty}</T>
          </span>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-fuchsia-500 px-4 py-2 text-sm font-semibold text-white">
            <Plus className="size-4" /> <T>Ajouter un tissu</T>
          </span>
        </button>
      ) : (
        <div className="divide-y rounded-xl border">
          {fabrics.map((fabric) => {
            const available = isFabricAvailable(fabric);
            return (
              <div key={fabric.id} className="flex items-center gap-4 p-3">
                <div className="bg-muted size-12 shrink-0 overflow-hidden rounded-lg">
                  {fabric.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fabric.image_url}
                      alt=""
                      className="size-full object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="truncate font-medium">{fabric.name}</p>
                    {!fabric.is_active && (
                      <Badge className="bg-muted text-muted-foreground border-0">
                        <T>Masqué</T>
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground truncate text-sm">
                    {[fabric.material, fabric.color].filter(Boolean).join(" · ") ||
                      "—"}
                  </p>
                  <StockLine fabric={fabric} />
                </div>

                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium">
                    {formatPrice(fabricUnitPrice(fabric))}
                  </p>
                  {fabricDiscount(fabric) > 0 && (
                    <p className="text-xs font-semibold text-red-400">−{fabricDiscount(fabric)} %</p>
                  )}
                  <p className="text-muted-foreground text-xs">/ <T>{fabricUnit(fabric).per}</T></p>
                </div>

                <Button
                  size="sm"
                  onClick={() => toggleStock(fabric)}
                  disabled={stockChangingId === fabric.id}
                  aria-pressed={available}
                  className={cn(
                    "shrink-0 text-white",
                    available
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700",
                  )}
                >
                  {stockChangingId === fabric.id && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  <T>{available ? "Disponible" : "Épuisé"}</T>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" aria-label="Actions" />
                    }
                  >
                    <MoreVertical className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setRestockTarget(fabric)}>
                      <Package className="size-4" /> <T>+ Stock</T>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setColorsTarget(fabric)}>
                      <Palette className="size-4" /> <T>Ajouter des couleurs</T>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEdit(fabric)}>
                      <Pencil className="size-4" /> <T>Modifier</T>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => toggleVisible(fabric)}
                      disabled={visibilityChangingId === fabric.id}
                    >
                      {fabric.is_active ? (
                        <>
                          <EyeOff className="size-4" /> <T>Masquer</T>
                        </>
                      ) : (
                        <>
                          <Eye className="size-4" /> <T>Afficher en boutique</T>
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleteTarget(fabric)}
                    >
                      <Trash2 className="size-4" /> <T>Supprimer</T>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}

      <FabricFormDialog
        key={`${editing?.id ?? "new"}-${savedSeq}`}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => setSavedSeq((n) => n + 1)}
        onReset={() => setSavedSeq((n) => n + 1)}
        fabric={editing}
        categories={categories}
        europe={europe}
        compact={role === "vendor"}
      />

      <RestockDialog fabric={restockTarget} onClose={() => setRestockTarget(null)} />
      <AddColorsDialog fabric={colorsTarget} onClose={() => setColorsTarget(null)} />

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle><T>Supprimer ce tissu ?</T></DialogTitle>
            <DialogDescription>
              {deleteTarget?.name} <T>sera définitivement retiré de votre boutique. Cette action est irréversible.</T>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              <T>Annuler</T>
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="size-4 animate-spin" />}
              <T>Supprimer</T>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function StockLine({ fabric }: { fabric: Fabric }) {
  const stock = fabricStock(fabric);
  if (stock == null) {
    return (
      <p className="text-muted-foreground text-xs font-medium">
        <T>{isFabricAvailable(fabric) ? "Stock : non renseigné" : "Stock : 0"}</T>
      </p>
    );
  }
  return (
    <p className={cn("text-xs font-medium", stock <= 5 ? "text-amber-500" : "text-emerald-500")}>
      <T vars={{ q: formatUnits(fabric, stock) }}>{"Stock : {q}"}</T>
    </p>
  );
}

/** Nouveau stock : seule la quantité reçue est demandée. */
function RestockDialog({ fabric, onClose }: { fabric: Fabric | null; onClose: () => void }) {
  const [qty, setQty] = useState("");
  const [pending, start] = useTransition();
  const stock = fabric ? fabricStock(fabric) : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!fabric) return;
    const n = Number(qty.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      toast.error(translateNow("Indiquez la quantité reçue."));
      return;
    }
    start(async () => {
      try {
        unwrap(await restockFabric(fabric.id, n));
        toast.success(translateNow("Stock mis à jour : le tissu est en vente."));
        setQty("");
        onClose();
      } catch (err) {
        toast.error(translateNow(err instanceof Error ? err.message : "Erreur, réessayez."));
      }
    });
  }

  return (
    <Dialog open={Boolean(fabric)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>
              <T>Nouveau stock</T>
            </DialogTitle>
            <DialogDescription>
              {fabric?.name}
              {" · "}
              {fabric && stock != null ? (
                <T vars={{ q: formatUnits(fabric, stock) }}>{"il reste {q}"}</T>
              ) : (
                <T>stock vide</T>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="restock-qty">
              <T vars={{ unit: fabric ? fabricUnit(fabric).many : "" }}>
                {"Combien de {unit} avez-vous reçu ?"}
              </T>
            </Label>
            <Input
              id="restock-qty"
              type="number"
              inputMode="decimal"
              min={0.5}
              step={0.5}
              required
              autoFocus
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="50"
              className="h-12 text-lg"
            />
            <p className="text-muted-foreground text-xs">
              <T>{"La quantité s'ajoute à ce qui reste. Rien d'autre à remplir."}</T>
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              <T>Annuler</T>
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              <T>Ajouter au stock</T>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Nouvelles couleurs d'un tissu déjà publié : rien d'autre à ressaisir. */
function AddColorsDialog({ fabric, onClose }: { fabric: Fabric | null; onClose: () => void }) {
  const [pending, start] = useTransition();
  const current = parseFabricColors(fabric?.color);
  // Les couleurs cochées, et une photo facultative pour chacune.
  const [picked, setPicked] = useState<string[]>([]);
  const [files, setFiles] = useState<Record<string, { file: File; url: string }>>({});
  const newColors = picked.filter((c) => !current.includes(c));

  function close() {
    for (const f of Object.values(files)) URL.revokeObjectURL(f.url);
    setFiles({});
    setPicked([]);
    onClose();
  }

  function pickFile(color: string, file: File | undefined) {
    if (!file) return;
    setFiles((m) => {
      if (m[color]) URL.revokeObjectURL(m[color].url);
      return { ...m, [color]: { file, url: URL.createObjectURL(file) } };
    });
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fabric) return;
    if (newColors.length === 0) {
      toast.error(translateNow("Choisissez au moins une nouvelle couleur."));
      return;
    }
    start(async () => {
      try {
        // Photos réduites ici : brutes, elles dépasseraient la limite d'envoi.
        const photos = new FormData();
        let total = 0;
        for (const c of newColors) {
          const f = files[c]?.file;
          if (!f) continue;
          const image = await resizeImage(f);
          total += image.size;
          photos.append("color_image", image);
          photos.append("color_image_for", c);
        }
        if (total > MAX_COLOR_PHOTOS_BYTES) {
          toast.error(translateNow("Vos photos sont trop lourdes ensemble. Retirez des photos de couleur ou choisissez des photos plus légères."));
          return;
        }
        unwrap(await addFabricColors(fabric.id, newColors, photos));
        toast.success(translateNow("Couleurs ajoutées."));
        close();
      } catch (err) {
        toast.error(translateNow(err instanceof Error ? err.message : "Erreur, réessayez."));
      }
    });
  }

  return (
    <Dialog open={Boolean(fabric)} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="space-y-4" key={fabric?.id ?? "none"}>
          <DialogHeader>
            <DialogTitle>
              <T>Ajouter des couleurs</T>
            </DialogTitle>
            <DialogDescription>
              {fabric?.name}
              {current.length > 0 && (
                <>
                  {" · "}
                  <T>Déjà en vente :</T> {current.join(", ")}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <FabricColorPicker name="new_colors" onChange={setPicked} />
          {newColors.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                <T>Photo de chaque couleur</T>{" "}
                <span className="text-muted-foreground text-xs font-normal">
                  (<T>facultatif</T>)
                </span>
              </p>
              <ul className="divide-y rounded-lg border">
                {newColors.map((c) => {
                  const inputId = `new-color-photo-${c.replace(/\W+/g, "-")}`;
                  const preview = files[c]?.url;
                  return (
                    <li key={c} className="flex items-center gap-3 p-2">
                      <label
                        htmlFor={inputId}
                        className="bg-muted relative flex size-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed"
                      >
                        {preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={preview} alt="" className="size-full object-cover" />
                        ) : (
                          <ImagePlus className="text-muted-foreground size-5" />
                        )}
                        <input
                          id={inputId}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          className="sr-only"
                          onChange={(e) => {
                            pickFile(c, e.target.files?.[0]);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <span
                        className="size-5 shrink-0 rounded-full border border-white/20"
                        style={{ backgroundColor: fabricColorHex(c) ?? undefined }}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        <T>{c}</T>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={pending}>
              <T>Annuler</T>
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              <T>Ajouter</T>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
