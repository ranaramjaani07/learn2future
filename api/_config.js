// ═══════════════════════════════════════════════════════════════
// api/_config.js — Learn2Future Master API Config
// ═══════════════════════════════════════════════════════════════
// HOW TO USE:
// 1. Firebase config is already filled (safe to commit - public by design)
// 2. Add your Razorpay LIVE keys below
// 3. git commit + push → Vercel deploys automatically
// ═══════════════════════════════════════════════════════════════

// ── Firebase (public client config - safe to hardcode) ──────────
export const FIREBASE_PROJECT_ID  = "gen-lang-client-0184060575";
export const FIREBASE_DATABASE_ID = "ai-studio-2980de92-2452-4a19-90f8-80bf9307d675";
export const FIREBASE_API_KEY     = "AIzaSyDNOLIpG63IIQVXtjJ3w5Uzv6KytI7amyM";

// ── Razorpay Live Keys ───────────────────────────────────────────
// ADD YOUR LIVE KEYS HERE:
// Get from: https://dashboard.razorpay.com → Settings → API Keys
export const RAZORPAY_KEY_ID     = "rzp_live_T5gPqKuOFluQmG";   // rzp_live_xxxxxxxxxxxxxxxxxx
export const RAZORPAY_KEY_SECRET = "LNEM0vdXBCPqZVTVcb14quOK";   // Your live key secret

// ── Firestore Base URL ───────────────────────────────────────────
export const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIREBASE_DATABASE_ID}/documents`;
