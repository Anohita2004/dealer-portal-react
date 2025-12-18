// src/pages/maps/RegionMaps.jsx
// Enhanced map component with heatmap data and GeoJSON boundaries
// Supports role-based scoping, heatmaps, and interactive boundaries

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap, LayersControl, LayerGroup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { geoAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Box, Card, CardContent, Typography, Switch, FormControlLabel, Select, MenuItem, InputLabel, FormControl, Button, Chip, Alert, Collapse, IconButton } from '@mui/material';
import { Map as MapIcon, Layers, TrendingUp, Users, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { getMapScopeExplanation, getHeatmapLegend, explainBackendQueryParams } from '../../utils/mapScope';

// small helper: safe array
const safeArray = (v) => (Array.isArray(v) ? v : []);

// small helper to ensure a FeatureCollection
const normalizeFeatureCollection = (payload) => {
  if (!payload) return { type: 'FeatureCollection', features: [] };
  if (Array.isArray(payload)) {
    // Received raw features array
    return { type: 'FeatureCollection', features: payload.filter(f => f && f.type === 'Feature' && f.geometry) };
  }
  if (payload.type === 'FeatureCollection' && Array.isArray(payload.features)) {
    return {
      type: 'FeatureCollection',
      features: payload.features.filter(f => f && f.type === 'Feature' && f.geometry && f.geometry.type)
    };
  }
  // unknown shape
  return { type: 'FeatureCollection', features: [] };
};

// Heat layer component (wrapper for useMap inside MapContainer)
function HeatLayer({ points, radius = 25, blur = 20, max = 1.0, gradient, enabled = true }) {
  const map = useMap();
  const [mapReady, setMapReady] = useState(false);

  // Wait for map to be fully initialized
  useEffect(() => {
    if (!map) return;

    const checkMapReady = () => {
      try {
        const container = map.getContainer();
        if (container && container.offsetHeight > 0 && container.offsetWidth > 0) {
          setMapReady(true);
          return true;
        }
      } catch (e) {
        // Map not ready yet
      }
      return false;
    };

    // Check immediately
    if (checkMapReady()) return;

    // Wait for map to be ready
    map.whenReady(() => {
      // Small delay to ensure container has dimensions
      setTimeout(() => {
        if (checkMapReady()) return;
        // Retry after a short delay
        setTimeout(() => checkMapReady(), 100);
      }, 50);
    });

    // Also listen to resize events
    map.on('resize', () => {
      checkMapReady();
    });
  }, [map]);

  useEffect(() => {
    if (!map || !enabled || !mapReady) {
      if (map?._heat) {
        try { map.removeLayer(map._heat); } catch (_) {}
        map._heat = null;
      }
      return;
    }

    // Double-check container dimensions before proceeding
    try {
      const container = map.getContainer();
      if (!container || container.offsetHeight === 0 || container.offsetWidth === 0) {
        // Container not ready, wait a bit
        const timer = setTimeout(() => {
          if (map && map.getContainer()?.offsetHeight > 0) {
            // Retry after container is ready
            setMapReady(true);
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.warn('Map container check failed:', e);
      return;
    }

    // Clean up existing heat layer
    if (map._heat) {
      try { map.removeLayer(map._heat); } catch (_) {}
      map._heat = null;
    }

    const heatPoints = (points || [])
      .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng) && Number.isFinite(p.weight))
      .map(p => [p.lat, p.lng, Math.max(0.001, Number(p.weight) / 10000)]);

    if (!heatPoints.length) return;

    // Default gradient if not provided
    const defaultGradient = gradient || {
      0.0: 'blue',
      0.2: 'cyan',
      0.4: 'lime',
      0.6: 'yellow',
      0.8: 'orange',
      1.0: 'red'
    };

    try {
      const heat = L.heatLayer(heatPoints, { 
        radius, 
        blur, 
        maxZoom: 17,
        max, 
        gradient: defaultGradient
      });
      map._heat = heat;
      heat.addTo(map);
    } catch (error) {
      console.error('Failed to create heat layer:', error);
      // Don't crash if heat layer creation fails
    }

    return () => {
      if (map._heat) {
        try { map.removeLayer(map._heat); } catch (_) {}
        map._heat = null;
      }
    };
  }, [map, points, radius, blur, max, gradient, enabled, mapReady]);

  return null;
}

// Choropleth styling function for regions
const getRegionStyle = (feature, salesData = {}) => {
  const regionId = feature.properties?.id || feature.properties?.regionId;
  const sales = salesData[regionId] || 0;
  const maxSales = Math.max(...Object.values(salesData), 1);
  const intensity = sales / maxSales;

  // Color scale: light blue to dark blue based on sales
  const hue = 200; // Blue hue
  const saturation = Math.max(30, intensity * 100);
  const lightness = 90 - (intensity * 40);

  return {
    fillColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    color: '#2563eb',
    weight: 2,
    fillOpacity: 0.6,
    opacity: 0.8
  };
};

// Territory styling
const getTerritoryStyle = (feature) => {
  return {
    fillColor: 'transparent',
    color: '#1f78b4',
    weight: 1.5,
    fillOpacity: 0.1,
    opacity: 0.7,
    dashArray: '5, 5'
  };
};

export default function RegionMap() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase?.() || "";
  const isRegionalManager = role === "regional_manager";
  const [dealers, setDealers] = useState([]);
  const [heatPoints, setHeatPoints] = useState([]);
  const [regions, setRegions] = useState({ type: 'FeatureCollection', features: [] });
  const [territories, setTerritories] = useState({ type: 'FeatureCollection', features: [] });
  const [regionSales, setRegionSales] = useState({});
  const [scopeExplanationOpen, setScopeExplanationOpen] = useState(true);

  // Layer visibility controls
  const [showDealers, setShowDealers] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showRegions, setShowRegions] = useState(true);
  const [showTerritories, setShowTerritories] = useState(false);

  const [granularity, setGranularity] = useState('dealer');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Additional filters
  const [dealerTypeFilter, setDealerTypeFilter] = useState('all'); // all, active, inactive, verified
  const [performanceFilter, setPerformanceFilter] = useState('all'); // all, high, medium, low
  const [minSales, setMinSales] = useState('');
  const [maxSales, setMaxSales] = useState('');

  // Heatmap settings
  const [heatRadius, setHeatRadius] = useState(25);
  const [heatBlur, setHeatBlur] = useState(20);

  // map center fallback
  const mapCenter = [20.5937, 78.9629]; // India center
  const mapRef = useRef();

  // Enforce "dealer pins only" view for Regional Manager
  useEffect(() => {
    if (isRegionalManager) {
      setShowHeatmap(false);
      setShowRegions(false);
      setShowTerritories(false);
    }
  }, [isRegionalManager]);

  // Filter dealers based on filters
  const filteredDealers = useMemo(() => {
    let filtered = [...dealers];
    
    // Dealer type filter
    if (dealerTypeFilter === 'active') {
      filtered = filtered.filter(d => d.isActive);
    } else if (dealerTypeFilter === 'inactive') {
      filtered = filtered.filter(d => !d.isActive);
    } else if (dealerTypeFilter === 'verified') {
      filtered = filtered.filter(d => d.isVerified);
    }
    
    // Performance filter
    if (performanceFilter !== 'all') {
      const salesValues = dealers.map(d => d.totalSales).filter(s => s > 0);
      const maxSales = Math.max(...salesValues, 1);
      const highThreshold = maxSales * 0.7;
      const mediumThreshold = maxSales * 0.3;
      
      if (performanceFilter === 'high') {
        filtered = filtered.filter(d => d.totalSales >= highThreshold);
      } else if (performanceFilter === 'medium') {
        filtered = filtered.filter(d => d.totalSales >= mediumThreshold && d.totalSales < highThreshold);
      } else if (performanceFilter === 'low') {
        filtered = filtered.filter(d => d.totalSales < mediumThreshold);
      }
    }
    
    // Sales range filter
    if (minSales) {
      filtered = filtered.filter(d => d.totalSales >= Number(minSales));
    }
    if (maxSales) {
      filtered = filtered.filter(d => d.totalSales <= Number(maxSales));
    }
    
    return filtered;
  }, [dealers, dealerTypeFilter, performanceFilter, minSales, maxSales]);

  // compute a bounds from dealers and region centroids to auto-fit map
  const computedBounds = useMemo(() => {
    const latlngs = [];

    filteredDealers.forEach(d => {
      if (Number.isFinite(d.lat) && Number.isFinite(d.lng)) latlngs.push([d.lat, d.lng]);
    });

    regions.features.forEach(f => {
      const cLat = f.properties?.centroidLat;
      const cLng = f.properties?.centroidLng;
      if (Number.isFinite(cLat) && Number.isFinite(cLng)) latlngs.push([cLat, cLng]);
    });

    territories.features.forEach(f => {
      const cLat = f.properties?.centroidLat;
      const cLng = f.properties?.centroidLng;
      if (Number.isFinite(cLat) && Number.isFinite(cLng)) latlngs.push([cLat, cLng]);
    });

    if (!latlngs.length) return null;
    return L.latLngBounds(latlngs);
  }, [filteredDealers, regions, territories]);

  // auto-fit map when data changes
  useEffect(() => {
    if (!mapRef.current || !computedBounds) return;
    const map = mapRef.current;
    try {
      map.fitBounds(computedBounds, { padding: [40, 40], maxZoom: 9 });
    } catch (e) {
      // ignore fit errors
    }
  }, [computedBounds, filteredDealers, regions, territories]);

  // Calculate region sales from filtered dealers
  const calculateRegionSales = useMemo(() => {
    const sales = {};
    filteredDealers.forEach(dealer => {
      if (dealer.regionId) {
        sales[dealer.regionId] = (sales[dealer.regionId] || 0) + (dealer.totalSales || 0);
      }
    });
    return sales;
  }, [filteredDealers]);

  useEffect(() => {
    setRegionSales(calculateRegionSales);
  }, [calculateRegionSales]);

  // fetch all data using API service (automatically scoped by backend)
  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = {
          start: startDate,
          end: endDate
        };

        // Add region filter if user is regional admin
        if (user?.regionId) {
          params.regionId = user.regionId;
        }

        // Add territory filter if user is territory manager
        if (user?.territoryId) {
          params.territoryId = user.territoryId;
        }

        const [dealersData, regionsData, territoriesData, heatmapData] = await Promise.all([
          geoAPI.getDealerLocations(params).catch(() => []),
          geoAPI.getRegionsGeoJSON().catch(() => ({ type: 'FeatureCollection', features: [] })),
          geoAPI.getTerritoriesGeoJSON(params).catch(() => ({ type: 'FeatureCollection', features: [] })),
          geoAPI.getHeatmapData({ granularity, start: startDate, end: endDate }).catch(() => [])
        ]);

        if (!mounted) return;

        // DEALERS: ensure array
        const dealersArr = Array.isArray(dealersData) ? dealersData : (Array.isArray(dealersData.dealers) ? dealersData.dealers : []);
        const cleanedDealers = dealersArr
          .filter(d => d && Number.isFinite(Number(d.lat)) && Number.isFinite(Number(d.lng)))
          .map(d => ({
            id: d.id,
            name: d.name || d.businessName || d.dealerCode || 'Dealer',
            dealerCode: d.dealerCode || '',
            lat: Number(d.lat),
            lng: Number(d.lng),
            totalSales: Number(d.totalSales || 0),
            territoryId: d.territoryId || null,
            regionId: d.regionId || null,
            isActive: d.isActive !== false,
            isVerified: d.isVerified === true,
            status: d.status || 'active',
            outstanding: Number(d.outstanding || 0),
            totalOrders: Number(d.totalOrders || 0),
            city: d.city || '',
            state: d.state || '',
          }));

        // REGIONS & TERRITORIES: normalize to FeatureCollection
        const regionsFC = normalizeFeatureCollection(regionsData);
        const territoriesFC = normalizeFeatureCollection(territoriesData);

        // HEAT: ensure array of {lat,lng,weight}
        const heatArr = Array.isArray(heatmapData) ? heatmapData : (Array.isArray(heatmapData.points) ? heatmapData.points : []);
        const cleanedHeat = heatArr
          .filter(p => p && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)))
          .map(p => ({ lat: Number(p.lat), lng: Number(p.lng), weight: Number(p.weight || 0) }));

        setDealers(cleanedDealers);
        setRegions(regionsFC);
        setTerritories(territoriesFC);
        setHeatPoints(cleanedHeat);
      } catch (err) {
        console.error('RegionMap fetch error', err);
        if (mounted) setError('Failed to load map data');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();

    return () => {
      mounted = false;
    };
  }, [granularity, startDate, endDate, user?.regionId, user?.territoryId]);

  const reloadHeat = async () => {
    try {
      setLoading(true);
      const data = await geoAPI.getHeatmapData({ granularity, start: startDate, end: endDate });
      const arr = Array.isArray(data) ? data : (Array.isArray(data.points) ? data.points : []);
      setHeatPoints(arr.filter(p => p && Number.isFinite(p.lat) && Number.isFinite(p.lng)).map(p => ({ lat: Number(p.lat), lng: Number(p.lng), weight: Number(p.weight || 0) })));
    } catch (err) {
      console.error('reloadHeat error', err);
      setError('Failed to reload heatmap');
    } finally {
      setLoading(false);
    }
  };

  // Get scope explanation from utility
  const scopeExplanation = getMapScopeExplanation(user, {
    dealerCount: filteredDealers.length,
    regionCount: regions.features.length,
    territoryCount: territories.features.length,
  });

  // Get heatmap legend
  const heatmapLegend = getHeatmapLegend(granularity);

  // Validate backend query parameters
  const queryParams = explainBackendQueryParams({
    start: startDate,
    end: endDate,
    granularity,
    regionId: user?.regionId,
    territoryId: user?.territoryId,
  }, user);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
      {/* Scope Explanation - Backend Intelligence */}
      <Alert 
        severity="info" 
        icon={<Info size={18} />}
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

      {/* Controls Panel */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            {/* Scope Indicator */}
            <Chip 
              icon={<MapIcon size={16} />} 
              label={scopeExplanation.scope} 
              color="primary" 
              variant="outlined"
              title={scopeExplanation.explanation}
            />

            {/* Heatmap Granularity */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Heat Granularity</InputLabel>
              <Select
                value={granularity}
                label="Heat Granularity"
                onChange={(e) => setGranularity(e.target.value)}
              >
                <MenuItem value="dealer">Dealer</MenuItem>
                <MenuItem value="territory">Territory</MenuItem>
                <MenuItem value="region">Region</MenuItem>
              </Select>
            </FormControl>

            {/* Date Range */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </FormControl>
            <span>to</span>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </FormControl>

            {/* Dealer Type Filter */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Dealer Type</InputLabel>
              <Select
                value={dealerTypeFilter}
                label="Dealer Type"
                onChange={(e) => setDealerTypeFilter(e.target.value)}
              >
                <MenuItem value="all">All Dealers</MenuItem>
                <MenuItem value="active">Active Only</MenuItem>
                <MenuItem value="inactive">Inactive Only</MenuItem>
                <MenuItem value="verified">Verified Only</MenuItem>
              </Select>
            </FormControl>

            {/* Performance Filter */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Performance</InputLabel>
              <Select
                value={performanceFilter}
                label="Performance"
                onChange={(e) => setPerformanceFilter(e.target.value)}
              >
                <MenuItem value="all">All Performance</MenuItem>
                <MenuItem value="high">High Performers</MenuItem>
                <MenuItem value="medium">Medium Performers</MenuItem>
                <MenuItem value="low">Low Performers</MenuItem>
              </Select>
            </FormControl>

            {/* Sales Range */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <input
                type="number"
                placeholder="Min Sales"
                value={minSales}
                onChange={(e) => setMinSales(e.target.value)}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </FormControl>
            <span>-</span>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <input
                type="number"
                placeholder="Max Sales"
                value={maxSales}
                onChange={(e) => setMaxSales(e.target.value)}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </FormControl>

            {/* Layer Toggles */}
            <FormControlLabel
              control={
                <Switch
                  checked={showDealers}
                  onChange={(e) => setShowDealers(e.target.checked)}
                  size="small"
                />
              }
              label="Dealers"
            />
            {!isRegionalManager && (
              <>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showHeatmap}
                      onChange={(e) => setShowHeatmap(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Heatmap"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={showRegions}
                      onChange={(e) => setShowRegions(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Regions"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={showTerritories}
                      onChange={(e) => setShowTerritories(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Territories"
                />
              </>
            )}

            {/* Reload Button */}
            <Button
              variant="outlined"
              size="small"
              onClick={reloadHeat}
              disabled={loading}
            >
              Reload
            </Button>

            {/* Stats */}
            <Box sx={{ marginLeft: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
              {loading ? (
                <Typography variant="body2" color="text.secondary">Loading...</Typography>
              ) : error ? (
                <Typography variant="body2" color="error">{error}</Typography>
              ) : (
                <>
                  <Chip icon={<Users size={14} />} label={`${filteredDealers.length} Dealers`} size="small" />
                  <Chip label={`${regions.features.length} Regions`} size="small" />
                  <Chip label={`${territories.features.length} Territories`} size="small" />
                </>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Heatmap Legend - Backend Intelligence */}
      {showHeatmap && (
        <Card>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Layers size={18} />
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
      )}

      {/* Map Container */}
      <Box sx={{ flex: 1, minHeight: 500, borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
        <MapContainer
          whenCreated={map => { 
            mapRef.current = map;
            // Ensure map is properly sized
            setTimeout(() => {
              try {
                map.invalidateSize();
              } catch (e) {
                console.warn('Map invalidateSize failed:', e);
              }
            }, 100);
          }}
          center={mapCenter}
          zoom={5}
          style={{ height: '100%', width: '100%', minHeight: '500px' }}
          whenReady={() => {
            // Map is ready, invalidate size to ensure proper rendering
            if (mapRef.current) {
              setTimeout(() => {
                try {
                  mapRef.current.invalidateSize();
                } catch (e) {
                  console.warn('Map invalidateSize failed:', e);
                }
              }, 50);
            }
          }}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="OpenStreetMap">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Regions (choropleth with sales data) */}
          {showRegions && regions && regions.features && regions.features.length > 0 && (
            <LayerGroup>
              <GeoJSON
                data={regions}
                style={(feature) => getRegionStyle(feature, regionSales)}
                onEachFeature={(feature, layer) => {
                  const props = feature.properties || {};
                  const name = props.name || props.title || 'Region';
                  const regionId = props.id || props.regionId;
                  const sales = regionSales[regionId] || 0;
                  const regionDealers = filteredDealers.filter(d => d.regionId === regionId);
                  layer.bindPopup(`
                    <div style="min-width: 200px;">
                      <strong>${name}</strong><br/>
                      Sales: ₹${sales.toLocaleString()}<br/>
                      Dealers: ${regionDealers.length}<br/>
                      Active: ${regionDealers.filter(d => d.isActive).length}
                    </div>
                  `);
                  layer.on({
                    mouseover: (e) => {
                      const layer = e.target;
                      layer.setStyle({
                        weight: 3,
                        fillOpacity: 0.8
                      });
                    },
                    mouseout: (e) => {
                      const layer = e.target;
                      layer.setStyle(getRegionStyle(feature, regionSales));
                    }
                  });
                }}
              />
            </LayerGroup>
          )}

          {/* Territories */}
          {showTerritories && territories && territories.features && territories.features.length > 0 && (
            <LayerGroup>
              <GeoJSON
                data={territories}
                style={getTerritoryStyle}
                onEachFeature={(feature, layer) => {
                  const props = feature.properties || {};
                  const name = props.name || 'Territory';
                  const territoryId = props.id || props.territoryId;
                  const territoryDealers = filteredDealers.filter(d => d.territoryId === territoryId);
                  const territorySales = territoryDealers.reduce((sum, d) => sum + (d.totalSales || 0), 0);
                  layer.bindPopup(`
                    <div style="min-width: 180px;">
                      <strong>${name}</strong><br/>
                      Sales: ₹${territorySales.toLocaleString()}<br/>
                      Dealers: ${territoryDealers.length}<br/>
                      Active: ${territoryDealers.filter(d => d.isActive).length}
                    </div>
                  `);
                }}
              />
            </LayerGroup>
          )}

          {/* Dealer markers */}
          {showDealers && (
            <LayerGroup>
              {filteredDealers.map(d => {
                // Color based on performance
                const salesValues = dealers.map(dealer => dealer.totalSales).filter(s => s > 0);
                const maxSales = Math.max(...salesValues, 1);
                const highThreshold = maxSales * 0.7;
                const mediumThreshold = maxSales * 0.3;
                
                let fillColor = '#3b82f6'; // Default blue
                let color = '#1e40af';
                
                if (d.totalSales >= highThreshold) {
                  fillColor = '#10b981'; // Green for high performers
                  color = '#059669';
                } else if (d.totalSales >= mediumThreshold) {
                  fillColor = '#f59e0b'; // Orange for medium performers
                  color = '#d97706';
                } else if (d.totalSales < mediumThreshold && d.totalSales > 0) {
                  fillColor = '#ef4444'; // Red for low performers
                  color = '#dc2626';
                }
                
                // Different color if inactive
                if (!d.isActive) {
                  fillColor = '#9ca3af'; // Gray for inactive
                  color = '#6b7280';
                }
                
                return (
                  <CircleMarker
                    key={d.id}
                    center={[d.lat, d.lng]}
                    radius={Math.max(5, Math.min(15, Math.sqrt(d.totalSales || 0) / 10000))}
                    pathOptions={{
                      fillColor,
                      color,
                      weight: 2,
                      fillOpacity: 0.7
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: 200 }}>
                        <strong>{d.name}</strong><br />
                        Code: {d.dealerCode || '—'}<br />
                        Sales: ₹{Number(d.totalSales || 0).toLocaleString()}<br />
                        {d.outstanding > 0 && (
                          <>Outstanding: ₹{Number(d.outstanding).toLocaleString()}<br /></>
                        )}
                        Orders: {d.totalOrders || 0}<br />
                        Status: {d.isActive ? 'Active' : 'Inactive'} {d.isVerified && '✓ Verified'}<br />
                        {d.city && <>Location: {d.city}{d.state && `, ${d.state}`}<br /></>}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </LayerGroup>
          )}

          {/* Heatmap Layer */}
          <HeatLayer 
            points={heatPoints} 
            radius={heatRadius}
            blur={heatBlur}
            enabled={showHeatmap}
          />
        </MapContainer>
      </Box>

      {/* Legend */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption" fontWeight="bold">Heatmap Intensity:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Box sx={{ width: 20, height: 20, background: 'blue', borderRadius: '50%' }} />
                <span style={{ fontSize: '12px' }}>Low</span>
                <Box sx={{ width: 20, height: 20, background: 'cyan', borderRadius: '50%' }} />
                <Box sx={{ width: 20, height: 20, background: 'lime', borderRadius: '50%' }} />
                <Box sx={{ width: 20, height: 20, background: 'yellow', borderRadius: '50%' }} />
                <Box sx={{ width: 20, height: 20, background: 'orange', borderRadius: '50%' }} />
                <Box sx={{ width: 20, height: 20, background: 'red', borderRadius: '50%' }} />
                <span style={{ fontSize: '12px' }}>High</span>
              </Box>
            </Box>
            <Box>
              <Typography variant="caption" fontWeight="bold">Region Colors:</Typography>
              <Typography variant="caption" sx={{ ml: 1 }}>
                Darker blue = Higher sales
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" fontWeight="bold">Dealer Markers:</Typography>
              <Typography variant="caption" sx={{ ml: 1 }}>
                Size = Sales volume
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
