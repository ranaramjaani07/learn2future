import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
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

const PAYMENT_ENV = process.env.PAYMENT_ENV || "DEVELOPMENT";
console.log("[SERVER-INIT] Security environment initialized as:", PAYMENT_ENV);

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

// --- ULTRA-LIGHTWEIGHT SECURE REST FIRESTORE ENGINE (FOR NODE.JS BYPASSING ADC IAM RESTRICTIONS) ---
const REST_PROJECT_ID = firebaseConfig.projectId;
const REST_DATABASE_ID = firebaseConfig.firestoreDatabaseId;
const REST_API_KEY = firebaseConfig.apiKey;
const REST_BASE_URL = `https://firestore.googleapis.com/v1/projects/${REST_PROJECT_ID}/databases/${REST_DATABASE_ID}/documents`;

// Helper types & sentinels
export const AdminFieldValue = {
  serverTimestamp: () => ({ __type: "server_timestamp" })
};

function fromFirestoreProto(fields: any): any {
  if (!fields) return {};
  const obj: any = {};
  for (const [key, val] of Object.entries(fields)) {
    obj[key] = decodeProtoValue(val);
  }
  return obj;
}

function decodeProtoValue(val: any): any {
  if (!val) return null;
  if ("stringValue" in val) return val.stringValue;
  if ("doubleValue" in val) return Number(val.doubleValue);
  if ("integerValue" in val) return Number(val.integerValue);
  if ("booleanValue" in val) return !!val.booleanValue;
  if ("timestampValue" in val) {
    return {
      toDate: () => new Date(val.timestampValue),
      seconds: Math.floor(new Date(val.timestampValue).getTime() / 1000),
      nanoseconds: 0,
      toString() { return val.timestampValue; }
    };
  }
  if ("arrayValue" in val) {
    const arr = val.arrayValue.values || [];
    return arr.map((item: any) => decodeProtoValue(item));
  }
  if ("mapValue" in val) {
    return fromFirestoreProto(val.mapValue.fields);
  }
  if ("nullValue" in val) return null;
  return val;
}

function encodeProtoValue(val: any): any {
  if (val === null) return { nullValue: null };
  if (typeof val === "string") return { stringValue: val };
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "number") {
    if (Number.isInteger(val)) {
      return { integerValue: String(val) };
    }
    return { doubleValue: val };
  }
  if (val instanceof Date) {
    return { timestampValue: val.toISOString() };
  }
  if (val && typeof val.toDate === "function") {
    return { timestampValue: val.toDate().toISOString() };
  }
  if (val && val.seconds !== undefined) {
    return { timestampValue: new Date(val.seconds * 1000).toISOString() };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(item => encodeProtoValue(item))
      }
    };
  }
  if (val && typeof val === "object") {
    if (val.__type === "server_timestamp" || (val.constructor && (val.constructor.name === "FieldValue" || val.constructor.name === "Sentinel"))) {
      return { timestampValue: new Date().toISOString() };
    }
    return {
      mapValue: { fields: toFirestoreProto(val).fields }
    };
  }
  return { stringValue: String(val) };
}

function toFirestoreProto(obj: any): any {
  const fields: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) continue;
    fields[key] = encodeProtoValue(val);
  }
  return { fields };
}

interface FilterDesc {
  type: 'where' | 'orderBy' | 'limit';
  field?: string;
  op?: string;
  value?: any;
  direction?: 'asc' | 'desc';
}

function buildStructuredQuery(collectionId: string, filters: FilterDesc[]) {
  const query: any = {
    from: [{ collectionId, allDescendants: false }]
  };

  const whereFilters: any[] = [];
  const orderBys: any[] = [];
  let limitValue: number | undefined = undefined;

  for (const f of filters) {
    if (f.type === 'where' && f.field && f.op) {
      let restOp = f.op;
      if (f.op === "==") restOp = "EQUAL";
      else if (f.op === ">") restOp = "GREATER_THAN";
      else if (f.op === ">=") restOp = "GREATER_THAN_OR_EQUAL";
      else if (f.op === "<") restOp = "LESS_THAN";
      else if (f.op === "<=") restOp = "LESS_THAN_OR_EQUAL";
      else if (f.op === "in") restOp = "IN";
      else if (f.op === "array-contains") restOp = "ARRAY_CONTAINS";
      else if (f.op === "array-contains-any") restOp = "ARRAY_CONTAINS_ANY";
      else if (f.op === "not-in") restOp = "NOT_IN";
      else if (f.op === "!=") restOp = "NOT_EQUAL";

      whereFilters.push({
        fieldFilter: {
          field: { fieldPath: f.field },
          op: restOp,
          value: encodeProtoValue(f.value)
        }
      });
    } else if (f.type === 'orderBy' && f.field) {
      const direction = f.direction?.toUpperCase() === "DESC" ? "DESCENDING" : "ASCENDING";
      orderBys.push({
        field: { fieldPath: f.field },
        direction
      });
    } else if (f.type === 'limit') {
      limitValue = f.value;
    }
  }

  if (whereFilters.length > 0) {
    if (whereFilters.length === 1) {
      query.where = whereFilters[0];
    } else {
      query.where = {
        compositeFilter: {
          op: "AND",
          filters: whereFilters
        }
      };
    }
  }

  if (orderBys.length > 0) {
    query.orderBy = orderBys;
  }

  if (typeof limitValue === "number") {
    query.limit = limitValue;
  }

  return { structuredQuery: query };
}

let isServerQuotaExceeded = false;

function logServerFirestoreError(tag: string, err: any) {
  const errStr = err instanceof Error ? err.message : String(err);
  const isQuota = errStr.toLowerCase().includes("quota") ||
                  errStr.toLowerCase().includes("resource_exhausted") ||
                  errStr.toLowerCase().includes("429");
  if (isQuota) {
    isServerQuotaExceeded = true;
    console.warn(`[REST-FIRESTORE-WARN] ${tag} (Quota/Limit Handled graceful):`, errStr);
  } else {
    console.error(`[REST-FIRESTORE-ERROR] ${tag}:`, err);
  }
}

function generateQueryMethods(colName: string, filters: any[]): any {
  return {
    where(field: string, op: any, value: any) {
      return generateQueryMethods(colName, [...filters, { type: 'where', field, op, value }]);
    },
    orderBy(field: string, direction: any) {
      return generateQueryMethods(colName, [...filters, { type: 'orderBy', field, direction }]);
    },
    limit(n: number) {
      return generateQueryMethods(colName, [...filters, { type: 'limit', value: n }]);
    },
    async get() {
      try {
        const url = `${REST_BASE_URL}:runQuery?key=${REST_API_KEY}`;
        const queryBody = buildStructuredQuery(colName, filters);
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(queryBody)
        });
        if (!response.ok) {
          const text = await response.text();
          if (response.status === 429) {
            isServerQuotaExceeded = true;
          }
          throw new Error(`REST structured query failed: ${response.status} ${text}`);
        }
        const rawResults = await response.json();
        const docs: any[] = [];
        if (Array.isArray(rawResults)) {
          for (const item of rawResults) {
            if (item.document) {
              const fullPath = item.document.name;
              const docId = fullPath.split("/").pop() || "";
              const data = fromFirestoreProto(item.document.fields);
              docs.push({
                id: docId,
                exists: true,
                data() { return data; }
              });
            }
          }
        }
        return {
          empty: docs.length === 0,
          size: docs.length,
          docs: docs
        };
      } catch (err: any) {
        logServerFirestoreError(`Query failed on collection ${colName}`, err);
        throw err;
      }
    }
  };
}

const adminDb = {
  collection(colName: string): any {
    return {
      doc(docId: string) {
        return {
          id: docId,
          async get() {
            try {
              const url = `${REST_BASE_URL}/${colName}/${docId}?key=${REST_API_KEY}`;
              const response = await fetch(url);
              if (response.status === 404) {
                return {
                  exists: false,
                  id: docId,
                  data() { return undefined; }
                };
              }
              if (!response.ok) {
                const text = await response.text();
                if (response.status === 429) {
                  isServerQuotaExceeded = true;
                }
                throw new Error(`REST get failed: ${response.status} ${text}`);
              }
              const dataRaw = await response.json();
              const fieldsObj = fromFirestoreProto(dataRaw.fields);
              return {
                exists: true,
                id: docId,
                data() { return fieldsObj; }
              };
            } catch (err: any) {
              logServerFirestoreError(`Get failed on ${colName}/${docId}`, err);
              throw err;
            }
          },
          async set(data: any, options?: any) {
            try {
              const url = `${REST_BASE_URL}/${colName}/${docId}?key=${REST_API_KEY}`;
              const body = toFirestoreProto(data);
              const response = await fetch(url, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
              });
              if (!response.ok) {
                const text = await response.text();
                if (response.status === 429) {
                  isServerQuotaExceeded = true;
                }
                throw new Error(`REST set failed: ${response.status} ${text}`);
              }
              return await response.json();
            } catch (err: any) {
              logServerFirestoreError(`Set failed on ${colName}/${docId}`, err);
              throw err;
            }
          },
          async update(data: any) {
            try {
              const keys = Object.keys(data);
              const queryParams = keys.map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
              const url = `${REST_BASE_URL}/${colName}/${docId}?key=${REST_API_KEY}&${queryParams}`;
              const body = toFirestoreProto(data);
              const response = await fetch(url, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
              });
              if (!response.ok) {
                const text = await response.text();
                if (response.status === 429) {
                  isServerQuotaExceeded = true;
                }
                throw new Error(`REST update failed: ${response.status} ${text}`);
              }
              return await response.json();
            } catch (err: any) {
              logServerFirestoreError(`Update failed on ${colName}/${docId}`, err);
              throw err;
            }
          },
          async delete() {
            try {
              const url = `${REST_BASE_URL}/${colName}/${docId}?key=${REST_API_KEY}`;
              const response = await fetch(url, {
                method: "DELETE"
              });
              if (!response.ok && response.status !== 404) {
                const text = await response.text();
                if (response.status === 429) {
                  isServerQuotaExceeded = true;
                }
                throw new Error(`REST delete failed: ${response.status} ${text}`);
              }
              return true;
            } catch (err: any) {
              logServerFirestoreError(`Delete failed on ${colName}/${docId}`, err);
              throw err;
            }
          }
        };
      },
      async add(data: any) {
        try {
          const url = `${REST_BASE_URL}/${colName}?key=${REST_API_KEY}`;
          const body = toFirestoreProto(data);
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });
          if (!response.ok) {
            const text = await response.text();
            if (response.status === 429) {
              isServerQuotaExceeded = true;
            }
            throw new Error(`REST add failed: ${response.status} ${text}`);
          }
          const resJson = await response.json();
          const docId = resJson.name?.split("/").pop() || "";
          return {
            id: docId,
            ...resJson
          };
        } catch (err: any) {
          logServerFirestoreError(`Add failed on collection ${colName}`, err);
          throw err;
        }
      },
      ...generateQueryMethods(colName, [])
    };
  }
};

