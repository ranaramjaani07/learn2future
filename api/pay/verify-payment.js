// api/pay/verify-payment.js - Vercel Serverless Function
// Cryptographically verifies Razorpay signature and atomically enrolls the user

import crypto from "crypto";
import {
  FIREBASE_PROJECT_ID,
  FIREBASE_DATABASE_ID,
  FIREBASE_API_KEY,
  FIRESTORE_BASE_URL,
  RAZORPAY_KEY_ID   as CONFIG_KEY_ID,
  RAZORPAY_KEY_SECRET as CONFIG_KEY_SECRET,
} from "../_config.js";

const BASE_URL = FIRESTORE_BASE_URL;
const DEFAULT_KEY_ID = process.env.RAZORPAY_KEY_ID || CONFIG_KEY_ID || "";

// ── Firestore value encoder/decoder ────────────────────
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

// ── Firestore REST helpers ──────────────────────────────
async function firestoreSet(collection, docId, data, retries = 3) {
  const url = `${BASE_URL}/${collection}/${docId}?key=${FIREBASE_API_KEY}`;
  const body = JSON.stringify({ fields: toProto(data) });
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body });
      if (res.ok) return true;
      const txt = await res.text();
      if (res.status === 403) throw new Error(`PERMISSION DENIED for ${collection}/${docId} — Deploy firestore.rules`);
      if (res.status === 400) throw new Error(`BAD REQUEST for ${collection}/${docId}: ${txt.slice(0, 200)}`);
      if (attempt < retries) await new Promise(r => setTimeout(r, 600 * attempt));
      else throw new Error(`Firestore set ${collection}/${docId} failed: ${res.status} ${txt.slice(0, 200)}`);
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 600 * attempt));
    }
  }
}

async function firestoreGet(collection, docId) {
  try {
    const res = await fetch(`${BASE_URL}/${collection}/${docId}?key=${FIREBASE_API_KEY}`);
    if (!res.ok) {
      if (res.status === 403) console.error(`[GET] PERMISSION DENIED: ${collection}/${docId} — Deploy firestore.rules`);
      return null;
    }
    const data = await res.json();
    return data.fields ? fromProto(data.fields) : null;
  } catch (_) { return null; }
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
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (!res.ok) return [];
    const rows = await res.json();
    return (rows || []).filter(r => r.document).map(r => ({ id: r.document.name.split("/").pop(), ...fromProto(r.document.fields) }));
  } catch (_) { return []; }
}

async function firestoreIncrement(collection, docId, field, delta) {
  try {
    const doc = await firestoreGet(collection, docId);
    if (!doc) return;
    const updated = { ...doc, [field]: (Number(doc[field]) || 0) + delta };
    await firestoreSet(collection, docId, updated);
  } catch (_) {}
}

async function checkIsAdminUser(userId, email) {
  if (email && email.toLowerCase() === "digitalcoursesbay@gmail.com") return true;
  const adminDoc = await firestoreGet("admins", userId);
  if (adminDoc) return true;
  if (email) {
    const adminUserDoc = await firestoreGet("adminUsers", email.toLowerCase());
    if (adminUserDoc && adminUserDoc.role === "admin") return true;
  }
  return false;
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
      referrerId,       // ← URL ?ref= param (affiliate coupon code or UID)
    } = req.body || {};

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !courseId || !userId) {
      return res.status(400).json({ error: "Missing required payment verification parameters." });
    }

    // ── Load payment settings ──
    const paySettings  = await firestoreGet("settings", "paymentGateway");
    const keyId     = (paySettings?.razorpayKeyId     || "").trim() || (process.env.RAZORPAY_KEY_ID     || CONFIG_KEY_ID  || "").trim();
    const keySecret = (paySettings?.razorpayKeySecret || "").trim() || (process.env.RAZORPAY_KEY_SECRET || CONFIG_KEY_SECRET || "").trim();

    const isSimulatedOrder = razorpay_order_id.startsWith("order_sim_") || razorpay_signature === "simulated_bypass_sig";
    const isAdmin = await checkIsAdminUser(userId, email || "");
    const isTestModeActive = paySettings?.isTestMode === true || paySettings?.enablePaymentSandbox === true;
    const isSandboxAllowed = isTestModeActive && isAdmin;

    if (isSimulatedOrder && !isSandboxAllowed) {
      await logAudit(razorpay_payment_id, razorpay_order_id, userId, [courseId], "Failed: Blocked Sandbox (Unauthorized)");
      return res.status(403).json({ error: "Sandbox simulation not allowed for this user." });
    }

    // ── Verify HMAC signature ──
    if (!isSimulatedOrder) {
      if (!keySecret) return res.status(400).json({ error: "Payment gateway secret not configured." });
      const expectedSig = crypto.createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
      if (expectedSig !== razorpay_signature) {
        await logAudit(razorpay_payment_id, razorpay_order_id, userId, [courseId], "Failed: Signature Mismatch");
        return res.status(400).json({ error: "Payment signature invalid. Transaction rejected." });
      }
    }

    // ── Prevent duplicate orders ──
    const existing = await firestoreQuery("orders", [{ field: "razorpayOrderId", op: "==", value: razorpay_order_id }]);
    if (existing.length > 0) {
      return res.status(200).json({ success: true, orderId: existing[0].orderId || existing[0].id, alreadyProcessed: true });
    }

    // ── Enroll + create order ──
    const result = await enrollUser({
      userId, courseId, razorpay_order_id, razorpay_payment_id,
      isSimulated: isSimulatedOrder,
      meta: { buyerName, email, telegram, price, originalPrice, discountApplied, couponCode, cartItems, referrerId },
    });

    await logAudit(razorpay_payment_id, razorpay_order_id, userId, result.enrolledIds, "Verified Success");
    return res.status(200).json({ success: true, orderId: result.orderId });

  } catch (err) {
    console.error("[verify-payment] Error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error during payment verification." });
  }
}

