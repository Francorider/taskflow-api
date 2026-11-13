#!/bin/sh
set -e

node dist/migrate.js

if [ "$SEED_DEMO_DATA" = "true" ]; then
  node dist/seed.js
fi

exec "$@"
