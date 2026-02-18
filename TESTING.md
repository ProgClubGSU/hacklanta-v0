# Hacklanta Testing Guide

## ✅ Complete Testing Checklist

### 1. Authentication & User Management

#### Test Case 1.1: Sign Up (New User)
- [ ] Navigate to http://localhost:4321/sign-up
- [ ] Sign up with Google OAuth
- [ ] Verify redirect to /apply page
- [ ] Check browser console - should see no errors
- [ ] Verify user synced to database:
  ```bash
  docker-compose exec postgres psql -U dev -d hackathon -c "SELECT id, email, first_name, last_name, clerk_id FROM users ORDER BY created_at DESC LIMIT 1;"
  ```
- [ ] Verify `clerk_id` is populated
- [ ] Verify email matches your account

#### Test Case 1.2: Sign Out & Sign In
- [ ] Sign out (if Clerk provides sign-out button)
- [ ] Navigate to http://localhost:4321/sign-in
- [ ] Sign in with existing account
- [ ] Verify redirect to /apply
- [ ] Verify no duplicate user created in database

#### Test Case 1.3: Multiple Auth Methods
- [ ] Try signing up with GitHub OAuth (if configured)
- [ ] Try signing up with email/password
- [ ] Verify all methods create user records correctly

---

### 2. Application Submission Flow

#### Test Case 2.1: Submit New Application
- [ ] Navigate to http://localhost:4321/apply
- [ ] Verify application form loads
- [ ] Fill out all required fields:
  - University: `Georgia State University`
  - Major: `Computer Science`
  - Year: `junior`
  - Graduation Date: `2026-05-15`
  - Resume: Upload a PDF file
  - GitHub URL: `https://github.com/yourusername`
  - LinkedIn URL: `https://linkedin.com/in/yourusername`
  - Why attend: Write 50+ characters (test character counter)
  - Experience level: `intermediate`
  - Dietary restrictions: `Vegetarian`
  - T-shirt size: `L`
- [ ] Click Submit
- [ ] Verify success message/redirect
- [ ] Check database:
  ```bash
  docker-compose exec postgres psql -U dev -d hackathon -c "SELECT id, status, university, major, resume_url, created_at FROM applications ORDER BY created_at DESC LIMIT 1;"
  ```
- [ ] Verify status is `pending`
- [ ] Verify `resume_url` is populated with S3 key

#### Test Case 2.2: Verify S3 Upload
- [ ] Copy the `resume_url` from database (e.g., `resumes/abc-123.pdf`)
- [ ] Go to AWS S3 Console: https://console.aws.amazon.com/s3
- [ ] Navigate to `hacklanta-uploads` bucket
- [ ] Click into `resumes/` folder
- [ ] Verify your file is there with the correct UUID filename
- [ ] Download the file and verify it's your resume

#### Test Case 2.3: Application Status Display
- [ ] Refresh http://localhost:4321/apply
- [ ] Verify you now see APPLICATION STATUS instead of the form
- [ ] Verify all submitted data is displayed correctly
- [ ] Verify status shows "Pending Review"
- [ ] Verify "Edit Application" button is visible

---

### 3. Edit Application Flow

#### Test Case 3.1: Edit Pending Application
- [ ] Click "Edit Application" button
- [ ] Verify form loads with pre-filled data
- [ ] Change University to `Emory University`
- [ ] Change Major to `Software Engineering`
- [ ] Update "Why attend" text
- [ ] Click Submit
- [ ] Verify success message
- [ ] Check database:
  ```bash
  docker-compose exec postgres psql -U dev -d hackathon -c "SELECT university, major, why_attend, updated_at FROM applications ORDER BY updated_at DESC LIMIT 1;"
  ```
- [ ] Verify changes are saved
- [ ] Verify `updated_at` timestamp changed

