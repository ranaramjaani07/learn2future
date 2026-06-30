import { db, handleFirestoreError, OperationType } from "../../firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  addDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp 
} from "firebase/firestore";

export const portfolioService = {
  async getPortfolios(): Promise<any[]> {
    try {
      const snap = await getDocs(query(collection(db, "student_portfolios")));
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      return list;
    } catch (err) {
      return handleFirestoreError(err, OperationType.LIST, "student_portfolios");
    }
  },

  async savePortfolio(portfolioData: any, id?: string): Promise<string> {
    const pathString = "student_portfolios";
    try {
      if (id) {
        const docRef = doc(db, pathString, id);
        await updateDoc(docRef, portfolioData);
        return id;
      } else {
        const payload = {
          ...portfolioData,
          createdAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, pathString), payload);
        return docRef.id;
      }
    } catch (err) {
      return handleFirestoreError(err, id ? OperationType.UPDATE : OperationType.CREATE, id ? `${pathString}/${id}` : pathString);
    }
  },

  async deletePortfolio(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "student_portfolios", id));
    } catch (err) {
      return handleFirestoreError(err, OperationType.DELETE, `student_portfolios/${id}`);
    }
  }
};
