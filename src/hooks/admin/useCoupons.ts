import { useState, useCallback } from "react";
import { couponsService } from "../../services/admin/coupons.service";

export function useCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await couponsService.getCoupons();
      setCoupons(data);
    } catch (err) {
      console.error("Fetch coupons error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { coupons, loading, fetchCoupons, setCoupons };
}
