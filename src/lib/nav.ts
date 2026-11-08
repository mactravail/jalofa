export type NavLink = { href: string; label: string };

export const NAV_LINKS: NavLink[] = [
  { href: "/modeles?category=homme", label: "Homme" },
  { href: "/modeles?category=femme", label: "Femme" },
  // Chaussures sur mesure — masqué pour l'instant, on y reviendra plus tard.
  // La page et le configurateur restent en place ; il suffit de décommenter.
  // { href: "/homme/chaussures-sur-mesure/personnaliser", label: "Chaussures" },
  { href: "/tissus", label: "Tissus" },
  { href: "/tailleurs", label: "Tailleurs" },
  { href: "/vendeurs", label: "Vendeurs" },
  { href: "/inspiration", label: "Inspiration" },
];

// The header is deliberately short, so the footer keeps the pages that would
// otherwise have no entry point.
//
// Les « Abonnements pros » ne figurent plus ici : JALOFA est gratuit pour les
// tailleurs et les vendeurs (aucun abonnement, aucune commission). La page
// `/abonnements` reste en place, non liée, pour un retour éventuel des forfaits.
export const FOOTER_LINKS: NavLink[] = [
  ...NAV_LINKS,
  { href: "/modeles", label: "Tous les modèles" },
  // La FAQ n'est plus affichée sur l'accueil : on y accède depuis le footer.
  { href: "/faq", label: "Questions fréquentes (FAQ)" },
];

// Pages légales, regroupées dans la barre basse du footer.
export const FOOTER_LEGAL_LINKS: NavLink[] = [
  { href: "/conditions", label: "Conditions générales" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/mentions-legales", label: "Mentions légales" },
];
