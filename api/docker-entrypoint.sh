#!/bin/sh
# Applies any pending SQL migrations (idempotent - see scripts/migrate.ts),
# seeds the base roles/actions (idempotent - see scripts/seed.ts), then boots
# the API.
set -e

echo "Running database migrations..."
node dist/scripts/migrate.js

echo "Seeding database..."
node dist/scripts/seed.js

echo "Starting API..."
exec node dist/src/main.js
