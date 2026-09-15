#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

test -f "$project_root/.env"
test -f "$project_root/secrets/google-service-account.json"
docker network inspect denoise_public >/dev/null
docker compose -f "$project_root/infra/docker-compose.yml" config --quiet
docker compose -f "$project_root/infra/docker-compose.yml" up -d --build --remove-orphans
docker compose -f "$project_root/infra/docker-compose.yml" ps

