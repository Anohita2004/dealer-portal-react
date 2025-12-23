import { useEffect, useState } from "react";
import { dealerAPI } from "../services/api";

/**
 * Load dealers scoped to the current user.
 * For sales_executive this should return only assigned dealers (backend scoped).
 */
export const useMyDealers = () => {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await dealerAPI.getDealers({ page: 1, limit: 100 });
        const list = Array.isArray(res?.dealers) ? res.dealers : Array.isArray(res) ? res : res?.data || [];
        setDealers(list);
      } catch (err) {
        console.error("Failed to load dealers for sales executive:", err);
        setError(err?.response?.data?.error || "Failed to load dealers");
        setDealers([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { dealers, loading, error };
};

export default useMyDealers;


