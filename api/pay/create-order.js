import Razorpay from "razorpay";
import { CONFIG } from "../_config.js";

// ── Firebase REST helpers ─────────────────────────────────
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${CONFIG.FIREBASE_PROJECT_ID}/databases/${CONFIG.FIREBASE_DATABASE_ID}/documents`;

function decodeValue(val) {
  if (!val) return null;
  if ("stringValue" in val) return val.stringValue;
  if ("integerValue" in val) return Number(val.integerValue);
  if ("doubleValue" in val) return Number(val.doubleValue);
  if ("booleanValue" in val) return val.booleanValue;
  if ("nullValue" in val) return null;
  if ("arrayValue" in val) return (val.arrayValue.values || []).map(decodeValue);
  if ("mapValue" in val) return fromProto(val.mapValue.fields || {});
  return null;
}
function fromProto(fields) {
  const obj = {};
  for (const [k, v] of Object.entries(fields || {})) obj[k] = decodeValue(v);
  return obj;
}

async function firestoreGet(collection, docId) {
  try {
    const res = await fetch(`${BASE_URL}/${collection}/${docId}?key=${CONFIG.FIREBASE_API_KEY}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.fields ? fromProto(data.fields) : null;
  } catch (_) { return null; }
}

async function firestoreQuery(col, filters) {
  try {
    const where = filters.map(({ field, value }) => ({
      fieldFilter: {
        field: { fieldPath: field },
        op: "EQUAL",
        value: { stringValue: value },
      },
    }));
    const body = {
      structuredQuery: {
        from: [{ collectionId: col }],
        where: where.length === 1 ? where[0] : { compositeFilter: { op: "AND", filters: where } },
      },
    };
    const res = await fetch(`${BASE_URL}:runQuery?key=${CONFIG.FIREBASE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return [];
    const rows = await res.json();
    return (rows || []).filter(r => r.document).map(r => ({
      id: r.document.name.split("/").pop(),
      ...fromProto(r.document.fields)
    }));
  } catch (_) { return []; }
}

// ── Main Handler ─────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { courseId, amount, userId, buyerName, email, telegram, couponCode, cartItems } = req.body || {};

    if (!courseId || !amount || !userId) {
      return res.status(400).json({ error: "courseId, amount, userId required." });
    }

    // Config se keys lo (env var fallback bhi hai)
    const keyId     = process.env.RAZORPAY_KEY_ID     || CONFIG.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET  || CONFIG.RAZORPAY_KEY_SECRET;
    const paymentEnv = process.env.PAYMENT_ENV         || CONFIG.PAYMENT_ENV;

    const isPlaceholder = keyId.includes("APNI_KEY") || keyId === "rzp_test_T3sKohSHme4Sfk";
    const isProduction  = paymentEnv === "PRODUCTION";

    // Duplicate enrollment check
    const productIds = Array.isArray(cartItems) ? cartItems.map(i => i.productId) : [courseId];
    if (userId !== "anonymous") {
      for (const pid of productIds) {
        if (pid === "multiple_items") continue;
        const existing = await firestoreQuery("userPurchases", [
          { field: "userId", value: userId },
          { field: "productId", value: pid },
        ]);
        if (existing.length > 0) {
          return res.status(400).json({ error: `Aap pehle se is course ke owner hain! My Enrollments mein check karein.` });
        }
      }
    }

    // Real Razorpay order
    if (!isPlaceholder && keySecret && !keySecret.includes("APNI_SECRET")) {
      try {
        let RazorpayClass = Razorpay;
        if (Razorpay?.default) RazorpayClass = Razorpay.default;
        const rzp = new RazorpayClass({ key_id: keyId, key_secret: keySecret });
        const order = await rzp.orders.create({
          amount: Math.round(Number(amount) * 100),
          currency: "INR",
          receipt: "rcpt_" + Date.now().toString().slice(-8),
          notes: { courseId, userId, couponCode: couponCode || "None", buyerName: buyerName || "", email: email || "" },
        });
        return res.status(200).json({
          id: order.id, amount: order.amount, currency: order.currency,
          key_id: keyId, isSimulated: false, paymentEnv,
        });
      } catch (rzpErr) {
        return res.status(500).json({ error: `Razorpay error: ${rzpErr?.message || "Gateway unavailable"}` });
      }
    }

    // Simulation (only in DEVELOPMENT)
    if (!isProduction) {
      const simOrder = {
        id: "order_sim_" + Date.now().toString().slice(-8) + Math.random().toString(36).slice(2, 6),
        amount: Math.round(Number(amount) * 100),
        currency: "INR",
      };
      return res.status(200).json({ ...simOrder, key_id: keyId, isSimulated: true, paymentEnv });
    }

    return res.status(400).json({ error: "Razorpay credentials configure nahi hain. Admin Settings mein real keys daalo." });

  } catch (err) {
    console.error("[create-order] Error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
}
