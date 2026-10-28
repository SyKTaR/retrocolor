export const legalPlaceholders = {
  legalForm: "SARL",
  capital: "4 000,00",
  siret: "829 041 979 00024",
  rcs: "829 041 979",
  vat: "FR68829041979",
  director: "Antonio GONCALVES DA SILVA",
  role: "gérant",
  host: "[Hébergeur]",
  hostAddress: "[Adresse de l’hébergeur]",
  hostSite: "[Site de l’hébergeur]",
  hostCountry: "[Pays d’établissement de l’hébergeur]",
  designer: "KLIV Agency",
  designerSite: "kliv-agency.fr",
  mediator: "[Nom du médiateur]",
  mediatorAddress: "[site internet et adresse postale du médiateur]",
  analytics: "Google Analytics",
} as const;

export type LegalBlock =
  | { type: "paragraph"; text: string }
  | { type: "card"; rows: { label: string; value: string }[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "list"; items: { lead: string; text: string }[] }
  | { type: "callout"; text: string }
  | { type: "link"; label: string; href: string };

export type LegalSectionContent = {
  id: string;
  nav: string;
  title: string;
  blocks: LegalBlock[];
};

export type LegalPageContent = {
  breadcrumb: string;
  title: string;
  introduction: string;
  readingMinutes: number;
  sections: LegalSectionContent[];
  cta: { title: string; text: string };
};

export const mentionsLegales: LegalPageContent = {
  breadcrumb: "Mentions légales",
  title: "Mentions légales",
  introduction: "Qui édite ce site, qui l’héberge et ce que vous pouvez faire de son contenu. Les informations obligatoires, sans jargon.",
  readingMinutes: 3,
  sections: [
    { id: "editeur", nav: "Éditeur du site", title: "Éditeur du site", blocks: [
      { type: "paragraph", text: "Ce site est édité par l’atelier Rétro Color, spécialiste du sablage, du microbillage et de la peinture de pièces métalliques." },
      { type: "card", rows: [
        { label: "Raison sociale", value: "Rétro Color" },
        { label: "Forme juridique", value: `${legalPlaceholders.legalForm} au capital de ${legalPlaceholders.capital} €` },
        { label: "Siège social", value: "17 rue Louis Armand, 77330 Ozoir-la-Ferrière" },
        { label: "SIRET", value: legalPlaceholders.siret },
        { label: "RCS", value: `Melun ${legalPlaceholders.rcs}` },
        { label: "TVA intracommunautaire", value: legalPlaceholders.vat },
        { label: "Téléphone", value: "06 23 14 67 07" },
        { label: "E-mail", value: "retrocolor77330@gmail.com" },
      ] },
    ] },
    { id: "directeur", nav: "Directeur de la publication", title: "Directeur de la publication", blocks: [
      { type: "paragraph", text: `${legalPlaceholders.director}, en qualité de ${legalPlaceholders.role} de Rétro Color.` },
    ] },
    { id: "hebergement", nav: "Hébergement", title: "Hébergement", blocks: [
      { type: "card", rows: [
        { label: "Hébergeur", value: legalPlaceholders.host },
        { label: "Adresse", value: legalPlaceholders.hostAddress },
        { label: "Site", value: legalPlaceholders.hostSite },
      ] },
    ] },
    { id: "conception", nav: "Conception du site", title: "Conception du site", blocks: [
      { type: "card", rows: [
        { label: "Design et développement", value: legalPlaceholders.designer },
        { label: "Site", value: legalPlaceholders.designerSite },
      ] },
    ] },
    { id: "propriete", nav: "Propriété intellectuelle", title: "Propriété intellectuelle", blocks: [
      { type: "paragraph", text: "Textes, photographies, logo, nuancier, éléments graphiques et code : l’ensemble du site appartient à Rétro Color ou à ses partenaires et est protégé par le Code de la propriété intellectuelle." },
      { type: "paragraph", text: "Toute reproduction, représentation ou adaptation, totale ou partielle, sans accord écrit préalable est interdite et constitue une contrefaçon (articles L.335-2 et suivants du Code de la propriété intellectuelle)." },
    ] },
    { id: "photos", nav: "Photos des réalisations", title: "Photos des réalisations", blocks: [
      { type: "paragraph", text: "Les pièces présentées dans la galerie ont toutes été traitées à l’atelier. Elles sont publiées avec l’accord de leurs propriétaires, sans plaque, numéro de série ni information permettant de les identifier." },
      { type: "callout", text: "Une photo vous concerne et vous préférez qu’elle n’apparaisse plus ? Écrivez-nous : nous la retirons dans les meilleurs délais." },
    ] },
    { id: "responsabilite", nav: "Responsabilité", title: "Responsabilité", blocks: [
      { type: "paragraph", text: "Services, délais, finitions et teintes RAL sont présentés à titre indicatif : seul le devis accepté fait foi. Le rendu d’une couleur à l’écran peut différer de la teinte réelle ; en cas de doute, demandez une plaquette témoin." },
      { type: "paragraph", text: "Rétro Color ne peut être tenu responsable d’une interruption du site, d’un problème technique ou du contenu des sites externes vers lesquels il renvoie." },
    ] },
    { id: "donnees", nav: "Données personnelles", title: "Données personnelles et cookies", blocks: [
      { type: "paragraph", text: "Les informations envoyées via le formulaire de devis servent uniquement à vous répondre. Ce que nous collectons, combien de temps nous le gardons, vos droits et la gestion des cookies : tout est détaillé dans notre politique de confidentialité." },
      { type: "link", label: "Lire la politique de confidentialité →", href: "/politique-de-confidentialite" },
    ] },
    { id: "mediation", nav: "Médiation", title: "Médiation de la consommation", blocks: [
      { type: "paragraph", text: "Vous êtes un particulier et un litige n’a pas pu être réglé directement avec l’atelier ? Vous pouvez saisir gratuitement le médiateur de la consommation dont relève Rétro Color (articles L.612-1 et suivants du Code de la consommation)." },
      { type: "card", rows: [
        { label: "Médiateur", value: legalPlaceholders.mediator },
        { label: "Site et adresse", value: legalPlaceholders.mediatorAddress },
      ] },
    ] },
    { id: "droit", nav: "Droit applicable", title: "Droit applicable", blocks: [
      { type: "paragraph", text: "Les présentes mentions sont régies par le droit français. En cas de litige, et à défaut d’accord amiable, les tribunaux français sont seuls compétents." },
    ] },
  ],
  cta: { title: "Une question sur ces informations ?", text: "L’atelier répond du lundi au vendredi, de 9h à 12h et de 13h30 à 18h." },
};

export const politiqueConfidentialite: LegalPageContent = {
  breadcrumb: "Politique de confidentialité",
  title: "Politique de confidentialité",
  introduction: "Ce que nous faisons de vos données, pourquoi, combien de temps, et comment garder la main dessus. En résumé : le strict nécessaire pour vous répondre, rien de plus.",
  readingMinutes: 6,
  sections: [
    { id: "en-bref", nav: "En bref", title: "En bref", blocks: [
      { type: "list", items: [
        { lead: "Pas de revente", text: "vos données ne sont ni vendues ni louées, à personne." },
        { lead: "Le strict nécessaire", text: "nous ne demandons que ce qu’il faut pour établir un devis." },
        { lead: "Pas de pistage sans accord", text: "la mesure d’audience reste désactivée tant que vous ne l’acceptez pas." },
        { lead: "Vos droits, simplement", text: "un e-mail suffit pour consulter, corriger ou effacer vos données." },
      ] },
    ] },
    { id: "responsable", nav: "Responsable du traitement", title: "Responsable du traitement", blocks: [
      { type: "paragraph", text: `Le responsable du traitement de vos données est Rétro Color, 17 rue Louis Armand, 77330 Ozoir-la-Ferrière, représenté par ${legalPlaceholders.director}.` },
      { type: "card", rows: [
        { label: "Contact données", value: "retrocolor77330@gmail.com" },
        { label: "Téléphone", value: "06 23 14 67 07" },
      ] },
    ] },
    { id: "collecte", nav: "Données collectées", title: "Données collectées", blocks: [
      { type: "paragraph", text: "Nous collectons uniquement les informations que vous nous transmettez, et quelques données techniques indispensables au fonctionnement du site." },
      { type: "card", rows: [
        { label: "Formulaire de devis", value: "Nom, prénom ou société, e-mail, téléphone, description de la pièce et du traitement souhaité" },
        { label: "Photos de pièces", value: "Uniquement si vous en joignez à votre demande" },
        { label: "Échanges", value: "E-mails, appels et messages liés à votre projet" },
        { label: "Données techniques", value: "Adresse IP, type de navigateur, pages consultées (journaux de l’hébergeur)" },
      ] },
      { type: "callout", text: "Inutile de nous transmettre des informations sensibles (santé, opinions…) : elles ne nous servent pas pour établir un devis." },
    ] },
    { id: "finalites", nav: "Finalités et bases légales", title: "Pourquoi nous les utilisons", blocks: [
      { type: "table", headers: ["Finalité", "Base légale", "Référence RGPD"], rows: [
        ["Répondre à votre demande de devis", "Mesures précontractuelles", "Article 6.1.b"],
        ["Réaliser et facturer la prestation", "Contrat et obligation légale", "Article 6.1.b et c"],
        ["Assurer la sécurité du site", "Intérêt légitime", "Article 6.1.f"],
        ["Mesurer l’audience du site", "Votre consentement", "Article 6.1.a"],
      ] },
    ] },
    { id: "durees", nav: "Durées de conservation", title: "Combien de temps", blocks: [
      { type: "table", headers: ["Données", "Durée", "Point de départ"], rows: [
        ["Demande de devis sans suite", "3 ans", "Dernier contact"],
        ["Dossier client", "Durée de la prestation + 3 ans", "Fin de la relation"],
        ["Factures et pièces comptables", "10 ans", "Clôture de l’exercice"],
        ["Journaux techniques", "1 an", "Date de la visite"],
        ["Choix en matière de cookies", "6 mois", "Date du choix"],
      ] },
      { type: "paragraph", text: "Passé ces délais, les données sont supprimées ou rendues anonymes." },
    ] },
    { id: "destinataires", nav: "Destinataires", title: "Qui y a accès", blocks: [
      { type: "paragraph", text: "Vos données sont lues uniquement par l’équipe de l’atelier. Elles ne sont jamais vendues, louées ni cédées. Quelques prestataires techniques y accèdent, strictement pour faire fonctionner nos outils :" },
      { type: "card", rows: [
        { label: legalPlaceholders.host, value: "Hébergement du site et réception des formulaires" },
        { label: "Google (Gmail)", value: "Messagerie de l’atelier" },
        { label: legalPlaceholders.analytics, value: "Statistiques de visite, seulement si vous les acceptez" },
      ] },
    ] },
    { id: "transferts", nav: "Transferts hors UE", title: "Transferts hors Union européenne", blocks: [
      { type: "paragraph", text: `${legalPlaceholders.host} est établi ${legalPlaceholders.hostCountry}. Google est établi aux États-Unis. Les transferts hors Union européenne sont encadrés par le cadre de protection des données UE–États-Unis (Data Privacy Framework) et, à défaut, par les clauses contractuelles types de la Commission européenne.` },
    ] },
    { id: "droits", nav: "Vos droits", title: "Vos droits", blocks: [
      { type: "list", items: [
        { lead: "Accès", text: "savoir quelles données nous détenons sur vous." },
        { lead: "Rectification", text: "corriger une information inexacte." },
        { lead: "Effacement", text: "faire supprimer vos données." },
        { lead: "Opposition et limitation", text: "refuser ou restreindre un traitement." },
        { lead: "Portabilité", text: "récupérer vos données dans un format lisible." },
        { lead: "Retrait du consentement", text: "à tout moment, pour les cookies." },
        { lead: "Directives post-mortem", text: "décider du sort de vos données après votre décès." },
      ] },
      { type: "paragraph", text: "Pour exercer ces droits, écrivez à retrocolor77330@gmail.com ou par courrier à l’atelier. Nous répondons sous un mois au plus tard. Une pièce d’identité ne vous sera demandée qu’en cas de doute raisonnable sur votre identité." },
      { type: "callout", text: "Réponse insatisfaisante ? Vous pouvez adresser une réclamation à la CNIL : cnil.fr, 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07." },
    ] },
    { id: "cookies", nav: "Cookies", title: "Cookies", blocks: [
      { type: "paragraph", text: "Un cookie est un petit fichier déposé sur votre appareil pendant la visite. Nous en utilisons le moins possible : seuls les cookies nécessaires sont actifs par défaut, les autres attendent votre accord." },
      { type: "table", headers: ["Catégorie", "Rôle", "Durée"], rows: [
        ["Nécessaires · toujours actifs", "Mémoriser vos choix, sécuriser le formulaire", "6 mois"],
        ["Mesure d’audience", "Compter les visites et les pages vues, de façon agrégée (Google Analytics)", "13 mois maximum"],
        ["Contenus externes", "Afficher la carte d’accès à l’atelier (Google Maps)", "Selon le service"],
      ] },
      { type: "paragraph", text: "Vous pouvez changer d’avis à tout moment grâce au lien « Gérer les cookies » en bas de chaque page. Votre choix est conservé 6 mois, puis nous vous reposons la question." },
    ] },
    { id: "securite", nav: "Sécurité", title: "Sécurité", blocks: [
      { type: "paragraph", text: "Le site est servi en HTTPS, et l’accès aux outils de l’atelier est protégé par mot de passe et réservé aux personnes qui en ont besoin. Si un incident venait à toucher vos données, nous vous préviendrions dans les meilleurs délais." },
    ] },
    { id: "mises-a-jour", nav: "Mises à jour", title: "Mises à jour", blocks: [
      { type: "paragraph", text: "Cette politique peut évoluer avec le site ou la réglementation. La date de dernière mise à jour figure en haut de cette page." },
    ] },
  ],
  cta: { title: "Exercer vos droits", text: "Un e-mail suffit : nous vous répondons sous un mois au plus tard." },
};
