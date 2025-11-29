#!/bin/bash

# Script to monitor slow queries in real-time
# Usage: ./scripts/check-slow-queries.sh

echo "🔍 Monitoring slow queries (>100ms)..."
echo "Press Ctrl+C to stop"
echo ""

# Watch logs for slow query warnings
if [ -f "logs/app.log" ]; then
  tail -f logs/app.log | grep --line-buffered "Slow query"
else
  echo "⚠️  Log file not found. Make sure app is running."
  echo "Watching console output instead..."
  echo ""
  # Alternative: watch the console output
  yarn start:dev 2>&1 | grep --line-buffered "Slow query"
fi
