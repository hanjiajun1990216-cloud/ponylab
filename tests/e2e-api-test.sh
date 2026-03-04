#!/bin/bash
# Ponylab E2E API Test Suite
# Tests: multi-role auth, CRUD, cross-module interactions, audit trail, permissions
set -uo pipefail

BASE="http://localhost:4001/api"
PASS=0
FAIL=0
TOTAL=0
TMPDIR=$(mktemp -d)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

assert_status() {
  local desc="$1" expected="$2" actual="$3"
  TOTAL=$((TOTAL + 1))
  if [ "$actual" -eq "$expected" ] 2>/dev/null; then
    echo -e "${GREEN}✓${NC} $desc (HTTP $actual)"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} $desc — expected $expected, got $actual"
    FAIL=$((FAIL + 1))
  fi
}

assert_contains() {
  local desc="$1" body="$2" pattern="$3"
  TOTAL=$((TOTAL + 1))
  if echo "$body" | grep -q "$pattern"; then
    echo -e "${GREEN}✓${NC} $desc"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} $desc — pattern '$pattern' not found"
    echo "  Body: $(echo "$body" | head -c 300)"
    FAIL=$((FAIL + 1))
  fi
}

# Helper: POST with JSON file (avoids shell escaping issues)
post_json() {
  local url="$1" file="$2" token="${3:-}"
  if [ -n "$token" ]; then
    curl -s -w "\n%{http_code}" -X POST "$url" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $token" \
      -d @"$file"
  else
    curl -s -w "\n%{http_code}" -X POST "$url" \
      -H "Content-Type: application/json" \
      -d @"$file"
  fi
}

patch_json() {
  local url="$1" file="$2" token="$3"
  curl -s -w "\n%{http_code}" -X PATCH "$url" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $token" \
    -d @"$file"
}

get_auth() {
  local url="$1" token="$2"
  curl -s -w "\n%{http_code}" "$url" -H "Authorization: Bearer $token"
}

extract() {
  echo "$1" | python3 -c "import sys,json; print(json.loads(sys.stdin.read())$2)" 2>/dev/null
}

split_resp() {
  STATUS=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | sed '$d')
}

echo "============================================"
echo "  Ponylab E2E API Test Suite"
echo "============================================"
echo ""

# ── 1. Health Check ──
echo -e "${YELLOW}━━━ 1. Health Check ━━━${NC}"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/health"); split_resp
assert_status "Health endpoint" 200 "$STATUS"
assert_contains "DB connected" "$BODY" '"connected"'

# ── 2. Multi-Role Auth ──
echo ""
echo -e "${YELLOW}━━━ 2. Multi-Role Authentication ━━━${NC}"

# Admin login
cat > "$TMPDIR/login-admin.json" << 'EOF'
{"email":"admin@ponylab.io","password":"admin123!"}
EOF
RESP=$(post_json "$BASE/auth/login" "$TMPDIR/login-admin.json"); split_resp
assert_status "Admin login" 200 "$STATUS"
ADMIN_TOKEN=$(extract "$BODY" "['accessToken']")
ADMIN_REFRESH=$(extract "$BODY" "['refreshToken']")
echo "  Admin token: ${ADMIN_TOKEN:0:20}..."

# PI login
cat > "$TMPDIR/login-pi.json" << 'EOF'
{"email":"pi@lab.edu","password":"pi123456!"}
EOF
RESP=$(post_json "$BASE/auth/login" "$TMPDIR/login-pi.json"); split_resp
assert_status "PI login" 200 "$STATUS"
PI_TOKEN=$(extract "$BODY" "['accessToken']")

# Researcher login
cat > "$TMPDIR/login-res.json" << 'EOF'
{"email":"researcher@lab.edu","password":"research!"}
EOF
RESP=$(post_json "$BASE/auth/login" "$TMPDIR/login-res.json"); split_resp
assert_status "Researcher login" 200 "$STATUS"
RESEARCHER_TOKEN=$(extract "$BODY" "['accessToken']")

