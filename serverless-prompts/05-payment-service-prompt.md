# Payment Service - Serverless Implementation Prompt

## Service Overview
The Payment Service manages all financial transactions, invoicing, settlements, and payment processing for the UberTruck platform using a completely serverless, pay-per-use architecture with zero fixed costs.

## Architecture Components

### 1. Lambda Functions (₹0 when idle)

```yaml
functions:
  # Payment Processing
  initiate-payment:
    handler: handlers/payment/initiate.handler
    memory: 512MB
    timeout: 30s
    events:
      - http: POST /payments/initiate
    integrations:
      - Razorpay API
      - PayU API
      - Cashfree API
    payment_methods:
      - UPI
      - Net Banking
      - Credit/Debit Cards
      - Wallet
      - NEFT/RTGS
    cost_per_invocation: ₹0.002

  process-webhook:
    handler: handlers/payment/webhook.handler
    memory: 256MB
    timeout: 10s
    events:
      - http: POST /payments/webhook/{provider}
    providers:
      razorpay:
        signature_validation: SHA256
        retry_logic: exponential
      payu:
        hash_validation: SHA512
      cashfree:
        webhook_authentication: IP_whitelist + signature

  verify-payment:
    handler: handlers/payment/verify.handler
    memory: 256MB
    timeout: 10s
    events:
      - http: GET /payments/{paymentId}/verify
      - eventBridge:
          schedule: rate(5 minutes)
          pattern:
            source: payment.service
            detail-type: PaymentPending
    verification:
      - Check with payment gateway
      - Update transaction status
      - Trigger settlement if successful

  refund-payment:
    handler: handlers/payment/refund.handler
    memory: 256MB
    timeout: 15s
    events:
      - http: POST /payments/{paymentId}/refund
    refund_types:
      - Full refund
      - Partial refund
      - Cancellation refund
    processing:
      - Calculate refund amount
      - Apply refund policies
      - Process with gateway
      - Update accounting

  # Invoice Generation
  generate-invoice:
    handler: handlers/invoice/generate.handler
    memory: 512MB
    timeout: 20s
    events:
      - eventBridge:
          source: booking.service
          detail-type: TripCompleted
      - http: POST /invoices/generate
    generation:
      - Fetch trip details
      - Calculate charges
      - Apply GST
      - Generate PDF
      - Store in S3
      - Send via email/WhatsApp
    cost_per_invocation: ₹0.003

  bulk-invoice-generation:
    handler: handlers/invoice/bulk.handler
    memory: 1024MB
    timeout: 300s
    events:
      - eventBridge:
          schedule: cron(0 6 1 * ? *)  # Monthly
    batch_size: 100
    parallel_processing: true

  get-invoice:
    handler: handlers/invoice/get.handler
    memory: 128MB
    timeout: 5s
    events:
      - http: GET /invoices/{invoiceId}
    storage: S3 with CloudFront CDN

  # Settlement Processing
  process-settlement:
    handler: handlers/settlement/process.handler
    memory: 512MB
    timeout: 60s
    events:
      - eventBridge:
          schedule:
            - cron(0 10 * * ? *)  # Daily at 10 AM
            - cron(0 10 ? * MON *)  # Weekly on Monday
            - cron(0 10 1 * ? *)  # Monthly on 1st
    settlement_types:
      - fleet_owner_payout
      - driver_incentives
      - platform_commission
      - tax_deductions

  calculate-payout:
    handler: handlers/settlement/calculate.handler
    memory: 512MB
    timeout: 30s
    calculation:
      - Completed trips
      - Deduct platform fee (5-10%)
      - Apply incentives/penalties
      - Calculate GST
      - Generate payout statement

  initiate-bank-transfer:
    handler: handlers/settlement/transfer.handler
    memory: 256MB
    timeout: 30s
    events:
      - sqs:
          queue: settlement-queue
          batchSize: 10
    transfer_methods:
      - NEFT (< ₹2 lakhs)
      - RTGS (> ₹2 lakhs)
      - IMPS (instant)
      - UPI (< ₹1 lakh)

  # Credit Management
  check-credit-limit:
    handler: handlers/credit/check.handler
    memory: 256MB
    timeout: 5s
    events:
      - http: GET /credit/{shipperId}/available
    checks:
      - Current outstanding
      - Credit limit
      - Payment history
      - Risk score

  update-credit-usage:
    handler: handlers/credit/update.handler
    memory: 256MB
    timeout: 10s
    events:
      - dynamodb:
          stream: bookings-stream
          filterPattern:
            eventName: [INSERT, MODIFY]
    updates:
      - Increase on booking
      - Decrease on payment
      - Alert on limit breach

  # Reconciliation
  reconcile-transactions:
    handler: handlers/reconciliation/reconcile.handler
    memory: 1024MB
    timeout: 300s
    events:
      - eventBridge:
          schedule: cron(0 2 * * ? *)  # Daily at 2 AM
    process:
      - Match gateway transactions
      - Identify discrepancies
      - Generate reconciliation report
      - Flag exceptions

  # Reporting
  generate-financial-report:
    handler: handlers/reports/financial.handler
    memory: 1024MB
    timeout: 60s
    events:
      - http: POST /reports/financial
    report_types:
      - Daily collection
      - Outstanding payments
      - Settlement summary
      - GST reports
      - TDS reports
```

