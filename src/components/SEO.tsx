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
  type?: "website" | "article" | "course" | "contact" | "about" | "privacy" | "terms" | "refund" | "affiliate" | "collection" | "faq";
  faqs?: { question: string; answer: string }[];
  reviews?: { author: string; rating: number; body: string }[];
  breadcrumbs?: { name: string; item: string }[];
  courseData?: any;
  blogData?: any;
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
  faqs,
  reviews,
  breadcrumbs,
  courseData,
  blogData,
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
    faqs,
    reviews,
    breadcrumbs,
    courseData,
    blogData,
  });

  return null; // Side-effect only component
};
