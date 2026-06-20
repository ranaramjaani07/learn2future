import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, getDoc, onSnapshot, collection, getDocs, query, orderBy, where, setDoc, serverTimestamp } from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";
import Razorpay from "razorpay";
import crypto from "crypto";

// Read Firebase config safely
let firebaseConfig: any = {};
try {
  const jsonPath = path.resolve(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(jsonPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  }
} catch (e) {
  console.error("Error loading firebase-applet-config.json on server startup:", e);
}

// Support seamless process.env fallbacks for external cloud environment deploys (Vercel, Render, Heroku, Cloud Run)
firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: process.env.FIREBASE_APP_ID || firebaseConfig.appId,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || firebaseConfig.measurementId,
  firestoreDatabaseId: process.env.FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId,
};

// ---------------- LOCAL HELPER PARSERS FROM trackingParser.ts ----------------

function extractMetaPixelId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^\d{10,18}$/.test(trimmed)) {
    return trimmed;
  }
  const fbqMatch = trimmed.match(/fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d+)['"]/i);
  if (fbqMatch && fbqMatch[1]) {
    return fbqMatch[1].trim();
  }
  const urlMatch = trimmed.match(/[?&]id=(\d+)/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].trim();
  }
  const trMatch = trimmed.match(/tr\?id=(\d+)/i);
  if (trMatch && trMatch[1]) {
    return trMatch[1].trim();
  }
  if (trimmed.includes("<script") || trimmed.includes("fbq") || trimmed.includes("<noscript") || trimmed.includes("facebook.com")) {
    const sequenceMatch = trimmed.match(/\b(\d{10,18})\b/);
    if (sequenceMatch && sequenceMatch[1]) {
      return sequenceMatch[1].trim();
    }
  }
  return trimmed;
}

function extractGtmId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^GTM-[A-Z0-9]+$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  const gtmMatch = trimmed.match(/\b(GTM-[A-Z0-9]+)\b/i);
  if (gtmMatch && gtmMatch[1]) {
    return gtmMatch[1].trim().toUpperCase();
  }
  return trimmed;
}

