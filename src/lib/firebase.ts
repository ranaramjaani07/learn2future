import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { initFirestoreIfNeeded } from "./firestore-init";

// ─────────────────────────────────────────────────────────────
// Firebase Configuration
// Priority: VITE_ env vars (Vercel Dashboard) → JSON file (dev fallback)
// 
// FOR PRODUCTION: Set these in Vercel Dashboard → Settings → Environment Variables:
//   VITE_FIREBASE_API_KEY
//   VITE_FIREBASE_AUTH_DOMAIN
//   VITE_FIREBASE_PROJECT_ID
//   VITE_FIREBASE_STORAGE_BUCKET
//   VITE_FIREBASE_MESSAGING_SENDER_ID
//   VITE_FIREBASE_APP_ID
//   VITE_FIREBASE_FIRESTORE_DATABASE_ID
//
// firebase-applet-config.json is gitignored — local development only
// ─────────────────────────────────────────────────────────────

import jsonConfig from "../../firebase-applet-config.json";

const metaEnv = typeof import.meta !== "undefined" && (import.meta as any).env
  ? (import.meta as any).env
  : {};

const firebaseConfig = {
  apiKey:              (metaEnv.VITE_FIREBASE_API_KEY              as string) || jsonConfig?.apiKey,
  authDomain:          (metaEnv.VITE_FIREBASE_AUTH_DOMAIN          as string) || jsonConfig?.authDomain,
  projectId:           (metaEnv.VITE_FIREBASE_PROJECT_ID           as string) || jsonConfig?.projectId,
  storageBucket:       (metaEnv.VITE_FIREBASE_STORAGE_BUCKET       as string) || jsonConfig?.storageBucket,
  messagingSenderId:   (metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID  as string) || jsonConfig?.messagingSenderId,
  appId:               (metaEnv.VITE_FIREBASE_APP_ID               as string) || jsonConfig?.appId,
  measurementId:       (metaEnv.VITE_FIREBASE_MEASUREMENT_ID       as string) || jsonConfig?.measurementId,
  firestoreDatabaseId: (metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID as string) || jsonConfig?.firestoreDatabaseId,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    "[Firebase] CRITICAL: Missing config. Set VITE_FIREBASE_* variables in Vercel Dashboard → Settings → Environment Variables."
  );
}

const app = initializeApp(firebaseConfig);

export const db      = initFirestoreIfNeeded(app, firebaseConfig.firestoreDatabaseId);
export const auth    = getAuth(app);
export const storage = getStorage(app);

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST   = "list",
  GET    = "get",
  WRITE  = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?:        string | null;
    email?:         string | null;
    emailVerified?: boolean | null;
    isAnonymous?:   boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errStr = error instanceof Error ? error.message : String(error);
  const isQuota =
    errStr.toLowerCase().includes("quota") ||
    errStr.toLowerCase().includes("resource_exhausted") ||
    errStr.toLowerCase().includes("429");

  if (isQuota && typeof window !== "undefined" && (window as any).__onFirestoreQuotaExceeded) {
    (window as any).__onFirestoreQuotaExceeded();
  }

  const errInfo: FirestoreErrorInfo = {
    error: errStr,
    authInfo: {
      userId:        auth.currentUser?.uid           || null,
      email:         auth.currentUser?.email         || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous:   auth.currentUser?.isAnonymous   || null,
    },
    operationType,
    path,
  };

  if (isQuota) {
    console.warn("[Firestore] Quota handled gracefully:", JSON.stringify(errInfo, null, 2));
  } else {
    console.error("[Firestore] Error:", JSON.stringify(errInfo, null, 2));
  }
  throw new Error(JSON.stringify(errInfo));
}
