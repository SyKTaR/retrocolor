"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { faqs, site } from "@/lib/content";

gsap.registerPlugin(useGSAP);

export function Faq() {
  const scope = useRef<HTMLElement>(null);
  useGSAP((_, contextSafe) => {
    if (!scope.current || !contextSafe) return;
    const items = Array.from(scope.current.querySelectorAll<HTMLElement>("[data-faq-item]"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const setState = contextSafe((item: HTMLElement, open: boolean) => {
      const trigger = item.querySelector<HTMLButtonElement>("[data-faq-trigger]");
      const answer = item.querySelector<HTMLElement>("[data-faq-answer]");
      const plus = item.querySelector<HTMLElement>("[data-faq-plus]");
      if (!trigger || !answer || !plus) return;
      const height = answer.offsetHeight;
      item.classList.toggle("is-open", open);
      trigger.classList.toggle("is-open", open);
      trigger.setAttribute("aria-expanded", String(open));
      item.querySelector(".faq-question-text")?.classList.toggle("is-open", open);
      item.querySelector(".faq-icon")?.classList.toggle("is-open", open);
      answer.classList.toggle("is-open", open);
      gsap.killTweensOf([answer, plus]);
      gsap.fromTo(answer, { height }, { height: open ? "auto" : 0, duration: reduce ? 0 : 0.55, ease: "power3.inOut", onComplete: () => gsap.set(answer, { clearProps: "height" }) });
      gsap.to(plus, { rotation: open ? 90 : 0, scaleY: open ? 0 : 1, duration: reduce ? 0 : 0.45, ease: "power3.inOut" });
    });
    const cleanups = items.map((item) => {
      const trigger = item.querySelector<HTMLButtonElement>("[data-faq-trigger]");
      const plus = item.querySelector<HTMLElement>("[data-faq-plus]");
      if (!trigger) return () => {};
      if (plus && item.classList.contains("is-open")) gsap.set(plus, { rotation: 90, scaleY: 0 });
      const toggle = () => {
        const willOpen = !item.classList.contains("is-open");
        items.forEach((other) => { if (other !== item && other.classList.contains("is-open")) setState(other, false); });
        setState(item, willOpen);
      };
      trigger.addEventListener("click", toggle);
      return () => trigger.removeEventListener("click", toggle);
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, { scope });

  return <section id="questions" className="section faq" ref={scope}><div className="container faq-inner">
    <div className="faq-intro"><h2 data-split="lines" className="heading-l is-white">Questions fréquentes</h2><p data-blur className="faq-intro-text">Pour un cas particulier, appelez l’atelier au <a href={site.phoneHref} className="faq-phone">{site.phone}</a>.</p></div>
    <div data-faq className="faq-list">{faqs.map((item, index) => <div data-faq-item key={item.question} className={`faq-item${index === 0 ? " is-open" : ""}`}>
      <h3 className="faq-question-heading"><button type="button" data-faq-trigger aria-expanded={index === 0} aria-controls={`faq-answer-${index}`} className={`faq-question${index === 0 ? " is-open" : ""}`}><span className={`faq-question-text${index === 0 ? " is-open" : ""}`}>{item.question}</span><span className={`faq-icon${index === 0 ? " is-open" : ""}`} aria-hidden="true"><span className="faq-icon-h" /><span data-faq-plus className="faq-icon-v" /></span></button></h3>
      <div data-faq-answer id={`faq-answer-${index}`} className={`faq-answer${index === 0 ? " is-open" : ""}`}><p className="faq-answer-text">{item.answer}</p></div>
    </div>)}</div>
  </div></section>;
}
