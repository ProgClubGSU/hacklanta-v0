#!/bin/bash
# Database inspection script for Hacklanta

echo "════════════════════════════════════════════════════════════════"
echo "  HACKLANTA DATABASE INSPECTION"
echo "════════════════════════════════════════════════════════════════"

echo -e "\n📊 === USERS ==="
docker-compose exec postgres psql -U dev -d hackathon -c "SELECT id, email, first_name, last_name, role, created_at FROM users ORDER BY created_at DESC;"

echo -e "\n📝 === APPLICATIONS ==="
docker-compose exec postgres psql -U dev -d hackathon -c "SELECT a.id, u.email, a.status, a.university, a.major, a.year_of_study, a.experience_level, LEFT(a.resume_url, 40) as resume, a.created_at FROM applications a JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC;"

echo -e "\n📈 === STATS ==="
docker-compose exec postgres psql -U dev -d hackathon -c "
SELECT
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT a.id) as total_applications,
  COUNT(DISTINCT CASE WHEN a.status = 'pending' THEN a.id END) as pending,
  COUNT(DISTINCT CASE WHEN a.status = 'accepted' THEN a.id END) as accepted,
  COUNT(DISTINCT CASE WHEN a.status = 'rejected' THEN a.id END) as rejected,
  COUNT(DISTINCT CASE WHEN a.status = 'waitlisted' THEN a.id END) as waitlisted
FROM users u
LEFT JOIN applications a ON u.id = a.user_id;"

echo -e "\n🔗 === APPLICATION COUNT PER USER ==="
docker-compose exec postgres psql -U dev -d hackathon -c "SELECT u.email, COUNT(a.id) as app_count, MAX(a.created_at) as last_application FROM users u LEFT JOIN applications a ON u.id = a.user_id GROUP BY u.email ORDER BY app_count DESC;"

echo -e "\n════════════════════════════════════════════════════════════════"
