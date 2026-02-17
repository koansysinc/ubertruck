# Tracking Service - Serverless Implementation Prompt

## Service Overview
The Tracking Service handles real-time GPS tracking, route monitoring, and delivery verification for the UberTruck platform using serverless, pay-per-use architecture optimized for high-frequency location updates.

## Architecture Components

### 1. Lambda Functions (₹0 when idle)

```yaml
functions:
  # GPS Data Ingestion
  ingest-gps-data:
    handler: handlers/gps/ingest.handler
    memory: 128MB
    timeout: 3s
    events:
      - http: POST /tracking/gps
      - iot:
          sql: "SELECT * FROM 'topic/vehicle/+/gps'"
    batch_processing: true
    batch_size: 100
    cost_per_million_invocations: ₹133

  process-gps-stream:
    handler: handlers/gps/stream-processor.handler
    memory: 512MB
    timeout: 30s
    events:
      - kinesis:
          stream: gps-data-stream
          batchSize: 1000
          parallelizationFactor: 10
          startingPosition: LATEST
    processing:
      - Geofence detection
      - Speed violation check
      - Route deviation analysis
      - Stop detection
      - Distance calculation

  # Real-time Tracking
  get-vehicle-location:
    handler: handlers/tracking/get-location.handler
    memory: 128MB
    timeout: 3s
    events:
      - http: GET /tracking/vehicle/{vehicleId}/location
      - websocket: $default
    cache: 30 seconds in Lambda memory
    cost_per_invocation: ₹0.0003

  track-multiple-vehicles:
    handler: handlers/tracking/track-multiple.handler
    memory: 256MB
    timeout: 5s
    events:
      - http: POST /tracking/vehicles/bulk
      - websocket: track-multiple
    max_vehicles: 100
    update_frequency: 30 seconds

  get-trip-history:
    handler: handlers/tracking/trip-history.handler
    memory: 256MB
    timeout: 10s
    events:
      - http: GET /tracking/trip/{tripId}/history
    data_source: Timestream
    retention: 30 days

  # Geofencing
  manage-geofences:
    handler: handlers/geofence/manage.handler
    memory: 256MB
    timeout: 5s
    events:
      - http:
          - POST /geofences
          - PUT /geofences/{id}
          - DELETE /geofences/{id}
    supported_types:
      - circular
      - polygon
      - corridor

  check-geofence-violations:
    handler: handlers/geofence/check.handler
    memory: 512MB
    timeout: 10s
    events:
      - dynamodb:
          stream: gps-locations-stream
    alerts:
      - Entry/Exit from zones
      - Restricted area violations
      - Route deviation
      - Unauthorized stops

  # Route Management
  calculate-route:
    handler: handlers/route/calculate.handler
    memory: 512MB
    timeout: 15s
    events:
      - http: POST /routing/calculate
    integration: AWS Location Service
    optimization:
      - Shortest distance
      - Fastest time
      - Avoid tolls
      - Heavy vehicle restrictions

  monitor-route-compliance:
    handler: handlers/route/monitor.handler
    memory: 256MB
    timeout: 10s
    events:
      - eventBridge:
          schedule: rate(1 minute)
    checks:
      - Deviation > 5km
      - Unexpected stops > 30 min
      - Speed violations
      - Wrong direction

  # Delivery Verification
  mark-delivery-milestone:
    handler: handlers/delivery/milestone.handler
    memory: 256MB
    timeout: 5s
    events:
      - http: POST /delivery/milestone
    milestones:
      - trip_started
      - reached_pickup
      - loading_started
      - loading_completed
      - in_transit
      - reached_delivery
      - unloading_started
      - unloading_completed
      - trip_completed

  capture-pod:
    handler: handlers/delivery/pod.handler
    memory: 512MB
    timeout: 10s
    events:
      - http: POST /delivery/pod
    captures:
      - Photo upload to S3
      - Digital signature
      - Weight receipt
      - Document scan
      - OTP verification

  # Analytics & Reporting
  generate-trip-summary:
    handler: handlers/analytics/trip-summary.handler
    memory: 512MB
    timeout: 30s
    events:
      - eventBridge:
          rule: trip-completed
    metrics:
      - Total distance
      - Actual vs planned route
      - Time analysis
      - Fuel consumption estimate
      - Stop analysis
```

