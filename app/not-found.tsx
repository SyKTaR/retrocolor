import Link from "next/link";

export default function NotFound() {
  return <main className="not-found"><div className="container"><h1 className="heading-l">Page introuvable</h1><p>Cette page n’existe pas ou a changé d’adresse.</p><Link className="button" href="/">Retour à l’accueil</Link></div></main>;
}
