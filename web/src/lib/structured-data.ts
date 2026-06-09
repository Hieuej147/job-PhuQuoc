const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pqjobs.vn";
const SITE_NAME = "PQJobs";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "PQJobs",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: "Nền tảng tuyển dụng việc làm tại Phú Quốc",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Phú Quốc",
      addressRegion: "Kiên Giang",
      addressCountry: "VN",
    },
    sameAs: [],
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/jobs?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

export function jobPostingJsonLd(job: {
  id: string;
  title: string;
  description: string;
  slug: string;
  company: { name: string; logo?: string | null };
  ward?: { name: string; district?: { name: string } } | null;
  addressDetail?: string | null;
  type: string;
  experience?: string | null;
  level?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  createdAt: string;
  deadline?: string | null;
  quantity?: number;
}) {
  const employmentTypeMap: Record<string, string> = {
    FULL_TIME: "FULL_TIME",
    PART_TIME: "PART_TIME",
    REMOTE: "OTHER",
    CONTRACT: "CONTRACT",
    INTERNSHIP: "INTERN",
    FREELANCE: "OTHER",
  };

  const location = job.ward
    ? `${job.ward.name}, ${job.ward.district?.name || "Phú Quốc"}, Kiên Giang`
    : job.addressDetail || "Phú Quốc, Kiên Giang";

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description.replace(/<[^>]*>/g, "").slice(0, 5000),
    datePosted: job.createdAt,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company.name,
      logo: job.company.logo || undefined,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Phú Quốc",
        addressRegion: "Kiên Giang",
        addressCountry: "VN",
        streetAddress: location,
      },
    },
    employmentType: employmentTypeMap[job.type] || "FULL_TIME",
    url: `${SITE_URL}/jobs/${job.slug}`,
  };

  if (job.deadline) schema.validThrough = job.deadline;
  if (job.quantity) schema.numberOfPositions = job.quantity;

  if (job.salaryMin || job.salaryMax) {
    schema.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "VND",
      value: {
        "@type": "QuantitativeValue",
        minValue: job.salaryMin || undefined,
        maxValue: job.salaryMax || undefined,
        unitText: "MONTH",
      },
    };
  }

  return schema;
}

export function articleJsonLd(article: {
  title: string;
  description: string;
  slug: string;
  thumbnail?: string | null;
  createdAt: string;
  updatedAt: string;
  author?: { name: string } | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    image: article.thumbnail || undefined,
    datePublished: article.createdAt,
    dateModified: article.updatedAt,
    author: article.author
      ? { "@type": "Person", name: article.author.name }
      : undefined,
    publisher: organizationJsonLd(),
    mainEntityOfPage: `${SITE_URL}/blog/${article.slug}`,
  };
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "PQJobs",
    url: SITE_URL,
    description: "Nền tảng tuyển dụng việc làm tại đảo Phú Quốc",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Phú Quốc",
      addressRegion: "Kiên Giang",
      addressCountry: "VN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 10.2899,
      longitude: 103.984,
    },
    telephone: "+84-xxx-xxx-xxx",
  };
}
