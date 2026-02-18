#!/bin/bash
# Test resume download security

echo "════════════════════════════════════════════════════════════════"
echo "  RESUME DOWNLOAD SECURITY TEST"
echo "════════════════════════════════════════════════════════════════"

echo -e "\n📋 Current resumes in database:"
docker-compose exec postgres psql -U dev -d hackathon -c "SELECT u.email, a.resume_url FROM applications a JOIN users u ON a.user_id = u.id;"

echo -e "\n📝 Instructions for manual testing:"
echo "1. Sign in as a NON-ADMIN user (e.g., asiannyancat01@gmail.com)"
echo "2. Go to http://localhost:4321/apply"
echo "3. Click 'View Resume' - should work ✅"
echo "4. Copy another user's resume key from the table above"
echo "5. Open browser console and run:"
echo "   fetch('http://localhost:8000/api/v1/applications/download-url/resumes/OTHER_USER_RESUME.pdf', {"
echo "     headers: { 'Authorization': \`Bearer \${await window.Clerk.session.getToken()}\` }"
echo "   }).then(r => r.json()).then(console.log)"
echo "6. Should get: { detail: 'You can only download your own resume' } ❌"
echo ""
echo "7. Now sign in as ADMIN user (jzhang1576@gmail.com)"
echo "8. Try the same request - should work ✅"
echo ""
echo "════════════════════════════════════════════════════════════════"