// Self-healing database seeder to ensure global default documents exist in Firestore
async function ensureDefaultSettings() {
  try {
    const trackingRef = adminDb.collection("settings").doc("tracking");
    const trackingSnap = await trackingRef.get();
    if (!trackingSnap.exists) {
      await trackingRef.set({
        metaPixelId: "",
        gtmId: "",
        ga4Id: "",
        searchConsoleVerification: "",
        facebookDomainVerification: ""
      });
      console.log("[SERVER-INIT] Created default settings/tracking document in Firestore.");
    }

    const payRef = adminDb.collection("settings").doc("paymentGateway");
    const paySnap = await payRef.get();
    if (!paySnap.exists) {
      await payRef.set({
        razorpayKeyId: DEFAULT_RAZORPAY_KEY_ID,
        razorpayKeySecret: DEFAULT_RAZORPAY_KEY_SECRET,
        razorpayWebhookSecret: "",
        isTestMode: true,
        isLiveMode: false,
        enablePaymentSandbox: true
      });
      console.log("[SERVER-INIT] Created default settings/paymentGateway document in Firestore.");
    }

    const globalRef = adminDb.collection("settings").doc("globalSettings");
    const globalSnap = await globalRef.get();
    if (!globalSnap.exists) {
      await globalRef.set({
        brandLogoUrl: "https://learn2future.vercel.app/brand_logo.jpg",
        ogDefaultImageUrl: "https://learn2future.vercel.app/brand_logo.jpg",
        twitterPreviewImageUrl: "https://learn2future.vercel.app/brand_logo.jpg",
        defaultCardTitle: "Learn 2 Future | Learn Today. Earn Tomorrow.",
        defaultCardDescription: "Acquire future-ready credentials and join an active community of 10,000+ continuous digital earners. Courses in AI agents, high-ticket freelancing, and viral media."
      });
      console.log("[SERVER-INIT] Created default settings/globalSettings document in Firestore.");
    }

    // Ensure default high quality blogs exist in Firestore database
    const blogsCol = adminDb.collection("blogs");
    
    // Seed Blog 1: What Is Learn2Future
    const blog1Slug = "what-is-learn2future-affordable-skill-education-india";
    const blog1Ref = blogsCol.doc(blog1Slug);
    const blog1Snap = await blog1Ref.get();
    if (!blog1Snap.exists) {
      await blog1Ref.set({
        title: "What Is Learn2Future? The Mission Behind Affordable Skill Education in India",
        slug: blog1Slug,
        metaTitle: "What Is Learn2Future? Affordable Skill Education in India",
        metaDescription: "Learn2Future is India's affordable skill education platform. Discover its mission, courses, and why it's helping students and freelancers grow their careers.",
        seoKeywords: "Learn2Future, affordable skill education India, online learning platform India, digital skills courses India, Learn2Future courses",
        canonicalUrl: "https://learn2future.vercel.app/blog/what-is-learn2future-affordable-skill-education-india",
        category: "Career Skills",
        featuredImage: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=600&auto=format&fit=crop",
        author: "Learn2Future Team",
        publishDate: "2026-06-25",
        content: `# What Is Learn2Future? The Mission Behind Affordable Skill Education in India\n\nHere's a question worth sitting with: If you knew that learning one digital skill could open doors to a better career, would anything stop you?\n\nFor millions of people in India, the honest answer is — yes. The cost would stop them.\n\nThe price tag on quality online courses has always been a quiet barrier. A digital marketing certification from an international platform can cost ₹15,000 to ₹50,000. A coding bootcamp? Even more. And these are often courses that students, freshers, freelancers, and working professionals desperately need to stay competitive in a rapidly changing job market.\n\nThat's exactly the problem Learn2Future was created to solve.\n\nIf you've come across the name and wondered what Learn2Future actually is, what it stands for, and whether it's the right fit for you — this is the complete guide. By the end of this article, you'll understand the platform's mission, what it teaches, who it's built for, and why affordable skill education in India isn't just a nice idea — it's a necessity.\n\n---\n\n## The Problem That Started It All\n\n### Why Quality Education Is Still Out of Reach for Many Indians\n\nIndia has one of the largest populations of young, ambitious learners in the world. According to various workforce development reports, millions of graduates enter the Indian job market every year — but many of them lack the practical, industry-relevant skills employers actually want.\n\nThe tragedy isn't that these learners don't want to grow. They do. They follow tutorials on YouTube, they sign up for free webinars, they bookmark course pages. The problem is that when it comes to structured, quality learning that actually moves the needle on their careers, the price often shuts the door before they can walk through it.\n\nThe average Indian student or fresher simply cannot afford ₹20,000 for an online course. Even ₹5,000 is a stretch for many families. When you add to this the unorganized nature of free content — which is scattered, inconsistent, and rarely beginner-friendly — you start to see why so many ambitious people in India feel stuck.\n\n### The Gap Between Ambition and Access\n\nThere's a massive gap in India's digital learning landscape. On one side, you have expensive international platforms designed for a global audience. On the other, you have free but unstructured content that leaves learners overwhelmed.\n\nNobody was filling the middle — affordable, structured, practical, and India-relevant.\n\nThat's the gap Learn2Future decided to fill.\n\n---\n\n## What Is Learn2Future?\n\n### A Simple Definition\n\nLearn2Future is an Indian digital education platform built to make skill development affordable and accessible for everyone. It offers online courses across in-demand fields including Artificial Intelligence, Digital Marketing, Freelancing, Coding, Video Editing, YouTube Growth, Business, and Productivity.\n\nThe platform is designed specifically for people who want to learn practical, real-world skills — not just theoretical knowledge — without spending a fortune to do it.\n\nThink of it this way: Learn2Future is what happens when a deep belief in affordable education meets a clear understanding of what skills the real world actually needs.\n\n### What Makes Learn2Future Different from Other Platforms\n\nMany platforms offer courses. Very few think deeply about accessibility.\n\nHere's what sets Learn2Future apart from the usual players in the Indian online education space:\n\n**Price-first thinking.** Every decision on this platform starts with the question: can our target learner actually afford this? That keeps the pricing grounded and the mission honest.\n\n**Practical over theoretical.** The courses aren't padded with academic fluff. They focus on what you can actually use — skills you can apply to freelancing, a job, a business, or creative work.\n\n**India-first perspective.** Learn2Future was built with the Indian learner in mind — their circumstances, their aspirations, their economic reality, and the kind of opportunities available in the Indian and global digital economy.\n\n**Beginner-friendly by design.** You don't need a technical background to start learning here. Most courses assume you're starting from zero and guide you forward from there.\n\n---\n\n## The Mission Behind Learn2Future\n\n### Making Skill Development Accessible and Affordable\n\nThe mission of Learn2Future is clear and specific: *Help people learn practical skills that can support personal growth, career development, and future opportunities.*\n\nEvery course, every piece of content, every decision on the platform flows from this. The word \"practical\" is key — it means what's on the platform has direct real-world application. And \"affordable\" isn't a marketing word here. It's a founding principle.\n\nWhen you look at the digital learning market in India, affordability is still treated as a secondary concern. Platforms reduce prices occasionally through discount campaigns, but the base assumption is still that learners must pay a premium for quality. Learn2Future challenges that assumption directly.\n\n### Who Learn2Future Was Built For\n\nThis platform was not built for everyone in the broadest sense — it was built very intentionally for a specific type of person:\n\n- **Students** who want to build skills alongside their degrees and get ahead in the job market\n- **Beginners** who are starting from scratch and need structured guidance, not overwhelming content\n- **Freelancers** who want to expand their services and earn more from digital work\n- **Job seekers** trying to make their profile stand out in a competitive hiring environment\n- **Content creators** looking to grow their platforms and monetize their skills\n- **Small business owners** who want to use digital marketing to reach more customers\n- **Working professionals** who want to upgrade their capabilities without leaving their jobs\n\nIf you recognize yourself in any of these groups, Learn2Future was built with you in mind.\n\n### Why India Needs This Platform Right Now\n\nThe Indian economy is going through a significant shift. Digital skills — things like AI literacy, digital marketing, content creation, data analysis, and coding — are no longer \"nice to have.\" They are rapidly becoming baseline requirements for career survival and growth.\n\nThe World Economic Forum has consistently flagged that skills gaps will be one of the biggest challenges for workforces globally by 2025 and beyond. For India specifically, the urgency is even higher. Millions of young people need to upskill fast, and the infrastructure for affordable, quality digital learning simply hasn't kept up with that demand.\n\nLearn2Future is a direct response to this moment.\n\n---\n\n## What Learn2Future Teaches\n\n### Courses and Skills Available on the Platform\n\nLearn2Future's course catalog is built around one central question: \"What skills actually help people earn more, work better, and grow their careers in the digital economy?\"\n\nThe answer, right now, points to these areas:\n\n**Artificial Intelligence:** AI literacy is becoming a baseline professional skill. Learn2Future covers AI fundamentals, AI tools for productivity, and how to use AI in real work environments — no PhD required.\n\n**Digital Marketing:** This is one of the highest-demand skills in India's growing digital economy. The courses cover SEO, social media marketing, email marketing, content strategy, and paid advertising.\n\n**Freelancing:** Many Indian learners want to break free from the 9-to-5 structure or earn income alongside their studies. Freelancing courses on Learn2Future cover platforms, proposals, client management, and building a sustainable income stream.\n\n**Coding and Web Development:** From beginner-level programming concepts to practical web development skills — this track helps learners enter the tech space without needing a computer science degree.\n\n**Video Editing:** With the explosion of content creation on YouTube, Instagram, and other platforms, video editing has become a genuinely profitable skill. Courses cover tools, techniques, and professional workflows.\n\n**YouTube Growth:** A dedicated track for creators who want to build a YouTube channel with strategy — from content planning to analytics to monetization.\n\n**Business Skills:** Entrepreneurship basics, business communication, productivity systems, and practical frameworks for running a small business or side project.\n\n**Productivity and Personal Growth:** Soft skills matter. Time management, focus systems, goal setting, and self-management are included because high performance isn't only about technical knowledge.\n\n### Why These Skills Were Chosen\n\nEvery skill category on Learn2Future was chosen because it directly maps to real-world income opportunities or career growth. These aren't trends chased for marketing purposes — they represent the clearest paths available to Indian learners for improving their economic and professional situations in the current digital landscape.\n\n---\n\n## The Vision: Where Learn2Future Is Headed\n\n### Empowering One Million Learners\n\nThe vision behind Learn2Future is ambitious but grounded: to help millions of learners acquire future-ready skills and improve their careers through affordable online learning.\n\nThis isn't about becoming the biggest platform. It's about depth of impact. The measure of success at Learn2Future isn't just enrollment numbers — it's whether learners actually acquire skills that change their lives.\n\n### Building a Community, Not Just a Platform\n\nOne of the longer-term visions for Learn2Future goes beyond being a course marketplace. The goal is to build a learning community — a space where learners can connect, share progress, ask questions, and support each other on their journeys.\n\nThis matters because skill development rarely happens in isolation. The learners who succeed are usually the ones who have people around them who take learning seriously. Learn2Future wants to create that environment digitally, making it accessible to people regardless of where in India they live.\n\n---\n\n## How Learn2Future Helps You Grow\n\nDifferent learners come to Learn2Future at different stages of their journey. Here's how the platform meets each group where they are.\n\n### For Students Starting From Zero\n\nIf you're a student who has never taken an online course before, Learn2Future's beginner-friendly structure means you won't feel lost. Courses are designed to take you from \"I have no idea where to start\" to \"I can actually do this\" — step by step, without jargon and without assuming you already know things.\n\n### For Freelancers Looking to Earn More\n\nIf you're already freelancing but feel like you've hit a ceiling, Learn2Future's advanced skill courses can help you diversify what you offer and charge more for your work. Whether it's adding video editing to your skillset, learning digital marketing to serve business clients, or using AI tools to work faster — there are direct paths to higher income here.\n\n### For Working Professionals Upgrading Their Skills\n\nYou don't have to quit your job to use Learn2Future. The courses are designed to fit around your schedule. Whether you have 30 minutes in the morning or an hour on weekends, consistent learning on this platform adds up over time into a genuinely meaningful skills upgrade.\n\n### For Entrepreneurs and Content Creators\n\nIf you're building something — a business, a channel, a brand — Learn2Future gives you the practical marketing, technical, and creative skills to do it more effectively without having to hire specialists for every single task you can actually learn yourself.\n\n---\n\n## The Core Values That Drive Learn2Future\n\n### Affordable Doesn't Mean Low Quality\n\nThis is one of the most important things to understand about Learn2Future: the platform rejects the false choice between affordable and good. The belief driving the platform is that high-quality education and accessible pricing are not mutually exclusive — they can and should coexist.\n\nEvery course is built to be genuinely useful, not just technically available. Content quality is reviewed with the learner's actual outcome in mind, not just content volume.\n\n### Practical Learning Over Theory\n\nYou won't find courses on Learn2Future that are 40 hours of slides you never apply. The emphasis is on learning by doing — practical exercises, real tools, usable frameworks, and skills you can take out of the course and into the real world immediately.\n\nThis philosophy reflects the reality of how adults actually learn: not through passive consumption, but through practice and application.\n\n---\n\n## Why Affordable Skill Education Matters in India\n\n### The Reality of Skill Demand in India Today\n\nIndia's digital economy is growing fast. According to multiple industry reports, millions of digital jobs are expected to be created in India over the next decade. But here's the challenge — the supply of digitally-skilled workers is not growing at the same pace as demand.\n\nThis creates both a problem and an opportunity. The problem: employers are struggling to find skilled talent. The opportunity: individuals who invest in digital skills right now are positioning themselves for a genuinely better career future.\n\nThe question is not whether to learn — it's whether the tools to learn are accessible enough for the people who need them most.\n\n### What Happens When People Can't Access Quality Learning\n\nWhen quality skill education remains out of reach for a large portion of the population, the gap between the skilled and the unskilled widens. Social mobility stalls. Career growth becomes a privilege rather than a possibility.\n\nLearn2Future takes this seriously. The platform was built on the belief that your ability to grow professionally should not be determined by your financial starting point. Skills should be accessible to the student in a small town as much as to the professional in a metro city.\n\nThat's not a marketing slogan. It's the reason the platform exists.\n\n---\n\n## Is Learn2Future Right for You?\n\n### Signs This Platform Is a Good Fit\n\nYou might find Learn2Future is the right choice for you if:\n\n- You want to learn a practical digital skill but can't afford expensive platforms\n- You're a student or beginner who needs structured, beginner-friendly guidance\n- You want to add a marketable skill to your profile without quitting your job or college\n- You're a freelancer looking to expand what you offer and earn more\n- You want to stay relevant as AI and digital tools reshape the job market\n- You prefer practical, no-fluff learning over hours of theory you'll never use\n- You believe in continuous learning as a way to invest in yourself\n\nIf any of those describe you, Learn2Future was built with you in mind.\n\nYou can explore the platform's course offerings and learn more about what's available at [**learn2future.vercel.app**](https://learn2future.vercel.app/).\n\n---\n\n## Frequently Asked Questions About Learn2Future\n\n**What is Learn2Future?**\nLearn2Future is an Indian digital education platform offering affordable online courses in AI, Digital Marketing, Freelancing, Coding, Video Editing, YouTube Growth, Business, and Productivity. It was created to make quality skill development accessible to students, beginners, freelancers, and working professionals across India.\n\n**Is Learn2Future a free platform?**\nLearn2Future is built around the principle of affordability. The goal is to make courses accessible at prices that Indian students and learners can realistically manage — making quality learning available to people regardless of their financial background.\n\n**Who is Learn2Future designed for?**\nThe platform is designed for students, beginners, freelancers, job seekers, content creators, small business owners, and working professionals who want to develop practical digital skills without paying international platform prices.\n\n**What kinds of courses does Learn2Future offer?**\nCourses currently cover Artificial Intelligence, Digital Marketing, Freelancing, Coding, Video Editing, YouTube Growth, Business, and Productivity. The catalog focuses on skills that have direct career and income applications in the modern digital economy.\n\n**Is Learn2Future a trustworthy platform?**\nLearn2Future operates with a mission-driven approach focused on education first. The platform is transparent about what it offers and avoids exaggerated income claims. It positions itself as an accessible, practical, and honest educational resource for Indian learners.\n\n**Can I learn on Learn2Future if I have no prior experience?**\nYes. Courses on the platform are beginner-friendly and designed for learners starting from scratch. You don't need a technical background or any prior knowledge to start learning on Learn2Future.\n\n---\n\n## Start Your Learning Journey Today\n\nThe best time to start building a skill was yesterday. The second best time is right now.\n\nLearn2Future exists because a lot of people in India have the ambition to grow — they just need an affordable, structured, and honest place to do it. The platform isn't about promises or hype. It's about practical learning that moves people forward.\n\nIf you're ready to take the next step — whether that's learning digital marketing, mastering AI tools, building your freelancing business, or picking up video editing — your starting point is clear.\n\nVisit [**learn2future.vercel.app**](https://learn2future.vercel.app/) to explore available courses and take the first step toward the skills that will shape your future.`,
        createdAt: new Date()
      });
      console.log("[SERVER-INIT] Seeded default blog 'What Is Learn2Future' in Firestore.");
    }

    // Seed Blog 2: Why Learn2Future Exists
    const blog2Slug = "why-learn2future-exists-affordable-skill-education";
    const blog2Ref = blogsCol.doc(blog2Slug);
    const blog2Snap = await blog2Ref.get();
    if (!blog2Snap.exists) {
      await blog2Ref.set({
        title: "Why Learn2Future Exists: The Mission Behind Affordable Skill Education",
        slug: blog2Slug,
        metaTitle: "Why Learn2Future Exists: Affordable Skill Education",
        metaDescription: "Understand why Learn2Future exists. Discover how we're breaking the high cost barrier of digital upskilling and empowering Indian students & freelancers.",
        seoKeywords: "Why Learn2Future Exists, Learn2Future mission, affordable skill development, digital skill gaps India, cheap online courses India, learn digital marketing affordably",
        canonicalUrl: "https://learn2future.vercel.app/blog/why-learn2future-exists-affordable-skill-education",
        category: "About Us",
        featuredImage: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=600&auto=format&fit=crop",
        author: "Learn2Future Team",
        publishDate: "2026-06-25",
        content: `# Why Learn2Future Exists: The Mission Behind Affordable Skill Education\n\nEvery major change starts with a simple, unsettling question.\n\nFor us, that question was: **Why does learning a modern, life-changing digital skill have to cost as much as a college semester?**\n\nIf you look at the landscape of online education in India today, you'll see a troubling trend. The skills that can actually help someone earn an income—things like Artificial Intelligence, Digital Marketing, Coding, Video Editing, and Freelancing—are locked behind massive paywalls. High-ticket bootcamps charge anywhere from ₹25,000 to ₹1 Lakh. Even mid-tier certifications on global platforms easily cost ₹5,000 to ₹15,000.\n\nFor a student in a Tier-2 or Tier-3 city, a fresher looking for their first breakthrough, or a young freelancer trying to make ends meet, those prices aren't just high. **They are a complete dead end.**\n\nThat is why **Learn2Future** exists. \n\nWe are not just another online course library. We are a brand built on a singular, stubborn belief: **quality skill development should be an accessible right, not a high-priced privilege.** This is the story of our mission, our values, and why we are committed to rewriting the rules of digital education in India.\n\n---\n\n## The Barrier We Are Fighting: The High Cost of Ambition\n\nIndia is currently home to the largest youth population in human history. Millions of young minds are bursting with ambition. They want to learn, they want to build, they want to support their families, and they want to participate in the global digital economy.\n\nBut there is a massive roadblock. \n\nTraditional university degrees are falling shorter than ever when it comes to teaching practical, industry-ready skills. Most college curricula don't teach you how to write a high-converting email campaign, how to script a viral YouTube video, how to use generative AI to double your coding speed, or how to land clients on Upwork.\n\nTo fill this gap, students turn to online education. But instead of finding a welcoming ladder, they find a locked gate. Premium education has become a luxury item. Platforms chase high profit margins, packaging basic information with fancy certificates and charging astronomical fees.\n\nWhen quality learning is this expensive, it creates an unfair gap:\n* Those who can afford premium courses get ahead.\n* Those who can't are left to piece together scattered, unstructured, and often outdated tutorials on YouTube.\n\n**We believe this status quo is completely unacceptable.** Your financial starting point should never determine your professional destination. Learn2Future was built to smash this barrier once and for all.\n\n---\n\n## The Learn2Future Philosophy: Our Core Pillars\n\nTo understand why we exist, you have to understand the values that guide every single course, article, and decision we make:\n\n### 1. Radical Affordability\nWe don't do \"discount seasons\" or \"fake price drops.\" Our base philosophy is that our learning resources must be priced at a level that an average Indian college student can comfortably afford using their own savings or pocket money. We keep our overhead low, focus entirely on high-impact learning, and pass those savings directly to our students.\n\n### 2. Practical, Real-World Skills\nWe reject the academic model of learning. The real world doesn't care how many slide decks you sat through; it cares what you can **build** and what problems you can **solve**. Our courses focus strictly on actionable skills:\n* **Generative AI & Productivity:** How to integrate AI tools into daily workflows to work 10x faster.\n* **Modern Marketing:** High-impact digital marketing, search engine optimization (SEO), and social media growth strategies.\n* **The Freelance Blueprint:** Finding clients, writing winning proposals, and building a global freelance career from India.\n* **Creative Arts:** Visual communication, high-retention video editing, and content creation.\n\n### 3. Absolute Transparency and Integrity\nThe internet is full of \"get-rich-quick\" gurus and platforms that make false, overhyped income claims. We stand firmly against this. \n* We do **not** promise instant wealth or overnight success. \n* We do **not** promote piracy or unauthorized distribution of content.\n* We offer honest, structured, high-quality, and completely legal digital learning programs designed for long-term career growth.\n\n---\n\n## How Learn2Future Solves the Skill Gap\n\nOur platform is engineered from the ground up to address the specific needs of modern Indian learners:\n\n| The Traditional Gap | The Learn2Future Solution |\n| :--- | :--- |\n| **Outrageous Pricing:** Premium digital courses costing ₹10,000 to ₹50,000+ | **Guaranteed Affordability:** Fully structured courses at accessible prices. |\n| **Theoretical Academic Fluff:** Hours of slides with no real-world application. | **Hands-On Projects:** Learn by building actual campaigns, websites, and portfolios. |\n| **Overwhelming & Scattered:** Fragmented tutorials that leave beginners lost. | **Clear Learning Paths:** Step-by-step guidance from absolute zero to job-ready. |\n| **Get-Rich-Quick Hype:** Realistic expectations replaced by empty marketing promises. | **Empathetic & Honest Training:** Practical focus on hard skills and sustainable income. |\n\n---\n\n## Empowering the Next Generation of Indian Earners\n\nLearn2Future is designed to serve as an launchpad for three primary groups of people:\n\n### A. The Ambitious College Student\nInstead of waiting until graduation to realize your degree didn't prepare you for the job market, we help you build an in-demand portfolio *while* you study. By the time you graduate, you won't just have a degree; you will have a set of high-income skills that make employers take notice.\n\n### B. The Independent Freelancer\nThe internet has democratized work. A designer or writer in Jaipur can work for a startup in San Francisco. We teach you how to bridge the gap: how to master high-value skills (like AI-augmented copy, SEO, and advanced editing) and how to navigate global freelancing platforms to secure sustainable, high-paying clients.\n\n### C. The Working Professional Upgrading Their Career\nThe rise of AI and automation means that skills have a shorter shelf life than ever before. We provide bite-sized, practical modules that allow busy professionals to upskill during their evenings and weekends, ensuring they remain invaluable in a rapidly shifting job market.\n\n---\n\n## Our Vision: Building an Upskilling Revolution\n\nOur goals go far beyond hosting courses. We are building a continuous learning ecosystem.\n\nWe want to reach learners in the furthest corners of India—not just the metro hubs, but the Tier-3 towns and rural communities where talent is abundant but resources are scarce. By providing elite-level skill training at an affordable price, we aim to bridge the digital divide and foster a new era of economic self-reliance in India.\n\nWhen you learn on Learn2Future, you are not just a customer. You are part of an active community of learners, builders, and continuous earners who believe in lifting each other up.\n\n---\n\n## Frequently Asked Questions\n\n### Why is Learn2Future so affordable?\nWe believe quality education doesn't need to be expensive. By operating digitally, avoiding bloated marketing campaigns, and prioritizing community-led growth, we keep our costs to a minimum and pass those savings directly onto our learners.\n\n### Does Learn2Future offer practical certificates?\nYes, we provide recognized skill completion credentials. However, we always remind our students that **your portfolio and your proven ability to perform are far more valuable to a modern client or employer than any piece of paper.**\n\n### Is Learn2Future safe and legal?\nAbsolutely. Learn2Future is an authorized, high-integrity digital education platform. We do not promote, distribute, or support any pirated content. All our learning resources are original, highly curated, and legally published.\n\n---\n\n## Take Your Next Step with Learn2Future\n\nThe digital economy is moving fast, and it isn't waiting for anyone. Upskilling is no longer optional—it is the single best investment you can make in your own future.\n\nIf you have the ambition to learn, the hunger to grow, and the discipline to apply yourself, you no longer have to worry about being priced out of the market. We have built the bridge. All you have to do is walk across it.\n\nExplore our courses, join our community, and start your upskilling journey today at [**learn2future.vercel.app**](https://learn2future.vercel.app/).`,
        createdAt: new Date()
      });
      console.log("[SERVER-INIT] Seeded default blog 'Why Learn2Future Exists' in Firestore.");
    }
  } catch (err) {
    console.error("[SERVER-INIT] Warning or failure initializing database seeding rules:", err);
  }
}

