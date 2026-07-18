#!/bin/bash
# Start all 8 payroll services
# Prerequisites: docker compose up, databases created, pnpm build done

set -e

SERVICES=(
  "auth-service:3001"
  "employee-service:3002"
  "payroll-service:3003"
  "payroll-processing-service:3004"
  "payroll-projection-service:3005"
  "notification-service:3006"
  "email-service:3007"
  "audit-service:3008"
)

PIDS=()

cleanup() {
  echo ""
  echo "Stopping all services..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  exit 0
}

trap cleanup SIGINT SIGTERM

for entry in "${SERVICES[@]}"; do
  NAME="${entry%%:*}"
  PORT="${entry##*:}"
  echo "Starting $NAME on port $PORT..."
  node "dist/apps/$NAME/src/main.js" &
  PIDS+=($!)
  sleep 1
done

echo ""
echo "All services started. PIDs: ${PIDS[*]}"
echo "Press Ctrl+C to stop all services."

wait