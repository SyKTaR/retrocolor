import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Rétro Color — Sablage et peinture de pièces métalliques";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [icon, archivo] = await Promise.all([
    readFile(join(process.cwd(), "public/icon-light.png"), "base64"),
    readFile(join(process.cwd(), "node_modules/@fontsource/archivo-black/files/archivo-black-latin-400-normal.woff")),
  ]);
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", background: "#1c1b19", color: "#ffffff", fontFamily: "Archivo" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/png;base64,${icon}`} width={72} height={72} alt="" style={{ borderRadius: 16 }} />
          <span style={{ fontSize: 34, letterSpacing: "0.02em", textTransform: "uppercase" }}>Retro Color</span>
        </div>
        <span style={{ fontSize: 22, color: "#a5a49e", letterSpacing: "0.12em", textTransform: "uppercase" }}>Atelier · Ozoir-la-Ferrière</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 70, lineHeight: 1.02, whiteSpace: "nowrap", letterSpacing: "-0.02em", textTransform: "uppercase" }}>
          <span>Sablage et peinture</span>
          <span style={{ color: "#ea5b17" }}>de pièces métalliques.</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ width: 64, height: 8, background: "#ea5b17" }} />
          <span style={{ fontSize: 28, color: "#deddd9" }}>Poudre · Liquide · Microbillage · Climatisation</span>
        </div>
      </div>
    </div>,
    { ...size, fonts: [{ name: "Archivo", data: archivo, style: "normal", weight: 400 }] },
  );
}
