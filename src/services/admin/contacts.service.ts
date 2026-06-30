import { db, handleFirestoreError, OperationType } from "../../firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  query, 
  orderBy,
  writeBatch 
} from "firebase/firestore";
import { ContactMessage } from "../../types";

export const contactsService = {
  async getContacts(): Promise<ContactMessage[]> {
    try {
      const snap = await getDocs(query(collection(db, "contactMessages"), orderBy("createdAt", "desc")));
      const list: ContactMessage[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ContactMessage);
      });
      return list;
    } catch (err) {
      return handleFirestoreError(err, OperationType.LIST, "contactMessages");
    }
  },

  async deleteContact(messageId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "contactMessages", messageId));
    } catch (err) {
      return handleFirestoreError(err, OperationType.DELETE, `contactMessages/${messageId}`);
    }
  },

  async deleteAllContacts(messages: ContactMessage[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const msg of messages) {
        batch.delete(doc(db, "contactMessages", msg.id));
      }
      await batch.commit();
    } catch (err) {
      return handleFirestoreError(err, OperationType.DELETE, "contactMessages/batch-delete");
    }
  }
};