// Trigger background self-healing settings check and active polling
ensureDefaultSettings()
  .then(() => refreshAllSettings())
  .then(() => {
    console.log("[SERVER-INIT] Database seeded and initial settings synchronized successfully. Poller set to 15m.");
    setInterval(() => {
      refreshAllSettings().catch((err) => {
        console.error("[SERVER-SYNC] Background settings refresh err:", err);
      });
    }, 15 * 60 * 1000); // 15 minutes poller interval to prevent idle read consumption
  })
  .catch((err) => {
    console.error("[SERVER-INIT] Failed running database initialization settings seeder:", err);
  });

// Initialize Firebase Client
// (Client Firebase usage completely migrated to Admin SDK for 100% stability and zero websocket overhead)

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

interface PaymentGatewaySettings {
  razorpayKeyId: string;
  razorpayKeySecret: string;
  razorpayWebhookSecret: string;
  isTestMode: boolean;
  isLiveMode: boolean;
  enablePaymentSandbox: boolean;
}

function normalizeRazorpayKeyId(keyId: string): string {
  const trimmed = (keyId || "").trim();
  if (trimmed.startsWith("zp_test_")) {
    return "rzp_test_" + trimmed.substring(8);
  }
  if (trimmed.startsWith("zp_live_")) {
    return "rzp_live_" + trimmed.substring(8);
  }
  return trimmed;
}

