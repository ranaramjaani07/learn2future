// api/pay/create-order.js - Vercel Serverless Function
// Handles Razorpay order creation with Firestore duplicate checks via REST API

import Razorpay from "razorpay";
import crypto from "crypto";
import {
  FIREBASE_PROJECT_ID,
  FIREBASE_DATABASE_ID,
  FIREBASE_API_KEY,
  FIRESTORE_BASE_URL,
  RAZORPAY_KEY_ID   as CONFIG_RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET as CONFIG_RAZORPAY_KEY_SECRET,
} from "../_config.js";

// Firestore REST base URL (from _config.js)
const BASE_URL = FIRESTORE_BASE_URL;

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
    const url = `${BASE_URL}/${collection}/${docId}?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 403) {
        console.error(`[FIRESTORE-GET] PERMISSION DENIED for ${collection}/${docId}`);
        console.error(`⚠️  Run: firebase deploy --only firestore:rules`);
      } else {
        console.error(`[FIRESTORE-GET] ${res.status} for ${collection}/${docId}:`, errText.slice(0, 200));
      }
      return null;
    }
    const data = await res.json();
    if (!data.fields) return null;
    return fromProto(data.fields);
  } catch (err) {
    console.error(`[FIRESTORE-GET] Exception for ${collection}/${docId}:`, err?.message || err);
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

    // ── Fetch payment settings ──
    // Priority 1: Firestore (Admin Panel → Settings → Payment Gateway)
    // Priority 2: api/_config.js hardcoded keys (guaranteed fallback)
    const paySettings = await firestoreGet("settings", "paymentGateway");

    const keyId     = (paySettings?.razorpayKeyId     || "").trim() || CONFIG_RAZORPAY_KEY_ID.trim();
    const keySecret = (paySettings?.razorpayKeySecret || "").trim() || CONFIG_RAZORPAY_KEY_SECRET.trim();

    console.log(`[create-order] keyId source: ${paySettings?.razorpayKeyId ? "Firestore" : (CONFIG_RAZORPAY_KEY_ID ? "_config.js" : "NONE")}`);
    console.log(`[create-order] keyId prefix: ${keyId.slice(0,8) || "EMPTY"}`);

    if (!keyId || !keySecret) {
      return res.status(400).json({
        error: "Razorpay credentials not configured. Add keys to api/_config.js OR Admin → Settings → Payment Gateway.",
        hint: "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in api/_config.js"
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