### 2. Data Storage (₹0 when idle)

```yaml
# DynamoDB Tables (On-Demand)
tables:
  vehicle_current_location:
    partition_key: vehicle_id
    attributes:
      - vehicle_id: string
      - lat: number
      - lng: number
      - speed: number
      - heading: number
      - timestamp: string
      - trip_id: string
      - driver_id: string
      - status: string
    ttl: timestamp + 24 hours
    cost: ₹0 when idle

  trip_tracking:
    partition_key: trip_id
    sort_key: timestamp
    attributes:
      - trip_id: string
      - booking_id: string
      - vehicle_id: string
      - status: string
      - start_time: string
      - end_time: string
      - planned_route: string (S3 reference)
      - actual_route: string (S3 reference)
      - distance_km: number
      - milestones: map
    gsi:
      - vehicle-trips:
          partition_key: vehicle_id
          sort_key: start_time
      - booking-tracking:
          partition_key: booking_id

  geofences:
    partition_key: geofence_id
    attributes:
      - geofence_id: string
      - name: string
      - type: string
      - coordinates: list
      - radius: number
      - rules: map
      - active: boolean
      - created_by: string
    gsi:
      - active-geofences:
          partition_key: active
          sort_key: created_at

# Timestream (Serverless Time-series Database)
timestream:
  gps_tracking:
    memory_retention: 24 hours  # Hot tier
    magnetic_retention: 30 days  # Cold tier
    dimensions:
      - vehicle_id
      - trip_id
      - driver_id
    measures:
      - lat: DOUBLE
      - lng: DOUBLE
      - speed: DOUBLE
      - heading: DOUBLE
      - altitude: DOUBLE
      - accuracy: DOUBLE
      - engine_status: BOOLEAN
    cost_per_million_writes: ₹400
    cost_per_gb_scanned: ₹35

# S3 for Route Storage
s3_buckets:
  route-data:
    storage_class: INTELLIGENT_TIERING
    lifecycle:
      - transition_to_IA: 30 days
      - transition_to_glacier: 90 days
      - expiration: 365 days
    structure:
      - /routes/planned/{trip_id}.json
      - /routes/actual/{trip_id}.json
      - /pod/{trip_id}/{type}/
```

### 3. Real-time Infrastructure

```yaml
# Kinesis Data Streams (On-Demand)
kinesis:
  gps-data-stream:
    mode: ON_DEMAND
    retention: 24 hours
    shard_count: auto-scaling
    consumers:
      - Real-time dashboard
      - Geofence processor
      - Analytics pipeline
    cost_per_million_records: ₹35

# IoT Core (for direct device integration)
iot_core:
  thing_types:
    - gps_tracker
    - eld_device
    - telematics_unit

  rules:
    route_to_kinesis:
      sql: "SELECT * FROM 'topic/vehicle/+/gps'"
      actions:
        - kinesis: gps-data-stream

    detect_emergency:
      sql: "SELECT * FROM 'topic/vehicle/+/emergency'"
      actions:
        - lambda: emergency-handler
        - sns: emergency-alerts

# API Gateway WebSocket (for real-time updates)
websocket_api:
  routes:
    $connect: authorize-connection
    $disconnect: cleanup-connection
    track: subscribe-to-tracking
    untrack: unsubscribe-from-tracking

  connection_storage: DynamoDB
  broadcast_method: Lambda + SQS fan-out
  cost_per_million_messages: ₹850
```

### 4. Cost Optimization Strategies

