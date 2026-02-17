# Notification Service - Serverless Implementation Prompt

## Service Overview
The Notification Service handles all communication channels (SMS, WhatsApp, Email, Push notifications) for the UberTruck platform using a serverless, pay-per-use architecture with zero fixed costs.

## Architecture Components

### 1. Lambda Functions (₹0 when idle)

```yaml
functions:
  # SMS Notifications
  send-sms:
    handler: handlers/sms/send.handler
    memory: 256MB
    timeout: 10s
    events:
      - sqs:
          queue: sms-queue
          batchSize: 25
      - http: POST /notifications/sms
    providers:
      primary: Twilio
      fallback: AWS SNS
      local: Kaleyra  # For India-specific requirements
    templates:
      - otp_verification
      - booking_confirmation
      - trip_updates
      - payment_receipt
      - driver_alerts
    cost_per_invocation: ₹0.001
    sms_cost: ₹0.15 per SMS

  send-bulk-sms:
    handler: handlers/sms/bulk.handler
    memory: 512MB
    timeout: 300s
    events:
      - s3:
          bucket: bulk-notifications
          event: s3:ObjectCreated:*
          prefix: sms/
    batch_size: 1000
    rate_limit: 100/second

  # WhatsApp Notifications
  send-whatsapp:
    handler: handlers/whatsapp/send.handler
    memory: 256MB
    timeout: 15s
    events:
      - sqs:
          queue: whatsapp-queue
          batchSize: 10
      - http: POST /notifications/whatsapp
    integration: WhatsApp Business API
    message_types:
      - Template messages (pre-approved)
      - Session messages (24-hour window)
      - Media messages (documents, images)
    templates:
      - booking_confirmation
      - invoice_document
      - trip_tracking_link
      - payment_reminder
      - pod_receipt
    cost_per_message: ₹0.30

  handle-whatsapp-webhook:
    handler: handlers/whatsapp/webhook.handler
    memory: 256MB
    timeout: 10s
    events:
      - http: POST /whatsapp/webhook
    handles:
      - Message delivery status
      - Read receipts
      - User replies
      - Media downloads

  # Email Notifications
  send-email:
    handler: handlers/email/send.handler
    memory: 256MB
    timeout: 20s
    events:
      - sqs:
          queue: email-queue
          batchSize: 10
      - http: POST /notifications/email
    provider: AWS SES
    templates:
      - welcome_email
      - invoice_attachment
      - monthly_statement
      - trip_summary
      - payment_confirmation
    attachments:
      - PDF invoices
      - Excel reports
      - Trip summaries
    cost_per_1000_emails: ₹7

  send-bulk-email:
    handler: handlers/email/bulk.handler
    memory: 1024MB
    timeout: 300s
    events:
      - eventBridge:
          schedule: cron(0 9 * * ? *)
    features:
      - Personalization
      - Unsubscribe handling
      - Bounce management
      - Open/Click tracking

  # Push Notifications
  send-push:
    handler: handlers/push/send.handler
    memory: 256MB
    timeout: 10s
    events:
      - sqs:
          queue: push-queue
          batchSize: 100
      - http: POST /notifications/push
    providers:
      android: FCM (Firebase)
      ios: APNS
    notification_types:
      - Trip alerts
      - Payment updates
      - Document expiry
      - Geofence violations
      - Emergency alerts
    cost_per_million: ₹70

  register-device:
    handler: handlers/push/register.handler
    memory: 128MB
    timeout: 5s
    events:
      - http:
          - POST /devices/register
          - DELETE /devices/{deviceId}
    stores:
      - Device token
      - Platform (iOS/Android)
      - App version
      - User preferences

  # Notification Orchestration
  process-notification-request:
    handler: handlers/orchestrator/process.handler
    memory: 512MB
    timeout: 30s
    events:
      - eventBridge:
          patterns:
            - source: "*.service"
              detail-type: "*Notification"
    logic:
      - Determine channels based on user preferences
      - Apply notification rules
      - Route to appropriate queues
      - Handle failures and retries

  manage-preferences:
    handler: handlers/preferences/manage.handler
    memory: 256MB
    timeout: 10s
    events:
      - http:
          - GET /preferences/{userId}
          - PUT /preferences/{userId}
    preferences:
      channels:
        - sms: boolean
        - whatsapp: boolean
        - email: boolean
        - push: boolean
      categories:
        - bookings: true
        - payments: true
        - marketing: false
        - alerts: true

  # Template Management
  manage-templates:
    handler: handlers/templates/manage.handler
    memory: 256MB
    timeout: 10s
    events:
      - http:
          - GET /templates
          - POST /templates
          - PUT /templates/{id}
    features:
      - Multi-language support (English only for now)
      - Variable substitution
      - Preview generation
      - Version control

  # Delivery Tracking
  track-delivery:
    handler: handlers/tracking/track.handler
    memory: 256MB
    timeout: 10s
    events:
      - dynamodb:
          stream: notifications-stream
      - sqs:
          queue: delivery-status-queue
    tracking:
      - Sent timestamp
      - Delivered timestamp
      - Read/Opened status
      - Click tracking
      - Bounce handling
```

