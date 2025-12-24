import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import { geoAPI, dealerAPI, userAPI } from "../../services/api";

export default function DealerFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState({
    dealerCode: "",
    businessName: "",
    contactPerson: "",
    email: "",
    phoneNumber: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstNumber: "",
    regionId: "",
    areaId: "",
    territoryId: "",
    managerId: "",
    lat: "",
    lng: "",
  });

  const [regions, setRegions] = useState([]);
  const [areas, setAreas] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [managers, setManagers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [errors, setErrors] = useState({});

  // Test-only helper to allow E2E tests to set form state without brittle UI interactions
  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "test") {
      window.__setDealerFormState = (updates) => {
        setForm((prev) => ({ ...prev, ...(updates || {}) }));
      };
    }

    return () => {
      if (typeof window !== "undefined" && window.__setDealerFormState) {
        delete window.__setDealerFormState;
      }
    };
  }, []);

  useEffect(() => {
    loadDropdowns();
  }, []);

  useEffect(() => {
    if (isEdit) {
      loadDealer();
    }
  }, [id]);

  // Reload managers when hierarchy selection changes
  useEffect(() => {
    loadManagers();
  }, [form.regionId, form.areaId, form.territoryId]);

  const loadDropdowns = async () => {
    try {
      setLoadingDropdowns(true);
      const [r, a, t] = await Promise.all([
        geoAPI.getRegions().catch(() => []),
        geoAPI.getAreas().catch(() => []),
        geoAPI.getTerritories().catch(() => []),
      ]);

      setRegions(Array.isArray(r) ? r : r?.regions || r?.data || []);
      setAreas(Array.isArray(a) ? a : a?.areas || a?.data || []);
      setTerritories(Array.isArray(t) ? t : t?.territories || t?.data || []);
    } catch (err) {
      console.error("Failed to load geography dropdowns:", err);
      toast.error("Failed to load regions/areas/territories");
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const loadManagers = async () => {
    try {
      const params = {
        role: ["sales_executive", "territory_manager", "area_manager", "regional_manager"].join(","),
        regionId: form.regionId || undefined,
        areaId: form.areaId || undefined,
        territoryId: form.territoryId || undefined,
      };
      const data = await userAPI.getUsers(params);
      const list = data.users || data.data || data || [];
      setManagers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load managers:", err);
      setManagers([]);
    }
  };

  const loadDealer = async () => {
    try {
      setLoading(true);
      const data = await dealerAPI.getDealerById(id);
      const d = data.dealer || data;

      setForm((prev) => ({
        ...prev,
        dealerCode: d.dealerCode || "",
        businessName: d.businessName || "",
        contactPerson: d.contactPerson || "",
        email: d.email || "",
        phoneNumber: d.phoneNumber || "",
        address: d.address || "",
        city: d.city || "",
        state: d.state || "",
        pincode: d.pincode || "",
        gstNumber: d.gstNumber || "",
        regionId: d.regionId || "",
        areaId: d.areaId || "",
        territoryId: d.territoryId || "",
        managerId: d.managerId || "",
        lat: d.lat != null ? String(d.lat) : "",
        lng: d.lng != null ? String(d.lng) : "",
      }));
    } catch (err) {
      console.error("Failed to load dealer:", err);
      toast.error("Failed to load dealer details");
    } finally {
      setLoading(false);
    }
  };

  const filteredAreas = areas.filter(
    (a) => !form.regionId || a.regionId === form.regionId
  );

  const filteredTerritories = territories.filter(
    (t) => !form.areaId || t.areaId === form.areaId
  );

  // Safer update with cascade + error clearing
  const handleChange = (name, value) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "regionId") {
        next.areaId = "";
        next.territoryId = "";
        next.managerId = "";
      }
      if (name === "areaId") {
        next.territoryId = "";
        next.managerId = "";
      }
      if (name === "territoryId") {
        next.managerId = "";
      }

      if (errors[name]) {
        setErrors((prevErrors) => {
          const copy = { ...prevErrors };
          delete copy[name];
          return copy;
        });
      }

      return next;
    });
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.dealerCode.trim()) {
      nextErrors.dealerCode = "Dealer code is required";
    }
    if (!form.businessName.trim()) {
      nextErrors.businessName = "Business name is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        dealerCode: form.dealerCode.trim(),
        businessName: form.businessName.trim(),
        contactPerson: form.contactPerson || null,
        email: form.email || null,
        phoneNumber: form.phoneNumber || null,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        pincode: form.pincode || null,
        gstNumber: form.gstNumber || null,
        regionId: form.regionId || null,
        areaId: form.areaId || null,
        territoryId: form.territoryId || null,
        managerId: form.managerId || null,
      };

      if (form.lat) payload.lat = Number(form.lat);
      if (form.lng) payload.lng = Number(form.lng);

      if (isEdit) {
        await dealerAPI.updateDealer(id, payload);
        toast.success("Dealer updated successfully");
      } else {
        await dealerAPI.createDealer(payload);
        toast.success("Dealer created successfully");
      }

      navigate("/superadmin/dealers");
    } catch (err) {
      console.error("Failed to save dealer:", err);
      toast.error(err.response?.data?.error || "Failed to save dealer");
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: "auto", boxSizing: "border-box" }}>
      <PageHeader
        title={isEdit ? "Edit Dealer" : "Create Dealer"}
        subtitle={
          isEdit
            ? "Update dealer details and hierarchy assignments"
            : "Create a new dealer (distributor/company)"
        }
        actions={[
          <Button
            key="back"
            variant="outlined"
            startIcon={<ArrowLeft size={18} />}
            onClick={() => navigate("/superadmin/dealers")}
          >
            Back to Dealers
          </Button>,
        ]}
      />

      <Card sx={{ mt: 2, boxShadow: 3 }}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Dealer Code"
                  value={form.dealerCode}
                  onChange={(e) => handleChange("dealerCode", e.target.value)}
                  required
                  error={!!errors.dealerCode}
                  helperText={errors.dealerCode}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Business Name"
                  value={form.businessName}
                  onChange={(e) => handleChange("businessName", e.target.value)}
                  required
                  error={!!errors.businessName}
                  helperText={errors.businessName}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact Person"
                  value={form.contactPerson}
                  onChange={(e) =>
                    handleChange("contactPerson", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={form.phoneNumber}
                  onChange={(e) => handleChange("phoneNumber", e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  multiline
                  minRows={2}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="City"
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="State"
                  value={form.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Pincode"
                  value={form.pincode}
                  onChange={(e) => handleChange("pincode", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="GST Number"
                  value={form.gstNumber}
                  onChange={(e) => handleChange("gstNumber", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Latitude"
                  value={form.lat}
                  onChange={(e) => handleChange("lat", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Longitude"
                  value={form.lng}
                  onChange={(e) => handleChange("lng", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl
                  fullWidth
                  disabled={loadingDropdowns}
                  data-testid="region-select-control"
                >
                  <InputLabel>Region</InputLabel>
                  <Select
                    label="Region"
                    value={form.regionId}
                    onChange={(e) => handleChange("regionId", e.target.value)}
                    // Ensure dropdown menu renders in document.body for stable tests
                    MenuProps={{ container: document.body }}
                  >
                    {regions.map((r) => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.name || r.regionName}
                      </MenuItem>
                    ))}
                  </Select>
                  {loadingDropdowns && (
                    <FormHelperText>Loading regions...</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl
                  fullWidth
                  disabled={loadingDropdowns || !form.regionId}
                  data-testid="area-select-control"
                >
                  <InputLabel>Area</InputLabel>
                  <Select
                    label="Area"
                    value={form.areaId}
                    onChange={(e) => handleChange("areaId", e.target.value)}
                    // Ensure dropdown menu renders in document.body for stable tests
                    MenuProps={{ container: document.body }}
                  >
                    {filteredAreas.map((a) => (
                      <MenuItem key={a.id} value={a.id}>
                        {a.name || a.areaName}
                      </MenuItem>
                    ))}
                  </Select>
                  {!form.regionId && (
                    <FormHelperText>Select a region first</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl
                  fullWidth
                  disabled={loadingDropdowns || !form.areaId}
                  data-testid="territory-select-control"
                >
                  <InputLabel>Territory</InputLabel>
                  <Select
                    label="Territory"
                    value={form.territoryId}
                    onChange={(e) =>
                      handleChange("territoryId", e.target.value)
                    }
                    // Ensure dropdown menu renders in document.body for stable tests
                    MenuProps={{ container: document.body }}
                  >
                    {filteredTerritories.map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.name || t.territoryName}
                      </MenuItem>
                    ))}
                  </Select>
                  {!form.areaId && (
                    <FormHelperText>Select an area first</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl
                  fullWidth
                  disabled={managers.length === 0}
                  data-testid="manager-select-control"
                >
                  <InputLabel>Assigned Manager (optional)</InputLabel>
                  <Select
                    label="Assigned Manager (optional)"
                    value={form.managerId}
                    onChange={(e) => handleChange("managerId", e.target.value)}
                    // Ensure dropdown menu renders in document.body for stable tests
                    MenuProps={{ container: document.body }}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {managers.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.username} ({m.roleDetails?.name || m.role})
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {managers.length === 0
                      ? "No managers available for the selected hierarchy"
                      : "Manager will be responsible for this dealer"}
                  </FormHelperText>
                </FormControl>
              </Grid>
            </Grid>

            <Box
              sx={{
                mt: 4,
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
              }}
            >
              <Button
                variant="outlined"
                onClick={() => navigate("/superadmin/dealers")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save size={18} />}
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : isEdit
                    ? "Update Dealer"
                    : "Create Dealer"}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}


