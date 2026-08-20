import type { MetadataRoute } from "next";
import { INDUSTRIES } from "@/lib/industries";
import { PRODUCTS } from "@/lib/products";
import { LEGAL } from "@/lib/legal";
import { CASE_STUDIES } from "@/lib/case-studies";
import { POSTS } from "@/lib/blog";
import { GUIDES } from "@/lib/guides";

const SITE = "https://prelim.io";

const STATIC_ROUTES: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1, freq: "weekly" },
  { path: "/solutions", priority: 0.9, freq: "monthly" },
  { path: "/solutions/leadership-hiring", priority: 0.8, freq: "monthly" },
  { path: "/solutions/technical-hiring", priority: 0.8, freq: "monthly" },
  { path: "/solutions/non-it-hiring", priority: 0.8, freq: "monthly" },
  { path: "/industries", priority: 0.9, freq: "monthly" },
  { path: "/platform", priority: 0.8, freq: "monthly" },
  { path: "/product-tour", priority: 0.7, freq: "monthly" },
  { path: "/products", priority: 0.8, freq: "monthly" },
  { path: "/security", priority: 0.7, freq: "monthly" },
  { path: "/pricing", priority: 0.8, freq: "monthly" },
  { path: "/about", priority: 0.6, freq: "monthly" },
  { path: "/contact", priority: 0.7, freq: "monthly" },
  { path: "/students", priority: 0.6, freq: "monthly" },
  { path: "/careers", priority: 0.5, freq: "monthly" },
  { path: "/partners", priority: 0.5, freq: "monthly" },
  { path: "/press", priority: 0.4, freq: "monthly" },
  { path: "/resources", priority: 0.7, freq: "weekly" },
  { path: "/resources/blog", priority: 0.7, freq: "weekly" },
  { path: "/resources/guides", priority: 0.7, freq: "weekly" },
  { path: "/resources/case-studies", priority: 0.7, freq: "weekly" },
  { path: "/resources/sample-tests", priority: 0.6, freq: "monthly" },
  { path: "/resources/roi-calculator", priority: 0.6, freq: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE}${r.path}/`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }));

  for (const i of INDUSTRIES) {
    entries.push({ url: `${SITE}/industries/${i.slug}/`, lastModified: now, changeFrequency: "monthly", priority: 0.7 });
  }
  for (const p of PRODUCTS) {
    entries.push({ url: `${SITE}/products/${p.slug}/`, lastModified: now, changeFrequency: "monthly", priority: 0.7 });
  }
  for (const l of LEGAL) {
    entries.push({ url: `${SITE}/legal/${l.slug}/`, lastModified: now, changeFrequency: "yearly", priority: 0.3 });
  }
  for (const c of CASE_STUDIES) {
    entries.push({ url: `${SITE}/resources/case-studies/${c.slug}/`, lastModified: now, changeFrequency: "monthly", priority: 0.6 });
  }
  for (const post of POSTS) {
    entries.push({ url: `${SITE}/resources/blog/${post.slug}/`, lastModified: new Date(post.date), changeFrequency: "yearly", priority: 0.5 });
  }
  for (const g of GUIDES) {
    entries.push({ url: `${SITE}/resources/guides/${g.slug}/`, lastModified: now, changeFrequency: "yearly", priority: 0.5 });
  }

  return entries;
}
