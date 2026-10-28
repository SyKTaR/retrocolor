export const site = {
  name: "Retro Color",
  phone: "06 23 14 67 07",
  phoneHref: "tel:+33623146707",
  email: "retrocolor77330@gmail.com",
  emailHref: "mailto:retrocolor77330@gmail.com",
  address: ["17 rue Louis Armand", "77330 Ozoir-la-Ferrière"],
  hours: ["Du lundi au vendredi", "9h–12h et 13h30–18h"],
} as const;

export const navigation = [
  { label: "Services", href: "#services" },
  { label: "Le procédé", href: "#procede" },
  { label: "Réalisations", href: "#realisations" },
  { label: "Questions", href: "#questions" },
  { label: "Contact", href: "#contact" },
] as const;

export type Service = {
  title: string;
  description: string;
  image: string;
  alt: string;
  panelClass: string;
  tag: string;
  tagDark?: boolean;
  before?: string;
  specs: readonly { label: string; value: string }[];
};

export const services: readonly Service[] = [
  {
    title: "Peinture poudre", description: "Poudre projetée puis cuite au four. Une finition épaisse et régulière, très résistante aux chocs, aux UV et à la corrosion.",
    image: "/images/plaquette-poudre.jpeg", alt: "Plaquette d’essai en peinture poudre, anthracite satiné", panelClass: "is-poudre", tag: "RAL 7016, satiné",
    specs: [{ label: "Finitions", value: "Mat, satiné, brillant, texturé" }, { label: "Supports", value: "Acier, aluminium, fonte" }, { label: "Usages", value: "Jantes, portails, mobilier" }],
  },
  {
    title: "Peinture liquide", description: "Laque appliquée au pistolet en couches fines. Pour les teintes sur mesure et les pièces qui ne supportent pas la cuisson.",
    image: "/images/plaquette-liquide.jpeg", alt: "Plaquette d’essai en peinture liquide, bleu brillant", panelClass: "is-liquide", tag: "RAL 5010, brillant",
    specs: [{ label: "Finitions", value: "Teintes sur mesure, vernis" }, { label: "Supports", value: "Tous métaux" }, { label: "Usages", value: "Collection, raccords, retouches" }],
  },
  {
    title: "Sablage et microbillage", description: "Décapage par projection abrasive. Rouille, calamine et anciennes peintures sont retirées sans abîmer les détails.",
    image: "/images/plaquette-sablage.jpeg", alt: "Plaquette d’essai à moitié oxydée, à moitié sablée", panelClass: "is-sablage", tag: "Métal nu, sablé", tagDark: true, before: "Avant",
    specs: [{ label: "Finitions", value: "Métal nu, mat ou satiné" }, { label: "Supports", value: "Acier, fonte, aluminium" }, { label: "Usages", value: "Remise à nu, préparation" }],
  },
  {
    title: "Peinture de climatisation", description: "Façades, caissons et grilles peints dans la teinte du bâtiment ou de la pièce où ils sont installés.",
    image: "/images/plaquette-climatisation.jpeg", alt: "Plaquette d’essai à ailettes, blanc satiné", panelClass: "is-clim", tag: "RAL 9010, satiné", tagDark: true,
    specs: [{ label: "Finitions", value: "Teintes RAL architecturales" }, { label: "Supports", value: "Tôle acier et aluminium" }, { label: "Usages", value: "Unités extérieures, grilles" }],
  },
];

export const steps = [
  { state: "Métal oxydé", title: "Réception", description: "On regarde l’état, la matière et les dimensions avant de choisir le traitement.", colorClass: "is-oxyde" },
  { state: "Métal nu", title: "Sablage", description: "Rouille et anciennes couches sont retirées jusqu’au métal.", colorClass: "is-nu" },
  { state: "Apprêt gris", title: "Apprêt", description: "Une couche d’accroche protège le métal et prépare la finition.", colorClass: "is-appret" },
  { state: "RAL 2004", title: "Peinture", description: "Application en cabine, puis cuisson au four pour fixer la teinte.", colorClass: "is-peinture" },
  { state: "Conforme", title: "Contrôle", description: "Aspect et régularité sont vérifiés avant la sortie de l’atelier.", colorClass: "is-controle" },
  { state: "Sous film", title: "Filmage", description: "La pièce est emballée sous film pour le transport.", colorClass: "is-film" },
] as const;

