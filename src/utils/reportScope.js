/**
 * Report Scope Utilities
 * Explains role-based report scoping, applied filters, and export clarity
 * Based on backend report scoping intelligence
 */

/**
 * Get report scope explanation based on user role
 * @param {object} user - Current user object
 * @returns {object} { scope, explanation, scopeType }
 */
export const getReportScopeExplanation = (user) => {
  if (!user) {
    return {
      scope: "Unknown",
      explanation: "Unable to determine report scope",
      scopeType: "unknown",
    };
  }

  const userRole = (user.role || user.roleName || "").toLowerCase();

  // Super Admin - sees everything
  if (userRole === "super_admin" || userRole === "superadmin") {
    return {
      scope: "All Data (Global)",
      explanation: "You have access to view all reports across all regions, territories, and dealers",
      scopeType: "global",
    };
  }

  // Regional Admin - sees only their region
  if (userRole.includes("regional_admin") || userRole.includes("regionaladmin")) {
    const regionName = user.region?.name || user.regionName || "your region";
    return {
      scope: `Region: ${regionName}`,
      explanation: `Reports are automatically scoped to ${regionName}. Data from other regions is not included.`,
      scopeType: "region",
      regionName: regionName,
      regionId: user.regionId,
    };
  }

  // Area Manager - sees only their area
  if (userRole.includes("area_manager") || userRole.includes("areamanager")) {
    const areaName = user.area?.name || user.areaName || "your area";
    const regionName = user.region?.name || user.regionName || "your region";
    return {
      scope: `Area: ${areaName}`,
      explanation: `Reports are automatically scoped to ${areaName} (part of ${regionName}). Data from other areas is not included.`,
      scopeType: "area",
      areaName: areaName,
      areaId: user.areaId,
      regionName: regionName,
    };
  }

  // Territory Manager - sees only their territory
  if (userRole.includes("territory_manager") || userRole.includes("territorymanager")) {
    const territoryName = user.territory?.name || user.territoryName || "your territory";
    const areaName = user.area?.name || user.areaName || "your area";
    return {
      scope: `Territory: ${territoryName}`,
      explanation: `Reports are automatically scoped to ${territoryName} (part of ${areaName}). Data from other territories is not included.`,
      scopeType: "territory",
      territoryName: territoryName,
      territoryId: user.territoryId,
      areaName: areaName,
    };
  }

  // Dealer Admin - sees only their dealer
  if (userRole.includes("dealer_admin") || userRole.includes("dealeradmin")) {
    const dealerName = user.dealer?.businessName || user.dealerName || "your dealer";
    return {
      scope: `Dealer: ${dealerName}`,
      explanation: `Reports are automatically scoped to ${dealerName}. Data from other dealers is not included.`,
      scopeType: "dealer",
      dealerName: dealerName,
      dealerId: user.dealerId,
    };
  }

  // Dealer Staff - sees only their own data
  if (userRole.includes("dealer_staff") || userRole.includes("dealerstaff")) {
    return {
      scope: "Personal Data",
      explanation: "Reports are automatically scoped to your personal data only. Other dealer data is not included.",
      scopeType: "personal",
    };
  }

  // Default fallback
  return {
    scope: "Limited Scope",
    explanation: "Reports are automatically scoped based on your role permissions.",
    scopeType: "limited",
  };
};

/**
 * Format applied filters for display
 * @param {object} filters - Applied filters object
 * @param {object} options - Options for formatting
 * @returns {array} Array of filter display objects
 */
export const formatAppliedFilters = (filters, options = {}) => {
  if (!filters) return [];

  const formatted = [];
  const { showEmpty = false, includeDates = true } = options;

  // Date range filters
  if (includeDates) {
    if (filters.startDate) {
      formatted.push({
        label: "Start Date",
        value: new Date(filters.startDate).toLocaleDateString(),
        key: "startDate",
      });
    }
    if (filters.endDate) {
      formatted.push({
        label: "End Date",
        value: new Date(filters.endDate).toLocaleDateString(),
        key: "endDate",
      });
    }
  }

  // Region filter
  if (filters.region || filters.regionId) {
    formatted.push({
      label: "Region",
      value: filters.regionName || filters.region || filters.regionId,
      key: "region",
    });
  }

  // Territory filter
  if (filters.territory || filters.territoryId) {
    formatted.push({
      label: "Territory",
      value: filters.territoryName || filters.territory || filters.territoryId,
      key: "territory",
    });
  }

  // Area filter
  if (filters.area || filters.areaId) {
    formatted.push({
      label: "Area",
      value: filters.areaName || filters.area || filters.areaId,
      key: "area",
    });
  }

  // Dealer filter
  if (filters.dealerId || filters.dealer) {
    formatted.push({
      label: "Dealer",
      value: filters.dealerName || filters.dealer || filters.dealerId,
      key: "dealer",
    });
  }

  // Status filter
  if (filters.status) {
    formatted.push({
      label: "Status",
      value: filters.status,
      key: "status",
    });
  }

  return formatted;
};

