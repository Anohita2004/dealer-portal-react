/**
 * Campaign Targeting Utilities
 * Explains why users see campaigns based on backend target audience intelligence
 * Clarifies performance calculations and campaign lifecycle
 */

/**
 * Explain why a user sees a campaign
 * @param {object} campaign - Campaign object from backend
 * @param {object} user - Current user object (with role, dealerId, regionId, etc.)
 * @returns {object} { reason, explanation, isTargeted }
 */
export const explainCampaignVisibility = (campaign, user) => {
  if (!campaign || !user) {
    return {
      reason: "Unknown",
      explanation: "Unable to determine campaign visibility",
      isTargeted: false,
    };
  }

  const targetAudience = campaign.targetAudience || [];
  const userRole = (user.role || user.roleName || "").toLowerCase();
  const userDealerId = user.dealerId || user.dealer?.id;
  const userRegionId = user.regionId || user.region?.id;
  const userTerritoryId = user.territoryId || user.territory?.id;
  const userAreaId = user.areaId || user.area?.id;

  // Check if campaign targets "all"
  const targetsAll = targetAudience.some((target) => target.type === "all" || !target.type);

  if (targetsAll) {
    return {
      reason: "All Dealers",
      explanation: "This campaign is available to all dealers in the system",
      isTargeted: true,
      targetingType: "all",
    };
  }

  // Check specific targeting
  const targetedRegions = targetAudience.filter((t) => t.type === "region").map((t) => t.entityId);
  const targetedTerritories = targetAudience.filter((t) => t.type === "territory").map((t) => t.entityId);
  const targetedAreas = targetAudience.filter((t) => t.type === "area").map((t) => t.entityId);
  const targetedDealers = targetAudience.filter((t) => t.type === "dealer").map((t) => t.entityId);
  const targetedTeams = targetAudience.filter((t) => t.type === "team").map((t) => t.entityId);

  // For dealers: check if their dealer is targeted
  if (userRole.includes("dealer") && userDealerId) {
    if (targetedDealers.includes(userDealerId)) {
      return {
        reason: "Direct Targeting",
        explanation: `This campaign specifically targets your dealer (${user.dealer?.businessName || userDealerId})`,
        isTargeted: true,
        targetingType: "dealer",
      };
    }

    // Check if dealer's region/territory is targeted
    if (userRegionId && targetedRegions.includes(userRegionId)) {
      return {
        reason: "Region Targeting",
        explanation: `This campaign targets your region (${user.region?.name || userRegionId})`,
        isTargeted: true,
        targetingType: "region",
      };
    }

    if (userTerritoryId && targetedTerritories.includes(userTerritoryId)) {
      return {
        reason: "Territory Targeting",
        explanation: `This campaign targets your territory (${user.territory?.name || userTerritoryId})`,
        isTargeted: true,
        targetingType: "territory",
      };
    }

    if (userAreaId && targetedAreas.includes(userAreaId)) {
      return {
        reason: "Area Targeting",
        explanation: `This campaign targets your area (${user.area?.name || userAreaId})`,
        isTargeted: true,
        targetingType: "area",
      };
    }
  }

  // For managers: check if their scope is targeted
  if (userRole.includes("manager") || userRole.includes("admin")) {
    if (userRegionId && targetedRegions.includes(userRegionId)) {
      return {
        reason: "Region Scope",
        explanation: `This campaign targets your region (${user.region?.name || userRegionId})`,
        isTargeted: true,
        targetingType: "region",
      };
    }

    if (userTerritoryId && targetedTerritories.includes(userTerritoryId)) {
      return {
        reason: "Territory Scope",
        explanation: `This campaign targets your territory (${user.territory?.name || userTerritoryId})`,
        isTargeted: true,
        targetingType: "territory",
      };
    }

    if (userAreaId && targetedAreas.includes(userAreaId)) {
      return {
        reason: "Area Scope",
        explanation: `This campaign targets your area (${user.area?.name || userAreaId})`,
        isTargeted: true,
        targetingType: "area",
      };
    }
  }

  // Not targeted
  return {
    reason: "Not Targeted",
    explanation: "This campaign does not target your dealer, region, territory, or area",
    isTargeted: false,
    targetingType: null,
  };
};

/**
 * Get campaign lifecycle state
 * @param {object} campaign - Campaign object
 * @returns {object} { state, label, color, description, daysRemaining, daysElapsed }
 */
