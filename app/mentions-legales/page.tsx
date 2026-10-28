import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";
import { mentionsLegales } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: "Mentions légales | Rétro Color",
  description: "Éditeur, hébergement, propriété intellectuelle et médiation : les mentions légales de Rétro Color.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/mentions-legales" },
  openGraph: { title: "Mentions légales | Rétro Color", description: "Éditeur, hébergement, propriété intellectuelle et médiation : les mentions légales de Rétro Color.", locale: "fr_FR", type: "website", url: "/mentions-legales", images: ["/opengraph-image"] },
  twitter: { card: "summary_large_image", title: "Mentions légales | Rétro Color", description: "Éditeur, hébergement, propriété intellectuelle et médiation : les mentions légales de Rétro Color.", images: ["/opengraph-image"] },
};

export default function MentionsLegalesPage() {
  return <LegalLayout content={mentionsLegales} />;
}
