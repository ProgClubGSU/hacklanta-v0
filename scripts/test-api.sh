#!/bin/bash
# API endpoint testing script

echo "════════════════════════════════════════════════════════════════"
echo "  HACKLANTA API TESTING"
echo "════════════════════════════════════════════════════════════════"

BASE_URL="http://localhost:8000"

echo -e "\n✅ Testing Health Endpoint..."
curl -s "${BASE_URL}/api/v1/health" | jq '.'

echo -e "\n📖 Testing API Docs..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/docs")
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ API Docs accessible at ${BASE_URL}/docs"
else
  echo "❌ API Docs returned HTTP $HTTP_CODE"
fi

echo -e "\n📖 Testing OpenAPI Schema..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/v1/openapi.json")
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ OpenAPI schema accessible"
else
  echo "❌ OpenAPI schema returned HTTP $HTTP_CODE"
fi

echo -e "\n🔒 Testing Unauthorized Access (should return 401)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/v1/applications/me")
if [ "$HTTP_CODE" = "401" ]; then
  echo "✅ Correctly returns 401 for unauthorized request"
else
  echo "⚠️  Expected 401, got HTTP $HTTP_CODE"
fi

echo -e "\n════════════════════════════════════════════════════════════════"
echo "  Run this script to verify API is running correctly"
echo "  For authenticated endpoint tests, use browser console with Clerk token"
echo "════════════════════════════════════════════════════════════════"
