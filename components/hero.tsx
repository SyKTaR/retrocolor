import { HeroWorkshopLayer } from "./hero-workshop-layer";

export function Hero() {
  return <section data-hero className="section hero"><HeroWorkshopLayer>
    <h1 data-split="hero" className="heading-xl hero-title">Sablage et peinture de pièces métalliques.</h1>
    <div className="hero-body"><p data-blur="hero" className="text-lead hero-text">Atelier de traitement de surface à Ozoir-la-Ferrière, en Seine-et-Marne. Nous décapons et repeignons vos pièces, à l’unité ou en série, pour les professionnels comme pour les particuliers.</p>
      <div data-anim="hero-fade" className="hero-actions"><a href="#contact" className="button">Demander un devis</a><a href="#realisations" className="text-link">Voir les réalisations</a></div>
    </div>
  </HeroWorkshopLayer></section>;
}
