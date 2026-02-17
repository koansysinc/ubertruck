# Enterprise REST API Standards - Production Template

## Overview
Generate REST APIs following enterprise standards with consistent patterns, proper HTTP semantics, comprehensive error handling, and complete OpenAPI documentation. ALL response codes, timeouts, and limits MUST come from configuration service.

## Core REST API Principles

### 1. Resource Naming Conventions
```yaml
resource_naming:
  pattern: /api/{version}/{resource}/{identifier}/{sub-resource}

  rules:
    - Use plural nouns for collections: /bookings, /vehicles, /drivers
    - Use lowercase with hyphens: /fleet-owners, /trip-reports
    - Avoid verbs in endpoints (use HTTP methods)
    - Use nested resources for relationships: /bookings/{id}/payments

  examples:
    collections:
      - GET /api/v1/bookings          # List bookings
      - POST /api/v1/bookings         # Create booking

    specific_resource:
      - GET /api/v1/bookings/{id}     # Get specific booking
      - PUT /api/v1/bookings/{id}     # Update booking
      - DELETE /api/v1/bookings/{id}  # Delete booking

    sub_resources:
      - GET /api/v1/bookings/{id}/payments    # Get booking payments
      - POST /api/v1/bookings/{id}/payments   # Add payment to booking

    filtering:
      - GET /api/v1/bookings?status=active&date=2024-01-01
      - GET /api/v1/bookings?sort=created_at:desc&limit=10&offset=20
```

### 2. HTTP Methods Semantics
```yaml
http_methods:
  GET:
    purpose: Retrieve resource(s)
    idempotent: true
    safe: true
    cacheable: true
    request_body: NO
    success_codes: [200]

  POST:
    purpose: Create new resource
    idempotent: false
    safe: false
    cacheable: false
    request_body: YES
    success_codes: [201, 202]

  PUT:
    purpose: Full update/replace resource
    idempotent: true
    safe: false
    cacheable: false
    request_body: YES
    success_codes: [200, 204]

  PATCH:
    purpose: Partial update resource
    idempotent: true
    safe: false
    cacheable: false
    request_body: YES
    success_codes: [200, 204]

  DELETE:
    purpose: Remove resource
    idempotent: true
    safe: false
    cacheable: false
    request_body: NO
    success_codes: [204, 202]

  OPTIONS:
    purpose: Get allowed methods
    idempotent: true
    safe: true
    cacheable: true
    request_body: NO
    success_codes: [200, 204]
```

### 3. Status Codes (Configuration Driven)
```yaml
status_codes:
  # Success codes
  200:
    meaning: OK
    use_when: Successful GET, PUT, PATCH
    body: Required

  201:
    meaning: Created
    use_when: Successful POST creating resource
    body: Required (created resource)
    headers:
      Location: URI of created resource

  202:
    meaning: Accepted
    use_when: Async processing initiated
    body: Optional (status info)

  204:
    meaning: No Content
    use_when: Successful DELETE, PUT with no return
    body: NO

  # Client errors
  400:
    meaning: Bad Request
    use_when: Invalid request syntax/parameters
    body: Error details required

  401:
    meaning: Unauthorized
    use_when: Missing/invalid authentication
    body: Error message
    headers:
      WWW-Authenticate: Challenge

  403:
    meaning: Forbidden
    use_when: Authenticated but not authorized
    body: Error message

  404:
    meaning: Not Found
    use_when: Resource doesn't exist
    body: Error message

  409:
    meaning: Conflict
    use_when: State conflict (duplicate, version mismatch)
    body: Conflict details

  422:
    meaning: Unprocessable Entity
    use_when: Validation errors
    body: Validation error details

  429:
    meaning: Too Many Requests
    use_when: Rate limit exceeded
    body: Rate limit info
    headers:
      X-RateLimit-Limit: config://api/rate_limits/limit
      X-RateLimit-Remaining: calculated
      X-RateLimit-Reset: timestamp
      Retry-After: seconds

  # Server errors
  500:
    meaning: Internal Server Error
    use_when: Unexpected server error
    body: Generic error (no internals)

  502:
    meaning: Bad Gateway
    use_when: Upstream service error
    body: Generic error

  503:
    meaning: Service Unavailable
    use_when: Temporary unavailability
    body: Maintenance info
    headers:
      Retry-After: seconds

  504:
    meaning: Gateway Timeout
    use_when: Upstream timeout
    body: Timeout info
```

