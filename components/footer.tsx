"use client";

import { usePathname } from "next/navigation";
import { navigation, site } from "@/lib/content";
import { useCookieConsent } from "./cookie-consent";
import { Logo } from "./logo";

export function Footer() {
  const isHome = usePathname() === "/";
  const { openPreferences } = useCookieConsent();
  return <footer className="section footer"><div className="container footer-inner">
    <div className="footer-top"><div className="footer-brand"><Logo light /><p className="footer-text">Sablage et peinture de pièces métalliques à Ozoir-la-Ferrière.</p></div>
      <div className="footer-col"><span className="footer-heading">Site</span>{navigation.map((item) => <a href={isHome ? item.href : `/${item.href}`} className="footer-link" key={item.href}>{item.label}</a>)}</div>
      <div className="footer-col"><span className="footer-heading">Atelier</span><span className="footer-link">{site.address[0]}</span><span className="footer-link">{site.address[1]}</span><span className="footer-link">Lun–ven, 9h–12h et 13h30–18h</span></div>
      <div className="footer-col"><span className="footer-heading">Contact</span><a href={site.phoneHref} className="footer-link">{site.phone}</a><a href={site.emailHref} className="footer-link">{site.email}</a></div>
    </div>
    <div className="footer-bottom"><span className="footer-legal">© 2026 Rétro Color</span><div className="footer-legal-links"><a href="/mentions-legales" className="footer-legal">Mentions légales</a><a href="/politique-de-confidentialite" className="footer-legal">Confidentialité</a><button type="button" className="footer-legal footer-cookie-link" onClick={openPreferences}>Gérer les cookies</button></div></div>
  </div></footer>;
}
