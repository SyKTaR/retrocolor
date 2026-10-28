import { steps } from "@/lib/content";

export function Process() {
  return (
    <section id="procede" className="section process">
      <div className="container process-inner">
        <div className="section-head">
          <h2 data-split="lines" className="heading-l">
            Du métal oxydé<br />à la pièce filmée.
          </h2>
        </div>

        <div data-steps className="process-steps">
          <div data-process-rail className="process-rail" aria-hidden="true" />
          <ol className="process-grid">
            {steps.map((step, index) => (
              <li data-step className="process-step" key={step.title}>
                <div data-step-rail className="process-step-rail" aria-hidden="true" />
                <div className="process-hook" aria-hidden="true" />
                <div className={`process-panel ${step.colorClass}`} aria-hidden="true">
                  <span className="process-panel-hole" />
                  {step.colorClass === "is-controle" && (
                    <span className="process-panel-check">
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="m5.5 12.2 4.2 4.1 8.8-8.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </div>
                <div className="process-step-body">
                  <div className="process-meta"><span className="process-number">{String(index + 1).padStart(2, "0")}</span><span className="process-state">{step.state}</span></div>
                  <h3 className="heading-xs">{step.title}</h3>
                  <p className="text-small">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="process-media">
          <div data-anim="reveal" className="media-placeholder is-process-main"><span className="media-placeholder-label">Photo : cabine de poudrage</span></div>
          <div data-anim="reveal" className="media-placeholder is-process-side"><span className="media-placeholder-label">Photo : four de cuisson</span></div>
          <div data-anim="reveal" className="media-placeholder is-process-side"><span className="media-placeholder-label">Photo : pièces filmées</span></div>
        </div>
      </div>
    </section>
  );
}
