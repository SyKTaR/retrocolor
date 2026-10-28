import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";
import { politiqueConfidentialite } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Rétro Color",
  description: "Données collectées, durées de conservation, droits et cookies : la politique de confidentialité de Rétro Color.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/politique-de-confidentialite" },
  openGraph: { title: "Politique de confidentialité | Rétro Color", description: "Données collectées, durées de conservation, droits et cookies : la politique de confidentialité de Rétro Color.", locale: "fr_FR", type: "website", url: "/politique-de-confidentialite", images: ["/opengraph-image"] },
  twitter: { card: "summary_large_image", title: "Politique de confidentialité | Rétro Color", description: "Données collectées, durées de conservation, droits et cookies : la politique de confidentialité de Rétro Color.", images: ["/opengraph-image"] },
};

export default function PolitiqueConfidentialitePage() {
  return <LegalLayout content={politiqueConfidentialite} />;
}
