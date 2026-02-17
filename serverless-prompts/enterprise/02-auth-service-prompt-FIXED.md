# Enterprise Authentication & Authorization Service - Production Ready Template

## Service Overview
Generate a comprehensive authentication and authorization service implementing OAuth2.0, JWT tokens, RBAC, and MFA for the UberTruck platform. ALL values including timeouts, limits, durations, and thresholds MUST be retrieved from the configuration service with ZERO hardcoded values.

## ⚠️ CRITICAL REQUIREMENT
**ABSOLUTELY NO HARDCODED VALUES ALLOWED**
- Every numeric value MUST come from configuration service
- Every timeout, TTL, duration MUST be configuration-driven
- Every threshold, limit, count MUST be externalized
- Every rate limit MUST be dynamically retrieved

## Core Requirements

### 1. Architecture Specifications
Generate a serverless authentication service with:
- OAuth2.0 implementation with JWT tokens
- Multi-Factor Authentication (MFA)
- Role-Based Access Control (RBAC)
- API key management for service-to-service communication
- Token rotation and refresh mechanisms
- Session management with security
- Federated identity support
- Complete audit logging
- **ALL timing and limits from configuration service**

### 2. Lambda Functions Required

#### 2.1 User Authentication
```yaml
function_requirements:
  authenticate_user:
    purpose: Authenticate user with MFA support
    inputs:
      - username: string (email or phone)
      - password: string (encrypted in transit)
      - mfa_code: string (optional)
      - device_fingerprint: string
      - ip_address: string
    processing:
      - Retrieve user from Cognito/Database
      - Validate password (using secure hash)
      - Check account status (active/locked/suspended)
      - Enforce MFA if configured
      - Check for suspicious activity
      - Generate JWT tokens
      - Create audit log entry
    outputs:
      - access_token: JWT (expiry from config://auth/tokens/access_ttl)
      - refresh_token: JWT (expiry from config://auth/tokens/refresh_ttl)
      - id_token: JWT (user claims)
      - expires_in: seconds (from configuration)
      - user_profile: object
    security_measures:
      - Rate limiting: config://auth/rate_limits/login_attempts
      - Lockout threshold: config://auth/security/lockout_threshold
      - CAPTCHA threshold: config://auth/security/captcha_after_failures
      - IP blocking rules: config://auth/security/ip_blocking_rules

    configuration_dependencies:
      token_expiry:
        access_token_ttl: config://global/auth/{{env}}/tokens/access_ttl
        refresh_token_ttl: config://global/auth/{{env}}/tokens/refresh_ttl
        id_token_ttl: config://global/auth/{{env}}/tokens/id_ttl

      rate_limiting:
        attempts_allowed: config://global/auth/{{env}}/rate_limits/login_attempts
        window_seconds: config://global/auth/{{env}}/rate_limits/login_window
        lockout_duration: config://global/auth/{{env}}/rate_limits/lockout_duration

      security_thresholds:
        captcha_after: config://global/auth/{{env}}/security/captcha_threshold
        permanent_lock_after: config://global/auth/{{env}}/security/permanent_lock_threshold
```

#### 2.2 Token Management
```yaml
function_requirements:
  validate_token:
    purpose: Validate and decode JWT tokens
    inputs:
      - token: string (JWT)
      - token_type: string (access|refresh|id)
    processing:
      - Verify JWT signature
      - Check token expiration
      - Validate issuer and audience
      - Check token blacklist
      - Verify token claims
      - Check permissions for requested resource
    outputs:
      - valid: boolean
      - claims: object
      - permissions: array
      - tenant_id: string
      - remaining_ttl: seconds

  refresh_token:
    purpose: Generate new access token from refresh token
    inputs:
      - refresh_token: string
      - device_fingerprint: string
    processing:
      - Validate refresh token
      - Check token rotation policy from config
      - Verify device fingerprint
      - Generate new access token
      - Optionally rotate refresh token based on config
      - Update session tracking
    outputs:
      - access_token: new JWT
      - expires_in: seconds (from configuration)
      - refresh_token: string (if rotated per config)

    configuration_dependencies:
      rotation_policy: config://global/auth/{{env}}/tokens/rotation_policy
      rotation_enabled: config://global/auth/{{env}}/tokens/rotation_enabled
      rotation_interval: config://global/auth/{{env}}/tokens/rotation_interval
```

