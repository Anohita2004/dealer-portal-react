import { useEffect, useState } from "react";
import { materialAPI } from "../services/api";

/**
 * Load materials and mappings for a specific dealer.
 * Backend is expected to scope materials to dealer.
 */
export const useDealerMaterials = (dealerId) => {
  const [materials, setMaterials] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!dealerId) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await materialAPI.getDealerMaterials(dealerId);
        const mats = res?.materials || res?.data?.materials || res?.data || res?.materials || [];
        const map = res?.mappings || res?.data?.mappings || [];
        setMaterials(Array.isArray(mats) ? mats : []);
        setMappings(Array.isArray(map) ? map : []);
      } catch (err) {
        console.error("Failed to load dealer materials:", err);
        setError(err?.response?.data?.error || "Failed to load materials");
        setMaterials([]);
        setMappings([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [dealerId]);

  return { materials, mappings, loading, error };
};

export default useDealerMaterials;