### 2. DynamoDB Tables (On-Demand, ₹0 when idle)

```yaml
tables:
  notifications:
    partition_key: notification_id
    sort_key: created_at
    attributes:
      - notification_id: string
      - user_id: string
      - channel: string  # sms, whatsapp, email, push
      - template_id: string
      - recipient: string
      - subject: string
      - content: string
      - status: string  # pending, sent, delivered, failed, read
      - priority: string  # high, medium, low
      - scheduled_at: string
      - sent_at: string
      - delivered_at: string
      - read_at: string
      - error: string
      - retry_count: number
      - metadata: map
      - created_at: string
    gsi:
      - user-notifications:
          partition_key: user_id
          sort_key: created_at
      - status-index:
          partition_key: status
          sort_key: scheduled_at
    ttl: created_at + 30 days
    stream: enabled

  user_preferences:
    partition_key: user_id
    attributes:
      - user_id: string
      - channels: map
        sms: boolean
        whatsapp: boolean
        email: boolean
        push: boolean
      - categories: map
        bookings: boolean
        payments: boolean
        alerts: boolean
        marketing: boolean
      - quiet_hours: map
        start: string
        end: string
      - language: string
      - timezone: string
      - updated_at: string

  device_tokens:
    partition_key: user_id
    sort_key: device_id
    attributes:
      - user_id: string
      - device_id: string
      - token: string
      - platform: string  # ios, android
      - app_version: string
      - last_used: string
      - active: boolean
    ttl: last_used + 90 days

  templates:
    partition_key: template_id
    sort_key: version
    attributes:
      - template_id: string
      - name: string
      - channel: string
      - language: string
      - subject: string
      - body: string
      - variables: list
      - category: string
      - active: boolean
      - created_at: string
      - updated_at: string

  whatsapp_sessions:
    partition_key: phone_number
    attributes:
      - phone_number: string
      - session_start: string
      - session_end: string
      - message_count: number
      - last_message: string
    ttl: session_end

  bounce_list:
    partition_key: recipient
    attributes:
      - recipient: string
      - channel: string
      - bounce_type: string
      - bounce_count: number
      - last_bounce: string
      - suppressed: boolean
```

### 3. Queue and Event Architecture

