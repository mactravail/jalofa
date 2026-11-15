"use client";

import { useRef, useState, useTransition } from "react";
import { BadgeCheck, Check, FileText, Loader2, ShieldCheck, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { submitCertificationRequest } from "@/lib/actions/certification";
import { resizeImage } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { T } from "@/components/i18n/t";
import { useT } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/utils";

const MAX_BYTES = 2 * 1024 * 1024;

/**
 * Un champ « fichier » simple : un grand bouton qui ouvre l'appareil photo ou
 * les fichiers, puis le nom du fichier choisi avec une croix pour l'enlever.
 */
function FileField({
  label,
  hint,
  optional,
  accept,
  file,
  onChange,
}: {
  label: string;
  hint: string;
  optional?: boolean;
  accept: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useT();
  return (
    <div className="space-y-2">
      <Label>
        <T>{label}</T>
        {optional && (
          <span className="text-muted-foreground font-normal">
            {" "}
            (<T>facultatif</T>)
          </span>
        )}
      </Label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          onChange(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      {file ? (
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <FileText className="text-primary size-5 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={t("Enlever")}
            className="text-muted-foreground hover:text-foreground grid size-8 place-items-center rounded-md"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="hover:bg-muted flex h-14 w-full items-center justify-center gap-2 rounded-lg border border-dashed text-sm font-medium"
        >
          <Upload className="size-4" />
          <T>Ajouter une photo ou un fichier</T>
        </button>
      )}
      <p className="text-muted-foreground text-xs">
        <T>{hint}</T>
      </p>
    </div>
  );
}

/**
 * Le formulaire « Être certifié » de l'espace tailleur / vendeur. Les photos sont
 * réduites dans le navigateur avant l'envoi (une photo de téléphone pèse souvent
 * plusieurs Mo) ; un PDF part tel quel, plafonné à 2 Mo.
 */
export function CertificationForm({
  kind,
  defaults,
  onSent,
}: {
  kind: "tailor" | "vendor";
  defaults: { legal_name: string; phone: string; address: string; company_name: string };
  onSent?: () => void;
}) {
  const t = useT();
  const [idCard, setIdCard] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [register, setRegister] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function prepare(file: File | null): Promise<File | null> {
    if (!file) return null;
    return file.type.startsWith("image/") ? resizeImage(file) : file;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!idCard) {
      setError(t("Ajoutez la photo de votre carte d'identité."));
      return;
    }
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const [id, lg, rc] = await Promise.all([prepare(idCard), prepare(logo), prepare(register)]);
      for (const f of [id, lg, rc]) {
        if (f && f.size > MAX_BYTES) {
          setError(t("Un fichier dépasse 2 Mo. Prenez une photo à la place du PDF."));
          return;
        }
      }
      formData.set("kind", kind);
      if (id) formData.set("id_card", id);
      if (lg) formData.set("logo", lg);
      if (rc) formData.set("trade_register", rc);
      const res = await submitCertificationRequest(null, formData);
      if (res?.ok) {
        toast.success(t("Demande envoyée."));
        setSent(true);
        onSent?.();
      } else if (res) {
        setError(t(res.error));
      }
    });
  }

  if (sent) {
    return (
      <div className="rounded-xl border p-6 text-center">
        <BadgeCheck className="text-primary mx-auto size-10" />
        <p className="mt-3 font-semibold">
          <T>Demande envoyée</T>
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          <T>JALOFA vérifie vos documents. Vous recevrez une notification.</T>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">{error}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="legal_name">
          <T>Votre vrai nom</T>
        </Label>
        <Input
          id="legal_name"
          name="legal_name"
          defaultValue={defaults.legal_name}
          placeholder={t("Prénom et nom, comme sur la carte d'identité")}
          autoComplete="name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">
          <T>Téléphone</T>
        </Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          defaultValue={defaults.phone}
          placeholder="+221 77 000 00 00"
          autoComplete="tel"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">
          <T>Adresse</T>
        </Label>
        <Textarea
          id="address"
          name="address"
          defaultValue={defaults.address}
          placeholder={t("Quartier, rue, ville")}
          rows={2}
          required
        />
      </div>

      <FileField
        label="Carte d'identité"
        hint="Une photo bien lisible de votre carte (recto). Elle reste privée : seul JALOFA la voit."
        accept="image/*,application/pdf"
        file={idCard}
        onChange={setIdCard}
      />

      <div className="space-y-2">
        <Label htmlFor="company_name">
          <T>Nom de l&apos;entreprise</T>
        </Label>
        <Input
          id="company_name"
          name="company_name"
          defaultValue={defaults.company_name}
          placeholder={t(kind === "tailor" ? "Le nom de votre atelier" : "Le nom de votre boutique")}
          required
        />
      </div>

      <FileField
        label="Logo"
        optional
        hint="Le logo de votre entreprise, si vous en avez un."
        accept="image/*"
        file={logo}
        onChange={setLogo}
      />

      <div className="space-y-2">
        <Label htmlFor="ninea">
          NINEA
          <span className="text-muted-foreground font-normal">
            {" "}
            (<T>facultatif</T>)
          </span>
        </Label>
        <Input id="ninea" name="ninea" placeholder={t("Votre numéro NINEA")} />
      </div>

      <FileField
        label="Registre de commerce"
        optional
        hint="Une photo ou un PDF de votre registre de commerce (RCCM)."
        accept="image/*,application/pdf"
        file={register}
        onChange={setRegister}
      />

      <div className="bg-muted/40 text-muted-foreground flex items-start gap-2 rounded-lg border p-3 text-xs">
        <ShieldCheck className="text-primary mt-0.5 size-4 shrink-0" />
        <span>
          <T>
            {
              "Vos documents restent privés : ils servent seulement à vérifier votre identité et ne sont jamais montrés aux clients."
            }
          </T>
        </span>
      </div>

      <Button type="submit" disabled={isPending} className={cn("h-12 w-full text-base")}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        <T>Envoyer ma demande</T>
      </Button>
    </form>
  );
}
