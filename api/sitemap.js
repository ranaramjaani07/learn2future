import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(configPath)) {
      throw new Error("firebase-applet-config.json missing from workspace root.");
    }
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

    // Resolve sitemap type from query parameter
    const type = req.query.type || "index";

    function formatDate(input) {
      if (!input) return "2026-06-27";
      if (input && typeof input.toDate === "function") {
        try {
          return input.toDate().toISOString().split("T")[0];
        } catch (_) {}
      }
      if (input instanceof Date) {
        return input.toISOString().split("T")[0];
      }
      const str = String(input).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str;
      }
      try {
        const parsed = new Date(str);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().split("T")[0];
        }
      } catch (_) {}
      return "2026-06-27";
    }

    const today = new Date().toISOString().split("T")[0];
    const baseUrl = "https://learn2future.vercel.app";

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86450");

    if (type === "index") {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-static.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-courses.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-blogs.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-categories.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-images.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;
      return res.status(200).send(xml);
    }

    if (type === "static") {
      const staticPages = [
        { path: "", changefreq: "daily", priority: "1.0" },
        { path: "/courses", changefreq: "daily", priority: "0.9" },
        { path: "/blog", changefreq: "daily", priority: "0.9" },
        { path: "/about", changefreq: "weekly", priority: "0.8" },
        { path: "/contact", changefreq: "weekly", priority: "0.8" },
        { path: "/terms", changefreq: "monthly", priority: "0.4" },
        { path: "/privacy", changefreq: "monthly", priority: "0.4" },
        { path: "/refund-policy", changefreq: "monthly", priority: "0.4" },
        { path: "/affiliate", changefreq: "monthly", priority: "0.5" },
      ];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">`;

      for (const p of staticPages) {
        xml += `
  <url>
    <loc>${baseUrl}${p.path}</loc>
    <lastmod>2026-06-27</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`;
      }
      xml += "\n</urlset>";
      return res.status(200).send(xml);
    }

    if (type === "courses") {
      let courses = [];
      try {
        const snap = await getDocs(collection(db, "courses"));
        if (!snap.empty) {
          courses = snap.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              slug: d.slug || "",
              createdAt: d.updatedAt || d.createdAt || null
            };
          });
        }
      } catch (e) {
        console.warn("Sitemap: load courses from firestore failed, using fallbacks:", e.message);
      }

      // If Firestore fails/empty, use resilient bootstrap course slugs
      if (courses.length === 0) {
        courses = [
          { slug: "ai-gold" },
          { slug: "edit-cine" },
          { slug: "tube-viral" },
          { slug: "marketing-scale" },
          { slug: "freelance-ticket" },
          { slug: "start-saas" }
        ];
      }

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">`;

      for (const course of courses) {
        const slugVal = course.slug || course.id;
        if (slugVal) {
          xml += `
  <url>
    <loc>${baseUrl}/course/${slugVal}</loc>
    <lastmod>${formatDate(course.createdAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
        }
      }
      xml += "\n</urlset>";
      return res.status(200).send(xml);
    }

    if (type === "blogs") {
      let blogs = [];
      try {
        const q = query(collection(db, "blogs"), orderBy("publishDate", "desc"));
        const snap = await getDocs(q);
        if (!snap.empty) {
          blogs = snap.docs.map(doc => {
            const d = doc.data();
            return {
              slug: d.slug || "",
              publishDate: d.publishDate || d.createdAt || null
            };
          }).filter(b => b.slug);
        }
      } catch (e) {
        console.warn("Sitemap: load blogs from firestore failed, using fallbacks:", e.message);
      }

      // If Firestore fails/empty, use resilient bootstrap blog slugs
      if (blogs.length === 0) {
        blogs = [
          { slug: "why-learn2future-exists-affordable-skill-education" },
          { slug: "what-is-learn2future-affordable-skill-education-india" },
          { slug: "agentic-era-ai-copilots" },
          { slug: "typescript-native-esm-type-stripping" },
          { slug: "quantum-computing-algorithms-grover-shor" }
        ];
      }

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">`;

      for (const blog of blogs) {
        if (blog.slug) {
          xml += `
  <url>
    <loc>${baseUrl}/blog/${blog.slug}</loc>
    <lastmod>${formatDate(blog.publishDate)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        }
      }
      xml += "\n</urlset>";
      return res.status(200).send(xml);
    }

    if (type === "categories") {
      const categoriesList = [
        { path: "/courses?category=AI%20Tools" },
        { path: "/courses?category=Video%20Editing" },
        { path: "/courses?category=YouTube%20Growth" },
        { path: "/courses?category=Digital%20Marketing" },
        { path: "/courses?category=Freelancing" },
        { path: "/courses?category=Business" },
        { path: "/blog?category=AI%20Technology" },
        { path: "/blog?category=SaaS%20Automation" },
        { path: "/blog?category=Freelancing" },
        { path: "/blog?category=YouTube%20Mastery" },
        { path: "/blog?category=SEO%20Strategies" }
      ];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">`;

      for (const cat of categoriesList) {
        xml += `
  <url>
    <loc>${baseUrl}${cat.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }
      xml += "\n</urlset>";
      return res.status(200).send(xml);
    }

    if (type === "images") {
      let courses = [];
      let blogs = [];

      try {
        const cSnap = await getDocs(collection(db, "courses"));
        if (!cSnap.empty) {
          courses = cSnap.docs.map(doc => {
            const d = doc.data();
            return {
              slug: d.slug || doc.id,
              title: d.title || "Course Blueprint",
              image: d.imageUrl || d.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800"
            };
          });
        }
      } catch (_) {}

      try {
        const bSnap = await getDocs(collection(db, "blogs"));
        if (!bSnap.empty) {
          blogs = bSnap.docs.map(doc => {
            const d = doc.data();
            return {
              slug: d.slug || "",
              title: d.title || "Blog Post",
              image: d.featuredImage || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800"
            };
          }).filter(b => b.slug);
        }
      } catch (_) {}

      // Resilient Fallbacks if empty
      if (courses.length === 0) {
        courses = [
          { slug: "ai-gold", title: "Artificial Intelligence Goldmine", image: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=800" },
          { slug: "edit-cine", title: "Cinematic Video Editing Mastery", image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=800" },
          { slug: "tube-viral", title: "YouTube Viral Automation Blueprint", image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=800" }
        ];
      }
      if (blogs.length === 0) {
        blogs = [
          { slug: "why-learn2future-exists-affordable-skill-education", title: "Why Learn2Future Exists", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800" },
          { slug: "agentic-era-ai-copilots", title: "The Agentic Era: AI Copilots", image: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=800" }
        ];
      }

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

      for (const course of courses) {
        xml += `
  <url>
    <loc>${baseUrl}/course/${course.slug}</loc>
    <image:image>
      <image:loc>${course.image}</image:loc>
      <image:title>${course.title.replace(/&/g, "&amp;")}</image:title>
    </image:image>
  </url>`;
      }

      for (const blog of blogs) {
        xml += `
  <url>
    <loc>${baseUrl}/blog/${blog.slug}</loc>
    <image:image>
      <image:loc>${blog.image}</image:loc>
      <image:title>${blog.title.replace(/&/g, "&amp;")}</image:title>
    </image:image>
  </url>`;
      }

      xml += "\n</urlset>";
      return res.status(200).send(xml);
    }

    return res.status(400).send("Invalid sitemap type parameter.");
  } catch (err) {
    console.error("Dynamic sitemap generator error:", err);
    return res.status(500).setHeader("Content-Type", "text/plain").send(`Internal Server Error: ${err.message}`);
  }
}