### 4. Request/Response Headers
```yaml
standard_headers:
  request_headers:
    # Required
    Content-Type:
      values: [application/json, multipart/form-data]
      required: true for POST, PUT, PATCH

    Accept:
      values: [application/json]
      required: false
      default: application/json

    Authorization:
      format: Bearer {token}
      required: true for protected resources

    # Recommended
    X-Request-ID:
      format: UUID
      purpose: Request tracing
      required: recommended

    X-Tenant-ID:
      format: UUID
      purpose: Multi-tenant identification
      required: for multi-tenant APIs

    X-API-Version:
      format: semantic version
      purpose: Version override
      required: optional

  response_headers:
    # Always included
    Content-Type: application/json
    X-Request-ID: Echo from request or generate
    X-Response-Time: Processing time in ms

    # Conditional
    Location: For 201 Created
    ETag: For cacheable resources
    Last-Modified: For mutable resources
    Cache-Control: Caching directives

    # Rate limiting (from configuration)
    X-RateLimit-Limit: config://api/rate_limits/default
    X-RateLimit-Remaining: calculated
    X-RateLimit-Reset: timestamp

    # Pagination
    X-Total-Count: Total items for collection
    Link: Pagination links (first, last, next, prev)
```

### 5. Request/Response Formats
```yaml
request_format:
  content_type: application/json
  charset: UTF-8

  structure:
    single_resource:
      {
        "data": {
          "type": "booking",
          "attributes": {
            "pickup_location": {...},
            "drop_location": {...},
            "material_type": "coal",
            "quantity_mt": 100
          }
        }
      }

    bulk_operation:
      {
        "data": [
          {"type": "booking", "attributes": {...}},
          {"type": "booking", "attributes": {...}}
        ]
      }

response_format:
  success_single:
    {
      "data": {
        "id": "uuid",
        "type": "booking",
        "attributes": {...},
        "relationships": {...},
        "links": {
          "self": "/api/v1/bookings/uuid"
        }
      },
      "meta": {
        "timestamp": "ISO8601",
        "version": "1.0"
      }
    }

  success_collection:
    {
      "data": [...],
      "meta": {
        "pagination": {
          "total": 1000,
          "count": 20,
          "per_page": 20,
          "current_page": 1,
          "total_pages": 50
        }
      },
      "links": {
        "first": "...",
        "last": "...",
        "prev": null,
        "next": "..."
      }
    }

  error_format:
    {
      "errors": [
        {
          "id": "uuid",
          "status": "422",
          "code": "VALIDATION_ERROR",
          "title": "Validation Failed",
          "detail": "The quantity must be greater than 0",
          "source": {
            "pointer": "/data/attributes/quantity_mt"
          },
          "meta": {
            "timestamp": "ISO8601",
            "request_id": "uuid"
          }
        }
      ]
    }
```

### 6. Pagination Standards
```yaml
pagination:
  query_parameters:
    page:
      type: integer
      default: config://api/pagination/default_page
      min: 1

    per_page:
      type: integer
      default: config://api/pagination/default_size
      min: config://api/pagination/min_size
      max: config://api/pagination/max_size

    sort:
      format: field:direction
      example: created_at:desc,name:asc
      default: config://api/pagination/default_sort

    cursor:
      type: string
      purpose: Cursor-based pagination
      format: base64 encoded

  response_headers:
    X-Total-Count: Total number of items
    X-Page-Count: Total number of pages
    Link: RFC 5988 formatted links

  link_header_format: |
    <https://api.example.com/bookings?page=1>; rel="first",
    <https://api.example.com/bookings?page=50>; rel="last",
    <https://api.example.com/bookings?page=3>; rel="next",
    <https://api.example.com/bookings?page=1>; rel="prev"
```

