import Image from "next/image";
import Link from "next/link";
import { Camera, Eye, EyeOff, Sparkles } from "lucide-react";

import { DeleteInspirationButton } from "@/components/inspiration/delete-inspiration-button";
import { InspirationForm } from "@/components/inspiration/inspiration-form";
import { Badge } from "@/components/ui/badge";
import { INSPIRATION_MAKER_KIND_BADGES } from "@/lib/constants";
import { getFabrics } from "@/lib/data";
import { getMyInspiration } from "@/lib/inspiration-data";
import { isSupabaseConfigured } from "@/lib/queries";

export default async function MyInspirationPage() {
  const [posts, fabrics] = await Promise.all([
    getMyInspiration(),
    getFabrics(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Sparkles className="text-primary size-6" /> Inspiration
        </h1>
        <p className="text-muted-foreground mt-1 text-pretty">
          Partagez une tenue que vous portez — cousue par un tailleur, achetée au
          marché ou en boutique. Elle apparaît dans la galerie publique{" "}
          <Link href="/inspiration" className="underline underline-offset-4">
            Inspiration
          </Link>
          , où d&apos;autres peuvent s&apos;en inspirer.
        </p>
      </div>

      <InspirationForm fabrics={fabrics.map((f) => ({ id: f.id, name: f.name }))} />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Mes publications</h2>

        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <Camera className="text-muted-foreground mx-auto size-8" />
            <p className="text-muted-foreground mt-3 text-sm">
              {isSupabaseConfigured()
                ? "Vous n'avez pas encore partagé de tenue."
                : "Vos publications s'afficheront ici une fois la base de données connectée."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => (
              <li
                key={post.id}
                className="bg-card flex gap-4 rounded-xl border p-3"
              >
                <Link
                  href={`/inspiration/${post.id}`}
                  className="bg-muted relative size-24 shrink-0 overflow-hidden rounded-lg"
                >
                  {post.photos[0] && (
                    <Image
                      src={post.photos[0]}
                      alt={post.garment_label ?? "Tenue"}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {INSPIRATION_MAKER_KIND_BADGES[post.maker_kind]}
                    </Badge>
                    {post.is_published ? (
                      <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                        <Eye className="size-3.5" /> Publiée
                      </span>
                    ) : (
                      <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                        <EyeOff className="size-3.5" /> Masquée
                      </span>
                    )}
                  </div>
                  {post.garment_label && (
                    <p className="mt-1 truncate font-medium">
                      {post.garment_label}
                    </p>
                  )}
                  {post.caption && (
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm">
                      {post.caption}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-start">
                  <DeleteInspirationButton id={post.id} label="Supprimer" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