# Technician login
cat > "$TMPDIR/login-tech.json" << 'EOF'
{"email":"tech@lab.edu","password":"tech1234!"}
EOF
RESP=$(post_json "$BASE/auth/login" "$TMPDIR/login-tech.json"); split_resp
assert_status "Technician login" 200 "$STATUS"
TECH_TOKEN=$(extract "$BODY" "['accessToken']")

# Bad password
cat > "$TMPDIR/login-bad.json" << 'EOF'
{"email":"admin@ponylab.io","password":"wrong"}
EOF
RESP=$(post_json "$BASE/auth/login" "$TMPDIR/login-bad.json"); split_resp
assert_status "Bad password rejected" 401 "$STATUS"

# Token refresh
echo "{\"refreshToken\":\"$ADMIN_REFRESH\"}" > "$TMPDIR/refresh.json"
RESP=$(post_json "$BASE/auth/refresh" "$TMPDIR/refresh.json"); split_resp
assert_status "Token refresh" 200 "$STATUS"
assert_contains "New token returned" "$BODY" "accessToken"

# ── 3. User Profiles ──
echo ""
echo -e "${YELLOW}━━━ 3. User Profiles ━━━${NC}"

RESP=$(get_auth "$BASE/users/me" "$ADMIN_TOKEN"); split_resp
assert_status "Admin profile" 200 "$STATUS"
assert_contains "Admin role" "$BODY" '"ADMIN"'
ADMIN_ID=$(extract "$BODY" "['id']")
echo "  Admin ID: $ADMIN_ID"

RESP=$(get_auth "$BASE/users/me" "$PI_TOKEN"); split_resp
assert_status "PI profile" 200 "$STATUS"
PI_ID=$(extract "$BODY" "['id']")

RESP=$(get_auth "$BASE/users/me" "$RESEARCHER_TOKEN"); split_resp
assert_status "Researcher profile" 200 "$STATUS"
RESEARCHER_ID=$(extract "$BODY" "['id']")

RESP=$(get_auth "$BASE/users/me" "$TECH_TOKEN"); split_resp
assert_status "Technician profile" 200 "$STATUS"
TECH_ID=$(extract "$BODY" "['id']")

# Unauthenticated
RESP=$(curl -s -w "\n%{http_code}" "$BASE/users/me"); split_resp
assert_status "Unauthenticated rejected" 401 "$STATUS"

# ── 4. Team CRUD ──
echo ""
echo -e "${YELLOW}━━━ 4. Team CRUD ━━━${NC}"

cat > "$TMPDIR/team.json" << 'EOF'
{"name":"E2E Test Team","description":"Created by E2E test"}
EOF
RESP=$(post_json "$BASE/teams" "$TMPDIR/team.json" "$PI_TOKEN"); split_resp
assert_status "Create team" 201 "$STATUS"
TEAM_ID=$(extract "$BODY" "['id']")
echo "  Team ID: $TEAM_ID"

RESP=$(get_auth "$BASE/teams" "$PI_TOKEN"); split_resp
assert_status "List teams" 200 "$STATUS"
assert_contains "Has teams" "$BODY" "E2E Test Team"

# Add member (route: POST /teams/:id/members/:userId)
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/teams/$TEAM_ID/members/$RESEARCHER_ID" \
  -H "Authorization: Bearer $PI_TOKEN"); split_resp
assert_status "Add researcher to team" 201 "$STATUS"

# ── 5. Project CRUD ──
echo ""
echo -e "${YELLOW}━━━ 5. Project CRUD ━━━${NC}"

echo "{\"name\":\"E2E Test Project\",\"description\":\"Automated test project\",\"teamId\":\"$TEAM_ID\"}" > "$TMPDIR/project.json"
RESP=$(post_json "$BASE/projects" "$TMPDIR/project.json" "$PI_TOKEN"); split_resp
assert_status "Create project" 201 "$STATUS"
PROJECT_ID=$(extract "$BODY" "['id']")
echo "  Project ID: $PROJECT_ID"

RESP=$(get_auth "$BASE/projects/$PROJECT_ID" "$PI_TOKEN"); split_resp
assert_status "Get project" 200 "$STATUS"
assert_contains "Project name" "$BODY" "E2E Test Project"

