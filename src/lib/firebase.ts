import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import jsonConfig from "../../firebase-applet-config.json";

import { initFirestoreIfNeeded } from "./firestore-init";

// Merge JSON layout with standard VITE_ environment variables to support flexible external cloud builds
const metaEnv = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey: (metaEnv.VITE_FIREBASE_API_KEY as string) || jsonConfig?.apiKey,
  authDomain: (metaEnv.VITE_FIREBASE_AUTH_DOMAIN as string) || jsonConfig?.authDomain,
  projectId: (metaEnv.VITE_FIREBASE_PROJECT_ID as string) || jsonConfig?.projectId,
  storageBucket: (metaEnv.VITE_FIREBASE_STORAGE_BUCKET as string) || jsonConfig?.storageBucket,
  messagingSenderId: (metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || jsonConfig?.messagingSenderId,
  appId: (metaEnv.VITE_FIREBASE_APP_ID as string) || jsonConfig?.appId,
  measurementId: (metaEnv.VITE_FIREBASE_MEASUREMENT_ID as string) || jsonConfig?.measurementId,
  firestoreDatabaseId: (metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID as string) || jsonConfig?.firestoreDatabaseId,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firestoreDatabaseId if specified, with experimentalForceLongPolling enabled
export const db = initFirestoreIfNeeded(app, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const storage = getStorage(app);

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path,
  };
  console.error("Firestore Error Detailed: ", JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}
