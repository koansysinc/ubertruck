# Phase 3: Live Tracking - Implementation Plan

## Overview
Implement real-time driver location tracking with Google Maps integration, following Uber/Rapido patterns.

## Core Requirements
1. **Google Maps Integration** - Embed live driver location tracking
2. **WebSocket Updates** - Real-time location broadcasting
3. **Driver Location Simulation** - Test environment for validation
4. **Dynamic ETA Calculation** - Distance and traffic-based computation

## Technical Architecture

### Backend Components
```
1. Location Service (src/services/locationService.js)
   - Store/retrieve driver locations
   - Calculate distance between points
   - Estimate travel time

2. Location Simulator (src/services/locationSimulator.js)
   - Simulate driver movement along route
   - Generate realistic GPS coordinates
   - Emit location updates via WebSocket

3. WebSocket Extensions (src/services/websocket.js)
   - Add location_update message type
   - Broadcast driver position to subscribers
   - Handle location subscription/unsubscription

4. Location Controller (src/controllers/locationController.js)
   - POST /api/v1/location/update - Update driver location
   - GET /api/v1/location/:driverId - Get current location
   - GET /api/v1/location/booking/:bookingId - Get driver location for booking
```

### Frontend Components
```
1. Google Maps Component (src/components/LiveMap.tsx)
   - Display map with driver/pickup/delivery markers
   - Show route polyline
   - Update driver position in real-time

2. Location Hook (src/hooks/useDriverLocation.ts)
   - Subscribe to location updates via WebSocket
   - Handle location state management
   - Calculate distance to destination

3. Enhanced ETA Hook (src/hooks/useEnhancedETA.ts)
   - Dynamic ETA based on actual distance
   - Factor in average speed for route type
   - Update as driver moves

4. Live Tracking Screen (src/screens/LiveTracking.tsx)
   - Integrate map, status, and ETA
   - Show driver details
   - Display route information
```

## Implementation Steps

### Step 1: Backend Location Service
```javascript
// src/services/locationService.js
class LocationService {
  updateDriverLocation(driverId, lat, lng, heading)
  getDriverLocation(driverId)
  calculateDistance(point1, point2)
  estimateTravelTime(distance, trafficFactor)
}
```

### Step 2: Location Simulator
```javascript
// src/services/locationSimulator.js
class LocationSimulator {
  startSimulation(bookingId, route)
  stopSimulation(bookingId)
  simulateMovement(currentPos, destination, speed)
  emitLocationUpdate(driverId, location)
}
```

### Step 3: WebSocket Location Updates
```javascript
// Extend existing WebSocket service
{
  type: 'location_update',
  driverId: 'driver-123',
  bookingId: 'booking-456',
  location: {
    lat: 17.0005,
    lng: 79.5800,
    heading: 45,
    speed: 40,
    accuracy: 10,
    timestamp: '2024-01-15T10:30:00Z'
  }
}
```

### Step 4: Frontend Google Maps Integration
```typescript
// src/components/LiveMap.tsx
interface LiveMapProps {
  driverLocation: Coordinates;
  pickupLocation: Coordinates;
  deliveryLocation: Coordinates;
  route?: RouteData;
}
```

### Step 5: Dynamic ETA Calculation
```typescript
// src/hooks/useEnhancedETA.ts
function calculateDynamicETA(
  currentLocation: Coordinates,
  destination: Coordinates,
  averageSpeed: number,
  trafficFactor: number
): number
```

## Route Coordinates (Nalgonda-Miryalguda)

### Simulated Route Points
```javascript
const NALGONDA_MIRYALGUDA_ROUTE = [
  { lat: 17.0477, lng: 79.2666, name: "Nalgonda Start" },
  { lat: 17.0300, lng: 79.3200, name: "Checkpoint 1" },
  { lat: 17.0150, lng: 79.3800, name: "Checkpoint 2" },
  { lat: 16.9900, lng: 79.4200, name: "Checkpoint 3" },
  { lat: 16.9650, lng: 79.4600, name: "Checkpoint 4" },
  { lat: 16.9400, lng: 79.5000, name: "Checkpoint 5" },
  { lat: 16.8700, lng: 79.5900, name: "Miryalguda End" }
];
```

## Testing Strategy

### 1. Unit Tests
- Location service functions
- Distance calculations
- ETA computations
- WebSocket message handling

### 2. Integration Tests
- Location updates via API
- WebSocket location broadcasting
- Database persistence
- End-to-end tracking flow

### 3. Simulation Tests
- Driver movement along route
- Real-time updates every 5 seconds
- ETA recalculation
- Map marker updates

## Google Maps API Setup

### API Key Configuration
```javascript
// .env
GOOGLE_MAPS_API_KEY=your-api-key-here

// For testing without real API key:
USE_MOCK_MAPS=true
```

### Required Google APIs
1. Maps JavaScript API
2. Geocoding API
3. Directions API
4. Distance Matrix API (optional)

## Success Criteria

1. ✅ Driver location updates every 5 seconds
2. ✅ Map displays driver, pickup, and delivery markers
3. ✅ Route polyline shown on map
4. ✅ ETA updates dynamically based on driver position
5. ✅ WebSocket broadcasts location to all subscribers
6. ✅ Simulation creates realistic movement patterns
7. ✅ System handles offline/reconnection scenarios
8. ✅ Location accuracy within 10 meters

## Timeline
- Backend Services: 2 hours
- Frontend Components: 2 hours
- Integration & Testing: 1 hour
- Total: 5 hours

## Reference Patterns

### Uber Pattern
- Driver location updates every 4-5 seconds
- Smooth animation between updates
- Heading indicator for vehicle direction
- ETA recalculation every 30 seconds

### Rapido Pattern
- Real-time tracking with polyline
- Distance remaining display
- Speed-based ETA adjustment
- Landmark-based position description

## Risk Mitigation

1. **No Google Maps API Key**
   - Use OpenStreetMap/Leaflet as fallback
   - Implement mock map component for testing

2. **WebSocket Connection Issues**
   - Store last known location
   - Use polling fallback
   - Show "Connection lost" indicator

3. **Location Accuracy**
   - Implement location smoothing
   - Filter out GPS jumps
   - Use heading for prediction

## Validation Approach

Every implementation will be:
1. **Tested** - With actual code execution
2. **Verified** - Through server logs
3. **Demonstrated** - Via browser simulation
4. **Documented** - With clear evidence

No false claims, no hallucinations, complete transparency.