// api/pay/verify-payment.js - Vercel Serverless Function
// Cryptographically verifies Razorpay signature and atomically enrolls the user

import crypto from "crypto";
import {
  FIREBASE_PROJECT_ID,
  FIREBASE_DATABASE_ID,
  FIREBASE_API_KEY,
  FIRESTORE_BASE_URL,
  RAZORPAY_KEY_ID   as CONFIG_RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET as CONFIG_RAZORPAY_KEY_SECRET,
} from "../_config.js";

const BASE_URL = FIRESTORE_BASE_URL;

// ── Encode a JS value to Firestore proto format ──
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

function decodeValue(val) {
  if (!val) return null;
  if ("stringValue" in val) return val.stringValue;
  if ("integerValue" in val) return Number(val.integerValue);
  if ("doubleValue" in val) return Number(val.doubleValue);
  if ("booleanValue" in val) return val.booleanValue;
  if ("nullValue" in val) return null;
  if ("timestampValue" in val) return val.timestampValue;
  if ("arrayValue" in val) return (val.arrayValue.values || []).map(decodeValue);
  if ("mapValue" in val) return fromProto(val.mapValue.fields || {});
  return null;
}

function fromProto(fields) {
  const obj = {};
  for (const [k, v] of Object.entries(fields || {})) obj[k] = decodeValue(v);
  return obj;
}

async function firestoreSet(collection, docId, data) {
  const res = await fetch(`${BASE_URL}/${collection}/${docId}?key=${FIREBASE_API_KEY}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: toProto(data) }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Firestore set ${collection}/${docId} failed: ${res.status} ${txt}`);
  }
  return true;
}

async function firestoreGet(collection, docId) {
  try {
    const res = await fetch(`${BASE_URL}/${collection}/${docId}?key=${FIREBASE_API_KEY}`);
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

const DEFAULT_KEY_ID = process.env.RAZORPAY_KEY_ID || "";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      courseId,
      userId,
      buyerName,
      email,
      telegram,
      price,
      originalPrice,
      discountApplied,
      couponCode,
      cartItems,
    } = req.body || {};

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !courseId || !userId) {
      return res.status(400).json({ error: "Missing required payment verification parameters." });
    }

    // ── Load payment settings ──
    const paySettings = await firestoreGet("settings", "paymentGateway");
    // Keys from Firestore: Admin → Settings → Payment Gateway
    const keyId     = (paySettings?.razorpayKeyId     || "").trim() || CONFIG_RAZORPAY_KEY_ID.trim();
    const keySecret = (paySettings?.razorpayKeySecret || "").trim() || CONFIG_RAZORPAY_KEY_SECRET.trim();

    const PAYMENT_ENV = process.env.PAYMENT_ENV || "DEVELOPMENT";
    const isProduction = PAYMENT_ENV === "PRODUCTION";
    // isPlaceholderKey check removed - always use configured keys
    const isSimulatedOrder =
      razorpay_order_id.startsWith("order_sim_") || razorpay_signature === "simulated_bypass_sig";

    // ── Security Policy Enforcement: Restrict Sandbox Simulation to Verified Administrators ──
    const isAdmin = await checkIsAdminUser(userId, email || "");
    const isTestModeActive = paySettings?.isTestMode === true || paySettings?.enablePaymentSandbox === true;

    const isSandboxAllowed = isTestModeActive && isAdmin;

    if (isSimulatedOrder && !isSandboxAllowed) {
      await logAudit(razorpay_payment_id, razorpay_order_id, userId, [courseId], "Failed: Blocked Sandbox Simulation (Unauthorized/Non-Admin)");
      return res.status(403).json({
        error: "Access Denied: Sandbox simulation is disabled or unauthorized for this user.",
      });
    }

    // ── Verify HMAC signature for real payments ──
    if (!isSimulatedOrder) {
      if (!keySecret) {
        return res.status(400).json({ error: "Payment gateway secret key is not configured." });
      }
      const expectedSig = crypto
        .createHmac("sha256", keySecret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (expectedSig !== razorpay_signature) {
        console.warn("[verify-payment] Signature mismatch for order:", razorpay_order_id);
        await logAudit(razorpay_payment_id, razorpay_order_id, userId, [courseId], "Failed: Signature Mismatch");
        return res.status(400).json({ error: "Payment signature is invalid. Transaction rejected." });
      }
    }

    // ── Duplicate order prevention ──
    const existingOrders = await firestoreQuery("orders", [
      { field: "razorpayOrderId", op: "==", value: razorpay_order_id },
    ]);
    if (existingOrders.length > 0) {
      return res.status(200).json({ success: true, orderId: existingOrders[0].orderId || existingOrders[0].id, alreadyProcessed: true });
    }

    // ── Enroll the user ──
    const result = await enrollUser({
      userId, courseId, razorpay_order_id, razorpay_payment_id,
      isSimulated: isSimulatedOrder,
      meta: { buyerName, email, telegram, price, originalPrice, discountApplied, couponCode, cartItems },
    });

    await logAudit(razorpay_payment_id, razorpay_order_id, userId, result.enrolledIds, "Verified Success");

    return res.status(200).json({ success: true, orderId: result.orderId });
  } catch (err) {
    console.error("[verify-payment] Error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error during payment verification." });
  }
}

