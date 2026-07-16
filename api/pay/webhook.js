// api/pay/webhook.js - Vercel Serverless Function
// Handles Razorpay payment.captured / order.paid webhooks securely

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  api: {
    bodyParser: false, // Need raw body for HMAC verification
  },
};

function getFirebaseConfig() {
  let cfg = {};
  const searchPaths = [
    path.join(process.cwd(), "firebase-applet-config.json"),
    path.join(process.cwd(), "learn2future", "firebase-applet-config.json"),
    path.join(__dirname, "firebase-applet-config.json"),
    path.join(__dirname, "../firebase-applet-config.json"),
    path.join(__dirname, "../../firebase-applet-config.json"),
    path.join(__dirname, "../../../firebase-applet-config.json")
  ];

  let loadedPath = "None";
  for (const p of searchPaths) {
    try {
      if (fs.existsSync(p)) {
        cfg = JSON.parse(fs.readFileSync(p, "utf-8"));
        loadedPath = p;
        break;
      }
    } catch (_) {}
  }

  const projectId = cfg.projectId || process.env.FIREBASE_PROJECT_ID || "";
  const databaseId = cfg.firestoreDatabaseId || process.env.FIREBASE_FIRESTORE_DATABASE_ID || "(default)";
  const apiKey = cfg.apiKey || process.env.FIREBASE_API_KEY || "";

  console.log(`[FIREBASE-CONFIG-DIAGNOSTICS] Loaded config from path: ${loadedPath}`);
  console.log(`[FIREBASE-CONFIG-DIAGNOSTICS] Project: ${projectId || "MISSING"}, Database: ${databaseId}, API Key Present: ${!!apiKey}`);

  return {
    projectId,
    databaseId,
    apiKey,
  };
}

const fbConfig = getFirebaseConfig();
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${fbConfig.projectId}/databases/${fbConfig.databaseId}/documents`;

function encodeValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "string") return { stringValue: val };
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "number") return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(encodeValue) } };
  if (typeof val === "object") return { mapValue: { fields: toProto(val) } };
  return { stringValue: String(val) };
}
function toProto(obj) {
  const f = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== undefined) f[k] = encodeValue(v);
  return f;
}
function decodeValue(val) {
  if (!val) return null;
  if ("stringValue" in val) return val.stringValue;
  if ("integerValue" in val) return Number(val.integerValue);
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

async function firestoreSet(col, docId, data) {
  const res = await fetch(`${BASE_URL}/${col}/${docId}?key=${fbConfig.apiKey}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: toProto(data) }),
  });
  if (!res.ok) throw new Error(`Firestore set failed: ${res.status}`);
}

async function firestoreGet(col, docId) {
  try {
    const res = await fetch(`${BASE_URL}/${col}/${docId}?key=${fbConfig.apiKey}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.fields ? fromProto(data.fields) : null;
  } catch (_) { return null; }
}

async function firestoreQuery(col, filters) {
  try {
    const where = filters.map(({ field, op, value }) => ({
      fieldFilter: { field: { fieldPath: field }, op: op === "==" ? "EQUAL" : op, value: { stringValue: value } },
    }));
    const body = { structuredQuery: { from: [{ collectionId: col }], where: where.length === 1 ? where[0] : { compositeFilter: { op: "AND", filters: where } } } };
    const res = await fetch(`${BASE_URL}:runQuery?key=${fbConfig.apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) return [];
    const rows = await res.json();
    return (rows || []).filter(r => r.document).map(r => ({ id: r.document.name.split("/").pop(), ...fromProto(r.document.fields) }));
  } catch (_) { return []; }
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const rawBody = await getRawBody(req);
    const body = JSON.parse(rawBody.toString());

    // Verify webhook signature
    const webhookSignature = req.headers["x-razorpay-signature"];
    const paySettings = await firestoreGet("settings", "paymentGateway");
    const webhookSecret = paySettings?.razorpayWebhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || "";

    if (webhookSecret) {
      if (!webhookSignature) {
        return res.status(400).json({ error: "Missing webhook signature" });
      }
      const digest = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
      if (digest !== webhookSignature) {
        console.error("[webhook] HMAC mismatch");
        return res.status(400).json({ error: "Invalid webhook signature" });
      }
    }

    const eventName = body.event;
    console.log(`[webhook] Received: ${eventName}`);

    if (eventName === "payment.captured" || eventName === "order.paid") {
      const payment = body.payload?.payment?.entity;
      if (!payment) return res.status(200).json({ status: "skipped" });

      const { id: paymentId, order_id: gatewayOrderId, notes = {} } = payment;
      const { userId, courseId, buyerName = "Student", email = "", telegram = "", couponCode = "None" } = notes;
      const amount = Number(payment.amount || 0) / 100;

      if (!userId || !courseId || !paymentId || !gatewayOrderId) {
        console.warn("[webhook] Missing required fields in payment notes:", notes);
        return res.status(200).json({ status: "skipped - incomplete notes" });
      }

      // Dedup check
      const existing = await firestoreQuery("orders", [{ field: "razorpayOrderId", op: "==", value: gatewayOrderId }]);
      if (existing.length > 0) {
        return res.status(200).json({ status: "already processed" });
      }

      // Fetch course info
      let deliveryUrl = "https://t.me/LearntoFuture";
      let thumbnail = "";
      let title = "";
      const course = await firestoreGet("courses", courseId);
      if (course) {
        deliveryUrl = course.deliveryUrl || course.deliveryLink || deliveryUrl;
        thumbnail = course.thumbnail || course.coverImage || "";
        title = course.title || "";
      }

      // Enroll
      const orderId = gatewayOrderId;
      const purchaseId = "pur_" + orderId + "_" + courseId;

      await firestoreSet("userPurchases", purchaseId, {
        userId, productId: courseId, productTitle: title || "Premium Course",
        productImage: thumbnail, purchaseDate: new Date().toISOString(),
        deliveryUrl, orderId, razorpayPaymentId: paymentId, status: "Delivered",
      });

      await firestoreSet("orders", orderId, {
        userId, courseId, courseName: title || courseId,
        name: buyerName, buyerName, email, telegram,
        price: amount, amount, razorpayOrderId: gatewayOrderId,
        razorpayPaymentId: paymentId, orderId,
        couponCode, isSimulated: false, status: "Verified",
        paymentMethod: "Razorpay Gateway", createdAt: new Date().toISOString(),
      });

      console.log(`[webhook] Enrolled ${userId} in ${courseId}`);
    }

    return res.status(200).json({ status: "processed" });
  } catch (err) {
    console.error("[webhook] Error:", err);
    return res.status(500).json({ error: err?.message || "Webhook processing failed" });
  }
}
