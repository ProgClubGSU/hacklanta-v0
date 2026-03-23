-- ============================================================
-- 1. Add missing columns to teams table
-- ============================================================
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS is_looking_for_members BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ============================================================
-- 2. Create team_invitations table
-- ============================================================
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR NOT NULL DEFAULT 'pending',
  message TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT team_invitations_status_check CHECK (
    status IN ('pending', 'accepted', 'declined', 'expired', 'revoked')
  )
);

CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_user_id ON team_invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_invitations_pending_unique
  ON team_invitations(team_id, user_id) WHERE status = 'pending';

-- ============================================================
-- 3. RLS for team_invitations
-- ============================================================
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accepted users can view relevant team invitations"
  ON team_invitations FOR SELECT TO authenticated
  USING (
    is_accepted_user()
    AND (
      user_id IN (SELECT id FROM users WHERE clerk_id = (SELECT auth.jwt()->>'sub'))
      OR invited_by IN (SELECT id FROM users WHERE clerk_id = (SELECT auth.jwt()->>'sub'))
      OR team_id IN (
        SELECT tm.team_id FROM team_members tm
        JOIN users u ON u.id = tm.user_id
        WHERE u.clerk_id = (SELECT auth.jwt()->>'sub') AND tm.role = 'leader'
      )
    )
  );

CREATE POLICY "Team leaders can create team invitations"
  ON team_invitations FOR INSERT TO authenticated
  WITH CHECK (
    is_accepted_user()
    AND invited_by IN (SELECT id FROM users WHERE clerk_id = (SELECT auth.jwt()->>'sub'))
    AND team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE u.clerk_id = (SELECT auth.jwt()->>'sub') AND tm.role = 'leader'
    )
  );

CREATE POLICY "Invitees can respond, inviters and leaders can update invitations"
  ON team_invitations FOR UPDATE TO authenticated
  USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = (SELECT auth.jwt()->>'sub'))
    OR invited_by IN (SELECT id FROM users WHERE clerk_id = (SELECT auth.jwt()->>'sub'))
    OR team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE u.clerk_id = (SELECT auth.jwt()->>'sub') AND tm.role = 'leader'
    )
  );

-- ============================================================
-- 4. Fix: team_members needs UPDATE policy (leader promotion)
-- ============================================================
CREATE POLICY "Team leaders can update member roles"
  ON team_members FOR UPDATE TO authenticated
  USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE u.clerk_id = (SELECT auth.jwt()->>'sub') AND tm.role = 'leader'
    )
  );

-- ============================================================
-- 5. Fix: team_members INSERT must allow leaders to add approved members
-- ============================================================
DROP POLICY IF EXISTS "Accepted users can join teams (insert own membership)" ON team_members;

CREATE POLICY "Accepted users can join teams or leaders can add members"
  ON team_members FOR INSERT TO authenticated
  WITH CHECK (
    is_accepted_user()
    AND (
      user_id IN (SELECT id FROM users WHERE clerk_id = (SELECT auth.jwt()->>'sub'))
      OR team_id IN (
        SELECT tm.team_id FROM team_members tm
        JOIN users u ON u.id = tm.user_id
        WHERE u.clerk_id = (SELECT auth.jwt()->>'sub') AND tm.role = 'leader'
      )
    )
  );

-- ============================================================
-- 6. Fix: teams UPDATE must allow any team member (for syncTeamOpenStatus)
-- ============================================================
DROP POLICY IF EXISTS "Team creator can update team" ON teams;

CREATE POLICY "Team members can update their team"
  ON teams FOR UPDATE TO authenticated
  USING (
    id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE u.clerk_id = (SELECT auth.jwt()->>'sub')
    )
  );
