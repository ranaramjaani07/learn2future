import { useState, useCallback } from "react";
import { blogsService } from "../../services/admin/blogs.service";

export function useBlogs() {
  const [blogsList, setBlogsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await blogsService.getBlogs();
      setBlogsList(data);
    } catch (err) {
      console.error("Fetch blogs error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { blogsList, loading, fetchBlogs, setBlogsList };
}
