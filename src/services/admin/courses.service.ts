import { db, handleFirestoreError, OperationType } from "../../firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { Course } from "../../types";

export const coursesService = {
  async getCourses(): Promise<Course[]> {
    try {
      const coursesSnap = await getDocs(query(collection(db, "courses"), orderBy("createdAt", "desc")));
      const list: Course[] = [];
      coursesSnap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Course);
      });
      return list;
    } catch (err) {
      return handleFirestoreError(err, OperationType.LIST, "courses");
    }
  },

  async saveCourse(courseData: Partial<Course>, courseId?: string): Promise<string> {
    const pathString = "courses";
    try {
      if (courseId) {
        const docRef = doc(db, pathString, courseId);
        await updateDoc(docRef, courseData);
        return courseId;
      } else {
        const payload = {
          ...courseData,
          createdAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, pathString), payload);
        return docRef.id;
      }
    } catch (err) {
      return handleFirestoreError(err, courseId ? OperationType.UPDATE : OperationType.CREATE, courseId ? `${pathString}/${courseId}` : pathString);
    }
  },

  async deleteCourse(courseId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "courses", courseId));
    } catch (err) {
      return handleFirestoreError(err, OperationType.DELETE, `courses/${courseId}`);
    }
  },

  async seedCourses(defaultCourses: any[]): Promise<void> {
    try {
      for (const item of defaultCourses) {
        await addDoc(collection(db, "courses"), {
          ...item,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      return handleFirestoreError(err, OperationType.CREATE, "courses/seed");
    }
  }
};