### 2. DynamoDB Tables (On-Demand, ₹0 when idle)

```yaml
tables:
  transactions:
    partition_key: transaction_id
    sort_key: created_at
    attributes:
      - transaction_id: string
      - booking_id: string
      - shipper_id: string
      - fleet_owner_id: string
      - amount: number
      - currency: string
      - status: string  # initiated, processing, success, failed, refunded
      - payment_method: string
      - gateway: string
      - gateway_transaction_id: string
      - created_at: string
      - updated_at: string
      - metadata: map
    gsi:
      - booking-transactions:
          partition_key: booking_id
          sort_key: created_at
      - shipper-transactions:
          partition_key: shipper_id
          sort_key: created_at
      - status-index:
          partition_key: status
          sort_key: created_at
    stream: enabled
    point_in_time_recovery: true

  invoices:
    partition_key: invoice_id
    sort_key: created_at
    attributes:
      - invoice_id: string
      - invoice_number: string
      - booking_id: string
      - shipper_id: string
      - fleet_owner_id: string
      - amount: number
      - gst_amount: number
      - total_amount: number
      - status: string
      - due_date: string
      - paid_date: string
      - s3_url: string
      - created_at: string
    gsi:
      - shipper-invoices:
          partition_key: shipper_id
          sort_key: created_at
      - status-due-date:
          partition_key: status
          sort_key: due_date

  settlements:
    partition_key: settlement_id
    sort_key: settlement_date
    attributes:
      - settlement_id: string
      - fleet_owner_id: string
      - period_start: string
      - period_end: string
      - trips_count: number
      - gross_amount: number
      - platform_fee: number
      - gst: number
      - deductions: map
      - net_amount: number
      - status: string
      - bank_reference: string
      - settlement_date: string
    gsi:
      - fleet-settlements:
          partition_key: fleet_owner_id
          sort_key: settlement_date

  credit_accounts:
    partition_key: shipper_id
    attributes:
      - shipper_id: string
      - credit_limit: number
      - current_usage: number
      - available_credit: number
      - payment_terms: number  # days
      - risk_score: number
      - status: string
      - last_payment_date: string
      - outstanding_invoices: list

  payment_methods:
    partition_key: user_id
    sort_key: method_id
    attributes:
      - user_id: string
      - method_id: string
      - type: string  # card, upi, bank_account
      - details: map  # encrypted
      - is_default: boolean
      - status: string
      - created_at: string
```

### 3. Event-Driven Integration

