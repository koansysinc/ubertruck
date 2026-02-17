/**
 * Location Simulator
 * Simulates realistic driver movement along route
 * Following Uber/Rapido tracking patterns
 */

const locationService = require('./locationService');
const websocketService = require('./websocket');

class LocationSimulator {
  constructor() {
    this.activeSimulations = new Map();
    this.UPDATE_INTERVAL = 5000; // Update every 5 seconds (Uber pattern)
  }

  /**
   * Start location simulation for a driver
   * @param {string} bookingId - Booking ID
   * @param {string} driverId - Driver ID
   * @param {object} route - Route configuration
   * @returns {boolean} Success status
   */
  startSimulation(bookingId, driverId, route = {}) {
    // Check if simulation already exists
    if (this.activeSimulations.has(bookingId)) {
      console.log(`[LocationSimulator] Simulation already active for booking ${bookingId}`);
      return false;
    }

    // Default route from Nalgonda to Miryalguda
    const defaultRoute = {
      start: { lat: 17.0477, lng: 79.2666 },
      end: { lat: 16.8700, lng: 79.5900 },
      waypoints: [
        { lat: 17.0477, lng: 79.2666 },
        { lat: 17.0300, lng: 79.3200 },
        { lat: 17.0150, lng: 79.3800 },
        { lat: 16.9900, lng: 79.4200 },
        { lat: 16.9650, lng: 79.4600 },
        { lat: 16.9400, lng: 79.5000 },
        { lat: 16.8700, lng: 79.5900 }
      ]
    };

    const simulationRoute = {
      ...defaultRoute,
      ...route
    };

    // Initialize simulation state
    const simulation = {
      bookingId,
      driverId,
      route: simulationRoute,
      currentWaypointIndex: 0,
      currentPosition: simulationRoute.start,
      speed: this.getRandomSpeed(),
      heading: this.calculateHeading(
        simulationRoute.start,
        simulationRoute.waypoints[1]
      ),
      startTime: Date.now(),
      distance: 0,
      status: 'active'
    };

    // Start the simulation loop
    simulation.intervalId = setInterval(() => {
      this.updateSimulation(bookingId);
    }, this.UPDATE_INTERVAL);

    this.activeSimulations.set(bookingId, simulation);

    console.log(`[LocationSimulator] Started simulation for booking ${bookingId}`);
    console.log(`  Driver: ${driverId}`);
    console.log(`  Route: Nalgonda to Miryalguda`);
    console.log(`  Update interval: ${this.UPDATE_INTERVAL / 1000}s`);

    // Send initial location
    this.broadcastLocation(simulation);

    return true;
  }

  /**
   * Stop location simulation
   * @param {string} bookingId - Booking ID
   * @returns {boolean} Success status
   */
  stopSimulation(bookingId) {
    const simulation = this.activeSimulations.get(bookingId);

    if (!simulation) {
      console.log(`[LocationSimulator] No active simulation for booking ${bookingId}`);
      return false;
    }

    // Clear the interval
    if (simulation.intervalId) {
      clearInterval(simulation.intervalId);
    }

    // Remove from active simulations
    this.activeSimulations.delete(bookingId);

    console.log(`[LocationSimulator] Stopped simulation for booking ${bookingId}`);
    return true;
  }

  /**
   * Update simulation state
   * @private
   */
  updateSimulation(bookingId) {
    const simulation = this.activeSimulations.get(bookingId);

    if (!simulation || simulation.status !== 'active') {
      return;
    }

    // Move the driver along the route
    const moved = this.simulateMovement(simulation);

    if (!moved) {
      // Reached destination
      simulation.status = 'completed';
      console.log(`[LocationSimulator] Driver reached destination for booking ${bookingId}`);
      this.stopSimulation(bookingId);
      return;
    }

    // Update location in location service
    locationService.updateDriverLocation(
      simulation.driverId,
      simulation.currentPosition.lat,
      simulation.currentPosition.lng,
      simulation.heading,
      simulation.speed,
      this.getRandomAccuracy()
    );

    // Broadcast location update
    this.broadcastLocation(simulation);
  }

  /**
   * Simulate realistic movement along route
   * @private
   */
  simulateMovement(simulation) {
    const { waypoints } = simulation.route;

    // Check if we've reached the end
    if (simulation.currentWaypointIndex >= waypoints.length - 1) {
      simulation.currentPosition = waypoints[waypoints.length - 1];
      return false; // Journey complete
    }

    // Get current and next waypoint
    const currentWaypoint = waypoints[simulation.currentWaypointIndex];
    const nextWaypoint = waypoints[simulation.currentWaypointIndex + 1];

    // Calculate distance to next waypoint
    const distanceToNext = locationService.calculateDistance(
      simulation.currentPosition,
      nextWaypoint
    );

    // Calculate how far we can travel in this update
    const speedKmh = simulation.speed;
    const speedMs = speedKmh * (1000 / 3600);
    const distancePerUpdate = (speedMs * this.UPDATE_INTERVAL) / 1000; // Distance in km

    if (distanceToNext <= distancePerUpdate) {
      // We've reached the next waypoint
      simulation.currentPosition = nextWaypoint;
      simulation.currentWaypointIndex++;

      // Update heading for next segment
      if (simulation.currentWaypointIndex < waypoints.length - 1) {
        simulation.heading = this.calculateHeading(
          nextWaypoint,
          waypoints[simulation.currentWaypointIndex + 1]
        );
      }

      // Add some speed variation
      simulation.speed = this.getRandomSpeed();

      console.log(`[LocationSimulator] Reached waypoint ${simulation.currentWaypointIndex}/${waypoints.length - 1}`);
    } else {
      // Move towards next waypoint
      const progress = distancePerUpdate / distanceToNext;
      simulation.currentPosition = this.interpolatePosition(
        simulation.currentPosition,
        nextWaypoint,
        progress
      );
    }

    // Track total distance
    simulation.distance += distancePerUpdate;

    // Add realistic variations
    this.addRealisticVariations(simulation);

    return true;
  }

