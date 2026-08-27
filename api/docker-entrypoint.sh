#!/bin/sh
# Applies any pending SQL migrations (idempotent - see scripts/migrate.ts)
# before every start, then boots the API.
set -e

echo "Running database migrations..."
node dist/scripts/migrate.js

echo "Starting API..."
exec node dist/src/main.js
