'use client';

import { useEffect, useRef, type RefObject } from 'react';
import type {
  HeroWorkshopHandle,
  HeroWorkshopStep,
  HeroWorkshopSteps,
} from './engine/hero-workshop.engine';
import styles from './HeroWorkshop.module.css';

type Props = {
  /** Référence vers le bloc titre + texte + boutons : la scène se place juste en dessous. */
  copyRef: RefObject<HTMLElement | null>;
  /** Textes des étapes. Passer un objet stable (constante hors du composant ou useMemo). */
  steps?: HeroWorkshopSteps;
  onStepClick?: (step: HeroWorkshopStep) => void;
  onStepChange?: (step: HeroWorkshopStep) => void;
  className?: string;
};

function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Atelier Retro Color en 3D, en fond de section héros.
 * À placer comme premier enfant d'une section `position: relative` qui contient aussi le bloc de texte.
 * Le moteur (three.js inclus, ~200 Ko gzip) est chargé à la demande, côté client uniquement.
 */
export function HeroWorkshop({ copyRef, steps, onStepClick, onStepChange, className }: Props) {
  const layerRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onStepClick, onStepChange });
  callbacks.current = { onStepClick, onStepChange };

  useEffect(() => {
    const container = layerRef.current;
    const copy = copyRef.current;
    if (!container || !copy || !supportsWebGL()) return;

    let handle: HeroWorkshopHandle | null = null;
    let cancelled = false;

    import('./engine/hero-workshop.engine.js').then(({ mountHeroWorkshop }) => {
      if (cancelled) return;
      handle = mountHeroWorkshop({
        container,
        copyElement: copy,
        steps,
        onStepClick: (s) => callbacks.current.onStepClick?.(s),
        onStepChange: (s) => callbacks.current.onStepChange?.(s),
      });
    });

    // React (StrictMode) peut monter / démonter deux fois : destroy() libère tout proprement.
    return () => {
      cancelled = true;
      handle?.destroy();
    };
  }, [copyRef, steps]);

  return (
    <div
      ref={layerRef}
      className={className ? `${styles.layer} ${className}` : styles.layer}
      role="group"
      aria-label="L'atelier Retro Color en 3D : les six étapes du sablage à l'expédition"
    />
  );
}

export default HeroWorkshop;