```yaml
sqs_queues:
  sms-queue:
    visibility_timeout: 60
    message_retention: 14 days
    dlq:
      name: sms-dlq
      max_receive_count: 3
    batching: true

  whatsapp-queue:
    visibility_timeout: 90
    message_retention: 7 days
    dlq:
      name: whatsapp-dlq
      max_receive_count: 3

  email-queue:
    visibility_timeout: 120
    message_retention: 14 days
    dlq:
      name: email-dlq
      max_receive_count: 3

  push-queue:
    visibility_timeout: 30
    message_retention: 1 day
    batching: true
    batch_size: 100

eventbridge_rules:
  booking_notifications:
    source: booking.service
    triggers:
      - BookingCreated → SMS + WhatsApp
      - BookingConfirmed → Email + Push
      - BookingCancelled → All channels

  payment_notifications:
    source: payment.service
    triggers:
      - PaymentSuccess → SMS + Email
      - PaymentFailed → Push + SMS
      - InvoiceGenerated → WhatsApp + Email

  trip_notifications:
    source: tracking.service
    triggers:
      - TripStarted → SMS to shipper
      - Milestone → Push to driver
      - TripCompleted → All channels

  compliance_alerts:
    source: compliance.service
    triggers:
      - DocumentExpiry → Email + Push
      - PermitExpiry → WhatsApp + SMS
```

### 4. Cost Optimization Strategies

```yaml
optimization:
  channel_selection:
    - Prefer WhatsApp over SMS (cheaper for media)
    - Use push for non-critical alerts
    - Batch emails for reports
    - SMS only for OTP and critical alerts

  batching:
    - Group notifications by recipient
    - Bulk API calls where possible
    - Aggregate daily summaries
    - Schedule non-urgent notifications

  caching:
    - Cache templates in Lambda memory
    - Cache user preferences
    - Cache device tokens
    - Reuse API connections

  rate_limiting:
    - Implement per-user limits
    - Throttle marketing messages
    - Priority queues for critical alerts
    - Backoff strategies for failures

  cost_tracking:
    - Tag all resources by notification type
    - Monitor per-channel costs
    - Alert on unusual spending
    - Daily cost reports
```

### 5. Implementation Code Examples