#### Test Case 3.2: Resume Re-upload
- [ ] Click "Edit Application"
- [ ] Upload a different PDF resume
- [ ] Submit
- [ ] Check database for new `resume_url`
- [ ] Verify old resume is still in S3 (not deleted - that's OK for now)
- [ ] Verify new resume is uploaded to S3

#### Test Case 3.3: Edit Restrictions (Status-Based)
- [ ] Manually change application status to `accepted`:
  ```bash
  docker-compose exec postgres psql -U dev -d hackathon -c "UPDATE applications SET status = 'accepted' WHERE user_id = (SELECT id FROM users WHERE email = 'your@email.com');"
  ```
- [ ] Refresh /apply page
- [ ] Verify "Edit Application" button is **NOT** visible
- [ ] Try to manually call PATCH endpoint (via browser console):
  ```javascript
  fetch('http://localhost:8000/api/v1/applications/me', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${await window.Clerk.session.getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ university: 'Hacked University' })
  }).then(r => r.json()).then(console.log)
  ```
- [ ] Verify response is **403 Forbidden** with message about status
- [ ] Change status back to `pending` to continue testing:
  ```bash
  docker-compose exec postgres psql -U dev -d hackathon -c "UPDATE applications SET status = 'pending' WHERE user_id = (SELECT id FROM users WHERE email = 'your@email.com');"
  ```

---

### 4. Database Integrity Tests

#### Test Case 4.1: Foreign Key Constraints
- [ ] Try to create application for non-existent user (should fail):
  ```bash
  docker-compose exec postgres psql -U dev -d hackathon -c "INSERT INTO applications (user_id, university, major, year_of_study, experience_level, tshirt_size, why_attend) VALUES ('00000000-0000-0000-0000-000000000000', 'Test', 'Test', 'junior', 'beginner', 'M', 'test test test test test test test test test test test test test');"
  ```
- [ ] Verify error: `foreign key constraint "applications_user_id_fkey"`

#### Test Case 4.2: Unique Constraints
- [ ] Check if user can submit multiple applications (should fail if unique constraint exists):
  ```bash
  docker-compose exec postgres psql -U dev -d hackathon -c "SELECT COUNT(*) FROM applications WHERE user_id = (SELECT id FROM users WHERE email = 'your@email.com');"
  ```
- [ ] If you have 1 application, try submitting another via API
- [ ] Should get error or it should update existing (depending on implementation)

#### Test Case 4.3: Required Fields
- [ ] Check database schema:
  ```bash
  docker-compose exec postgres psql -U dev -d hackathon -c "\d applications"
  ```
- [ ] Verify `NOT NULL` constraints on:
  - `user_id`
  - `university`
  - `major`
  - `year_of_study`
  - `experience_level`
  - `tshirt_size`

---

### 5. API Endpoint Tests

#### Test Case 5.1: GET /api/v1/applications/me
- [ ] Open browser console on /apply page
- [ ] Run:
  ```javascript
  fetch('http://localhost:8000/api/v1/applications/me', {
    headers: {
      'Authorization': `Bearer ${await window.Clerk.session.getToken()}`
    }
  }).then(r => r.json()).then(console.log)
  ```
- [ ] Verify returns your application data
- [ ] Verify all fields match database

#### Test Case 5.2: POST /api/v1/applications/upload-url
- [ ] Run in console:
  ```javascript
  fetch('http://localhost:8000/api/v1/applications/upload-url', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await window.Clerk.session.getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filename: 'test-resume.pdf',
      content_type: 'application/pdf'
    })
  }).then(r => r.json()).then(console.log)
  ```
- [ ] Verify response contains `upload_url` and `key`
- [ ] Verify `upload_url` starts with `https://hacklanta-uploads.s3`

#### Test Case 5.3: POST /api/v1/users/sync
- [ ] Run in console:
  ```javascript
  fetch('http://localhost:8000/api/v1/users/sync', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await window.Clerk.session.getToken()}`
    }
  }).then(r => r.json()).then(console.log)
  ```
- [ ] Verify response: `{ status: 'synced', user_id: '...', email: '...' }`
- [ ] Verify running it again doesn't create duplicate user

#### Test Case 5.4: Unauthorized Access
- [ ] Open incognito window
- [ ] Try to access API without auth:
  ```bash
  curl http://localhost:8000/api/v1/applications/me
  ```
- [ ] Verify 401 Unauthorized response

---

### 6. Validation & Error Handling

#### Test Case 6.1: Field Validation
- [ ] Try submitting form with invalid data:
  - [ ] University: Leave blank (should show error)
  - [ ] Why attend: Type only 10 characters (should show error - min 50)
  - [ ] Why attend: Type 1500 characters (should show error - max 1000)
  - [ ] Experience level: Leave unselected (should show error)
  - [ ] T-shirt size: Leave unselected (should show error)

#### Test Case 6.2: File Upload Validation
- [ ] Try uploading non-PDF file (should show error or reject)
- [ ] Try uploading very large file (>10MB - should handle gracefully)

#### Test Case 6.3: URL Validation
- [ ] Try invalid GitHub URL: `not-a-url`
- [ ] Try invalid LinkedIn URL: `linkedin.com/bad`
- [ ] Verify validation errors shown

---

### 7. Performance & UX Tests

#### Test Case 7.1: Loading States
- [ ] Verify loading spinner shows while:
  - [ ] Fetching application data
  - [ ] Uploading resume to S3
  - [ ] Submitting application
  - [ ] Editing application

#### Test Case 7.2: Error Messages
- [ ] Disconnect internet
- [ ] Try submitting application
- [ ] Verify user-friendly error message shown
- [ ] Reconnect internet
- [ ] Verify can retry successfully

#### Test Case 7.3: Character Counter
- [ ] In "Why attend" field, type text
- [ ] Verify live character count updates
- [ ] Verify shows remaining characters
- [ ] Verify turns red when exceeding limit

---

### 8. Database Relationships & Migrations

#### Test Case 8.1: Check All Tables
```bash
docker-compose exec postgres psql -U dev -d hackathon -c "\dt"
```
- [ ] Verify tables exist:
  - [ ] users
  - [ ] applications
  - [ ] teams
  - [ ] team_members
  - [ ] events
  - [ ] announcements
  - [ ] food_menu_items
  - [ ] food_orders
  - [ ] food_order_items
  - [ ] email_logs
  - [ ] alembic_version

#### Test Case 8.2: Check Migrations
```bash
docker-compose exec api uv run alembic current
docker-compose exec api uv run alembic history
```
- [ ] Verify migrations applied successfully
- [ ] Verify current migration is latest

#### Test Case 8.3: Foreign Key Relationships
```bash
docker-compose exec postgres psql -U dev -d hackathon -c "SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;"
```
- [ ] Verify foreign keys:
  - [ ] applications.user_id → users.id
  - [ ] applications.reviewed_by → users.id
  - [ ] team_members.team_id → teams.id
  - [ ] team_members.user_id → users.id
  - [ ] food_orders.user_id → users.id

---

### 9. Security Tests

#### Test Case 9.1: SQL Injection Protection
- [ ] Try malicious input in form fields:
  - University: `'; DROP TABLE applications; --`
  - Why attend: `<script>alert('xss')</script>`