# ── 6. Experiment Lifecycle ──
echo ""
echo -e "${YELLOW}━━━ 6. Experiment Lifecycle ━━━${NC}"

# Create experiment (DTO only supports: title, content?, projectId)
echo "{\"title\":\"PCR Amplification Test\",\"projectId\":\"$PROJECT_ID\"}" > "$TMPDIR/exp.json"
RESP=$(post_json "$BASE/experiments" "$TMPDIR/exp.json" "$RESEARCHER_TOKEN"); split_resp
assert_status "Create experiment" 201 "$STATUS"
EXPERIMENT_ID=$(extract "$BODY" "['id']")
echo "  Experiment ID: $EXPERIMENT_ID"

RESP=$(get_auth "$BASE/experiments/$EXPERIMENT_ID" "$RESEARCHER_TOKEN"); split_resp
assert_status "Get experiment" 200 "$STATUS"
assert_contains "Has title" "$BODY" "PCR Amplification"

# Update experiment status
cat > "$TMPDIR/exp-update.json" << 'EOF'
{"status":"IN_PROGRESS"}
EOF
RESP=$(patch_json "$BASE/experiments/$EXPERIMENT_ID" "$TMPDIR/exp-update.json" "$RESEARCHER_TOKEN"); split_resp
assert_status "Update experiment" 200 "$STATUS"

# Sign experiment (PI)
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/experiments/$EXPERIMENT_ID/sign" \
  -H "Authorization: Bearer $PI_TOKEN"); split_resp
assert_status "Sign experiment" 201 "$STATUS"
assert_contains "Signed" "$BODY" "signedAt"

# Try modify signed experiment (should fail)
RESP=$(patch_json "$BASE/experiments/$EXPERIMENT_ID" "$TMPDIR/exp-update.json" "$RESEARCHER_TOKEN"); split_resp
assert_status "Modify signed experiment rejected" 403 "$STATUS"

# Try delete signed experiment (should fail)
RESP=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE/experiments/$EXPERIMENT_ID" \
  -H "Authorization: Bearer $RESEARCHER_TOKEN"); split_resp
assert_status "Delete signed experiment rejected" 403 "$STATUS"

# ── 7. Sample Tracking ──
echo ""
echo -e "${YELLOW}━━━ 7. Sample Tracking ━━━${NC}"

# Create sample (field: sampleType, not type)
BARCODE="E2E-$(date +%s)"
echo "{\"name\":\"Blood Sample E2E-001\",\"sampleType\":\"Blood\",\"barcode\":\"$BARCODE\",\"experimentId\":\"$EXPERIMENT_ID\"}" > "$TMPDIR/sample.json"
RESP=$(post_json "$BASE/samples" "$TMPDIR/sample.json" "$TECH_TOKEN"); split_resp
assert_status "Create sample" 201 "$STATUS"
SAMPLE_ID=$(extract "$BODY" "['id']")
echo "  Sample ID: $SAMPLE_ID"

# Add event (field: note, not description)
cat > "$TMPDIR/event.json" << 'EOF'
{"type":"CHECKED_OUT","note":"Centrifuged at 3000rpm for 10min"}
EOF
RESP=$(post_json "$BASE/samples/$SAMPLE_ID/events" "$TMPDIR/event.json" "$TECH_TOKEN"); split_resp
assert_status "Add sample event" 201 "$STATUS"

# Update sample status
cat > "$TMPDIR/sample-status.json" << 'EOF'
{"status":"IN_USE"}
EOF
RESP=$(patch_json "$BASE/samples/$SAMPLE_ID/status" "$TMPDIR/sample-status.json" "$TECH_TOKEN"); split_resp
assert_status "Update sample status" 200 "$STATUS"

RESP=$(get_auth "$BASE/samples" "$TECH_TOKEN"); split_resp
assert_status "List samples" 200 "$STATUS"
assert_contains "Has E2E sample" "$BODY" "Blood Sample E2E"

# ── 8. Inventory Management ──
echo ""
echo -e "${YELLOW}━━━ 8. Inventory Management ━━━${NC}"