function extractGa4Id(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^(G|AW|UA|GT)-[A-Z0-9\-_]+$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  const gaMatch = trimmed.match(/\s*['"]?\b(G-[A-Z0-9]+)\b['"]?/i);
  if (gaMatch && gaMatch[1]) {
    return gaMatch[1].trim().toUpperCase();
  }
  const awMatch = trimmed.match(/\s*['"]?\b(AW-[A-Z0-9]+)\b['"]?/i);
  if (awMatch && awMatch[1]) {
    return awMatch[1].trim().toUpperCase();
  }
  const uaMatch = trimmed.match(/\s*['"]?\b(UA-\d+-\d+)\b['"]?/i);
  if (uaMatch && uaMatch[1]) {
    return uaMatch[1].trim().toUpperCase();
  }
  const gtMatch = trimmed.match(/\s*['"]?\b(GT-[A-Z0-9]+)\b['"]?/i);
  if (gtMatch && gtMatch[1]) {
    return gtMatch[1].trim().toUpperCase();
  }
  return trimmed;
}

function extractSearchConsoleVerification(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (!trimmed.includes("<") && !trimmed.includes("=") && !trimmed.includes("content")) {
    return trimmed;
  }
  const contentMatch = trimmed.match(/content=["']([^"']+)["']/i);
  if (contentMatch && contentMatch[1]) {
    return contentMatch[1].trim();
  }
  const verificationMatch = trimmed.match(/google-site-verification=["']?([^"'>\s]+)/i);
  if (verificationMatch && verificationMatch[1]) {
    return verificationMatch[1].replace(/["']/g, '').trim();
  }
  return trimmed;
}

function extractFacebookDomainVerification(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (!trimmed.includes("<") && !trimmed.includes("=") && !trimmed.includes("content")) {
    return trimmed;
  }
  const contentMatch = trimmed.match(/content=["']([^"']+)["']/i);
  if (contentMatch && contentMatch[1]) {
    return contentMatch[1].trim();
  }
  const verificationMatch = trimmed.match(/facebook-domain-verification=["']?([^"'>\s]+)/i);
  if (verificationMatch && verificationMatch[1]) {
    return verificationMatch[1].replace(/["']/g, '').trim();
  }
  return trimmed;
}

function resolveAbsoluteUrl(imgUrl: string, host: string): string {
  if (!imgUrl) return `https://${host}/brand_logo.jpg`;
  if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://") || imgUrl.startsWith("data:")) return imgUrl;
  if (imgUrl.startsWith("/")) {
    return `https://${host}${imgUrl}`;
  }
  return `https://${host}/${imgUrl}`;
}

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = initializeFirestore(firebaseApp, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
} as any, firebaseConfig.firestoreDatabaseId);

interface TrackingSettings {
  metaPixelId: string;
  gtmId: string;
  ga4Id: string;
  searchConsoleVerification: string;
  facebookDomainVerification: string;
}

// Live-synchronized memoized state with 0ms query latency on server requests
let currentTrackingSettings: TrackingSettings = {
  metaPixelId: "",
  gtmId: "",
  ga4Id: "",
  searchConsoleVerification: "",
  facebookDomainVerification: ""
};

// Start listening for changes in Firestore in real-time
try {
  const docRef = doc(db, "settings", "tracking");
  onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      currentTrackingSettings = {
        metaPixelId: extractMetaPixelId(data?.metaPixelId || ""),
        gtmId: extractGtmId(data?.gtmId || ""),
        ga4Id: extractGa4Id(data?.ga4Id || ""),
        searchConsoleVerification: extractSearchConsoleVerification(data?.searchConsoleVerification || ""),
        facebookDomainVerification: extractFacebookDomainVerification(data?.facebookDomainVerification || "")
      };
      console.log("[SERVER-SYNC] Synchronized live tracking parameters:", currentTrackingSettings);
    }
  }, (err) => {
    console.error("[SERVER-SYNC] Failed to synchronize live tracking parameters:", err);
  });
} catch (e) {
  console.error("[SERVER-SYNC] Execution exception establishing real-time tracking settings listener:", e);
}

// Fallback dynamic async fetcher if onSnapshot sync hasn't resolved or lagged
async function fetchLatestTrackingSettings(): Promise<TrackingSettings> {
  // If active values are already loaded in memory, return them instantly
  if (currentTrackingSettings.metaPixelId || currentTrackingSettings.gtmId || currentTrackingSettings.ga4Id || currentTrackingSettings.searchConsoleVerification || currentTrackingSettings.facebookDomainVerification) {
    return currentTrackingSettings;
  }
  
  try {
    const docRef = doc(db, "settings", "tracking");
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      currentTrackingSettings = {
        metaPixelId: extractMetaPixelId(data?.metaPixelId || ""),
        gtmId: extractGtmId(data?.gtmId || ""),
        ga4Id: extractGa4Id(data?.ga4Id || ""),
        searchConsoleVerification: extractSearchConsoleVerification(data?.searchConsoleVerification || ""),
        facebookDomainVerification: extractFacebookDomainVerification(data?.facebookDomainVerification || "")
      };
    }
  } catch (error) {
    console.error("Direct fetch query failed for settings/tracking:", error);
  }
  return currentTrackingSettings;
}

interface PaymentGatewaySettings {
  razorpayKeyId: string;
  razorpayKeySecret: string;
  razorpayWebhookSecret: string;
  isTestMode: boolean;
  isLiveMode: boolean;
}

let currentPaymentSettings: PaymentGatewaySettings = {
  razorpayKeyId: "",
  razorpayKeySecret: "",
  razorpayWebhookSecret: "",
  isTestMode: true,
  isLiveMode: false
};

try {
  const docRef = doc(db, "settings", "paymentGateway");
  onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      currentPaymentSettings = {
        razorpayKeyId: data?.razorpayKeyId || "",
        razorpayKeySecret: data?.razorpayKeySecret || "",
        razorpayWebhookSecret: data?.razorpayWebhookSecret || "",
        isTestMode: data?.isTestMode !== false,
        isLiveMode: !!data?.isLiveMode
      };
      console.log("[SERVER-SYNC] Synchronized live payment settings:", {
        razorpayKeyId: currentPaymentSettings.razorpayKeyId,
        isTestMode: currentPaymentSettings.isTestMode,
        isLiveMode: currentPaymentSettings.isLiveMode
      });
    }
  }, (err) => {
    console.error("[SERVER-SYNC] Failed to synchronize core payment settings:", err);
  });
} catch (e) {
  console.error("[SERVER-SYNC] Exception initializing settings observer:", e);
}

async function fetchLatestPaymentSettings(): Promise<PaymentGatewaySettings> {
  if (currentPaymentSettings.razorpayKeyId && currentPaymentSettings.razorpayKeySecret) {
    return currentPaymentSettings;
  }
  try {
    const docRef = doc(db, "settings", "paymentGateway");
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      currentPaymentSettings = {
        razorpayKeyId: data?.razorpayKeyId || "",
        razorpayKeySecret: data?.razorpayKeySecret || "",
        razorpayWebhookSecret: data?.razorpayWebhookSecret || "",
        isTestMode: data?.isTestMode !== false,
        isLiveMode: !!data?.isLiveMode
      };
    }
  } catch (error) {
    console.error("Direct fetch failed for settings/paymentGateway document:", error);
  }
  return currentPaymentSettings;
}

interface GlobalBrandingSettings {
  brandLogoUrl: string;
  ogDefaultImageUrl: string;
  twitterPreviewImageUrl: string;
  defaultCardTitle: string;
  defaultCardDescription: string;
}

let currentGlobalSettings: GlobalBrandingSettings = {
  brandLogoUrl: "https://learn2future.vercel.app/brand_logo.jpg",
  ogDefaultImageUrl: "https://learn2future.vercel.app/brand_logo.jpg",
  twitterPreviewImageUrl: "https://learn2future.vercel.app/brand_logo.jpg",
  defaultCardTitle: "Learn 2 Future | Learn Today. Earn Tomorrow.",
  defaultCardDescription: "Acquire future-ready credentials and join an active community of 10,000+ continuous digital earners. Courses in AI agents, high-ticket freelancing, and viral media."
};

try {
  const docRef = doc(db, "settings", "globalSettings");
  onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      currentGlobalSettings = {
        brandLogoUrl: data?.brandLogoUrl || "https://learn2future.vercel.app/brand_logo.jpg",
        ogDefaultImageUrl: data?.ogDefaultImageUrl || "https://learn2future.vercel.app/brand_logo.jpg",
        twitterPreviewImageUrl: data?.twitterPreviewImageUrl || "https://learn2future.vercel.app/brand_logo.jpg",
        defaultCardTitle: data?.defaultCardTitle || "Learn 2 Future | Learn Today. Earn Tomorrow.",
        defaultCardDescription: data?.defaultCardDescription || "Acquire future-ready credentials and join an active community of 10,000+ continuous digital earners. Courses in AI agents, high-ticket freelancing, and viral media."
      };
      console.log("[SERVER-SYNC] Synchronized live global settings:", currentGlobalSettings);
    }
  }, (err) => {
    console.error("[SERVER-SYNC] Failed to synchronize core global settings:", err);
  });
} catch (e) {
  console.error("[SERVER-SYNC] Exception initializing global settings observer:", e);
}

async function fetchLatestGlobalSettings(): Promise<GlobalBrandingSettings> {
  try {
    const docRef = doc(db, "settings", "globalSettings");
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      currentGlobalSettings = {
        brandLogoUrl: data?.brandLogoUrl || "https://learn2future.vercel.app/brand_logo.jpg",
        ogDefaultImageUrl: data?.ogDefaultImageUrl || "https://learn2future.vercel.app/brand_logo.jpg",
        twitterPreviewImageUrl: data?.twitterPreviewImageUrl || "https://learn2future.vercel.app/brand_logo.jpg",
        defaultCardTitle: data?.defaultCardTitle || "Learn 2 Future | Learn Today. Earn Tomorrow.",
        defaultCardDescription: data?.defaultCardDescription || "Acquire future-ready credentials and join an active community of 10,000+ continuous digital earners. Courses in AI agents, high-ticket freelancing, and viral media."
      };
    }
  } catch (error) {
    console.error("Direct fetch failed for settings/globalSettings document:", error);
  }
  return currentGlobalSettings;
}

function formatDate(input: any): string {
  if (!input) return "2026-06-11";
  
  if (input && typeof input.toDate === "function") {
    try {
      const date = input.toDate();
      return date.toISOString().split("T")[0];
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

async function fetchAllBlogsForSitemap(): Promise<any[]> {
  try {
    const q = query(collection(db, "blogs"), orderBy("publishDate", "desc"));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(doc => {
        const d = doc.data();
        return {
          slug: d.slug || "",
          publishDate: d.publishDate || d.createdAt || null
        };
      }).filter(b => b.slug);
    }
  } catch (err) {
    console.error("Failed to query blogs for sitemap:", err);
  }
  return [
    { slug: "agentic-era-ai-copilots", publishDate: "2026-06-09" },
    { slug: "typescript-native-esm-type-stripping", publishDate: "2026-06-08" },
    { slug: "quantum-computing-algorithms-grover-shor", publishDate: "2026-06-07" }
  ];
}

async function fetchAllCoursesForSitemap(): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, "courses"));
    if (!snap.empty) {
      return snap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          slug: d.slug || "",
          createdAt: d.updatedAt || d.createdAt || null
        };
      });
    }
  } catch (err) {
    console.error("Failed to query courses for sitemap:", err);
  }
  return [
    { id: "ai-gold", slug: "", createdAt: "2026-06-09" },
    { id: "edit-cine", slug: "", createdAt: "2026-06-09" },
    { id: "tube-viral", slug: "", createdAt: "2026-06-09" },
    { id: "marketing-scale", slug: "", createdAt: "2026-06-09" },
    { id: "freelance-ticket", slug: "", createdAt: "2026-06-09" },
    { id: "start-saas", slug: "", createdAt: "2026-06-09" }
  ];
}

