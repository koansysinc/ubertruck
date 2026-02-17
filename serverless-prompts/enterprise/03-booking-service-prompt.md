# Enterprise Booking Service - Serverless Implementation Prompt

## Service Overview
Generate a comprehensive booking management service for the UberTruck platform with dynamic pricing, load matching, and contract management. ALL configuration values must be retrieved from the configuration service - absolutely no hardcoded business logic or values.

## Core Requirements

### 1. Architecture Specifications
Generate a serverless booking service with:
- Dynamic configuration-based pricing engine
- Intelligent load matching algorithm
- Contract and recurring booking management
- Real-time availability checking
- Multi-tenant isolation
- Complete audit trails
- Event-driven architecture
- Zero hardcoded business rules

### 2. Lambda Functions Required

#### 2.1 Booking Management
```yaml
function_requirements:
  create_booking:
    purpose: Create new transport booking with dynamic pricing
    inputs:
      - shipper_id: string (from JWT claims)
      - tenant_id: string (from JWT claims)
      - pickup_location: object (lat, lng, address)
      - drop_location: object (lat, lng, address)
      - material_type: string
      - quantity_mt: number
      - scheduled_date: ISO8601
      - special_requirements: array (optional)
      - contract_id: string (optional)
    processing:
      - Validate shipper credit from configuration
      - Check material type restrictions from configuration
      - Calculate distance using location service
      - Retrieve pricing rules from configuration service
      - Apply dynamic pricing based on configuration
      - Check vehicle availability
      - Apply contract terms if applicable
      - Generate unique booking ID
      - Store booking with audit trail
      - Publish booking created event
    outputs:
      - booking_id: string
      - estimated_price: object (amount, currency, breakdown)
      - estimated_duration: minutes
      - assigned_vehicle: object (if immediate match)
      - status: string
      - payment_terms: object
    configuration_dependencies:
      - pricing_rules: /tenant/{{tenant_id}}/services/booking/{{env}}/business/pricing
      - material_restrictions: /tenant/{{tenant_id}}/services/booking/{{env}}/business/materials
      - credit_limits: /tenant/{{tenant_id}}/services/booking/{{env}}/business/credit
      - booking_rules: /tenant/{{tenant_id}}/services/booking/{{env}}/business/rules

  update_booking:
    purpose: Update existing booking with validation
    inputs:
      - booking_id: string
      - updates: object
      - reason: string
      - authorization: JWT token
    processing:
      - Retrieve booking details
      - Validate ownership/permissions
      - Check update rules from configuration
      - Calculate penalties if applicable
      - Apply updates with versioning
      - Recalculate pricing if needed
      - Notify affected parties
      - Create audit log entry
    outputs:
      - success: boolean
      - updated_booking: object
      - price_adjustment: object (if applicable)
      - notifications_sent: array

  cancel_booking:
    purpose: Cancel booking with policy enforcement
    inputs:
      - booking_id: string
      - cancellation_reason: string
      - authorization: JWT token
    processing:
      - Retrieve cancellation policy from configuration
      - Calculate cancellation charges from configuration
      - Check refund eligibility from configuration
      - Release assigned resources
      - Process refund if applicable
      - Update booking status
      - Notify all parties
      - Create audit log
    configuration_dependencies:
      - cancellation_policy: /tenant/{{tenant_id}}/services/booking/{{env}}/business/cancellation
      - refund_rules: /tenant/{{tenant_id}}/services/booking/{{env}}/business/refunds
```

