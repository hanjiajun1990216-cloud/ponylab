#!/bin/bash
# PonyLab V2 E2E Test Script
set -e
API="http://localhost:4001/api"
PASS=0
FAIL=0
TOTAL=0

ok() { PASS=$((PASS+1)); TOTAL=$((TOTAL+1)); echo "  ✅ $1"; }
fail() { FAIL=$((FAIL+1)); TOTAL=$((TOTAL+1)); echo "  ❌ $1: $2"; }

test_api() {
  local desc="$1" method="$2" path="$3" token="$4" body="$5" expect="$6"
  local opts="-s -o /tmp/ponylab_resp.json -w %{http_code}"

  if [ -n "$body" ]; then
    HTTP_CODE=$(curl $opts -X "$method" "$API$path" -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d "$body")
  elif [ -n "$token" ]; then
    HTTP_CODE=$(curl $opts -X "$method" "$API$path" -H "Authorization: Bearer $token")
  else
    HTTP_CODE=$(curl $opts -X "$method" "$API$path")
  fi

  if [ "$HTTP_CODE" = "$expect" ]; then
    ok "$desc (HTTP $HTTP_CODE)"
  else
    BODY=$(cat /tmp/ponylab_resp.json 2>/dev/null | head -c 200)
    fail "$desc" "expected $expect, got $HTTP_CODE: $BODY"
  fi
}

echo "╔══════════════════════════════════════════════════╗"
echo "║        PonyLab V2 — E2E 全流程测试               ║"
echo "╚══════════════════════════════════════════════════╝"

# ── 1. Health Check ──
echo ""
echo "━━━ 1. Health Check ━━━"
test_api "健康检查" GET "/health" "" "" "200"

# ── 2. Auth ──
echo ""
echo "━━━ 2. 认证流程 ━━━"

# Login Admin
RESP=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"admin@ponylab.io\",\"password\":\"admin123\u0021\"}")
ADMIN_TOKEN=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))" 2>/dev/null)
if [ -n "$ADMIN_TOKEN" ] && [ "$ADMIN_TOKEN" != "" ]; then ok "Admin 登录成功"; else fail "Admin 登录" "no token"; fi

# Login PI
RESP=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"pi@lab.edu\",\"password\":\"pi123456\u0021\"}")
PI_TOKEN=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))" 2>/dev/null)
if [ -n "$PI_TOKEN" ] && [ "$PI_TOKEN" != "" ]; then ok "PI 登录成功"; else fail "PI 登录" "no token"; fi

# Login Researcher
RESP=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"researcher@lab.edu\",\"password\":\"research\u0021\"}")
RESEARCHER_TOKEN=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))" 2>/dev/null)
if [ -n "$RESEARCHER_TOKEN" ] && [ "$RESEARCHER_TOKEN" != "" ]; then ok "Researcher 登录成功"; else fail "Researcher 登录" "no token"; fi

# Login Tech
RESP=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"tech@lab.edu\",\"password\":\"tech1234\u0021\"}")
TECH_TOKEN=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))" 2>/dev/null)
if [ -n "$TECH_TOKEN" ] && [ "$TECH_TOKEN" != "" ]; then ok "Tech 登录成功"; else fail "Tech 登录" "no token"; fi

# BUG-001: Duplicate email
echo ""
echo "━━━ 2b. 注册重复邮箱 (BUG-001) ━━━"
test_api "重复邮箱注册应拒绝" POST "/auth/register" "" "{\"email\":\"admin@ponylab.io\",\"password\":\"test1234\",\"firstName\":\"Dup\",\"lastName\":\"Test\"}" "409"