# Create inventory (API fields: name, category, quantity, unit, minQuantity, expiryDate)
cat > "$TMPDIR/inv.json" << 'EOF'
{"name":"Taq Polymerase","category":"Enzyme","quantity":50,"unit":"uL","minQuantity":10,"expiryDate":"2027-06-01T00:00:00Z"}
EOF
RESP=$(post_json "$BASE/inventory" "$TMPDIR/inv.json" "$TECH_TOKEN"); split_resp
assert_status "Create inventory item" 201 "$STATUS"
INVENTORY_ID=$(extract "$BODY" "['id']")
echo "  Inventory ID: $INVENTORY_ID"

# Adjust quantity (API: action + amount, not delta)
cat > "$TMPDIR/inv-out.json" << 'EOF'
{"action":"OUT","amount":20,"reason":"Used for PCR experiment E2E"}
EOF
RESP=$(post_json "$BASE/inventory/$INVENTORY_ID/adjust" "$TMPDIR/inv-out.json" "$TECH_TOKEN"); split_resp
assert_status "Inventory OUT 20" 201 "$STATUS"
assert_contains "Quantity 50→30" "$BODY" '"quantityAfter":30'

# Restock (IN)
cat > "$TMPDIR/inv-in.json" << 'EOF'
{"action":"IN","amount":100,"reason":"New shipment received"}
EOF
RESP=$(post_json "$BASE/inventory/$INVENTORY_ID/adjust" "$TMPDIR/inv-in.json" "$TECH_TOKEN"); split_resp
assert_status "Restock inventory" 201 "$STATUS"
assert_contains "Quantity 30→130" "$BODY" '"quantityAfter":130'

# Low stock check
RESP=$(get_auth "$BASE/inventory/low-stock" "$TECH_TOKEN"); split_resp
assert_status "Low stock check" 200 "$STATUS"

# Inventory with logs
RESP=$(get_auth "$BASE/inventory/$INVENTORY_ID" "$TECH_TOKEN"); split_resp
assert_status "Get inventory with logs" 200 "$STATUS"
assert_contains "Has adjustment logs" "$BODY" "quantityBefore"

# ── 9. Protocol Versioning ──
echo ""
echo -e "${YELLOW}━━━ 9. Protocol Versioning ━━━${NC}"

# Create protocol (API: name, description, category, content)
cat > "$TMPDIR/proto.json" << 'EOF'
{"name":"E2E PCR Protocol","description":"Standard PCR amplification","content":{"steps":[{"order":1,"title":"Prepare master mix"},{"order":2,"title":"Run thermocycler"}]}}
EOF
RESP=$(post_json "$BASE/protocols" "$TMPDIR/proto.json" "$PI_TOKEN"); split_resp
assert_status "Create protocol" 201 "$STATUS"
PROTOCOL_ID=$(extract "$BODY" "['id']")
echo "  Protocol ID: $PROTOCOL_ID"

# New version (API: content, changelog)
cat > "$TMPDIR/proto-v2.json" << 'EOF'
{"content":{"steps":[{"order":1,"title":"Prepare master mix v2"},{"order":2,"title":"Run thermocycler"}]},"changelog":"Added DMSO, optimized cycling"}
EOF
RESP=$(post_json "$BASE/protocols/$PROTOCOL_ID/versions" "$TMPDIR/proto-v2.json" "$PI_TOKEN"); split_resp
assert_status "Create protocol v2" 201 "$STATUS"
assert_contains "Version 2" "$BODY" '"version":2'

# Get with versions
RESP=$(get_auth "$BASE/protocols/$PROTOCOL_ID" "$PI_TOKEN"); split_resp
assert_status "Get protocol with versions" 200 "$STATUS"
assert_contains "Has changelog" "$BODY" "changelog"

# Publish
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/protocols/$PROTOCOL_ID/publish" \
  -H "Authorization: Bearer $PI_TOKEN"); split_resp
assert_status "Publish protocol" 201 "$STATUS"
assert_contains "Published" "$BODY" '"isPublished":true'