### 3. RBAC Configuration (ALL FROM CONFIG SERVICE)

```yaml
roles:
  # ALL role definitions MUST be loaded from configuration service
  # NO hardcoded permissions or durations

  configuration_path: config://tenant/{{tenant_id}}/auth/{{env}}/rbac/roles

  role_template:
    role_name:
      description: "{{from_config}}"
      permissions: "{{from_config}}"
      constraints:
        mfa_required: "{{from_config}}"
        ip_whitelist_required: "{{from_config}}"
        max_session_duration: "{{from_config}}"
        device_binding: "{{from_config}}"
        location_verification: "{{from_config}}"

  # Example of configuration retrieval (NOT hardcoded values)
  load_roles_from_config:
    - GET config://tenant/{{tenant_id}}/auth/{{env}}/rbac/roles/system_admin
    - GET config://tenant/{{tenant_id}}/auth/{{env}}/rbac/roles/tenant_admin
    - GET config://tenant/{{tenant_id}}/auth/{{env}}/rbac/roles/fleet_owner
    - GET config://tenant/{{tenant_id}}/auth/{{env}}/rbac/roles/driver
    - GET config://tenant/{{tenant_id}}/auth/{{env}}/rbac/roles/shipper
```

### 4. MFA Configuration (FULLY DYNAMIC)

```yaml
mfa_configuration:
  # ALL MFA settings from configuration service
  configuration_path: config://global/auth/{{env}}/mfa

  methods:
    sms:
      enabled: config://global/auth/{{env}}/mfa/sms/enabled
      provider: config://global/auth/{{env}}/mfa/sms/provider
      code_length: config://global/auth/{{env}}/mfa/sms/code_length
      validity_seconds: config://global/auth/{{env}}/mfa/sms/validity

    totp:
      enabled: config://global/auth/{{env}}/mfa/totp/enabled
      algorithm: config://global/auth/{{env}}/mfa/totp/algorithm
      interval: config://global/auth/{{env}}/mfa/totp/interval
      window: config://global/auth/{{env}}/mfa/totp/window
      digits: config://global/auth/{{env}}/mfa/totp/digits

    backup_codes:
      enabled: config://global/auth/{{env}}/mfa/backup/enabled
      count: config://global/auth/{{env}}/mfa/backup/count
      length: config://global/auth/{{env}}/mfa/backup/length
      single_use: config://global/auth/{{env}}/mfa/backup/single_use

  enforcement:
    mandatory_roles: config://global/auth/{{env}}/mfa/mandatory_roles
    optional_roles: config://global/auth/{{env}}/mfa/optional_roles
    excluded_roles: config://global/auth/{{env}}/mfa/excluded_roles
```

### 5. API Key Management (CONFIGURATION DRIVEN)

```yaml
api_key_management:
  configuration_path: config://global/auth/{{env}}/api_keys

  service_to_service:
    key_format: config://global/auth/{{env}}/api_keys/format_pattern
    rotation_days: config://global/auth/{{env}}/api_keys/rotation_days
    encryption: config://global/auth/{{env}}/api_keys/encryption_algorithm

  rate_limiting:
    default_limit: config://global/auth/{{env}}/api_keys/default_rate_limit
    default_window: config://global/auth/{{env}}/api_keys/default_window

    by_service:
      # Dynamically loaded per service
      payment_service: config://global/auth/{{env}}/api_keys/limits/payment
      tracking_service: config://global/auth/{{env}}/api_keys/limits/tracking
      notification_service: config://global/auth/{{env}}/api_keys/limits/notification

  validation:
    - Check key existence
    - Verify key status (active/revoked)
    - Validate source IP if configured
    - Check rate limits from configuration
    - Audit log access
```

### 6. Password Policy (FULLY EXTERNALIZED)

