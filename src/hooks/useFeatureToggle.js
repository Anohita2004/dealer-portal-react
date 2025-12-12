import { useState, useEffect } from "react";
import { featureToggleAPI } from "../services/api";

/**
 * Hook to check if a feature toggle is enabled
 * @param {string} key - Feature toggle key (e.g., 'pricing_approvals')
 * @param {boolean} defaultValue - Default value if toggle not found
 * @returns {boolean} - Whether the feature is enabled
 */
export const useFeatureToggle = (key, defaultValue = true) => {
  const [enabled, setEnabled] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkToggle = async () => {
      try {
        const toggle = await featureToggleAPI.getFeatureToggle(key);
        setEnabled(toggle?.isEnabled ?? defaultValue);
      } catch (error) {
        console.warn(`Feature toggle '${key}' not found, using default:`, defaultValue);
        setEnabled(defaultValue);
      } finally {
        setLoading(false);
      }
    };

    if (key) {
      checkToggle();
    } else {
      setLoading(false);
    }
  }, [key, defaultValue]);

  return { enabled, loading };
};

/**
 * Component wrapper that conditionally renders children based on feature toggle
 */
export const FeatureToggle = ({ featureKey, defaultValue = true, children, fallback = null }) => {
  const { enabled, loading } = useFeatureToggle(featureKey, defaultValue);

  if (loading) {
    return null; // or a loading spinner
  }

  return enabled ? children : fallback;
};

export default useFeatureToggle;

