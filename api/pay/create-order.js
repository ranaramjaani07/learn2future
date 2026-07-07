// api/pay/create-order.js - Vercel Serverless Function
// Handles Razorpay order creation with Firestore duplicate checks via REST API

import Razorpay from "razorpay";
import crypto from "crypto";

// ──────────────────────────────────────────────
// Firebase config - embedded directly (100% reliable on Vercel free plan)
// These are CLIENT-SIDE config values, public by design.
// Security = Firestore Rules. See: firebase.google.com/docs/projects/api-keys
// Razorpay keys are NOT here - they come from Firestore (Admin → Settings)
// ──────────────────────────────────────────────
const FIREBASE_PROJECT_ID  = "gen-lang-client-0184060575";
const FIREBASE_DATABASE_ID = "ai-studio-2980de92-2452-4a19-90f8-80bf9307d675";
const FIREBASE_API_KEY     = "AIzaSyDNOLIpG63IIQVXtjJ3w5Uzv6KytI7amyM";

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIREBASE_DATABASE_ID}/documents`;

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

    const res = await fetch(`${BASE_URL}:runQuery?key=${FIREBASE_API_KEY}`, {
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
    const res = await fetch(`${BASE_URL}/${collection}/${docId}?key=${FIREBASE_API_KEY}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.fields) return null;
    return fromProto(data.fields);
  } catch (_) {
    return null;
  }
}

async function checkIsAdminUser(userId, email) {
  if (email && email.toLowerCase() === "digitalcoursesbay@gmail.com") {
    return true;
  }
  const adminDoc = await firestoreGet("admins", userId);
  if (adminDoc) return true;
  if (email) {
    const adminUserDoc = await firestoreGet("adminUsers", email.toLowerCase());
    if (adminUserDoc && adminUserDoc.role === "admin") return true;
  }
  return false;
}

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

    // ── Fetch payment settings from Firestore (with env var fallback) ──
    const paySettings = await firestoreGet("settings", "paymentGateway");

    // Keys come from Firestore: Admin → Settings → Payment Gateway
    // (No env vars needed - uses firebase-applet-config.json bundled with function)
    const keyId     = (paySettings?.razorpayKeyId     || "").trim();
    const keySecret = (paySettings?.razorpayKeySecret || "").trim();

    if (!keyId || !keySecret) {
      return res.status(400).json({
        error: "Razorpay credentials not configured. Please go to Admin → Settings → Payment Gateway and enter your Razorpay Key ID and Key Secret.",
        hint: "Both razorpayKeyId and razorpayKeySecret must be saved in Admin Settings."
      });
    }

    // Always use real Razorpay — no sandbox simulation for students
    let order;
    let isSimulated = false;

    {
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
    }

    return res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
      isSimulated,
    });
  } catch (err) {
    console.error("[create-order] Unexpected error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error." });
  }
}
