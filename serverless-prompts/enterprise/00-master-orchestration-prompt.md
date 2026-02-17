# Master Orchestration Template - Enterprise Serverless Platform

## Overview
This master template orchestrates the generation of a complete enterprise-grade serverless platform for UberTruck. Use this template to ensure all services follow enterprise standards with ZERO hardcoded values, complete configuration management, and production-ready patterns.

## System Architecture Blueprint

### Core Principles
1. **Zero Hardcoded Values**: Every business value, threshold, and configuration MUST come from the configuration service
2. **Complete Audit Trail**: Every operation must be logged with full context
3. **Multi-Tenant Isolation**: Complete data and configuration isolation per tenant
4. **Security First**: Authentication, authorization, and encryption at every layer
5. **Configuration Driven**: All business logic externalized to configuration service

## Service Generation Order

### Phase 1: Foundation Services (Must be created first)
```yaml
foundation_services:
  1_configuration_service:
    template: 01-configuration-service-prompt.md
    purpose: Centralized configuration management
    priority: CRITICAL
    dependencies: none

  2_auth_service:
    template: 02-auth-service-prompt.md
    purpose: Authentication and authorization
    priority: CRITICAL
    dependencies:
      - configuration_service

  3_secrets_management:
    purpose: Secure secrets storage and rotation
    priority: CRITICAL
    dependencies:
      - configuration_service

  4_api_gateway:
    template: 04-api-gateway-prompt.md
    purpose: API management and rate limiting
    priority: CRITICAL
    dependencies:
      - configuration_service
      - auth_service
```

### Phase 2: Core Business Services
```yaml
business_services:
  booking_service:
    template: 03-booking-service-prompt.md
    dependencies:
      - configuration_service
      - auth_service
      - api_gateway

  tracking_service:
    dependencies:
      - configuration_service
      - auth_service
      - api_gateway

  payment_service:
    dependencies:
      - configuration_service
      - auth_service
      - secrets_management

  notification_service:
    dependencies:
      - configuration_service
      - auth_service
```

### Phase 3: Supporting Services
```yaml
supporting_services:
  observability_service:
    purpose: Monitoring, logging, and tracing
    dependencies:
      - all_core_services

  ci_cd_pipeline:
    purpose: Deployment automation
    dependencies:
      - all_services
```

## Configuration Hierarchy Standard

### Required Configuration Structure for ALL Services
```yaml
/{{tenant_id}}/
  /global/
    /security/
      - authentication_rules
      - authorization_policies
      - encryption_settings
    /compliance/
      - data_retention
      - audit_requirements
      - regulatory_settings
    /operational/
      - rate_limits
      - timeouts
      - retry_policies

  /services/
    /{{service_name}}/
      /{{environment}}/
        /business/
          - business_rules
          - pricing_models
          - sla_definitions
        /technical/
          - performance_thresholds
          - scaling_policies
          - circuit_breakers
        /integration/
          - external_apis
          - service_endpoints
          - api_keys_reference
```

## Code Generation Standards

### 1. Function Template Pattern
```python
# STANDARD PATTERN FOR ALL FUNCTIONS
import os
from typing import Dict, Any
from aws_lambda_powertools import Logger, Metrics, Tracer
from config_client import ConfigurationClient

logger = Logger()
metrics = Metrics()
tracer = Tracer()

class ServiceHandler:
    def __init__(self):
        # Initialize configuration client
        self.config_client = ConfigurationClient(
            service=os.environ['SERVICE_NAME'],
            environment=os.environ['ENVIRONMENT']
        )
        # NO HARDCODED VALUES IN INIT

    @tracer.capture_lambda_handler
    @metrics.log_metrics
    def handler(self, event: Dict, context: Any) -> Dict:
        """
        Main Lambda handler
        ALL business logic from configuration
        """
        # Extract context
        tenant_id = event['context']['tenant_id']
        user_id = event['context']['user_id']
        request_id = event['context']['request_id']

        # Get configuration for this request
        config = self.config_client.get_config(
            path=f'tenants/{tenant_id}/business/rules'
        )

        # Process with configuration
        # NEVER hardcode business logic
        result = self.process_with_config(event['body'], config)

        # Audit log
        self.audit_log({
            'action': 'OPERATION_COMPLETED',
            'tenant_id': tenant_id,
            'user_id': user_id,
            'request_id': request_id,
            'config_version': config['version']
        })

        return result
```

