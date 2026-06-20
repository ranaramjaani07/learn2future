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

    // 2. Standard Meta Tags
    setMetaTag({ name: "description" }, activeDesc);
    setMetaTag({ name: "keywords" }, activeKeywords);
    setMetaTag({ name: "author" }, activeAuthor);

    // 3. Open Graph Tags (Facebook/LinkedIn share previews)
    setMetaTag({ property: "og:title" }, displayTitle);
    setMetaTag({ property: "og:description" }, activeDesc);
    setMetaTag({ property: "og:image" }, activeImage);
    setMetaTag({ property: "og:url" }, activeUrl);
    setMetaTag({ property: "og:type" }, type === "article" ? "article" : "website");
    setMetaTag({ property: "og:site_name" }, "Learn 2 Future");

    // 4. Twitter Card Tags (Twitter / X share previews)
    setMetaTag({ name: "twitter:card" }, "summary_large_image");
    setMetaTag({ name: "twitter:title" }, displayTitle);
    setMetaTag({ name: "twitter:description" }, activeDesc);
    setMetaTag({ name: "twitter:image" }, activeImage);

    // 5. Canonical Link tag
    setLinkTag("canonical", activeCanonical);

    // 6. Schema.org Structured Data (JSON-LD)
    const scriptId = "seo-structured-data";
    let scriptEle = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptEle) {
      scriptEle = document.createElement("script");
      scriptEle.id = scriptId;
      scriptEle.type = "application/ld+json";
      document.head.appendChild(scriptEle);
    }

    const structuredData = type === "article" ? {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": activeUrl
      },
      "headline": title?.slice(0, 110) || "",
      "description": activeDesc.slice(0, 200),
      "image": activeImage,
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
          "url": "https://learn2future.vercel.app/logo.png"
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
        "sameAs": "https://learn2future.vercel.app"
      },
      "image": activeImage
    } : {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Learn 2 Future",
      "url": "https://learn2future.vercel.app",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://learn2future.vercel.app/#blog?search={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    };

    scriptEle.textContent = JSON.stringify(structuredData);
  }, [title, description, keywords, image, url, author, publishDate, canonicalUrl, type]);
}
