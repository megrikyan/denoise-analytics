#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_file="${1:-/opt/denoise-app/backend/app/.env}"
destination="$project_root/secrets/altegio-credentials.json"

test -r "$source_file"
command -v jq >/dev/null

read_value() {
  local key="$1"
  awk -v key="$key" '
    index($0, key "=") == 1 {
      sub("^[^=]*=", "")
      sub("\\r$", "")
      print
      exit
    }
  ' "$source_file"
}

partner_token="$(read_value ALTEGIO_PARTNER_TOKEN)"
user_token="$(read_value ALTEGIO_USER_TOKEN)"
company_id="$(read_value ALTEGIO_COMPANY_ID)"

test -n "$partner_token"
test -n "$user_token"
[[ "$company_id" =~ ^[1-9][0-9]*$ ]]

temporary="$(mktemp "$project_root/secrets/.altegio-credentials.XXXXXX")"
trap 'rm -f "$temporary"' EXIT

jq -n \
  --arg partnerToken "$partner_token" \
  --arg userToken "$user_token" \
  --argjson companyId "$company_id" \
  '{partnerToken: $partnerToken, userToken: $userToken, companyId: $companyId}' \
  >"$temporary"

chmod 0640 "$temporary"
chown root:1000 "$temporary"
mv "$temporary" "$destination"
trap - EXIT

unset partner_token user_token
echo "Altegio analytics secret provisioned."
