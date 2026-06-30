import { useState, useCallback } from "react";
import { coursesService } from "../../services/admin/courses.service";
import { Course } from "../../types";

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await coursesService.getCourses();
      setCourses(data);
    } catch (err) {
      console.error("Fetch courses error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { courses, loading, fetchCourses, setCourses };
}
