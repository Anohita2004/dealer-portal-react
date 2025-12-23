// src/utils/authUtils.js
// Helpers for working with user roles, including new sales_executive role

/**
 * Safely derive the canonical role name from the user object.
 * Prefer RBAC-style roleDetails.name when present.
 */
export const getRoleName = (user) => {
  if (!user) return undefined;
  const rbacName = user.roleDetails?.name;
  const legacy = user.role;
  return (rbacName || legacy || "").toLowerCase();
};

/**
 * Convenience helper to check if user is a Sales Executive.
 */
export const isSalesExecutive = (user) => getRoleName(user) === "sales_executive";


