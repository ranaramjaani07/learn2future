// ============================================================
// LEARN 2 FUTURE — SERVER CONFIG
// Apni real values yahan bharo
// Ye file sirf server pe run hoti hai (Vercel serverless)
// Frontend ko ye file kabhi nahi dikhti — SAFE hai
// ============================================================

export const CONFIG = {

  // ── RAZORPAY ─────────────────────────────────────────────
  // Razorpay Dashboard → Settings → API Keys se copy karo
  RAZORPAY_KEY_ID:"rzp_live_T5gPqKuOFluQmG",  // jaise: rzp_live_T3sKohSHme4Sfk
  RAZORPAY_KEY_SECRET: "LNEM0vdXBCPqZVTVcb14quOK",         // jaise: abc123xyz789...
  RAZORPAY_WEBHOOK_SECRET: "Learn2future@2026webhooksecret", // Razorpay Webhooks page se

  // ── PAYMENT MODE ─────────────────────────────────────────
  // "PRODUCTION"  → real payment, no simulation
  // "DEVELOPMENT" → test mode, simulation allowed
  PAYMENT_ENV: "PRODUCTION",

  // ── FIREBASE ─────────────────────────────────────────────
  // Firebase Console → Project Settings → General → Your apps → Config
  FIREBASE_PROJECT_ID: "gen-lang-client-0184060575",
  FIREBASE_DATABASE_ID: "ai-studio-2980de92-2452-4a19-90f8-80bf9307d675",
  FIREBASE_API_KEY: "AIzaSyDNOLIpG63IIQVXtjJ3w5Uzv6KytI7amyM",      // AIza... wali key

};
