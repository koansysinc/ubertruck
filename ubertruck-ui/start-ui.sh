#!/bin/bash
echo "========================================"
echo "Starting UberTruck UI..."
echo "========================================"
echo ""
cd ubertruck-ui
echo "Opening browser at http://localhost:3000"
echo ""
echo "Testing checklist:"
echo "  1. Phone validation (+91[6-9]XXXXXXXXX)"
echo "  2. OTP entry (6 digits with timer)"
echo "  3. Booking wizard (4 steps)"
echo "  4. Price breakdown (GST calculation)"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
npm start
