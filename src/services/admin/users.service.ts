import { db, handleFirestoreError, OperationType } from "../../firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from "firebase/firestore";

export const usersService = {
  async getUsers(): Promise<any[]> {
    try {
      const usersSnap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
      const list: any[] = [];
      usersSnap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      return list;
    } catch (err) {
      return handleFirestoreError(err, OperationType.LIST, "users");
    }
  },

  async updateUser(userId: string, data: any): Promise<void> {
    try {
      const docRef = doc(db, "users", userId);
      await updateDoc(docRef, data);
    } catch (err) {
      return handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  },

  async toggleDisableUser(userId: string, disabled: boolean): Promise<void> {
    try {
      const docRef = doc(db, "users", userId);
      await updateDoc(docRef, { disabled });
    } catch (err) {
      return handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  },

  async deleteUser(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "users", userId));
    } catch (err) {
      return handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
    }
  }
};
