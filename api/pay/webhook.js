// api/pay/webhook.js - Vercel Serverless Function
// Handles Razorpay payment.captured / order.paid webhooks securely with signature validation
import crypto from "crypto";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false, // Need raw body for HMAC verification
  },
};

// ──────────────────────────────────────────────
// FIRESTORE REST ENGINE CONFIGURATION
// ──────────────────────────────────────────────
function getFirebaseConfig() {
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

// Helper to encode a JS value to Firestore proto format
function encodeValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "string") return { stringValue: val };
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "number") {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(encodeValue) } };
  if (typeof val === "object") return { mapValue: { fields: toProto(val) } };
  return { stringValue: String(val) };
}

function toProto(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (v !== undefined) fields[k] = encodeValue(v);
  }
  return fields;
}

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

async function firestoreSet(collection, docId, data) {
  const res = await fetch(`${BASE_URL}/${collection}/${docId}?key=${fbConfig.apiKey}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: toProto(data) }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Firestore set failed in Webhook: ${res.status} ${txt}`);
  }
  return true;
}

async function firestoreGet(collection, docId) {
  try {
    const res = await fetch(`${BASE_URL}/${collection}/${docId}?key=${fbConfig.apiKey}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.fields ? fromProto(data.fields) : null;
  } catch (_) {
    return null;
  }
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

    // 1. Webhook Signature Validation
    const webhookSignature = req.headers["x-razorpay-signature"];
    const paySettings = await firestoreGet("settings", "paymentGateway");
    const webhookSecret = paySettings?.razorpayWebhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || "";

    const PAYMENT_ENV = process.env.PAYMENT_ENV || "DEVELOPMENT";
    const isProduction = PAYMENT_ENV === "PRODUCTION" || process.env.NODE_ENV === "production";

    if (!webhookSecret) {
      if (isProduction) {
        console.error("[webhook Security] Razorpay Webhook secret is missing in PRODUCTION. Rejecting unverified event.");
        return res.status(400).json({ error: "Secure webhook signature verification is required in production." });
      } else {
        console.warn("[webhook Warning] Webhook secret is unconfigured. Verification was skipped in development mode.");
      }
    } else {
      if (!webhookSignature) {
        console.error("[webhook Security] Webhook signature header is missing.");
        return res.status(400).json({ error: "X-Razorpay-Signature is required." });
      }

      const digest = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
      if (digest !== webhookSignature) {
        console.error("[webhook Security] Webhook HMAC signature verification mismatch.");
        return res.status(400).json({ error: "Webhook signature authentication failed." });
      }
    }

    const eventName = body.event;
    console.log(`[webhook] Verified webhook received event: ${eventName}`);

    // Process payment success events
    if (eventName === "payment.captured" || eventName === "order.paid") {
      const payment = body.payload?.payment?.entity;
      if (!payment) {
        return res.status(200).json({ status: "skipped - missing payment payload" });
      }

      const { id: paymentId, order_id: gatewayOrderId, notes = {} } = payment;
      const {
        userId,
        courseId,
        courseIds,
        buyerName = "Student",
        email = "",
        telegram = "",
        couponCode = "None",
      } = notes;

      const amount = Number(payment.amount || 0) / 100;

      if (!userId || !courseId || !paymentId || !gatewayOrderId) {
        console.warn("[webhook] Ignored incomplete payment. Missing required metadata notes:", notes);
        return res.status(200).json({ status: "skipped - incomplete notes" });
      }

      // 2. Duplicate Order Processing Check
      const existingOrders = await firestoreQuery("orders", [
        { field: "razorpayOrderId", op: "==", value: gatewayOrderId },
      ]);
      if (existingOrders.length > 0) {
        const existingOrder = existingOrders[0];
        if (existingOrder.status === "Verified") {
          console.log(`[webhook] Order ${gatewayOrderId} was already successfully processed. Skipping duplicate workflow.`);
          return res.status(200).json({ status: "already processed" });
        }
      }

      // 3. User Course Enrollment Integration
      const orderId = gatewayOrderId;
      const enrolledIds = [];

      // Determine product lists to fulfill (single product vs cart bundle lists)
      const pids = courseIds ? courseIds.split(",") : [courseId];

      for (const pid of pids) {
        if (!pid || pid === "multiple_items") continue;

        let deliveryUrl = "https://t.me/LearntoFuture";
        let thumbnail = "";
        let title = "";

        try {
          const course = await firestoreGet("courses", pid);
          if (course) {
            deliveryUrl = course.deliveryUrl || course.deliveryLink || deliveryUrl;
            thumbnail = course.thumbnail || course.coverImage || "";
            title = course.title || "";
          }
        } catch (_) {}

        const purchaseId = "pur_" + orderId + "_" + pid;
        await firestoreSet("userPurchases", purchaseId, {
          userId,
          productId: pid,
          productTitle: title || "Premium Course",
          productImage: thumbnail,
          purchaseDate: new Date().toISOString(),
          deliveryUrl,
          orderId,
          razorpayPaymentId: paymentId,
          status: "Delivered",
        });
        enrolledIds.push(pid);
      }

      // Commit finalized transaction record to database
      await firestoreSet("orders", orderId, {
        userId,
        courseId,
        courseName: pids.length > 1 ? "Multiple Courses Bundle" : (pids[0] || courseId),
        name: buyerName,
        buyerName,
        email,
        telegram,
        price: amount,
        amount,
        originalPrice: amount,
        discountApplied: 0,
        couponCode,
        razorpayOrderId: gatewayOrderId,
        razorpayPaymentId: paymentId,
        orderId,
        purchasedCourses: enrolledIds,
        isSimulated: false,
        status: "Verified",
        paymentMethod: "Razorpay Webhook",
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      });

      // Safely update coupon utilization metrics
      if (couponCode && couponCode !== "None" && couponCode.trim()) {
        try {
          const coupon = await firestoreGet("coupons", couponCode.trim().toUpperCase());
          if (coupon) {
            await firestoreSet("coupons", couponCode.trim().toUpperCase(), {
              ...coupon,
              usedCount: (coupon.usedCount || 0) + 1,
              totalSales: (coupon.totalSales || 0) + amount,
            });
          }
        } catch (_) {}
      }

      console.log(`[webhook] Securely completed enrollment for user: ${userId} for courses: ${enrolledIds.join(", ")}`);
    }

    return res.status(200).json({ status: "processed" });
  } catch (err) {
    console.error("[webhook Server Exception]:", err);
    return res.status(500).json({ error: err?.message || "Internal error during webhook ingestion." });
  }
}
