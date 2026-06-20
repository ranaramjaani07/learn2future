import { initializeApp } from "firebase/app";
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
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

    function formatDate(input) {
      if (!input) return "2026-06-11";
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
      return "2026-06-11";
    }

    let blogs = [];
    try {
      const q = query(collection(db, "blogs"), orderBy("publishDate", "desc"));
      const snap = await getDocs(q);
      if (!snap.empty) {
        blogs = snap.docs.map(doc => {
          const d = doc.data();
          return { slug: d.slug || "", publishDate: d.publishDate || d.createdAt || null };
        }).filter(b => b.slug);
      }
    } catch (e) {
      console.warn("Sitemap: failed to load blogs from firestore:", e.message);
    }

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
      console.warn("Sitemap: failed to load courses from firestore:", e.message);
    }

    const today = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://learn2future.vercel.app/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://learn2future.vercel.app/courses</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://learn2future.vercel.app/blog</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://learn2future.vercel.app/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://learn2future.vercel.app/contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;

    for (const blog of blogs) {
      if (blog.slug) {
        xml += `\n  <url>\n    <loc>https://learn2future.vercel.app/blog/${blog.slug}</loc>\n    <lastmod>${formatDate(blog.publishDate)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
      }
    }

    for (const course of courses) {
      const slugVal = course.slug || course.id;
      if (slugVal) {
        xml += `\n  <url>\n    <loc>https://learn2future.vercel.app/course/${slugVal}</loc>\n    <lastmod>${formatDate(course.createdAt)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
      }
    }

    xml += "\n</urlset>";

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
    return res.status(200).send(xml);
  } catch (err) {
    console.error("Vercel dynamic sitemap handler error:", err);
    return res.status(500).setHeader("Content-Type", "text/plain").send(`Internal Server Error: ${err.message}`);
  }
}
