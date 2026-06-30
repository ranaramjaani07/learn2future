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

export const blogsService = {
  async getBlogs(): Promise<any[]> {
    try {
      const blogsSnap = await getDocs(query(collection(db, "blogs"), orderBy("createdAt", "desc")));
      const list: any[] = [];
      blogsSnap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      return list;
    } catch (err) {
      return handleFirestoreError(err, OperationType.LIST, "blogs");
    }
  },

  async saveBlog(blogData: any, blogId?: string): Promise<string> {
    const pathString = "blogs";
    try {
      if (blogId) {
        const docRef = doc(db, pathString, blogId);
        await updateDoc(docRef, blogData);
        return blogId;
      } else {
        const payload = {
          ...blogData,
          createdAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, pathString), payload);
        return docRef.id;
      }
    } catch (err) {
      return handleFirestoreError(err, blogId ? OperationType.UPDATE : OperationType.CREATE, blogId ? `${pathString}/${blogId}` : pathString);
    }
  },

  async deleteBlog(blogId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "blogs", blogId));
    } catch (err) {
      return handleFirestoreError(err, OperationType.DELETE, `blogs/${blogId}`);
    }
  }
};
