#!/bin/sh
set -e

echo "==> Deploying Prisma database migrations..."
MAX_RETRIES=15
COUNT=0

until npx prisma migrate deploy --schema=server/prisma/schema.prisma || [ $COUNT -eq $MAX_RETRIES ]; do
  COUNT=$((COUNT + 1))
  echo "Waiting for database to accept connections... (attempt $COUNT/$MAX_RETRIES)"
  sleep 2
done

if [ $COUNT -eq $MAX_RETRIES ]; then
  echo "ERROR: Failed to connect to database after $MAX_RETRIES attempts."
  exit 1
fi

if [ "$ALLOW_DEMO_SEED" = "true" ]; then
  echo "==> Seeding database with demo data..."
  node server/prisma/seed.js || echo "Seed skipped or already populated."
fi

echo "==> Starting Sweety backend server..."
exec "$@"

