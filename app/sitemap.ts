import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/mentions-legales", "/politique-de-confidentialite"].map((path) => ({ url: absoluteUrl(path) }));
}
