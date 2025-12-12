import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  TextField,
  Divider,
  IconButton,
} from "@mui/material";
import { X, Plus, Target, Users, MapPin, Building2 } from "lucide-react";
import { geoAPI, dealerAPI, teamAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

/**
 * CampaignTargeting Component
 * Allows selecting target audience for campaigns:
 * - All dealers
 * - Specific regions
 * - Specific territories
 * - Specific dealers
 * - Specific teams
 */
const CampaignTargeting = ({ value = [], onChange, disabled = false }) => {
  const { user } = useAuth();
  const [targets, setTargets] = useState(value);
  const [targetType, setTargetType] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Data for dropdowns
  const [regions, setRegions] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [teams, setTeams] = useState([]);

  // Load data based on user role
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load regions (scoped by user role)
        const regionsData = await geoAPI.getRegions();
        setRegions(Array.isArray(regionsData) ? regionsData : regionsData.data || []);

        // Load territories (scoped by user role)
        const territoriesData = await geoAPI.getTerritories();
        setTerritories(Array.isArray(territoriesData) ? territoriesData : territoriesData.data || []);

        // Load dealers (scoped by user role)
        const dealersData = await dealerAPI.getDealers();
        setDealers(Array.isArray(dealersData) ? dealersData : dealersData.data || dealersData.dealers || []);

        // Load teams
        try {
          const teamsData = await teamAPI.getTeams();
          setTeams(Array.isArray(teamsData) ? teamsData : teamsData.data || []);
        } catch (err) {
          console.warn("Teams not available:", err);
        }
      } catch (err) {
        console.error("Failed to load targeting data:", err);
      }
    };

    loadData();
  }, [user]);

  // Update parent when targets change
  useEffect(() => {
    if (onChange) {
      onChange(targets);
    }
  }, [targets, onChange]);

  const addTarget = () => {
    let newTarget = null;

    switch (targetType) {
      case "all":
        newTarget = { type: "all", entityId: null };
        break;
      case "region":
        if (selectedRegion) {
          newTarget = { type: "region", entityId: selectedRegion.id || selectedRegion };
        }
        break;
      case "territory":
        if (selectedTerritory) {
          newTarget = { type: "territory", entityId: selectedTerritory.id || selectedTerritory };
        }
        break;
      case "dealer":
        if (selectedDealer) {
          newTarget = { type: "dealer", entityId: selectedDealer.id || selectedDealer };
        }
        break;
      case "team":
        if (selectedTeam) {
          newTarget = { type: "team", entityId: selectedTeam.id || selectedTeam };
        }
        break;
    }

    if (newTarget) {
      // Check if "all" is already added - if so, remove it
      if (newTarget.type === "all") {
        setTargets([newTarget]);
      } else {
        // Remove "all" if it exists
        const filtered = targets.filter((t) => t.type !== "all");
        // Check for duplicates
        const exists = filtered.some(
          (t) => t.type === newTarget.type && t.entityId === newTarget.entityId
        );
        if (!exists) {
          setTargets([...filtered, newTarget]);
        }
      }

      // Reset form
      setTargetType("all");
      setSelectedRegion(null);
      setSelectedTerritory(null);
      setSelectedDealer(null);
      setSelectedTeam(null);
    }
  };

  const removeTarget = (index) => {
    setTargets(targets.filter((_, i) => i !== index));
  };

  const getTargetLabel = (target) => {
    switch (target.type) {
      case "all":
        return "All Dealers";
      case "region":
        const region = regions.find((r) => r.id === target.entityId);
        return `Region: ${region?.name || target.entityId}`;
      case "territory":
        const territory = territories.find((t) => t.id === target.entityId);
        return `Territory: ${territory?.name || target.entityId}`;
      case "dealer":
        const dealer = dealers.find((d) => d.id === target.entityId);
        return `Dealer: ${dealer?.businessName || dealer?.name || target.entityId}`;
      case "team":
        const team = teams.find((t) => t.id === target.entityId);
        return `Team: ${team?.name || target.entityId}`;
      default:
        return `${target.type}: ${target.entityId}`;
    }
  };

  const getTargetIcon = (type) => {
    switch (type) {
      case "all":
        return <Users size={16} />;
      case "region":
      case "territory":
        return <MapPin size={16} />;
      case "dealer":
        return <Building2 size={16} />;
      case "team":
        return <Users size={16} />;
      default:
        return <Target size={16} />;
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Target size={18} />
        Target Audience
      </Typography>

      {/* Selected Targets */}
      {targets.length > 0 && (
        <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
          {targets.map((target, index) => (
            <Chip
              key={index}
              icon={getTargetIcon(target.type)}
              label={getTargetLabel(target)}
              onDelete={disabled ? undefined : () => removeTarget(index)}
              color={target.type === "all" ? "primary" : "default"}
              variant="outlined"
            />
          ))}
        </Box>
      )}

      {!disabled && (
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: "flex", gap: 2, alignItems: "flex-end", flexWrap: "wrap" }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Target Type</InputLabel>
                <Select
                  value={targetType}
                  label="Target Type"
                  onChange={(e) => setTargetType(e.target.value)}
                >
                  <MenuItem value="all">All Dealers</MenuItem>
                  <MenuItem value="region">Region</MenuItem>
                  <MenuItem value="territory">Territory</MenuItem>
                  <MenuItem value="dealer">Dealer</MenuItem>
                  <MenuItem value="team">Team</MenuItem>
                </Select>
              </FormControl>

              {targetType === "region" && (
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Select Region</InputLabel>
                  <Select
                    value={selectedRegion?.id || selectedRegion || ""}
                    label="Select Region"
                    onChange={(e) => {
                      const region = regions.find((r) => r.id === e.target.value);
                      setSelectedRegion(region || e.target.value);
                    }}
                  >
                    {regions.map((region) => (
                      <MenuItem key={region.id} value={region.id}>
                        {region.name || region.title || region.id}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {targetType === "territory" && (
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Select Territory</InputLabel>
                  <Select
                    value={selectedTerritory?.id || selectedTerritory || ""}
                    label="Select Territory"
                    onChange={(e) => {
                      const territory = territories.find((t) => t.id === e.target.value);
                      setSelectedTerritory(territory || e.target.value);
                    }}
                  >
                    {territories.map((territory) => (
                      <MenuItem key={territory.id} value={territory.id}>
                        {territory.name || territory.title || territory.id}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {targetType === "dealer" && (
                <Autocomplete
                  size="small"
                  options={dealers}
                  getOptionLabel={(option) => option.businessName || option.name || option.dealerCode || option.id}
                  value={selectedDealer}
                  onChange={(e, newValue) => setSelectedDealer(newValue)}
                  sx={{ minWidth: 250 }}
                  renderInput={(params) => <TextField {...params} label="Select Dealer" />}
                />
              )}

              {targetType === "team" && teams.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Select Team</InputLabel>
                  <Select
                    value={selectedTeam?.id || selectedTeam || ""}
                    label="Select Team"
                    onChange={(e) => {
                      const team = teams.find((t) => t.id === e.target.value);
                      setSelectedTeam(team || e.target.value);
                    }}
                  >
                    {teams.map((team) => (
                      <MenuItem key={team.id} value={team.id}>
                        {team.name || team.id}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Button
                variant="contained"
                startIcon={<Plus size={18} />}
                onClick={addTarget}
                disabled={
                  (targetType === "region" && !selectedRegion) ||
                  (targetType === "territory" && !selectedTerritory) ||
                  (targetType === "dealer" && !selectedDealer) ||
                  (targetType === "team" && !selectedTeam)
                }
              >
                Add Target
              </Button>
            </Box>

            {targets.length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                No targets selected. Campaign will target all dealers by default.
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default CampaignTargeting;