```yaml
eventbridge_rules:
  payment_success:
    source: payment.service
    detail-type: PaymentSuccess
    targets:
      - Booking status update
      - Invoice generation
      - Notification service
      - Analytics pipeline

  payment_failure:
    source: payment.service
    detail-type: PaymentFailure
    targets:
      - Retry mechanism
      - Alert notifications
      - Credit hold

  settlement_completed:
    source: settlement.service
    detail-type: SettlementCompleted
    targets:
      - Bank transfer initiation
      - SMS/Email notification
      - Accounting system update

  invoice_generated:
    source: invoice.service
    detail-type: InvoiceGenerated
    targets:
      - Email service
      - WhatsApp notification
      - Document storage

sqs_queues:
  payment-processing:
    visibility_timeout: 60
    message_retention: 14 days
    dlq: payment-dlq

  settlement-queue:
    fifo: true
    deduplication: true
    batch_processing: true
```

### 4. Cost Optimization Strategies

```yaml
optimization:
  processing:
    - Batch settlements to reduce Lambda invocations
    - Cache exchange rates in Lambda memory
    - Use SQS for async processing
    - Implement circuit breakers for gateway failures

  storage:
    - Archive old transactions to S3 Glacier
    - Compress invoice PDFs
    - Use DynamoDB TTL for temporary data
    - Store only references, not full documents

  external_apis:
    - Implement request pooling
    - Cache payment status for 5 minutes
    - Batch verification requests
    - Use webhooks instead of polling

  monitoring:
    - Track cost per transaction
    - Alert on anomalous spending
    - Daily cost reports
    - Optimize Lambda memory allocation
```

### 5. Implementation Code Examples

