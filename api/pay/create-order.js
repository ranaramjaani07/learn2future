// api/pay/create-order.js - Vercel Serverless Function
// Creates Razorpay order session, validates coupon, reads keys from Firestore

import Razorpay from "razorpay";
import crypto from "crypto";
import {
  FIREBASE_API_KEY,
  FIRESTORE_BASE_URL,
  RAZORPAY_KEY_ID   as CONFIG_KEY_ID,
  RAZORPAY_KEY_SECRET as CONFIG_KEY_SECRET,
} from "../_config.js";

const BASE_URL = FIRESTORE_BASE_URL;

// ── Firestore proto helpers ─────────────────────────────
function decodeValue(val) {
  if (!val) return null;
  if ("stringValue"    in val) return val.stringValue;
  if ("integerValue"   in val) return Number(val.integerValue);
  if ("doubleValue"    in val) return Number(val.doubleValue);
  if ("booleanValue"   in val) return val.booleanValue;
  if ("nullValue"      in val) return null;
  if ("timestampValue" in val) return val.timestampValue;
  if ("arrayValue"     in val) return (val.arrayValue.values || []).map(decodeValue);
  if ("mapValue"       in val) return fromProto(val.mapValue.fields || {});
  return null;
}
function fromProto(fields) {
  const obj = {};
  for (const [k, v] of Object.entries(fields || {})) obj[k] = decodeValue(v);
  return obj;
}

// ── Firestore REST GET ──────────────────────────────────
async function firestoreGet(collection, docId) {
  try {
    const res = await fetch(`${BASE_URL}/${collection}/${docId}?key=${FIREBASE_API_KEY}`);
    if (!res.ok) {
      if (res.status === 403) console.error(`[GET] PERMISSION DENIED: ${collection}/${docId} — Deploy firestore.rules`);
      return null;
    }
    const data = await res.json();
    return data.fields ? fromProto(data.fields) : null;
  } catch (err) {
    console.error(`[firestoreGet] ${collection}/${docId}:`, err?.message);
    return null;
  }
}

// ── Duplicate order check ───────────────────────────────
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
        limit: 1,
      },
    };
    const res = await fetch(`${BASE_URL}:runQuery?key=${FIREBASE_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (!res.ok) return [];
    const rows = await res.json();
    return (rows || []).filter(r => r.document).map(r => ({ id: r.document.name.split("/").pop(), ...fromProto(r.document.fields) }));
  } catch (_) { return []; }
}

// ── Main handler ────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")   return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      courseId, amount, userId, buyerName, email, telegram,
      couponCode, cartItems, referrerId,
    } = req.body || {};

    if (!courseId || !amount || !userId) {
      return res.status(400).json({ error: "Missing required fields: courseId, amount, userId." });
    }

    // ── Load Razorpay keys (Firestore first, _config.js fallback) ──
    const paySettings = await firestoreGet("settings", "paymentGateway");
    const keyId     = (paySettings?.razorpayKeyId     || "").trim() || (process.env.RAZORPAY_KEY_ID     || CONFIG_KEY_ID  || "").trim();
    const keySecret = (paySettings?.razorpayKeySecret || "").trim() || (process.env.RAZORPAY_KEY_SECRET || CONFIG_KEY_SECRET || "").trim();

    console.log(`[create-order] keys from: ${paySettings?.razorpayKeyId ? "Firestore" : "_config.js/env"} | prefix: ${keyId.slice(0,8) || "EMPTY"}`);

    if (!keyId || !keySecret) {
      return res.status(400).json({
        error: "Razorpay credentials not configured. Go to Admin → Settings → Payment Gateway and enter your live Key ID and Key Secret.",
      });
    }

    // ── Create Razorpay order ──
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const numAmount = Math.round(Number(amount) * 100); // paise
    if (isNaN(numAmount) || numAmount < 100) {
      return res.status(400).json({ error: "Amount must be at least ₹1." });
    }

    const receiptId = `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const order = await razorpay.orders.create({
      amount:   numAmount,
      currency: "INR",
      receipt:  receiptId,
      notes: {
        courseId,
        userId,
        couponCode: couponCode || "None",
        referrerId: referrerId || "",
        buyerName:  buyerName  || "",
        email:      email      || "",
        telegram:   telegram   || "",
      },
    });

    return res.status(200).json({
      id:         order.id,
      amount:     order.amount,
      currency:   order.currency,
      key_id:     keyId,
      isSimulated: false,
    });

  } catch (err) {
    console.error("[create-order] Error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error." });
  }
}