### 7. Filtering and Sorting
```yaml
filtering:
  simple_filters:
    format: ?field=value
    example: ?status=active&type=express

  comparison_operators:
    format: ?field[operator]=value
    operators:
      - eq: Equal (default)
      - neq: Not equal
      - gt: Greater than
      - gte: Greater than or equal
      - lt: Less than
      - lte: Less than or equal
      - in: In array
      - nin: Not in array
      - contains: Contains substring
      - starts: Starts with
      - ends: Ends with

    examples:
      - ?quantity[gte]=100
      - ?created_at[gte]=2024-01-01
      - ?status[in]=active,pending
      - ?name[contains]=truck

  complex_filters:
    format: JSON in query parameter
    example: ?filter={"$and":[{"status":"active"},{"quantity":{"$gte":100}}]}

sorting:
  format: ?sort=field:direction,field:direction
  examples:
    - ?sort=created_at:desc
    - ?sort=priority:desc,created_at:asc

field_selection:
  format: ?fields=field1,field2,nested.field
  example: ?fields=id,status,customer.name
```

### 8. Error Handling Standards
```yaml
error_handling:
  error_response_structure:
    errors:
      type: array
      items:
        id:
          type: string
          format: uuid
          description: Unique error identifier

        status:
          type: string
          description: HTTP status code

        code:
          type: string
          description: Application-specific error code
          pattern: "^[A-Z][A-Z0-9_]*$"

        title:
          type: string
          description: Short, human-readable summary

        detail:
          type: string
          description: Human-readable explanation

        source:
          type: object
          properties:
            pointer:
              type: string
              description: JSON Pointer to error field
            parameter:
              type: string
              description: Query parameter that caused error

        meta:
          type: object
          description: Additional metadata

  error_codes:
    # All error codes from configuration
    validation_errors:
      REQUIRED_FIELD_MISSING: config://api/errors/validation/required
      INVALID_FORMAT: config://api/errors/validation/format
      OUT_OF_RANGE: config://api/errors/validation/range

    business_errors:
      INSUFFICIENT_CREDIT: config://api/errors/business/credit
      BOOKING_CONFLICT: config://api/errors/business/conflict
      CAPACITY_EXCEEDED: config://api/errors/business/capacity

    system_errors:
      SERVICE_UNAVAILABLE: config://api/errors/system/unavailable
      TIMEOUT: config://api/errors/system/timeout
      RATE_LIMIT_EXCEEDED: config://api/errors/system/rate_limit
```

### 9. Versioning Strategy
```yaml
versioning:
  strategy: URI versioning

  format: /api/v{major_version}/

  rules:
    - Major version only in URI (v1, v2)
    - Minor/patch versions handled internally
    - Deprecation notice via headers
    - Sunset period from configuration

  deprecation_headers:
    Sunset: RFC 8594 format date
    Deprecation: true
    Link: <https://api.docs/migration>; rel="deprecation"

  configuration:
    supported_versions: config://api/versions/supported
    deprecation_period: config://api/versions/deprecation_period
    sunset_period: config://api/versions/sunset_period
```

### 10. OpenAPI Specification
```yaml
openapi_template:
  openapi: 3.1.0

  info:
    title: "{{service_name}} API"
    version: "{{from_config}}"
    description: "{{from_config}}"
    contact:
      email: "{{from_config}}"

  servers:
    - url: "{{from_config}}"
      description: "{{environment}}"

  security:
    - BearerAuth: []

  components:
    securitySchemes:
      BearerAuth:
        type: http
        scheme: bearer
        bearerFormat: JWT

    responses:
      UnauthorizedError:
        description: Authentication required
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'

      ForbiddenError:
        description: Insufficient permissions
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'

      NotFoundError:
        description: Resource not found
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'

      ValidationError:
        description: Validation failed
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ValidationError'

      RateLimitError:
        description: Rate limit exceeded
        headers:
          X-RateLimit-Limit:
            schema:
              type: integer
          X-RateLimit-Remaining:
            schema:
              type: integer
          X-RateLimit-Reset:
            schema:
              type: integer
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
```

### 11. HATEOAS Implementation
```yaml
hateoas:
  link_relations:
    self: Current resource
    collection: Parent collection
    first: First page
    last: Last page
    next: Next page
    prev: Previous page
    create: Create new resource
    update: Update resource
    delete: Delete resource
    related: Related resources

  example_response:
    {
      "data": {
        "id": "booking-123",
        "type": "booking",
        "attributes": {...}
      },
      "links": {
        "self": "/api/v1/bookings/booking-123",
        "collection": "/api/v1/bookings",
        "payments": "/api/v1/bookings/booking-123/payments",
        "cancel": {
          "href": "/api/v1/bookings/booking-123/cancel",
          "method": "POST"
        }
      }
    }
```

