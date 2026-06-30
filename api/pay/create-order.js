// api/pay/create-order.js - Vercel Serverless Function
// Highly secure Razorpay order session generator with server-side price verification and Firebase authentication
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

// Helper to decode firestore proto data
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

async function firestoreGet(collection, docId) {
  try {
    const res = await fetch(`${BASE_URL}/${collection}/${docId}?key=${fbConfig.apiKey}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.fields) return null;
    return fromProto(data.fields);
  } catch (_) {
    return null;
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
      console.error("[create-order Auth] Token lookup failed:", res.status);
      return null;
    }
    const data = await res.json();
    if (data && data.users && data.users[0]) {
      return data.users[0]; // returns user info containing email, localId (uid), etc.
    }
  } catch (err) {
    console.error("[create-order Auth] Error verifying token:", err);
  }
  return null;
}

const DEFAULT_KEY_ID = "rzp_test_T3sKohSHme4Sfk";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { courseId, userId, buyerName, email, telegram, couponCode, cartItems } = req.body || {};

    // 1. Mandatory Identity and Authentication Checks
    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";

    if (!idToken) {
      return res.status(401).json({ error: "Authentication required. Missing user ID token." });
    }

    const decodedUser = await verifyFirebaseToken(idToken);
    if (!decodedUser || decodedUser.localId !== userId) {
      console.warn("[create-order Security] ID token verification failed or mismatched user IDs.");
      return res.status(403).json({ error: "Access denied. Invalid session or identity mismatch." });
    }

    if (!courseId || !userId) {
      return res.status(400).json({ error: "courseId and userId are required parameters." });
    }

    // 2. Fetch gateway parameters
    const paySettings = await firestoreGet("settings", "paymentGateway");
    const keyId = paySettings?.razorpayKeyId || process.env.RAZORPAY_KEY_ID || DEFAULT_KEY_ID;
    const keySecret = paySettings?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || "";

    if (!keyId || !keySecret) {
      return res.status(400).json({
        error: "Razorpay credentials are not fully configured. Please check Admin settings.",
      });
    }

    const isPlaceholderKey = keyId === DEFAULT_KEY_ID;
    const PAYMENT_ENV = process.env.PAYMENT_ENV || "DEVELOPMENT";
    const isProduction = PAYMENT_ENV === "PRODUCTION" || process.env.NODE_ENV === "production" || !isPlaceholderKey;

    // 3. SECURE SERVER-SIDE PRICE & COUPON CALCULATIONS
    // Avoid trusting client-sent amount payload (classic payment bypass vulnerability)
    let computedSubtotal = 0;
    const verifiedCartItems = [];

    // Retrieve active course/product lists to obtain authoritative prices directly from db
    const pids = Array.isArray(cartItems) && cartItems.length > 0 
      ? cartItems.map(item => item.productId)
      : [courseId];

    for (const pid of pids) {
      if (!pid) continue;
      const course = await firestoreGet("courses", pid);
      if (!course) {
        return res.status(400).json({ error: `Selected course (${pid}) does not exist in our catalog.` });
      }
      const coursePrice = Number(course.price || 0);
      computedSubtotal += coursePrice;
      verifiedCartItems.push({
        productId: pid,
        productTitle: course.title || "Premium Course",
        productImage: course.thumbnail || course.coverImage || "",
        price: coursePrice
      });
    }

    const courseIdsJoined = pids.join(",");

    // Calculate promotions and discounts server-side
    let computedDiscount = 0;
    let appliedPromo = "None";
    if (couponCode && couponCode !== "None" && couponCode.trim()) {
      const qCode = couponCode.trim().toUpperCase();
      const coupon = await firestoreGet("coupons", qCode);
      if (coupon && coupon.isActive) {
        // Enforce minimum transaction totals for coupon verification
        if (!coupon.minOrderValue || computedSubtotal >= Number(coupon.minOrderValue)) {
          appliedPromo = qCode;
          if (coupon.type === "percentage") {
            computedDiscount = Math.round((computedSubtotal * Number(coupon.value)) / 100);
          } else if (coupon.type === "fixed") {
            computedDiscount = Number(coupon.value);
          }
        }
      }
    }

    const finalAmountInRupees = Math.max(0, computedSubtotal - computedDiscount);
    const amountInPaise = Math.round(finalAmountInRupees * 100);

    // 4. Razorpay Order Session Creation / Sandbox Isolation
    let order;
    let isSimulated = false;

    if (isPlaceholderKey && !isProduction) {
      // Allow simulator ONLY in safe, offline testing environments
      isSimulated = true;
      order = {
        id: "order_sim_" + Date.now().toString().slice(-8) + crypto.randomBytes(3).toString("hex"),
        amount: amountInPaise,
        currency: "INR",
      };
    } else {
      // Execute cryptographically authenticated real transaction on Razorpay Gateway
      try {
        let RazorpayClass = Razorpay;
        if (Razorpay && Razorpay.default) RazorpayClass = Razorpay.default;
        const rzp = new RazorpayClass({ key_id: keyId, key_secret: keySecret });
        
        order = await rzp.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: "rcpt_" + Date.now().toString().slice(-8),
          // Store securely in immutable notes payload so client cannot modify verification targets later
          notes: {
            courseId,
            courseIds: courseIdsJoined.slice(0, 200), // Fit under notes limit
            userId,
            couponCode: appliedPromo,
            buyerName: buyerName || "Student",
            email: email || decodedUser.email || "",
            telegram: telegram || "",
            originalSubtotal: String(computedSubtotal),
            discountApplied: String(computedDiscount),
            isSimulated: "false"
          },
        });
      } catch (rzpErr) {
        console.error("[create-order Razorpay API Error]:", rzpErr?.message || rzpErr);
        return res.status(500).json({
          error: `Razorpay integration failed: ${rzpErr?.message || "Gateway temporarily unavailable."}`,
        });
      }
    }

    // Return session details to initiating front-end safely
    return res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
      isSimulated,
      paymentEnv: PAYMENT_ENV,
      computedPrice: finalAmountInRupees,
    });
  } catch (err) {
    console.error("[create-order Server Error]:", err);
    return res.status(500).json({ error: err?.message || "An unexpected error occurred during order generation." });
  }
}