### 2. Service Integration Pattern
```python
# STANDARD PATTERN FOR SERVICE INTEGRATION
class ServiceIntegration:
    """
    Template for inter-service communication
    """

    def __init__(self, service_name: str):
        self.service_name = service_name
        self.endpoint = self._get_endpoint_from_config()
        self.timeout = self._get_timeout_from_config()
        self.retry_policy = self._get_retry_policy_from_config()

    def call_service(self, operation: str, data: Dict) -> Dict:
        """
        Call another service with full configuration
        """
        # Get operation configuration
        op_config = self.config_client.get_config(
            f'integrations/{self.service_name}/{operation}'
        )

        # Apply all configurations
        return self._execute_with_config(data, op_config)
```

## Environment Variables Standard

### Allowed Environment Variables (ONLY THESE)
```yaml
allowed_env_vars:
  SERVICE_NAME:
    description: Name of the service
    example: booking-service

  ENVIRONMENT:
    description: Deployment environment
    values: [development, staging, production]

  CONFIG_SERVICE_URL:
    description: Configuration service endpoint
    source: Parameter Store

  AWS_REGION:
    description: AWS region
    example: ap-south-1

  LOG_LEVEL:
    description: Logging level
    values: [DEBUG, INFO, WARNING, ERROR]

forbidden_patterns:
  - BASE_RATE=500  # NEVER hardcode business values
  - TAX_RATE=0.18  # NEVER hardcode rates
  - RETRY_COUNT=3   # NEVER hardcode operational values
  - TIMEOUT=30      # NEVER hardcode timeouts
```

## Validation Checklist

### Pre-Deployment Validation
```yaml
validation_checklist:
  configuration:
    - [ ] No hardcoded values in code
    - [ ] All configs retrieved from service
    - [ ] Configuration schemas defined
    - [ ] Fallback values configured

  security:
    - [ ] Authentication on all endpoints
    - [ ] Authorization checks implemented
    - [ ] Encryption at rest and transit
    - [ ] Secrets in secrets manager

  monitoring:
    - [ ] Metrics configured
    - [ ] Logging implemented
    - [ ] Tracing enabled
    - [ ] Alerts configured

  testing:
    - [ ] Unit tests > 80% coverage
    - [ ] Integration tests written
    - [ ] Load tests performed
    - [ ] Security scan passed

  compliance:
    - [ ] Audit logging complete
    - [ ] Data retention configured
    - [ ] GDPR compliance checked
    - [ ] Multi-tenant isolation verified
```

## Error Handling Standard

```python
# STANDARD ERROR HANDLING PATTERN
def handle_operation(self, data: Dict) -> Dict:
    try:
        # Get configuration with fallback
        config = self.get_config_with_fallback('operation/config')

        # Process operation
        result = self.process(data, config)

        # Success metric
        self.metrics.add_metric('OperationSuccess', 1)

        return {
            'statusCode': 200,
            'body': result
        }

    except ConfigurationError as e:
        # Configuration service error
        logger.error(f"Configuration error: {e}")
        self.metrics.add_metric('ConfigurationError', 1)

        # Use fallback configuration
        return self.handle_with_fallback(data)

    except ValidationError as e:
        # Input validation error
        logger.warning(f"Validation error: {e}")
        self.metrics.add_metric('ValidationError', 1)

        return {
            'statusCode': 400,
            'error': 'Validation failed',
            'details': str(e)
        }

    except Exception as e:
        # Unexpected error
        logger.error(f"Unexpected error: {e}")
        self.metrics.add_metric('UnexpectedError', 1)

        return {
            'statusCode': 500,
            'error': 'Internal server error',
            'requestId': context.request_id
        }
```

