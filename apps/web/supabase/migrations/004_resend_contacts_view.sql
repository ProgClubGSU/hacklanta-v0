CREATE OR REPLACE VIEW resend_contacts AS
SELECT
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.is_accepted,
  u.is_confirmed,
  u.created_at,
  COALESCE(a.status, 'no_application') as app_status,
  a.university,
  a.experience_level,
  CASE WHEN tm.id IS NOT NULL THEN true ELSE false END as has_team,
  CASE WHEN p.id IS NOT NULL THEN true ELSE false END as has_profile,
  p.discord_username,
  p.looking_for_team
FROM users u
LEFT JOIN applications a ON a.user_id = u.id
LEFT JOIN team_members tm ON tm.user_id = u.id
LEFT JOIN profiles p ON p.user_id = u.id;
