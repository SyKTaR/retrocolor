export type HeroWorkshopStepId = 'sablage' | 'masquage' | 'peinture' | 'sechage' | 'emballage' | 'resultat';

export interface HeroWorkshopStep {
  id: HeroWorkshopStepId;
  /** Numéro affiché, « 01 » à « 06 » */
  n: string;
  title: string;
  sub: string;
  text: string;
}

export type HeroWorkshopSteps = Partial<Record<HeroWorkshopStepId, Partial<Pick<HeroWorkshopStep, 'title' | 'sub' | 'text'>>>>;

export interface HeroWorkshopOptions {
  /** Calque qui couvre toute la section héros (position absolute, inset 0). Reçoit le canvas et les épingles. */
  container: HTMLElement;
  /** Bloc titre + texte + boutons. La scène commence sous son bord bas et se recale quand il change de taille. */
  copyElement: HTMLElement;
  /** Remplace les textes des étapes (titre, sous-titre, phrase). */
  steps?: HeroWorkshopSteps;
  /** Clic sur une épingle ou un poste de la scène. */
  onStepClick?: (step: HeroWorkshopStep) => void;
  /** Étape mise en avant (survol ou rotation automatique). */
  onStepChange?: (step: HeroWorkshopStep) => void;
  /** Largeur (px) sous laquelle la mise en page téléphone s'applique. Défaut 760. */
  mobileBreakpoint?: number;
  /** Délai entre deux étapes en rotation automatique (ms). Défaut 5200 bureau, 4200 téléphone. */
  autoplayMs?: number;
  /** Fige l'animation (captures d'écran, tests). */
  frozen?: boolean;
}

export interface HeroWorkshopHandle {
  /** Résolu quand la scène est construite et visible. */
  ready: Promise<void>;
  /** Arrête la boucle, retire le canvas et libère toute la mémoire GPU. Sans effet si déjà appelé. */
  destroy(): void;
  /** Met une étape en avant (0 à 5). */
  feature(index: number): void;
}

export function mountHeroWorkshop(options: HeroWorkshopOptions): HeroWorkshopHandle;
