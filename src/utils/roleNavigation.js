/**
 * Role-Based Navigation System
 * Maps user roles to their default landing pages
 */

export const ROLE_LANDING_PAGES = {
  super_admin: "/dashboard/super",
  technical_admin: "/technical-admin",
  regional_admin: "/dashboard/regional",
  // Regional Manager has a dedicated insight-focused dashboard
  regional_manager: "/dashboard/regional-manager",
  // Territory / Area managers continue to use the generic manager dashboard
  area_manager: "/dashboard/manager",
  territory_manager: "/dashboard/manager",
  dealer_admin: "/dashboard/dealer",
  dealer_staff: "/dashboard/dealer", // or "/dealer/my-dashboard" if you have a separate staff dashboard
  finance_admin: "/dashboard/accounts",
  inventory_user: "/inventory",
  accounts_user: "/accounts",
};

/**
 * Get the landing page for a user role
 * @param {string} role - User role
 * @returns {string} Landing page path
 */
export const getLandingPageForRole = (role) => {
  return ROLE_LANDING_PAGES[role] || "/dashboard";
};

/**
 * Check if a role has access to a route
 * @param {string} userRole - User's role
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {boolean}
 */
export const hasRoleAccess = (userRole, allowedRoles = []) => {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!userRole) return false;
  // Normalize role to lowercase for comparison
  const normalizedUserRole = userRole.toLowerCase().trim();
  return allowedRoles.some(role => role.toLowerCase().trim() === normalizedUserRole);
};

/**
 * Get all roles that can access a specific route
 * Useful for building navigation menus
 */
export const ROUTE_ROLES = {
  "/dashboard/super": ["super_admin"],
  "/technical-admin": ["technical_admin"],
  "/dashboard/regional": ["regional_admin"],
  "/dashboard/manager": ["regional_manager", "area_manager", "territory_manager"],
  "/dashboard/dealer": ["dealer_admin", "dealer_staff"],
  "/dashboard/accounts": ["finance_admin", "accounts_user"],
  "/inventory": ["inventory_user", "super_admin", "technical_admin"],
  "/accounts": ["accounts_user", "finance_admin"],
  "/superadmin": ["super_admin"],
  "/regional": ["regional_admin"],
  "/approvals": [
    "territory_manager",
    "area_manager",
    "regional_manager",
    "regional_admin",
    "super_admin",
  ],
  "/dealers": [
    "territory_manager",
    "area_manager",
    "regional_manager",
    "regional_admin",
    "super_admin",
  ],
  "/orders/create": ["dealer_staff", "dealer_admin"],
  "/orders/my": ["dealer_staff", "dealer_admin"],
  "/payments/create": ["dealer_staff", "dealer_admin"],
  "/payments/my": ["dealer_staff", "dealer_admin"],
  "/staff": ["dealer_admin"],
  "/campaigns": [
    "super_admin",
    "key_user",
    "dealer_admin",
    "regional_admin",
    "area_manager",
    "territory_manager",
  ],
  "/sales/my-dealers": ["sales_executive"],
  "/sales/orders/new": ["sales_executive"],
  "/sales/payments/new": ["sales_executive"],
};

/**
 * Check if a user can access a route
 * @param {string} userRole - User's role
 * @param {string} route - Route path
 * @returns {boolean}
 */
export const canAccessRoute = (userRole, route) => {
  const allowedRoles = ROUTE_ROLES[route];
  if (!allowedRoles) return true; // Route not restricted
  return allowedRoles.includes(userRole);
};

