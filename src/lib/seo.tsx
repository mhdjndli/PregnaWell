import type { Metadata } from "next";
import { locales, type Locale } from "./i18n";
import { site } from "./site";

export const SITE_URL = "https://pregnawell.com";
export const SITE_NAME = "PregnaWell";
export const DEFAULT_OG_IMAGE = "/assets/og-default.jpg";

const OG_LOCALE: Record<Locale, string> = { en: "en_US", ar: "ar_AR" };

type PageMetadataOptions = {
  locale: Locale;
  /** Locale-less path starting with "/" (or "" for the homepage). Must be URL-encoded already. */
  path: string;
  title: Metadata["title"] & (string | { absolute: string });
  description: string;
  /** Set false for pages that exist in only one language (no hreflang alternates). */
  localized?: boolean;
  image?: string | null;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    authors?: string[];
  };
};

// One helper for every public page so canonicals, hreflang alternates, and
// social cards stay consistent. Relative URLs resolve against metadataBase.
export function pageMetadata(opts: PageMetadataOptions): Metadata {
  const { locale, path, title, description } = opts;
  const canonical = `/${locale}${path}`;
  const ogTitle = typeof title === "string" ? title : title.absolute;
  const image = opts.image ?? DEFAULT_OG_IMAGE;

  const languages: Record<string, string> | undefined =
    opts.localized === false
      ? undefined
      : {
          ...Object.fromEntries(locales.map((l) => [l, `/${l}${path}`])),
          "x-default": `/en${path}`,
        };

  const common = {
    title: ogTitle,
    description,
    url: canonical,
    siteName: SITE_NAME,
    locale: OG_LOCALE[locale],
    images: [{ url: image, alt: ogTitle }],
  };

  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: opts.article
      ? {
          ...common,
          type: "article",
          publishedTime: opts.article.publishedTime,
          modifiedTime: opts.article.modifiedTime,
          authors: opts.article.authors,
        }
      : { ...common, type: "website" },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [image],
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/assets/logo-mark.png`,
    email: site.email,
    founder: {
      "@type": "Person",
      name: "Maha Hommos",
      jobTitle: "Clinical Nutritionist",
      sameAs: [site.social.instagram, site.social.youtube, site.social.linkedin],
    },
    sameAs: Object.values(site.social),
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: [...locales],
  };
}

export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
