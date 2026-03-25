#!/bin/sh
set -e

# Read and display version if available
if [ -f /usr/share/nginx/html/version.txt ]; then
    VERSION=$(cat /usr/share/nginx/html/version.txt)
    echo "=========================================="
    echo "🎮 Conjakeions+ v${VERSION}"
    echo "=========================================="
    echo "Starting services..."
    echo ""
fi

# Run auto-backfill to ensure last 7 days are present
echo "🔄 Checking for missing puzzles (last 7 days)..."
cd /app
node scripts/auto-backfill.js || echo "⚠️  Auto-backfill had issues, continuing anyway..."
echo ""

# Start the puzzle scheduler in the background
echo "🤖 Starting puzzle collection scheduler..."
cd /app
node scripts/scheduler.js > /var/log/scheduler.log 2>&1 &
SCHEDULER_PID=$!
echo "   Scheduler PID: $SCHEDULER_PID"
echo "   Logs: /var/log/scheduler.log"
echo "   Schedule: 2am, 8am, 2pm, 8pm daily"
echo ""

# Start nginx
echo "🌐 Starting nginx web server..."
echo ""

# Execute the CMD (nginx)
exec "$@"
