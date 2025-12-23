import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Divider,
} from "@mui/material";
import PageHeader from "../../components/PageHeader";
import { dealerAPI, materialAPI } from "../../services/api";
import { toast } from "react-toastify";

export default function DealerMaterialAssignment() {
  const [search, setSearch] = useState("");
  const [dealers, setDealers] = useState([]);
  const [dealerId, setDealerId] = useState("");
  const [assigned, setAssigned] = useState([]);
  const [allMaterials, setAllMaterials] = useState([]);
  const [selectedAssigned, setSelectedAssigned] = useState([]);
  const [selectedAvailable, setSelectedAvailable] = useState([]);

  useEffect(() => {
    const loadMaterials = async () => {
      try {
        const res = await materialAPI.getMaterials({
          page: 1,
          pageSize: 1000,
        });
        const list =
          Array.isArray(res) ||
          Array.isArray(res?.materials) ||
          Array.isArray(res?.data)
            ? res?.materials || res?.data || res
            : [];
        setAllMaterials(list);
      } catch (err) {
        console.error("Failed to load materials", err);
        toast.error("Failed to load materials");
      }
    };
    loadMaterials();
  }, []);

  const searchDealers = async () => {
    try {
      const res = await dealerAPI.getDealers({
        search: search || undefined,
        page: 1,
        limit: 50,
      });
      const list =
        Array.isArray(res) ||
        Array.isArray(res?.dealers) ||
        Array.isArray(res?.data)
          ? res?.dealers || res?.data || res
          : [];
      setDealers(list);
    } catch (err) {
      console.error("Failed to search dealers", err);
      toast.error("Failed to search dealers");
    }
  };

  const loadDealerMaterials = async (id) => {
    if (!id) return;
    try {
      const res = await materialAPI.getDealerMaterialAssignments(id);
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
      console.error("Failed to load dealer materials", err);
      toast.error("Failed to load dealer materials");
      setAssigned([]);
    }
  };

  const handleAssign = async () => {
    if (!dealerId || selectedAvailable.length === 0) return;
    try {
      await materialAPI.assignDealerMaterials(dealerId, selectedAvailable);
      toast.success("Materials assigned to dealer");
      await loadDealerMaterials(dealerId);
    } catch (err) {
      console.error("Assign failed", err);
      toast.error(
        err?.response?.data?.error || "Failed to assign materials to dealer"
      );
    }
  };

  const handleUnassign = async () => {
    if (!dealerId || selectedAssigned.length === 0) return;
    try {
      await Promise.all(
        selectedAssigned.map((matId) =>
          materialAPI.unassignDealerMaterial(dealerId, matId)
        )
      );
      toast.success("Materials unassigned from dealer");
      await loadDealerMaterials(dealerId);
    } catch (err) {
      console.error("Unassign failed", err);
      toast.error(
        err?.response?.data?.error || "Failed to unassign materials from dealer"
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
        title="Dealer Material Assignment"
        subtitle="Map materials to specific dealers. Sales and dealer users will only see mapped materials."
      />

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 4, flexDirection: { xs: "column", md: "row" } }}>
            {/* Dealer search & selection */}
            <Box sx={{ minWidth: 260 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Search Dealer
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search by code, name, city…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Button variant="outlined" onClick={searchDealers}>
                  Search
                </Button>
              </Box>

              <List
                dense
                sx={{
                  mt: 2,
                  maxHeight: 220,
                  overflowY: "auto",
                  border: "1px solid var(--color-border)",
                  borderRadius: 1,
                }}
              >
                {dealers.map((d) => (
                  <ListItem
                    key={d.id}
                    button
                    selected={dealerId === d.id}
                    onClick={() => {
                      setDealerId(d.id);
                      loadDealerMaterials(d.id);
                    }}
                  >
                    <ListItemText
                      primary={`${d.dealerCode} — ${d.businessName}`}
                      secondary={d.city || d.regionName}
                    />
                  </ListItem>
                ))}
                {dealers.length === 0 && (
                  <ListItem>
                    <ListItemText primary="Search to find dealers" />
                  </ListItem>
                )}
              </List>
            </Box>

            <Divider
              flexItem
              orientation="vertical"
              sx={{ display: { xs: "none", md: "block" } }}
            />

            {/* Assignment lists */}
            <Box sx={{ flex: 1, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
              {/* Assigned */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Assigned to Dealer
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
                  disabled={!dealerId || selectedAssigned.length === 0}
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
                  disabled={!dealerId || selectedAvailable.length === 0}
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


