import { services } from "@/lib/content";
import Image from "next/image";

export function Services() {
  return <section id="services" className="section services"><div className="container services-inner">
    <div className="section-head"><h2 data-split="lines" className="heading-l">Quatre procédés,<br />un seul atelier.</h2></div>
    <div data-rack className="services-rack"><div data-rack-rail className="services-rail" /><div className="services-grid">
      {services.map((service) => <article data-rack-item className="service-card" key={service.title}>
        <div className="service-hook" />
        <div data-panel className={`service-panel ${service.panelClass}`}>
          <Image src={service.image} alt={service.alt} className="service-panel-image" width={564} height={720} sizes="(max-width: 767px) 90vw, (max-width: 1199px) 45vw, 24vw" loading="lazy" />
          <div className="service-panel-wire" /><div className="service-panel-hole" />
          {service.before && <span className="service-panel-before">{service.before}</span>}
          <span className={`service-panel-tag${service.tagDark ? " is-dark" : ""}`}>{service.tag}</span>
        </div>
        <div className="service-sheet"><div className="service-sheet-head"><h3 className="heading-s">{service.title}</h3><p className="text-body">{service.description}</p></div>
          {service.specs.map((spec, index) => <div key={spec.label} className={`spec-row${index === service.specs.length - 1 ? " is-last" : ""}`}><span className="spec-label">{spec.label}</span><span className="spec-value">{spec.value}</span></div>)}
        </div>
      </article>)}
    </div></div>
    <div data-anim="fade-up" className="cta-banner"><div className="cta-banner-text"><strong data-blur className="cta-banner-title">Votre pièce ne rentre dans aucune case ?</strong><span data-blur className="cta-banner-sub">Décrivez-la : nous étudions chaque demande, tous les travaux sont réalisés sur devis.</span></div><a href="#contact" className="button is-secondary">Décrire ma pièce</a></div>
  </div></section>;
}
