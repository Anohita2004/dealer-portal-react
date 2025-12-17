/**
 * Map Scope Utilities
 * Explains role-based visibility, geo-scoping, and why data is hidden
 * Based on backend geo-scoping intelligence
 */

/**
 * Get explicit scope explanation for map view
 * @param {object} user - Current user object
 * @param {object} stats - Map statistics (dealerCount, regionCount, etc.)
 * @returns {object} { scope, explanation, hiddenData, scopeType }
 */
export const getMapScopeExplanation = (user, stats = {}) => {
  if (!user) {
    return {
      scope: "Unknown",
      explanation: "Unable to determine map scope",
      hiddenData: [],
      scopeType: "unknown",
    };
  }

  const userRole = (user.role || user.roleName || "").toLowerCase();
  const dealerCount = stats.dealerCount || 0;
  const regionCount = stats.regionCount || 0;
  const territoryCount = stats.territoryCount || 0;

  // Super Admin - sees everything
  if (userRole === "super_admin" || userRole === "superadmin") {
    return {
      scope: "All Regions (Global View)",
      explanation: "You have access to view all regions, territories, and dealers across the entire system",
      hiddenData: [],
      scopeType: "global",
      regionName: null,
      territoryName: null,
      areaName: null,
    };
  }

  // Regional Admin - sees only their region
  if (userRole.includes("regional_admin") || userRole.includes("regionaladmin")) {
    const regionName = user.region?.name || user.regionName || "your region";
    return {
      scope: `Region: ${regionName}`,
      explanation: `You can only view dealers, territories, and data within ${regionName}. Data from other regions is not visible due to your role permissions.`,
      hiddenData: [
        "Dealers from other regions",
        "Territories outside your region",
        "Sales data from other regions",
      ],
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
      explanation: `You can only view dealers and data within ${areaName} (part of ${regionName}). Dealers and territories outside your area are not visible due to your role permissions.`,
      hiddenData: [
        "Dealers from other areas",
        "Territories outside your area",
        "Sales data from other areas",
      ],
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
      explanation: `You can only view dealers and data within ${territoryName} (part of ${areaName}). Dealers and territories outside your territory are not visible due to your role permissions.`,
      hiddenData: [
        "Dealers from other territories",
        "Territories outside your territory",
        "Sales data from other territories",
      ],
      scopeType: "territory",
      territoryName: territoryName,
      territoryId: user.territoryId,
      areaName: areaName,
    };
  }

  // Dealer Admin - sees only their own location
  if (userRole.includes("dealer_admin") || userRole.includes("dealeradmin")) {
    const dealerName = user.dealer?.businessName || user.dealerName || "your dealer";
    return {
      scope: `Dealer: ${dealerName}`,
      explanation: `You can only view your own dealer location. Other dealers and territories are not visible due to your role permissions.`,
      hiddenData: [
        "Other dealers",
        "Territory boundaries",
        "Region boundaries",
        "Sales data from other dealers",
      ],
      scopeType: "dealer",
      dealerName: dealerName,
      dealerId: user.dealerId,
    };
  }

  // Default fallback
  return {
    scope: "Limited Scope",
    explanation: "Your role has limited visibility. Some data may be hidden based on your permissions.",
    hiddenData: ["Data outside your scope"],
    scopeType: "limited",
  };
};

/**
 * Get heatmap legend configuration
 * @param {string} granularity - Heatmap granularity (dealer, territory, region)
 * @returns {object} { gradient, labels, description }
 */
export const getHeatmapLegend = (granularity = "dealer") => {
  const granularityLabels = {
    dealer: "Dealer-level sales density",
    territory: "Territory-level sales density",
    region: "Region-level sales density",
  };

  return {
    gradient: {
      0.0: "blue",
      0.2: "cyan",
      0.4: "lime",
      0.6: "yellow",
      0.8: "orange",
      1.0: "red",
    },
    labels: [
      { color: "blue", value: "Low", description: "Low sales density" },
      { color: "cyan", value: "Low-Medium", description: "Low to medium sales density" },
      { color: "lime", value: "Medium", description: "Medium sales density" },
      { color: "yellow", value: "Medium-High", description: "Medium to high sales density" },
      { color: "orange", value: "High", description: "High sales density" },
      { color: "red", value: "Very High", description: "Very high sales density" },
    ],
    description: granularityLabels[granularity] || "Sales density heatmap",
    granularity: granularity,
  };
};

/**
 * Validate and explain backend query parameters
 * @param {object} params - Query parameters being sent to backend
 * @param {object} user - Current user object
 * @returns {object} { validParams, explanation, warnings }
 */
export const explainBackendQueryParams = (params, user) => {
  const validParams = {};
  const warnings = [];
  const explanations = [];

  // Date range - always valid
  if (params.start || params.startDate) {
    validParams.start = params.start || params.startDate;
    explanations.push(`Date range: ${validParams.start} to ${params.end || params.endDate || "today"}`);
  }
  if (params.end || params.endDate) {
    validParams.end = params.end || params.endDate;
  }

  // Granularity - always valid
  if (params.granularity) {
    validParams.granularity = params.granularity;
    explanations.push(`Heatmap granularity: ${params.granularity}`);
  }

  // Region ID - only valid for super_admin or if user's region
  if (params.regionId) {
    if (user?.role === "super_admin" || user?.regionId === params.regionId) {
      validParams.regionId = params.regionId;
      explanations.push(`Region filter: ${params.regionId}`);
    } else {
      warnings.push(`Region filter ignored: You don't have permission to view this region`);
    }
  }

  // Territory ID - only valid for super_admin, regional_admin, or if user's territory
  if (params.territoryId) {
    const canViewTerritory = 
      user?.role === "super_admin" ||
      user?.role?.includes("regional_admin") ||
      user?.territoryId === params.territoryId;
    
    if (canViewTerritory) {
      validParams.territoryId = params.territoryId;
      explanations.push(`Territory filter: ${params.territoryId}`);
    } else {
      warnings.push(`Territory filter ignored: You don't have permission to view this territory`);
    }
  }

  // Area ID - only valid for super_admin, regional_admin, or if user's area
  if (params.areaId) {
    const canViewArea = 
      user?.role === "super_admin" ||
      user?.role?.includes("regional_admin") ||
      user?.areaId === params.areaId;
    
    if (canViewArea) {
      validParams.areaId = params.areaId;
      explanations.push(`Area filter: ${params.areaId}`);
    } else {
      warnings.push(`Area filter ignored: You don't have permission to view this area`);
    }
  }

  return {
    validParams,
    explanation: explanations.join("; "),
    warnings,
  };
};

