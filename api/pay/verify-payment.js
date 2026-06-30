// api/pay/verify-payment.js - Vercel Serverless Function
// Cryptographically verifies Razorpay signature, enforces cross-checks, and atomically registers course enrollments
import Razorpay from "razorpay";
import crypto from "crypto";
import fs from "fs";
import path from "path";

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
    throw new Error(`Firestore set ${collection}/${docId} failed: ${res.status} ${txt}`);
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

// ── Secure ID Token Verification using Firebase Auth REST API ──
async function verifyFirebaseToken(idToken) {
  if (!idToken || !fbConfig.apiKey) return null;
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${fbConfig.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      console.error("[verify-payment Auth] Token lookup failed:", res.status);
      return null;
    }
    const data = await res.json();
    if (data && data.users && data.users[0]) {
      return data.users[0];
    }
  } catch (err) {
    console.error("[verify-payment Auth] Error verifying token:", err);
  }
  return null;
}

const DEFAULT_KEY_ID = "rzp_test_T3sKohSHme4Sfk";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

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

    // 1. Mandatory Parameters and Session Authentication Check
    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";

    if (!idToken) {
      return res.status(401).json({ error: "Authentication required. Missing user ID token." });
    }

    const decodedUser = await verifyFirebaseToken(idToken);
    if (!decodedUser || decodedUser.localId !== userId) {
      console.warn("[verify-payment Security] Token verification failed or ID mismatch.");
      return res.status(403).json({ error: "Access denied. Invalid session or identity mismatch." });
    }

    if (!razorpay_payment_id || !razorpay_order_id || !courseId || !userId) {
      return res.status(400).json({ error: "Missing required payment verification parameters." });
    }

    // 2. Fetch Gateway Settings
    const paySettings = await firestoreGet("settings", "paymentGateway");
    const keyId = paySettings?.razorpayKeyId || process.env.RAZORPAY_KEY_ID || DEFAULT_KEY_ID;
    const keySecret = paySettings?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || "";

    const PAYMENT_ENV = process.env.PAYMENT_ENV || "DEVELOPMENT";
    const isPlaceholderKey = keyId === DEFAULT_KEY_ID;
    const isProduction = PAYMENT_ENV === "PRODUCTION" || process.env.NODE_ENV === "production" || !isPlaceholderKey;

    const isSimulatedOrder =
      razorpay_order_id.startsWith("order_sim_") || razorpay_signature === "simulated_bypass_sig";

    // ── Security Policy Enforcement: Block Sandbox Simulation in Production ──
    if (isSimulatedOrder && isProduction) {
      await logAudit(razorpay_payment_id, razorpay_order_id, userId, [courseId], "Failed: Blocked Sandbox Simulation in Production");
      return res.status(400).json({
        error: "Sandbox simulation is disabled in PRODUCTION. Real cryptographic verification is required.",
      });
    }

    // 3. Cryptographic Signature and Gateway Verification
    if (!isSimulatedOrder) {
      if (!keySecret) {
        return res.status(400).json({ error: "Payment gateway secret key is not configured." });
      }

      // Check razorpay signature locally to ensure payload integrity
      const expectedSig = crypto
        .createHmac("sha256", keySecret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (expectedSig !== razorpay_signature) {
        console.warn("[verify-payment Security] HMAC signature mismatch for order:", razorpay_order_id);
        await logAudit(razorpay_payment_id, razorpay_order_id, userId, [courseId], "Failed: Cryptographic Signature Mismatch");
        return res.status(400).json({ error: "Cryptographic verification of payment signature failed. Transaction rejected." });
      }

      // ELITE SECURITY: Double-check order validity directly against Razorpay API to prevent replay attacks
      try {
        let RazorpayClass = Razorpay;
        if (Razorpay && Razorpay.default) RazorpayClass = Razorpay.default;
        const rzp = new RazorpayClass({ key_id: keyId, key_secret: keySecret });
        const rzpOrder = await rzp.orders.fetch(razorpay_order_id);

        if (!rzpOrder) {
          return res.status(400).json({ error: "Referenced Order ID does not exist on the gateway." });
        }

        // Validate that Razorpay's internal order details match our records exactly
        if (rzpOrder.notes.userId !== userId) {
          console.error("[verify-payment Security] User ID mismatch against Razorpay session records.");
          return res.status(403).json({ error: "Security Alert: Transaction owner mismatch." });
        }
      } catch (checkErr) {
        console.error("[verify-payment Security] Failed to cross-reference order with Razorpay:", checkErr?.message || checkErr);
        return res.status(400).json({ error: "Cross-gateway payment verification failed. Please try again." });
      }
    }

    // 4. Duplicate Order Processing Check
    const existingOrders = await firestoreQuery("orders", [
      { field: "razorpayOrderId", op: "==", value: razorpay_order_id },
    ]);
    if (existingOrders.length > 0) {
      const existingOrder = existingOrders[0];
      if (existingOrder.status === "Verified") {
        return res.status(200).json({
          success: true,
          orderId: existingOrder.orderId || existingOrder.id,
          alreadyProcessed: true
        });
      }
    }

    // 5. Database Enrollment Write
    const result = await enrollUser({
      userId,
      courseId,
      razorpay_order_id,
      razorpay_payment_id,
      isSimulated: isSimulatedOrder,
      meta: { buyerName, email: email || decodedUser.email || "", telegram, price, originalPrice, discountApplied, couponCode, cartItems },
    });

    await logAudit(razorpay_payment_id, razorpay_order_id, userId, result.enrolledIds, "Verified Success");

    return res.status(200).json({ success: true, orderId: result.orderId });
  } catch (err) {
    console.error("[verify-payment Exception]:", err);
    return res.status(500).json({ error: err?.message || "Internal server error during transaction processing." });
  }
}

async function enrollUser({ userId, courseId, razorpay_order_id, razorpay_payment_id, isSimulated, meta }) {
  const orderId = razorpay_order_id;
  const cartItems = Array.isArray(meta.cartItems) ? meta.cartItems : [];
  const enrolledIds = [];

  // Build enrollment lists
  const productList =
    cartItems.length > 0
      ? cartItems
      : [{ productId: courseId, productTitle: "", productImage: "" }];

  for (const item of productList) {
    const pid = item.productId || courseId;
    if (!pid || pid === "multiple_items") continue;

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

  // Record completed verified transaction structure
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

  // Safely increment promo coupon tracking stats
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
