"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/locale-provider";

/** Le lien d'une boutique en gros, avec « Copier » et « Partager ». */
export function ShopLinkCopy({ url, title }: { url: string; title: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t("Lien copié"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("Impossible de copier. Appuyez longtemps sur le lien pour le copier."));
    }
  };

  const share = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
      } catch {
        // Partage annulé : rien à faire.
      }
      return;
    }
    await copy();
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="bg-muted rounded-lg px-4 py-3 font-mono text-sm break-all select-all">{url}</p>
      <div className="grid grid-cols-2 gap-3">
        <Button size="lg" className="h-12 text-base" onClick={copy}>
          {copied ? <Check className="size-5" /> : <Copy className="size-5" />}
          {copied ? t("Copié") : t("Copier")}
        </Button>
        <Button size="lg" variant="outline" className="h-12 text-base" onClick={share}>
          <Share2 className="size-5" /> {t("Partager")}
        </Button>
      </div>
    </div>
  );
}