// ── Enroll user + write order + track affiliate ─────────
async function enrollUser({ userId, courseId, razorpay_order_id, razorpay_payment_id, isSimulated, meta }) {
  const orderId    = razorpay_order_id;
  const cartItems  = Array.isArray(meta.cartItems) ? meta.cartItems : [];
  const enrolledIds = [];

  const productList = cartItems.length > 0
    ? cartItems
    : [{ productId: courseId, productTitle: "", productImage: "" }];

  // ── Enroll each course ──
  for (const item of productList) {
    const pid = item.productId || courseId;
    if (!pid || pid === "multiple_items") continue;

    let deliveryUrl = "https://t.me/LearntoFuture";
    let thumbnail   = "";
    let title       = item.productTitle || "";
    try {
      const course = await firestoreGet("courses", pid);
      if (course) {
        deliveryUrl = course.deliveryUrl || course.deliveryLink || deliveryUrl;
        thumbnail   = course.thumbnail  || course.coverImage   || "";
        if (!title) title = course.title || "";
      }
    } catch (_) {}

    const purchaseId = `pur_${orderId}_${pid}`;
    await firestoreSet("userPurchases", purchaseId, {
      userId,
      productId:       pid,
      productTitle:    title    || "Premium Course",
      productImage:    thumbnail || item.productImage || "",
      purchaseDate:    new Date().toISOString(),
      deliveryUrl,
      orderId,
      razorpayPaymentId: razorpay_payment_id,
      status:          "Delivered",
      couponCode:      meta.couponCode || "None",
      price:           Number(meta.price || 0),
    });
    enrolledIds.push(pid);
  }

  // ── Write order record ──
  await firestoreSet("orders", orderId, {
    userId,
    courseId,
    courseName:       cartItems.length > 1 ? "Multiple Courses Bundle" : (productList[0]?.productTitle || courseId),
    name:             meta.buyerName    || "Student",
    buyerName:        meta.buyerName    || "Student",
    email:            meta.email        || "",
    telegram:         meta.telegram     || "",
    price:            Number(meta.price || 0),
    amount:           Number(meta.price || 0),
    originalPrice:    Number(meta.originalPrice || meta.price || 0),
    discountApplied:  Number(meta.discountApplied || 0),
    couponCode:       meta.couponCode   || "None",
    referrerId:       meta.referrerId   || "",
    razorpayOrderId:  razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    isSimulated:      !!isSimulated,
    orderId,
    purchasedCourses: enrolledIds,
    status:           "Verified",
    paymentMethod:    isSimulated ? "Sandbox Simulation" : "Razorpay Gateway",
    createdAt:        new Date().toISOString(),
    timestamp:        new Date().toISOString(),
  });

  // ── Process coupon: update usedCount + affiliate commission ──
  const couponCode = (meta.couponCode || "").trim();
  if (couponCode && couponCode !== "None") {
    try {
      const coupon = await firestoreGet("coupons", couponCode.toUpperCase());
      if (coupon) {
        // Update coupon stats
        await firestoreSet("coupons", couponCode.toUpperCase(), {
          ...coupon,
          usedCount:  (coupon.usedCount  || 0) + 1,
          totalSales: (coupon.totalSales || 0) + Number(meta.price || 0),
        });

        // Affiliate commission
        if (coupon.affiliateUid && coupon.commissionPercent) {
          const saleAmount      = Number(meta.price || 0);
          const commissionAmt   = Math.round(saleAmount * coupon.commissionPercent) / 100;
          const saleId          = `sale_${orderId}_${couponCode}`;
          
          // Get first course name for display
          const firstCourseTitle = enrolledIds.length > 1
            ? `${enrolledIds.length} Courses Bundle`
            : (productList.find(p => p.productId === enrolledIds[0])?.productTitle || enrolledIds[0] || "Course");

          // Write commission sale record — fields match MyEnrollments UI expectations
          await firestoreSet("affiliate_sales", saleId, {
            saleId,
            orderId,
            affiliateUid:       coupon.affiliateUid,
            couponCode:         couponCode.toUpperCase(),
            commissionPercent:  coupon.commissionPercent,
            // Fields MyEnrollments UI reads:
            productName:        firstCourseTitle,
            finalPaidAmount:    saleAmount,
            commissionEarned:   commissionAmt,
            discountGiven:      Number(meta.discountApplied || 0),
            saleAmount,
            commissionAmount:   commissionAmt,
            buyerUserId:        userId,
            buyerEmail:         meta.email || "",
            buyerName:          meta.buyerName || "",
            purchasedCourses:   enrolledIds,
            purchaseDate:       new Date().toISOString(),
            createdAt:          new Date().toISOString(),
            status:             "Pending",
          });

          // Update affiliate application earnings totals
          try {
            const affApp = await firestoreGet("affiliate_applications", coupon.affiliateUid);
            if (affApp) {
              await firestoreSet("affiliate_applications", coupon.affiliateUid, {
                ...affApp,
                pendingEarnings: (affApp.pendingEarnings || 0) + commissionAmt,
                totalRevenue:    (affApp.totalRevenue    || 0) + saleAmount,
                timesUsed:       (affApp.timesUsed       || 0) + 1,
                lastSaleAt:      new Date().toISOString(),
              });
            }
          } catch (_) {}

          // Update affiliate_analytics document
          try {
            const analytics = await firestoreGet("affiliate_analytics", coupon.affiliateUid);
            if (analytics) {
              await firestoreSet("affiliate_analytics", coupon.affiliateUid, {
                ...analytics,
                totalRevenue:       (analytics.totalRevenue       || 0) + saleAmount,
                totalCommission:    (analytics.totalCommission    || 0) + commissionAmt,
                pendingCommission:  (analytics.pendingCommission  || 0) + commissionAmt,
                totalOrders:        (analytics.totalOrders        || 0) + 1,
                updatedAt:          new Date().toISOString(),
                lastSaleAt:         new Date().toISOString(),
              });
            }
          } catch (_) {}
        }
      }
    } catch (couponErr) {
      console.warn("[enrollUser] Coupon/commission update failed (non-critical):", couponErr?.message);
    }
  }

  // ── Track referrerId clicks-to-purchase (URL ?ref= param) ──
  if (meta.referrerId && meta.referrerId !== couponCode) {
    try {
      // referrerId may be an affiliate coupon code or uid
      const refCoupon = await firestoreGet("coupons", meta.referrerId.toUpperCase());
      if (refCoupon && refCoupon.affiliateUid) {
        // Already handled above via couponCode path - skip to avoid double commission
      }
    } catch (_) {}
  }

  return { orderId, enrolledIds };
}

// ── Audit log writer ─────────────────────────────────────
async function logAudit(paymentId, orderId, userId, courseIds, status) {
  try {
    const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await firestoreSet("paymentLogs", logId, {
      paymentId:  paymentId  || "N/A",
      orderId:    orderId    || "N/A",
      userId:     userId     || "N/A",
      courseIds:  courseIds  || [],
      timestamp:  new Date().toISOString(),
      status,
    });
  } catch (_) {}
}
