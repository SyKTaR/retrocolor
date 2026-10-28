// Rendu côté serveur : l'écran de chargement est présent dans le HTML initial, donc visible dès le premier paint, à chaque refresh.
// Animé par <Animations> (compteur, rideau). Sans JS, la règle <noscript> ci-dessous le masque.
export function Preloader() {
  return <div className="preloader" data-preloader aria-hidden="true">
    <noscript><style>{".preloader{display:none!important}"}</style></noscript>
    <div className="preloader-curtain" data-preloader-curtain />
    <div className="preloader-center" data-preloader-center>
      <svg className="preloader-logo" xmlns="http://www.w3.org/2000/svg" viewBox="8 9 23 18" fill="none">
        <path d="M24.0087 10.1562C26.0924 10.4192 27.7866 12.2189 28.1166 14.19C28.2824 15.1808 28.1044 16.2196 27.456 17.1293C26.8388 17.995 25.8041 18.7312 24.2637 19.2037C25.608 20.6807 26.9617 22.1925 27.9923 23.3503C28.5283 23.9525 28.9772 24.459 29.2919 24.8149C29.4493 24.9929 29.5734 25.1332 29.6579 25.2291L30.0086 25.6272H24.1371L24.0922 25.5768L15.72 16.221H21.7137C22.2374 16.1267 22.5944 15.6813 22.6406 15.2033C22.6635 14.9651 22.6085 14.7219 22.4599 14.5123C22.314 14.3066 22.0712 14.1237 21.701 14.0126H8.75072L10.5521 10.155H23.9992L24.0087 10.1562Z" fill="#fff" />
        <path d="M22.7054 25.4724C22.7054 25.4724 17.4551 19.4333 14.6637 16.3705H8.98161L17.1225 25.4724H22.7054Z" fill="#EA5B17" />
      </svg>
      <span className="preloader-brand">Retro Color</span>
      <p className="preloader-count"><span data-preloader-count>000</span><sup>%</sup></p>
    </div>
  </div>;
}
