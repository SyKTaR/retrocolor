"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

function all<T extends Element>(scope: ParentNode, selector: string) {
  return Array.from(scope.querySelectorAll<T>(selector));
}

export function Animations({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  useGSAP((_, contextSafe) => {
    const root = scope.current;
    if (!root || !contextSafe) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    const splits: SplitText[] = [];
    const cleanups: Array<() => void> = [];

    const initialize = contextSafe(() => {
      if (cancelled) return;
      const navIslands = all<HTMLElement>(root, "[data-nav] .nav-logo, [data-nav] .nav-menu, [data-nav] .nav-actions")
        .filter((element) => element.offsetParent !== null);
      if (navIslands.length) gsap.from(navIslands, {
        y: -24, autoAlpha: 0, duration: 0.9, ease: "power3.out", stagger: 0.08,
        clearProps: "transform,opacity,visibility",
      });

      // Titres : 1re ligne en « blur-in » (flou -> net), lignes suivantes révélées par un balayage net de gauche à droite.
      // Le texte reste dans le DOM ; SplitText ne découpe qu'en lignes.
      const blurIn = { filter: "blur(14px)", autoAlpha: 0 };
      const sharp = { filter: "blur(0px)", autoAlpha: 1, clearProps: "filter,opacity,visibility" };
      all<HTMLElement>(root, "[data-split]").forEach((element) => {
        const hero = element.dataset.split === "hero";
        const split = SplitText.create(element, {
          type: "lines",
          autoSplit: true,
          onSplit: (self) => {
            const lines = self.lines as HTMLElement[];
            const timeline = gsap.timeline({
              delay: hero ? 0.2 : 0,
              ...(hero ? {} : { scrollTrigger: { trigger: element, start: "top 88%", toggleActions: "play none none none" } }),
            });
            gsap.set(element, { autoAlpha: 1 });
            let cursor = 0;
            lines.forEach((line, index) => {
              if (index === 0) {
                timeline.fromTo(line, blurIn, { ...sharp, duration: 0.8, ease: "power2.out" }, cursor);
                cursor += 0.5;
                return;
              }
              const range = document.createRange();
              range.selectNodeContents(line);
              const text = range.getBoundingClientRect();
              const box = line.getBoundingClientRect();
              const from = text.left - box.left - 6;
              const to = text.right - box.left + 6;
              const state = { x: from };
              const draw = () => { line.style.clipPath = `inset(-25% ${Math.max(box.width - state.x, 0)}px -25% 0)`; };
              draw();
              timeline.to(state, {
                x: to, duration: Math.min(Math.max(0.55 + (to - from) / 1500, 0.7), 1.3), ease: "power1.out", onUpdate: draw,
                onComplete: () => { line.style.clipPath = ""; },
              }, cursor);
              cursor += 0.3;
            });
            return timeline;
          },
        });
        splits.push(split);
      });

      // Textes courants : même « blur-in », sans déplacement.
      all<HTMLElement>(root, "[data-blur]").forEach((element) => {
        const hero = element.dataset.blur === "hero";
        gsap.fromTo(element, blurIn, {
          ...sharp, duration: 0.9, ease: "power2.out", delay: hero ? 0.9 : 0,
          ...(hero ? {} : { scrollTrigger: { trigger: element, start: "top 88%", toggleActions: "play none none none" } }),
        });
      });

      gsap.fromTo(all(root, '[data-anim="hero-fade"]'), blurIn, { ...sharp, duration: 0.9, ease: "power2.out", stagger: 0.12, delay: 1.3 });
      all<HTMLElement>(root, '[data-anim="fade-up"]').forEach((element) => {
        gsap.fromTo(element, blurIn, { ...sharp, duration: 0.9, ease: "power2.out", scrollTrigger: { trigger: element, start: "top 88%", toggleActions: "play none none none" } });
      });
      all<HTMLElement>(root, '[data-anim="reveal"]').forEach((element) => {
        gsap.fromTo(element, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut", scrollTrigger: { trigger: element, start: "top 88%", toggleActions: "play none none none" } });
      });

      const rack = root.querySelector<HTMLElement>("[data-rack]");
      if (rack) {
        const rail = rack.querySelector<HTMLElement>("[data-rack-rail]");
        const cards = all<HTMLElement>(rack, "[data-rack-item]");
        const timeline = gsap.timeline({ scrollTrigger: { trigger: rack, start: "top 80%", toggleActions: "play none none none" } });
        if (rail && rail.offsetWidth) timeline.from(rail, { scaleX: 0, duration: 1.1, ease: "expo.inOut" }, 0);
        cards.forEach((card, index) => {
          const at = 0.45 + index * 0.12;
          timeline.from(card.querySelector(".service-hook"), { scaleY: 0, duration: 0.5, ease: "power2.out" }, at)
            .from(card.querySelector("[data-panel]"), { yPercent: -10, autoAlpha: 0, rotation: index % 2 ? 6 : -6, duration: 1.8, ease: "elastic.out(1, 0.4)" }, at + 0.25)
            .from(card.querySelector(".service-sheet"), { y: 24, autoAlpha: 0, duration: 0.9, ease: "power3.out" }, at + 0.45);
          const panel = card.querySelector<HTMLElement>("[data-panel]");
          if (!panel) return;
          const onEnter = contextSafe((event: MouseEvent) => {
            const rect = card.getBoundingClientRect();
            const direction = event.clientX - rect.left < rect.width / 2 ? -1 : 1;
            gsap.fromTo(panel, { rotation: 2.5 * direction }, { rotation: 0, duration: 1.6, ease: "elastic.out(1.1, 0.3)", overwrite: "auto" });
          });
          card.addEventListener("mouseenter", onEnter);
          cleanups.push(() => card.removeEventListener("mouseenter", onEnter));
        });
      }

      const steps = root.querySelector<HTMLElement>("[data-steps]");
      if (steps) {
        const cards = all<HTMLElement>(steps, "[data-step]");
        const columns = window.matchMedia("(max-width: 767px)").matches ? 2 : window.matchMedia("(max-width: 991px)").matches ? 3 : 6;
        for (let start = 0; start < cards.length; start += columns) {
          const row = cards.slice(start, start + columns);
          const rail = columns === 6
            ? steps.querySelector<HTMLElement>("[data-process-rail]")
            : row.map((card) => card.querySelector<HTMLElement>("[data-step-rail]"));
          const timeline = gsap.timeline({ scrollTrigger: { trigger: row[0], start: "top 82%", toggleActions: "play none none none" } });
          if (rail) timeline.from(rail, { scaleX: 0, duration: 0.8, ease: "power2.inOut", stagger: 0.08 }, 0);
          row.forEach((card, index) => {
            const at = 0.3 + index * 0.13;
            timeline.from(card.querySelector(".process-hook"), { scaleY: 0, duration: 0.45, ease: "power2.out" }, at)
              .from(card.querySelector(".process-panel"), { yPercent: -8, autoAlpha: 0, rotation: index % 2 ? 5 : -5, duration: 1.25, ease: "elastic.out(1, 0.48)" }, at + 0.16)
              .from(card.querySelector(".process-step-body"), { y: 18, autoAlpha: 0, duration: 0.7, ease: "power3.out" }, at + 0.36);
          });
        }
      }

      all<HTMLElement>(root, "[data-work]").forEach((work) => {
        const media = work.querySelector<HTMLElement>("[data-work-media]");
        const picture = media?.querySelector<HTMLImageElement>("img");
        const caption = work.querySelector<HTMLElement>(".work-caption");
        if (!media) return;
        const siblings = work.parentElement?.children;
        const delay = siblings ? Array.from(siblings).indexOf(work) * 0.12 : 0;
        const timeline = gsap.timeline({ delay, scrollTrigger: { trigger: work, start: "top 85%", toggleActions: "play none none none" } });
        timeline.fromTo(media, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut" }, 0);
        if (picture) timeline.from(picture, { scale: 1.25, duration: 1.7, ease: "expo.out" }, 0.1);
        if (caption) timeline.from(caption, { y: 12, autoAlpha: 0, duration: 0.8, ease: "power3.out" }, 0.75);
        if (picture) gsap.fromTo(picture, { yPercent: -5 }, { yPercent: 5, ease: "none", scrollTrigger: { trigger: work, start: "top bottom", end: "bottom top", scrub: true } });
      });

      const faq = root.querySelector<HTMLElement>("[data-faq]");
      if (faq) gsap.from(all(faq, "[data-faq-item]"), { y: 24, autoAlpha: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: faq, start: "top 82%", toggleActions: "play none none none" } });
      ScrollTrigger.refresh();
    });

    void document.fonts.ready.then(initialize);
    return () => {
      cancelled = true;
      cleanups.forEach((cleanup) => cleanup());
      splits.forEach((split) => split.revert());
    };
  }, { scope });
  return <div className="page-wrapper" ref={scope}>{children}</div>;
}
