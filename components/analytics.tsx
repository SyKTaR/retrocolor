"use client";

import { useEffect } from "react";
import Script from "next/script";
import { useCookieConsent } from "./cookie-consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

function clearGoogleCookies() {
  const hostParts = window.location.hostname.split(".");
  const domains = [window.location.hostname, `.${hostParts.slice(-2).join(".")}`];
  document.cookie.split(";").map((c) => c.split("=")[0].trim()).filter((n) => n === "_ga" || n.startsWith("_ga_")).forEach((name) => {
    domains.forEach((domain) => { document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`; });
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
}

/** Google Analytics 4 : chargé uniquement si la personne a accepté la « Mesure d’audience ». */
export function Analytics() {
  const { consent } = useCookieConsent();
  const allowed = Boolean(GA_ID) && consent?.audience === true;

  useEffect(() => {
    if (!GA_ID) return;
    window[`ga-disable-${GA_ID}`] = !allowed;
    if (!allowed) clearGoogleCookies();
  }, [allowed]);

  if (!GA_ID || !allowed) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', '${GA_ID}', { anonymize_ip: true });
      `}</Script>
    </>
  );
}
