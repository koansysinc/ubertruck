# Booking Service - Serverless Implementation Prompt

## Service Overview
The Booking Service manages all transport bookings, load matching, and pricing calculations for the UberTruck platform using a completely serverless, pay-per-use architecture.

## Architecture Components

### 1. Lambda Functions (₹0 when idle)

```yaml
functions:
  # Booking Management
  create-booking:
    handler: handlers/booking/create.handler
    memory: 512MB
    timeout: 10s
    events:
      - http: POST /bookings
    environment:
      DYNAMODB_TABLE: bookings
      PRICING_ENGINE: dynamic
    cost_per_invocation: ₹0.002
    expected_daily_calls: 5000

  update-booking:
    handler: handlers/booking/update.handler
    memory: 256MB
    timeout: 5s
    events:
      - http: PUT /bookings/{id}
    cost_per_invocation: ₹0.001

  cancel-booking:
    handler: handlers/booking/cancel.handler
    memory: 256MB
    timeout: 5s
    events:
      - http: DELETE /bookings/{id}
    triggers:
      - Refund calculation
      - Vehicle release
      - Notification dispatch

  get-booking:
    handler: handlers/booking/get.handler
    memory: 128MB
    timeout: 3s
    events:
      - http: GET /bookings/{id}
    cost_per_invocation: ₹0.0005

  list-bookings:
    handler: handlers/booking/list.handler
    memory: 256MB
    timeout: 5s
    events:
      - http: GET /bookings
    pagination:
      page_size: 20
      max_results: 100

  # Load Matching Engine
  match-loads:
    handler: handlers/matching/match.handler
    memory: 1024MB
    timeout: 15s
    events:
      - eventBridge:
          schedule: rate(1 minute)
          enabled: ${self:custom.matchingEnabled}
    algorithm:
      - Vehicle capacity matching
      - Location proximity (< 50km)
      - Driver availability
      - Cost optimization
      - Return load consideration
    cost_per_invocation: ₹0.004

  auto-assign-vehicle:
    handler: handlers/matching/auto-assign.handler
    memory: 512MB
    timeout: 10s
    events:
      - dynamodb:
          stream: bookings-stream
          filterPatterns:
            - eventName: INSERT
            - status: PENDING
    assignment_rules:
      - Capacity match (±10%)
      - Nearest available
      - Driver rating > 4.0
      - Valid permits

  # Pricing Engine
  calculate-price:
    handler: handlers/pricing/calculate.handler
    memory: 256MB
    timeout: 5s
    events:
      - http: POST /pricing/calculate
    factors:
      base_rate: ₹500/ton
      distance_rate: ₹15/km/ton
      material_multiplier:
        coal: 1.0
        iron_ore: 1.1
        limestone: 0.9
        fertilizer: 1.2
      demand_surge: 1.0-2.0x
      return_load_discount: 15%
    cost_per_invocation: ₹0.001

  dynamic-pricing:
    handler: handlers/pricing/dynamic.handler
    memory: 512MB
    timeout: 10s
    events:
      - eventBridge:
          schedule: rate(5 minutes)
    adjustments:
      - Supply-demand ratio
      - Fuel price changes
      - Seasonal factors
      - Route congestion
      - Weather conditions

  # Contract Management
  create-contract:
    handler: handlers/contract/create.handler
    memory: 256MB
    timeout: 10s
    events:
      - http: POST /contracts
    contract_types:
      - Fixed monthly
      - Volume-based
      - Route-specific
      - Dedicated fleet

  manage-recurring:
    handler: handlers/contract/recurring.handler
    memory: 256MB
    timeout: 10s
    events:
      - eventBridge:
          schedule: cron(0 6 * * ? *)
    automation:
      - Daily booking creation
      - Vehicle pre-assignment
      - Invoice generation
```

### 2. DynamoDB Tables (On-Demand, ₹0 when idle)

