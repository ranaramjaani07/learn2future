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
import { Review } from "../../types";

export const reviewsService = {
  async getReviews(): Promise<Review[]> {
    try {
      const snap = await getDocs(query(collection(db, "reviews"), orderBy("createdAt", "desc")));
      const list: Review[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Review);
      });
      return list;
    } catch (err) {
      return handleFirestoreError(err, OperationType.LIST, "reviews");
    }
  },

  async updateReviewStatus(reviewId: string, status: "Approved" | "Rejected"): Promise<void> {
    try {
      const docRef = doc(db, "reviews", reviewId);
      await updateDoc(docRef, { status });
    } catch (err) {
      return handleFirestoreError(err, OperationType.UPDATE, `reviews/${reviewId}`);
    }
  },

  async deleteReview(reviewId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
    } catch (err) {
      return handleFirestoreError(err, OperationType.DELETE, `reviews/${reviewId}`);
    }
  }
};