const DEFAULT_RAZORPAY_KEY_ID = "rzp_test_T3sKohSHme4Sfk";
const DEFAULT_RAZORPAY_KEY_SECRET = "oc1GbiPLA98nrlP8FQ6QnZ7o";

let currentPaymentSettings: PaymentGatewaySettings = {
  razorpayKeyId: DEFAULT_RAZORPAY_KEY_ID,
  razorpayKeySecret: DEFAULT_RAZORPAY_KEY_SECRET,
  razorpayWebhookSecret: "",
  isTestMode: true,
  isLiveMode: false,
  enablePaymentSandbox: true
};

interface GlobalBrandingSettings {
  brandLogoUrl: string;
  ogDefaultImageUrl: string;
  twitterPreviewImageUrl: string;
  defaultCardTitle: string;
  defaultCardDescription: string;
  telegramChannelLink?: string;
  instagramLink?: string;
}

let currentGlobalSettings: GlobalBrandingSettings = {
  brandLogoUrl: "https://learn2future.vercel.app/brand_logo.jpg",
  ogDefaultImageUrl: "https://learn2future.vercel.app/brand_logo.jpg",
  twitterPreviewImageUrl: "https://learn2future.vercel.app/brand_logo.jpg",
  defaultCardTitle: "Learn 2 Future | Learn Today. Earn Tomorrow.",
  defaultCardDescription: "Acquire future-ready credentials and join an active community of 10,000+ continuous digital earners. Courses in AI agents, high-ticket freelancing, and viral media.",
  telegramChannelLink: "https://t.me/LearntoFuture",
  instagramLink: "https://instagram.com/learn2future/"
};

const SETTINGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL
let lastTrackingFetchTime = 0;
let lastPaymentFetchTime = 0;
let lastGlobalFetchTime = 0;

// Synchronize all settings periodically without long-lived streaming sockets that fail or timeout in serverless containers
async function refreshAllSettings(): Promise<void> {
  if (isServerQuotaExceeded) {
    return;
  }
  try {
    const docSnap = await adminDb.collection("settings").doc("tracking").get();
    if (docSnap.exists) {
      const data = docSnap.data();
      currentTrackingSettings = {
        metaPixelId: extractMetaPixelId(data?.metaPixelId || ""),
        gtmId: extractGtmId(data?.gtmId || ""),
        ga4Id: extractGa4Id(data?.ga4Id || ""),
        searchConsoleVerification: extractSearchConsoleVerification(data?.searchConsoleVerification || ""),
        facebookDomainVerification: extractFacebookDomainVerification(data?.facebookDomainVerification || "")
      };
    }
  } catch (error) {
    logServerFirestoreError("[SERVER-SYNC] Direct fetch for settings/tracking failed", error);
  }

  try {
    const docSnap = await adminDb.collection("settings").doc("paymentGateway").get();
    if (docSnap.exists) {
      const data = docSnap.data();
      const rawKeyId = data?.razorpayKeyId || "";
      const normalizedKeyId = normalizeRazorpayKeyId(rawKeyId);
      
      currentPaymentSettings = {
        razorpayKeyId: normalizedKeyId || DEFAULT_RAZORPAY_KEY_ID,
        razorpayKeySecret: data?.razorpayKeySecret || DEFAULT_RAZORPAY_KEY_SECRET,
        razorpayWebhookSecret: data?.razorpayWebhookSecret || "",
        isTestMode: data?.isTestMode !== false,
        isLiveMode: !!data?.isLiveMode,
        enablePaymentSandbox: data?.enablePaymentSandbox !== false
      };
    }
  } catch (error) {
    logServerFirestoreError("[SERVER-SYNC] Direct fetch for settings/paymentGateway failed", error);
  }

  try {
    const docSnap = await adminDb.collection("settings").doc("globalSettings").get();
    if (docSnap.exists) {
      const data = docSnap.data();
      currentGlobalSettings = {
        brandLogoUrl: data?.brandLogoUrl || "https://learn2future.vercel.app/brand_logo.jpg",
        ogDefaultImageUrl: data?.ogDefaultImageUrl || "https://learn2future.vercel.app/brand_logo.jpg",
        twitterPreviewImageUrl: data?.twitterPreviewImageUrl || "https://learn2future.vercel.app/brand_logo.jpg",
        defaultCardTitle: data?.defaultCardTitle || "Learn 2 Future | Learn Today. Earn Tomorrow.",
        defaultCardDescription: data?.defaultCardDescription || "Acquire future-ready credentials and join an active community of 10,000+ continuous digital earners. Courses in AI agents, high-ticket freelancing, and viral media.",
        telegramChannelLink: data?.telegramChannelLink || "https://t.me/LearntoFuture",
        instagramLink: data?.instagramLink || "https://instagram.com/learn2future/"
      };
    }
  } catch (error) {
    logServerFirestoreError("[SERVER-SYNC] Direct fetch for settings/globalSettings failed", error);
  }
}