```yaml
tables:
  bookings:
    partition_key: booking_id
    sort_key: created_at
    attributes:
      - booking_id: string
      - shipper_id: string
      - fleet_id: string
      - vehicle_id: string
      - driver_id: string
      - status: string
      - pickup_location: map
      - drop_location: map
      - material_type: string
      - quantity_mt: number
      - scheduled_date: string
      - actual_pickup: string
      - actual_delivery: string
      - price: number
      - distance_km: number
      - created_at: string
      - updated_at: string
    gsi:
      - shipper-index:
          partition_key: shipper_id
          sort_key: created_at
      - vehicle-index:
          partition_key: vehicle_id
          sort_key: scheduled_date
      - status-index:
          partition_key: status
          sort_key: scheduled_date
    stream: enabled
    point_in_time_recovery: true
    cost_per_million_reads: ₹20
    cost_per_million_writes: ₹100

  pricing_rules:
    partition_key: rule_id
    sort_key: effective_date
    attributes:
      - rule_id: string
      - rule_type: string
      - base_rate: number
      - distance_multiplier: number
      - material_rates: map
      - surge_factors: map
      - discounts: map
      - effective_date: string
      - expires_date: string
    ttl: expires_date

  contracts:
    partition_key: contract_id
    sort_key: version
    attributes:
      - contract_id: string
      - shipper_id: string
      - fleet_ids: list
      - contract_type: string
      - terms: map
      - pricing: map
      - volume_commitment: number
      - start_date: string
      - end_date: string
      - auto_renew: boolean
      - status: string
    gsi:
      - shipper-contracts:
          partition_key: shipper_id
          sort_key: start_date

  load_matching_queue:
    partition_key: region
    sort_key: priority_score
    attributes:
      - booking_id: string
      - region: string
      - priority_score: number
      - material_type: string
      - quantity_mt: number
      - pickup_lat: number
      - pickup_lng: number
      - required_date: string
      - max_price: number
      - match_attempts: number
      - last_attempt: string
    ttl: required_date + 7 days
```

### 3. Event-Driven Integration

```yaml
eventbridge_rules:
  booking-created:
    source: booking.service
    detail-type: BookingCreated
    targets:
      - Load matching engine
      - Notification service
      - Analytics pipeline

  vehicle-assigned:
    source: matching.engine
    detail-type: VehicleAssigned
    targets:
      - Fleet service
      - Driver app notification
      - Tracking service initialization

  booking-completed:
    source: booking.service
    detail-type: BookingCompleted
    targets:
      - Payment service
      - Invoice generation
      - Rating system
      - Analytics update

  price-updated:
    source: pricing.engine
    detail-type: DynamicPriceUpdate
    targets:
      - Active bookings check
      - Shipper notifications
      - Price history log
```

### 4. Cost Optimization Strategies

```yaml
optimization:
  lambda:
    - Use ARM-based Graviton2 (20% cheaper)
    - Reserved concurrency only for critical functions
    - Memory optimization based on profiling
    - Batch processing for non-urgent tasks

  dynamodb:
    - On-demand billing (₹0 baseline)
    - Auto-scaling for predictable patterns
    - Optimize GSI usage
    - Archive old bookings to S3

  caching:
    - Lambda memory caching for hot data
    - ElastiCache Serverless for pricing rules
    - CloudFront for static assets

  monitoring:
    - Custom metrics for cost tracking
    - Alerts for unusual spending
    - Daily cost reports
```

### 5. Implementation Code Examples

