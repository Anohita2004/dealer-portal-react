// src/pages/maps/RegionMap.jsx
// Rewritten, robust Region & Territory map page
// Reference/uploaded repo snapshot (if needed): sandbox:/mnt/data/repomix-output.xml

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import axios from 'axios';

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
function HeatLayer({ points, radius = 25, blur = 20 }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (map._heat) {
      try { map.removeLayer(map._heat); } catch (_) {}
      map._heat = null;
    }

    const heatPoints = (points || [])
      .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng) && Number.isFinite(p.weight))
      .map(p => [p.lat, p.lng, Math.max(0.001, Number(p.weight) / 10000)]);

    if (!heatPoints.length) return;

    const heat = L.heatLayer(heatPoints, { radius, blur, maxZoom: 17 });
    map._heat = heat;
    heat.addTo(map);

    return () => {
      if (map._heat) {
        try { map.removeLayer(map._heat); } catch (_) {}
        map._heat = null;
      }
    };
  }, [map, points, radius, blur]);

  return null;
}

export default function RegionMap() {
  const [dealers, setDealers] = useState([]);
  const [heatPoints, setHeatPoints] = useState([]);
  const [regions, setRegions] = useState({ type: 'FeatureCollection', features: [] });
  const [territories, setTerritories] = useState({ type: 'FeatureCollection', features: [] });

  const [granularity, setGranularity] = useState('dealer');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10)); // today
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10)); // today
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // map center fallback
  const mapCenter = [20.5937, 78.9629]; // India center
  const mapRef = useRef();

  // compute a bounds from dealers and region centroids to auto-fit map
  const computedBounds = useMemo(() => {
    const latlngs = [];

    dealers.forEach(d => {
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
  }, [dealers, regions, territories]);

  // auto-fit map when data changes
  useEffect(() => {
    if (!mapRef.current || !computedBounds) return;
    const map = mapRef.current;
    try {
      map.fitBounds(computedBounds, { padding: [40, 40], maxZoom: 9 });
    } catch (e) {
      // ignore fit errors
    }
  }, [computedBounds]);

  // fetch all data (cancelable)
  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();

    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      try {
        const [dRes, rRes, tRes, hRes] = await Promise.all([
          axios.get(`/api/maps/dealers?start=${startDate}&end=${endDate}`, { signal: ac.signal }),
          axios.get(`/api/maps/regions`, { signal: ac.signal }),
          axios.get(`/api/maps/territories`, { signal: ac.signal }),
          axios.get(`/api/maps/heatmap?granularity=${granularity}&start=${startDate}&end=${endDate}`, { signal: ac.signal })
        ]);

        // DEALERS: ensure array
        const dealersArr = Array.isArray(dRes.data) ? dRes.data : (Array.isArray(dRes.data.dealers) ? dRes.data.dealers : []);
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
            regionId: d.regionId || null
          }));

        // REGIONS & TERRITORIES: normalize to FeatureCollection
        const regionsFC = normalizeFeatureCollection(rRes.data);
        const territoriesFC = normalizeFeatureCollection(tRes.data);

        // HEAT: ensure array of {lat,lng,weight}
        const heatArr = Array.isArray(hRes.data) ? hRes.data : (Array.isArray(hRes.data.points) ? hRes.data.points : []);
        const cleanedHeat = heatArr
          .filter(p => p && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)))
          .map(p => ({ lat: Number(p.lat), lng: Number(p.lng), weight: Number(p.weight || 0) }));

        if (!mounted) return;

        setDealers(cleanedDealers);
        setRegions(regionsFC);
        setTerritories(territoriesFC);
        setHeatPoints(cleanedHeat);
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error('RegionMap fetch error', err);
        if (mounted) setError('Failed to load map data');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();

    return () => {
      mounted = false;
      ac.abort();
    };
  }, [granularity, startDate, endDate]);

  const reloadHeat = async () => {
    try {
      const res = await axios.get(`/api/maps/heatmap?granularity=${granularity}&start=${startDate}&end=${endDate}`);
      const arr = Array.isArray(res.data) ? res.data : (Array.isArray(res.data.points) ? res.data.points : []);
      setHeatPoints(arr.filter(p => p && Number.isFinite(p.lat) && Number.isFinite(p.lng)).map(p => ({ lat: Number(p.lat), lng: Number(p.lng), weight: Number(p.weight || 0) })));
    } catch (err) {
      console.error('reloadHeat error', err);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 8 }}>
        <label style={{ fontWeight: 600 }}>Heat Granularity:</label>
        <select value={granularity} onChange={e => setGranularity(e.target.value)}>
          <option value="dealer">Dealer</option>
          <option value="territory">Territory</option>
          <option value="region">Region</option>
        </select>

        <label style={{ marginLeft: 12 }}>Start</label>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />

        <label>End</label>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />

        <button onClick={reloadHeat} style={{ marginLeft: 8 }}>Reload Heat</button>

        <div style={{ marginLeft: 'auto', fontSize: 13, color: '#666' }}>
          {loading ? 'Loading map...' : error ? error : `Dealers: ${dealers.length} • Regions: ${regions.features.length} • Territories: ${territories.features.length}`}
        </div>
      </div>

      <div style={{ height: '720px', borderRadius: 8, overflow: 'hidden' }}>
        <MapContainer
          whenCreated={map => { mapRef.current = map; }}
          center={mapCenter}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Regions (choropleth-ready) */}
          {regions && regions.features && regions.features.length > 0 && (
            <GeoJSON
              data={regions}
              style={(feature) => {
                // simple style; you can color by property later
                return { fillColor: '#f2f2f2', color: '#666', weight: 1, fillOpacity: 0.35 };
              }}
              onEachFeature={(feature, layer) => {
                const props = feature.properties || {};
                const name = props.name || props.title || 'Region';
                layer.bindPopup(`<strong>${name}</strong>`);
              }}
            />
          )}

          {/* Territories */}
          {territories && territories.features && territories.features.length > 0 && (
            <GeoJSON
              data={territories}
              style={() => ({ fillColor: 'transparent', color: '#1f78b4', weight: 1 })}
              onEachFeature={(feature, layer) => {
                const props = feature.properties || {};
                layer.bindPopup(`<strong>${props.name || 'Territory'}</strong>`);
              }}
            />
          )}

          {/* Dealer markers */}
          {dealers.map(d => (
            <Marker key={d.id} position={[d.lat, d.lng]}>
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong>{d.name}</strong><br />
                  Code: {d.dealerCode || '—'}<br />
                  Sales: ₹{Number(d.totalSales || 0).toLocaleString()}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Heat */}
          <HeatLayer points={heatPoints} />
        </MapContainer>
      </div>
    </div>
  );
}
