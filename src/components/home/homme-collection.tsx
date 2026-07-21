import {
  CollectionCarousel,
  type CollectionTile,
} from "@/components/home/collection-carousel";

// Collection Homme présentée « à la Hockerty » (cf. CollectionCarousel). L'ordre
// demandé pour la vitrine : grand boubou, kaftan, agbada, chemise, costume,
// relax. Le grand boubou mène à sa page dédiée, les autres à leur fiche modèle
// (le prendre tel quel ou le personnaliser). Les images appartiennent au
// vêtement visé pour que la tuile et sa page concordent.
const TILES: CollectionTile[] = [
  {
    name: "Grand boubou",
    caption: "Cérémonie",
    src: "/models/grand-boubou.jpg",
    href: "/homme/grand-boubou-sur-mesure",
    alt: "Homme en grand boubou traditionnel sur mesure",
  },
  {
    name: "Kaftan",
    caption: "Fêtes & vendredi",
    src: "/models/kaftan.jpg",
    href: "/modeles/demo-kaftan",
    alt: "Homme en kaftan sur mesure",
  },
  {
    name: "Agbada",
    caption: "Grandes occasions",
    src: "/collection%20homme/nigerien.jpg",
    href: "/modeles/demo-agbada",
    alt: "Homme en agbada brodé d'apparat",
  },
  {
    name: "Chemise",
    caption: "Bureau & quotidien",
    src: "/models/chemise.jpg",
    href: "/modeles/demo-chemise",
    alt: "Homme en chemise africaine sur mesure",
  },
  {
    name: "Costume",
    caption: "Soirée & business",
    src: "/models/costume.jpg",
    href: "/modeles/demo-costume",
    alt: "Homme en costume sur mesure",
  },
  {
    name: "Relax",
    caption: "Détente",
    src: "/collection%20homme/e.jpg",
    href: "/modeles/demo-relax",
    alt: "Homme en tenue décontractée sur mesure",
  },
];

// Bloc « Collection Homme » — pendant de la Collection Femme dans la section
// « Nos collections ».
export function HommeCollection() {
  return (
    <CollectionCarousel
      title="Collection Homme"
      subtitle="Sur mesure, de la tête aux pieds — grand boubou, kaftan, agbada, chemise, costume et relax."
      tiles={TILES}
    />
  );
}