#### 2.2 Dynamic Pricing Engine
```yaml
function_requirements:
  calculate_price:
    purpose: Calculate booking price using configuration-based rules
    inputs:
      - booking_details: object
      - tenant_id: string
      - apply_contract: boolean
    processing:
      - Retrieve base rates from configuration service
      - Retrieve distance rates from configuration service
      - Retrieve material multipliers from configuration
      - Check surge pricing rules from configuration
      - Apply seasonal factors from configuration
      - Apply volume discounts from configuration
      - Apply contract rates if applicable
      - Calculate taxes from configuration
      - Generate price breakdown
    outputs:
      - base_amount: decimal
      - distance_charge: decimal
      - material_surcharge: decimal
      - surge_amount: decimal
      - discounts: array
      - taxes: array
      - total_amount: decimal
      - currency: string
      - validity_period: minutes
      - price_version: string
    configuration_structure:
      pricing_rules:
        base_rates:
          "{{material_type}}": "CONFIG_SERVICE_VALUE"
        distance_rates:
          "{{distance_range}}": "CONFIG_SERVICE_VALUE"
        surge_rules:
          enabled: "CONFIG_SERVICE_VALUE"
          triggers: "CONFIG_SERVICE_VALUE"
          max_multiplier: "CONFIG_SERVICE_VALUE"
        discounts:
          volume: "CONFIG_SERVICE_VALUE"
          loyalty: "CONFIG_SERVICE_VALUE"
          promotional: "CONFIG_SERVICE_VALUE"
    forbidden_patterns:
      - "base_rate = 500"  # NEVER hardcode
      - "distance_rate = 15"  # NEVER hardcode
      - "gst_rate = 0.18"  # NEVER hardcode

  get_dynamic_surge:
    purpose: Calculate real-time surge pricing
    inputs:
      - location: object
      - datetime: ISO8601
      - tenant_id: string
    processing:
      - Get surge configuration from config service
      - Check current demand from analytics
      - Check supply availability
      - Apply surge algorithm from configuration
      - Validate against max surge limits
    outputs:
      - surge_multiplier: decimal
      - reason: string
      - validity_minutes: integer
```

#### 2.3 Load Matching Engine
```yaml
function_requirements:
  match_loads:
    purpose: Match bookings with available vehicles
    inputs:
      - booking_id: string (optional, for specific match)
      - batch_size: integer (for batch processing)
    processing:
      - Retrieve matching rules from configuration
      - Get pending bookings
      - Get available vehicles
      - Apply matching algorithm from configuration
      - Score matches based on configured criteria
      - Validate matches against business rules
      - Assign best matches
      - Notify assigned parties
    configuration_dependencies:
      - matching_rules: /tenant/{{tenant_id}}/services/booking/{{env}}/business/matching
      - scoring_weights: /tenant/{{tenant_id}}/services/booking/{{env}}/business/scoring
      - auto_assign_threshold: /tenant/{{tenant_id}}/services/booking/{{env}}/business/thresholds
    matching_criteria_from_config:
      - capacity_tolerance: "CONFIG_VALUE"
      - distance_threshold: "CONFIG_VALUE"
      - driver_rating_minimum: "CONFIG_VALUE"
      - vehicle_age_maximum: "CONFIG_VALUE"
      - permit_requirements: "CONFIG_VALUE"
```

### 3. Data Storage Requirements

#### 3.1 Bookings Table (DynamoDB)
```yaml
table_structure:
  partition_key: booking_id
  sort_key: created_at

  attributes:
    # All business values fetched from configuration service
    - booking_id: string (generated)
    - tenant_id: string
    - shipper_id: string
    - fleet_owner_id: string
    - vehicle_id: string
    - driver_id: string
    - status: string
    - pickup_location: map
    - drop_location: map
    - material_type: string
    - quantity_mt: decimal
    - distance_km: decimal
    - scheduled_date: string
    - actual_pickup: string
    - actual_delivery: string
    - price_details: map (calculated dynamically)
    - payment_status: string
    - contract_id: string
    - version: integer
    - created_at: timestamp
    - updated_at: timestamp
    - created_by: string
    - updated_by: string

  global_secondary_indexes:
    - shipper-bookings: (shipper_id, created_at)
    - vehicle-bookings: (vehicle_id, scheduled_date)
    - status-date: (status, scheduled_date)
    - tenant-bookings: (tenant_id, created_at)

  stream: enabled
  encryption: at-rest with KMS
  point_in_time_recovery: enabled
  tags:
    - Environment: "{{environment}}"
    - Service: booking
    - Tenant: "{{tenant_id}}"
```

### 4. Event-Driven Architecture

```yaml
event_patterns:
  booking_created:
    source: booking.service
    detail_type: BookingCreated
    payload:
      - booking_id
      - tenant_id
      - shipper_id
      - material_type
      - quantity_mt
      - pickup_location
      - drop_location
      - scheduled_date
    subscribers:
      - matching.service
      - notification.service
      - analytics.service

  booking_assigned:
    source: matching.service
    detail_type: VehicleAssigned
    payload:
      - booking_id
      - vehicle_id
      - driver_id
      - estimated_arrival
    subscribers:
      - tracking.service
      - notification.service

  booking_completed:
    source: booking.service
    detail_type: BookingCompleted
    payload:
      - booking_id
      - actual_duration
      - final_amount
    subscribers:
      - payment.service
      - invoice.service
      - rating.service
```

### 5. Configuration Integration Pattern

