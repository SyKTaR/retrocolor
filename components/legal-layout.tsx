"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { site } from "@/lib/content";
import { legalPlaceholders, type LegalBlock, type LegalPageContent } from "@/lib/legal-content";

const placeholderValues = new Set<string>(Object.values(legalPlaceholders));
const placeholderPattern = /(\[[^\]]+\])/g;

function RichText({ text }: { text: string }) {
  return <>{text.split(placeholderPattern).map((part, index) => (part.startsWith("[") && placeholderValues.has(part))
    ? <span className="legal-placeholder" key={`${index}-${part}`}>{part}</span>
    : part)}</>;
}

export function KeyValueCard({ rows }: { rows: { label: string; value: string }[] }) {
  return <dl className="legal-card">{rows.map((row) => <div className="legal-card-row" key={row.label}>
    <dt><RichText text={row.label} /></dt><dd><RichText text={row.value} /></dd>
  </div>)}</dl>;
}

export function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <div className="legal-table-scroll" tabIndex={0} role="region" aria-label={`Tableau : ${headers.join(", ")}`}>
    <table className="legal-table"><thead><tr>{headers.map((heading) => <th scope="col" key={heading}>{heading}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}><RichText text={cell} /></td>)}</tr>)}</tbody>
    </table>
  </div>;
}

export function Callout({ children }: { children: ReactNode }) {
  return <aside className="legal-callout">{children}</aside>;
}

function LegalBlockView({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case "paragraph": return <p className="legal-paragraph"><RichText text={block.text} /></p>;
    case "card": return <KeyValueCard rows={block.rows} />;
    case "table": return <DataTable headers={block.headers} rows={block.rows} />;
    case "callout": return <Callout><RichText text={block.text} /></Callout>;
    case "link": return <a className="legal-inline-link" href={block.href}>{block.label}</a>;
    case "list": return <ul className="legal-list">{block.items.map((item) => <li key={item.lead}><strong>{item.lead}</strong> : {item.text}</li>)}</ul>;
  }
}

export function LegalSection({ section, number }: { section: LegalPageContent["sections"][number]; number: number }) {
  return <section id={section.id} className="legal-section" aria-labelledby={`${section.id}-heading`}>
    <span className="legal-section-number">{String(number).padStart(2, "0")}</span>
    <h2 id={`${section.id}-heading`}>{section.title}</h2>
    <div className="legal-section-blocks">{section.blocks.map((block, index) => <LegalBlockView block={block} key={`${block.type}-${index}`} />)}</div>
  </section>;
}

export function LegalLayout({ content }: { content: LegalPageContent }) {
  const [activeId, setActiveId] = useState(content.sections[0].id);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let active = content.sections[0].id;
        for (const section of content.sections) {
          const element = document.getElementById(section.id);
          if (element && element.getBoundingClientRect().top <= 190) active = section.id;
        }
        setActiveId(active);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [content.sections]);

  return <div id="top" className="page-wrapper legal-page">
    <Header />
    <main className="legal-main container">
      <header className="legal-hero">
        <nav className="legal-breadcrumb" aria-label="Fil d’Ariane"><a href="/">Accueil</a><span aria-hidden="true">/</span><span aria-current="page">{content.breadcrumb}</span></nav>
        <h1>{content.title}</h1>
        <p>{content.introduction}</p>
        <div className="legal-meta"><span>Mise à jour le 27 octobre 2026</span><span>Lecture · {content.readingMinutes} min</span></div>
      </header>
      <div className="legal-columns">
        <aside className="legal-aside" aria-label="Sommaire et contact">
          <div className="legal-aside-sticky"><span className="legal-aside-label">Sommaire</span>
            <nav className="legal-summary" aria-label="Sommaire de la page">{content.sections.map((section, index) => <a className={activeId === section.id ? "is-active" : ""} aria-current={activeId === section.id ? "location" : undefined} href={`#${section.id}`} key={section.id}><span>{String(index + 1).padStart(2, "0")}</span>{section.nav}</a>)}</nav>
            <div className="legal-help"><strong>Une question ?</strong><a href={site.phoneHref}>{site.phone}</a><a href={site.emailHref}>{site.email}</a></div>
          </div>
        </aside>
        <div className="legal-content">{content.sections.map((section, index) => <LegalSection section={section} number={index + 1} key={section.id} />)}
          <div className="legal-cta"><div><strong>{content.cta.title}</strong><p>{content.cta.text}</p></div><a href={site.emailHref}>Écrire à l’atelier <span aria-hidden="true">→</span></a></div>
        </div>
      </div>
    </main>
    <Footer />
  </div>;
}
