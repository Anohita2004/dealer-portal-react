import React, { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography, Select, MenuItem, FormControl, InputLabel, TextField, Button, Grid } from "@mui/material";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { geoAPI, reportAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

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

export default function RegionalHeatmap() {
  const [heatmapData, setHeatmapData] = useState([]);
  const [granularity, setGranularity] = useState("region");
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const fetchHeatmapData = async () => {
    try {
      setLoading(true);
      const data = await geoAPI.getHeatmapData({
        granularity,
        start: startDate,
        end: endDate,
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
        title="Regional Heatmap"
        subtitle="Visualize sales density across your region"
      />

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
                  <MenuItem value="region">Region Level</MenuItem>
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

