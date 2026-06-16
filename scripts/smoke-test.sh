#!/usr/bin/env bash
#
# Live smoke test for the AssessOS deployment.
# Verifies the deployed web pages render and the API endpoints respond.
#
# Usage:
#   API_URL=https://assessosapi-production.up.railway.app \
#   WEB_URL=https://assessosweb-production.up.railway.app \
#   TENANT=demo \
#   bash scripts/smoke-test.sh
#
set -u

API_URL="${API_URL:-https://assessosapi-production.up.railway.app}"
WEB_URL="${WEB_URL:-https://assessosweb-production.up.railway.app}"
TENANT="${TENANT:-demo}"
TIMEOUT=20

pass=0
fail=0

check() {
  local label="$1" url="$2" expected="$3" tenant_header="${4:-}"
  local code
  if [ -n "$tenant_header" ]; then
    code=$(curl -s -m "$TIMEOUT" -H "x-tenant-id: $TENANT" -o /dev/null -w "%{http_code}" "$url")
  else
    code=$(curl -s -m "$TIMEOUT" -o /dev/null -w "%{http_code}" "$url")
  fi
  if [ "$code" = "$expected" ]; then
    echo "  PASS  [$code] $label"
    pass=$((pass + 1))
  else
    echo "  FAIL  [$code, want $expected] $label"
    fail=$((fail + 1))
  fi
}

echo "=== AssessOS smoke test ==="
echo "API: $API_URL"
echo "WEB: $WEB_URL"
echo ""

echo "--- Web pages (expect 200) ---"
for pg in "" dashboard dashboard/practice dashboard/challenges \
          dashboard/hackathon dashboard/hiring dashboard/hiring/pipeline \
          dashboard/interviews; do
  check "/$pg" "$WEB_URL/$pg" 200
done

echo ""
echo "--- API public endpoints (expect 200, with tenant header) ---"
check "/api/coding/problems"     "$API_URL/api/coding/problems"     200 tenant
check "/api/coding/leaderboards" "$API_URL/api/coding/leaderboards" 200 tenant
check "/api/hackathons"          "$API_URL/api/hackathons"          200 tenant

echo ""
echo "--- API auth-gated endpoints (expect 403 while Firebase auth disabled) ---"
check "/api/hiring/dashboard"    "$API_URL/api/hiring/dashboard"    403 tenant
check "/api/practice/question"   "$API_URL/api/practice/question"   403 tenant

echo ""
echo "=== Result: $pass passed, $fail failed ==="
[ "$fail" -eq 0 ]
