#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

docker compose -f "$project_root/infra/docker-compose.yml" config --quiet
docker run --rm \
  -v "$project_root:/app" \
  -v /app/node_modules \
  -w /app \
  node:22.22.3-bookworm-slim \
  bash -lc 'npm ci && npm run check'

echo "All checks passed."

