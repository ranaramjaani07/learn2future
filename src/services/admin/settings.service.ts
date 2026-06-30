import { db, handleFirestoreError, OperationType } from "../../firebase";
import { 
  doc, 
  getDoc, 
  setDoc,
  updateDoc 
} from "firebase/firestore";

export const settingsService = {
  async getTrackingSettings(): Promise<any> {
    try {
      const snap = await getDoc(doc(db, "settings", "tracking"));
      return snap.exists() ? snap.data() : null;
    } catch (err) {
      return handleFirestoreError(err, OperationType.GET, "settings/tracking");
    }
  },

  async saveTrackingSettings(data: any): Promise<void> {
    try {
      const docRef = doc(db, "settings", "tracking");
      await setDoc(docRef, data, { merge: true });
    } catch (err) {
      return handleFirestoreError(err, OperationType.WRITE, "settings/tracking");
    }
  },

  async getPaymentGatewaySettings(): Promise<any> {
    try {
      const snap = await getDoc(doc(db, "settings", "paymentGateway"));
      return snap.exists() ? snap.data() : null;
    } catch (err) {
      return handleFirestoreError(err, OperationType.GET, "settings/paymentGateway");
    }
  },

  async savePaymentGatewaySettings(data: any): Promise<void> {
    try {
      const docRef = doc(db, "settings", "paymentGateway");
      await setDoc(docRef, data, { merge: true });
    } catch (err) {
      return handleFirestoreError(err, OperationType.WRITE, "settings/paymentGateway");
    }
  },

  async getHomepageSettings(): Promise<any> {
    try {
      const snap = await getDoc(doc(db, "settings", "homepageSettings"));
      return snap.exists() ? snap.data() : null;
    } catch (err) {
      return handleFirestoreError(err, OperationType.GET, "settings/homepageSettings");
    }
  },

  async saveHomepageSettings(data: any): Promise<void> {
    try {
      const docRef = doc(db, "settings", "homepageSettings");
      await setDoc(docRef, data, { merge: true });
    } catch (err) {
      return handleFirestoreError(err, OperationType.WRITE, "settings/homepageSettings");
    }
  }
};
