# Enterprise Configuration Service - Production Ready Template

## Service Overview
Generate a centralized configuration service for managing all application configurations, business rules, and feature flags across the UberTruck platform. ABSOLUTELY NO hardcoded values, durations, or thresholds allowed. Complete audit trails and environment-specific management required.

## ⚠️ CRITICAL REQUIREMENT
**ZERO HARDCODED VALUES POLICY**
- Every numeric value MUST be parameterized
- Every duration/TTL MUST come from environment or defaults
- Every threshold MUST be externalized
- NO hardcoded retention periods, cache times, or limits

## Core Requirements

### 1. Architecture Specifications
Generate a serverless configuration service with the following capabilities:
- Centralized configuration storage using AWS Systems Manager Parameter Store
- Hierarchical configuration organization by service/environment/type
- Version control with rollback capabilities
- Change approval workflow integration
- Real-time configuration updates without deployment
- Multi-tenant configuration support
- Configuration validation against JSON schemas
- Audit logging for all configuration access and changes
- **ALL operational parameters from environment variables or defaults**

### 2. Configuration Hierarchy
Implement the following configuration structure:
```
/{{tenant_id}}/
  /global/
    /security/          # Security configurations
    /compliance/        # Regulatory settings
    /features/          # Feature flags
  /services/
    /{{service_name}}/
      /{{environment}}/
        /business/      # Business rules and logic
        /technical/     # Technical configurations
        /integration/   # External service configs
```

### 3. Lambda Functions Required

#### 3.1 Configuration Retrieval
```yaml
function_requirements:
  get_configuration:
    purpose: Retrieve configuration with caching and validation
    inputs:
      - tenant_id: string (from JWT claims)
      - service_name: string
      - environment: string (dev|staging|production)
      - config_path: string
      - version: string (optional, defaults to latest)
    processing:
      - Validate requester permissions
      - Check cache (TTL from ENV:CONFIG_CACHE_TTL_SECONDS or default)
      - Retrieve from Parameter Store/AppConfig
      - Validate against schema
      - Audit log the access
      - Return configuration with metadata
    outputs:
      - configuration: object
      - version: string
      - last_modified: timestamp
      - checksum: string

    environment_variables:
      CONFIG_CACHE_TTL_SECONDS:
        description: Cache TTL in seconds
        default: "${ENV:CONFIG_CACHE_TTL_SECONDS:-300}"
        source: Environment variable or use 300 as default

      CONFIG_MAX_CACHE_SIZE_MB:
        description: Maximum cache size
        default: "${ENV:CONFIG_MAX_CACHE_SIZE_MB:-10}"
        source: Environment variable or use 10 as default

    error_handling:
      - Missing configuration: Return defaults with warning
      - Invalid schema: Reject and alert
      - Unauthorized: Log and reject
```

#### 3.2 Configuration Update
```yaml
function_requirements:
  update_configuration:
    purpose: Update configuration with validation and approval
    inputs:
      - tenant_id: string
      - service_name: string
      - environment: string
      - config_path: string
      - configuration: object
      - change_ticket: string
      - approval_token: string (for production)
    processing:
      - Validate change ticket
      - Check approval requirements
      - Validate configuration against schema
      - Create backup of current configuration
      - Apply configuration change
      - Invalidate caches
      - Trigger dependent service notifications
      - Audit log the change
    outputs:
      - success: boolean
      - version: string
      - backup_id: string
      - rollback_token: string

    backup_retention:
      source: "${ENV:CONFIG_BACKUP_RETENTION_DAYS}"
      description: Days to retain configuration backups
      default_if_not_set: Determined by compliance requirements

    rollback_capability:
      - Automatic on validation failure
      - Manual with rollback token
      - Restore from backup
```

#### 3.3 Schema Validation
```yaml
function_requirements:
  validate_configuration:
    purpose: Validate configuration against defined schemas
    inputs:
      - configuration: object
      - schema_id: string
      - strict_mode: boolean
    processing:
      - Load JSON schema
      - Validate configuration structure
      - Check required fields
      - Validate data types
      - Check value ranges/constraints
      - Validate cross-field dependencies
    outputs:
      - valid: boolean
      - errors: array of validation errors
      - warnings: array of warnings
```

### 4. Data Storage Requirements

#### 4.1 Parameter Store Structure
```yaml
parameter_store:
  naming_convention: /ubertruck/{{tenant_id}}/{{service}}/{{env}}/{{config_type}}/{{key}}

  encryption: AWS KMS Customer Managed Keys

  parameter_types:
    - Standard: Non-sensitive configurations
    - SecureString: Sensitive data (encrypted)

  tagging:
    - Environment: dev|staging|production
    - Service: service name
    - Tenant: tenant identifier
    - ChangeTicket: change request number
    - LastModified: timestamp
    - ModifiedBy: user identifier
```