## Monitoring Standard

```yaml
standard_metrics:
  operational:
    - invocation_count
    - error_rate
    - latency_p50
    - latency_p99
    - cold_start_count

  business:
    - operations_per_minute
    - success_rate
    - configuration_cache_hit_rate

  security:
    - authentication_failures
    - authorization_denials
    - suspicious_activity_count

standard_alarms:
  error_rate_high:
    threshold: "{{config:/monitoring/alarms/error_rate}}"
    period: "{{config:/monitoring/alarms/period}}"

  latency_high:
    threshold: "{{config:/monitoring/alarms/latency}}"
    period: "{{config:/monitoring/alarms/period}}"
```

## Multi-Tenant Isolation

```python
# STANDARD MULTI-TENANT PATTERN
class MultiTenantHandler:
    def process_request(self, event: Dict) -> Dict:
        # Extract tenant from JWT
        tenant_id = event['context']['authorizer']['tenant_id']

        # Get tenant-specific configuration
        tenant_config = self.config_client.get_config(
            f'tenants/{tenant_id}/configuration'
        )

        # Apply tenant isolation
        query_filter = {'tenant_id': tenant_id}

        # Process with tenant context
        result = self.process_with_tenant_context(
            data=event['body'],
            tenant_id=tenant_id,
            config=tenant_config,
            filter=query_filter
        )

        return result
```

## Deployment Pipeline Standard

```yaml
deployment_stages:
  1_validate:
    - Scan for hardcoded values
    - Validate configuration schemas
    - Check security compliance

  2_test:
    - Run unit tests
    - Run integration tests
    - Execute security scans

  3_deploy_staging:
    - Deploy to staging
    - Run smoke tests
    - Performance validation

  4_deploy_production:
    - Blue-green deployment
    - Health checks
    - Automatic rollback on failure
```

## Success Metrics

```yaml
platform_success_criteria:
  configuration:
    - Zero hardcoded values: 100%
    - Configuration service uptime: 99.99%
    - Configuration retrieval latency: < 50ms

  security:
    - Authentication coverage: 100%
    - Authorization checks: 100%
    - Encryption coverage: 100%

  operational:
    - Service availability: 99.99%
    - API latency p99: < 200ms
    - Error rate: < 0.1%

  compliance:
    - Audit log coverage: 100%
    - Multi-tenant isolation: 100%
    - GDPR compliance: 100%
```

## Anti-Patterns Detector

```yaml
detect_antipatterns:
  code_scanning_rules:
    - pattern: 'rate\s*=\s*\d+'
      message: "Hardcoded rate detected"
      severity: CRITICAL

    - pattern: 'timeout\s*=\s*\d+'
      message: "Hardcoded timeout detected"
      severity: CRITICAL

    - pattern: 'api_key\s*=\s*["\']'
      message: "Hardcoded API key detected"
      severity: CRITICAL

    - pattern: 'if\s+tenant\s*==\s*["\']'
      message: "Hardcoded tenant logic detected"
      severity: CRITICAL
```

## Documentation Requirements

Each service MUST include:
1. API documentation (OpenAPI 3.0)
2. Configuration schema documentation
3. Integration guide
4. Security runbook
5. Monitoring guide
6. Troubleshooting guide

## Final Validation

Before considering any service complete:
- [ ] Passes all anti-pattern checks
- [ ] Zero hardcoded values verified
- [ ] Configuration service integration tested
- [ ] Multi-tenant isolation verified
- [ ] Security scan passed
- [ ] Performance benchmarks met
- [ ] Documentation complete

---

**USE THIS MASTER TEMPLATE TO ENSURE CONSISTENCY ACROSS ALL SERVICES**