import { useEffect } from "react";
import { useApp } from "../context/AppContext";

export interface DocumentMetadata {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  author?: string;
  publishDate?: string;
  canonicalUrl?: string;
  type?: "website" | "article" | "course";
  faqs?: { question: string; answer: string }[];
  reviews?: { author: string; rating: number; body: string }[];
  breadcrumbs?: { name: string; item: string }[];
}

export function useDocumentMetadata(options: DocumentMetadata) {
  const { globalSettings } = useApp();
  const {
    title,
    description,
    keywords,
    image,
    url,
    author,
    publishDate,
    canonicalUrl,
    type = "website",
    faqs,
    reviews,
    breadcrumbs,
  } = options;

  useEffect(() => {
    // 1. Dynamic Title Tag
    const displayTitle = title ? `${title} | Learn 2 Future` : (globalSettings?.defaultCardTitle || "Learn 2 Future");
    document.title = displayTitle;

    // Helper to get or create/update meta tag
    const setMetaTag = (attrs: Record<string, string>, contentVal: string | undefined) => {
      if (contentVal === undefined || contentVal === null) {
        return;
      }
      let queryStr = "";
      if (attrs.name) queryStr = `meta[name="${attrs.name}"]`;
      else if (attrs.property) queryStr = `meta[property="${attrs.property}"]`;
      
      let element = document.head.querySelector(queryStr) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement("meta");
        Object.entries(attrs).forEach(([key, val]) => element?.setAttribute(key, val));
        document.head.appendChild(element);
      }
      element.setAttribute("content", contentVal);
    };

    // Helper to set/update link tag
    const setLinkTag = (rel: string, hrefVal: string | undefined) => {
      if (!hrefVal) return;
      let element = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!element) {
        element = document.createElement("link");
        element.setAttribute("rel", rel);
        document.head.appendChild(element);
      }
      element.setAttribute("href", hrefVal);
    };

    // Helper to set/update schema tag
    const setSchemaTag = (id: string, data: any) => {
      let scriptEle = document.getElementById(id) as HTMLScriptElement | null;
      if (!data) {
        if (scriptEle) scriptEle.remove();
        return;
      }
      if (!scriptEle) {
        scriptEle = document.createElement("script");
        scriptEle.id = id;
        scriptEle.type = "application/ld+json";
        document.head.appendChild(scriptEle);
      }
      scriptEle.textContent = JSON.stringify(data);
    };

    const defaultDesc = globalSettings?.defaultCardDescription || "Empowering you with cutting edge future-tech courses, guides, and tutorials.";
    const defaultKeywords = "tech education, learn programming, future technology, ai trends, tutorials";
    const defaultImage = globalSettings?.ogDefaultImageUrl || "/brand_logo.jpg";
    const defaultUrl = window.location.href;
    const defaultAuthor = "Learn 2 Future";

    const activeDesc = description || defaultDesc;
    const activeKeywords = keywords || defaultKeywords;
    const activeImage = image || defaultImage;
    const activeUrl = url || defaultUrl;
    const activeAuthor = author || defaultAuthor;
    const activeCanonical = canonicalUrl || activeUrl;

    const resolveAbsoluteUrl = (pathVal: string, base: string) => {
      if (pathVal.startsWith("http://") || pathVal.startsWith("https://")) return pathVal;
      return new URL(pathVal, base).toString();
    };

    // 2. Standard Meta Tags
    setMetaTag({ name: "description" }, activeDesc);
    setMetaTag({ name: "keywords" }, activeKeywords);
    setMetaTag({ name: "author" }, activeAuthor);

    // 3. Open Graph Tags (Facebook/LinkedIn share previews)
    setMetaTag({ property: "og:title" }, displayTitle);
    setMetaTag({ property: "og:description" }, activeDesc);
    setMetaTag({ property: "og:image" }, resolveAbsoluteUrl(activeImage, window.location.origin));
    setMetaTag({ property: "og:url" }, activeUrl);
    setMetaTag({ property: "og:type" }, type === "article" ? "article" : "website");
    setMetaTag({ property: "og:site_name" }, "Learn 2 Future");

    // 4. Twitter Card Tags (Twitter / X share previews)
    setMetaTag({ name: "twitter:card" }, "summary_large_image");
    setMetaTag({ name: "twitter:title" }, displayTitle);
    setMetaTag({ name: "twitter:description" }, activeDesc);
    setMetaTag({ name: "twitter:image" }, resolveAbsoluteUrl(activeImage, window.location.origin));

    // 5. Canonical Link tag
    setLinkTag("canonical", activeCanonical);

    // 6. Schema.org Structured Data (JSON-LD)
    const structuredData = type === "article" ? {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": activeUrl
      },
      "headline": title?.slice(0, 110) || "",
      "description": activeDesc.slice(0, 200),
      "image": resolveAbsoluteUrl(activeImage, window.location.origin),
      "datePublished": publishDate || new Date().toISOString().split("T")[0],
      "author": {
        "@type": "Person",
        "name": activeAuthor
      },
      "publisher": {
        "@type": "Organization",
        "name": "Learn 2 Future",
        "logo": {
          "@type": "ImageObject",
          "url": resolveAbsoluteUrl(defaultImage, window.location.origin)
        }
      }
    } : type === "course" ? {
      "@context": "https://schema.org",
      "@type": "Course",
      "name": title || "",
      "description": activeDesc,
      "provider": {
        "@type": "Organization",
        "name": "Learn 2 Future",
        "sameAs": window.location.origin
      },
      "image": resolveAbsoluteUrl(activeImage, window.location.origin)
    } : {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Learn 2 Future",
      "url": window.location.origin,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${window.location.origin}/blogs?search={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    };

    setSchemaTag("seo-structured-data", structuredData);

    // 7. Organization schema (Site-wide)
    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "name": "Learn 2 Future",
      "url": window.location.origin,
      "logo": resolveAbsoluteUrl(defaultImage, window.location.origin),
      "description": defaultDesc,
      "sameAs": [
        "https://t.me/LearntoFuture",
        "https://www.youtube.com/@learn2future"
      ]
    };
    setSchemaTag("seo-org-schema", orgSchema);

    // 8. Breadcrumb schema
    if (breadcrumbs && breadcrumbs.length > 0) {
      const breadcrumbListSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((b, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": b.name,
          "item": b.item.startsWith("http") ? b.item : `${window.location.origin}${b.item}`
        }))
      };
      setSchemaTag("seo-breadcrumb-schema", breadcrumbListSchema);
    } else {
      setSchemaTag("seo-breadcrumb-schema", null);
    }

    // 9. FAQ Schema
    if (faqs && faqs.length > 0) {
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      };
      setSchemaTag("seo-faq-schema", faqSchema);
    } else {
      setSchemaTag("seo-faq-schema", null);
    }

    // 10. Review Schema
    if (reviews && reviews.length > 0) {
      const totalRating = reviews.reduce((acc, r) => acc + r.rating, 0);
      const avgRating = Number((totalRating / reviews.length).toFixed(1));
      const reviewSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": title || "Learn 2 Future Course",
        "image": resolveAbsoluteUrl(activeImage, window.location.origin),
        "description": activeDesc,
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": avgRating,
          "reviewCount": reviews.length,
          "bestRating": 5,
          "worstRating": 1
        },
        "review": reviews.map(r => ({
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": r.author
          },
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": r.rating,
            "bestRating": 5,
            "worstRating": 1
          },
          "reviewBody": r.body
        }))
      };
      setSchemaTag("seo-review-schema", reviewSchema);
    } else {
      setSchemaTag("seo-review-schema", null);
    }

    return () => {
      // Clean up dynamic tags on route transition, leaving global Org schema intact
      ["seo-structured-data", "seo-breadcrumb-schema", "seo-faq-schema", "seo-review-schema"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
    };
  }, [title, description, keywords, image, url, author, publishDate, canonicalUrl, type, faqs, reviews, breadcrumbs]);
}
