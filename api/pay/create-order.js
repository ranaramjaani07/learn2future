// api/pay/create-order.js - Vercel Serverless Function
// Handles Razorpay order creation with Firestore duplicate checks via REST API

import Razorpay from "razorpay";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// ──────────────────────────────────────────────
// FIRESTORE REST ENGINE (no firebase-admin needed on Vercel)
// ──────────────────────────────────────────────
function getFirebaseConfig() {
  // Priority: env vars → JSON file
  if (process.env.FIREBASE_PROJECT_ID) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      databaseId: process.env.FIREBASE_FIRESTORE_DATABASE_ID || "(default)",
      apiKey: process.env.FIREBASE_API_KEY || "",
    };
  }
  try {
    const jsonPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(jsonPath)) {
      const cfg = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      return {
        projectId: cfg.projectId,
        databaseId: cfg.firestoreDatabaseId || "(default)",
        apiKey: cfg.apiKey || "",
      };
    }
  } catch (_) {}
  return { projectId: "", databaseId: "(default)", apiKey: "" };
}

const fbConfig = getFirebaseConfig();
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${fbConfig.projectId}/databases/${fbConfig.databaseId}/documents`;

function decodeProtoValue(val) {
  if (!val) return null;
  if ("stringValue" in val) return val.stringValue;
  if ("integerValue" in val) return Number(val.integerValue);
  if ("doubleValue" in val) return Number(val.doubleValue);
  if ("booleanValue" in val) return val.booleanValue;
  if ("nullValue" in val) return null;
  if ("timestampValue" in val) return val.timestampValue;
  if ("arrayValue" in val) return (val.arrayValue.values || []).map(decodeProtoValue);
  if ("mapValue" in val) return fromProto(val.mapValue.fields || {});
  return null;
}

function fromProto(fields) {
  const obj = {};
  for (const [k, v] of Object.entries(fields || {})) obj[k] = decodeProtoValue(v);
  return obj;
}

async function firestoreQuery(collection, filters) {
  try {
    const where = filters.map(({ field, op, value }) => ({
      fieldFilter: {
        field: { fieldPath: field },
        op: op === "==" ? "EQUAL" : op,
        value: typeof value === "string" ? { stringValue: value } : { integerValue: String(value) },
      },
    }));

    const body = {
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: where.length === 1 ? where[0] : { compositeFilter: { op: "AND", filters: where } },
      },
    };

    const res = await fetch(`${BASE_URL}:runQuery?key=${fbConfig.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) return [];
    const rows = await res.json();
    return (rows || [])
      .filter((r) => r.document)
      .map((r) => ({ id: r.document.name.split("/").pop(), ...fromProto(r.document.fields) }));
  } catch (_) {
    return [];
  }
}

async function firestoreGet(collection, docId) {
  try {
    const res = await fetch(`${BASE_URL}/${collection}/${docId}?key=${fbConfig.apiKey}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.fields) return null;
    return fromProto(data.fields);
  } catch (_) {
    return null;
  }
}

// ──────────────────────────────────────────────
// DEFAULT KEYS (test/sandbox only)
// ──────────────────────────────────────────────
const DEFAULT_KEY_ID = "rzp_test_T3sKohSHme4Sfk";

export default async function handler(req, res) {
  // CORS for client-side fetch
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { courseId, amount, userId, buyerName, email, telegram, couponCode, cartItems } = req.body || {};

    if (!courseId || !amount || !userId) {
      return res.status(400).json({ error: "courseId, amount, and userId are required." });
    }

    // ── Fetch payment settings from Firestore ──
    const paySettings = await firestoreGet("settings", "paymentGateway");
    const keyId = paySettings?.razorpayKeyId || process.env.RAZORPAY_KEY_ID || DEFAULT_KEY_ID;
    const keySecret = paySettings?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || "";

    if (!keyId || !keySecret) {
      return res.status(400).json({
        error: "Razorpay credentials not configured. Please set them in Admin → Settings → Payment Gateway.",
      });
    }

    const isPlaceholderKey = keyId === DEFAULT_KEY_ID;
    const PAYMENT_ENV = process.env.PAYMENT_ENV || "DEVELOPMENT";
    const isProduction = PAYMENT_ENV === "PRODUCTION";

    // ── Duplicate enrollment check ── DELETED AS PER USER REQUEST TO ALLOW BUYING MULTIPLE TIMES

    // ── Try real Razorpay first, fall back to simulator in dev ──
    let order;
    let isSimulated = false;

    if (!isPlaceholderKey) {
      // Real Razorpay
      try {
        let RazorpayClass = Razorpay;
        if (Razorpay && Razorpay.default) RazorpayClass = Razorpay.default;
        const rzp = new RazorpayClass({ key_id: keyId, key_secret: keySecret });
        order = await rzp.orders.create({
          amount: Math.round(Number(amount) * 100),
          currency: "INR",
          receipt: "rcpt_" + Date.now().toString().slice(-8),
          notes: { courseId, userId, couponCode: couponCode || "None", buyerName: buyerName || "", email: email || "", telegram: telegram || "" },
        });
      } catch (rzpErr) {
        console.error("[create-order] Razorpay API error:", rzpErr?.message || rzpErr);
        return res.status(500).json({
          error: `Razorpay error: ${rzpErr?.message || "Gateway unavailable. Check your API credentials."}`,
        });
      }
    } else if (!isProduction) {
      // Sandbox simulation in dev/staging
      isSimulated = true;
      order = {
        id: "order_sim_" + Date.now().toString().slice(-8) + Math.random().toString(36).slice(2, 6),
        amount: Math.round(Number(amount) * 100),
        currency: "INR",
      };
    } else {
      return res.status(400).json({
        error: "Sandbox is disabled in PRODUCTION. Please configure real Razorpay credentials in Admin Settings.",
      });
    }

    return res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
      isSimulated,
      paymentEnv: PAYMENT_ENV,
    });
  } catch (err) {
    console.error("[create-order] Unexpected error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error." });
  }
}
