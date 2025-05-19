#!/bin/sh
set -e

if [ "$INIT_DB" = "true" ]; then
  echo "Running database migrations..."
  npx prisma migrate deploy
  echo "Seeding database..."
  npm run seed
fi

echo "Starting backend server..."
exec node dist/index.js