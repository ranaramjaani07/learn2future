import React, { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  keywords?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  image,
  url,
  type = "website",
  keywords,
}) => {
  useEffect(() => {
    // 1. Fallbacks
    const fallbackImage = "/brand_logo.jpg";
    const finalImage = image || fallbackImage;

    // 2. Set client side title
    if (title) {
      document.title = title;
    }

    // Helper function to set or create meta tags safely
    const setMetaTag = (attrName: string, attrVal: string, contentValue: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute("content", contentValue);
    };

    // 3. Set standard descriptions and other tags
    if (description) {
      setMetaTag("name", "description", description);
    }
    if (keywords) {
      setMetaTag("name", "keywords", keywords);
    }

    // 4. Set Open Graph tags
    if (title) {
      setMetaTag("property", "og:title", title);
    }
    if (description) {
      setMetaTag("property", "og:description", description);
    }
    setMetaTag("property", "og:image", finalImage);
    setMetaTag("property", "og:type", type);
    if (url) {
      setMetaTag("property", "og:url", url);
    }

    // 5. Set Twitter tags
    if (title) {
      setMetaTag("name", "twitter:title", title);
    }
    if (description) {
      setMetaTag("name", "twitter:description", description);
    }
    setMetaTag("name", "twitter:image", finalImage);
    setMetaTag("name", "twitter:card", "summary_large_image");

    // 6. Set dynamic canonical link
    let canonicalElement = document.querySelector('link[rel="canonical"]');
    if (!canonicalElement) {
      canonicalElement = document.createElement("link");
      canonicalElement.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalElement);
    }
    const finalUrl = url || window.location.href;
    canonicalElement.setAttribute("href", finalUrl);

  }, [title, description, image, url, type, keywords]);

  return null; // Side-effects only component
};
