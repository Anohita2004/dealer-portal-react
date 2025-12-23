import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  FormHelperText,
  Autocomplete,
} from "@mui/material";
import {
  User,
  Mail,
  Lock,
  Shield,
  MapPin,
  Users,
  Building2,
  ArrowLeft,
  Save,
  CheckCircle,
  Info,
} from "lucide-react";
import api, { geoAPI, dealerAPI, teamAPI, roleAPI, userAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

export default function UserFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  // Form state
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    roleId: "",
    regionId: "",
    areaId: "",
    territoryId: "",
    dealerId: "",
    managerId: "",
    salesGroupId: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Dropdown data
  const [roles, setRoles] = useState([]);
  const [regions, setRegions] = useState([]);
  const [areas, setAreas] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [salesTeams, setSalesTeams] = useState([]);

  // Role hierarchy mapping
  const roleHierarchy = {
    sales_executive: {
      requires: [], // Geographic assignment is optional but recommended for hierarchy visibility
      canHaveManager: ["territory_manager", "area_manager", "regional_manager", "regional_admin"],
      description:
        "Sales Executives work with assigned dealers and materials. They should be assigned to an Area/Territory Manager or Regional Manager/Admin for proper hierarchy placement. They can create orders and payment requests but cannot approve workflows or manage master data.",
    },
    dealer_staff: {
      requires: ["dealer"],
      canHaveManager: ["dealer_admin"],
      description: "Dealer Staff must be assigned to a dealer and can have a Dealer Admin as manager",
    },
    dealer_admin: {
      requires: ["dealer"],
      canHaveManager: ["territory_manager", "area_manager", "regional_manager"],
      description: "Dealer Admin must be assigned to a dealer and can have Territory/Area/Regional Manager as manager",
    },
    territory_manager: {
      requires: ["region", "area", "territory"],
      canHaveManager: ["area_manager", "regional_manager"],
      description: "Territory Manager must be assigned to a region, area, and territory",
    },
    area_manager: {
      requires: ["region", "area"],
      canHaveManager: ["regional_manager", "regional_admin"],
      description: "Area Manager must be assigned to a region and area",
    },
    regional_manager: {
      requires: ["region"],
      canHaveManager: ["regional_admin"],
      description: "Regional Manager must be assigned to a region",
    },
    regional_admin: {
      requires: ["region"],
      canHaveManager: [],
      description: "Regional Admin must be assigned to a region",
    },
    super_admin: {
      requires: [],
      canHaveManager: [],
      description: "Super Admin has no restrictions",
    },
    technical_admin: {
      requires: [],
      canHaveManager: [],
      description: "Technical Admin has no restrictions",
    },
  };

  // Load dropdowns
  useEffect(() => {
    loadDropdowns();
    if (isEdit) loadUser();
  }, [id]);

  // Load managers when role/dealer changes
  useEffect(() => {
    if (form.roleId) {
      loadManagers();
    }
  }, [form.roleId, form.dealerId, form.territoryId, form.areaId, form.regionId]);

  async function loadDropdowns() {
    try {
      const [r, rg, a, t, d, st] = await Promise.all([
        roleAPI.getRoles().catch(() => []),
        geoAPI.getRegions().catch(() => []),
        geoAPI.getAreas().catch(() => []),
        geoAPI.getTerritories().catch(() => []),
        // Use the same pattern as other dealer lists (no extra params)
        dealerAPI.getDealers().catch(() => []),
        teamAPI.getTeams().catch(() => []),
      ]);

      setRoles(Array.isArray(r) ? r : r?.roles || r?.data || []);
      setRegions(Array.isArray(rg) ? rg : rg?.regions || rg?.data || []);
      setAreas(Array.isArray(a) ? a : a?.areas || a?.data || []);
      setTerritories(Array.isArray(t) ? t : t?.territories || t?.data || []);
      setDealers(Array.isArray(d) ? d : d?.dealers || d?.data || []);
      setSalesTeams(Array.isArray(st) ? st : st?.teams || st?.data || []);
    } catch (err) {
      console.error("Failed to load dropdowns:", err);
    }
  }

  async function loadManagers() {
    try {
      const selectedRole = roles.find((r) => r.id === form.roleId);
      if (!selectedRole) return;

      const roleName = selectedRole.name?.toLowerCase().replace(/\s+/g, "_") || "";
      const hierarchy = roleHierarchy[roleName];

      if (!hierarchy || hierarchy.canHaveManager.length === 0) {
        setManagers([]);
        return;
      }

      // Get users with manager roles
      const managerRoles = hierarchy.canHaveManager;
      const allManagers = await Promise.all(
        managerRoles.map((role) =>
          userAPI.getUsers({ role }).catch(() => ({ users: [] }))
        )
      );

      const managersList = allManagers.flatMap((m) => m?.users || m?.data || []);

      // Filter managers based on hierarchy + role-specific rules
      const filtered = managersList.filter((manager) => {
        // For dealer_admin, we want Territory/Area/Regional managers that
        // cover the dealer's geographic scope, not dealerId.
        if (roleName === "dealer_admin") {
          const dealer = dealers.find((d) => d.id === form.dealerId);
          if (!dealer) return true; // no dealer selected yet – show all

          if (dealer.regionId && manager.regionId && dealer.regionId !== manager.regionId) return false;
          if (dealer.areaId && manager.areaId && dealer.areaId !== manager.areaId) return false;
          if (dealer.territoryId && manager.territoryId && dealer.territoryId !== manager.territoryId) return false;
          return true;
        }

        // Generic: match explicit scope fields from the form when present
        if (form.regionId && manager.regionId !== form.regionId) return false;
        if (form.areaId && manager.areaId !== form.areaId) return false;
        if (form.territoryId && manager.territoryId !== form.territoryId) return false;

        // For dealer_staff, manager must be a dealer_admin on the same dealer
        if (roleName === "dealer_staff" && form.dealerId) {
          if (!manager.dealerId || manager.dealerId !== form.dealerId) return false;
        }

        // For sales_executive, filter managers by geographic scope if provided
        if (roleName === "sales_executive") {
          // If sales executive has geographic scope, filter managers by that scope
          if (form.regionId && manager.regionId && form.regionId !== manager.regionId) return false;
          if (form.areaId && manager.areaId && form.areaId !== manager.areaId) return false;
          if (form.territoryId && manager.territoryId && form.territoryId !== manager.territoryId) return false;
          // If no geographic scope set, show all eligible managers (no filtering)
        }

        return true;
      });

      setManagers(filtered);
    } catch (err) {
      console.error("Failed to load managers:", err);
      setManagers([]);
    }
  }

  async function loadUser() {
    try {
      setLoading(true);
      const res = await userAPI.getUserById(id);
      const u = res.user || res;

      setForm({
        username: u.username || "",
        email: u.email || "",
        password: "",
        confirmPassword: "",
        roleId: u.roleId || "",
        regionId: u.regionId || "",
        areaId: u.areaId || "",
        territoryId: u.territoryId || "",
        dealerId: u.dealerId || "",
        managerId: u.managerId || "",
        salesGroupId: u.salesGroupId || u.teamId || "",
      });
    } catch (err) {
      console.error("Load user error:", err);
      toast.error("Failed to load user details");
    } finally {
      setLoading(false);
    }
  }

  // Get role hierarchy info
  const getRoleHierarchy = () => {
    const selectedRole = roles.find((r) => r.id === form.roleId);
    if (!selectedRole) return null;
    const roleName = selectedRole.name?.toLowerCase().replace(/\s+/g, "_") || "";
    return roleHierarchy[roleName] || roleHierarchy[selectedRole.name] || null;
  };

  const hierarchy = getRoleHierarchy();

  // Filtered dropdowns based on selections
  const filteredAreas = areas.filter(
    (a) => !form.regionId || a.regionId === form.regionId
  );

  const filteredTerritories = territories.filter(
    (t) => !form.areaId || t.areaId === form.areaId
  );

  const filteredDealers = dealers.filter((d) => {
    if (form.territoryId && d.territoryId !== form.territoryId) return false;
    if (form.areaId && d.areaId !== form.areaId) return false;
    if (form.regionId && d.regionId !== form.regionId) return false;
    return true;
  });

  // Validation
  const validate = () => {
    const newErrors = {};

    // Basic validations
    if (!form.username || form.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!isEdit) {
      if (!form.password || form.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
      if (form.password !== form.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    if (!form.roleId) {
      newErrors.roleId = "Please select a role";
    }

    // Hierarchy-based validations
    if (hierarchy) {
      if (hierarchy.requires.includes("region") && !form.regionId) {
        newErrors.regionId = "Region is required for this role";
      }
      if (hierarchy.requires.includes("area") && !form.areaId) {
        newErrors.areaId = "Area is required for this role";
      }
      if (hierarchy.requires.includes("territory") && !form.territoryId) {
        newErrors.territoryId = "Territory is required for this role";
      }
      if (hierarchy.requires.includes("dealer") && !form.dealerId) {
        newErrors.dealerId = "Dealer is required for this role";
      }
    }

    // Sales Executive must have a manager for hierarchy placement
    const roleName = selectedRole?.name?.toLowerCase().replace(/\s+/g, "_") || "";
    if (roleName === "sales_executive" && !form.managerId) {
      newErrors.managerId = "Manager is required for Sales Executive (needed for company hierarchy)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Field handler
  function updateField(name, value) {
    setForm((prev) => {
      const next = { ...prev, [name]: value };

      // Cascading clear logic
      if (name === "roleId") {
        next.regionId = "";
        next.areaId = "";
        next.territoryId = "";
        next.dealerId = "";
        next.managerId = "";
      }
      if (name === "regionId") {
        next.areaId = "";
        next.territoryId = "";
        next.dealerId = "";
        next.managerId = "";
      }
      if (name === "areaId") {
        next.territoryId = "";
        next.dealerId = "";
        next.managerId = "";
      }
      if (name === "territoryId") {
        next.dealerId = "";
        next.managerId = "";
      }
      if (name === "dealerId") {
        next.managerId = "";
      }

      // Clear errors for this field
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }

      return next;
    });
  }

  // Save user
  async function handleSave(e) {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        password: !isEdit ? form.password : undefined,
        roleId: form.roleId,
        regionId: form.regionId || null,
        areaId: form.areaId || null,
        territoryId: form.territoryId || null,
        dealerId: form.dealerId || null,
        managerId: form.managerId || null,
        salesGroupId: form.salesGroupId || null,
      };

      if (isEdit) {
        await userAPI.updateUser(id, payload);
        toast.success("User updated successfully");
      } else {
        await userAPI.createUser(payload);
        toast.success("User created successfully");
      }

      navigate("/superadmin/users");
    } catch (err) {
      console.error("Save error:", err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to save user";

      const lower = String(msg).toLowerCase();
      if (lower.includes("dealerid is required for dealer roles")) {
        setErrors((prev) => ({
          ...prev,
          dealerId: "Dealer is required for dealer roles",
        }));
      } else if (lower.includes("dealerid is outside your allowed scope")) {
        setErrors((prev) => ({
          ...prev,
          dealerId: "Selected dealer is outside your allowed scope",
        }));
      }

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const steps = ["Basic Information", "Role & Hierarchy", "Assignments"];

  const selectedRole = roles.find((r) => r.id === form.roleId);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto", boxSizing: "border-box" }}>
      <PageHeader
        title={isEdit ? "Edit User" : "Create New User"}
        subtitle={isEdit ? "Update user information and assignments" : "Create a new user with role-based assignments"}
        actions={
          <Button
            startIcon={<ArrowLeft size={18} />}
            onClick={() => navigate("/superadmin/users")}
            variant="outlined"
          >
            Back to Users
          </Button>
        }
      />

      <Card sx={{ mt: 3, boxShadow: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <form onSubmit={handleSave}>
            {/* STEP 1: Basic Information */}
            {activeStep === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                  <User size={20} />
                  Basic Information
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Username"
                      value={form.username}
                      onChange={(e) => updateField("username", e.target.value)}
                      required
                      error={!!errors.username}
                      helperText={errors.username}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <User size={18} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      required
                      error={!!errors.email}
                      helperText={errors.email}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Mail size={18} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  {!isEdit && (
                    <>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Password"
                          type="password"
                          value={form.password}
                          onChange={(e) => updateField("password", e.target.value)}
                          required
                          error={!!errors.password}
                          helperText={errors.password || "Minimum 6 characters"}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Lock size={18} />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Confirm Password"
                          type="password"
                          value={form.confirmPassword}
                          onChange={(e) => updateField("confirmPassword", e.target.value)}
                          required
                          error={!!errors.confirmPassword}
                          helperText={errors.confirmPassword}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Lock size={18} />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>

                <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                  <Button variant="contained" onClick={() => setActiveStep(1)}>
                    Next: Role & Hierarchy
                  </Button>
                </Box>
              </Box>
            )}

            {/* STEP 2: Role & Hierarchy */}
            {activeStep === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                  <Shield size={20} />
                  Role & Hierarchy Assignment
                </Typography>

                {hierarchy && (
                  <Alert severity="info" icon={<Info size={18} />} sx={{ mb: 3 }}>
                    {hierarchy.description}
                  </Alert>
                )}

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControl fullWidth required error={!!errors.roleId}>
                      <InputLabel>Role</InputLabel>
                      <Select
                        value={form.roleId}
                        onChange={(e) => updateField("roleId", e.target.value)}
                        label="Role"
                        startAdornment={<Shield size={18} style={{ marginRight: 8 }} />}
                      >
                        {roles.map((r) => (
                          <MenuItem key={r.id} value={r.id}>
                            {r.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.roleId && <FormHelperText>{errors.roleId}</FormHelperText>}
                    </FormControl>
                  </Grid>

                  {hierarchy && hierarchy.requires.includes("region") && (
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth required error={!!errors.regionId}>
                        <InputLabel>Region</InputLabel>
                        <Select
                          value={form.regionId}
                          onChange={(e) => updateField("regionId", e.target.value)}
                          label="Region"
                        >
                          {regions.map((r) => (
                            <MenuItem key={r.id} value={r.id}>
                              {r.name || r.regionName}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.regionId && <FormHelperText>{errors.regionId}</FormHelperText>}
                      </FormControl>
                    </Grid>
                  )}

                  {hierarchy && hierarchy.requires.includes("area") && (
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth required error={!!errors.areaId} disabled={!form.regionId}>
                        <InputLabel>Area</InputLabel>
                        <Select
                          value={form.areaId}
                          onChange={(e) => updateField("areaId", e.target.value)}
                          label="Area"
                        >
                          {filteredAreas.map((a) => (
                            <MenuItem key={a.id} value={a.id}>
                              {a.name || a.areaName}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.areaId && <FormHelperText>{errors.areaId}</FormHelperText>}
                        {!form.regionId && <FormHelperText>Please select a region first</FormHelperText>}
                      </FormControl>
                    </Grid>
                  )}

                  {hierarchy && hierarchy.requires.includes("territory") && (
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth required error={!!errors.territoryId} disabled={!form.areaId}>
                        <InputLabel>Territory</InputLabel>
                        <Select
                          value={form.territoryId}
                          onChange={(e) => updateField("territoryId", e.target.value)}
                          label="Territory"
                        >
                          {filteredTerritories.map((t) => (
                            <MenuItem key={t.id} value={t.id}>
                              {t.name || t.territoryName}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.territoryId && <FormHelperText>{errors.territoryId}</FormHelperText>}
                        {!form.areaId && <FormHelperText>Please select an area first</FormHelperText>}
                      </FormControl>
                    </Grid>
                  )}

                  {hierarchy && hierarchy.requires.includes("dealer") && (
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth required error={!!errors.dealerId}>
                        <InputLabel>Dealer</InputLabel>
                        <Select
                          value={form.dealerId}
                          onChange={(e) => updateField("dealerId", e.target.value)}
                          label="Dealer"
                        >
                          {filteredDealers.map((d) => (
                            <MenuItem key={d.id} value={d.id}>
                              {d.businessName || d.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.dealerId && <FormHelperText>{errors.dealerId}</FormHelperText>}
                      </FormControl>
                    </Grid>
                  )}

                  {/* Optional geographic assignment for sales_executive (for hierarchy visibility) */}
                  {selectedRole && selectedRole.name?.toLowerCase().replace(/\s+/g, "_") === "sales_executive" && (
                    <>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
                          Geographic Assignment (Optional - Recommended for hierarchy visibility)
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                          <InputLabel>Region (Optional)</InputLabel>
                          <Select
                            value={form.regionId || ""}
                            onChange={(e) => updateField("regionId", e.target.value)}
                            label="Region (Optional)"
                          >
                            <MenuItem value="">
                              <em>None</em>
                            </MenuItem>
                            {regions.map((r) => (
                              <MenuItem key={r.id} value={r.id}>
                                {r.name || r.regionName}
                              </MenuItem>
                            ))}
                          </Select>
                          <FormHelperText>Assign to a region for hierarchy visibility</FormHelperText>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth disabled={!form.regionId}>
                          <InputLabel>Area (Optional)</InputLabel>
                          <Select
                            value={form.areaId || ""}
                            onChange={(e) => updateField("areaId", e.target.value)}
                            label="Area (Optional)"
                          >
                            <MenuItem value="">
                              <em>None</em>
                            </MenuItem>
                            {filteredAreas.map((a) => (
                              <MenuItem key={a.id} value={a.id}>
                                {a.name || a.areaName}
                              </MenuItem>
                            ))}
                          </Select>
                          <FormHelperText>{!form.regionId && "Select a region first"}</FormHelperText>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth disabled={!form.areaId}>
                          <InputLabel>Territory (Optional)</InputLabel>
                          <Select
                            value={form.territoryId || ""}
                            onChange={(e) => updateField("territoryId", e.target.value)}
                            label="Territory (Optional)"
                          >
                            <MenuItem value="">
                              <em>None</em>
                            </MenuItem>
                            {filteredTerritories.map((t) => (
                              <MenuItem key={t.id} value={t.id}>
                                {t.name || t.territoryName}
                              </MenuItem>
                            ))}
                          </Select>
                          <FormHelperText>{!form.areaId && "Select an area first"}</FormHelperText>
                        </FormControl>
                      </Grid>
                    </>
                  )}

                  {hierarchy && hierarchy.canHaveManager.length > 0 && (
                    <Grid item xs={12}>
                      <FormControl 
                        fullWidth 
                        required={selectedRole && selectedRole.name?.toLowerCase().replace(/\s+/g, "_") === "sales_executive"}
                        error={selectedRole && selectedRole.name?.toLowerCase().replace(/\s+/g, "_") === "sales_executive" && !form.managerId && !!errors.managerId}
                      >
                        <InputLabel>
                          Manager {selectedRole && selectedRole.name?.toLowerCase().replace(/\s+/g, "_") === "sales_executive" ? "(Required)" : "(Optional)"}
                        </InputLabel>
                        <Select
                          value={form.managerId || ""}
                          onChange={(e) => updateField("managerId", e.target.value)}
                          label={`Manager ${selectedRole && selectedRole.name?.toLowerCase().replace(/\s+/g, "_") === "sales_executive" ? "(Required)" : "(Optional)"}`}
                          disabled={managers.length === 0}
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {managers.map((m) => (
                            <MenuItem key={m.id} value={m.id}>
                              {m.username} ({m.roleDetails?.name || m.role || "Manager"})
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>
                          {errors.managerId ? errors.managerId : 
                           managers.length === 0
                            ? "No managers available for this role/hierarchy"
                            : selectedRole && selectedRole.name?.toLowerCase().replace(/\s+/g, "_") === "sales_executive"
                            ? `Required: Assign to ${hierarchy.canHaveManager.join(", ")} for hierarchy placement`
                            : `Available managers: ${hierarchy.canHaveManager.join(", ")}`}
                        </FormHelperText>
                      </FormControl>
                    </Grid>
                  )}
                </Grid>

                <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
                  <Button variant="outlined" onClick={() => setActiveStep(0)}>
                    Back
                  </Button>
                  <Button variant="contained" onClick={() => setActiveStep(2)}>
                    Next: Assignments
                  </Button>
                </Box>
              </Box>
            )}

            {/* STEP 3: Additional Assignments */}
            {activeStep === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                  <Users size={20} />
                  Additional Assignments
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Sales Team (Optional)</InputLabel>
                      <Select
                        value={form.salesGroupId}
                        onChange={(e) => updateField("salesGroupId", e.target.value)}
                        label="Sales Team (Optional)"
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {salesTeams.map((team) => (
                          <MenuItem key={team.id} value={team.id}>
                            {team.name || team.teamName}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>Assign user to a sales team for better organization</FormHelperText>
                    </FormControl>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
                  <Button variant="outlined" onClick={() => setActiveStep(1)}>
                    Back
                  </Button>
                  <Button type="submit" variant="contained" disabled={loading} startIcon={<Save size={18} />}>
                    {loading ? "Saving..." : isEdit ? "Update User" : "Create User"}
                  </Button>
                </Box>
              </Box>
            )}
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
