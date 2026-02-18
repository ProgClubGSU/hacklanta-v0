#!/bin/bash
# Verify authentication test results

echo "════════════════════════════════════════════════════════════════"
echo "  AUTHENTICATION TEST VERIFICATION"
echo "════════════════════════════════════════════════════════════════"

echo -e "\n📊 Total Users:"
docker-compose exec postgres psql -U dev -d hackathon -c "SELECT COUNT(*) as total_users FROM users;"

echo -e "\n👥 User Details:"
docker-compose exec postgres psql -U dev -d hackathon -c "SELECT id, email, first_name, last_name, clerk_id, created_at FROM users ORDER BY created_at DESC;"

echo -e "\n🔍 Checking for NULL clerk_ids (should be none):"
docker-compose exec postgres psql -U dev -d hackathon -c "SELECT COUNT(*) as users_without_clerk_id FROM users WHERE clerk_id IS NULL;"

echo -e "\n✅ Checking user-application relationship:"
docker-compose exec postgres psql -U dev -d hackathon -c "
SELECT
  u.email,
  COUNT(a.id) as application_count,
  MAX(a.created_at) as latest_application
FROM users u
LEFT JOIN applications a ON u.id = a.user_id
GROUP BY u.email
ORDER BY u.created_at DESC;"

echo -e "\n════════════════════════════════════════════════════════════════"