```python
# create-booking Lambda
import json
import boto3
import uuid
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
eventbridge = boto3.client('events')
table = dynamodb.Table('bookings')

def handler(event, context):
    try:
        # Parse request
        body = json.loads(event['body'])
        tenant_id = event['headers'].get('X-Tenant-Id')

        # Create booking
        booking_id = f"BK-{uuid.uuid4().hex[:8].upper()}"
        booking = {
            'booking_id': booking_id,
            'tenant_id': tenant_id,
            'shipper_id': body['shipper_id'],
            'status': 'PENDING',
            'pickup_location': body['pickup_location'],
            'drop_location': body['drop_location'],
            'material_type': body['material_type'],
            'quantity_mt': Decimal(str(body['quantity_mt'])),
            'scheduled_date': body['scheduled_date'],
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }

        # Calculate price
        price_response = calculate_dynamic_price(booking)
        booking['price'] = Decimal(str(price_response['total']))
        booking['distance_km'] = Decimal(str(price_response['distance']))

        # Save to DynamoDB
        table.put_item(Item=booking)

        # Publish event
        eventbridge.put_events(
            Entries=[{
                'Source': 'booking.service',
                'DetailType': 'BookingCreated',
                'Detail': json.dumps({
                    'booking_id': booking_id,
                    'tenant_id': tenant_id,
                    'material_type': body['material_type'],
                    'quantity_mt': float(booking['quantity_mt']),
                    'pickup_location': booking['pickup_location']
                })
            }]
        )

        # Track cost
        track_operation_cost('create_booking', context.get_remaining_time_in_millis())

        return {
            'statusCode': 201,
            'body': json.dumps({
                'booking_id': booking_id,
                'status': 'PENDING',
                'price': float(booking['price']),
                'distance_km': float(booking['distance_km'])
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

# Load matching algorithm
def match_loads_handler(event, context):
    # Get pending bookings
    pending = table.query(
        IndexName='status-index',
        KeyConditionExpression='#status = :status',
        ExpressionAttributeNames={'#status': 'status'},
        ExpressionAttributeValues={':status': 'PENDING'}
    )

    for booking in pending['Items']:
        # Find available vehicles
        vehicles = find_available_vehicles(
            location=booking['pickup_location'],
            capacity=booking['quantity_mt'],
            date=booking['scheduled_date']
        )

        if vehicles:
            # Score and rank vehicles
            scored = score_vehicles(vehicles, booking)
            best_match = scored[0]

            # Assign vehicle
            assign_vehicle_to_booking(booking['booking_id'], best_match['vehicle_id'])

            # Update booking status
            table.update_item(
                Key={'booking_id': booking['booking_id']},
                UpdateExpression='SET #status = :status, vehicle_id = :vehicle',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'ASSIGNED',
                    ':vehicle': best_match['vehicle_id']
                }
            )

def calculate_dynamic_price(booking):
    # Base calculation
    base_rate = 500  # ₹ per ton
    distance_rate = 15  # ₹ per km per ton

    # Get distance from coordinates
    distance = calculate_distance(
        booking['pickup_location'],
        booking['drop_location']
    )

    # Material multiplier
    material_rates = {
        'coal': 1.0,
        'iron_ore': 1.1,
        'limestone': 0.9,
        'fertilizer': 1.2
    }
    multiplier = material_rates.get(booking['material_type'], 1.0)

    # Demand surge (check current supply-demand)
    surge = get_current_surge_factor(booking['pickup_location']['region'])

    # Calculate total
    base = booking['quantity_mt'] * base_rate
    distance_cost = booking['quantity_mt'] * distance * distance_rate
    total = (base + distance_cost) * multiplier * surge

    return {
        'base': base,
        'distance_cost': distance_cost,
        'multiplier': multiplier,
        'surge': surge,
        'total': total,
        'distance': distance
    }
```

### 6. Monitoring and Alerts

```yaml
cloudwatch_alarms:
  high_booking_failure_rate:
    metric: booking_creation_failures
    threshold: 10
    period: 5 minutes

  matching_efficiency:
    metric: unmatched_bookings_ratio
    threshold: 0.2
    period: 15 minutes

  pricing_anomaly:
    metric: average_price_per_ton_km
    threshold: 50% deviation
    period: 1 hour

custom_metrics:
  - bookings_per_minute
  - average_matching_time
  - price_per_booking
  - cancellation_rate
  - auto_assignment_success_rate
```

### 7. Expected Costs

```yaml
monthly_costs:
  at_1000_bookings_per_day:
    lambda_invocations: ₹2,000
    dynamodb_requests: ₹1,500
    eventbridge_events: ₹200
    total: ₹3,700

  at_10000_bookings_per_day:
    lambda_invocations: ₹18,000
    dynamodb_requests: ₹12,000
    eventbridge_events: ₹1,500
    total: ₹31,500

  idle_state:
    all_services: ₹0
```

## Implementation Priority
1. Basic booking CRUD operations
2. Simple pricing calculation
3. Manual vehicle assignment
4. Load matching engine
5. Dynamic pricing
6. Contract management
7. Advanced optimization

## Success Metrics
- Booking creation time < 2 seconds
- Auto-matching rate > 80%
- Price calculation accuracy > 95%
- Zero fixed infrastructure costs
- Cost per booking < ₹5