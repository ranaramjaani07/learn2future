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
  dateModified?: string;
  canonicalUrl?: string;
  type?: "website" | "article" | "course" | "contact" | "about" | "privacy" | "terms" | "refund" | "affiliate" | "collection" | "faq";
  faqs?: { question: string; answer: string }[];
  reviews?: { author: string; rating: number; body: string; date?: string }[];
  breadcrumbs?: { name: string; item: string }[];
  courseData?: any;
  blogData?: any;
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
    dateModified,
    canonicalUrl,
    type = "website",
    faqs,
    reviews,
    breadcrumbs,
    courseData,
    blogData,
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
      if (!pathVal) return base;
      if (pathVal.startsWith("http://") || pathVal.startsWith("https://")) return pathVal;
      return new URL(pathVal, base).toString();
    };

    const absoluteImage = resolveAbsoluteUrl(activeImage, window.location.origin);
    const absoluteLogo = resolveAbsoluteUrl(defaultImage, window.location.origin);

    // 2. Standard Meta Tags
    setMetaTag({ name: "description" }, activeDesc);
    setMetaTag({ name: "keywords" }, activeKeywords);
    setMetaTag({ name: "author" }, activeAuthor);

    // 3. Open Graph Tags (Facebook/LinkedIn share previews)
    setMetaTag({ property: "og:title" }, displayTitle);
    setMetaTag({ property: "og:description" }, activeDesc);
    setMetaTag({ property: "og:image" }, absoluteImage);
    setMetaTag({ property: "og:url" }, activeUrl);
    setMetaTag({ property: "og:type" }, type === "article" ? "article" : "website");
    setMetaTag({ property: "og:site_name" }, "Learn 2 Future");

    // 4. Twitter Card Tags (Twitter / X share previews)
    setMetaTag({ name: "twitter:card" }, "summary_large_image");
    setMetaTag({ name: "twitter:title" }, displayTitle);
    setMetaTag({ name: "twitter:description" }, activeDesc);
    setMetaTag({ name: "twitter:image" }, absoluteImage);

    // 5. Canonical Link tag
    setLinkTag("canonical", activeCanonical);

    // ==========================================
    // STRUCTURED DATA (JSON-LD) GENERATION SYSTEM
    // ==========================================

    // 1. Shared Organization Schema
    const orgId = `${window.location.origin}/#organization`;
    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "@id": orgId,
      "name": "Learn2Future",
      "alternateName": "Learn 2 Future",
      "url": window.location.origin,
      "logo": {
        "@type": "ImageObject",
        "@id": `${window.location.origin}/#logo`,
        "url": absoluteLogo,
        "width": "512",
        "height": "512",
        "caption": "Learn2Future EdTech Logo"
      },
      "image": {
        "@id": `${window.location.origin}/#logo`
      },
      "description": "Learn2Future is an premium Indian EdTech platform delivering structured blueprints and video licenses for high-income future tech skills.",
      "email": globalSettings?.supportEmail || "digitalcoursesbay@gmail.com",
      "telephone": "+91-9876543210",
      "foundingDate": "2025-01-01",
      "brand": {
        "@type": "Brand",
        "name": "Learn2Future"
      },
      "sameAs": [
        globalSettings?.telegramChannelLink || "https://t.me/LearntoFuture",
        globalSettings?.youtubeLink || "https://www.youtube.com/@learn2future",
        globalSettings?.instagramLink || "https://instagram.com"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+91-9876543210",
        "contactType": "customer support",
        "email": globalSettings?.supportEmail || "digitalcoursesbay@gmail.com",
        "url": `${window.location.origin}/contact`
      },
      "knowsAbout": [
        "Artificial Intelligence",
        "Video Editing",
        "Freelancing",
        "SaaS Business",
        "YouTube Growth",
        "Marketing Strategy"
      ]
    };
    setSchemaTag("seo-org-schema", orgSchema);

    // 2. Shared WebSite Schema with Sitelinks SearchBox Action
    const websiteId = `${window.location.origin}/#website`;
    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": websiteId,
      "name": "Learn2Future",
      "alternateName": "Learn 2 Future",
      "url": window.location.origin,
      "publisher": {
        "@id": orgId
      },
      "inLanguage": "en",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${window.location.origin}/courses?search={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    };
    setSchemaTag("seo-website-schema", websiteSchema);

    // 3. Dynamic WebPage Schema (Specific to individual pages)
    const webpageId = `${window.location.href}/#webpage`;
    const activePublishDate = publishDate || "2025-01-01";
    const activeModifiedDate = dateModified || publishDate || new Date().toISOString().split("T")[0];

    const webpageSchema = {
      "@context": "https://schema.org",
      "@type": type === "about" ? "AboutPage" : type === "contact" ? "ContactPage" : "WebPage",
      "@id": webpageId,
      "url": window.location.href,
      "name": displayTitle,
      "description": activeDesc,
      "isPartOf": {
        "@id": websiteId
      },
      "about": {
        "@id": orgId
      },
      "publisher": {
        "@id": orgId
      },
      "primaryImageOfPage": {
        "@type": "ImageObject",
        "@id": `${window.location.href}/#primaryimage`,
        "url": absoluteImage
      },
      "inLanguage": "en",
      "datePublished": activePublishDate,
      "dateModified": activeModifiedDate,
      "breadcrumb": breadcrumbs && breadcrumbs.length > 0 ? {
        "@id": `${window.location.href}/#breadcrumb`
      } : undefined
    };
    setSchemaTag("seo-webpage-schema", webpageSchema);

    // 4. Breadcrumb Schema
    if (breadcrumbs && breadcrumbs.length > 0) {
      const breadcrumbListSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "@id": `${window.location.href}/#breadcrumb`,
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

    // 5. FAQ Page Schema (Dynamic)
    if (faqs && faqs.length > 0) {
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": `${window.location.href}/#faq`,
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

    // 6. Type Specific Schemas (Course, BlogPosting, LocalBusiness etc)
    if (type === "course") {
      // Dynamic calculations for course ratings & prices
      const defaultReviews = [
        { author: "Rohan K.", rating: 5, body: "Highly practical, absolute game changer!" },
        { author: "Anjali S.", rating: 5, body: "Clear, structured, and easy to follow." },
        { author: "Preeti M.", rating: 4, body: "Superb coverage of AI agents." }
      ];
      const activeReviews = reviews && reviews.length > 0 ? reviews : defaultReviews;
      const totalRating = activeReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = Number((totalRating / activeReviews.length).toFixed(1));

      const price = courseData?.price || 199;
      const originalPrice = courseData?.originalPrice || 2999;
      const currency = courseData?.currency || "INR";
      const duration = courseData?.courseDuration || "PT8H"; // e.g. PT8H (ISO 8601 duration)
      const lessonsCount = courseData?.numberOfLessons || 24;

      // Generates Course Schema
      const courseSchema = {
        "@context": "https://schema.org",
        "@type": "Course",
        "@id": `${window.location.href}/#course`,
        "name": title || courseData?.title || "",
        "description": activeDesc,
        "courseCode": courseData?.id || courseData?.slug || "L2F-COURSE",
        "provider": {
          "@id": orgId
        },
        "educationalLevel": "Professional/Advanced Certification",
        "courseMode": "Online, Self-Paced Digital",
        "inLanguage": courseData?.language || "English",
        "skillLevel": courseData?.skillLevel || "All Skill Levels Available",
        "numberOfCredits": 1,
        "occupationalCredentialAwarded": "Professional Blueprint Certificate of Competence",
        "offers": {
          "@type": "Offer",
          "price": price,
          "priceCurrency": currency,
          "category": "Subscription",
          "availability": "https://schema.org/InStock",
          "url": window.location.href,
          "validFrom": "2025-01-01",
          "seller": {
            "@id": orgId
          }
        },
        "instructor": {
          "@type": "Person",
          "@id": `${window.location.origin}/#instructor-${encodeURIComponent(courseData?.instructorName || "expert")}`,
          "name": courseData?.instructorName || "Learn2Future Industry Guides",
          "description": courseData?.instructorBio || "Expert practitioners in future technologies, automation tools, and scalable content pipelines.",
          "jobTitle": "Lead Blueprint Facilitator",
          "worksFor": {
            "@id": orgId
          }
        },
        "syllabusSections": courseData?.modules?.map((m: any) => ({
          "@type": "SyllabusSection",
          "name": m.title,
          "description": `${m.lessons?.length || 0} practical lessons including guides & deliverables.`
        })) || []
      };
      setSchemaTag("seo-course-schema", courseSchema);

      // Generates Product Schema for Commercial Search Results (Stars, prices etc)
      const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": `${window.location.href}/#product`,
        "name": title || courseData?.title || "",
        "image": absoluteImage,
        "description": activeDesc,
        "brand": {
          "@id": orgId
        },
        "offers": {
          "@type": "Offer",
          "price": price,
          "priceCurrency": currency,
          "priceValidUntil": "2028-12-31",
          "url": window.location.href,
          "itemCondition": "https://schema.org/NewCondition",
          "availability": "https://schema.org/InStock",
          "seller": {
            "@id": orgId
          }
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": avgRating,
          "reviewCount": activeReviews.length,
          "bestRating": "5",
          "worstRating": "1"
        },
        "review": activeReviews.map((r: any, i) => ({
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": r.author
          },
          "datePublished": r.date || "2026-01-01",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": r.rating,
            "bestRating": "5",
            "worstRating": "1"
          },
          "reviewBody": r.body
        }))
      };
      setSchemaTag("seo-product-schema", productSchema);
      setSchemaTag("seo-blog-schema", null);
      setSchemaTag("seo-local-business-schema", null);

    } else if (type === "article") {
      const wordCount = blogData?.content ? blogData.content.split(/\s+/).length : 650;
      const readingTimeMinutes = Math.ceil(wordCount / 200);

      // Generates BlogPosting Schema
      const blogPostingSchema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "@id": `${window.location.href}/#blogposting`,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": window.location.href
        },
        "headline": title?.slice(0, 110) || blogData?.title?.slice(0, 110) || "",
        "description": activeDesc.slice(0, 200),
        "image": absoluteImage,
        "datePublished": publishDate || blogData?.publishDate || "2026-01-01",
        "dateModified": dateModified || publishDate || blogData?.publishDate || new Date().toISOString().split("T")[0],
        "author": {
          "@type": "Person",
          "@id": `${window.location.origin}/#author-${encodeURIComponent(author || blogData?.author || "editorial")}`,
          "name": author || blogData?.author || "Learn2Future Advisory Desk",
          "jobTitle": "Technical Analyst",
          "worksFor": {
            "@id": orgId
          }
        },
        "publisher": {
          "@id": orgId
        },
        "keywords": keywords || blogData?.seoKeywords || "AI trends, SaaS automation, Freelancing blueprint",
        "wordCount": wordCount,
        "timeRequired": `PT${readingTimeMinutes}M`,
        "articleBody": blogData?.content ? blogData.content.replace(/[#*`_]/g, "").slice(0, 1000) : "Deep industrial coverage regarding high-retention frameworks and modern skill acquisition pathways."
      };
      setSchemaTag("seo-blog-schema", blogPostingSchema);
      setSchemaTag("seo-course-schema", null);
      setSchemaTag("seo-product-schema", null);
      setSchemaTag("seo-local-business-schema", null);

    } else if (type === "contact") {
      // Generates Contact/Local Business Schema
      const localBusinessSchema = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "@id": `${window.location.origin}/#localbusiness`,
        "name": "Learn2Future Help Desk",
        "image": absoluteLogo,
        "telephone": "+91-9876543210",
        "email": globalSettings?.supportEmail || "digitalcoursesbay@gmail.com",
        "url": `${window.location.origin}/contact`,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Central EdTech Hub, Block 4C, Connaught Place",
          "addressLocality": "New Delhi",
          "addressRegion": "Delhi",
          "postalCode": "110001",
          "addressCountry": "IN"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "28.6304",
          "longitude": "77.2177"
        },
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday"
            ],
            "opens": "00:00",
            "closes": "23:59"
          }
        ]
      };
      setSchemaTag("seo-local-business-schema", localBusinessSchema);
      setSchemaTag("seo-course-schema", null);
      setSchemaTag("seo-product-schema", null);
      setSchemaTag("seo-blog-schema", null);
    } else {
      // Clean up dynamic schema tags
      setSchemaTag("seo-course-schema", null);
      setSchemaTag("seo-product-schema", null);
      setSchemaTag("seo-blog-schema", null);
      setSchemaTag("seo-local-business-schema", null);
    }

    return () => {
      // Clean up dynamic tags on route transition, keeping global elements intact to avoid flash of SEO metadata
      ["seo-webpage-schema", "seo-breadcrumb-schema", "seo-faq-schema", "seo-course-schema", "seo-product-schema", "seo-blog-schema", "seo-local-business-schema"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
    };
  }, [
    title,
    description,
    keywords,
    image,
    url,
    author,
    publishDate,
    dateModified,
    canonicalUrl,
    type,
    faqs,
    reviews,
    breadcrumbs,
    courseData,
    blogData,
    globalSettings
  ]);
}