```python
# SMS Notification Handler
import json
import boto3
from twilio.rest import Client
import phonenumbers

dynamodb = boto3.resource('dynamodb')
ssm = boto3.client('ssm')

def send_sms_handler(event, context):
    # Get Twilio credentials from Parameter Store
    account_sid = ssm.get_parameter(Name='twilio_account_sid', WithDecryption=True)['Parameter']['Value']
    auth_token = ssm.get_parameter(Name='twilio_auth_token', WithDecryption=True)['Parameter']['Value']

    client = Client(account_sid, auth_token)
    notifications_table = dynamodb.Table('notifications')

    results = []
    for record in event['Records']:
        message = json.loads(record['body'])

        try:
            # Validate phone number
            phone = phonenumbers.parse(message['recipient'], 'IN')
            if not phonenumbers.is_valid_number(phone):
                raise ValueError('Invalid phone number')

            # Format for India (+91)
            formatted_phone = phonenumbers.format_number(phone, phonenumbers.PhoneNumberFormat.E164)

            # Get template and substitute variables
            content = render_template(message['template_id'], message.get('variables', {}))

            # Send SMS
            twilio_message = client.messages.create(
                body=content,
                from_='+918095551234',  # Your Twilio number
                to=formatted_phone
            )

            # Update notification status
            notifications_table.update_item(
                Key={'notification_id': message['notification_id']},
                UpdateExpression='SET #status = :status, sent_at = :sent_at, provider_id = :provider_id',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'sent',
                    ':sent_at': context.aws_request_id,
                    ':provider_id': twilio_message.sid
                }
            )

            results.append({
                'notification_id': message['notification_id'],
                'status': 'sent',
                'provider_id': twilio_message.sid
            })

        except Exception as e:
            # Log error and update status
            handle_notification_failure(message['notification_id'], str(e))

            # Retry logic
            if message.get('retry_count', 0) < 3:
                retry_notification(message, 'sms-queue')

    return {'processed': len(results), 'results': results}

# WhatsApp Notification Handler
import requests

def send_whatsapp_handler(event, context):
    # WhatsApp Business API endpoint
    api_url = "https://api.whatsapp.com/v1/messages"
    api_token = ssm.get_parameter(Name='whatsapp_api_token', WithDecryption=True)['Parameter']['Value']

    headers = {
        'Authorization': f'Bearer {api_token}',
        'Content-Type': 'application/json'
    }

    for record in event['Records']:
        message = json.loads(record['body'])

        # Check for active session
        session = check_whatsapp_session(message['recipient'])

        if session and session['active']:
            # Can send regular message
            payload = {
                'to': message['recipient'],
                'type': 'text',
                'text': {'body': message['content']}
            }
        else:
            # Must use template message
            payload = {
                'to': message['recipient'],
                'type': 'template',
                'template': {
                    'name': message['template_id'],
                    'language': {'code': 'en'},
                    'components': build_template_components(message['variables'])
                }
            }

        # Send message
        response = requests.post(api_url, headers=headers, json=payload)

        if response.status_code == 200:
            update_notification_status(message['notification_id'], 'sent')
        else:
            handle_whatsapp_error(message, response.json())

# Email Notification Handler with Attachments
def send_email_handler(event, context):
    ses = boto3.client('ses', region_name='ap-south-1')
    s3 = boto3.client('s3')

    for record in event['Records']:
        message = json.loads(record['body'])

        # Build email
        email_data = {
            'Source': 'noreply@ubertruck.in',
            'Destination': {
                'ToAddresses': [message['recipient']]
            },
            'Message': {
                'Subject': {'Data': message['subject']},
                'Body': {}
            }
        }

        # Add HTML body
        if message.get('html_content'):
            email_data['Message']['Body']['Html'] = {'Data': message['html_content']}
        else:
            email_data['Message']['Body']['Text'] = {'Data': message['content']}

        # Handle attachments
        if message.get('attachments'):
            raw_message = create_multipart_message(message, s3)
            response = ses.send_raw_email(RawMessage={'Data': raw_message})
        else:
            response = ses.send_email(**email_data)

        # Update status
        update_notification_status(
            message['notification_id'],
            'sent',
            {'message_id': response['MessageId']}
        )

# Push Notification Handler
import firebase_admin
from firebase_admin import messaging

def send_push_handler(event, context):
    # Initialize Firebase
    if not firebase_admin._apps:
        firebase_admin.initialize_app()

    device_tokens_table = dynamodb.Table('device_tokens')
    batch_size = 100

    for record in event['Records']:
        message = json.loads(record['body'])

        # Get device tokens for user
        response = device_tokens_table.query(
            KeyConditionExpression='user_id = :user_id',
            ExpressionAttributeValues={':user_id': message['user_id']}
        )

        tokens = [item['token'] for item in response['Items'] if item['active']]

        # Create notification
        notification = messaging.MulticastMessage(
            tokens=tokens,
            notification=messaging.Notification(
                title=message['title'],
                body=message['body']
            ),
            data=message.get('data', {}),
            android=messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    click_action=message.get('action'),
                    sound='default'
                )
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        alert=messaging.ApsAlert(
                            title=message['title'],
                            body=message['body']
                        ),
                        sound='default',
                        badge=1
                    )
                )
            )
        )

        # Send in batches
        for i in range(0, len(tokens), batch_size):
            batch_tokens = tokens[i:i+batch_size]
            batch_message = messaging.MulticastMessage(
                tokens=batch_tokens,
                notification=notification.notification,
                data=notification.data,
                android=notification.android,
                apns=notification.apns
            )

            response = messaging.send_multicast(batch_message)

            # Handle failures
            if response.failure_count > 0:
                handle_failed_tokens(response, batch_tokens)

# Notification Orchestrator
def process_notification_request_handler(event, context):
    user_prefs_table = dynamodb.Table('user_preferences')
    sqs = boto3.client('sqs')

    detail = event['detail']
    notification_type = detail['type']
    user_id = detail['user_id']

    # Get user preferences
    prefs = user_prefs_table.get_item(Key={'user_id': user_id})['Item']

    # Check quiet hours
    if is_quiet_hours(prefs.get('quiet_hours')):
        # Schedule for later
        schedule_notification(detail, prefs['quiet_hours']['end'])
        return

    # Determine channels based on preferences and notification type
    channels = determine_channels(notification_type, prefs)

    # Create notification record
    notification_id = create_notification_record(detail, channels)

    # Route to appropriate queues
    for channel in channels:
        message = {
            'notification_id': notification_id,
            'user_id': user_id,
            'channel': channel,
            'template_id': detail.get(f'{channel}_template'),
            'variables': detail.get('variables', {}),
            'recipient': get_recipient_for_channel(user_id, channel),
            'priority': detail.get('priority', 'medium')
        }

        queue_url = get_queue_url(channel)
        sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(message),
            MessageAttributes={
                'priority': {
                    'StringValue': message['priority'],
                    'DataType': 'String'
                }
            }
        )

    return {
        'notification_id': notification_id,
        'channels': channels
    }

def render_template(template_id, variables):
    """Render notification template with variables"""
    templates_table = dynamodb.Table('templates')
    template = templates_table.get_item(Key={'template_id': template_id})['Item']

    content = template['body']
    for key, value in variables.items():
        content = content.replace(f'{{{key}}}', str(value))

    return content

def is_quiet_hours(quiet_hours_config):
    """Check if current time is within quiet hours"""
    if not quiet_hours_config:
        return False

    from datetime import datetime
    import pytz

    ist = pytz.timezone('Asia/Kolkata')
    current_time = datetime.now(ist).time()

    start = datetime.strptime(quiet_hours_config['start'], '%H:%M').time()
    end = datetime.strptime(quiet_hours_config['end'], '%H:%M').time()

    if start <= end:
        return start <= current_time <= end
    else:
        return current_time >= start or current_time <= end
```