- [ ] Verify data is safely stored
- [ ] Verify no SQL errors
- [ ] Check database - data should be escaped/sanitized

#### Test Case 9.2: CORS Policy
- [ ] Open browser console
- [ ] Try making API call from different origin
- [ ] Verify CORS headers allow localhost:4321
- [ ] Verify CORS blocks unauthorized origins

#### Test Case 9.3: JWT Token Expiration
- [ ] Sign in
- [ ] Wait for token to expire (or manually set old token)
- [ ] Try making API request
- [ ] Verify 401 Unauthorized
- [ ] Verify user is prompted to sign in again

---

### 10. Multi-User Testing

#### Test Case 10.1: Multiple Users
- [ ] Create 3 different user accounts (different emails)
- [ ] Submit application for each user
- [ ] Verify each user only sees their own application
- [ ] Check database:
  ```bash
  docker-compose exec postgres psql -U dev -d hackathon -c "SELECT users.email, applications.university, applications.status FROM applications JOIN users ON applications.user_id = users.id ORDER BY applications.created_at;"
  ```
- [ ] Verify 3 separate applications exist

#### Test Case 10.2: Isolation Test
- [ ] Sign in as User A
- [ ] Note User A's application ID
- [ ] Try to access User B's application:
  ```javascript
  fetch('http://localhost:8000/api/v1/applications/{user_b_id}', {
    headers: { 'Authorization': `Bearer ${await window.Clerk.session.getToken()}` }
  }).then(r => r.json()).then(console.log)
  ```
