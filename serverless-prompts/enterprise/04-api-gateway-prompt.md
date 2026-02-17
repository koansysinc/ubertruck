# Enterprise API Gateway - Serverless Implementation Prompt

## Service Overview
Generate a comprehensive API Gateway implementation for the UberTruck platform with dynamic rate limiting, request validation, authentication integration, and complete monitoring. ALL limits, quotas, and configurations must be retrieved from the configuration service.

## Core Requirements

### 1. Architecture Specifications
Generate a serverless API Gateway with:
- Dynamic rate limiting per tenant/user
- Request/response validation
- Authentication and authorization integration
- API versioning strategy
- Request transformation and enrichment
- Response caching
- CORS configuration
- Complete request tracing
- Zero hardcoded limits or quotas

### 2. API Gateway Configuration

#### 2.1 Gateway Setup
```yaml
api_gateway_configuration:
  deployment:
    stages:
      - development
      - staging
      - production

  endpoint_configuration:
    type: REGIONAL  # or EDGE for global
    vpc_link: optional for private integration

  domain:
    custom_domain: "{{from_configuration}}"
    certificate: ACM certificate ARN
    base_path_mapping:
      v1: production_stage
      v2: beta_stage

  api_versioning:
    strategy: path_based  # /v1/, /v2/
    deprecation_policy: From configuration
    sunset_headers: true
```

#### 2.2 Rate Limiting Configuration
```yaml
rate_limiting:
  # ALL values from configuration service
  global_limits:
    burst_limit: "{{from_config}}"
    rate_limit: "{{from_config}}"

  usage_plans:
    basic:
      description: Basic tier customers
      throttle:
        burst_limit: "{{config:/api/plans/basic/burst}}"
        rate_limit: "{{config:/api/plans/basic/rate}}"
      quota:
        limit: "{{config:/api/plans/basic/quota}}"
        period: "{{config:/api/plans/basic/period}}"

    premium:
      description: Premium tier customers
      throttle:
        burst_limit: "{{config:/api/plans/premium/burst}}"
        rate_limit: "{{config:/api/plans/premium/rate}}"
      quota:
        limit: "{{config:/api/plans/premium/quota}}"
        period: "{{config:/api/plans/premium/period}}"

    enterprise:
      description: Enterprise customers
      throttle:
        burst_limit: "{{config:/api/plans/enterprise/burst}}"
        rate_limit: "{{config:/api/plans/enterprise/rate}}"
      quota:
        limit: "{{config:/api/plans/enterprise/quota}}"
        period: "{{config:/api/plans/enterprise/period}}"

  per_method_limits:
    "POST /bookings":
      burst: "{{config:/api/limits/booking/create/burst}}"
      rate: "{{config:/api/limits/booking/create/rate}}"
    "GET /tracking":
      burst: "{{config:/api/limits/tracking/get/burst}}"
      rate: "{{config:/api/limits/tracking/get/rate}}"
```

### 3. Request Processing Pipeline

#### 3.1 Request Validation
```yaml
request_validation:
  validators:
    request_validator:
      validate_request_body: true
      validate_request_parameters: true

  validation_models:
    booking_request:
      schema:
        $ref: "{{config:/api/schemas/booking/create}}"

    payment_request:
      schema:
        $ref: "{{config:/api/schemas/payment/initiate}}"

  error_responses:
    400:
      response_templates:
        application/json: |
          {
            "error": "Bad Request",
            "message": "$context.error.validationErrorString",
            "requestId": "$context.requestId",
            "timestamp": "$context.requestTime"
          }
```

#### 3.2 Request Transformation
```yaml
request_transformation:
  request_templates:
    application/json:
      # Enrich request with context
      template: |
        {
          "body": $input.json('$'),
          "context": {
            "requestId": "$context.requestId",
            "apiKey": "$context.identity.apiKey",
            "sourceIp": "$context.identity.sourceIp",
            "userAgent": "$context.identity.userAgent",
            "requestTime": "$context.requestTime",
            "stage": "$context.stage",
            "tenant": "$context.authorizer.tenantId",
            "user": "$context.authorizer.userId",
            "roles": "$context.authorizer.roles",
            "permissions": "$context.authorizer.permissions"
          },
          "headers": {
            #foreach($header in $input.params().header.keySet())
              "$header": "$util.escapeJavaScript($input.params().header.get($header))"
              #if($foreach.hasNext),#end
            #end
          }
        }
```

