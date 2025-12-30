/**
 * Routing Service
 * Fetches road-based routes using OSRM (Open Source Routing Machine)
 * OSRM is free and doesn't require API keys
 */

/**
 * Get route from point A to point B via roads
 * @param {number} lat1 - Starting latitude
 * @param {number} lng1 - Starting longitude
 * @param {number} lat2 - Destination latitude
 * @param {number} lng2 - Destination longitude
 * @returns {Promise<Array<[number, number]>>} Array of [lat, lng] coordinates representing the route
 */
export const getRoute = async (lat1, lng1, lat2, lng2) => {
  try {
    // Use OSRM routing service (free, no API key required)
    // Using the public OSRM demo server
    const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Routing API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }
    
    // Extract coordinates from GeoJSON geometry
    const route = data.routes[0];
    const coordinates = route.geometry.coordinates;
    
    // Convert from [lng, lat] to [lat, lng] format for Leaflet
    return coordinates.map(coord => [coord[1], coord[0]]);
  } catch (error) {
    console.error('Error fetching route:', error);
    // Fallback to straight line if routing fails
    return [[lat1, lng1], [lat2, lng2]];
  }
};

/**
 * Get route with distance and duration information
 * @param {number} lat1 - Starting latitude
 * @param {number} lng1 - Starting longitude
 * @param {number} lat2 - Destination latitude
 * @param {number} lng2 - Destination longitude
 * @returns {Promise<{route: Array<[number, number]>, distance: number, duration: number}>}
 */
export const getRouteWithInfo = async (lat1, lng1, lat2, lng2) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Routing API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }
    
    const route = data.routes[0];
    const coordinates = route.geometry.coordinates;
    
    return {
      route: coordinates.map(coord => [coord[1], coord[0]]),
      distance: route.distance, // in meters
      duration: route.duration // in seconds
    };
  } catch (error) {
    console.error('Error fetching route:', error);
    // Fallback to straight line
    return {
      route: [[lat1, lng1], [lat2, lng2]],
      distance: 0,
      duration: 0
    };
  }
};

/**
 * Route cache to avoid redundant API calls
 */
const routeCache = new Map();

/**
 * Get cached route or fetch new one
 * @param {number} lat1 - Starting latitude
 * @param {number} lng1 - Starting longitude
 * @param {number} lat2 - Destination latitude
 * @param {number} lng2 - Destination longitude
 * @returns {Promise<Array<[number, number]>>}
 */
export const getCachedRoute = async (lat1, lng1, lat2, lng2) => {
  // Create cache key (rounded to 4 decimal places to allow some tolerance)
  const key = `${lat1.toFixed(4)},${lng1.toFixed(4)}-${lat2.toFixed(4)},${lng2.toFixed(4)}`;
  
  if (routeCache.has(key)) {
    return routeCache.get(key);
  }
  
  const route = await getRoute(lat1, lng1, lat2, lng2);
  routeCache.set(key, route);
  
  // Limit cache size to prevent memory issues
  if (routeCache.size > 100) {
    const firstKey = routeCache.keys().next().value;
    routeCache.delete(firstKey);
  }
  
  return route;
};

/**
 * Clear route cache
 */
export const clearRouteCache = () => {
  routeCache.clear();
};