```python
# Template for configuration-driven booking service
class BookingService:
    """
    ALL values from configuration service - NO HARDCODING
    """

    def __init__(self, tenant_id: str, environment: str):
        self.tenant_id = tenant_id
        self.environment = environment
        self.config_client = ConfigurationClient(
            service='booking',
            environment=environment,
            tenant_id=tenant_id
        )

    def calculate_booking_price(self, booking: dict) -> dict:
        """
        Dynamic pricing - ALL rules from configuration
        """
        # Get pricing configuration
        pricing_config = self.config_client.get_config('business/pricing')

        # NEVER do this:
        # base_rate = 500  # WRONG - hardcoded!

        # ALWAYS do this:
        base_rate = pricing_config['base_rates'][booking['material_type']]
        distance_rate = pricing_config['distance_rates']['standard']

        # Apply all rules from configuration
        return self._apply_pricing_rules(booking, pricing_config)

    def validate_booking(self, booking: dict) -> bool:
        """
        Validate booking - ALL rules from configuration
        """
        validation_rules = self.config_client.get_config('business/validation')

        # Apply each rule from configuration
        for rule in validation_rules['rules']:
            if not self._apply_validation_rule(booking, rule):
                return False

        return True
```

### 6. Contract Management

```yaml
contract_management:
  contract_types_from_config:
    - fixed_monthly
    - volume_based
    - route_specific
    - dedicated_fleet

  contract_processing:
    retrieve_terms: From configuration service
    apply_rates: From contract configuration
    calculate_commitment: Based on configured rules
    enforce_sla: From SLA configuration

  recurring_bookings:
    schedule: From contract configuration
    auto_create: Based on configured rules
    pricing: From contract rates
```

### 7. Credit Management

```yaml
credit_management:
  credit_check:
    limits: From configuration service per tenant
    payment_terms: From configuration service
    risk_assessment: Based on configured rules

  credit_enforcement:
    block_threshold: From configuration
    warning_threshold: From configuration
    grace_period: From configuration
```

### 8. Monitoring and Alerts

```yaml
monitoring:
  custom_metrics:
    - bookings_created_per_minute
    - average_matching_time
    - price_calculation_latency
    - cancellation_rate
    - configuration_fetch_latency

  alerts_based_on_config:
    - booking_failure_rate: Threshold from config
    - matching_efficiency: Threshold from config
    - pricing_errors: Threshold from config
```

### 9. API Response Structure

```json
{
  "booking_id": "{{generated}}",
  "status": "confirmed",
  "price": {
    "amount": "{{calculated_from_config}}",
    "currency": "{{from_config}}",
    "breakdown": {
      "base": "{{from_config}}",
      "distance": "{{from_config}}",
      "surge": "{{from_config}}",
      "tax": "{{from_config}}"
    }
  },
  "configuration_version": "{{version_used}}",
  "timestamp": "{{ISO8601}}"
}
```

### 10. Anti-Patterns to Avoid

```yaml
never_do:
  - Hardcode pricing values in code
  - Embed business rules in Lambda functions
  - Store configuration in environment variables
  - Use magic numbers for thresholds
  - Hardcode tax rates or fees
  - Embed material types in code
  - Fix surge multipliers
  - Hardcode distance calculations
  - Set static timeout values
  - Use fixed retry counts

always_do:
  - Fetch ALL values from configuration service
  - Cache configurations appropriately
  - Version configuration usage
  - Audit configuration access
  - Handle configuration service failures gracefully
```

### 11. Testing Requirements

```yaml
testing:
  configuration_mocking:
    - Mock configuration service responses
    - Test with various configuration values
    - Validate configuration schema compliance

  test_scenarios:
    - Configuration service unavailable
    - Invalid configuration values
    - Configuration update during processing
    - Multi-tenant configuration isolation
```

### 12. Deployment Configuration

```yaml
deployment:
  environment_variables:
    CONFIG_SERVICE_URL: "{{from_parameter_store}}"
    ENVIRONMENT: "{{environment}}"
    SERVICE_NAME: "booking-service"
    # NO business values in environment variables

  infrastructure_as_code:
    # All values parameterized
    - No hardcoded ARNs
    - No hardcoded bucket names
    - No hardcoded table names
```

## Success Criteria
- Zero hardcoded business values
- 100% configuration-driven pricing
- All thresholds from configuration service
- Complete audit trail for pricing decisions
- < 200ms booking creation latency
- 99.99% service availability
- Full multi-tenant isolation