export const getCampaignLifecycleState = (campaign) => {
  if (!campaign) {
    return {
      state: "unknown",
      label: "Unknown",
      color: "default",
      description: "Campaign state unknown",
    };
  }

  const now = new Date();
  const startDate = new Date(campaign.startDate);
  const endDate = new Date(campaign.endDate);
  const isActive = campaign.isActive !== false; // Default to true if not specified
  const approvalStatus = (campaign.approvalStatus || "").toLowerCase();

  // Check approval status first
  if (approvalStatus === "rejected") {
    return {
      state: "rejected",
      label: "Rejected",
      color: "error",
      description: "Campaign has been rejected and will not run",
    };
  }

  if (approvalStatus === "pending") {
    return {
      state: "pending_approval",
      label: "Pending Approval",
      color: "warning",
      description: "Campaign is awaiting approval before it can start",
      approvalStage: campaign.approvalStage || campaign.currentStage,
    };
  }

  // Check if campaign is active
  if (!isActive) {
    return {
      state: "inactive",
      label: "Inactive",
      color: "default",
      description: "Campaign is currently inactive",
    };
  }

  // Check lifecycle based on dates
  if (now < startDate) {
    const daysRemaining = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
    return {
      state: "upcoming",
      label: "Upcoming",
      color: "info",
      description: `Campaign will start in ${daysRemaining} day(s)`,
      daysRemaining,
    };
  }

  if (now > endDate) {
    const daysElapsed = Math.floor((now - endDate) / (1000 * 60 * 60 * 24));
    return {
      state: "ended",
      label: "Ended",
      color: "default",
      description: `Campaign ended ${daysElapsed} day(s) ago`,
      daysElapsed,
    };
  }

  // Campaign is active
  const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
  return {
    state: "active",
    label: "Active",
    color: "success",
    description: `Campaign is currently running (${daysRemaining} day(s) remaining)`,
    daysRemaining,
  };
};

/**
 * Explain performance calculations
 * @param {object} analytics - Analytics object from backend
 * @returns {object} { participationExplanation, revenueExplanation, calculations }
 */
export const explainPerformanceCalculations = (analytics) => {
  if (!analytics) {
    return {
      participationExplanation: "No participation data available",
      revenueExplanation: "No revenue data available",
      calculations: [],
    };
  }

  const participation = analytics.participation || {};
  const revenue = analytics.revenue || {};

  const totalTargeted = participation.totalTargeted || 0;
  const participated = participation.participated || 0;
  const participationRate = participation.participationRate || 0;

  const totalRevenue = revenue.total || 0;
  const attributedRevenue = revenue.attributed || 0;

  // Participation calculation explanation
  const participationExplanation = totalTargeted > 0
    ? `Participation Rate = (${participated} participated / ${totalTargeted} targeted) × 100 = ${participationRate}%`
    : "No targeted dealers to calculate participation rate";

  // Revenue calculation explanation
  const revenueExplanation = totalRevenue > 0
    ? `Attributed Revenue = ₹${attributedRevenue.toLocaleString()} out of ₹${totalRevenue.toLocaleString()} total revenue (${totalRevenue > 0 ? ((attributedRevenue / totalRevenue) * 100).toFixed(1) : 0}% attribution rate)`
    : "No revenue data available";

  const calculations = [
    {
      metric: "Participation Rate",
      formula: "(Participated Dealers / Total Targeted Dealers) × 100",
      value: `${participationRate}%`,
      breakdown: `${participated} / ${totalTargeted} × 100`,
    },
    {
      metric: "Attribution Rate",
      formula: "(Attributed Revenue / Total Revenue) × 100",
      value: totalRevenue > 0 ? `${((attributedRevenue / totalRevenue) * 100).toFixed(1)}%` : "N/A",
      breakdown: totalRevenue > 0 ? `₹${attributedRevenue.toLocaleString()} / ₹${totalRevenue.toLocaleString()} × 100` : "N/A",
    },
  ];

  return {
    participationExplanation,
    revenueExplanation,
    calculations,
  };
};

/**
 * Format target audience for display
 * @param {array} targetAudience - Target audience array
 * @param {object} options - Options for formatting
 * @returns {string} Formatted target audience string
 */
export const formatTargetAudience = (targetAudience, options = {}) => {
  if (!targetAudience || !Array.isArray(targetAudience) || targetAudience.length === 0) {
    return options.default || "All Dealers";
  }

  const hasAll = targetAudience.some((t) => t.type === "all" || !t.type);
  if (hasAll) return "All Dealers";

  const typeLabels = {
    region: "Region",
    territory: "Territory",
    area: "Area",
    dealer: "Dealer",
    team: "Team",
    staff: "Staff",
  };

  const formatted = targetAudience
    .filter((t) => t.type && t.type !== "all")
    .map((t) => {
      const label = typeLabels[t.type] || t.type;
      if (t.entityName) {
        return `${label}: ${t.entityName}`;
      }
      return label;
    })
    .join(", ");

  return formatted || options.default || "Specific Targets";
};