### 12. Caching Strategy
```yaml
caching:
  cache_headers:
    Cache-Control:
      directives:
        - public: Cacheable by any cache
        - private: Cacheable by browser only
        - no-cache: Validate before use
        - no-store: Never cache
        - max-age: Seconds cacheable
        - s-maxage: Shared cache max age

    ETag:
      purpose: Resource version identifier
      validation: If-None-Match header

    Last-Modified:
      purpose: Last modification timestamp
      validation: If-Modified-Since header

  cache_configuration:
    default_ttl: config://api/cache/default_ttl
    max_ttl: config://api/cache/max_ttl
    cacheable_methods: config://api/cache/methods
    cacheable_status_codes: config://api/cache/status_codes
```

### 13. Security Headers
```yaml
security_headers:
  always_include:
    X-Content-Type-Options: nosniff
    X-Frame-Options: DENY
    X-XSS-Protection: 1; mode=block
    Strict-Transport-Security: max-age={{config}}
    Content-Security-Policy: "{{from_config}}"
    Referrer-Policy: strict-origin-when-cross-origin

  cors_headers:
    Access-Control-Allow-Origin: "{{from_config}}"
    Access-Control-Allow-Methods: "{{from_config}}"
    Access-Control-Allow-Headers: "{{from_config}}"
    Access-Control-Max-Age: "{{from_config}}"
    Access-Control-Allow-Credentials: "{{from_config}}"
```

### 14. Implementation Template
```python
# REST API Implementation Template
from typing import Dict, List, Optional
from http import HTTPStatus

class RESTAPIHandler:
    """
    REST API implementation following standards
    ALL configuration values externalized
    """

    def __init__(self):
        self.config = ConfigurationClient()

    def handle_request(self, method: str, path: str, **kwargs) -> Dict:
        """
        Standard REST request handler
        """
        # Get endpoint configuration
        endpoint_config = self.config.get_config(
            f'api/endpoints/{method.lower()}_{path}'
        )

        # Apply rate limiting from config
        rate_limit = self.config.get_config('api/rate_limits/default')

        # Process based on method
        handlers = {
            'GET': self._handle_get,
            'POST': self._handle_post,
            'PUT': self._handle_put,
            'PATCH': self._handle_patch,
            'DELETE': self._handle_delete
        }

        try:
            result = handlers[method](**kwargs)
            return self._format_response(result, method)
        except ValidationError as e:
            return self._error_response(
                status=HTTPStatus.UNPROCESSABLE_ENTITY,
                errors=e.errors
            )
        except NotFoundError:
            return self._error_response(
                status=HTTPStatus.NOT_FOUND,
                code='RESOURCE_NOT_FOUND'
            )

    def _format_response(self, data: Dict, method: str) -> Dict:
        """
        Format response according to standards
        """
        # Get format configuration
        format_config = self.config.get_config('api/response_format')

        if method == 'DELETE':
            return {
                'statusCode': HTTPStatus.NO_CONTENT,
                'headers': self._get_standard_headers()
            }

        return {
            'statusCode': HTTPStatus.OK,
            'headers': self._get_standard_headers(),
            'body': {
                'data': data,
                'meta': {
                    'timestamp': self._get_timestamp(),
                    'version': self.config.get_config('api/version')
                }
            }
        }

    def _error_response(self, status: int, **kwargs) -> Dict:
        """
        Standard error response format
        """
        return {
            'statusCode': status,
            'headers': self._get_standard_headers(),
            'body': {
                'errors': [
                    {
                        'status': str(status),
                        'code': kwargs.get('code'),
                        'title': HTTPStatus(status).phrase,
                        'detail': kwargs.get('detail'),
                        'meta': {
                            'timestamp': self._get_timestamp(),
                            'request_id': self._get_request_id()
                        }
                    }
                ]
            }
        }
```

## Success Criteria
- 100% consistent REST API patterns
- Zero hardcoded status codes or headers
- Complete OpenAPI documentation
- Standards compliance validation
- < 10ms overhead for standards enforcement
- 100% error response consistency