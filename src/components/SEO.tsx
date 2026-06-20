import React from "react";
import { useDocumentMetadata } from "../hooks/useDocumentMetadata";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  author?: string;
  publishDate?: string;
  canonicalUrl?: string;
  type?: "website" | "article" | "course";
}

export const SEO: React.FC<SEOProps> = ({
  title = "Learn 2 Future",
  description = "Empowering you with cutting edge future-tech courses, guides, and tutorials.",
  keywords = "tech education, learn programming, future technology, ai trends, tutorials",
  image = "https://learn2future.vercel.app/og-image.jpg",
  url = "https://learn2future.vercel.app",
  author = "Learn 2 Future",
  publishDate,
  canonicalUrl,
  type = "website",
}) => {
  useDocumentMetadata({
    title,
    description,
    keywords,
    image,
    url,
    author,
    publishDate,
    canonicalUrl,
    type,
  });

  return null; // Side-effect only component
};