### 6. Monitoring and Alerts

```yaml
cloudwatch_metrics:
  custom:
    - notifications_sent_per_channel
    - notification_delivery_rate
    - average_delivery_time
    - bounce_rate
    - cost_per_notification
    - template_usage

alarms:
  high_failure_rate:
    metric: notification_failure_rate
    threshold: 0.05  # 5% failure
    evaluation_periods: 2
    action: SNS alert

  delivery_delay:
    metric: average_delivery_time
    threshold: 300  # 5 minutes
    channel: email

  high_bounce_rate:
    metric: email_bounce_rate
    threshold: 0.02  # 2%
    action: Investigate and clean list

  cost_spike:
    metric: daily_notification_cost
    threshold: ₹5000
    action: Alert and review

dashboards:
  notification_overview:
    - Total notifications sent
    - Channel distribution
    - Success/Failure rates
    - Cost breakdown
    - User engagement metrics
```

### 7. Expected Costs

```yaml
monthly_costs:
  at_10000_notifications_per_day:
    sms: ₹45,000  # 10000 * 0.15 * 30
    whatsapp: ₹27,000  # 6000 * 0.30 * 30
    email: ₹210  # 3000 * 0.007 * 30
    push: ₹21  # 10000 * 0.00007 * 30
    lambda: ₹2,000
    dynamodb: ₹1,500
    sqs: ₹300
    total: ₹76,031

  at_50000_notifications_per_day:
    sms: ₹112,500  # 25000 * 0.15 * 30
    whatsapp: ₹135,000  # 30000 * 0.30 * 30
    email: ₹525  # 7500 * 0.007 * 30
    push: ₹105  # 50000 * 0.00007 * 30
    lambda: ₹8,000
    dynamodb: ₹6,000
    sqs: ₹1,200
    total: ₹263,330

  idle_state:
    infrastructure: ₹0
    channel_costs: ₹0 (pay per use)

  optimization_potential:
    - Use WhatsApp for documents instead of SMS: 30% savings
    - Batch non-critical notifications: 20% reduction
    - Push for alerts instead of SMS: 50% savings on alerts
```

## Implementation Priority
1. SMS for OTP and critical alerts
2. WhatsApp for documents and updates
3. Email for reports and invoices
4. Push notifications for real-time alerts
5. Preference management
6. Template system
7. Advanced orchestration

## Success Metrics
- Delivery rate > 98%
- Average delivery time < 30 seconds
- User preference compliance 100%
- Zero fixed infrastructure costs
- Cost per notification < ₹0.20 average