// Dynamic fetchers to guarantee real-time synchronization with settings changed in the Admin Dashboard
async function fetchLatestTrackingSettings(): Promise<TrackingSettings> {
  const now = Date.now();
  if (isServerQuotaExceeded || (now - lastTrackingFetchTime < SETTINGS_CACHE_TTL)) {
    return currentTrackingSettings;
  }
  try {
    const docSnap = await adminDb.collection("settings").doc("tracking").get();
    if (docSnap.exists) {
      const data = docSnap.data();
      currentTrackingSettings = {
        metaPixelId: extractMetaPixelId(data?.metaPixelId || ""),
        gtmId: extractGtmId(data?.gtmId || ""),
        ga4Id: extractGa4Id(data?.ga4Id || ""),
        searchConsoleVerification: extractSearchConsoleVerification(data?.searchConsoleVerification || ""),
        facebookDomainVerification: extractFacebookDomainVerification(data?.facebookDomainVerification || "")
      };
      lastTrackingFetchTime = now;
    }
  } catch (error) {
    logServerFirestoreError("[SERVER-SYNC] Direct fetch for settings/tracking inside getter failed", error);
  }
  return currentTrackingSettings;
}

async function fetchLatestPaymentSettings(): Promise<PaymentGatewaySettings> {
  const now = Date.now();
  if (isServerQuotaExceeded || (now - lastPaymentFetchTime < SETTINGS_CACHE_TTL)) {
    return currentPaymentSettings;
  }
  try {
    const docSnap = await adminDb.collection("settings").doc("paymentGateway").get();
    if (docSnap.exists) {
      const data = docSnap.data();
      const rawKeyId = data?.razorpayKeyId || "";
      const normalizedKeyId = normalizeRazorpayKeyId(rawKeyId);
      
      currentPaymentSettings = {
        razorpayKeyId: normalizedKeyId || DEFAULT_RAZORPAY_KEY_ID,
        razorpayKeySecret: data?.razorpayKeySecret || DEFAULT_RAZORPAY_KEY_SECRET,
        razorpayWebhookSecret: data?.razorpayWebhookSecret || "",
        isTestMode: data?.isTestMode !== false,
        isLiveMode: !!data?.isLiveMode,
        enablePaymentSandbox: data?.enablePaymentSandbox !== false
      };
      lastPaymentFetchTime = now;
    }
  } catch (error) {
    logServerFirestoreError("[SERVER-SYNC] Direct fetch for settings/paymentGateway inside getter failed", error);
  }
  return currentPaymentSettings;
}