```python
# Payment Initiation
import json
import boto3
import razorpay
import hashlib
import uuid
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
eventbridge = boto3.client('events')
secrets = boto3.client('secretsmanager')

def initiate_payment_handler(event, context):
    try:
        # Parse request
        body = json.loads(event['body'])
        tenant_id = event['headers'].get('X-Tenant-Id')

        # Get payment gateway credentials
        credentials = get_gateway_credentials(body['gateway'])

        # Initialize payment client
        if body['gateway'] == 'razorpay':
            client = razorpay.Client(auth=(credentials['key'], credentials['secret']))

        # Create transaction record
        transaction_id = f"TXN-{uuid.uuid4().hex[:10].upper()}"

        # Prepare order with gateway
        order_data = {
            'amount': int(body['amount'] * 100),  # Convert to paise
            'currency': 'INR',
            'receipt': transaction_id,
            'notes': {
                'booking_id': body['booking_id'],
                'shipper_id': body['shipper_id']
            }
        }

        # Create order with payment gateway
        gateway_order = client.order.create(data=order_data)

        # Store transaction
        table = dynamodb.Table('transactions')
        transaction = {
            'transaction_id': transaction_id,
            'tenant_id': tenant_id,
            'booking_id': body['booking_id'],
            'shipper_id': body['shipper_id'],
            'fleet_owner_id': body.get('fleet_owner_id'),
            'amount': Decimal(str(body['amount'])),
            'currency': 'INR',
            'status': 'initiated',
            'payment_method': body['payment_method'],
            'gateway': body['gateway'],
            'gateway_order_id': gateway_order['id'],
            'created_at': context.aws_request_id,
            'metadata': body.get('metadata', {})
        }

        table.put_item(Item=transaction)

        # Publish event
        eventbridge.put_events(
            Entries=[{
                'Source': 'payment.service',
                'DetailType': 'PaymentInitiated',
                'Detail': json.dumps({
                    'transaction_id': transaction_id,
                    'amount': float(body['amount']),
                    'booking_id': body['booking_id']
                })
            }]
        )

        # Track cost
        track_operation_cost('payment_initiation', context.get_remaining_time_in_millis())

        return {
            'statusCode': 200,
            'body': json.dumps({
                'transaction_id': transaction_id,
                'gateway_order_id': gateway_order['id'],
                'amount': body['amount'],
                'status': 'initiated'
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

# Webhook Processing
def process_webhook_handler(event, context):
    provider = event['pathParameters']['provider']
    webhook_body = json.loads(event['body'])

    # Verify webhook signature
    if not verify_webhook_signature(provider, event['headers'], event['body']):
        return {'statusCode': 401, 'body': 'Invalid signature'}

    # Process based on provider
    if provider == 'razorpay':
        return process_razorpay_webhook(webhook_body)
    elif provider == 'payu':
        return process_payu_webhook(webhook_body)

def process_razorpay_webhook(payload):
    event_type = payload['event']

    if event_type == 'payment.captured':
        # Payment successful
        update_transaction_status(
            payload['payload']['payment']['entity']['receipt'],
            'success',
            payload['payload']['payment']['entity']
        )

        # Trigger invoice generation
        eventbridge.put_events(
            Entries=[{
                'Source': 'payment.service',
                'DetailType': 'PaymentSuccess',
                'Detail': json.dumps({
                    'transaction_id': payload['payload']['payment']['entity']['receipt'],
                    'amount': payload['payload']['payment']['entity']['amount'] / 100,
                    'payment_id': payload['payload']['payment']['entity']['id']
                })
            }]
        )

    elif event_type == 'payment.failed':
        # Payment failed
        update_transaction_status(
            payload['payload']['payment']['entity']['receipt'],
            'failed',
            payload['payload']['payment']['entity']
        )

# Settlement Processing
def process_settlement_handler(event, context):
    # Get settlement period
    settlement_type = event.get('settlement_type', 'daily')
    period = get_settlement_period(settlement_type)

    # Get all fleet owners with completed trips
    fleet_owners = get_fleet_owners_for_settlement(period)

    settlements = []
    for fleet_owner in fleet_owners:
        # Calculate settlement
        trips = get_completed_trips(fleet_owner['fleet_owner_id'], period)

        gross_amount = sum(trip['amount'] for trip in trips)
        platform_fee = gross_amount * Decimal('0.08')  # 8% platform fee
        gst = platform_fee * Decimal('0.18')  # 18% GST

        # Check for any deductions (penalties, adjustments)
        deductions = get_deductions(fleet_owner['fleet_owner_id'], period)

        net_amount = gross_amount - platform_fee - gst - sum(deductions.values())

        # Create settlement record
        settlement_id = f"STL-{uuid.uuid4().hex[:10].upper()}"
        settlement = {
            'settlement_id': settlement_id,
            'fleet_owner_id': fleet_owner['fleet_owner_id'],
            'period_start': period['start'],
            'period_end': period['end'],
            'trips_count': len(trips),
            'gross_amount': gross_amount,
            'platform_fee': platform_fee,
            'gst': gst,
            'deductions': deductions,
            'net_amount': net_amount,
            'status': 'pending',
            'settlement_date': context.aws_request_id
        }

        # Save to DynamoDB
        table = dynamodb.Table('settlements')
        table.put_item(Item=settlement)

        # Queue for bank transfer
        sqs = boto3.client('sqs')
        sqs.send_message(
            QueueUrl='settlement-queue-url',
            MessageBody=json.dumps({
                'settlement_id': settlement_id,
                'fleet_owner_id': fleet_owner['fleet_owner_id'],
                'amount': float(net_amount),
                'bank_details': fleet_owner['bank_details']
            })
        )

        settlements.append(settlement_id)

    return {
        'processed': len(settlements),
        'settlement_ids': settlements
    }

# Invoice Generation
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import io

def generate_invoice_handler(event, context):
    # Get trip details
    trip = get_trip_details(event['detail']['booking_id'])

    # Generate invoice number
    invoice_number = generate_invoice_number()
    invoice_id = f"INV-{uuid.uuid4().hex[:10].upper()}"

    # Calculate amounts
    base_amount = Decimal(str(trip['amount']))
    gst_rate = Decimal('0.18')
    gst_amount = base_amount * gst_rate
    total_amount = base_amount + gst_amount

    # Generate PDF
    pdf_buffer = io.BytesIO()
    c = canvas.Canvas(pdf_buffer, pagesize=A4)

    # Add invoice content
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 800, "TAX INVOICE")
    c.setFont("Helvetica", 12)
    c.drawString(50, 780, f"Invoice No: {invoice_number}")
    c.drawString(50, 760, f"Date: {context.aws_request_id[:10]}")

    # Add trip details
    c.drawString(50, 720, f"Booking ID: {trip['booking_id']}")
    c.drawString(50, 700, f"From: {trip['pickup_location']}")
    c.drawString(50, 680, f"To: {trip['drop_location']}")
    c.drawString(50, 660, f"Distance: {trip['distance_km']} km")
    c.drawString(50, 640, f"Material: {trip['material_type']}")
    c.drawString(50, 620, f"Quantity: {trip['quantity_mt']} MT")

    # Add amounts
    c.drawString(50, 580, f"Base Amount: ₹{base_amount}")
    c.drawString(50, 560, f"GST (18%): ₹{gst_amount}")
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 540, f"Total Amount: ₹{total_amount}")

    c.save()

    # Upload to S3
    s3 = boto3.client('s3')
    pdf_key = f"invoices/{invoice_id}.pdf"
    s3.put_object(
        Bucket='ubertruck-documents',
        Key=pdf_key,
        Body=pdf_buffer.getvalue(),
        ContentType='application/pdf'
    )

    # Save invoice record
    table = dynamodb.Table('invoices')
    table.put_item(Item={
        'invoice_id': invoice_id,
        'invoice_number': invoice_number,
        'booking_id': trip['booking_id'],
        'shipper_id': trip['shipper_id'],
        'fleet_owner_id': trip['fleet_owner_id'],
        'amount': base_amount,
        'gst_amount': gst_amount,
        'total_amount': total_amount,
        'status': 'generated',
        'due_date': calculate_due_date(30),  # 30 days payment terms
        's3_url': f"s3://{bucket}/{pdf_key}",
        'created_at': context.aws_request_id
    })

    # Send notifications
    eventbridge.put_events(
        Entries=[{
            'Source': 'invoice.service',
            'DetailType': 'InvoiceGenerated',
            'Detail': json.dumps({
                'invoice_id': invoice_id,
                'shipper_id': trip['shipper_id'],
                'amount': float(total_amount),
                's3_url': f"s3://{bucket}/{pdf_key}"
            })
        }]
    )

    return {
        'statusCode': 200,
        'body': json.dumps({
            'invoice_id': invoice_id,
            'invoice_number': invoice_number,
            'amount': float(total_amount),
            'pdf_url': generate_presigned_url(bucket, pdf_key)
        })
    }
```

