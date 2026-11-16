import type { MetadataRoute } from "next";

import { getFabrics, getModels, getTailors, getVendors } from "@/lib/data";
import { modelHref } from "@/lib/model-href";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jalofa.com").replace(/\/+$/, "");

const STATIC_PAGES: { path: string; priority: number }[] = [
  { path: "", priority: 1 },
  { path: "/afrique", priority: 0.9 },
  { path: "/europe", priority: 0.9 },
  { path: "/homme", priority: 0.9 },
  { path: "/femme", priority: 0.9 },
  { path: "/modeles", priority: 0.9 },
  { path: "/tissus", priority: 0.8 },
  { path: "/tailleurs", priority: 0.8 },
  { path: "/vendeurs", priority: 0.7 },
  { path: "/inspiration", priority: 0.6 },
  { path: "/faq", priority: 0.5 },
  { path: "/conditions", priority: 0.2 },
  { path: "/confidentialite", priority: 0.2 },
  { path: "/mentions-legales", priority: 0.2 },
];

async function safe<T>(load: () => Promise<T[]>): Promise<T[]> {
  try {
    return await load();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [models, tailors, vendors, fabrics] = await Promise.all([
    safe(() => getModels()),
    safe(() => getTailors()),
    safe(() => getVendors()),
    safe(() => getFabrics()),
  ]);

  const entries: MetadataRoute.Sitemap = STATIC_PAGES.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority,
  }));

  const seen = new Set(entries.map((e) => e.url));
  const add = (path: string, priority: number) => {
    const url = `${SITE_URL}${path}`.replace(/&/g, "&amp;");
    if (seen.has(url)) return;
    seen.add(url);
    entries.push({ url, lastModified: now, changeFrequency: "weekly", priority });
  };

  for (const m of models) add(modelHref(m), 0.7);
  for (const t of tailors) add(`/tailleurs/${t.id}`, 0.6);
  for (const v of vendors) add(`/vendeurs/${v.id}`, 0.5);
  for (const f of fabrics) add(`/tissus/${f.id}`, 0.5);

  return entries;
}