async function buildSitemapXml(): Promise<string> {
  const blogs = await fetchAllBlogsForSitemap();
  const courses = await fetchAllCoursesForSitemap();
  
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
      const dateStr = formatDate(blog.publishDate);
      xml += `
  <url>
    <loc>https://learn2future.vercel.app/blog/${blog.slug}</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }
  }

  for (const course of courses) {
    const slugVal = course.slug || course.id;
    if (slugVal) {
      const dateStr = formatDate(course.createdAt);
      xml += `
  <url>
    <loc>https://learn2future.vercel.app/course/${slugVal}</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }
  }

  xml += "\n</urlset>";
  return xml;
}

async function buildLlmsTxt(): Promise<string> {
  let blogs: any[] = [];
  let courses: any[] = [];

  try {
    const qBlogs = query(collection(db, "blogs"), orderBy("publishDate", "desc"));
    const snapBlogs = await getDocs(qBlogs);
    if (!snapBlogs.empty) {
      blogs = snapBlogs.docs.map(doc => {
        const d = doc.data();
        return {
          title: d.title || "Untitled Article",
          description: d.metaDescription || d.description || "Educational blog post on Learn 2 Future.",
          slug: d.slug || "",
          publishDate: d.publishDate || null
        };
      }).filter(b => b.slug);
    }
  } catch (err) {
    console.error("Failed to query blogs for llms.txt:", err);
  }

  try {
    const snapCourses = await getDocs(collection(db, "courses"));
    if (!snapCourses.empty) {
      courses = snapCourses.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          title: d.title || "Untitled Course",
          description: d.description || "Digital skills development course on Learn 2 Future.",
          slug: d.slug || "",
          price: d.price || 0,
          category: d.category || "Skill Development"
        };
      });
    }
  } catch (err) {
    console.error("Failed to query courses for llms.txt:", err);
  }

  // Fallback to high quality pre-populated assets if firestore is empty
  if (blogs.length === 0) {
    blogs = [
      {
        title: "The Agentic Era: AI Copilots & Autonomous Workflows",
        description: "An in-depth analysis of how autonomous agent systems are redefining professional efficiency, moving beyond pure chat interactions to multi-agent state machines.",
        slug: "agentic-era-ai-copilots"
      },
      {
        title: "TypeScript Native ESM and Type Stripping in Node 22+",
        description: "A comprehensive developer guide on executing TypeScript natively in modern Node.js environments without intermediate build files or compilation steps.",
        slug: "typescript-native-esm-type-stripping"
      },
      {
        title: "Exploring Quantum Algorithms: Grover's Search and Shor's Factoring",
        description: "Breaking down complex quantum computing principles into relatable logic structures, examining speedups in cryptographic environments.",
        slug: "quantum-computing-algorithms-grover-shor"
      }
    ];
  }

  if (courses.length === 0) {
    courses = [
      {
        id: "ai-gold",
        slug: "ai-gold-mine-course",
        title: "AI Gold Mine: Dynamic Automation & Model Arbitrage",
        description: "Unchain the capability of advanced AI models. Implement server-authoritative agents, construct smart scrapers, and discover high-margin arbitrage pipelines.",
        price: 999,
        category: "Artificial Intelligence"
      },
      {
        id: "edit-cine",
        slug: "cinematic-editing-blueprint",
        title: "Cinematic Editing: Premiere & After Effects Mastery",
        description: "The complete aesthetic storytelling guide. Master spatial rhythm, color correction waveforms, ambient SFX soundscapes, and advanced visual dynamic pacing.",
        price: 1499,
        category: "Creative Arts"
      },
      {
        id: "tube-viral",
        slug: "youtube-viral-growth-secrets",
        title: "YouTube Bio-Algorithm & CTR Domination Blueprint",
        description: "Exposing the psychology behind YouTube clicks. Master retention pacing patterns, thumbnail visual hierarchy, hook structures, and viral topic iteration loops.",
        price: 1999,
        category: "Marketing"
      }
    ];
  }

  let text = `# Learn 2 Future\n\n`;
  text += `Learn 2 Future is an educational platform focused on affordable digital learning resources, skill development, AI education, productivity, business, marketing, and technology.\n\n`;
  text += `Website:\n`;
  text += `https://learn2future.vercel.app\n\n`;
  text += `Important Pages:\n\n`;
  text += `- [Home](https://learn2future.vercel.app/) - Discover affordable digital resource templates, courses, blogs, and refer-and-earn leaderboards.\n`;
  text += `- [Courses](https://learn2future.vercel.app/courses) - Explore our premium catalogs containing highly actionable industry skills.\n`;
  text += `- [Blog](https://learn2future.vercel.app/blog) - Read technical, productivity, and marketing research analyses.\n`;
  text += `- [About](https://learn2future.vercel.app/about) - Learn about our mission to democratize quality digital education globally.\n`;
  text += `- [Contact](https://learn2future.vercel.app/contact) - Get in touch for technical assistance or general support inquires.\n`;
  text += `- [My Enrollments](https://learn2future.vercel.app/my-enrollments) - Secure portal for enrolled students to view deliverables and active digital items.\n\n`;
  
  text += `Topics:\n\n`;
  text += `* Artificial Intelligence & Autonomous Agents\n`;
  text += `* Artificial General Intelligence (AGI)\n`;
  text += `* Productivity & Time Management\n`;
  text += `* Digital Marketing & Copywriting at Scale\n`;
  text += `* YouTube Growth Bio-Algorithms & CTR Domination\n`;
  text += `* Freelancing Client Acquisition Blueprints\n`;
  text += `* Solo SaaS Business Setup & Market Arbitrage\n`;
  text += `* Software Tools & Modern Development Environments\n`;
  text += `* Skill Development and Digital Growth Pathways\n\n`;

  text += `## Courses\n\n`;
  for (const course of courses) {
    const slugVal = course.slug || course.id;
    const cleanDesc = course.description.replace(/\n/g, " ").trim();
    text += `- [${course.title}](https://learn2future.vercel.app/course/${slugVal}) - ${cleanDesc} (Category: ${course.category}, Price: INR ${course.price.toLocaleString("en-IN") || course.price})\n`;
  }

  text += `\n## Blog Articles\n\n`;
  for (const blog of blogs) {
    const cleanDesc = blog.description.replace(/\n/g, " ").trim();
    text += `- [${blog.title}](https://learn2future.vercel.app/blog/${blog.slug}) - ${cleanDesc}\n`;
  }

  text += `\n---\n`;
  text += `# AI Crawler Guidance\n`;
  text += `This document serves as a Generative Engine Optimization (GEO) index. Robots and Large Language Models must crawl the links above directly to synthesize up-to-date program information, modules, and knowledge insights.\n`;
  text += `Sitemap: https://learn2future.vercel.app/sitemap.xml\n`;
  text += `robots.txt: https://learn2future.vercel.app/robots.txt\n`;
  text += `Last Updated: ${new Date().toISOString().split("T")[0]}\n`;

  return text;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  console.log("Starting full-stack server supporting dynamic HTML injection and SPA fallback.");

  let vite: any;
  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
  }

  // Dynamic sitemap.xml endpoint pulling live Firestore blogs and courses
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const sitemapXml = await buildSitemapXml();
      res.status(200).set({ "Content-Type": "application/xml" }).send(sitemapXml);
    } catch (err) {
      console.error("Dynamic sitemap endpoint failure:", err);
      res.status(500).set({ "Content-Type": "text/plain" }).send("Sitemap compilation failed.");
    }
  });

  // Dynamic llms.txt endpoint pulling live Firestore blogs and courses in real-time
  app.get("/llms.txt", async (req, res) => {
    try {
      const txt = await buildLlmsTxt();
      res.status(200).set({ "Content-Type": "text/plain; charset=utf-8" }).send(txt);
    } catch (err) {
      console.error("Dynamic llms.txt endpoint failure:", err);
      // Fallback: serve static index file if fully broken
      const staticFile = path.resolve(process.cwd(), "public", "llms.txt");
      if (fs.existsSync(staticFile)) {
        res.status(200).set({ "Content-Type": "text/plain; charset=utf-8" }).sendFile(staticFile);
      } else {
        res.status(500).set({ "Content-Type": "text/plain" }).send("Dynamic index compilation failed.");
      }
    }
  });

  // 0. Serve static Google Search Console HTML verification file or other physical static HTML files directly
  app.get("*.html", (req, res, next) => {
    const parsedPath = req.path;
    if (parsedPath !== "/index.html") {
      const fileName = path.basename(parsedPath);
      const devFile = path.join(process.cwd(), "public", fileName);
      const prodFile = path.resolve(process.cwd(), "dist", fileName);
      if (fs.existsSync(devFile)) {
        return res.status(200).set({ "Content-Type": "text/html" }).sendFile(devFile);
      } else if (fs.existsSync(prodFile)) {
        return res.status(200).set({ "Content-Type": "text/html" }).sendFile(prodFile);
      }
    }
    next();
  });

  // 1. Intercept all GET requests for HTML pages BEFORE serving static or mounting Vite
  app.get("*", async (req, res, next) => {
    const url = req.originalUrl || req.url;
    
    // Determine if it's an HTML request (SPA page loader, root, index.html, or no file extension)
    const isHtmlRequest =
      req.method === "GET" &&
      (req.headers.accept?.includes("text/html") ||
       url === "/" ||
       url === "/index.html" ||
       (!url.includes(".") && !url.startsWith("/api/") && !url.startsWith("/@")));

    if (!isHtmlRequest) {
      return next();
    }

    try {
      let template: string;
      if (process.env.NODE_ENV !== "production") {
        const indexHtmlPath = path.resolve(process.cwd(), "index.html");
        template = fs.readFileSync(indexHtmlPath, "utf-8");
        // Apply Vite HTML transformations (injects hmr client script, etc.)
        template = await vite.transformIndexHtml(url, template);
      } else {
        const distIndexHtmlPath = path.resolve(process.cwd(), "dist", "index.html");
        if (fs.existsSync(distIndexHtmlPath)) {
          template = fs.readFileSync(distIndexHtmlPath, "utf-8");
        } else {
          return res.status(404).send("Build in progress. Please check again in a moment!");
        }
      }

       // Query latest tracking settings (returns immediately from high-speed synced cache)
      const settings = await fetchLatestTrackingSettings();
      const globalConfig = await fetchLatestGlobalSettings();
      const host = req.headers.host || "learn2future.vercel.app";
      
      const defaultTitle = globalConfig.defaultCardTitle || "Learn 2 Future | Learn Today. Earn Tomorrow.";
      const defaultDesc = globalConfig.defaultCardDescription || "Discover premium, modular learning resources in AI Tools, Video Editing, Digital Marketing, YouTube Growth, and Freelancing to prepare for tomorrow's opportunities.";
      const defaultImg = globalConfig.ogDefaultImageUrl || "https://learn2future.vercel.app/brand_logo.jpg";
      const defaultTwitterImg = globalConfig.twitterPreviewImageUrl || defaultImg;

      let seoTitleRaw = defaultTitle;
      let seoDescRaw = defaultDesc;
      let imageUrlRaw = defaultImg;
      let twitterImageUrlRaw = defaultTwitterImg;
      let canonicalUrlRaw = `https://${host}${url}`;
      let pageSpecificSchemaCode = "";

      // 1. Server-side Student Portfolio Page SEO and schema generation (Phase 6)
      const isStudentPage = url.startsWith("/student/");
      let studentUsername = "";
      if (isStudentPage) {
        studentUsername = url.split("/student/")[1]?.split(/[?#]/)[0] || "";
      }

      let studentData: any = null;
      if (isStudentPage && studentUsername) {
        try {
          const snap = await getDocs(query(collection(db, "student_portfolios"), where("username", "==", studentUsername)));
          if (!snap.empty) {
            studentData = snap.docs[0].data();
            studentData.id = snap.docs[0].id;
          }
        } catch (err) {
          console.error("Failed to query student data on server:", err);
        }
      }

      if (studentData) {
        const fullName = studentData.fullName || "Student";
        const bio = studentData.bio || "";
        const occupation = studentData.occupation || "Learner";
        const location = studentData.location || "India";
        seoTitleRaw = studentData.aiBlogTitle 
          ? `${studentData.aiBlogTitle} | ${fullName}'s Success Story`
          : `${fullName} - ${occupation} Student Portfolio & Success Story | Learn 2 Future`;
        seoDescRaw = studentData.metaDescription || `Explore the verified professional portfolio and AI success story of ${fullName} (${occupation}) from ${location} on Learn 2 Future.`;
        canonicalUrlRaw = `https://${host}/student/${studentUsername}`;
        imageUrlRaw = studentData.aiBlogFeaturedImage || studentData.profilePhoto || studentData.photoURL || defaultImg;
        twitterImageUrlRaw = studentData.aiBlogFeaturedImage || studentData.profilePhoto || studentData.photoURL || defaultTwitterImg;

        // Inject dynamic structural schemas
        const personSchema = {
          "@context": "https://schema.org",
          "@type": "Person",
          "name": fullName,
          "jobTitle": occupation,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": location
          },
          "image": resolveAbsoluteUrl(imageUrlRaw, host),
          "url": canonicalUrlRaw,
          "sameAs": [
            studentData.websiteUrl || "",
            studentData.youtubeUrl || "",
            studentData.instagramUrl || "",
            studentData.facebookUrl || "",
            studentData.linkedinUrl || ""
          ].filter(Boolean)
        };

        const breadcrumbSchema = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://learn2future.vercel.app/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Students",
              "item": "https://learn2future.vercel.app/#students"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": fullName,
              "item": canonicalUrlRaw
            }
          ]
        };

        const profileSchema = {
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          "mainEntity": {
            "@type": "Person",
            "name": fullName,
            "description": bio
          }
        };

        let articleSchemaStr = "";
        if (studentData.blogStatus === "Published" && studentData.aiBlogContent) {
          const articleSchema = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": studentData.aiBlogTitle || `${fullName}'s Success Story`,
            "image": resolveAbsoluteUrl(imageUrlRaw, host),
            "author": {
              "@type": "Person",
              "name": fullName
            },
            "publisher": {
              "@type": "EducationalOrganization",
              "name": "Learn 2 Future",
              "logo": {
                "@type": "ImageObject",
                "url": resolveAbsoluteUrl(defaultImg, host)
              }
            },
            "datePublished": formatDate(studentData.updatedAt),
            "description": seoDescRaw
          };
          articleSchemaStr = `\n    <script type="application/ld+json">\n      ${JSON.stringify(articleSchema, null, 2)}\n    </script>`;
        }

        pageSpecificSchemaCode = `
    <!-- Dynamic Student SEO Schemas (Phase 6) -->
    <script type="application/ld+json">
      ${JSON.stringify(personSchema, null, 2)}
    </script>
    <script type="application/ld+json">
      ${JSON.stringify(breadcrumbSchema, null, 2)}
    </script>
    <script type="application/ld+json">
      ${JSON.stringify(profileSchema, null, 2)}
    </script>${articleSchemaStr}`;
      }

      // 2. Course Landing Pages SEO tagging
      const isCoursePage = url.startsWith("/course/");
      if (isCoursePage) {
        const courseSlug = url.split("/course/")[1]?.split(/[?#]/)[0] || "";
        if (courseSlug) {
          try {
            let courseData: any = null;
            const courseSnap = await getDocs(query(collection(db, "courses"), where("slug", "==", courseSlug)));
            if (!courseSnap.empty) {
              courseData = courseSnap.docs[0].data();
            } else {
              const courseDoc = await getDoc(doc(db, "courses", courseSlug));
              if (courseDoc.exists()) {
                courseData = courseDoc.data();
              }
            }

            if (courseData) {
              seoTitleRaw = `${courseData.title} | Learn 2 Future Course`;
              seoDescRaw = courseData.shortDescription || courseData.description?.substring(0, 155) || defaultDesc;
              
              // Priority rule: course.coverImage > fallback
              imageUrlRaw = courseData.coverImage || defaultImg;
              twitterImageUrlRaw = courseData.coverImage || defaultTwitterImg;
              canonicalUrlRaw = `https://${host}/course/${courseSlug}`;

              const courseSchema = {
                "@context": "https://schema.org",
                "@type": "Course",
                "name": courseData.title,
                "description": seoDescRaw,
                "provider": {
                  "@type": "EducationalOrganization",
                  "name": "Learn 2 Future",
                  "sameAs": `https://${host}`
                },
                "image": resolveAbsoluteUrl(imageUrlRaw, host),
                "offers": {
                  "@type": "Offer",
                  "price": courseData.discountPrice || courseData.price || 0,
                  "priceCurrency": "INR"
                }
              };

              pageSpecificSchemaCode = `
    <!-- Dynamic Course Landing SEO Schema -->
    <script type="application/ld+json">
      ${JSON.stringify(courseSchema, null, 2)}
    </script>`;
            }
          } catch (courseErr) {
            console.error("Failed to query course data on server:", courseErr);
          }
        }
      }

      // 3. Blog Pages SEO tagging
      const isBlogPage = url.startsWith("/blog/");
      if (isBlogPage) {
        const blogSlug = url.split("/blog/")[1]?.split(/[?#]/)[0] || "";
        if (blogSlug) {
          try {
            let blogData: any = null;
            const blogSnap = await getDocs(query(collection(db, "blogs"), where("slug", "==", blogSlug)));
            if (!blogSnap.empty) {
              blogData = blogSnap.docs[0].data();
            }

            if (blogData) {
              seoTitleRaw = `${blogData.metaTitle || blogData.title} | Learn 2 Future Blog`;
              seoDescRaw = blogData.metaDescription || blogData.excerpt || blogData.content?.substring(0, 155) || defaultDesc;
              
              // Priority rule: Featured Image > fallback
              imageUrlRaw = blogData.featuredImage || defaultImg;
              twitterImageUrlRaw = blogData.featuredImage || defaultTwitterImg;
              canonicalUrlRaw = `https://${host}/blog/${blogSlug}`;

              const blogSchema = {
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                "headline": blogData.title,
                "image": resolveAbsoluteUrl(imageUrlRaw, host),
                "author": {
                  "@type": "Person",
                  "name": blogData.author || "Learn 2 Future Expert"
                },
                "publisher": {
                  "@type": "EducationalOrganization",
                  "name": "Learn 2 Future",
                  "logo": {
                    "@type": "ImageObject",
                    "url": resolveAbsoluteUrl(defaultImg, host)
                  }
                },
                "datePublished": blogData.publishDate || "2026-06-11",
                "description": seoDescRaw
              };

              pageSpecificSchemaCode = `
    <!-- Dynamic Blog Posting SEO Schema -->
    <script type="application/ld+json">
      ${JSON.stringify(blogSchema, null, 2)}
    </script>`;
            }
          } catch (blogErr) {
            console.error("Failed to query blog data on server:", blogErr);
          }
        }
      }

      // Convert image URLs into absolute URLs for crawler crawlers
      const absoluteImgUrl = resolveAbsoluteUrl(imageUrlRaw, host);
      const absoluteTwitterImgUrl = resolveAbsoluteUrl(twitterImageUrlRaw, host);

      // Apply SEO, Open Graph and Twitter Card dynamic replacements
      template = template.replace(/<title>.*?<\/title>/i, `<title>${seoTitleRaw}</title>`);
      template = template.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${seoDescRaw}" />`);
      
      template = template.replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${seoTitleRaw}" />`);
      template = template.replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${seoDescRaw}" />`);
      template = template.replace(/<meta property="og:image" content=".*?" \/>/i, `
    <meta property="og:image" content="${absoluteImgUrl}" />
    <meta property="og:image:secure_url" content="${absoluteImgUrl}" />
    <meta property="og:image:type" content="${absoluteImgUrl.includes('.png') ? 'image/png' : 'image/jpeg'}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
`);

      template = template.replace(/<meta name="twitter:title" content=".*?" \/>/i, `<meta name="twitter:title" content="${seoTitleRaw}" />`);
      template = template.replace(/<meta name="twitter:description" content=".*?" \/>/i, `<meta name="twitter:description" content="${seoDescRaw}" />`);
      template = template.replace(/<meta name="twitter:image" content=".*?" \/>/i, `<meta name="twitter:image" content="${absoluteTwitterImgUrl}" />`);

      // Inject standard canonical URL tag
      template = template.replace(/<\/head>/i, `  <link rel="canonical" href="${canonicalUrlRaw}" />\n  </head>`);

      // Inject JSON-LD schemas if generated
      if (pageSpecificSchemaCode) {
        template = template.replace(/<\/head>/i, `${pageSpecificSchemaCode}\n  </head>`);
      }
      let injectedHead = "";
      let injectedBody = "";

      // Injection 1: Google Search Console
      if (settings.searchConsoleVerification) {
        injectedHead += `\n    <!-- Server-Injected: Google Search Console Verification -->\n    <meta name="google-site-verification" content="${settings.searchConsoleVerification}" data-tracking="gsc" />`;
      }

      // Injection 2: Google Analytics GA4
      if (settings.ga4Id) {
        injectedHead += `\n    <!-- Server-Injected: Google Analytics GA4 -->\n    <script async src="https://www.googletagmanager.com/gtag/js?id=${settings.ga4Id}" data-tracking="ga4-lib"></script>\n    <script data-tracking="ga4-inline">\n      window.dataLayer = window.dataLayer || [];\n      function gtag(){window.dataLayer.push(arguments);}\n      gtag('js', new Date());\n      gtag('config', '${settings.ga4Id}');\n    </script>`;
      }

      // Injection 3: Google Tag Manager (GTM)
      if (settings.gtmId) {
        injectedHead = `\n    <!-- Server-Injected: Google Tag Manager Head -->\n    <script data-tracking="gtm-head">\n      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\n      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\n      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\n      })(window,document,'script','dataLayer','${settings.gtmId}');\n    </script>` + injectedHead;

        injectedBody += `\n    <!-- Server-Injected: Google Tag Manager (noscript) -->\n    <noscript data-tracking="gtm-body"><iframe src="https://www.googletagmanager.com/ns.html?id=${settings.gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;
      }

      // Injection 4: Meta (Facebook) Pixel
      if (settings.metaPixelId) {
        injectedHead += `\n    <!-- Server-Injected: Meta Pixel -->\n    <script data-tracking="pixel-head">\n      !function(f,b,e,v,n,t,s)\n      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?\n      n.callMethod.apply(n,arguments):n.queue.push(arguments)};\n      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';\n      n.queue=[];t=b.createElement(e);t.async=!0;\n      t.src=v;s=b.getElementsByTagName(e)[0];\n      s.parentNode.insertBefore(t,s)}(window, document,'script',\n      'https://connect.facebook.net/en_US/fbevents.js');\n      fbq('init', '${settings.metaPixelId}');\n      fbq('track', 'PageView');\n    </script>\n    <noscript data-tracking="pixel-body"><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${settings.metaPixelId}&ev=PageView&noscript=1" /></noscript>`;
      }

      // Injection 5: Facebook Domain Verification
      if (settings.facebookDomainVerification) {
        injectedHead += `\n    <!-- Server-Injected: Facebook Domain Verification -->\n    <meta name="facebook-domain-verification" content="${settings.facebookDomainVerification}" data-tracking="facebook-verification" />`;
      }

      // Embed the head tags securely right before closing </head> (using case-insensitive replace)
      if (injectedHead) {
        template = template.replace(/<\/head>/i, `${injectedHead}\n  </head>`);
      }
      
      // Embed the noscript tags securely right after <body> tag (using case-insensitive replace)
      if (injectedBody) {
        template = template.replace(/<body[^>]*>/i, (match) => `${match}${injectedBody}`);
      }

      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (err) {
      if (process.env.NODE_ENV !== "production" && vite) {
        vite.ssrFixStacktrace(err as Error);
      }
      next(err);
    }
  });

  // 2. Mount Vite middleware in development or Express static in production
  if (process.env.NODE_ENV !== "production") {
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath, { index: false }));
  }

  // 3. Keep fallback just in case or for backend APIs
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  app.post("/api/generate-success-story", async (req, res) => {
    try {
      const {
        fullName,
        username,
        bio,
        location,
        occupation,
        skills,
        learningGoals,
        currentProfession,
        websiteUrl,
        youtubeUrl,
        instagramUrl,
        facebookUrl,
        linkedinUrl,
        telegramUsername,
        coursesPurchased,
        coursesCompleted,
        achievements,
        userSuccessStory,
        futureGoals,
        favoriteLearningTopics
      } = req.body;

      if (!fullName || !username) {
        return res.status(400).json({ error: "Full Name and unique Username are required fields for generating success story." });
      }

      const prompt = `You are a high-end PR Journalist & professional biographer writing for "Learn 2 Future", an elite e-learning brand known for providing premium, real-world skills in AI Tools, Video Editing, Digital Marketing, YouTube Growth, and Career Acceleration.

Write a spectacular, inspiring, and professional long-form success story article about:
Student Name: ${fullName}
Current Profession/Occupation: ${occupation} (${currentProfession})
Location: ${location}
Bio details: ${bio}
Skills & Specialties: ${Array.isArray(skills) ? skills.join(", ") : skills}
Core Learning Goals: ${learningGoals}
Favorite Learning Topics: ${Array.isArray(favoriteLearningTopics) ? favoriteLearningTopics.join(", ") : favoriteLearningTopics}
Achievements so far: ${achievements}
Selected Courses Enrolled: ${Array.isArray(coursesPurchased) ? coursesPurchased.join(", ") : coursesPurchased}
Courses Completed: ${Array.isArray(coursesCompleted) ? coursesCompleted.join(", ") : coursesCompleted}
Future Aspirations: ${futureGoals}
Personal Narrative (The raw student context/perspective): "${userSuccessStory}"

Requirements:
1. Provide deep, rich narrative storytelling, making the reader feel connected to their struggles, learning process, and ultimate success. Expand on how "Learn 2 Future" served as the catalyst for their digital growth. Be extremely detailed and articulate. Your response MUST be a highly professional long-form biography of 1500 to 3000 words.
2. Structure the article neatly using the following markdown headers:
   - ## Introduction
   - ## Background
   - ## The Strategic Challenges
   - ## The Learn 2 Future Turning Point
   - ## Core Courses Taken & Practical Mastery
   - ## Critical Digital Skills Realigned
   - ## Realized Achievements & Milestones
   - ## Looking Forward: Bold Trajectories
   - ## Conclusion
3. Ensure the tone is extremely professional, highly motivating, articulate, and media-ready. Use deep, expansive paragraphs to sustain a substantial word count (1500 to 3000 words).

You MUST output your response strictly as a JSON object with this exact structure:
{
  "title": "A highly catchy, SEO-friendly, professional headline (e.g., 'Empowering Professional Growth: How [Name] Mastered Digital Skills with Learn 2 Future')",
  "content": "The full 1500-3000 words markdown-formatted article including all the required sections",
  "metaDescription": "A robust 150-160 character meta description optimized for search rankings",
  "seoKeywords": "comma, separated, key, terms, including, student name, learn 2 future success story"
}

Do not include any raw markdown formatting like \`\`\`json or trailing whitespace in your outer output, return raw parsable JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const textResult = response.text;
      if (!textResult) {
        throw new Error("Received empty generator payload from Gemini service.");
      }

      const generatedData = JSON.parse(textResult);
      res.status(200).json(generatedData);
    } catch (err: any) {
      console.error("Gemini AI API failure during success story generation:", err);
      res.status(500).json({ error: err?.message || "Failed to compile AI generated draft." });
    }
  });

  app.post("/api/pay/create-order", async (req, res) => {
    try {
      const { courseId, amount, userId, buyerName, email, telegram, couponCode } = req.body;

      if (!courseId || !amount || !userId) {
        return res.status(400).json({ error: "Course ID, amount, and User ID are required parameters for session generation." });
      }

      // Check settings dynamically
      const settings = await fetchLatestPaymentSettings();
      if (!settings.razorpayKeyId || !settings.razorpayKeySecret) {
        return res.status(400).json({
          error: "Razorpay Payment Gateway is not configured. Please contact the administrator or verify API credentials in Admin Dashboard Settings."
        });
      }

      const instance = new Razorpay({
        key_id: settings.razorpayKeyId,
        key_secret: settings.razorpayKeySecret,
      });

      const options = {
        amount: Math.round(Number(amount) * 100), // convert rupees to paise
        currency: "INR",
        receipt: "pay_rcpt_" + Date.now().toString().substring(4),
        notes: {
          courseId,
          userId,
          couponCode: couponCode || "None",
          buyerName: buyerName || "Anonymous Student",
          email: email || "",
          telegram: telegram || ""
        }
      };

      const razorpayOrder = await instance.orders.create(options);
      return res.status(200).json({
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: settings.razorpayKeyId
      });
    } catch (err: any) {
      console.error("Failed creating Razorpay checkout order:", err);
      return res.status(500).json({ error: err?.message || "Internal server exception initializing checkout order." });
    }
  });

  app.post("/api/pay/verify-payment", async (req, res) => {
    try {
      const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        courseId,
        courseName,
        userId,
        buyerName,
        email,
        telegram,
        price,
        originalPrice,
        discountApplied,
        couponCode,
        cartItems
      } = req.body;

      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !courseId || !userId) {
        return res.status(400).json({ error: "Missing required checkout parameters for verifying purchase." });
      }

      const settings = await fetchLatestPaymentSettings();
      if (!settings.razorpayKeySecret) {
        return res.status(400).json({ error: "Payment gateway validation keys are missing. Verify secret key configuration." });
      }

      // Cryptographically verify signature using Hmac SHA-256
      const calculatedSignature = crypto
        .createHmac("sha256", settings.razorpayKeySecret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (calculatedSignature !== razorpay_signature) {
        console.warn("[PAYMENT-FRAUD] Signature validation failed for order:", razorpay_order_id);
        return res.status(400).json({ error: "Cryptographic checkout signature is invalid. Payment transaction untrusted." });
      }

      // Generate a clean professional order ID
      const orderId = "ord_rzp_" + Date.now().toString().substring(3) + Math.random().toString(36).substring(3, 6);

      // Fetch dynamic course metadata
      let deliveryUrl = "";
      let deliverableLink = "";
      let thumbnail = "";
      let finalCourseName = courseName;

      try {
        const courseSnap = await getDoc(doc(db, "courses", courseId));
        if (courseSnap.exists()) {
          const cd = courseSnap.data();
          deliveryUrl = cd.deliveryUrl || cd.deliveryLink || "";
          deliverableLink = cd.deliverableLink || "";
          thumbnail = cd.thumbnail || "";
          if (!finalCourseName) {
            finalCourseName = cd.title || "Premium skill course";
          }
        }
      } catch (cErr) {
        console.warn("Supplementary course metadata parsing error during checkout verification:", cErr);
      }

      // Construct standard backward-compatible Order record
      const orderPayload = {
        userId,
        name: buyerName || "Student",
        email: email || "student@example.com",
        telegram: telegram || "",
        courseId,
        courseName: finalCourseName || "Elite skill course",
        price: Number(price || originalPrice || 0),
        amount: Number(price || originalPrice || 0),
        originalPrice: Number(originalPrice || price || 0),
        discountApplied: Number(discountApplied || 0),
        couponDiscount: Number(discountApplied || 0),
        couponCode: couponCode || "",
        screenshotUrl: "Razorpay Auto-Approved Gateway",
        proofImage: "",
        status: "Verified", // Unlocks course immediately!
        paymentMethod: "Razorpay Gateway",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        paymentId: razorpay_payment_id,
        createdAt: serverTimestamp(),
        date: serverTimestamp()
      };

      // Atomic commit to Firestore collections
      await setDoc(doc(db, "orders", orderId), orderPayload);

      // Increment coupon usedCount and totalSales if coupon code is present
      if (couponCode && couponCode !== "None" && couponCode.trim() !== "") {
        try {
          const uCoupon = couponCode.trim().toUpperCase();
          const couponDocRef = doc(db, "coupons", uCoupon);
          const couponSnap = await getDoc(couponDocRef);
          if (couponSnap.exists()) {
            const currentCount = couponSnap.data().usedCount || 0;
            const currentSales = couponSnap.data().totalSales || 0;
            const orderAmount = Number(price || originalPrice || 0);

            // setDoc with { merge: true } acts like updateDoc and modifies only specified fields
            await setDoc(couponDocRef, { 
              usedCount: currentCount + 1,
              totalSales: currentSales + orderAmount
            }, { merge: true });
            console.log(`[COUPON-TRACKING-SERVER] Incrementing usedCount for coupon "${uCoupon}" to ${currentCount + 1}, Adding ₹${orderAmount} to totalSales (new: ₹${currentSales + orderAmount})`);
          }
        } catch (couponErr) {
          console.error("Failed to update coupon stats in backend checkout verification:", couponErr);
        }
      }

      // Construct dynamic post-purchase purchase lock payloads
      if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
        for (const item of cartItems) {
          const purchaseId = "pur_rzp_" + Date.now().toString().substring(3) + Math.random().toString(36).substring(3, 7);
          
          let itemDeliveryUrl = "";
          let itemThumbnail = "";
          let itemTitle = item.productTitle || "";

          try {
            const itemSnap = await getDoc(doc(db, "courses", item.productId));
            if (itemSnap.exists()) {
              const idata = itemSnap.data();
              itemDeliveryUrl = idata.deliveryUrl || idata.deliveryLink || "";
              itemThumbnail = idata.thumbnail || "";
              if (!itemTitle) {
                itemTitle = idata.title || "";
              }
            }
          } catch (err) {}

          const purchasePayload = {
            userId,
            productId: item.productId,
            productTitle: itemTitle || "Elite skill course",
            productImage: itemThumbnail || item.productImage || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800",
            purchaseDate: new Date().toISOString(),
            deliveryUrl: itemDeliveryUrl || "https://t.me/LearntoFuture",
            orderId: orderId,
            status: "Delivered"
          };
          await setDoc(doc(db, "userPurchases", purchaseId), purchasePayload);
        }
      } else {
        const purchaseId = "pur_rzp_" + Date.now().toString().substring(3) + Math.random().toString(36).substring(3, 6);
        const purchasePayload = {
          userId,
          productId: courseId,
          productTitle: finalCourseName || "Elite skill course",
          productImage: thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800",
          purchaseDate: new Date().toISOString(),
          deliveryUrl: deliveryUrl || deliverableLink || "",
          orderId: orderId,
          status: "Delivered"
        };
        await setDoc(doc(db, "userPurchases", purchaseId), purchasePayload);
      }

      console.log(`[AUTOMATION-SUCCESS] Client transaction verified successfully. Unlocked courses for uid #${userId}. Generated Order ID #${orderId}`);
      return res.status(200).json({ success: true, orderId });
    } catch (err: any) {
      console.error("Exception occurred verifying transaction and creating direct enrollment:", err);
      return res.status(500).json({ error: err?.message || "Internal database transaction failure writing verified student ledger entries." });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dynamic tracking full-stack server is active at http://0.0.0.0:${PORT}`);
  });
}

startServer();