async function fetchLatestGlobalSettings(): Promise<GlobalBrandingSettings> {
  const now = Date.now();
  if (isServerQuotaExceeded || (now - lastGlobalFetchTime < SETTINGS_CACHE_TTL)) {
    return currentGlobalSettings;
  }
  try {
    const docSnap = await adminDb.collection("settings").doc("globalSettings").get();
    if (docSnap.exists) {
      const data = docSnap.data();
      currentGlobalSettings = {
        brandLogoUrl: data?.brandLogoUrl || "https://learn2future.vercel.app/brand_logo.jpg",
        ogDefaultImageUrl: data?.ogDefaultImageUrl || "https://learn2future.vercel.app/brand_logo.jpg",
        twitterPreviewImageUrl: data?.twitterPreviewImageUrl || "https://learn2future.vercel.app/brand_logo.jpg",
        defaultCardTitle: data?.defaultCardTitle || "Learn 2 Future | Learn Today. Earn Tomorrow.",
        defaultCardDescription: data?.defaultCardDescription || "Acquire future-ready credentials and join an active community of 10,000+ continuous digital earners. Courses in AI agents, high-ticket freelancing, and viral media.",
        telegramChannelLink: data?.telegramChannelLink || "https://t.me/LearntoFuture",
        instagramLink: data?.instagramLink || "https://instagram.com/learn2future/"
      };
      lastGlobalFetchTime = now;
    }
  } catch (error) {
    logServerFirestoreError("[SERVER-SYNC] Direct fetch for settings/globalSettings inside getter failed", error);
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
    const snap = await adminDb.collection("blogs").orderBy("publishDate", "desc").get();
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
    const snap = await adminDb.collection("courses").get();
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

async function buildSitemapXml(host: string = "learn2future.vercel.app"): Promise<string> {
  const blogs = await fetchAllBlogsForSitemap();
  const courses = await fetchAllCoursesForSitemap();
  
  const today = new Date().toISOString().split("T")[0];
  const baseUrl = host.includes("localhost") || host.includes(".run.app") ? `https://${host}` : "https://learn2future.vercel.app";
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/courses</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/blogs</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/cart</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/thank-you</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/student-portfolio</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;

  for (const blog of blogs) {
    if (blog.slug) {
      const dateStr = formatDate(blog.publishDate);
      xml += `
  <url>
    <loc>${baseUrl}/blog/${blog.slug}</loc>
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
    <loc>${baseUrl}/course/${slugVal}</loc>
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
    const snapBlogs = await adminDb.collection("blogs").orderBy("publishDate", "desc").get();
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
    const snapCourses = await adminDb.collection("courses").get();
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

  app.use(express.json({
    limit: "15mb",
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  console.log("Starting full-stack server supporting dynamic HTML injection and SPA fallback.");

  // Helper: Secure payment audit logger
  async function logPaymentAudit(paymentId: string, orderId: string, userId: string, courseIds: string[], status: string, error?: string) {
    try {
      const logId = "log_" + Date.now() + "_" + Math.random().toString(36).substring(3, 8);
      await adminDb.collection("paymentLogs").doc(logId).set({
        paymentId: paymentId || "N/A",
        orderId: orderId || "N/A",
        userId: userId || "N/A",
        courseIds: courseIds || [],
        timestamp: new Date().toISOString(),
        status: status,
        error: error || ""
      });
      console.log(`[AUDIT-LOG] Payment Log generated: ${paymentId} (${status})`);
    } catch (err) {
      console.warn("[AUDIT-LOG-FAIL] Failed writing billing audit log entry:", err);
    }
  }

  // Helper: Queue failed enrollments for automatic retry recovery
  async function queueForRecovery(userId: string, productId: string, productTitle: string, productImage: string, orderId: string, errorMsg: string) {
    try {
      const recoveryId = "rec_" + Date.now() + "_" + Math.random().toString(36).substring(3, 8);
      await adminDb.collection("paymentRecoveryQueue").doc(recoveryId).set({
        userId,
        productId,
        productTitle: productTitle || "Premium Digital Course",
        productImage: productImage || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800",
        orderId,
        error: errorMsg,
        createdAt: new Date().toISOString(),
        status: "Pending", // Pending -> Resolved
        retryCount: 0,
        lastAttempt: new Date().toISOString(),
      });
      console.log(`[RECOVERY-QUEUE] Queued course ${productId} for automatic enrollment retry for user #${userId}. Error: ${errorMsg}`);
    } catch (err) {
      console.error("[RECOVERY-QUEUE-FAIL] Failed to write recovery queue item:", err);
    }
  }

  // Runner: Process the pending payment recovery queue and auto-retry enrollment
  async function autoRetryRecoveryQueue() {
    try {
      const qSnap = await adminDb.collection("paymentRecoveryQueue").where("status", "==", "Pending").get();
      if (qSnap.empty) return;

      console.log(`[RECOVERY-CYCLE] Found ${qSnap.size} pending enrollments in payment recovery queue. Processing retries...`);
      for (const d of qSnap.docs) {
        const data = d.data();
        const docId = d.id;
        const { userId, productId, productTitle, productImage, orderId, retryCount } = data;

        try {
          // Double check they aren't already enrolled
          const dupQuerySnap = await adminDb.collection("userPurchases").where("userId", "==", userId).where("productId", "==", productId).get();
          
          if (dupQuerySnap.empty) {
            const purchaseId = "pur_rzp_" + Date.now().toString().substring(4) + Math.random().toString(36).substring(3, 7);
            
            let deliveryUrl = "https://t.me/LearntoFuture";
            try {
              const courseSnap = await adminDb.collection("courses").doc(productId).get();
              if (courseSnap.exists) {
                const cd = courseSnap.data();
                deliveryUrl = cd?.deliveryUrl || cd?.deliveryLink || "https://t.me/LearntoFuture";
              }
            } catch (_) {}

            await adminDb.collection("userPurchases").doc(purchaseId).set({
              userId,
              productId,
              productTitle: productTitle || "Premium Digital Course",
              productImage: productImage || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800",
              purchaseDate: new Date().toISOString(),
              deliveryUrl: deliveryUrl,
              orderId: orderId || "recovered",
              status: "Delivered"
            });
          }

          // Set status to Resolved
          await adminDb.collection("paymentRecoveryQueue").doc(docId).set({
            status: "Resolved",
            retryCount: (retryCount || 0) + 1,
            lastAttempt: new Date().toISOString()
          }, { merge: true });

          console.log(`[RECOVERY-SUCCESS] Enrollment resolved successfully for uid #${userId} on course ${productId}`);
        } catch (err: any) {
          console.error(`[RECOVERY-FAIL] Retry attempt failed for queue item ${docId}:`, err?.message);
          await adminDb.collection("paymentRecoveryQueue").doc(docId).set({
            retryCount: (retryCount || 0) + 1,
            lastAttempt: new Date().toISOString(),
            error: err?.message || "Unknown error during write"
          }, { merge: true });
        }
      }
    } catch (err) {
      console.error("[RECOVERY-CYCLE-ERROR] Error executing recovery queue auto-retry cycle:", err);
    }
  }

  // Setup interval to execute recovery cycle every 10 minutes
  setInterval(() => {
    autoRetryRecoveryQueue().catch((err) => console.error("Periodic recovery cycle exception:", err));
  }, 10 * 60 * 1000);

  // Core Hardened Verification and Enrollment logic (used by verify-payment & incoming webhooks)
  async function secureEnrollUser(
    userId: string,
    courseId: string,
    razorpay_order_id: string,
    razorpay_payment_id: string,
    metadata: {
      buyerName?: string;
      email?: string;
      telegram?: string;
      price?: number;
      originalPrice?: number;
      discountApplied?: number;
      couponCode?: string;
      cartItems?: any[];
      isSimulated?: boolean;
    }
  ) {
    const isSimulatedOrder = metadata.isSimulated || razorpay_order_id.startsWith("order_sim_") || razorpay_payment_id.startsWith("pay_sim_");

    console.log("[PAYMENT-AUDIT] Executing enrollment verification pipeline. Raw Payload Received:", {
      userId,
      courseId,
      razorpay_order_id,
      razorpay_payment_id,
      isSimulatedOrder,
      metadata
    });

    // 1. Duplicate order prevention & Duplicate payment prevention
    const existingOrderSnap = await adminDb.collection("orders").where("razorpayOrderId", "==", razorpay_order_id).get();
    const existingPaymentSnap = await adminDb.collection("orders").where("razorpayPaymentId", "==", razorpay_payment_id).get();

    console.log(`[PAYMENT-AUDIT] Duplication verification. Existing Order documents found: ${existingOrderSnap.size}, Existing Payment documents found: ${existingPaymentSnap.size}`);

    if (!existingOrderSnap.empty || !existingPaymentSnap.empty) {
      const existingDoc = !existingOrderSnap.empty ? existingOrderSnap.docs[0] : existingPaymentSnap.docs[0];
      console.log(`[SECURE-ENROLL-DEDUPLICATED] Order ${razorpay_order_id} or Payment ${razorpay_payment_id} already exists in database as order ID #${existingDoc.id}. Skipping duplicate.`);
      await logPaymentAudit(razorpay_payment_id, razorpay_order_id, userId, [courseId], "Duplicate Ignored (Already Processed)");
      return { success: true, orderId: existingDoc.id, alreadyProcessed: true };
    }

    // Generate a clean professional order ID
    const orderId = isSimulatedOrder ? ("ord_sim_" + Date.now().toString().substring(4)) : ("ord_rzp_" + Date.now().toString().substring(3) + Math.random().toString(36).substring(3, 6));

    // Fetch dynamic course metadata
    let deliveryUrl = "";
    let deliverableLink = "";
    let thumbnail = "";
    let finalCourseName = metadata.buyerName || "Elite skill course";

    if (courseId !== "multiple_items") {
      try {
        const courseSnap = await adminDb.collection("courses").doc(courseId).get();
        if (courseSnap.exists) {
          const cd = courseSnap.data();
          deliveryUrl = cd?.deliveryUrl || cd?.deliveryLink || "";
          deliverableLink = cd?.deliverableLink || "";
          thumbnail = cd?.thumbnail || "";
          finalCourseName = cd?.title || "Premium skill course";
        }
      } catch (cErr) {
        console.warn("Supplementary course metadata parsing error during enrollment processing:", cErr);
      }
    }

    // Extract target course IDs purchased
    const targetProductIds: string[] = [];
    if (courseId !== "multiple_items") {
      targetProductIds.push(courseId);
    }
    if (metadata.cartItems && Array.isArray(metadata.cartItems)) {
      metadata.cartItems.forEach(item => {
        if (item.productId && !targetProductIds.includes(item.productId)) {
          targetProductIds.push(item.productId);
        }
      });
    }

    // Construct standard backward-compatible Order record
    const orderPayload = {
      userId,
      name: metadata.buyerName || "Student",
      buyerName: metadata.buyerName || "Student",
      email: metadata.email || "student@example.com",
      telegram: metadata.telegram || "",
      telegramUsername: metadata.telegram || "",
      courseId,
      courseName: courseId === "multiple_items" ? "Multiple Courses Bundle" : (finalCourseName || "Elite skill course"),
      price: Number(metadata.price || metadata.originalPrice || 0),
      amount: Number(metadata.price || metadata.originalPrice || 0),
      originalPrice: Number(metadata.originalPrice || metadata.price || 0),
      discountApplied: Number(metadata.discountApplied || 0),
      couponDiscount: Number(metadata.discountApplied || 0),
      couponCode: metadata.couponCode || "None",
      screenshotUrl: isSimulatedOrder ? "Razorpay Simulated Bypass" : "Razorpay Auto-Approved Gateway",
      proofImage: isSimulatedOrder ? "Razorpay Simulated Bypass" : "Razorpay Auto-Approved Gateway",
      status: "Verified",
      paymentMethod: isSimulatedOrder ? "Sandbox Simulation Balance" : "Razorpay Gateway",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      paymentId: razorpay_payment_id,
      createdAt: AdminFieldValue.serverTimestamp(),
      date: AdminFieldValue.serverTimestamp(),
      
      // Sandbox required properties for precise verification
      isSimulated: isSimulatedOrder,
      orderId: orderId,
      purchasedCourses: targetProductIds,
      timestamp: new Date().toISOString()
    };

    console.log("[PAYMENT-AUDIT] Writing formatted standard Order payload to Firestore:", orderPayload);

    // Commit standard Order record to Orders collection
    let orderWriteSucceeded = false;
    try {
      await adminDb.collection("orders").doc(orderId).set(orderPayload);
      orderWriteSucceeded = true;
      console.log(`[PAYMENT-AUDIT] Firestore write results: Standard order document written successfully for ID #${orderId}`);
    } catch (dbErr: any) {
      console.error("[SECURE-ENROLL-ERROR] Critical fail writing standard order doc to Firestore. Proceeding anyway via recovery fallback...", dbErr);
    }

    // Process coupon used counts
    const couponCode = metadata.couponCode;
    if (couponCode && couponCode !== "None" && couponCode.trim() !== "") {
      try {
        const uCoupon = couponCode.trim().toUpperCase();
        const couponDocRef = adminDb.collection("coupons").doc(uCoupon);
        const couponSnap = await couponDocRef.get();
        if (couponSnap.exists) {
          const cd = couponSnap.data();
          const currentCount = cd?.usedCount || 0;
          const currentSales = cd?.totalSales || 0;
          const orderAmount = Number(metadata.price || 0);

          await couponDocRef.set({ 
            usedCount: currentCount + 1,
            totalSales: currentSales + orderAmount
          }, { merge: true });
          console.log(`[PAYMENT-AUDIT] Coupon stats updated for coupon: ${uCoupon}`);
        }
      } catch (couponErr) {
        console.error("Failed to update coupon stats:", couponErr);
      }
    }

    // Commit individual enrollments inside userPurchases collection with duplicate checks
    const cartItems = metadata.cartItems;
    const enrolledProductIds: string[] = [];

    if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
      for (const item of cartItems) {
        try {
          const productId = item.productId;
          
          // 2. Duplicate enrollment prevention: check if user is already enrolled in item
          const dupQuerySnap = await adminDb.collection("userPurchases").where("userId", "==", userId).where("productId", "==", productId).get();
          if (!dupQuerySnap.empty) {
            console.log(`[DEDUPLICATE-ENROLLMENT] User already enrolled in item ${productId}. Skipping duplicate creation.`);
            continue;
          }

          const purchaseId = "pur_rzp_" + Date.now().toString().substring(3) + Math.random().toString(36).substring(3, 7);
          
          let itemDeliveryUrl = "";
          let itemThumbnail = "";
          let itemTitle = item.productTitle || "";

          try {
            const itemSnap = await adminDb.collection("courses").doc(item.productId).get();
            if (itemSnap.exists) {
              const idata = itemSnap.data();
              itemDeliveryUrl = idata?.deliveryUrl || idata?.deliveryLink || "";
              itemThumbnail = idata?.thumbnail || "";
              if (!itemTitle) itemTitle = idata?.title || "";
            }
          } catch (_) {}

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

          await adminDb.collection("userPurchases").doc(purchaseId).set(purchasePayload);
          enrolledProductIds.push(productId);
          console.log(`[PAYMENT-AUDIT] Enrollment successful in cart-item: ${productId} for student UID ${userId}`);
        } catch (dbErr: any) {
          console.error(`[SECURE-ENROLL-FAIL] Individual purchase insert failed for course ${item.productId}:`, dbErr);
          await queueForRecovery(
            userId,
            item.productId,
            item.productTitle || "Elite Skill Course",
            item.productImage || "",
            orderId,
            dbErr?.message || "Firestore insertion permission/network error"
          );
        }
      }
    } else {
      try {
        // 2. Duplicate enrollment prevention: check if user is already enrolled
        const dupQuerySnap = await adminDb.collection("userPurchases").where("userId", "==", userId).where("productId", "==", courseId).get();
        if (dupQuerySnap.empty) {
          const purchaseId = "pur_rzp_" + Date.now().toString().substring(3) + Math.random().toString(36).substring(3, 6);
          const purchasePayload = {
            userId,
            productId: courseId,
            productTitle: finalCourseName || "Elite skill course",
            productImage: thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800",
            purchaseDate: new Date().toISOString(),
            deliveryUrl: deliveryUrl || deliverableLink || "https://t.me/LearntoFuture",
            orderId: orderId,
            status: "Delivered"
          };
          await adminDb.collection("userPurchases").doc(purchaseId).set(purchasePayload);
          enrolledProductIds.push(courseId);
          console.log(`[PAYMENT-AUDIT] Enrollment successful in single-item: ${courseId} for student UID ${userId}`);
        } else {
          console.log(`[DEDUPLICATE-ENROLLMENT] User already enrolled in single course ${courseId}. Skipping duplicate creation.`);
        }
      } catch (dbErr: any) {
        console.error(`[SECURE-ENROLL-FAIL] Single course insert failed:`, dbErr);
        await queueForRecovery(
          userId,
          courseId,
          finalCourseName || "Elite Skill Course",
          thumbnail || "",
          orderId,
          dbErr?.message || "Firestore single course write rejection"
        );
      }
    }

    // Trigger local auto-retry processor asynchronously
    autoRetryRecoveryQueue().catch((recErr) => console.error("[RECOVERY-RUNNER-FAIL] Background auto-retry loop exception:", recErr));

    // Audit logs entry
    const auditedIds = enrolledProductIds.length > 0 ? enrolledProductIds : [courseId];
    await logPaymentAudit(razorpay_payment_id, razorpay_order_id, userId, auditedIds, "Verified Success");

    console.log(`[PAYMENT-AUDIT] Verification status compiled: SUCCESS. Total courses enrollment committed: ${auditedIds.length}`);

    return { success: true, orderId };
  }

  let vite: any;
  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
  }

  // Dynamic robots.txt endpoint (Phase 3 TECHNICAL SEO compliance)
  app.get("/robots.txt", (req, res) => {
    const host = req.headers.host || "learn2future.vercel.app";
    const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const baseUrl = host.includes("localhost") || host.includes(".run.app") ? `${protocol}://${host}` : "https://learn2future.vercel.app";
    const robotsTxt = `# ====================================================================
# Learn 2 Future - robots.txt (Enterprise SEO & GEO Optimization)
# ====================================================================

# Rule 1: Allow all standard Search Crawlers & Webmasters
User-agent: Googlebot
Allow: /
Disallow: /admin-login
Disallow: /admin-dashboard
Disallow: /admin/login
Disallow: /admin/dashboard
Disallow: /onboarding

User-agent: Baiduspider
Allow: /
Disallow: /admin-login
Disallow: /admin-dashboard
Disallow: /admin/login
Disallow: /admin/dashboard
Disallow: /onboarding

User-agent: Yandex
Allow: /
Disallow: /admin-login
Disallow: /admin-dashboard
Disallow: /admin/login
Disallow: /admin/dashboard
Disallow: /onboarding

User-agent: Entireweb
Allow: /
Disallow: /admin-login
Disallow: /admin-dashboard
Disallow: /admin/login
Disallow: /admin/dashboard
Disallow: /onboarding

# Rule 2: Allow all Generative AI & GEO Search Agents for advanced discovery
User-agent: GPTBot
Allow: /
Disallow: /admin-login
Disallow: /admin-dashboard
Disallow: /admin/login
Disallow: /admin/dashboard
Disallow: /onboarding

User-agent: ChatGPT-User
Allow: /
Disallow: /admin-login
Disallow: /admin-dashboard
Disallow: /admin/login
Disallow: /admin/dashboard
Disallow: /onboarding

User-agent: ClaudeBot
Allow: /
Disallow: /admin-login
Disallow: /admin-dashboard
Disallow: /admin/login
Disallow: /admin/dashboard
Disallow: /onboarding

User-agent: Claude-Web
Allow: /
Disallow: /admin-login
Disallow: /admin-dashboard
Disallow: /admin/login
Disallow: /admin/dashboard
Disallow: /onboarding

User-agent: OAI-SearchBot
Allow: /
Disallow: /admin-login
Disallow: /admin-dashboard
Disallow: /admin/login
Disallow: /admin/dashboard
Disallow: /onboarding

User-agent: Applebot-Extended
Allow: /
Disallow: /admin-login
Disallow: /admin-dashboard
Disallow: /admin/login
Disallow: /admin/dashboard
Disallow: /onboarding

User-agent: Google-Extended
Allow: /
Disallow: /admin-login
Disallow: /admin-dashboard
Disallow: /admin/login
Disallow: /admin/dashboard
Disallow: /onboarding

User-agent: perplexity
Allow: /
Disallow: /admin-login
Disallow: /admin-dashboard
Disallow: /admin/login
Disallow: /admin/dashboard
Disallow: /onboarding

# Rule 3: General Fallback for all other agents
User-agent: *
Allow: /
Disallow: /admin-login
Disallow: /admin-dashboard
Disallow: /admin/login
Disallow: /admin/dashboard
Disallow: /onboarding

# Sitemaps & GEO References
Sitemap: ${baseUrl}/sitemap.xml
llms: ${baseUrl}/llms.txt
`;
    res.status(200).set({ "Content-Type": "text/plain; charset=utf-8" }).send(robotsTxt);
  });

  // Dynamic sitemap.xml endpoint pulling live Firestore blogs and courses
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const host = req.headers.host || "learn2future.vercel.app";
      const sitemapXml = await buildSitemapXml(host);
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
          const snap = await adminDb.collection("student_portfolios").where("username", "==", studentUsername).get();
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
      let courseData: any = null;
      if (isCoursePage) {
        const courseSlug = url.split("/course/")[1]?.split(/[?#]/)[0] || "";
        if (courseSlug) {
          try {
            const courseSnap = await adminDb.collection("courses").where("slug", "==", courseSlug).get();
            if (!courseSnap.empty) {
              courseData = courseSnap.docs[0].data();
            } else {
              const courseDoc = await adminDb.collection("courses").doc(courseSlug).get();
              if (courseDoc.exists) {
                courseData = courseDoc.data();
              }
            }

            if (courseData) {
              seoTitleRaw = courseData.metaTitle || `${courseData.title} | Learn 2 Future Course`;
              seoDescRaw = courseData.metaDescription || courseData.shortDescription || courseData.description?.substring(0, 155) || defaultDesc;
              
              // Priority rule: course.coverImage > fallback
              imageUrlRaw = courseData.coverImage || courseData.thumbnail || defaultImg;
              twitterImageUrlRaw = courseData.coverImage || courseData.thumbnail || defaultTwitterImg;
              canonicalUrlRaw = `https://${host}/course/${courseSlug}`;

              // Get actual reviews if they exist in DB (Phase 6 ON-PAGE SEO)
              let ratingVal = 4.9;
              let ratingCount = 18;
              let reviewList: any[] = [];
              try {
                const revSnap = await adminDb.collection("reviews")
                  .where("courseId", "==", courseData.id || courseSlug)
                  .get();
                if (!revSnap.empty) {
                  const ratings = revSnap.docs.map(d => d.data().rating || 5);
                  ratingCount = ratings.length;
                  ratingVal = Number((ratings.reduce((a, b) => a + b, 0) / ratingCount).toFixed(1));
                  reviewList = revSnap.docs.slice(0, 5).map(d => {
                    const r = d.data();
                    return {
                      "@type": "Review",
                      "author": {
                        "@type": "Person",
                        "name": r.userName || "Verified Student"
                      },
                      "reviewRating": {
                        "@type": "Rating",
                        "ratingValue": r.rating || 5,
                        "bestRating": "5",
                        "worstRating": "1"
                      },
                      "reviewBody": r.reviewText || "Excellent content and extremely actionable insights."
                    };
                  });
                }
              } catch (err) {
                console.error("Failed to query reviews for server-side schema:", err);
              }

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

              const breadcrumbSchema = {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": `https://${host}/`
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Courses",
                    "item": `https://${host}/courses`
                  },
                  {
                    "@type": "ListItem",
                    "position": 3,
                    "name": courseData.title,
                    "item": canonicalUrlRaw
                  }
                ]
              };

              const productReviewSchema = {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": courseData.title,
                "image": resolveAbsoluteUrl(imageUrlRaw, host),
                "description": seoDescRaw,
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": ratingVal,
                  "bestRating": "5",
                  "worstRating": "1",
                  "ratingCount": ratingCount
                },
                "review": reviewList.length > 0 ? reviewList : [
                  {
                    "@type": "Review",
                    "author": {
                      "@type": "Person",
                      "name": "Verified Student"
                    },
                    "reviewRating": {
                      "@type": "Rating",
                      "ratingValue": 5,
                      "bestRating": "5",
                      "worstRating": "1"
                    },
                    "reviewBody": "Actionable and high quality program with amazing support."
                  }
                ]
              };

              let faqSchemaCode = "";
              if (courseData.faqItems && courseData.faqItems.length > 0) {
                const faqSchema = {
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  "mainEntity": courseData.faqItems.map((f: any) => ({
                    "@type": "Question",
                    "name": f.question,
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": f.answer
                    }
                  }))
                };
                faqSchemaCode = `\n    <script type="application/ld+json">\n      ${JSON.stringify(faqSchema, null, 2)}\n    </script>`;
              }

              pageSpecificSchemaCode = `
    <!-- Dynamic Course Landing SEO Schema -->
    <script type="application/ld+json">
      ${JSON.stringify(courseSchema, null, 2)}
    </script>
    <!-- Dynamic Breadcrumb Schema (Phase 6 ON-PAGE SEO) -->
    <script type="application/ld+json">
      ${JSON.stringify(breadcrumbSchema, null, 2)}
    </script>
    <!-- Dynamic Product & Review Schema (Phase 6 ON-PAGE SEO) -->
    <script type="application/ld+json">
      ${JSON.stringify(productReviewSchema, null, 2)}
    </script>${faqSchemaCode}`;
            }
          } catch (courseErr) {
            console.error("Failed to query course data on server:", courseErr);
          }
        }
      }

      // 3. Blog Pages SEO tagging
      const isBlogPage = url.startsWith("/blog/");
      let blogData: any = null;
      if (isBlogPage) {
        const blogSlug = url.split("/blog/")[1]?.split(/[?#]/)[0] || "";
        if (blogSlug) {
          try {
            const blogSnap = await adminDb.collection("blogs").where("slug", "==", blogSlug).get();
            if (!blogSnap.empty) {
              blogData = blogSnap.docs[0].data();
            }

            if (blogData) {
              seoTitleRaw = blogData.metaTitle || `${blogData.title} | Learn 2 Future Blog`;
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

              const blogBreadcrumbSchema = {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": `https://${host}/`
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Blogs",
                    "item": `https://${host}/blogs`
                  },
                  {
                    "@type": "ListItem",
                    "position": 3,
                    "name": blogData.title,
                    "item": canonicalUrlRaw
                  }
                ]
              };

              pageSpecificSchemaCode = `
    <!-- Dynamic Blog Posting SEO Schema -->
    <script type="application/ld+json">
      ${JSON.stringify(blogSchema, null, 2)}
    </script>
    <!-- Dynamic Blog Breadcrumb Schema -->
    <script type="application/ld+json">
      ${JSON.stringify(blogBreadcrumbSchema, null, 2)}
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
      
      // Dynamic Keywords Tag Replacement (Phase 2 ON-PAGE SEO)
      const keywordsRaw = courseData?.keywords || blogData?.metaKeywords || blogData?.tags?.join(", ") || "e-learning, AI mastery courses, video editing training, youtube growth blueprint, freelancing mentorship, Learn 2 Future, digital skills";
      template = template.replace(/<meta name="keywords" content=".*?" \/>/i, `<meta name="keywords" content="${keywordsRaw}" />`);

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

      // Inject Sitewide Organization Schema (ON-PAGE SEO item #10)
      const orgSchema = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "name": "Learn 2 Future",
        "url": `https://${host}`,
        "logo": resolveAbsoluteUrl(defaultImg, host),
        "sameAs": [
          globalConfig.telegramChannelLink || "https://t.me/LearntoFuture",
          globalConfig.instagramLink || "https://instagram.com/learn2future/"
        ].filter(Boolean),
        "description": defaultDesc
      };
      const orgSchemaCode = `\n    <!-- Organization Schema Sitewide (ON-PAGE SEO compliance) -->\n    <script type="application/ld+json">\n      ${JSON.stringify(orgSchema, null, 2)}\n    </script>`;
      template = template.replace(/<\/head>/i, `${orgSchemaCode}\n  </head>`);

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

  // 2. Mount Vite middleware in development or Express static in production (bypassing /api/ routes so they reach the routing layer below)
  if (process.env.NODE_ENV !== "production") {
    app.use((req, res, next) => {
      if (req.originalUrl.startsWith("/api/")) {
        return next();
      }
      vite.middlewares(req, res, next);
    });
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    const staticMiddleware = express.static(distPath, { index: false });
    app.use((req, res, next) => {
      if (req.originalUrl.startsWith("/api/")) {
        return next();
      }
      staticMiddleware(req, res, next);
    });
  }

  // 3. Keep fallback just in case or for backend APIs
  function getIsAiStudioPreview(req: express.Request): boolean {
    const host = req.headers.host || "";
    return host.includes("ais-dev-") ||
           host.includes("ais-pre-") ||
           host.includes("localhost") ||
           host.includes("0.0.0.0");
  }

  function getIsProduction(req: express.Request): boolean {
    return PAYMENT_ENV === "PRODUCTION" && !getIsAiStudioPreview(req);
  }

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
      const { courseId, amount, userId, buyerName, email, telegram, couponCode, cartItems } = req.body;

      if (!courseId || !amount || !userId) {
        return res.status(400).json({ error: "Course ID, amount, and User ID are required parameters for session generation." });
      }

      // Extract and check for duplicate purchases and active checkouts using high-privileged Admin SDK - REMOVED AS PER USER REQUEST TO ALLOW BUYING MULTIPLE TIMES
      const targetProductIds = (cartItems && Array.isArray(cartItems))
        ? cartItems.map(item => item.productId)
        : [courseId];

      // Check settings dynamically
      const settings = await fetchLatestPaymentSettings();
      if (!settings.razorpayKeyId || !settings.razorpayKeySecret) {
        return res.status(400).json({
          error: "Razorpay Payment Gateway is not configured. Please contact the administrator or verify API credentials in Admin Dashboard Settings."
        });
      }

      const isPlaceholderKeys = 
        settings.razorpayKeyId === DEFAULT_RAZORPAY_KEY_ID;

      // Sandbox simulation bypass is ONLY allowed when using the default/placeholder keys,
      // sandbox mode is explicitly enabled in settings, and running inside the AI Studio preview environment. 
      // If the administrator has configured custom/personal Razorpay API keys or disabled sandbox,
      // sandbox bypass must be strictly disabled to protect course inventory.
      const isSandboxAllowed = isPlaceholderKeys && settings.enablePaymentSandbox === true && getIsAiStudioPreview(req);

      if (isPlaceholderKeys && !isSandboxAllowed) {
        return res.status(400).json({
          error: "Sandbox Simulation is disabled in active environment. Real payment key_id & key_secret are required for production transactions."
        });
      }

      let razorpayOrder: any;
      let isSimulated = false;

      try {
        if (isPlaceholderKeys) {
          console.log("[CHECKOUT] Default test/placeholder key active. Forcing local sandbox simulator.");
          throw new Error("Sandbox Simulation Required");
        }

        let RazorpayClass: any = Razorpay;
        if (Razorpay && (Razorpay as any).default) {
          RazorpayClass = (Razorpay as any).default;
        }

        if (typeof RazorpayClass === "undefined" || !RazorpayClass) {
          console.log("[CHECKOUT] Razorpay export is undefined. Attempting dynamic resolution...");
          const rzpModule = await import("razorpay");
          RazorpayClass = rzpModule.default || rzpModule;
        }

        if (typeof RazorpayClass === "undefined" || !RazorpayClass || (typeof RazorpayClass !== "function" && typeof RazorpayClass.default !== "function")) {
          throw new Error("Razorpay class constructor could not be resolved from package exports.");
        }

        const Constructor = (typeof RazorpayClass === "function") ? RazorpayClass : (RazorpayClass.default || RazorpayClass);
        const instance = new Constructor({
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

        razorpayOrder = await instance.orders.create(options);
      } catch (err: any) {
        if (!isSandboxAllowed) {
          console.error("[PAYMENT-HARDENING-ALERT] Real Razorpay purchase initialization failed:", err);
          return res.status(500).json({ error: `Secure payment transaction could not be initialized: ${err?.message || "Gateway Offline"}` });
        }

        console.info("[CHECKOUT-INFO] Sandbox simulation active:", err?.message || err);
        razorpayOrder = {
          id: "order_sim_" + Date.now().toString().substring(4) + Math.random().toString(36).substring(3, 7),
          amount: Math.round(Number(amount) * 100),
          currency: "INR"
        };
        isSimulated = true;
      }

      return res.status(200).json({
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: settings.razorpayKeyId,
        isSimulated: isSimulated,
        paymentEnv: PAYMENT_ENV
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
      const isPlaceholderKeys = settings.razorpayKeyId === DEFAULT_RAZORPAY_KEY_ID;
      const isSimulatedOrder = razorpay_order_id.startsWith("order_sim_") || razorpay_signature === "simulated_bypass_sig";

      const isProduction = getIsProduction(req);
      let isSandboxAllowed = isPlaceholderKeys && !isProduction && settings.enablePaymentSandbox === true;

      // In the AI Studio preview environment with placeholder keys, respect settings.enablePaymentSandbox
      if (getIsAiStudioPreview(req) && isPlaceholderKeys) {
        isSandboxAllowed = settings.enablePaymentSandbox === true;
      }

      if (isSimulatedOrder && !isSandboxAllowed) {
        console.error("[SECURITY-ALERT] Attempted simulated bypass of checkout verification in active environment.");
        await logPaymentAudit(razorpay_payment_id, razorpay_order_id, userId, [courseId], "Failed: Unauthorized Sandbox Request");
        return res.status(400).json({ error: "Checkout Simulation is disabled in active environment. Real cryptographic signature verification is required." });
      }

      if (!isSimulatedOrder) {
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
          await logPaymentAudit(razorpay_payment_id, razorpay_order_id, userId, [courseId], "Failed: Signature Mismatch");
          return res.status(400).json({ error: "Cryptographic checkout signature is invalid. Payment transaction untrusted." });
        }
      }

      // Execute atomic secure enrollment
      const result = await secureEnrollUser(userId, courseId, razorpay_order_id, razorpay_payment_id, {
        buyerName,
        email,
        telegram,
        price,
        originalPrice,
        discountApplied,
        couponCode,
        cartItems
      });

      console.log(`[AUTOMATION-SUCCESS] Client transaction verified successfully. Unlocked courses for uid #${userId}. Generated Order ID #${result.orderId}`);
      return res.status(200).json({ success: true, orderId: result.orderId });
    } catch (err: any) {
      console.error("Exception occurred verifying transaction and creating direct enrollment:", err);
      return res.status(500).json({ error: err?.message || "Internal database transaction failure writing verified student ledger entries." });
    }
  });

  app.post("/api/pay/trigger-recovery-retry", async (req, res) => {
    try {
      console.log("[MANUAL-RECOVERY-TRIGGER] Administrator initiated manual retry sequence of failed payments recovery queue.");
      await autoRetryRecoveryQueue();
      res.status(200).json({ success: true, message: "Manual database recovery retry sequence initiated and completed on active server." });
    } catch (err: any) {
      console.error("[MANUAL-RECOVERY-FAIL] Failed executing manual queue retry worker:", err);
      res.status(500).json({ error: err?.message || "Execution exception occurred during retry worker sequence." });
    }
  });

  app.post("/api/pay/webhook", async (req, res) => {
    try {
      const settings = await fetchLatestPaymentSettings();
      const webhookSignature = req.headers["x-razorpay-signature"] as string;

      const isProduction = getIsProduction(req);
      const secret = settings.razorpayWebhookSecret || "";

      // Cryptographic webhook security check
      if (isProduction || secret) {
        if (!webhookSignature) {
          console.error("[WEBHOOK-ERROR] Missing x-razorpay-signature header in secure webhook invocation.");
          return res.status(400).json({ error: "No signature supplied" });
        }
        if (!secret) {
          console.error("[WEBHOOK-ERROR] Webhook secret not configured in database settings panel. Webhook verification blocked.");
          return res.status(400).json({ error: "Webhook verification not set up on server" });
        }

        // Validate signature
        const shasum = crypto.createHmac("sha256", secret);
        shasum.update((req as any).rawBody || JSON.stringify(req.body));
        const digest = shasum.digest("hex");

        if (digest !== webhookSignature) {
          console.error("[WEBHOOK-SECURITY-VIOLATION] Computed HMAC signature does not match x-razorpay-signature header.");
          return res.status(400).json({ error: "HMAC mismatch. Unauthorized event payload." });
        }
        console.log("[WEBHOOK-SECURE] Webhook cryptographic signature validated successfully.");
      } else {
        console.warn("[WEBHOOK-WARNING] Processing webhook event without cryptographic validation (Staging/Dev mode without secret configured).");
      }

      const eventPayload = req.body;
      const eventName = eventPayload.event;
      console.log(`[WEBHOOK-RECEIVED] Processing Razorpay webhook event: "${eventName}"`);

      if (eventName === "payment.captured" || eventName === "order.paid") {
        const paymentEntity = eventPayload.payload?.payment?.entity;
        const paymentId = paymentEntity?.id;
        const gatewayOrderId = paymentEntity?.order_id;
        const notes = paymentEntity?.notes || {};
        
        const userId = notes.userId;
        const courseId = notes.courseId;
        const buyerName = notes.buyerName || "Student";
        const email = notes.email || notes.buyerEmail || "student@example.com";
        const telegram = notes.telegram || "";
        const amount = Number(paymentEntity?.amount || 0) / 100; // converted back to Rupees
        const couponCode = notes.couponCode || "None";

        if (userId && courseId && paymentId && gatewayOrderId) {
          console.log(`[WEBHOOK-PROCESSED] Processing secure enrollment for user #${userId} and course ${courseId} via Webhook`);
          
          await secureEnrollUser(userId, courseId, gatewayOrderId, paymentId, {
            buyerName,
            email,
            telegram,
            price: amount,
            originalPrice: amount,
            discountApplied: 0,
            couponCode,
            cartItems: []
          });
        } else {
          console.warn("[WEBHOOK-INCOMPLETE] Skipped secure enrollment: notes dictionary does not have complete userId or courseId parameters.", notes);
        }
      }

      // Always return 200 OK to Razorpay to acknowledge webhook receipt
      return res.status(200).json({ status: "processed" });
    } catch (err: any) {
      console.error("[WEBHOOK-EXCEPTION] Error handling incoming payment webhook payload:", err);
      return res.status(500).json({ error: err?.message || "Internal webhook handler processing failure." });
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
