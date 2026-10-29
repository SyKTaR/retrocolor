"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { HeroWorkshop } from "@/components/hero-workshop";

// Client wrapper so that Hero stays a Server Component: it owns the ref on the copy block
// (title + text + CTA) that the 3D scene positions itself under. The engine is only
// requested after the server-rendered title has painted, so the LCP stays the heading.
export function HeroWorkshopLayer({ children }: { children: ReactNode }) {
  const copyRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        if ("requestIdleCallback" in window) idle = window.requestIdleCallback(() => setReady(true), { timeout: 1800 });
        else timer = setTimeout(() => setReady(true), 100);
      });
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      clearTimeout(timer);
    };
  }, []);

  return <>
    {ready ? <HeroWorkshop copyRef={copyRef} /> : null}
    <div ref={copyRef} className="container hero-inner">{children}</div>
  </>;
}
