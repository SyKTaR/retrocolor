"use client";

import { useState } from "react";
import Image from "next/image";
import { moreWorks, works } from "@/lib/content";

type WorkItem = (typeof works)[number] | (typeof moreWorks)[number];

const imageSizes: Record<string, [number, number]> = {
  "/images/realisation-carenage-moto.jpeg": [1380, 1240],
  "/images/realisation-decoration-restaurant.jpeg": [1068, 1240],
  "/images/realisation-caisson-climatisation.jpeg": [768, 782],
  "/images/realisation-chassis-serie.jpeg": [768, 782],
  "/images/realisation-bloc-moteur.jpeg": [766, 782],
  "/images/realisation-piece-ronde-rouge.jpeg": [1122, 1402],
  "/images/realisation-caisson-rose.jpeg": [1122, 1402],
  "/images/realisation-jante-jaune.jpeg": [1122, 1402],
  "/images/realisation-panneau-signalisation.jpeg": [1122, 1402],
  "/images/realisation-cadre-bras-oscillant.jpeg": [1122, 1402],
};

function Work({ work, tall, portrait }: { work: WorkItem; tall?: boolean; portrait?: boolean }) {
  const [width, height] = imageSizes[work.image];
  return <figure data-work className="work"><div data-work-media className={`work-media${tall ? " is-tall" : ""}${portrait ? " is-portrait" : ""}`}><Image src={work.image} alt={work.alt} width={width} height={height} sizes={tall ? "(max-width: 767px) 90vw, 48vw" : "(max-width: 767px) 90vw, (max-width: 1199px) 48vw, 32vw"} loading="lazy" className="work-image" /></div>
    <figcaption className="work-caption"><span className="work-name">{work.name}</span><span className="work-finish">{work.swatches.map((swatch) => <span className={`swatch ${swatch}`} aria-hidden="true" key={swatch} />)}<span className="work-finish-label">{work.finish}</span></span></figcaption>
  </figure>;
}

export function Works() {
  const [expanded, setExpanded] = useState(false);
  return <section id="realisations" className="section works"><div className="container works-inner">
    <div className="works-head"><h2 data-split="lines" className="heading-l works-title">Voici nos sorties d’atelier.</h2></div>
    <div className="works-row is-two">{works.slice(0, 2).map((work) => <Work key={work.image} work={work} tall />)}</div>
    <div className="works-row is-three">{works.slice(2).map((work) => <Work key={work.image} work={work} />)}</div>
    {expanded ? <div id="realisations-suite" className="works-more">
      <div className="works-row is-three">{moreWorks.slice(0, 3).map((work) => <Work key={work.image} work={work} portrait />)}</div>
      <div className="works-row is-two-even">{moreWorks.slice(3).map((work) => <Work key={work.image} work={work} portrait />)}</div>
    </div> : null}
    <div className="works-more-action"><button type="button" className="button is-secondary" aria-expanded={expanded} aria-controls="realisations-suite" onClick={() => { if (expanded) document.getElementById("realisations")?.scrollIntoView({ behavior: "smooth", block: "start" }); setExpanded(!expanded); }}>{expanded ? "Voir moins" : "Voir plus"}</button></div>
  </div></section>;
}
