"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";

const STORAGE_KEY = "rc_consent";
export const CONSENT_VERSION = 1;

export type CookieConsent = {
  version: number;
  audience: boolean;
  external: boolean;
  savedAt: number;
  expiresAt: number;
};

export function getStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const consent = value as Partial<CookieConsent>;
    if (consent.version !== CONSENT_VERSION || typeof consent.audience !== "boolean" || typeof consent.external !== "boolean" || typeof consent.savedAt !== "number" || typeof consent.expiresAt !== "number" || consent.expiresAt <= Date.now()) return null;
    return consent as CookieConsent;
  } catch { return null; }
}

export function hasAudienceConsent(): boolean {
  return getStoredConsent()?.audience === true;
}

type ConsentContextValue = {
  consent: CookieConsent | null;
  ready: boolean;
  openPreferences: () => void;
  allowExternal: () => void;
};
const ConsentContext = createContext<ConsentContextValue | null>(null);

export function useCookieConsent() {
  const context = useContext(ConsentContext);
  if (!context) throw new Error("useCookieConsent must be used within CookieConsentProvider");
  return context;
}

function ChoiceButton({ checked, disabled = false, label, onClick }: { checked: boolean; disabled?: boolean; label: string; onClick?: () => void }) {
  return <button type="button" role="switch" aria-label={label} aria-checked={checked} aria-disabled={disabled || undefined} disabled={disabled} onClick={onClick} className={`cookie-switch${checked ? " is-on" : ""}`}><span /></button>;
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [ready, setReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [audience, setAudience] = useState(false);
  const [external, setExternal] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setConsent(getStoredConsent());
    setReady(true);
    const sync = (event: StorageEvent) => { if (event.key === STORAGE_KEY) setConsent(getStoredConsent()); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const save = useCallback((nextAudience: boolean, nextExternal: boolean) => {
    const now = Date.now();
    const expiry = new Date(now);
    expiry.setMonth(expiry.getMonth() + 6);
    const next: CookieConsent = { version: CONSENT_VERSION, audience: nextAudience, external: nextExternal, savedAt: now, expiresAt: expiry.getTime() };
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* Storage can be unavailable in private mode. */ }
    setConsent(next);
    setModalOpen(false);
  }, []);

  const openPreferences = useCallback(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setAudience(consent?.audience ?? false);
    setExternal(consent?.external ?? false);
    setModalOpen(true);
  }, [consent]);
  const allowExternal = useCallback(() => save(consent?.audience ?? false, true), [consent, save]);
  const closePreferences = useCallback(() => {
    setModalOpen(false);
    requestAnimationFrame(() => returnFocusRef.current?.focus());
  }, []);

  useEffect(() => {
    const banner = bannerRef.current;
    if (!banner || !ready || consent) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tween = gsap.fromTo(banner, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.55, ease: "power3.out" });
    return () => { tween.kill(); gsap.set(banner, { clearProps: "transform,opacity,visibility" }); };
  }, [ready, consent]);

  useEffect(() => {
    if (!modalOpen) return;
    const modal = modalRef.current;
    if (!modal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closePreferences(); return; }
      if (event.key !== "Tab") return;
      const focusable = Array.from(modal.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    let tween: gsap.core.Tween | undefined;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) tween = gsap.fromTo(modal, { y: 18, autoAlpha: 0, scale: 0.98 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.4, ease: "power3.out" });
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      tween?.kill();
    };
  }, [modalOpen, closePreferences]);

  return <ConsentContext.Provider value={{ consent, ready, openPreferences, allowExternal }}>
    {children}
    {ready && !consent && !modalOpen && <div ref={bannerRef} className="cookie-banner" role="region" aria-label="Choix des cookies">
      <div className="cookie-banner-title"><span className="cookie-mark" aria-hidden="true"><i /><i /><i /></span><strong>Quelques cookies, pas plus</strong></div>
      <p>Certains cookies sont indispensables au site. Avec votre accord, nous en utilisons aussi pour mesurer l’audience et savoir quelles pages vous sont utiles. Aucun cookie publicitaire.</p>
      <a href="/politique-de-confidentialite">Lire la politique de confidentialité</a>
      <div className="cookie-banner-actions"><button type="button" onClick={() => save(false, false)}>Tout refuser</button><button type="button" onClick={() => save(true, true)}>Tout accepter</button></div>
      <button type="button" className="cookie-customize" onClick={openPreferences}>Personnaliser mes choix</button>
    </div>}
    {modalOpen && <div className="cookie-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) closePreferences(); }}>
      <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="cookie-dialog-title" aria-describedby="cookie-dialog-description" className="cookie-dialog">
        <div className="cookie-dialog-body"><button ref={closeRef} type="button" className="cookie-close" aria-label="Fermer les préférences cookies" onClick={closePreferences}><svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></button>
          <h2 id="cookie-dialog-title">Vos préférences cookies</h2>
          <p id="cookie-dialog-description">Activez uniquement ce qui vous convient. Vous pourrez changer d’avis à tout moment grâce au lien « Gérer les cookies » en bas de page.</p>
          <div className="cookie-options">
            <div className="cookie-option"><div className="cookie-option-heading"><strong>Nécessaires</strong><span>Toujours actifs</span></div><ChoiceButton checked disabled label="Cookies nécessaires, toujours actifs" /><p>Indispensables au fonctionnement du site : mémoriser vos choix, sécuriser le formulaire de devis. Ils ne peuvent pas être désactivés.</p></div>
            <div className="cookie-option"><div className="cookie-option-heading"><strong>Mesure d’audience</strong></div><ChoiceButton checked={audience} label="Autoriser la mesure d’audience" onClick={() => setAudience((value) => !value)} /><p>Comptent les visites et les pages consultées, de façon agrégée, pour améliorer le site. Conservés 13 mois maximum.</p></div>
            <div className="cookie-option"><div className="cookie-option-heading"><strong>Contenus externes</strong></div><ChoiceButton checked={external} label="Autoriser les contenus externes" onClick={() => setExternal((value) => !value)} /><p>Affichent la carte d’accès à l’atelier (Google Maps). Google peut alors déposer ses propres cookies.</p></div>
          </div>
        </div>
        <div className="cookie-dialog-footer"><a href="/politique-de-confidentialite">Politique de confidentialité</a><div className="cookie-dialog-actions"><button type="button" onClick={() => save(false, false)}>Tout refuser</button><button type="button" onClick={() => save(true, true)}>Tout accepter</button><button type="button" className="is-primary" onClick={() => save(audience, external)}>Enregistrer</button></div></div>
      </div>
    </div>}
  </ConsentContext.Provider>;
}