### 6. Monitoring and Alerts

```yaml
cloudwatch_metrics:
  custom:
    - payment_success_rate
    - average_payment_time
    - settlement_processing_time
    - invoice_generation_count
    - refund_rate
    - outstanding_amount

alarms:
  payment_failure_spike:
    metric: payment_failure_rate
    threshold: 0.1  # 10% failure rate
    evaluation_periods: 2

  settlement_delay:
    metric: settlement_processing_time
    threshold: 3600  # 1 hour
    action: SNS notification

  high_refund_rate:
    metric: refund_rate
    threshold: 0.05  # 5% refund rate
    period: 1 day
```

### 7. Expected Costs

```yaml
monthly_costs:
  at_1000_transactions_per_day:
    lambda_invocations: ₹3,000
    dynamodb: ₹2,000
    s3_storage: ₹500
    eventbridge: ₹300
    total: ₹5,800

  at_10000_transactions_per_day:
    lambda_invocations: ₹25,000
    dynamodb: ₹18,000
    s3_storage: ₹3,000
    eventbridge: ₹2,000
    total: ₹48,000

  idle_state:
    all_services: ₹0

  payment_gateway_fees:
    razorpay: 2% per transaction
    payu: 2% per transaction
    upi: ₹1 per transaction
```

## Implementation Priority
1. Basic payment initiation
2. Webhook processing
3. Invoice generation
4. Simple settlements
5. Credit management
6. Bulk processing
7. Advanced reconciliation

## Success Metrics
- Payment success rate > 95%
- Settlement accuracy 100%
- Invoice generation < 5 seconds
- Zero fixed infrastructure costs
- Cost per transaction < ₹2 (excluding gateway fees)