/**
 * Get data freshness indicator
 * @param {object} data - Report data object
 * @param {string} fetchedAt - ISO timestamp when data was fetched
 * @returns {object} { freshness, label, color, description }
 */
export const getDataFreshness = (data, fetchedAt) => {
  if (!fetchedAt) {
    return {
      freshness: "unknown",
      label: "Unknown",
      color: "default",
      description: "Data freshness unknown",
    };
  }

  const now = new Date();
  const fetched = new Date(fetchedAt);
  const diffMs = now - fetched;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 5) {
    return {
      freshness: "fresh",
      label: "Just Now",
      color: "success",
      description: `Data fetched ${diffMinutes} minute(s) ago`,
      age: diffMinutes,
      unit: "minutes",
    };
  }

  if (diffMinutes < 60) {
    return {
      freshness: "recent",
      label: "Recent",
      color: "success",
      description: `Data fetched ${diffMinutes} minute(s) ago`,
      age: diffMinutes,
      unit: "minutes",
    };
  }

  if (diffHours < 24) {
    return {
      freshness: "stale",
      label: "Stale",
      color: "warning",
      description: `Data fetched ${diffHours} hour(s) ago. Consider refreshing.`,
      age: diffHours,
      unit: "hours",
    };
  }

  return {
    freshness: "outdated",
    label: "Outdated",
    color: "error",
    description: `Data fetched ${diffDays} day(s) ago. Please refresh for current data.`,
    age: diffDays,
    unit: "days",
  };
};

/**
 * Get export clarity description
 * @param {string} reportType - Report type identifier
 * @param {object} filters - Applied filters
 * @param {object} scope - Report scope explanation
 * @param {string} format - Export format (pdf, excel, csv)
 * @returns {object} { description, includes, excludes }
 */
export const getExportClarity = (reportType, filters, scope, format = "excel") => {
  const reportLabels = {
    "dealer-performance": "Dealer Performance Report",
    "account-statement": "Account Statement",
    "invoice-register": "Invoice Register",
    "credit-debit-notes": "Credit/Debit Notes",
    "outstanding-receivables": "Outstanding Receivables",
    "regional-sales-summary": "Regional Sales Summary",
    "territory": "Territory Summary",
    "pending-approvals": "Pending Approvals",
    "admin-summary": "Admin Summary",
  };

  const reportLabel = reportLabels[reportType] || reportType;

  const includes = [];
  const excludes = [];

  // Scope-based includes/excludes
  if (scope.scopeType === "global") {
    includes.push("All regions, territories, and dealers");
  } else if (scope.scopeType === "region") {
    includes.push(`Data from ${scope.regionName || "your region"}`);
    excludes.push("Data from other regions");
  } else if (scope.scopeType === "area") {
    includes.push(`Data from ${scope.areaName || "your area"}`);
    excludes.push("Data from other areas");
  } else if (scope.scopeType === "territory") {
    includes.push(`Data from ${scope.territoryName || "your territory"}`);
    excludes.push("Data from other territories");
  } else if (scope.scopeType === "dealer") {
    includes.push(`Data for ${scope.dealerName || "your dealer"}`);
    excludes.push("Data from other dealers");
  } else if (scope.scopeType === "personal") {
    includes.push("Your personal data only");
    excludes.push("Other users' data");
  }

  // Filter-based includes
  const appliedFilters = formatAppliedFilters(filters);
  if (appliedFilters.length > 0) {
    includes.push(`Applied filters: ${appliedFilters.map(f => `${f.label}: ${f.value}`).join(", ")}`);
  }

  const formatLabels = {
    pdf: "PDF document",
    excel: "Excel spreadsheet (.xlsx)",
    csv: "CSV file (.csv)",
  };

  const description = `${reportLabel} exported as ${formatLabels[format] || format}. The export includes all data visible in the current report view, scoped to your role permissions and applied filters.`;

  return {
    description,
    includes,
    excludes,
    format: formatLabels[format] || format,
    reportLabel,
  };
};

