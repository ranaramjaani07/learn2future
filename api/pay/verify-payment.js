import crypto from "crypto";
import { CONFIG } from "../_config.js";

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${CONFIG.FIREBASE_PROJECT_ID}/databases/${CONFIG.FIREBASE_DATABASE_ID}/documents`;

// ── Firestore helpers ─────────────────────────────────────
function encodeValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "string")  return { stringValue: val };
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "number")  return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (val instanceof Date)      return { timestampValue: val.toISOString() };
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
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
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

// ── Main Handler ─────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      razorpay_payment_id, razorpay_order_id, razorpay_signature,
      courseId, userId, buyerName, email, telegram,
      price, originalPrice, discountApplied, couponCode, cartItems,
    } = req.body || {};

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !courseId || !userId) {
      return res.status(400).json({ error: "Required payment fields missing." });
    }

    const keySecret  = process.env.RAZORPAY_KEY_SECRET || CONFIG.RAZORPAY_KEY_SECRET;
    const paymentEnv = process.env.PAYMENT_ENV         || CONFIG.PAYMENT_ENV;
    const isProduction  = paymentEnv === "PRODUCTION";
    const isSimulated   = razorpay_order_id.startsWith("order_sim_") || razorpay_signature === "simulated_bypass_sig";

    // Block simulation in production
    if (isSimulated && isProduction) {
      return res.status(400).json({ error: "Sandbox simulation PRODUCTION mein disable hai." });
    }

    // HMAC verification for real payments
    if (!isSimulated) {
      if (!keySecret || keySecret.includes("APNI_SECRET")) {
        return res.status(400).json({ error: "Razorpay secret key configure nahi hai." });
      }
      const expected = crypto.createHmac("sha256", keySecret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");
      if (expected !== razorpay_signature) {
        return res.status(400).json({ error: "Payment signature invalid. Transaction rejected." });
      }
    }

    // Duplicate order check
    const existing = await firestoreQuery("orders", [{ field: "razorpayOrderId", value: razorpay_order_id }]);
    if (existing.length > 0) {
      return res.status(200).json({ success: true, orderId: existing[0].orderId || existing[0].id, alreadyProcessed: true });
    }

    // Enroll user
    const orderId = (isSimulated ? "ord_sim_" : "ord_rzp_") + Date.now().toString().slice(-8) + Math.random().toString(36).slice(2, 5);
    const productList = Array.isArray(cartItems) && cartItems.length > 0
      ? cartItems
      : [{ productId: courseId, productTitle: "", productImage: "" }];

    const enrolledIds = [];
    for (const item of productList) {
      const pid = item.productId || courseId;
      if (!pid || pid === "multiple_items") continue;

      const dup = await firestoreQuery("userPurchases", [
        { field: "userId", value: userId },
        { field: "productId", value: pid },
      ]);
      if (dup.length > 0) continue;

      let deliveryUrl = "https://t.me/LearntoFuture";
      let thumbnail = "";
      let title = item.productTitle || "";
      try {
        const course = await firestoreGet("courses", pid);
        if (course) {
          deliveryUrl = course.deliveryUrl || course.deliveryLink || deliveryUrl;
          thumbnail   = course.thumbnail || course.coverImage || "";
          if (!title) title = course.title || "";
        }
      } catch (_) {}

      const purchaseId = "pur_" + Date.now().toString().slice(-7) + Math.random().toString(36).slice(2, 6);
      await firestoreSet("userPurchases", purchaseId, {
        userId, productId: pid,
        productTitle: title || "Premium Course",
        productImage: thumbnail || item.productImage || "",
        purchaseDate: new Date().toISOString(),
        deliveryUrl, orderId,
        razorpayPaymentId: razorpay_payment_id,
        status: "Delivered",
      });
      enrolledIds.push(pid);
    }

    // Write order record
    await firestoreSet("orders", orderId, {
      userId, courseId,
      courseName: productList.length > 1 ? `${productList.length} Courses Bundle` : (productList[0]?.productTitle || courseId),
      name: buyerName || "Student",
      buyerName: buyerName || "Student",
      email: email || "",
      telegram: telegram || "",
      price: Number(price || 0),
      amount: Number(price || 0),
      originalPrice: Number(originalPrice || price || 0),
      discountApplied: Number(discountApplied || 0),
      couponCode: couponCode || "None",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      isSimulated: !!isSimulated,
      orderId, purchasedCourses: enrolledIds,
      status: "Verified",
      paymentMethod: isSimulated ? "Sandbox Simulation" : "Razorpay Gateway",
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    });

    // Coupon stats update
    if (couponCode && couponCode !== "None") {
      try {
        const coupon = await firestoreGet("coupons", couponCode.trim().toUpperCase());
        if (coupon) {
          await firestoreSet("coupons", couponCode.trim().toUpperCase(), {
            ...coupon,
            usedCount: (coupon.usedCount || 0) + 1,
            totalSales: (coupon.totalSales || 0) + Number(price || 0),
          });
        }
      } catch (_) {}
    }

    return res.status(200).json({ success: true, orderId });

  } catch (err) {
    console.error("[verify-payment] Error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
}
