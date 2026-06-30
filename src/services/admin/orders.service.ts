import { db, handleFirestoreError, OperationType } from "../../firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  writeBatch 
} from "firebase/firestore";
import { Order } from "../../types";

export const ordersService = {
  async getOrders(): Promise<Order[]> {
    try {
      const ordersSnap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")));
      const list: Order[] = [];
      ordersSnap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Order);
      });
      return list;
    } catch (err) {
      return handleFirestoreError(err, OperationType.LIST, "orders");
    }
  },

  async updateOrderStatus(orderId: string, status: "Pending" | "Verified" | "Delivered" | "Rejected"): Promise<void> {
    try {
      const docRef = doc(db, "orders", orderId);
      await updateDoc(docRef, { status });
    } catch (err) {
      return handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  },

  async deleteOrder(orderId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "orders", orderId));
    } catch (err) {
      return handleFirestoreError(err, OperationType.DELETE, `orders/${orderId}`);
    }
  },

  async acceptAllPending(pendingOrders: Order[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const order of pendingOrders) {
        const docRef = doc(db, "orders", order.id);
        batch.update(docRef, { status: "Verified" });
      }
      await batch.commit();
    } catch (err) {
      return handleFirestoreError(err, OperationType.UPDATE, "orders/batch-accept");
    }
  }
};