```yaml
optimization:
  data_ingestion:
    - Batch GPS updates (100 points per request)
    - Compress payloads (gzip)
    - Filter redundant updates at edge
    - Adaptive sampling based on movement

  storage:
    - Aggressive TTL on hot data
    - Move to Timestream for time-series
    - Compress routes before S3 storage
    - Use Parquet format for analytics

  processing:
    - Edge computing for initial filtering
    - Lambda container reuse
    - Batch processing for non-critical updates
    - Cache recent locations in Lambda memory

  real_time:
    - WebSocket connection pooling
    - Selective updates based on zoom level
    - Rate limiting per client
    - Delta updates instead of full state
```

### 5. Implementation Code Examples

```python
# GPS Data Ingestion
import json
import boto3
import time
from decimal import Decimal

kinesis = boto3.client('kinesis')
dynamodb = boto3.resource('dynamodb')
timestream = boto3.client('timestream-write')

def ingest_gps_handler(event, context):
    records = []
    current_location_updates = []

    # Parse batch of GPS updates
    for record in json.loads(event['body'])['updates']:
        # Validate and enrich
        enriched = {
            'vehicle_id': record['vehicle_id'],
            'lat': record['lat'],
            'lng': record['lng'],
            'speed': record.get('speed', 0),
            'heading': record.get('heading', 0),
            'timestamp': str(int(time.time() * 1000)),
            'trip_id': record.get('trip_id'),
            'accuracy': record.get('accuracy', 10)
        }

        # Add to Kinesis batch
        records.append({
            'Data': json.dumps(enriched),
            'PartitionKey': record['vehicle_id']
        })

        # Prepare DynamoDB update
        current_location_updates.append(enriched)

    # Send to Kinesis for stream processing
    if records:
        kinesis.put_records(
            Records=records,
            StreamName='gps-data-stream'
        )

    # Update current location in DynamoDB
    table = dynamodb.Table('vehicle_current_location')
    with table.batch_writer() as batch:
        for location in current_location_updates:
            batch.put_item(Item=location)

    # Write to Timestream for time-series analysis
    write_to_timestream(current_location_updates)

    return {
        'statusCode': 200,
        'body': json.dumps({'processed': len(records)})
    }

def write_to_timestream(updates):
    records = []
    for update in updates:
        records.append({
            'Time': update['timestamp'],
            'TimeUnit': 'MILLISECONDS',
            'Dimensions': [
                {'Name': 'vehicle_id', 'Value': update['vehicle_id']},
                {'Name': 'trip_id', 'Value': update.get('trip_id', 'none')}
            ],
            'MeasureName': 'location',
            'MeasureValueType': 'MULTI',
            'MeasureValues': [
                {'Name': 'lat', 'Value': str(update['lat']), 'Type': 'DOUBLE'},
                {'Name': 'lng', 'Value': str(update['lng']), 'Type': 'DOUBLE'},
                {'Name': 'speed', 'Value': str(update['speed']), 'Type': 'DOUBLE'},
                {'Name': 'heading', 'Value': str(update['heading']), 'Type': 'DOUBLE'}
            ]
        })

    if records:
        timestream.write_records(
            DatabaseName='ubertruck',
            TableName='gps_tracking',
            Records=records
        )

# Geofence Monitoring
from shapely.geometry import Point, Polygon

def check_geofence_handler(event, context):
    alerts = []

    for record in event['Records']:
        if record['eventName'] in ['INSERT', 'MODIFY']:
            location = record['dynamodb']['NewImage']
            vehicle_id = location['vehicle_id']['S']
            lat = float(location['lat']['N'])
            lng = float(location['lng']['N'])

            # Check against active geofences
            geofences = get_active_geofences()
            point = Point(lng, lat)

            for fence in geofences:
                if fence['type'] == 'polygon':
                    polygon = Polygon(fence['coordinates'])
                    if polygon.contains(point):
                        if not was_inside_before(vehicle_id, fence['id']):
                            alerts.append({
                                'type': 'GEOFENCE_ENTRY',
                                'vehicle_id': vehicle_id,
                                'geofence': fence['name'],
                                'timestamp': location['timestamp']['S']
                            })
                elif fence['type'] == 'circular':
                    center = Point(fence['center_lng'], fence['center_lat'])
                    if point.distance(center) * 111000 <= fence['radius']:
                        # Inside circular geofence
                        handle_geofence_event(vehicle_id, fence)

    # Send alerts
    if alerts:
        send_geofence_alerts(alerts)

    return {'processed': len(event['Records']), 'alerts': len(alerts)}

# WebSocket Real-time Updates
import boto3

api_gateway = boto3.client('apigatewaymanagementapi',
                          endpoint_url='https://api-id.execute-api.region.amazonaws.com/prod')

def broadcast_location_update(vehicle_id, location):
    # Get all connections subscribed to this vehicle
    connections = get_subscribed_connections(vehicle_id)

    for connection_id in connections:
        try:
            api_gateway.post_to_connection(
                ConnectionId=connection_id,
                Data=json.dumps({
                    'type': 'location_update',
                    'vehicle_id': vehicle_id,
                    'lat': location['lat'],
                    'lng': location['lng'],
                    'speed': location['speed'],
                    'timestamp': location['timestamp']
                })
            )
        except api_gateway.exceptions.GoneException:
            # Connection no longer exists
            remove_connection(connection_id)

# Route Deviation Detection
def monitor_route_compliance_handler(event, context):
    # Get all active trips
    active_trips = get_active_trips()

    for trip in active_trips:
        # Get current location
        current = get_vehicle_location(trip['vehicle_id'])

        # Get planned route
        planned_route = get_planned_route(trip['trip_id'])

        # Calculate deviation
        deviation = calculate_deviation(
            current_location=(current['lat'], current['lng']),
            planned_route=planned_route
        )

        if deviation > 5000:  # 5km deviation
            send_route_deviation_alert(trip, deviation)

        # Check for unexpected stops
        if current['speed'] < 5:  # Less than 5 km/h
            stop_duration = get_stop_duration(trip['vehicle_id'])
            if stop_duration > 1800:  # 30 minutes
                send_unexpected_stop_alert(trip, stop_duration)
```

