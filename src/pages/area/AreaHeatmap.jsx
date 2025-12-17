import React, { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography, Select, MenuItem, FormControl, InputLabel, TextField, Button, Grid, Alert, Collapse, IconButton } from "@mui/material";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { geoAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { getMapScopeExplanation, getHeatmapLegend } from "../../utils/mapScope";
import { Info, ChevronDown, ChevronUp } from "lucide-react";

// Heat layer component
function HeatLayer({ points, enabled = true }) {
  const map = useMap();
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!map) return;
    const checkMapReady = () => {
      if (map._container && map._container.clientHeight > 0) {
        setMapReady(true);
      } else {
        setTimeout(checkMapReady, 100);
      }
    };
    checkMapReady();
  }, [map]);

  useEffect(() => {
    if (!mapReady || !enabled || !points.length) return;

    const heatPoints = points.map(p => [p.lat, p.lng, Math.max(0.001, Number(p.weight) / 10000)]);
    
    try {
      if (map._heat) {
        map.removeLayer(map._heat);
      }
      const heat = L.heatLayer(heatPoints, {
        radius: 25,
        blur: 20,
        maxZoom: 17,
        max: 1.0,
        gradient: {
          0.0: 'blue',
          0.2: 'cyan',
          0.4: 'lime',
          0.6: 'yellow',
          0.8: 'orange',
          1.0: 'red'
        }
      });
      map._heat = heat;
      heat.addTo(map);
    } catch (error) {
      console.error('Failed to create heat layer:', error);
    }

    return () => {
      if (map._heat) {
        try {
          map.removeLayer(map._heat);
        } catch (_) {}
        map._heat = null;
      }
    };
  }, [map, points, enabled, mapReady]);

  return null;
}

export default function AreaHeatmap() {
  const { user } = useAuth();
  const [heatmapData, setHeatmapData] = useState([]);
  const [granularity, setGranularity] = useState("dealer");
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [scopeExplanationOpen, setScopeExplanationOpen] = useState(true);

  // Get scope explanation
  const scopeExplanation = getMapScopeExplanation(user, {
    dealerCount: 0,
    regionCount: 0,
    territoryCount: 0,
  });

  // Get heatmap legend
  const heatmapLegend = getHeatmapLegend(granularity);

  const fetchHeatmapData = async () => {
    try {
      setLoading(true);
      const data = await geoAPI.getHeatmapData({
        granularity,
        start: startDate,
        end: endDate,
        areaId: user?.areaId,
      });
      setHeatmapData(data.points || data || []);
    } catch (error) {
      console.error("Failed to fetch heatmap data:", error);
      toast.error("Failed to load heatmap data");
      setHeatmapData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatmapData();
  }, [granularity, startDate, endDate]);

  const mapCenter = [20.5937, 78.9629]; // India center

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Area Heatmap"
        subtitle="Visualize sales density across your area"
      />

      {/* Scope Explanation - Backend Intelligence */}
      <Alert 
        severity="info" 
        icon={<Info size={18} />}
        sx={{ mb: 3 }}
        action={
          <IconButton
            size="small"
            onClick={() => setScopeExplanationOpen(!scopeExplanationOpen)}
          >
            {scopeExplanationOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </IconButton>
        }
      >
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Map Scope: {scopeExplanation.scope}
        </Typography>
        <Collapse in={scopeExplanationOpen}>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
            {scopeExplanation.explanation}
          </Typography>
          {scopeExplanation.hiddenData.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                Hidden Data (due to role permissions):
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {scopeExplanation.hiddenData.map((item, idx) => (
                  <Typography key={idx} component="li" variant="caption" color="text.secondary">
                    {item}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}
        </Collapse>
      </Alert>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Granularity</InputLabel>
                <Select
                  value={granularity}
                  label="Granularity"
                  onChange={(e) => setGranularity(e.target.value)}
                >
                  <MenuItem value="dealer">Dealer Level</MenuItem>
                  <MenuItem value="territory">Territory Level</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={fetchHeatmapData}
                disabled={loading}
              >
                {loading ? "Loading..." : "Refresh"}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Heatmap Legend - Backend Intelligence */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            Heatmap Legend: {heatmapLegend.description}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
            {heatmapLegend.labels.map((item, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: 1,
                    backgroundColor: item.color,
                    border: '1px solid #ccc',
                  }}
                />
                <Typography variant="caption">
                  <strong>{item.value}</strong>: {item.description}
                </Typography>
              </Box>
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Colors represent sales density from low (blue) to very high (red)
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ height: "600px", width: "100%", position: "relative" }}>
            <MapContainer
              center={mapCenter}
              zoom={5}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <HeatLayer points={heatmapData} enabled={true} />
            </MapContainer>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

