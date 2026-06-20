import { initializeFirestore, type Firestore } from "firebase/firestore";
import type { FirebaseApp } from "firebase/app";

/**
 * Creates/initializes a Firestore instance with long polling transport parameters
 * to circumvent network blocking, RST_STREAM, or iframe proxy connection drops.
 */
export function initFirestoreIfNeeded(app: FirebaseApp, databaseId?: string): Firestore {
  return initializeFirestore(app, {
    experimentalForceLongPolling: true,
    useFetchStreams: false,
  } as any, databaseId);
}
