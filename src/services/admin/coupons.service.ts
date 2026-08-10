import { db, handleFirestoreError, OperationType } from "../../firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc,
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp 
} from "firebase/firestore";

export const couponsService = {
  async getCoupons(): Promise<any[]> {
    try {
      const couponsSnap = await getDocs(query(collection(db, "coupons"), orderBy("createdAt", "desc")));
      const list: any[] = [];
      couponsSnap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "coupons");
      return [];
    }
  },

  async createCoupon(code: string, couponData: any): Promise<void> {
    try {
      const docRef = doc(db, "coupons", code.trim().toUpperCase());
      await setDoc(docRef, {
        ...couponData,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `coupons/${code}`);
    }
  },

  async deleteCoupon(code: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "coupons", code));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `coupons/${code}`);
    }
  }
};
