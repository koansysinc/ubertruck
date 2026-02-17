#!/bin/bash
# Verification hook that runs before every Claude response
# This enforces the DEVELOPMENT_PROTOCOL.md rules

set -e

UBERTRUCK_DIR="/home/koans/projects/ubertruck"
STATE_FILE="$UBERTRUCK_DIR/CURRENT_STATE.json"
PROTOCOL_FILE="$UBERTRUCK_DIR/DEVELOPMENT_PROTOCOL.md"

echo "================================="
echo "🔍 PROTOCOL VERIFICATION HOOK"
echo "================================="
echo ""

# Check if state file exists
if [ ! -f "$STATE_FILE" ]; then
    echo "❌ ERROR: CURRENT_STATE.json not found!"
    echo "Cannot proceed without state tracking."
    exit 1
fi

# Check if protocol file exists
if [ ! -f "$PROTOCOL_FILE" ]; then
    echo "❌ ERROR: DEVELOPMENT_PROTOCOL.md not found!"
    echo "Cannot proceed without development protocol."
    exit 1
fi

# Display current state summary using Python
echo "📊 CURRENT STATE SUMMARY:"
echo "------------------------"
python3 << 'EOF'
import json
import sys

try:
    with open('/home/koans/projects/ubertruck/CURRENT_STATE.json', 'r') as f:
        state = json.load(f)

    print(f"Last Updated: {state.get('lastUpdated', 'N/A')}")
    print("")

    backend = state.get('backend', {})
    print("Backend Status:")
    print(f"  Running: {backend.get('running', 'N/A')}")
    print(f"  Port: {backend.get('port', 'N/A')}")
    print(f"  Database: {backend.get('database', 'N/A')}")
    print("")

    frontend = state.get('frontend', {})
    print("Frontend Status:")
    print(f"  Running: {frontend.get('running', 'N/A')}")
    print(f"  Port: {frontend.get('port', 'N/A')}")
    print("")

    verified = state.get('verifiedEndpoints', [])
    issues = state.get('knownIssues', [])
    print(f"Verified Endpoints: {len(verified)}")
    print(f"Known Issues: {len(issues)}")
    print("")

    # Frozen requirements status
    print("🔒 FROZEN REQUIREMENTS STATUS:")
    print("------------------------------")
    frozen = state.get('frozenRequirements', {})

    pricing = frozen.get('pricing_rate', {})
    print(f"  Pricing (₹5/tonne/km): {pricing.get('status', 'UNKNOWN')}")

    gst = frozen.get('gst_rate', {})
    print(f"  GST (18%): {gst.get('status', 'UNKNOWN')}")

    otp = frozen.get('otp_digits', {})
    print(f"  OTP (6 digits): {otp.get('status', 'UNKNOWN')}")
    print("")

except Exception as e:
    print(f"Error reading state: {e}", file=sys.stderr)
    sys.exit(1)
EOF

# Display protocol reminder
echo "📋 PROTOCOL REMINDER:"
echo "--------------------"
echo "  ✅ Test before claiming"
echo "  ✅ Show test output"
echo "  ✅ Update CURRENT_STATE.json"
echo "  ❌ No assumptions"
echo "  ❌ No 'should work' claims"
echo ""

echo "================================="
echo "✅ Verification complete. Proceeding..."
echo "================================="
echo ""

exit 0
