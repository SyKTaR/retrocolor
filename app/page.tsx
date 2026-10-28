import { Animations } from "@/components/animations";
import { Contact } from "@/components/contact";
import { Faq } from "@/components/faq";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Preloader } from "@/components/preloader";
import { Process } from "@/components/process";
import { Services } from "@/components/services";
import { Works } from "@/components/works";
import { services, site } from "@/lib/content";
import { absoluteUrl } from "@/lib/site-url";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": absoluteUrl("/#atelier"),
  name: site.name,
  url: absoluteUrl("/"),
  telephone: site.phoneHref.replace("tel:", ""),
  email: site.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address[0],
    postalCode: site.address[1].split(" ")[0],
    addressLocality: site.address[1].split(" ").slice(1).join(" "),
    addressCountry: "FR",
  },
  openingHoursSpecification: [1, 2, 3, 4, 5].flatMap((day) => [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][day - 1], opens: "09:00", closes: "12:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][day - 1], opens: "13:30", closes: "18:00" },
  ]),
  hasOfferCatalog: { "@type": "OfferCatalog", name: "Services", itemListElement: services.map((service) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: service.title } })) },
};

export default function Page() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /><Animations>
    <Preloader />
    <Header />
    <main id="top" className="main"><Hero /><Services /><Process /><Works /><Faq /><Contact /></main>
    <Footer />
  </Animations></>;
}
