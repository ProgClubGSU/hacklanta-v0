-- ============================================================
-- Hacklanta RLS Policies
-- Run this in Supabase SQL Editor after creating the JWT template in Clerk
-- auth.jwt()->>'sub' returns the Clerk user ID (clerk_id column)
-- ============================================================

-- USERS TABLE
-- Users can read all users (for team finder directory)
-- Only server (service role) can insert/update (via webhooks)
alter table users enable row level security;

create policy "Anyone authenticated can view users"
  on users for select
  to authenticated
  using (true);

create policy "Users can update their own record"
  on users for update
  to authenticated
  using ((select auth.jwt()->>'sub') = clerk_id);

-- PROFILES TABLE
alter table profiles enable row level security;

create policy "Anyone authenticated can view profiles"
  on profiles for select
  to authenticated
  using (true);

create policy "Users can insert their own profile"
  on profiles for insert
  to authenticated
  with check (
    user_id in (
      select id from users where clerk_id = (select auth.jwt()->>'sub')
    )
  );

create policy "Users can update their own profile"
  on profiles for update
  to authenticated
  using (
    user_id in (
      select id from users where clerk_id = (select auth.jwt()->>'sub')
    )
  );

-- TEAMS TABLE
alter table teams enable row level security;

create policy "Anyone authenticated can view teams"
  on teams for select
  to authenticated
  using (true);

create policy "Authenticated users can create teams"
  on teams for insert
  to authenticated
  with check (
    created_by in (
      select id from users where clerk_id = (select auth.jwt()->>'sub')
    )
  );

create policy "Team creator can update team"
  on teams for update
  to authenticated
  using (
    created_by in (
      select id from users where clerk_id = (select auth.jwt()->>'sub')
    )
  );

create policy "Team creator can delete team"
  on teams for delete
  to authenticated
  using (
    created_by in (
      select id from users where clerk_id = (select auth.jwt()->>'sub')
    )
  );

-- TEAM_MEMBERS TABLE
alter table team_members enable row level security;

create policy "Anyone authenticated can view team members"
  on team_members for select
  to authenticated
  using (true);

create policy "Users can join teams (insert own membership)"
  on team_members for insert
  to authenticated
  with check (
    user_id in (
      select id from users where clerk_id = (select auth.jwt()->>'sub')
    )
  );

create policy "Users can leave teams (delete own membership)"
  on team_members for delete
  to authenticated
  using (
    user_id in (
      select id from users where clerk_id = (select auth.jwt()->>'sub')
    )
  );

-- TEAM_JOIN_REQUESTS TABLE
alter table team_join_requests enable row level security;

create policy "Users can view their own join requests"
  on team_join_requests for select
  to authenticated
  using (
    user_id in (select id from users where clerk_id = (select auth.jwt()->>'sub'))
    or
    team_id in (
      select tm.team_id from team_members tm
      join users u on u.id = tm.user_id
      where u.clerk_id = (select auth.jwt()->>'sub') and tm.role = 'leader'
    )
  );

create policy "Users can create join requests"
  on team_join_requests for insert
  to authenticated
  with check (
    user_id in (
      select id from users where clerk_id = (select auth.jwt()->>'sub')
    )
  );

create policy "Users can withdraw own requests, leaders can update team requests"
  on team_join_requests for update
  to authenticated
  using (
    user_id in (select id from users where clerk_id = (select auth.jwt()->>'sub'))
    or
    team_id in (
      select tm.team_id from team_members tm
      join users u on u.id = tm.user_id
      where u.clerk_id = (select auth.jwt()->>'sub') and tm.role = 'leader'
    )
  );

-- APPLICATIONS TABLE (read-only for users, writes via service role)
alter table applications enable row level security;

create policy "Users can view their own application"
  on applications for select
  to authenticated
  using (
    user_id in (
      select id from users where clerk_id = (select auth.jwt()->>'sub')
    )
  );