export const works = [
  { name: "Carénage moto", image: "/images/realisation-carenage-moto.jpeg", alt: "Carénage de moto peint en noir brillant", finish: "RAL 9005, brillant", swatches: ["is-ral-9005"] },
  { name: "Décoration restaurant", image: "/images/realisation-decoration-restaurant.jpeg", alt: "Suspensions sphériques métalliques peintes en rose métallisé pour un restaurant", finish: "Rose métallisé, hors nuancier", swatches: ["is-pearl-pink"] },
  { name: "Caisson de climatisation", image: "/images/realisation-caisson-climatisation.jpeg", alt: "Caisson de climatisation repeint en beige ivoire satiné", finish: "RAL 1014, satiné", swatches: ["is-ral-1014"] },
  { name: "Borne de commande", image: "/images/realisation-chassis-serie.jpeg", alt: "Bornes de commande métalliques peintes en rose vif satiné", finish: "RAL 4003, satiné", swatches: ["is-ral-4003"] },
  { name: "Bloc moteur", image: "/images/realisation-bloc-moteur.jpeg", alt: "Bloc moteur peint en bleu brillant", finish: "RAL 5005, brillant", swatches: ["is-ral-5005"] },
] as const;

export const moreWorks = [
  { name: "Diffuseur de climatisation", image: "/images/realisation-piece-ronde-rouge.jpeg", alt: "Diffuseur de climatisation rond peint en rouge brillant", finish: "Rouge, brillant", swatches: ["is-red"] },
  { name: "Caisson métallique", image: "/images/realisation-caisson-rose.jpeg", alt: "Caisson métallique haut peint en rose brillant", finish: "Rose, brillant", swatches: ["is-pink"] },
  { name: "Jante de moto", image: "/images/realisation-jante-jaune.jpeg", alt: "Jante à cinq branches peinte en jaune brillant", finish: "Jaune, brillant", swatches: ["is-yellow"] },
  { name: "Dalle antidérapante", image: "/images/realisation-panneau-signalisation.jpeg", alt: "Dalle en tôle larmée peinte en bandes noires et jaunes", finish: "Noir et jaune, brillant", swatches: ["is-black", "is-yellow"] },
  { name: "Cadre et bras oscillant", image: "/images/realisation-cadre-bras-oscillant.jpeg", alt: "Cadre et bras oscillant de moto peints en bronze métallisé", finish: "Bronze métallisé", swatches: ["is-bronze"] },
] as const;

export const faqs = [
  { question: "Quelles pièces pouvez-vous traiter ?", answer: "Acier, aluminium, fonte ou inox, de la petite pièce mécanique au portail. Envoyez les dimensions et quelques photos : nous confirmons la faisabilité." },
  { question: "Poudre ou liquide, que choisir ?", answer: "La poudre résiste mieux aux chocs et à la corrosion. Le liquide convient aux teintes très spécifiques et aux pièces qui ne supportent pas la cuisson." },
  { question: "Faut-il préparer la pièce avant de la déposer ?", answer: "Non, le décapage fait partie de la prestation. Retirez seulement les joints, caoutchoucs et plastiques quand c’est possible." },
  { question: "Quel est le délai ?", answer: "Il dépend du volume et des étapes nécessaires. Il figure sur le devis et il est confirmé au dépôt de la pièce." },
  { question: "Travaillez-vous pour les particuliers ?", answer: "Oui : jantes, motos en restauration, mobilier de jardin, pièces de collection." },
] as const;