# ── 10. Instrument Booking ──
echo ""
echo -e "${YELLOW}━━━ 10. Instrument Booking ━━━${NC}"

# Create instrument (unique serial number each run)
SERIAL="E2E-TC-$(date +%s)"
echo "{\"name\":\"E2E Thermocycler\",\"model\":\"BioRad T100\",\"serialNumber\":\"$SERIAL\",\"location\":\"Room 201\"}" > "$TMPDIR/instr.json"
RESP=$(post_json "$BASE/instruments" "$TMPDIR/instr.json" "$ADMIN_TOKEN"); split_resp
assert_status "Create instrument" 201 "$STATUS"
INSTRUMENT_ID=$(extract "$BODY" "['id']")
echo "  Instrument ID: $INSTRUMENT_ID"

# Book instrument (API: title, startTime, endTime, notes)
BOOK_START=$(date -u -v+1d +"%Y-%m-%dT09:00:00Z" 2>/dev/null || date -u -d "+1 day" +"%Y-%m-%dT09:00:00Z")
BOOK_END=$(date -u -v+1d +"%Y-%m-%dT12:00:00Z" 2>/dev/null || date -u -d "+1 day" +"%Y-%m-%dT12:00:00Z")
echo "{\"title\":\"PCR Run\",\"startTime\":\"$BOOK_START\",\"endTime\":\"$BOOK_END\",\"notes\":\"E2E test booking\"}" > "$TMPDIR/booking.json"
RESP=$(post_json "$BASE/instruments/$INSTRUMENT_ID/bookings" "$TMPDIR/booking.json" "$RESEARCHER_TOKEN"); split_resp
assert_status "Book instrument" 201 "$STATUS"

# Conflicting booking
echo "{\"title\":\"Conflict\",\"startTime\":\"$BOOK_START\",\"endTime\":\"$BOOK_END\"}" > "$TMPDIR/booking-conflict.json"
RESP=$(post_json "$BASE/instruments/$INSTRUMENT_ID/bookings" "$TMPDIR/booking-conflict.json" "$TECH_TOKEN"); split_resp
assert_status "Booking conflict detected" 409 "$STATUS"

# Maintenance (API: type, description, performedAt)
cat > "$TMPDIR/maint.json" << 'EOF'
{"type":"CALIBRATION","description":"Annual calibration check","performedAt":"2026-03-04T10:00:00Z"}
EOF
RESP=$(post_json "$BASE/instruments/$INSTRUMENT_ID/maintenance" "$TMPDIR/maint.json" "$ADMIN_TOKEN"); split_resp
assert_status "Add maintenance record" 201 "$STATUS"

# ── 11. Audit Trail ──
echo ""
echo -e "${YELLOW}━━━ 11. Audit Trail Verification ━━━${NC}"

# Admin can view audit
RESP=$(get_auth "$BASE/audit" "$ADMIN_TOKEN"); split_resp
assert_status "Admin can view audit" 200 "$STATUS"
assert_contains "Has audit entries" "$BODY" "action"

# PI can view audit
RESP=$(get_auth "$BASE/audit" "$PI_TOKEN"); split_resp
assert_status "PI can view audit" 200 "$STATUS"

# Researcher cannot view audit
RESP=$(get_auth "$BASE/audit" "$RESEARCHER_TOKEN"); split_resp
assert_status "Researcher blocked from audit" 403 "$STATUS"

# Technician cannot view audit
RESP=$(get_auth "$BASE/audit" "$TECH_TOKEN"); split_resp
assert_status "Technician blocked from audit" 403 "$STATUS"

# Audit by entity (route: GET /audit/entity?type=X&id=Y)
RESP=$(get_auth "$BASE/audit/entity?type=Experiment&id=$EXPERIMENT_ID" "$ADMIN_TOKEN"); split_resp
assert_status "Audit by entity" 200 "$STATUS"

# ── 12. User Registration ──
echo ""
echo -e "${YELLOW}━━━ 12. User Registration ━━━${NC}"

