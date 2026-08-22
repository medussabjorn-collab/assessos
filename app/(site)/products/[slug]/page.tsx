import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SolutionDetail from "@/components/SolutionDetail";
import { PRODUCTS, productBySlug } from "@/lib/products";
import { BreadcrumbSchema } from "@/components/JsonLd";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = productBySlug(params.slug);
  if (!p) return { title: "Product" };
  return { title: `${p.name} | Prelim`, description: p.sub, alternates: { canonical: `/products/${params.slug}/` } };
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const p = productBySlug(params.slug);
  if (!p) notFound();
  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Home", href: "/" },
        { name: "Products", href: "/products/" },
        { name: p.name, href: `/products/${params.slug}/` },
      ]} />
      <SolutionDetail data={p} />
    </>
  );
}