  /**
   * Interpolate position between two points
   * @private
   */
  interpolatePosition(start, end, progress) {
    return {
      lat: start.lat + (end.lat - start.lat) * progress,
      lng: start.lng + (end.lng - start.lng) * progress
    };
  }

  /**
   * Calculate heading between two points
   * @private
   */
  calculateHeading(start, end) {
    const dLng = (end.lng - start.lng);
    const y = Math.sin(dLng * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180);
    const x = Math.cos(start.lat * Math.PI / 180) * Math.sin(end.lat * Math.PI / 180) -
              Math.sin(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) * Math.cos(dLng * Math.PI / 180);

    const heading = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    return Math.round(heading);
  }

  /**
   * Add realistic variations to simulation
   * @private
   */
  addRealisticVariations(simulation) {
    // Vary speed slightly (+/- 5 km/h)
    const speedVariation = (Math.random() - 0.5) * 10;
    simulation.speed = Math.max(20, Math.min(60, simulation.speed + speedVariation));

    // Slight position drift (GPS inaccuracy)
    const drift = 0.00001; // About 1 meter
    simulation.currentPosition.lat += (Math.random() - 0.5) * drift;
    simulation.currentPosition.lng += (Math.random() - 0.5) * drift;

    // Slight heading variation (+/- 5 degrees)
    simulation.heading = (simulation.heading + (Math.random() - 0.5) * 10 + 360) % 360;
  }

  /**
   * Get random speed based on route type
   * @private
   */
  getRandomSpeed() {
    // Highway speed: 40-50 km/h for trucks
    const minSpeed = 35;
    const maxSpeed = 50;
    return Math.floor(Math.random() * (maxSpeed - minSpeed + 1)) + minSpeed;
  }

  /**
   * Get random GPS accuracy
   * @private
   */
  getRandomAccuracy() {
    // GPS accuracy between 5-15 meters
    return Math.floor(Math.random() * 11) + 5;
  }

  /**
   * Broadcast location update via WebSocket
   * @private
   */
  broadcastLocation(simulation) {
    const { bookingId, driverId, currentPosition, heading, speed } = simulation;

    // Calculate remaining distance and ETA
    const destination = simulation.route.end;
    const remainingDistance = locationService.calculateDistance(
      currentPosition,
      destination
    );
    const eta = locationService.estimateTravelTime(remainingDistance, 1.0, 'highway');

    const locationUpdate = {
      type: 'location_update',
      bookingId,
      driverId,
      location: {
        lat: currentPosition.lat,
        lng: currentPosition.lng,
        heading,
        speed,
        accuracy: this.getRandomAccuracy(),
        timestamp: new Date().toISOString()
      },
      route: {
        remainingDistance: remainingDistance.toFixed(2),
        remainingTime: eta,
        progress: this.calculateProgress(simulation)
      }
    };

    // Broadcast to all subscribers
    websocketService.broadcastLocationUpdate(bookingId, locationUpdate);

    console.log(`[LocationSimulator] Location update broadcast:`, {
      booking: bookingId,
      position: `${currentPosition.lat.toFixed(6)}, ${currentPosition.lng.toFixed(6)}`,
      speed: `${speed} km/h`,
      remaining: `${remainingDistance.toFixed(1)} km, ${eta} min`
    });
  }

  /**
   * Calculate journey progress percentage
   * @private
   */
  calculateProgress(simulation) {
    const totalWaypoints = simulation.route.waypoints.length - 1;
    const progress = (simulation.currentWaypointIndex / totalWaypoints) * 100;
    return Math.min(100, Math.round(progress));
  }

  /**
   * Get all active simulations
   */
  getActiveSimulations() {
    const simulations = [];
    this.activeSimulations.forEach((sim, bookingId) => {
      simulations.push({
        bookingId,
        driverId: sim.driverId,
        status: sim.status,
        position: sim.currentPosition,
        speed: sim.speed,
        progress: this.calculateProgress(sim)
      });
    });
    return simulations;
  }

  /**
   * Pause simulation
   */
  pauseSimulation(bookingId) {
    const simulation = this.activeSimulations.get(bookingId);
    if (simulation) {
      simulation.status = 'paused';
      console.log(`[LocationSimulator] Paused simulation for booking ${bookingId}`);
      return true;
    }
    return false;
  }

  /**
   * Resume simulation
   */
  resumeSimulation(bookingId) {
    const simulation = this.activeSimulations.get(bookingId);
    if (simulation && simulation.status === 'paused') {
      simulation.status = 'active';
      console.log(`[LocationSimulator] Resumed simulation for booking ${bookingId}`);
      return true;
    }
    return false;
  }
}

module.exports = new LocationSimulator();