import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Divider,
} from "@mui/material";
import PageHeader from "../../components/PageHeader";
import { geoAPI, materialAPI } from "../../services/api";
import { toast } from "react-toastify";

export default function RegionMaterialAvailability() {
  const [regions, setRegions] = useState([]);
  const [regionId, setRegionId] = useState("");
  const [assigned, setAssigned] = useState([]);
  const [allMaterials, setAllMaterials] = useState([]);
  const [selectedAssigned, setSelectedAssigned] = useState([]);
  const [selectedAvailable, setSelectedAvailable] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [regionsRes, matsRes] = await Promise.all([
          geoAPI.getRegions({ page: 1, pageSize: 200 }).catch(() => []),
          materialAPI.getMaterials({ page: 1, pageSize: 1000 }).catch(() => []),
        ]);

        const regionList =
          Array.isArray(regionsRes) ||
          Array.isArray(regionsRes?.regions) ||
          Array.isArray(regionsRes?.data)
            ? regionsRes?.regions || regionsRes?.data || regionsRes
            : [];
        const materialList =
          Array.isArray(matsRes) ||
          Array.isArray(matsRes?.materials) ||
          Array.isArray(matsRes?.data)
            ? matsRes?.materials || matsRes?.data || matsRes
            : [];

        setRegions(regionList);
        setAllMaterials(materialList);
      } catch (err) {
        console.error("Failed to load regions/materials", err);
        toast.error("Failed to load regions or materials");
      }
    };
    loadInitial();
  }, []);

  const loadRegionMaterials = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await materialAPI.getRegionMaterials(id);
      const list =
        Array.isArray(res) ||
        Array.isArray(res?.materials) ||
        Array.isArray(res?.data)
          ? res?.materials || res?.data || res
          : [];
      setAssigned(list);
      setSelectedAssigned([]);
      setSelectedAvailable([]);
    } catch (err) {
      console.error("Failed to load region materials", err);
      toast.error("Failed to load region materials");
      setAssigned([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!regionId || selectedAvailable.length === 0) return;
    try {
      await materialAPI.assignRegionMaterials(regionId, selectedAvailable);
      toast.success("Materials assigned to region");
      await loadRegionMaterials(regionId);
    } catch (err) {
      console.error("Assign failed", err);
      toast.error(
        err?.response?.data?.error || "Failed to assign materials to region"
      );
    }
  };

  const handleUnassign = async () => {
    if (!regionId || selectedAssigned.length === 0) return;
    try {
      await Promise.all(
        selectedAssigned.map((matId) =>
          materialAPI.unassignRegionMaterial(regionId, matId)
        )
      );
      toast.success("Materials unassigned from region");
      await loadRegionMaterials(regionId);
    } catch (err) {
      console.error("Unassign failed", err);
      toast.error(
        err?.response?.data?.error || "Failed to unassign materials from region"
      );
    }
  };

  const assignedIds = new Set(assigned.map((m) => m.id));
  const available = allMaterials.filter((m) => !assignedIds.has(m.id));

  const toggleSelected = (id, listSetter, current) => {
    listSetter(
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Region Material Availability"
        subtitle="Configure which materials are available in each region"
      />

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 4, flexDirection: { xs: "column", md: "row" } }}>
            <Box sx={{ minWidth: 260 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Select Region
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={regionId}
                onChange={(e) => {
                  const id = e.target.value;
                  setRegionId(id);
                  loadRegionMaterials(id);
                }}
              >
                <MenuItem value="">Select region</MenuItem>
                {regions.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.code || r.regionCode || r.name}
                  </MenuItem>
                ))}
              </TextField>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 2 }}
              >
                Changes here control which materials are allowed for dealers in
                this region. Dealer-level mappings can further restrict
                availability.
              </Typography>
            </Box>

            <Divider
              flexItem
              orientation="vertical"
              sx={{ display: { xs: "none", md: "block" } }}
            />

            <Box sx={{ flex: 1, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
              {/* Assigned */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Assigned to Region
                </Typography>
                <List
                  dense
                  sx={{
                    maxHeight: 320,
                    overflowY: "auto",
                    border: "1px solid var(--color-border)",
                    borderRadius: 1,
                  }}
                >
                  {assigned.map((m) => (
                    <ListItem
                      key={m.id}
                      button
                      onClick={() =>
                        toggleSelected(
                          m.id,
                          setSelectedAssigned,
                          selectedAssigned
                        )
                      }
                    >
                      <Checkbox
                        edge="start"
                        tabIndex={-1}
                        disableRipple
                        checked={selectedAssigned.includes(m.id)}
                      />
                      <ListItemText
                        primary={`${m.materialNumber || m.code} — ${m.name}`}
                        secondary={m.description}
                      />
                    </ListItem>
                  ))}
                  {assigned.length === 0 && (
                    <ListItem>
                      <ListItemText primary="No materials assigned" />
                    </ListItem>
                  )}
                </List>
                <Button
                  variant="outlined"
                  color="error"
                  sx={{ mt: 1 }}
                  onClick={handleUnassign}
                  disabled={!regionId || selectedAssigned.length === 0}
                >
                  Unassign Selected
                </Button>
              </Box>

              {/* Available */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Available Materials
                </Typography>
                <List
                  dense
                  sx={{
                    maxHeight: 320,
                    overflowY: "auto",
                    border: "1px solid var(--color-border)",
                    borderRadius: 1,
                  }}
                >
                  {available.map((m) => (
                    <ListItem
                      key={m.id}
                      button
                      onClick={() =>
                        toggleSelected(
                          m.id,
                          setSelectedAvailable,
                          selectedAvailable
                        )
                      }
                    >
                      <Checkbox
                        edge="start"
                        tabIndex={-1}
                        disableRipple
                        checked={selectedAvailable.includes(m.id)}
                      />
                      <ListItemText
                        primary={`${m.materialNumber || m.code} — ${m.name}`}
                        secondary={m.description}
                      />
                    </ListItem>
                  ))}
                  {available.length === 0 && (
                    <ListItem>
                      <ListItemText primary="All materials already assigned" />
                    </ListItem>
                  )}
                </List>
                <Button
                  variant="contained"
                  sx={{ mt: 1 }}
                  onClick={handleAssign}
                  disabled={!regionId || selectedAvailable.length === 0}
                >
                  Assign Selected
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}