REG_EMAIL="e2e-$(date +%s)@test.io"
echo "{\"email\":\"$REG_EMAIL\",\"password\":\"TestPass123!\",\"firstName\":\"E2E\",\"lastName\":\"User\"}" > "$TMPDIR/register.json"
RESP=$(post_json "$BASE/auth/register" "$TMPDIR/register.json"); split_resp
assert_status "Register new user" 201 "$STATUS"
assert_contains "Returns tokens" "$BODY" "accessToken"

# Duplicate
RESP=$(post_json "$BASE/auth/register" "$TMPDIR/register.json"); split_resp
assert_status "Duplicate email rejected" 409 "$STATUS"

# ── 13. User Listing ──
echo ""
echo -e "${YELLOW}━━━ 13. User Management ━━━${NC}"
RESP=$(get_auth "$BASE/users" "$ADMIN_TOKEN"); split_resp
assert_status "List users" 200 "$STATUS"

# ── 14. Cross-Module Flow ──
echo ""
echo -e "${YELLOW}━━━ 14. Cross-Module Integration Flow ━━━${NC}"
echo "  Flow: Experiment → Sample → Inventory → Audit"

# Create experiment for flow
echo "{\"title\":\"Cross-Module Test\",\"projectId\":\"$PROJECT_ID\"}" > "$TMPDIR/flow-exp.json"
RESP=$(post_json "$BASE/experiments" "$TMPDIR/flow-exp.json" "$RESEARCHER_TOKEN"); split_resp
assert_status "Create experiment for flow" 201 "$STATUS"
FLOW_EXP_ID=$(extract "$BODY" "['id']")

# Create linked sample
FLOW_BARCODE="FLOW-$(date +%s)"
echo "{\"name\":\"Flow Sample 001\",\"sampleType\":\"Tissue\",\"barcode\":\"$FLOW_BARCODE\",\"experimentId\":\"$FLOW_EXP_ID\"}" > "$TMPDIR/flow-sample.json"
RESP=$(post_json "$BASE/samples" "$TMPDIR/flow-sample.json" "$TECH_TOKEN"); split_resp
assert_status "Create linked sample" 201 "$STATUS"
FLOW_SAMPLE_ID=$(extract "$BODY" "['id']")

# Track sample processing
cat > "$TMPDIR/evt-recv.json" << 'EOF'
{"type":"CHECKED_IN","note":"Sample received from clinic"}
EOF
RESP=$(post_json "$BASE/samples/$FLOW_SAMPLE_ID/events" "$TMPDIR/evt-recv.json" "$TECH_TOKEN"); split_resp
assert_status "Event: checked_in" 201 "$STATUS"

cat > "$TMPDIR/evt-proc.json" << 'EOF'
{"type":"CONSUMED","note":"Homogenized and extracted DNA"}
EOF
RESP=$(post_json "$BASE/samples/$FLOW_SAMPLE_ID/events" "$TMPDIR/evt-proc.json" "$TECH_TOKEN"); split_resp
assert_status "Event: consumed" 201 "$STATUS"

# Consume inventory during processing
cat > "$TMPDIR/inv-consume.json" << 'EOF'
{"action":"OUT","amount":5,"reason":"DNA extraction for Flow Sample 001"}
EOF
RESP=$(post_json "$BASE/inventory/$INVENTORY_ID/adjust" "$TMPDIR/inv-consume.json" "$TECH_TOKEN"); split_resp
assert_status "Consume reagent" 201 "$STATUS"

# Verify sample has full event history
RESP=$(get_auth "$BASE/samples/$FLOW_SAMPLE_ID" "$TECH_TOKEN"); split_resp
assert_status "Sample with events" 200 "$STATUS"
assert_contains "Has events" "$BODY" "CONSUMED"

# Verify inventory has all adjustments
RESP=$(get_auth "$BASE/inventory/$INVENTORY_ID" "$TECH_TOKEN"); split_resp
assert_status "Inventory audit trail" 200 "$STATUS"
assert_contains "Has DNA extraction log" "$BODY" "DNA extraction"

echo ""
echo "============================================"
echo -e "  Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}, $TOTAL total"
echo "============================================"

# Cleanup
rm -rf "$TMPDIR"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
