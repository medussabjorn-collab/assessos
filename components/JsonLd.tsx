const SITE = "https://prelim.io";

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Prelim",
    url: SITE,
    logo: `${SITE}/logo.png`,
    description:
      "Prelim is the enterprise talent assessment platform for defensible hiring — measuring leadership, technical, and non-IT candidates on one scoring model.",
    sameAs: [
      "https://www.linkedin.com/company/prelim-io",
      "https://twitter.com/prelim_io",
      "https://github.com/prelim-io",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      url: `${SITE}/contact/`,
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebSiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Prelim",
    url: SITE,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export interface BreadcrumbItem {
  name: string;
  href: string;
}

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE}${item.href}`,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