```yaml
password_policy:
  configuration_path: config://global/auth/{{env}}/password_policy

  requirements:
    min_length: config://global/auth/{{env}}/password/min_length
    max_length: config://global/auth/{{env}}/password/max_length
    require_uppercase: config://global/auth/{{env}}/password/require_uppercase
    require_lowercase: config://global/auth/{{env}}/password/require_lowercase
    require_numbers: config://global/auth/{{env}}/password/require_numbers
    require_special: config://global/auth/{{env}}/password/require_special
    special_characters: config://global/auth/{{env}}/password/special_chars

  restrictions:
    prevent_reuse_count: config://global/auth/{{env}}/password/history_count
    min_age_days: config://global/auth/{{env}}/password/min_age_days
    max_age_days: config://global/auth/{{env}}/password/max_age_days
    prevent_common: config://global/auth/{{env}}/password/prevent_common
    prevent_dictionary: config://global/auth/{{env}}/password/prevent_dictionary
    prevent_user_info: config://global/auth/{{env}}/password/prevent_user_info

  enforcement:
    temp_password_validity_hours: config://global/auth/{{env}}/password/temp_validity_hours
    force_change_first_login: config://global/auth/{{env}}/password/force_first_change
    expiry_warning_days: config://global/auth/{{env}}/password/expiry_warning_days
```

### 7. Rate Limiting (100% CONFIGURATION DRIVEN)

```yaml
rate_limiting:
  configuration_path: config://global/auth/{{env}}/rate_limits

  by_endpoint:
    # ALL limits from configuration service
    /auth/login:
      limit: config://global/auth/{{env}}/rate_limits/login/limit
      window_seconds: config://global/auth/{{env}}/rate_limits/login/window
      key_by: config://global/auth/{{env}}/rate_limits/login/key_by

    /auth/token/refresh:
      limit: config://global/auth/{{env}}/rate_limits/refresh/limit
      window_seconds: config://global/auth/{{env}}/rate_limits/refresh/window
      key_by: config://global/auth/{{env}}/rate_limits/refresh/key_by

    /auth/password/reset:
      limit: config://global/auth/{{env}}/rate_limits/reset/limit
      window_seconds: config://global/auth/{{env}}/rate_limits/reset/window
      key_by: config://global/auth/{{env}}/rate_limits/reset/key_by

  by_user_type:
    # Dynamically loaded based on user type
    anonymous: config://global/auth/{{env}}/rate_limits/user_types/anonymous
    authenticated: config://global/auth/{{env}}/rate_limits/user_types/authenticated
    premium: config://global/auth/{{env}}/rate_limits/user_types/premium
```

### 8. Implementation Template (NO HARDCODED VALUES)

```python
# Authentication implementation - ALL VALUES FROM CONFIG
import os
from config_client import ConfigurationClient

class AuthenticationService:
    """
    Enterprise authentication service
    ALL configuration values retrieved dynamically
    ZERO hardcoded values
    """

    def __init__(self):
        self.config_client = ConfigurationClient(
            service='auth',
            environment=os.environ['ENVIRONMENT']
        )
        # Cache configuration with TTL from config
        self.config_cache = {}
        self.cache_ttl = self._get_config('cache/ttl_seconds')

    def authenticate(self, credentials: dict) -> dict:
        """
        Authenticate user with all parameters from configuration
        """
        # Get authentication configuration
        auth_config = self._get_config('authentication')

        # Get token TTLs from configuration
        access_ttl = self._get_config('tokens/access_ttl')
        refresh_ttl = self._get_config('tokens/refresh_ttl')

        # Get rate limiting from configuration
        rate_config = self._get_config('rate_limits/login')

        # NEVER do this:
        # access_token_expiry = 900  # WRONG - hardcoded!
        # max_attempts = 5  # WRONG - hardcoded!

        # ALWAYS do this:
        max_attempts = rate_config['attempts']
        window = rate_config['window_seconds']

        # Process authentication with configuration
        return self._process_auth(credentials, auth_config)

    def _get_config(self, path: str) -> dict:
        """
        Retrieve configuration with caching
        NO DEFAULT VALUES - all from configuration service
        """
        full_path = f"global/auth/{os.environ['ENVIRONMENT']}/{path}"
        return self.config_client.get_config(full_path)

    def validate_password_policy(self, password: str) -> bool:
        """
        Validate password against policy from configuration
        """
        policy = self._get_config('password_policy')

        # ALL validation rules from configuration
        min_length = policy['min_length']
        max_length = policy['max_length']
        # ... apply all rules from configuration

        # NO hardcoded values like:
        # if len(password) < 12:  # WRONG!
        # Instead:
        if len(password) < min_length:
            return False

        return True
```

