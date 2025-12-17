/**
 * Accounts User Permissions Utility
 * 
 * Explains what accounts users can and cannot do, and why actions are disabled.
 * Aligns UI with backend permission enforcement.
 */

/**
 * Check if user is an accounts/finance user
 */
export function isAccountsUser(user) {
  if (!user || !user.role) return false;
  return user.role === "accounts_user" || user.role === "finance_admin";
}

/**
 * Check if user can perform a specific action
 */
export function canAccountsUserPerform(user, action) {
  if (!isAccountsUser(user)) return true; // Not an accounts user, check other permissions

  // Accounts users CAN:
  const allowedActions = [
    "view_payments",
    "approve_payments",
    "reject_payments",
    "view_invoices",
    "view_reports",
    "export_reports",
    "view_audit_trails",
    "view_dashboards",
    "verify_documents",
    "view_reconciliation",
  ];

  // Accounts users CANNOT:
  const disallowedActions = [
    "create_orders",
    "edit_orders",
    "create_invoices",
    "edit_invoices",
    "create_pricing",
    "edit_pricing",
    "create_campaigns",
    "edit_campaigns",
    "manage_inventory",
    "manage_users",
    "manage_roles",
    "override_workflow",
  ];

  if (allowedActions.includes(action)) return true;
  if (disallowedActions.includes(action)) return false;

  // Default: allow view-only actions, disallow create/edit
  return action.startsWith("view_") || action.startsWith("export_");
}

/**
 * Get explanation for why an action is disabled for accounts users
 */
export function getDisabledActionExplanation(user, action) {
  if (!isAccountsUser(user)) return null;

  const explanations = {
    create_orders: "Accounts users cannot create orders. This is a dealer responsibility.",
    edit_orders: "Accounts users cannot modify orders. Orders are read-only for finance review.",
    create_invoices: "Accounts users cannot create invoices. Invoices are system-generated from orders.",
    edit_invoices: "Accounts users cannot modify invoices. Invoices are read-only for verification and audit.",
    create_pricing: "Accounts users cannot create pricing requests. This is a dealer/manager responsibility.",
    edit_pricing: "Accounts users cannot modify pricing requests. Pricing is read-only for finance review.",
    create_campaigns: "Accounts users cannot create campaigns. This is a marketing/sales responsibility.",
    edit_campaigns: "Accounts users cannot modify campaigns. Campaigns are read-only for finance review.",
    manage_inventory: "Accounts users cannot modify inventory. Inventory management is restricted to operations.",
    manage_users: "Accounts users cannot manage users. User management is restricted to administrators.",
    manage_roles: "Accounts users cannot manage roles. Role management is restricted to administrators.",
    override_workflow: "Accounts users cannot override workflow rules. Workflow rules are enforced by the system.",
  };

  return explanations[action] || "This action is not permitted for accounts users.";
}

/**
 * Get accounts user scope explanation
 */
export function getAccountsUserScopeExplanation(user) {
  if (!isAccountsUser(user)) return null;

  return {
    title: "Accounts User Scope",
    description: "As an accounts user, you have access to all financial data within your scope. The backend automatically filters data based on your role permissions.",
    capabilities: [
      "View all payment requests in scope",
      "Approve or reject payments with mandatory remarks",
      "View invoices in read-only mode",
      "Access finance-focused dashboards",
      "Generate and export financial reports",
      "View full audit trails for financial transactions",
    ],
    restrictions: [
      "Cannot create or edit orders, invoices, pricing, or campaigns",
      "Cannot modify inventory",
      "Cannot manage users or roles",
      "Cannot override workflow rules",
    ],
  };
}

/**
 * Check if a page/feature should be read-only for accounts users
 */
export function isReadOnlyForAccounts(user, feature) {
  if (!isAccountsUser(user)) return false;

  const readOnlyFeatures = [
    "invoices",
    "orders",
    "pricing",
    "campaigns",
    "inventory",
    "users",
    "roles",
  ];

  return readOnlyFeatures.includes(feature);
}

