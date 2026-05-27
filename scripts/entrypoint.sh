#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."

# Extract host and port from DATABASE_URL
DB_HOST=$(node -e "
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log(url.hostname);
  } catch (e) {
    console.log('localhost');
  }
")

DB_PORT=$(node -e "
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log(url.port || '5432');
  } catch (e) {
    console.log('5432');
  }
")

until node -e "
  const net = require('net');
  const client = net.connect({ host: '$DB_HOST', port: parseInt('$DB_PORT') }, () => {
    client.end();
    process.exit(0);
  });
  client.on('error', () => {
    process.exit(1);
  });
  setTimeout(() => process.exit(1), 1000);
" 2>/dev/null; do
  echo "PostgreSQL is unavailable at $DB_HOST:$DB_PORT - sleeping"
  sleep 1
done

echo "PostgreSQL is up - executing migrations"
npx prisma migrate deploy

echo "Starting API application..."
exec node apps/api/dist/server.js