### 9. REST API Specification

```yaml
rest_api:
  endpoints:
    POST /auth/login:
      request:
        content_type: application/json
        schema: config://global/auth/{{env}}/schemas/login_request
      responses:
        200:
          description: Successful authentication
          schema: config://global/auth/{{env}}/schemas/login_response
        401:
          description: Invalid credentials
          schema: config://global/auth/{{env}}/schemas/error_response
        429:
          description: Rate limit exceeded
          headers:
            X-RateLimit-Limit: From configuration
            X-RateLimit-Remaining: Calculated
            X-RateLimit-Reset: Calculated

    POST /auth/refresh:
      request:
        content_type: application/json
        schema: config://global/auth/{{env}}/schemas/refresh_request
      responses:
        200:
          description: Token refreshed
          schema: config://global/auth/{{env}}/schemas/token_response

    POST /auth/logout:
      request:
        headers:
          Authorization: Bearer token
      responses:
        204:
          description: Successfully logged out

    GET /auth/validate:
      request:
        headers:
          Authorization: Bearer token
      responses:
        200:
          description: Token valid
          schema: config://global/auth/{{env}}/schemas/validation_response
```

### 10. Health Check Endpoints

```yaml
health_checks:
  GET /auth/health:
    response:
      status: UP/DOWN
      checks:
        - database: connection status
        - cache: connection status
        - config_service: connection status
      metadata:
        version: service version
        uptime: seconds (calculated)

  GET /auth/ready:
    response:
      ready: boolean
      dependencies:
        - config_service: ready
        - database: ready
        - cache: ready
```

### 11. Monitoring and Metrics

```yaml
metrics:
  custom_metrics:
    - auth_attempts_total
    - auth_success_total
    - auth_failure_total
    - token_validation_duration
    - mfa_challenge_issued
    - mfa_challenge_success
    - password_reset_requested

  metric_configuration:
    thresholds: config://global/auth/{{env}}/monitoring/thresholds
    alert_channels: config://global/auth/{{env}}/monitoring/alerts
```

## Anti-Patterns Checker

```yaml
forbidden_patterns:
  # These patterns should NEVER appear in generated code
  - pattern: '\d+\s*minutes'
    message: "Hardcoded duration found"
  - pattern: '\d+\s*seconds'
    message: "Hardcoded duration found"
  - pattern: '\d+\s*days'
    message: "Hardcoded duration found"
  - pattern: 'limit\s*[:=]\s*\d+'
    message: "Hardcoded limit found"
  - pattern: 'threshold\s*[:=]\s*\d+'
    message: "Hardcoded threshold found"
  - pattern: 'ttl\s*[:=]\s*\d+'
    message: "Hardcoded TTL found"
  - pattern: 'max.*\s*[:=]\s*\d+'
    message: "Hardcoded maximum found"
  - pattern: 'min.*\s*[:=]\s*\d+'
    message: "Hardcoded minimum found"

required_patterns:
  # These patterns MUST appear for configuration
  - pattern: 'config://'
    message: "Configuration reference required"
  - pattern: 'get_config\('
    message: "Configuration retrieval required"
  - pattern: 'from_configuration'
    message: "Configuration usage required"
```

## Success Criteria
- **ZERO hardcoded numeric values**
- **ZERO hardcoded time durations**
- **100% configuration-driven values**
- Complete audit trail for all auth events
- < 100ms token validation latency (threshold from config)
- Service availability target from configuration
- Full OAuth2.0 compliance
- OWASP authentication standards compliance