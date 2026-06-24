import crypto from "crypto";
import { CONFIG } from "../_config.js";

export const config = { api: { bodyParser: false } };

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${CONFIG.FIREBASE_PROJECT_ID}/databases/${CONFIG.FIREBASE_DATABASE_ID}/documents`;

function encodeValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "string")  return { stringValue: val };
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "number")  return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (Array.isArray(val))       return { arrayValue: { values: val.map(encodeValue) } };
  if (typeof val === "object")  return { mapValue: { fields: toProto(val) } };
  return { stringValue: String(val) };
}
function toProto(obj) {
  const f = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== undefined) f[k] = encodeValue(v);
  return f;
}
function decodeValue(val) {
  if (!val) return null;
  if ("stringValue" in val)  return val.stringValue;
  if ("integerValue" in val) return Number(val.integerValue);
  if ("booleanValue" in val) return val.booleanValue;
  if ("nullValue" in val)    return null;
  if ("arrayValue" in val)   return (val.arrayValue.values || []).map(decodeValue);
  if ("mapValue" in val)     return fromProto(val.mapValue.fields || {});
  return null;
}
function fromProto(fields) {
  const obj = {};
  for (const [k, v] of Object.entries(fields || {})) obj[k] = decodeValue(v);
  return obj;
}
async function firestoreSet(col, docId, data) {
  const res = await fetch(`${BASE_URL}/${col}/${docId}?key=${CONFIG.FIREBASE_API_KEY}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: toProto(data) }),
  });
  if (!res.ok) throw new Error(`Firestore write failed: ${res.status}`);
}
async function firestoreGet(col, docId) {
  try {
    const res = await fetch(`${BASE_URL}/${col}/${docId}?key=${CONFIG.FIREBASE_API_KEY}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.fields ? fromProto(data.fields) : null;
  } catch (_) { return null; }
}
async function firestoreQuery(col, filters) {
  try {
    const where = filters.map(({ field, value }) => ({
      fieldFilter: { field: { fieldPath: field }, op: "EQUAL", value: { stringValue: value } },
    }));
    const body = {
      structuredQuery: {
        from: [{ collectionId: col }],
        where: where.length === 1 ? where[0] : { compositeFilter: { op: "AND", filters: where } },
      },
    };
    const res = await fetch(`${BASE_URL}:runQuery?key=${CONFIG.FIREBASE_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (!res.ok) return [];
    const rows = await res.json();
    return (rows || []).filter(r => r.document).map(r => ({
      id: r.document.name.split("/").pop(), ...fromProto(r.document.fields)
    }));
  } catch (_) { return []; }
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const rawBody = await getRawBody(req);
    const body = JSON.parse(rawBody.toString());

    // Webhook signature verify
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || CONFIG.RAZORPAY_WEBHOOK_SECRET;
    const sig = req.headers["x-razorpay-signature"];

    if (webhookSecret && !webhookSecret.includes("APNA_WEBHOOK")) {
      if (!sig) return res.status(400).json({ error: "Missing webhook signature" });
      const digest = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
      if (digest !== sig) return res.status(400).json({ error: "Invalid webhook signature" });
    }

    const eventName = body.event;
    if (eventName !== "payment.captured" && eventName !== "order.paid") {
      return res.status(200).json({ status: "ignored" });
    }

    const payment = body.payload?.payment?.entity;
    if (!payment) return res.status(200).json({ status: "skipped" });

    const { id: paymentId, order_id: gatewayOrderId, notes = {} } = payment;
    const { userId, courseId, buyerName = "Student", email = "" } = notes;
    const amount = Number(payment.amount || 0) / 100;

    if (!userId || !courseId) return res.status(200).json({ status: "skipped - incomplete notes" });

    // Duplicate check
    const existing = await firestoreQuery("orders", [{ field: "razorpayOrderId", value: gatewayOrderId }]);
    if (existing.length > 0) return res.status(200).json({ status: "already processed" });

    const course = await firestoreGet("courses", courseId);
    const deliveryUrl = course?.deliveryUrl || course?.deliveryLink || "https://t.me/LearntoFuture";
    const thumbnail   = course?.thumbnail || course?.coverImage || "";
    const title       = course?.title || "";

    const orderId    = "ord_wh_" + Date.now().toString().slice(-7) + Math.random().toString(36).slice(2, 5);
    const purchaseId = "pur_wh_" + Date.now().toString().slice(-7) + Math.random().toString(36).slice(2, 6);

    await firestoreSet("userPurchases", purchaseId, {
      userId, productId: courseId, productTitle: title || "Premium Course",
      productImage: thumbnail, purchaseDate: new Date().toISOString(),
      deliveryUrl, orderId, razorpayPaymentId: paymentId, status: "Delivered",
    });

    await firestoreSet("orders", orderId, {
      userId, courseId, courseName: title || courseId,
      name: buyerName, buyerName, email,
      price: amount, amount, razorpayOrderId: gatewayOrderId,
      razorpayPaymentId: paymentId, orderId,
      isSimulated: false, status: "Verified",
      paymentMethod: "Razorpay Gateway", createdAt: new Date().toISOString(),
    });

    return res.status(200).json({ status: "processed" });
  } catch (err) {
    console.error("[webhook] Error:", err);
    return res.status(500).json({ error: err?.message || "Webhook error" });
  }
}
