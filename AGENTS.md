<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# JALOFA — Guide du projet

Plateforme de couture sur mesure pour le Sénégal. Met en relation **clients**,
**tailleurs** et **vendeurs de tissus** (designers plus tard). Toute la création
d'un vêtement se fait dans l'application.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (registry **Base UI**, pas Radix)
- **Supabase** (Postgres + Auth + Storage + Realtime) · déploiement **Vercel**

## Conventions importantes

- **Langue de l'UI : français** (marché sénégalais). Le code / les clés DB restent en anglais.
- **Devise : FCFA** (`formatPrice` dans `src/lib/constants.ts`).
- **shadcn = Base UI** : pour composer, utiliser le prop **`render={<X />}`**, PAS `asChild`.
  Pour un lien stylé en bouton : `<Link className={buttonVariants({...})}>`.
- Types de domaine dans `src/lib/types.ts` ; enums / labels FR dans `src/lib/constants.ts`.

## Structure

- `src/app/(main)/` — pages publiques + espace client (header/footer partagés)
- `src/app/(dashboard)/` — espace pro (`/tailleur/espace`, `/vendeur/espace`) : menu
  latéral propre, sans le chrome du site. **Une entrée de menu = une page** (jamais
  un tableau de bord à dérouler) ; menu dans `src/lib/dashboard-nav.ts`
- `src/app/(auth)/` — connexion / inscription (layout minimal)
- `src/lib/supabase/` — clients browser / server / middleware (guard « non configuré »)
- `src/lib/actions/` — server actions · `src/proxy.ts` — session + gardes de routes
- `supabase/migrations/` — schéma SQL versionné ; `supabase/seed.sql` — données catalogue

## Base de données

Schéma complet : `supabase/migrations/20260712000001_init_schema.sql` (RLS activée
partout). Tables clés : `profiles`, `tailors`, `vendors`, `fabrics`, `models`,
`styles`, `measurements`, `orders`, `order_status_history`, `messages`, `reviews`,
`notifications`, favoris.

Storage : bucket public `fabric-images` (photos de tissus). Les écritures sont
préfixées par l'uid du vendeur — c'est ce préfixe que la policy vérifie, donc
tout upload doit viser `<uid>/<fichier>`.

### État du provisioning

Projet Supabase réservé : **« mactravail's Project »** (ref `wegtzvelhxtgzlqxhinj`),
**INACTIVE**. Plan gratuit = **2 projets actifs max** ; libérer un slot (pause de
`litug immo`/`dikx` ou upgrade Pro) → restaurer → appliquer migration + seed →
renseigner `.env.local`. Puis régénérer `src/lib/database.types.ts` (Supabase MCP
`generate_typescript_types`).

## MVP

Inscription/connexion, catalogue tissus, catalogue modèles, choix du tailleur,
mesures (manuel + tailles standard), checkout + paiements (Orange Money, Wave,
Free Money, carte), dashboard client, dashboard tailleur, suivi de commande.