### 6. Monitoring and Alerts

```yaml
cloudwatch_metrics:
  custom:
    - gps_updates_per_second
    - active_vehicles_tracked
    - geofence_violations_per_hour
    - route_deviation_incidents
    - websocket_connections
    - tracking_latency_p99

alarms:
  high_tracking_latency:
    metric: tracking_latency_p99
    threshold: 1000ms
    evaluation_periods: 2

  data_ingestion_failure:
    metric: gps_ingestion_errors
    threshold: 100
    period: 5 minutes

  excessive_route_deviations:
    metric: route_deviation_rate
    threshold: 0.1  # 10% of trips
    period: 1 hour
```

### 7. Expected Costs

```yaml
monthly_costs:
  at_1000_vehicles_tracking:
    kinesis_records: ₹8,000  # 30-sec updates
    lambda_invocations: ₹5,000
    dynamodb: ₹3,000
    timestream: ₹12,000
    s3_storage: ₹500
    total: ₹28,500

  at_5000_vehicles_tracking:
    kinesis_records: ₹40,000
    lambda_invocations: ₹22,000
    dynamodb: ₹15,000
    timestream: ₹55,000
    s3_storage: ₹2,000
    total: ₹134,000

  idle_state:
    all_services: ₹0
```

## Implementation Priority
1. Basic GPS data ingestion
2. Current location API
3. Simple geofencing
4. Trip tracking
5. WebSocket real-time updates
6. Route monitoring
7. Advanced analytics

## Success Metrics
- GPS update latency < 2 seconds
- Location accuracy within 10 meters
- 99.9% data ingestion reliability
- Zero fixed infrastructure costs
- Cost per vehicle per month < ₹30