async function enrollUser({ userId, courseId, razorpay_order_id, razorpay_payment_id, isSimulated, meta }) {
  const orderId = razorpay_order_id;

  const cartItems = Array.isArray(meta.cartItems) ? meta.cartItems : [];
  const enrolledIds = [];

  // Build product list
  const productList =
    cartItems.length > 0
      ? cartItems
      : [{ productId: courseId, productTitle: "", productImage: "" }];

  for (const item of productList) {
    const pid = item.productId || courseId;
    if (!pid || pid === "multiple_items") continue;

    // Fetch active orders for this user to check duplicate enrollment - DELETED AS PER USER REQUEST TO ALLOW BUYING MULTIPLE TIMES

    // Fetch course delivery URL
    let deliveryUrl = "https://t.me/LearntoFuture";
    let thumbnail = "";
    let title = item.productTitle || "";
    try {
      const course = await firestoreGet("courses", pid);
      if (course) {
        deliveryUrl = course.deliveryUrl || course.deliveryLink || deliveryUrl;
        thumbnail = course.thumbnail || course.coverImage || "";
        if (!title) title = course.title || "";
      }
    } catch (_) {}

    const purchaseId = "pur_" + orderId + "_" + pid;
    await firestoreSet("userPurchases", purchaseId, {
      userId,
      productId: pid,
      productTitle: title || "Premium Course",
      productImage: thumbnail || item.productImage || "",
      purchaseDate: new Date().toISOString(),
      deliveryUrl,
      orderId,
      razorpayPaymentId: razorpay_payment_id,
      status: "Delivered",
    });
    enrolledIds.push(pid);
  }

  // Write the order record
  await firestoreSet("orders", orderId, {
    userId,
    courseId,
    courseName: cartItems.length > 1 ? "Multiple Courses Bundle" : (productList[0]?.productTitle || courseId),
    name: meta.buyerName || "Student",
    buyerName: meta.buyerName || "Student",
    email: meta.email || "",
    telegram: meta.telegram || "",
    price: Number(meta.price || 0),
    amount: Number(meta.price || 0),
    originalPrice: Number(meta.originalPrice || meta.price || 0),
    discountApplied: Number(meta.discountApplied || 0),
    couponCode: meta.couponCode || "None",
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    isSimulated: !!isSimulated,
    orderId,
    purchasedCourses: enrolledIds,
    status: "Verified",
    paymentMethod: isSimulated ? "Sandbox Simulation" : "Razorpay Gateway",
    createdAt: new Date().toISOString(),
    timestamp: new Date().toISOString(),
  });

  // Update coupon usage stats
  const couponCode = meta.couponCode;
  if (couponCode && couponCode !== "None" && couponCode.trim()) {
    try {
      const coupon = await firestoreGet("coupons", couponCode.trim().toUpperCase());
      if (coupon) {
        await firestoreSet("coupons", couponCode.trim().toUpperCase(), {
          ...coupon,
          usedCount: (coupon.usedCount || 0) + 1,
          totalSales: (coupon.totalSales || 0) + Number(meta.price || 0),
        });
      }
    } catch (_) {}
  }

  return { orderId, enrolledIds };
}

async function logAudit(paymentId, orderId, userId, courseIds, status) {
  try {
    const logId = "log_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
    await firestoreSet("paymentLogs", logId, {
      paymentId: paymentId || "N/A",
      orderId: orderId || "N/A",
      userId: userId || "N/A",
      courseIds: courseIds || [],
      timestamp: new Date().toISOString(),
      status,
    });
  } catch (_) {}
}
