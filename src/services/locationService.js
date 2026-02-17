/**
 * Location Service
 * Manages driver locations and distance calculations
 * Following Uber/Rapido patterns for live tracking
 */

class LocationService {
  constructor() {
    // In-memory storage for driver locations (would be Redis in production)
    this.driverLocations = new Map();

    // Nalgonda to Miryalguda route coordinates
    this.ROUTE_POINTS = [
      { lat: 17.0477, lng: 79.2666, name: "Nalgonda Start" },
      { lat: 17.0300, lng: 79.3200, name: "Checkpoint 1" },
      { lat: 17.0150, lng: 79.3800, name: "Checkpoint 2" },
      { lat: 16.9900, lng: 79.4200, name: "Checkpoint 3" },
      { lat: 16.9650, lng: 79.4600, name: "Checkpoint 4" },
      { lat: 16.9400, lng: 79.5000, name: "Checkpoint 5" },
      { lat: 16.8700, lng: 79.5900, name: "Miryalguda End" }
    ];
  }

  /**
   * Update driver location
   * @param {string} driverId - Driver ID
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} heading - Direction in degrees (0-360)
   * @param {number} speed - Speed in km/h
   * @param {number} accuracy - GPS accuracy in meters
   * @returns {object} Updated location data
   */
  updateDriverLocation(driverId, lat, lng, heading = 0, speed = 0, accuracy = 10) {
    const locationData = {
      driverId,
      lat,
      lng,
      heading,
      speed,
      accuracy,
      timestamp: new Date().toISOString(),
      lastUpdated: Date.now()
    };

    this.driverLocations.set(driverId, locationData);

    console.log(`[LocationService] Updated location for driver ${driverId}:`, {
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
      speed: `${speed} km/h`
    });

    return locationData;
  }

  /**
   * Get driver's current location
   * @param {string} driverId - Driver ID
   * @returns {object|null} Current location or null if not found
   */
  getDriverLocation(driverId) {
    const location = this.driverLocations.get(driverId);

    if (location) {
      // Check if location is stale (older than 1 minute)
      const isStale = Date.now() - location.lastUpdated > 60000;

      if (isStale) {
        console.log(`[LocationService] Location for driver ${driverId} is stale`);
        location.isStale = true;
      }
    }

    return location || null;
  }

  /**
   * Get all active driver locations
   * @returns {Array} Array of driver locations
   */
  getAllDriverLocations() {
    const locations = [];
    const now = Date.now();

    this.driverLocations.forEach((location, driverId) => {
      // Only return locations updated in the last 5 minutes
      if (now - location.lastUpdated < 300000) {
        locations.push(location);
      }
    });

    return locations;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param {object} point1 - {lat, lng}
   * @param {object} point2 - {lat, lng}
   * @returns {number} Distance in kilometers
   */
  calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLng = this.toRad(point2.lng - point1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) * Math.cos(this.toRad(point2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    console.log(`[LocationService] Distance calculated: ${distance.toFixed(2)} km`);
    return distance;
  }

  /**
   * Convert degrees to radians
   * @private
   */
  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Estimate travel time based on distance and traffic
   * @param {number} distance - Distance in kilometers
   * @param {number} trafficFactor - Traffic multiplier (1.0 = normal, 1.5 = heavy)
   * @param {string} routeType - 'city' or 'highway'
   * @returns {number} Estimated time in minutes
   */
  estimateTravelTime(distance, trafficFactor = 1.0, routeType = 'highway') {
    // Average speeds based on route type
    const speeds = {
      city: 30,     // 30 km/h in city
      highway: 50   // 50 km/h on highway
    };

    const baseSpeed = speeds[routeType] || speeds.highway;
    const effectiveSpeed = baseSpeed / trafficFactor;
    const timeInHours = distance / effectiveSpeed;
    const timeInMinutes = Math.ceil(timeInHours * 60);

    console.log(`[LocationService] ETA calculated: ${timeInMinutes} minutes`, {
      distance: `${distance.toFixed(2)} km`,
      speed: `${effectiveSpeed.toFixed(0)} km/h`,
      traffic: trafficFactor
    });

    return timeInMinutes;
  }

  /**
   * Get nearest checkpoint on route
   * @param {object} currentLocation - {lat, lng}
   * @returns {object} Nearest checkpoint with distance
   */
  getNearestCheckpoint(currentLocation) {
    let nearest = null;
    let minDistance = Infinity;

    this.ROUTE_POINTS.forEach(checkpoint => {
      const distance = this.calculateDistance(currentLocation, checkpoint);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = {
          ...checkpoint,
          distance: distance
        };
      }
    });

    return nearest;
  }

  /**
   * Calculate progress along route
   * @param {object} currentLocation - {lat, lng}
   * @param {object} startPoint - {lat, lng}
   * @param {object} endPoint - {lat, lng}
   * @returns {number} Progress percentage (0-100)
   */
  calculateRouteProgress(currentLocation, startPoint, endPoint) {
    const totalDistance = this.calculateDistance(startPoint, endPoint);
    const coveredDistance = this.calculateDistance(startPoint, currentLocation);

    let progress = (coveredDistance / totalDistance) * 100;
    progress = Math.min(100, Math.max(0, progress)); // Clamp between 0-100

    console.log(`[LocationService] Route progress: ${progress.toFixed(1)}%`);
    return progress;
  }

  /**
   * Predict next position based on current location and heading
   * @param {object} currentLocation - {lat, lng, heading, speed}
   * @param {number} timeSeconds - Time in seconds to predict ahead
   * @returns {object} Predicted position {lat, lng}
   */
  predictNextPosition(currentLocation, timeSeconds = 5) {
    const { lat, lng, heading = 0, speed = 40 } = currentLocation;

    // Convert speed from km/h to m/s
    const speedMs = speed * (1000 / 3600);

    // Calculate distance traveled
    const distance = speedMs * timeSeconds;

    // Convert to lat/lng offset (approximate)
    const latOffset = (distance * Math.cos(this.toRad(heading))) / 111111;
    const lngOffset = (distance * Math.sin(this.toRad(heading))) / (111111 * Math.cos(this.toRad(lat)));

    return {
      lat: lat + latOffset,
      lng: lng + lngOffset
    };
  }

  /**
   * Clear stale locations (older than 5 minutes)
   */
  clearStaleLocations() {
    const now = Date.now();
    let cleared = 0;

    this.driverLocations.forEach((location, driverId) => {
      if (now - location.lastUpdated > 300000) {
        this.driverLocations.delete(driverId);
        cleared++;
      }
    });

    if (cleared > 0) {
      console.log(`[LocationService] Cleared ${cleared} stale locations`);
    }
  }

  /**
   * Get route between two points (mock implementation)
   * In production, this would call Google Directions API
   */
  getRoute(start, end) {
    // For now, return the predefined route points
    return {
      points: this.ROUTE_POINTS,
      distance: this.calculateDistance(start, end),
      duration: this.estimateTravelTime(
        this.calculateDistance(start, end)
      )
    };
  }
}

module.exports = new LocationService();