- [ ] Verify 403 Forbidden or 404 Not Found
- [ ] Verify User A cannot edit User B's application

---

## 🔧 Quick Test Scripts

### Script 1: Full Database Inspection
```bash
#!/bin/bash
echo "=== USERS ==="
docker-compose exec postgres psql -U dev -d hackathon -c "SELECT id, email, first_name, last_name, created_at FROM users ORDER BY created_at DESC;"

echo -e "\n=== APPLICATIONS ==="
docker-compose exec postgres psql -U dev -d hackathon -c "SELECT a.id, u.email, a.status, a.university, a.major, a.resume_url, a.created_at FROM applications a JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC;"

echo -e "\n=== APPLICATION COUNT PER USER ==="
docker-compose exec postgres psql -U dev -d hackathon -c "SELECT u.email, COUNT(a.id) as app_count FROM users u LEFT JOIN applications a ON u.id = a.user_id GROUP BY u.email;"
```

Save as `scripts/inspect-db.sh`, make executable: `chmod +x scripts/inspect-db.sh`

### Script 2: Reset Test Data
```bash
#!/bin/bash
echo "⚠️  WARNING: This will delete ALL applications and users!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" = "yes" ]; then
  docker-compose exec postgres psql -U dev -d hackathon -c "TRUNCATE applications, users CASCADE;"
  echo "✅ Test data reset complete"
else
  echo "❌ Cancelled"
fi
```

Save as `scripts/reset-test-data.sh`, make executable: `chmod +x scripts/reset-test-data.sh`

### Script 3: Check API Health
```bash
#!/bin/bash
echo "Checking API health..."
curl -s http://localhost:8000/api/v1/health | jq

echo -e "\nChecking API docs..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs

echo -e "\n\nAPI is running!"
```

Save as `scripts/check-api.sh`, make executable: `chmod +x scripts/check-api.sh`

---

## ✅ Test Completion Criteria

You can consider testing complete when:
- [ ] All 10 test sections passed
- [ ] No console errors during normal flow
- [ ] Database contains expected data
- [ ] S3 bucket contains uploaded resumes
- [ ] Edit functionality works with status restrictions
- [ ] Multiple users can submit/edit independently
- [ ] Validation prevents invalid data
- [ ] API returns appropriate error codes
- [ ] No duplicate users or applications created

---

## 🐛 Known Issues to Watch For

1. **User not synced** - If you see "User not found", check that `/users/sync` endpoint is called on /apply page load
2. **CORS errors** - Make sure CORS_ORIGINS in .env.local includes http://localhost:4321
3. **Resume upload fails** - Check AWS credentials and S3 bucket permissions
4. **Application status not updating** - Check that status enum values match exactly (lowercase)
5. **Edit button not showing** - Verify status is 'pending' or 'waitlisted', not 'accepted' or 'rejected'

---

## 📝 Testing Log Template

Use this to track your test results:

| Test Case | Status | Notes | Date |
|-----------|--------|-------|------|
| 1.1 Sign Up | ⏳ | | |
| 1.2 Sign In | ⏳ | | |
| 2.1 Submit App | ⏳ | | |
| 2.2 S3 Upload | ⏳ | | |
| 3.1 Edit App | ⏳ | | |
| ... | | | |

Legend: ⏳ Not Started | 🔄 In Progress | ✅ Passed | ❌ Failed
