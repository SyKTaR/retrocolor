export function Logo({ light = false }: { light?: boolean }) {
  return <a href="/" aria-label="Rétro Color, retour à l’accueil" className={`nav-logo${light ? " is-light" : ""}`}>
    <span className="nav-logo-mark"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 39 39.07" fill="none" aria-hidden="true" style={{ display: "block" }}>
      <rect width="38.9342" height="39.0657" rx="11" fill="#3D3D3D" />
      <path d="M24.0087 10.1562C26.0924 10.4192 27.7866 12.2189 28.1166 14.19C28.2824 15.1808 28.1044 16.2196 27.456 17.1293C26.8388 17.995 25.8041 18.7312 24.2637 19.2037C25.608 20.6807 26.9617 22.1925 27.9923 23.3503C28.5283 23.9525 28.9772 24.459 29.2919 24.8149C29.4493 24.9929 29.5734 25.1332 29.6579 25.2291L30.0086 25.6272H24.1371L24.0922 25.5768L15.72 16.221H21.7137C22.2374 16.1267 22.5944 15.6813 22.6406 15.2033C22.6635 14.9651 22.6085 14.7219 22.4599 14.5123C22.314 14.3066 22.0712 14.1237 21.701 14.0126H8.75072L10.5521 10.155H23.9992L24.0087 10.1562Z" fill="white" />
      <path d="M22.7054 25.4724C22.7054 25.4724 17.4551 19.4333 14.6637 16.3705H8.98161L17.1225 25.4724H22.7054Z" fill="#EA5B17" />
    </svg></span><span className="nav-logo-text">Retro Color</span>
  </a>;
}
