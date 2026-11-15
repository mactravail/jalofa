"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { T } from "@/components/i18n/t";

/**
 * Filet de sécurité de l'espace pro : sans lui, une erreur imprévue affiche
 * l'écran anglais « This page couldn't load ». Le menu latéral reste en place.
 */
export default function DashboardError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <p className="text-lg font-semibold">
        <T>Oups, un problème est survenu.</T>
      </p>
      <p className="text-muted-foreground mt-2 text-sm">
        <T>Touchez « Réessayer ». Si le problème continue, rechargez la page.</T>
      </p>
      <Button className="mt-6" size="lg" onClick={() => retry()}>
        <T>Réessayer</T>
      </Button>
    </div>
  );
}