# Get profile (SEC-001 check)
echo ""
echo "━━━ 2c. Profile + SEC-001 检查 ━━━"
test_api "获取 Admin Profile" GET "/users/me" "$ADMIN_TOKEN" "" "200"
# Check no passwordHash in response
HAS_HASH=$(curl -s "$API/users/me" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print('YES' if 'passwordHash' in str(d) else 'NO')" 2>/dev/null)
if [ "$HAS_HASH" = "NO" ]; then ok "SEC-001: passwordHash 未暴露"; else fail "SEC-001" "passwordHash exposed"; fi

# ── 3. Teams ──
echo ""
echo "━━━ 3. 团队管理 ━━━"
test_api "获取团队列表" GET "/teams" "$ADMIN_TOKEN" "" "200"
TEAM_ID=$(curl -s "$API/teams" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])" 2>/dev/null)
echo "  (Team ID: ${TEAM_ID:0:10}...)"

test_api "获取团队详情" GET "/teams/$TEAM_ID" "$ADMIN_TOKEN" "" "200"
test_api "获取团队成员" GET "/teams/$TEAM_ID/members" "$ADMIN_TOKEN" "" "200"
MEMBERS=$(curl -s "$API/teams/$TEAM_ID/members" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
echo "  (成员数: $MEMBERS)"

# ── 4. Directions ──
echo ""
echo "━━━ 4. 研究方向 ━━━"
test_api "获取方向列表" GET "/directions?teamId=$TEAM_ID" "$ADMIN_TOKEN" "" "200"
DIR_ID=$(curl -s "$API/directions?teamId=$TEAM_ID" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])" 2>/dev/null)
test_api "获取方向详情" GET "/directions/$DIR_ID" "$ADMIN_TOKEN" "" "200"

# Create new direction
test_api "创建新方向" POST "/directions" "$ADMIN_TOKEN" "{\"name\":\"Drug Discovery Pipeline\",\"description\":\"High-throughput screening\",\"teamId\":\"$TEAM_ID\"}" "201"

# ── 5. Projects ──
echo ""
echo "━━━ 5. 项目管理 ━━━"
test_api "获取团队项目" GET "/projects/team/$TEAM_ID" "$ADMIN_TOKEN" "" "200"
PROJECT_ID=$(curl -s "$API/projects/team/$TEAM_ID" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])" 2>/dev/null)
test_api "获取项目详情（含任务+评论）" GET "/projects/$PROJECT_ID" "$ADMIN_TOKEN" "" "200"

# Check project detail contains tasks
TASK_COUNT=$(curl -s "$API/projects/$PROJECT_ID" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('tasks',[])))" 2>/dev/null)
if [ "$TASK_COUNT" -gt 0 ] 2>/dev/null; then ok "项目包含 $TASK_COUNT 个任务"; else fail "项目任务" "no tasks found"; fi

# ── 6. Experiments ──
echo ""
echo "━━━ 6. 实验管理 ━━━"
test_api "获取实验列表" GET "/experiments/project/$PROJECT_ID" "$ADMIN_TOKEN" "" "200"
EXP_ID=$(curl -s "$API/experiments/project/$PROJECT_ID" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])" 2>/dev/null)
test_api "获取实验详情" GET "/experiments/$EXP_ID" "$ADMIN_TOKEN" "" "200"

# ── 7. Samples ──
echo ""
echo "━━━ 7. 样品管理 ━━━"
test_api "获取样品列表" GET "/samples" "$ADMIN_TOKEN" "" "200"

# ── 8. Inventory ──
echo ""
echo "━━━ 8. 库存管理 ━━━"
test_api "获取库存列表" GET "/inventory" "$ADMIN_TOKEN" "" "200"
INV_ID=$(curl -s "$API/inventory" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])" 2>/dev/null)

# BUG-003: Inventory adjust
test_api "BUG-003: 库存调整(入库)" POST "/inventory/$INV_ID/adjust" "$ADMIN_TOKEN" "{\"action\":\"IN\",\"amount\":10,\"reason\":\"Test restock\"}" "201"
test_api "BUG-003: 库存调整(出库)" POST "/inventory/$INV_ID/adjust" "$ADMIN_TOKEN" "{\"action\":\"OUT\",\"amount\":2,\"reason\":\"Test usage\"}" "201"

