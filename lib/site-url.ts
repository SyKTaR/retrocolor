const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

export const siteUrl = new URL(configuredUrl.endsWith("/") ? configuredUrl : `${configuredUrl}/`);

export function absoluteUrl(path: string) {
  return new URL(path.replace(/^\//, ""), siteUrl).toString();
}
