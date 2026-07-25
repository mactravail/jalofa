import {
  CollectionCarousel,
  type CollectionTile,
} from "@/components/home/collection-carousel";

// Collection Femme présentée « à la Hockerty » (cf. CollectionCarousel), en
// pendant de la Collection Homme. Vitrine de la tête aux pieds : robe, boubou,
// cérémonie, tailleur, ensemble, thiaya. La robe et le boubou femme mènent à la
// page dédiée de la famille robe ; les autres à leur fiche modèle. On lie par
// `slug` stable — jamais par l'`id` démo, qui n'existe pas en base et renvoyait
// une 404 en prod. Les images appartiennent au vêtement visé pour que la tuile
// et sa page concordent.
const TILES: CollectionTile[] = [
  {
    name: "Robe",
    caption: "Du quotidien à la cérémonie",
    src: "/collection%20femme/robe/w.avif",
    href: "/femme/robe-sur-mesure",
    alt: "Femme en robe sur mesure",
  },
  {
    name: "Boubou femme",
    caption: "Grandes occasions",
    src: "/collection%20femme/ceremonie/k.avif",
    href: "/femme/robe-sur-mesure?type=boubou-femme",
    alt: "Femme en boubou brodé sur mesure",
  },
  {
    name: "Cérémonie",
    caption: "Mariages & fêtes",
    src: "/collection%20femme/ceremonie/f.avif",
    href: "/modeles/ceremonie-femme",
    alt: "Femme en tenue de cérémonie brodée",
  },
  {
    name: "Tailleur pantalon",
    caption: "Bureau & business",
    src: "/collection%20femme/pantalon/v.avif",
    href: "/modeles/tailleur-pantalon",
    alt: "Femme en tailleur pantalon sur mesure",
  },
  {
    name: "Ensemble",
    caption: "Coordonné haut & bas",
    src: "/collection%20femme/robe/o.avif",
    href: "/modeles/ensemble",
    alt: "Femme en ensemble coordonné sur mesure",
  },
  {
    name: "Thiaya",
    caption: "Traditionnel",
    src: "/collection%20femme/thiaya/thiaya%20femme.jpg",
    href: "/modeles/thiaya-femme",
    alt: "Femme en thiaya traditionnel deux-pièces",
  },
];

// Bloc « Collection Femme » — pendant de la Collection Homme dans la section
// « Nos collections ».
export function FemmeCollection() {
  return (
    <CollectionCarousel
      title="Collection Femme"
      subtitle="Sur mesure, de la tête aux pieds — robe, boubou, cérémonie, tailleur, ensemble et thiaya."
      tiles={TILES}
    />
  );
}
