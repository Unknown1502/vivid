import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/db";

function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const slugs = await getAllSlugs();

  const explainerUrls: MetadataRoute.Sitemap = slugs.map(({ slug, created_at }) => ({
    url: `${base}/v/${slug}`,
    lastModified: new Date(created_at),
    changeFrequency: "never",
    priority: 0.7,
  }));

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...explainerUrls,
  ];
}