#### 4.2 Configuration Audit Table (DynamoDB)
```yaml
table_structure:
  partition_key: config_path
  sort_key: timestamp

  attributes:
    - config_path: string
    - timestamp: string
    - action: string (CREATE|UPDATE|DELETE|ACCESS)
    - tenant_id: string
    - service_name: string
    - environment: string
    - user_id: string
    - change_ticket: string
    - old_value: string (encrypted)
    - new_value: string (encrypted)
    - ip_address: string
    - user_agent: string

  global_secondary_indexes:
    - user-activity-index: (user_id, timestamp)
    - change-ticket-index: (change_ticket, timestamp)

  retention:
    source: "${ENV:AUDIT_RETENTION_DAYS}"
    description: Audit log retention period
    compliance_note: Set according to regulatory requirements

  encryption: At rest using KMS
  point_in_time_recovery: Enabled
```

### 5. Configuration Templates

#### 5.1 Pricing Configuration Template
```json
{
  "schema_version": "1.0",
  "service": "booking",
  "type": "pricing",
  "configuration": {
    "base_rates": {
      "description": "Base pricing per material type",
      "values": "RETRIEVE_FROM_CONFIG_SERVICE",
      "unit": "INR/ton",
      "update_frequency": "RETRIEVE_FROM_CONFIG_SERVICE",
      "approval_required": true
    },
    "distance_rates": {
      "description": "Distance-based pricing",
      "values": "RETRIEVE_FROM_CONFIG_SERVICE",
      "unit": "INR/km/ton",
      "update_frequency": "RETRIEVE_FROM_CONFIG_SERVICE"
    },
    "surge_pricing": {
      "enabled": "RETRIEVE_FROM_CONFIG_SERVICE",
      "rules": "RETRIEVE_FROM_CONFIG_SERVICE",
      "max_multiplier": "RETRIEVE_FROM_CONFIG_SERVICE"
    },
    "discounts": {
      "bulk_discount": "RETRIEVE_FROM_CONFIG_SERVICE",
      "loyalty_discount": "RETRIEVE_FROM_CONFIG_SERVICE",
      "seasonal_offers": "RETRIEVE_FROM_CONFIG_SERVICE"
    }
  }
}
```

### 6. Integration Patterns

#### 6.1 Service Integration
```python
# Configuration client template - NO HARDCODED VALUES
import os
from typing import Dict, Optional

class ConfigurationClient:
    """
    Configuration client for service integration
    ALL values including cache TTL are externalized
    """

    def __init__(self, service_name: str, environment: str):
        self.service_name = service_name
        self.environment = environment
        self.cache = {}

        # Get cache TTL from environment, with default fallback
        # NEVER hardcode: self.cache_ttl = 300
        self.cache_ttl = int(os.environ.get('CONFIG_CACHE_TTL_SECONDS', '300'))

        # Get cache size from environment
        self.max_cache_size = int(os.environ.get('CONFIG_MAX_CACHE_SIZE_MB', '10'))

    def get_config(self, config_path: str) -> dict:
        """
        Retrieve configuration from centralized service
        NO HARDCODED DEFAULTS - all from environment or config service
        """
        # Check if cache TTL should be refreshed
        cache_override_ttl = os.environ.get(f'CONFIG_CACHE_TTL_{config_path.upper()}')
        if cache_override_ttl:
            effective_ttl = int(cache_override_ttl)
        else:
            effective_ttl = self.cache_ttl

        # Implementation continues with no hardcoded values
        return self._fetch_with_cache(config_path, effective_ttl)

    def get_pricing_rules(self) -> dict:
        """
        Retrieve pricing configuration
        ALL VALUES FROM CONFIGURATION SERVICE
        """
        return self.get_config('business/pricing')

    def get_service_limits(self) -> dict:
        """
        Retrieve service limits and quotas
        ALL VALUES FROM CONFIGURATION SERVICE
        """
        return self.get_config('technical/limits')
```