### 4. Authentication & Authorization Integration

#### 4.1 Lambda Authorizer
```yaml
lambda_authorizer:
  function_name: api-authorizer
  type: REQUEST
  identity_sources:
    - Authorization header
    - API Key header

  caching:
    ttl: "{{config:/api/auth/cache_ttl}}"  # From configuration

  authorization_logic:
    - Extract JWT token
    - Validate token signature
    - Check token expiration
    - Extract claims
    - Verify permissions
    - Check rate limits
    - Return policy document

  response_format:
    principalId: user_id
    policyDocument:
      Version: "2012-10-17"
      Statement:
        - Effect: Allow/Deny
          Action: execute-api:Invoke
          Resource: "arn:aws:execute-api:*"
    context:
      tenantId: "{{from_token}}"
      userId: "{{from_token}}"
      roles: "{{from_token}}"
      permissions: "{{from_token}}"
      rateLimit: "{{from_config}}"
```

### 5. Response Configuration

#### 5.1 Response Headers
```yaml
response_headers:
  method_response_headers:
    Access-Control-Allow-Origin: true
    Access-Control-Allow-Headers: true
    Access-Control-Allow-Methods: true
    X-Request-Id: true
    X-RateLimit-Limit: true
    X-RateLimit-Remaining: true
    X-RateLimit-Reset: true

  integration_response_headers:
    Access-Control-Allow-Origin: "'{{config:/api/cors/allowed_origins}}'"
    X-Request-Id: integration.response.header.x-request-id
    X-RateLimit-Limit: "$context.authorizer.rateLimit"
    X-RateLimit-Remaining: "$context.authorizer.rateLimitRemaining"
    X-RateLimit-Reset: "$context.authorizer.rateLimitReset"
```

#### 5.2 Error Responses
```yaml
gateway_responses:
  DEFAULT_4XX:
    response_templates:
      application/json: |
        {
          "error": "$context.error.responseType",
          "message": "$context.error.message",
          "requestId": "$context.requestId",
          "timestamp": "$context.requestTime"
        }
    response_headers:
      Access-Control-Allow-Origin: "'*'"

  QUOTA_EXCEEDED:
    status_code: 429
    response_templates:
      application/json: |
        {
          "error": "Too Many Requests",
          "message": "API quota exceeded",
          "retryAfter": "$context.authorizer.rateLimitReset",
          "requestId": "$context.requestId"
        }

  UNAUTHORIZED:
    status_code: 401
    response_templates:
      application/json: |
        {
          "error": "Unauthorized",
          "message": "Invalid or missing authentication",
          "requestId": "$context.requestId"
        }
```

### 6. Caching Configuration

```yaml
caching:
  cache_cluster:
    size: "{{config:/api/cache/size}}"  # From configuration
    ttl: "{{config:/api/cache/ttl}}"     # From configuration

  cache_key_parameters:
    - method.request.path.id
    - method.request.querystring.filter
    - method.request.header.Authorization

  cacheable_methods:
    GET: true
    HEAD: true
    OPTIONS: true

  cache_invalidation:
    on_update: true
    on_delete: true
```

### 7. Monitoring & Logging

#### 7.1 CloudWatch Integration
```yaml
cloudwatch:
  access_logging:
    format: |
      {
        "requestId": "$context.requestId",
        "extendedRequestId": "$context.extendedRequestId",
        "apiId": "$context.apiId",
        "resourcePath": "$context.resourcePath",
        "httpMethod": "$context.httpMethod",
        "status": "$context.status",
        "latency": "$context.responseLatency",
        "responseLength": "$context.responseLength",
        "error": "$context.error.message",
        "userAgent": "$context.identity.userAgent",
        "sourceIp": "$context.identity.sourceIp",
        "requestTime": "$context.requestTime",
        "tenantId": "$context.authorizer.tenantId",
        "userId": "$context.authorizer.userId"
      }

  metrics:
    detailed_metrics: true
    data_trace_enabled: true
    logging_level: "{{config:/api/logging/level}}"
```

#### 7.2 X-Ray Tracing
```yaml
xray_tracing:
  enabled: true
  sampling_rule: "{{config:/api/tracing/sampling_rate}}"
```

