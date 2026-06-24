# Learn 2 Future — Setup & Deployment Guide

## 🔴 Critical Fixes Applied (Summary)

| Problem | Fix Applied |
|---|---|
| `/api/pay/create-order` — 404 | ✅ Created `api/pay/create-order.js` Vercel serverless function |
| `/api/pay/verify-payment` — 404 | ✅ Created `api/pay/verify-payment.js` with HMAC-SHA256 verification |
| Payment verification broken | ✅ Server-side cryptographic signature check; no frontend bypass |
| Firestore 128K reads / day | ✅ All 8 `onSnapshot` listeners replaced with `getDoc`/`getDocs` + 15-30min cache |
| Realtime listener loop | ✅ TrackingManager, Home, Courses, MyEnrollments, AppContext all fixed |
| Razorpay secret in Firestore | ✅ `settings/paymentGateway` now requires admin auth; server reads from env vars |
| Payment logic in frontend | ✅ `logTransactionDirectlyToDb` replaced — server writes all Firestore records |
| Missing hero images | ✅ Placeholder SVGs added to `public/` |
| Admin Dashboard heavy reads | ✅ Removed unused `onSnapshot` import; dashboard uses paginated `getDocs` |

---

## 🚀 Vercel Deployment Steps

### Step 1 — Set Environment Variables in Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these (all environments: Production + Preview + Development):

```
RAZORPAY_KEY_ID          = rzp_live_YOUR_KEY_ID
RAZORPAY_KEY_SECRET      = YOUR_SECRET_KEY
RAZORPAY_WEBHOOK_SECRET  = YOUR_WEBHOOK_SECRET   (optional but recommended)
PAYMENT_ENV              = PRODUCTION             (set to DEVELOPMENT for testing)
FIREBASE_PROJECT_ID      = your-project-id
FIREBASE_FIRESTORE_DATABASE_ID = (default)
FIREBASE_API_KEY         = your-web-api-key
```

> ⚠️ **NEVER** put `RAZORPAY_KEY_SECRET` anywhere except Vercel env vars. Remove it from Firestore.

### Step 2 — Update Firestore Security Rules

Deploy the updated `firestore.rules` file:

```bash
firebase deploy --only firestore:rules
```

This blocks public access to `settings/paymentGateway` (which contained your Razorpay secret).

### Step 3 — Remove Razorpay Secret from Firestore

1. Go to Firebase Console → Firestore Database
2. Open `settings` collection → `paymentGateway` document
3. **Delete** the `razorpayKeySecret` field from the document
4. Keep `razorpayKeyId` (public key) — it's safe to store there

Your server will now read the secret from the Vercel environment variable instead.

### Step 4 — Set Up Razorpay Webhook (Recommended)

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-domain.vercel.app/api/pay/webhook`
3. Select events: `payment.captured`, `order.paid`
4. Copy the webhook secret → add as `RAZORPAY_WEBHOOK_SECRET` in Vercel

### Step 5 — Deploy

```bash
git add -A
git commit -m "fix: Razorpay backend, Firestore read explosion, security hardening"
git push origin main
```

Vercel auto-deploys on push.

---

## 🔥 Firestore Read Reduction

### Before (per page load):
- `globalSettings` — persistent onSnapshot WebSocket connection
- `orders` — persistent onSnapshot WebSocket connection  
- `cartItems` — persistent onSnapshot WebSocket connection
- `reviews` — persistent onSnapshot WebSocket connection
- `homepageSettings` — persistent onSnapshot WebSocket connection
- `heroOrbitItems` — persistent onSnapshot WebSocket connection
- `tracking` — persistent onSnapshot WebSocket connection
- User profile — persistent onSnapshot WebSocket connection
- **Total: 8 persistent WebSocket connections = hundreds of reads/session**

### After (per page load):
- All data fetched **once** via `getDoc`/`getDocs`
- Results cached in `localStorage` for **15–30 minutes**
- Cache served instantly on revisit — **zero Firestore reads**
- **Estimated: 95%+ reduction in daily reads**

---

## 💳 Payment Flow (After Fix)

```
User clicks Pay
    ↓
[Frontend] POST /api/pay/create-order
    ↓
[Server] Reads Razorpay keys from env vars (not Firestore)
[Server] Checks for duplicate enrollment
[Server] Creates Razorpay order via API
    ↓
[Frontend] Opens Razorpay checkout modal
    ↓
User completes payment
    ↓
[Frontend] Razorpay calls handler with payment_id + signature
[Frontend] POST /api/pay/verify-payment
    ↓
[Server] HMAC-SHA256 signature verification
[Server] Checks for duplicate order (idempotency)
[Server] Writes order + userPurchases to Firestore via REST API
[Server] Updates coupon usage stats
[Server] Returns { success: true, orderId }
    ↓
[Frontend] Shows success page
```

---

## 🛡️ Security Improvements

| Issue | Before | After |
|---|---|---|
| Razorpay secret | Stored in Firestore (public read) | Vercel env var (server-only) |
| Payment verification | Frontend could bypass | Server HMAC-SHA256 |
| Firestore orders write | Any authenticated user | Server REST API only |
| `settings/paymentGateway` | `allow read: if true` | Admin-only access |
| Duplicate enrollments | Not checked | Checked before every order |
| Webhook authenticity | Not verified | HMAC signature check |

---

## 🟠 Remaining Tasks (Manual)

1. **Upload real hero images** to replace the SVG placeholders:
   - `public/heroanimation1.png` — AI/ML themed
   - `public/heroanimation2.png` — Video production themed
   - `public/heroanimation3.png` — Marketing themed
   - `public/heroanimation4.png` — Freelancing themed

2. **Bundle optimization** — consider lazy-loading heavy components like AdminDashboard

3. **Firestore indexes** — add composite indexes for frequently queried collections to avoid full collection scans

4. **Firebase Quota Alert** — enable budget alerts in Google Cloud Console to get notified before limits are hit

---

## 📞 Testing Checklist

- [ ] `/api/pay/create-order` returns 200 with `{ id, amount, currency, key_id }`
- [ ] Razorpay checkout modal opens
- [ ] `/api/pay/verify-payment` returns `{ success: true, orderId }`
- [ ] User appears in `userPurchases` collection after payment
- [ ] Order appears in `orders` collection
- [ ] `settings/paymentGateway` is not readable by non-admin users
- [ ] No persistent WebSocket connections in DevTools Network tab
- [ ] Console errors reduced to near zero