### 7. Environment Variables Required
```yaml
# Configuration service operational parameters
# These are the ONLY environment variables allowed

environment_variables:
  CONFIG_SERVICE_URL:
    description: Configuration service endpoint
    example: "https://config.internal.ubertruck.com"
    required: true

  AWS_REGION:
    description: AWS region
    example: "ap-south-1"
    required: true

  ENVIRONMENT:
    description: Deployment environment
    values: ["development", "staging", "production"]
    required: true

  SERVICE_NAME:
    description: Service identifier
    example: "booking-service"
    required: true

  # Optional operational parameters
  CONFIG_CACHE_TTL_SECONDS:
    description: Default cache TTL in seconds
    default: "300"
    required: false

  CONFIG_MAX_CACHE_SIZE_MB:
    description: Maximum cache size in MB
    default: "10"
    required: false

  AUDIT_RETENTION_DAYS:
    description: Audit log retention in days
    default: Determined by compliance requirements
    required: false

  CONFIG_BACKUP_RETENTION_DAYS:
    description: Configuration backup retention
    default: Determined by operational requirements
    required: false

# NO OTHER HARDCODED VALUES ALLOWED
```

### 8. Caching Strategy (Fully Configurable)
```yaml
caching:
  levels:
    lambda_memory:
      ttl: "${ENV:LAMBDA_CACHE_TTL_SECONDS}"
      description: Hot cache in Lambda memory

    elasticache:
      ttl: "${ENV:ELASTICACHE_TTL_SECONDS}"
      description: Warm cache in ElastiCache

    parameter_store:
      description: Persistent cold storage

  invalidation:
    - On configuration update
    - On cache TTL expiry (configurable)
    - Manual invalidation API

  patterns:
    - Cache-aside for reads
    - Write-through for updates
    - Lazy loading for cold starts

  configuration:
    # ALL cache parameters from environment or config service
    default_ttl: "${ENV:DEFAULT_CACHE_TTL}"
    max_size: "${ENV:MAX_CACHE_SIZE}"
    eviction_policy: "${ENV:CACHE_EVICTION_POLICY}"
```

### 9. Security Requirements
```yaml
security:
  encryption:
    - At rest: AWS KMS CMK
    - In transit: TLS 1.3
    - Sensitive data: Additional application-level encryption

  access_control:
    - IAM role-based access
    - Service-to-service authentication
    - Audit logging for all operations

  compliance:
    - Configuration change approval workflow
    - Audit trail retention per regulatory requirements
    - Data residency compliance
    - Sensitive data masking in logs

  retention_policies:
    # ALL retention periods from environment/config
    audit_logs: "${ENV:AUDIT_RETENTION_DAYS}"
    backups: "${ENV:BACKUP_RETENTION_DAYS}"
    archives: "${ENV:ARCHIVE_RETENTION_DAYS}"
```

### 10. Monitoring and Alerts
```yaml
monitoring:
  metrics:
    - configuration_retrieval_count
    - configuration_update_count
    - cache_hit_ratio
    - validation_failure_rate
    - average_retrieval_latency

  alerts:
    - Configuration update failures
    - High validation error rate
    - Cache performance degradation
    - Unauthorized access attempts
    - Schema validation failures

  thresholds:
    # ALL thresholds from configuration
    error_rate: "${CONFIG:monitoring/thresholds/error_rate}"
    latency_p99: "${CONFIG:monitoring/thresholds/latency_p99}"
    cache_miss_rate: "${CONFIG:monitoring/thresholds/cache_miss_rate}"

  dashboards:
    - Configuration usage by service
    - Change frequency analysis
    - Error rate trends
    - Performance metrics
```

### 11. Anti-Patterns to Avoid
```yaml
avoid:
  - NEVER hardcode configuration values in code
  - NEVER hardcode cache TTL values
  - NEVER hardcode retention periods
  - NEVER store secrets in configuration
  - NEVER bypass validation
  - NEVER allow direct Parameter Store access from services
  - NEVER mix configurations across environments
  - NEVER delete configuration history
  - NEVER skip audit logging
  - NEVER cache sensitive data in logs

specifically_forbidden:
  - "cache_ttl = 300"  # NEVER hardcode
  - "retention = 7"    # NEVER hardcode
  - "max_size = 10"    # NEVER hardcode
  - "5 minutes"        # NEVER use literal durations
  - "30 days"          # NEVER use literal periods
```

### 12. Validation Rules
```yaml
validation:
  pre_deployment:
    - Scan for numeric literals
    - Check for hardcoded durations
    - Verify all values reference environment or config
    - Validate schema compliance

  runtime:
    - Type validation
    - Range validation
    - Format validation
    - Cross-field validation

  compliance:
    - No hardcoded values: ENFORCED
    - All configs traceable: REQUIRED
    - Audit trail complete: MANDATORY
```

## Success Criteria
- **ZERO hardcoded configuration values in any service**
- **ZERO hardcoded cache TTLs or durations**
- **100% configuration retrieval through service**
- Complete audit trail for all changes
- < 50ms configuration retrieval latency (threshold from config)
- Service availability target from configuration
- Full compliance with data governance policies