### 8. API Documentation

```yaml
api_documentation:
  openapi_spec:
    version: 3.0.0
    auto_generate: true

  documentation_parts:
    - location:
        type: API
      properties:
        description: UberTruck API
        version: "{{from_config}}"

    - location:
        type: METHOD
        method: POST
        path: /bookings
      properties:
        description: Create new booking
        request_schema: "{{ref:BookingRequest}}"
        response_schema: "{{ref:BookingResponse}}"
```

### 9. Security Configuration

```yaml
security:
  waf_integration:
    enabled: true
    rules:
      - SQLi protection
      - XSS protection
      - Rate-based rules
      - IP reputation lists
      - Geographic restrictions from config

  api_keys:
    required_for:
      - Service-to-service calls
      - External integrations
    rotation: "{{config:/api/keys/rotation_days}}"

  ssl_configuration:
    minimum_tls_version: TLS_1_2
    certificate_validation: FULL
```

### 10. Integration Patterns

#### 10.1 Lambda Integration
```yaml
lambda_integration:
  integration_type: AWS_PROXY

  integration_request:
    passthrough_behavior: WHEN_NO_MATCH
    timeout: "{{config:/api/timeouts/lambda}}"

  error_handling:
    retry_attempts: "{{config:/api/retry/attempts}}"
    retry_delay: "{{config:/api/retry/delay}}"
```

#### 10.2 HTTP Integration
```yaml
http_integration:
  integration_type: HTTP_PROXY

  connection:
    type: VPC_LINK
    timeout: "{{config:/api/timeouts/http}}"

  circuit_breaker:
    threshold: "{{config:/api/circuit_breaker/threshold}}"
    timeout: "{{config:/api/circuit_breaker/timeout}}"
```

### 11. Deployment Configuration

```yaml
deployment:
  stage_variables:
    lambdaAlias: "${stageVariables.lambdaAlias}"
    configPath: "${stageVariables.configPath}"

  canary_settings:
    percentage_traffic: "{{config:/api/canary/traffic_percentage}}"
    use_stage_cache: false

  deployment_validation:
    - Validate all integrations
    - Check authentication
    - Verify rate limits
    - Test error responses
```

### 12. Cost Optimization

```yaml
cost_optimization:
  caching_strategy:
    - Cache frequently accessed GET endpoints
    - Use appropriate TTL values

  request_optimization:
    - Enable compression
    - Minimize response payloads

  monitoring:
    - Track API usage by endpoint
    - Monitor cache hit rates
    - Analyze request patterns
```

### 13. Multi-Tenant Support

```yaml
multi_tenant:
  tenant_identification:
    source: JWT claims
    header: X-Tenant-ID

  tenant_isolation:
    - Separate usage plans per tenant
    - Tenant-specific rate limits
    - Isolated monitoring

  configuration_per_tenant:
    rate_limits: "/tenant/{{tenant_id}}/api/limits"
    allowed_origins: "/tenant/{{tenant_id}}/api/cors"
    features: "/tenant/{{tenant_id}}/api/features"
```

### 14. Implementation Template

```python
# API Gateway configuration template
class APIGatewayConfig:
    """
    ALL configuration from external service
    NO HARDCODED VALUES
    """

    def __init__(self, environment: str):
        self.environment = environment
        self.config_client = ConfigurationClient(
            service='api-gateway',
            environment=environment
        )

    def get_rate_limits(self, tenant_id: str, user_type: str) -> dict:
        """
        Dynamic rate limits from configuration
        """
        # NEVER: return {"burst": 100, "rate": 50}  # WRONG!

        # ALWAYS: Get from configuration
        limits_config = self.config_client.get_config(
            f'tenants/{tenant_id}/rate_limits/{user_type}'
        )
        return limits_config

    def get_validation_schema(self, endpoint: str) -> dict:
        """
        Get validation schema from configuration
        """
        return self.config_client.get_config(
            f'schemas/{endpoint}'
        )
```

## Success Criteria
- Zero hardcoded rate limits or quotas
- 100% configuration-driven limits
- All validation schemas from configuration
- Complete request tracing
- < 10ms gateway latency
- 99.99% gateway availability
- Full multi-tenant isolation