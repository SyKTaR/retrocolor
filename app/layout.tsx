import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "@fontsource/archivo-black/400.css";
import { Analytics } from "@/components/analytics";
import { CookieConsentProvider } from "@/components/cookie-consent";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "Rétro Color — Sablage et peinture de pièces métalliques à Ozoir-la-Ferrière (77)",
  icons: {
    icon: [
      { url: "/icon-light.png", type: "image/png", sizes: "199x199", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark.png", type: "image/png", sizes: "199x199", media: "(prefers-color-scheme: dark)" },
    ],
    apple: { url: "/icon-light.png", sizes: "199x199" },
  },
  description: "Atelier de traitement de surface en Seine-et-Marne : peinture poudre et liquide, sablage, microbillage et peinture de climatisation, à l’unité ou en série. Devis sur demande.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Rétro Color",
    title: "Rétro Color — Sablage et peinture de pièces métalliques à Ozoir-la-Ferrière (77)",
    description: "Atelier de traitement de surface en Seine-et-Marne : peinture poudre et liquide, sablage, microbillage et peinture de climatisation, à l’unité ou en série. Devis sur demande.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rétro Color — Sablage et peinture de pièces métalliques à Ozoir-la-Ferrière (77)",
    description: "Atelier de traitement de surface en Seine-et-Marne : peinture poudre et liquide, sablage, microbillage et peinture de climatisation, à l’unité ou en série. Devis sur demande.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr"><body className={GeistSans.variable}><CookieConsentProvider>{children}<Analytics /></CookieConsentProvider></body></html>
  );
}