# ── 9. Instruments ──
echo ""
echo "━━━ 9. 仪器管理 ━━━"
test_api "获取仪器列表" GET "/instruments" "$ADMIN_TOKEN" "" "200"
INST_ID=$(curl -s "$API/instruments" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])" 2>/dev/null)
test_api "获取仪器详情" GET "/instruments/$INST_ID" "$ADMIN_TOKEN" "" "200"

# Calendar endpoint
test_api "仪器日历数据" GET "/instruments/$INST_ID/calendar?start=2026-03-01&end=2026-03-31" "$ADMIN_TOKEN" "" "200"

# ── 10. Protocols ──
echo ""
echo "━━━ 10. 协议管理 ━━━"
test_api "获取协议列表" GET "/protocols" "$ADMIN_TOKEN" "" "200"

# ── 11. Comments ──
echo ""
echo "━━━ 11. 评论系统 ━━━"
test_api "获取项目评论" GET "/comments?projectId=$PROJECT_ID" "$ADMIN_TOKEN" "" "200"

# Create comment
test_api "创建项目评论" POST "/comments" "$ADMIN_TOKEN" "{\"content\":\"E2E test comment\",\"projectId\":\"$PROJECT_ID\"}" "201"
COMMENT_ID=$(curl -s "$API/comments?projectId=$PROJECT_ID" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys,json; comments=json.load(sys.stdin); print(comments[-1]['id'] if comments else '')" 2>/dev/null)

if [ -n "$COMMENT_ID" ]; then
  # Reply to comment
  test_api "回复评论" POST "/comments/$COMMENT_ID/replies" "$ADMIN_TOKEN" "{\"content\":\"Reply from E2E test\"}" "201"
fi

# ── 12. Announcements ──
echo ""
echo "━━━ 12. 公告系统 ━━━"
test_api "获取公告列表" GET "/announcements?scope=TEAM&teamId=$TEAM_ID" "$ADMIN_TOKEN" "" "200"
test_api "创建团队公告" POST "/announcements" "$ADMIN_TOKEN" "{\"title\":\"E2E Test Announcement\",\"content\":\"This is a test\",\"scope\":\"TEAM\",\"teamId\":\"$TEAM_ID\"}" "201"

# ── 13. Notifications ──
echo ""
echo "━━━ 13. 通知系统 ━━━"
test_api "获取通知列表" GET "/notifications" "$ADMIN_TOKEN" "" "200"
test_api "获取未读数量" GET "/notifications/unread-count" "$ADMIN_TOKEN" "" "200"
test_api "全部标记已读" PATCH "/notifications/read-all" "$ADMIN_TOKEN" "" "200"

# ── 14. TaskSteps ──
echo ""
echo "━━━ 14. 任务步骤 ━━━"
TASK_ID=$(curl -s "$API/projects/$PROJECT_ID" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['tasks'][0]['id'] if d.get('tasks') else '')" 2>/dev/null)
if [ -n "$TASK_ID" ]; then
  test_api "创建任务步骤" POST "/tasks/$TASK_ID/steps" "$ADMIN_TOKEN" "{\"title\":\"E2E test step\"}" "201"
fi

# ── 15. Audit (BUG-006) ──
echo ""
echo "━━━ 15. 审计日志 (BUG-006) ━━━"
test_api "获取审计日志" GET "/audit" "$ADMIN_TOKEN" "" "200"
test_api "BUG-006: 空参数查询应拒绝" GET "/audit/entity?entityType=&entityId=" "$ADMIN_TOKEN" "" "400"

# ── 16. Permission (BUG-005 + DESIGN-002) ──
echo ""
echo "━━━ 16. 权限检查 (BUG-005) ━━━"
# Researcher should NOT be able to delete project
test_api "BUG-005: Researcher 删除项目应被拒绝" DELETE "/projects/$PROJECT_ID" "$RESEARCHER_TOKEN" "" "403"

# ── Summary ──
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  测试结果: $PASS/$TOTAL 通过 | $FAIL 失败         ║"
echo "║  通过率: $(python3 -c "print(f'{$PASS/$TOTAL*100:.1f}%')")                                   ║"
echo "╚══════════════════════════════════════════════════╝"
