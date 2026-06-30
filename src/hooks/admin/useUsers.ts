import { useState, useCallback } from "react";
import { usersService } from "../../services/admin/users.service";

export function useUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await usersService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { users, loading, fetchUsers, setUsers };
}
