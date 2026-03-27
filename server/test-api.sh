#!/bin/bash

# ClearTalk API Test Script
# Tests all endpoints with sample data

BASE_URL="http://localhost:3000"

echo "╔══════════════════════════════════════════════════╗"
echo "║      ClearTalk API Test Suite                    ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to test endpoint
test_endpoint() {
  local name="$1"
  local method="$2"
  local endpoint="$3"
  local data="$4"

  echo -e "${BLUE}Testing:${NC} $name"
  echo "  $method $endpoint"

  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" = "200" ]; then
    echo -e "  ${GREEN}✓ PASSED${NC} (HTTP $http_code)"
    echo "  Response: $(echo "$body" | jq -c '.' 2>/dev/null || echo "$body" | head -c 100)..."
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "  ${RED}✗ FAILED${NC} (HTTP $http_code)"
    echo "  Error: $body"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi

  echo ""
}

# 1. Health Check
test_endpoint \
  "Health Check" \
  "GET" \
  "/health" \
  ""

# 2. Score Message - Good Example
test_endpoint \
  "Score BIFF Message (Good)" \
  "POST" \
  "/api/messages/score" \
  '{"content": "Can you pick up the kids at 3pm Friday at school?"}'

# 3. Score Message - Bad Example
test_endpoint \
  "Score BIFF Message (Bad)" \
  "POST" \
  "/api/messages/score" \
  '{"content": "You never tell me anything! This is ridiculous and I am sick of it!"}'

# 4. Get Suggestions
test_endpoint \
  "Get Rewrite Suggestions" \
  "POST" \
  "/api/messages/suggestions" \
  '{"content": "You always forget! The kids are waiting and you do not care!"}'

# 5. Rewrite Message
test_endpoint \
  "Rewrite Message" \
  "POST" \
  "/api/messages/rewrite" \
  '{"content": "I cannot believe you forgot again! This is completely unacceptable!"}'

# 6. Message Shield - Hostile Content
test_endpoint \
  "Message Shield (Hostile)" \
  "POST" \
  "/api/messages/shield" \
  '{"content": "You are a terrible parent and the kids hate you. But can you pick them up at 3pm?"}'

# 7. Message Shield - Clean Content
test_endpoint \
  "Message Shield (Clean)" \
  "POST" \
  "/api/messages/shield" \
  '{"content": "Pickup at 3pm Friday at school."}'

# 8. Batch Score
test_endpoint \
  "Batch Score Messages" \
  "POST" \
  "/api/analysis/batch-score" \
  '{
    "messages": [
      "Can you pick up kids at 3pm?",
      "You never tell me anything!",
      "Reminder: doctor appointment Tuesday at 2pm."
    ]
  }'

# Summary
echo "╔══════════════════════════════════════════════════╗"
echo "║      Test Results                                ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Passed:${NC} $TESTS_PASSED"
echo -e "${RED}Failed:${NC} $TESTS_FAILED"
echo "Total:  $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
