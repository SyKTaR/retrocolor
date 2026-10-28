"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import { navigation, site } from "@/lib/content";
import { Logo } from "./logo";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function Header() {
  const isHome = usePathname() === "/";
  const scope = useRef<HTMLElement>(null);
  const openRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [activeHref, setActiveHref] = useState("#services");

  useGSAP(() => {
    if (!isHome) return;
    // Création différée : au rechargement d'une page déjà scrollée, ScrollTrigger
    // doit avoir fini son premier calcul de positions avant d'ajouter des déclencheurs.
    let cancelled = false;
    const triggers: ScrollTrigger[] = [];
    const frame = requestAnimationFrame(() => {
      if (cancelled) return;
      navigation.forEach((item) => {
        const section = document.getElementById(item.href.slice(1));
        if (!section) return;
        triggers.push(
          ScrollTrigger.create({
            trigger: section,
            start: "top center",
            end: "bottom center",
            onToggle: (self) => {
              if (self.isActive) setActiveHref(item.href);
            },
          }),
        );
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      triggers.forEach((trigger) => trigger.kill());
    };
  }, { scope, dependencies: [isHome] });

  const setMenu = useCallback((next: boolean) => {
    if (openRef.current === next) return;
    const header = scope.current;
    const menu = header?.querySelector<HTMLElement>("[data-nav-menu]");
    const lines = header?.querySelectorAll<HTMLElement>(".nav-toggle-line");
    if (!menu || !lines || lines.length < 2) return;

    openRef.current = next;
    setOpen(next);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      || !window.matchMedia("(max-width: 991px)").matches;
    const links = menu.querySelectorAll<HTMLElement>(".nav-link");
    gsap.killTweensOf([menu, ...Array.from(links), ...Array.from(lines)]);
    gsap.to(lines[0], { y: next ? 3.75 : 0, rotation: next ? 45 : 0, duration: reduce ? 0 : 0.35, ease: "power3.inOut" });
    gsap.to(lines[1], { y: next ? -3.75 : 0, rotation: next ? -45 : 0, duration: reduce ? 0 : 0.35, ease: "power3.inOut" });

    if (next) {
      gsap.set(menu, { display: "flex" });
      gsap.fromTo(menu, { autoAlpha: 0, y: -12, scale: 0.98 }, { autoAlpha: 1, y: 0, scale: 1, duration: reduce ? 0 : 0.4, ease: "power3.out" });
      gsap.fromTo(links, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: reduce ? 0 : 0.45, stagger: reduce ? 0 : 0.05, delay: reduce ? 0 : 0.05, ease: "power3.out" });
    } else {
      gsap.to(menu, {
        autoAlpha: 0, y: -12, scale: 0.98, duration: reduce ? 0 : 0.25, ease: "power2.in",
        onComplete: () => {
          if (openRef.current) return;
          gsap.set(menu, { clearProps: "display,opacity,visibility,transform" });
          gsap.set(links, { clearProps: "opacity,visibility,transform" });
        },
      });
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && openRef.current) {
        setMenu(false);
        scope.current?.querySelector<HTMLButtonElement>("[data-nav-toggle]")?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      const header = scope.current;
      if (!(target instanceof Node) || !header || !openRef.current) return;
      const menu = header.querySelector("[data-nav-menu]");
      const toggle = header.querySelector("[data-nav-toggle]");
      if (!menu?.contains(target) && !toggle?.contains(target)) setMenu(false);
    };
    const mobile = window.matchMedia("(max-width: 991px)");
    const onBreakpoint = () => { if (!mobile.matches) setMenu(false); };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    mobile.addEventListener("change", onBreakpoint);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      mobile.removeEventListener("change", onBreakpoint);
      const header = scope.current;
      if (header) gsap.killTweensOf(header.querySelectorAll(".nav-toggle-line, .nav-menu, .nav-link"));
    };
  }, [setMenu]);

  return <header data-nav ref={scope} className="nav"><div className="nav-inner">
    <Logo />
    <nav data-nav-menu aria-label="Navigation principale" id="main-menu" className="nav-menu">
      {navigation.map((item) => <a key={item.href} href={isHome ? item.href : `/${item.href}`} className={`nav-link${isHome && activeHref === item.href ? " is-active" : ""}`} aria-current={isHome && activeHref === item.href ? "location" : undefined} onClick={() => setMenu(false)}>{item.label}</a>)}
      <a href={isHome ? "#contact" : "/#contact"} className="button nav-menu-cta" onClick={() => setMenu(false)}>Demander un devis</a>
    </nav>
    <div className="nav-actions">
      <a href={site.phoneHref} className="nav-call" aria-label={`Appeler l’atelier au ${site.phone}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6.6 3.5h3l1.4 4-2 1.4a12 12 0 0 0 6.1 6.1l1.4-2 4 1.4v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg></a>
      <a href={isHome ? "#contact" : "/#contact"} className="button is-small is-nav" onClick={() => setMenu(false)}>Demander un devis</a>
      <button type="button" data-nav-toggle className="nav-toggle" aria-controls="main-menu" aria-expanded={open} aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} onClick={() => setMenu(!openRef.current)}><span className="nav-toggle-line" /><span className="nav-toggle-line" /></button>
    </div>
  </div></header>;
}
