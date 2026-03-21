-- RLS POLICIES
-- Run this in Supabase SQL Editor after creating the JWT template in Clerk
-- auth.jwt()->>'sub' returns the Clerk user ID (clerk_id column)
--
-- Key concept: is_accepted gates access to the team finder.
-- Users can always see their own record, but can only see
-- other users/teams/profiles if they themselves are accepted.
-- is_accepted is only set by service role (admin accept flow).
-- ============================================================

-- Helper: check if the requesting user is accepted
-- Use in policies as: is_accepted_user()
-- SECURITY INVOKER ensures this runs as the calling user, not the creator
create or replace function is_accepted_user()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.users
    where clerk_id = (select auth.jwt()->>'sub')
      and is_accepted = true
  );
$$;

-- ============================================================
-- USERS TABLE
-- ============================================================
alter table users enable row level security;

-- Users can always see their own record (needed for getCurrentUserId).
-- Accepted users can also see other accepted users (team finder directory).
create policy "Users can view own record or accepted users if accepted"
  on users for select
  to authenticated
  using (
    clerk_id = (select auth.jwt()->>'sub')
    or (
      is_accepted = true
      and is_accepted_user()
    )
  );

-- Users can update their own record, but NOT is_accepted (enforced by app logic;
-- RLS can't restrict individual columns, so the update policy allows own-record
-- updates and the app never exposes is_accepted in client-side mutations).
create policy "Users can update their own record"
  on users for update
  to authenticated
  using (clerk_id = (select auth.jwt()->>'sub'))
  with check (clerk_id = (select auth.jwt()->>'sub'));

-- ============================================================
-- PROFILES TABLE
-- ============================================================
alter table profiles enable row level security;

-- Only accepted users can view profiles (team finder)
create policy "Accepted users can view profiles"
  on profiles for select
  to authenticated
  using (is_accepted_user());

-- Only accepted users can create a profile
create policy "Accepted users can insert their own profile"
  on profiles for insert
  to authenticated
  with check (
    is_accepted_user()
    and user_id in (
      select id from users where clerk_id = (select auth.jwt()->>'sub')
    )
  );

-- Only accepted users can update their own profile
create policy "Accepted users can update their own profile"
  on profiles for update
  to authenticated
  using (
    is_accepted_user()
    and user_id in (
      select id from users where clerk_id = (select auth.jwt()->>'sub')
    )
  );

-- ============================================================
-- TEAMS TABLE
-- ============================================================
alter table teams enable row level security;

-- Only accepted users can view teams
create policy "Accepted users can view teams"
  on teams for select
  to authenticated
  using (is_accepted_user());

-- Only accepted users can create teams
create policy "Accepted users can create teams"
  on teams for insert
  to authenticated
  with check (
    is_accepted_user()
    and created_by in (
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

-- ============================================================
-- TEAM_MEMBERS TABLE
-- ============================================================
alter table team_members enable row level security;

-- Only accepted users can view team members
create policy "Accepted users can view team members"
  on team_members for select
  to authenticated
  using (is_accepted_user());

-- Only accepted users can join teams
create policy "Accepted users can join teams (insert own membership)"
  on team_members for insert
  to authenticated
  with check (
    is_accepted_user()
    and user_id in (
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

-- ============================================================
-- TEAM_JOIN_REQUESTS TABLE
-- ============================================================
alter table team_join_requests enable row level security;

-- Accepted users can view their own requests or requests to teams they lead
create policy "Users can view own or team leader requests"
  on team_join_requests for select
  to authenticated
  using (
    is_accepted_user()
    and (
      user_id in (select id from users where clerk_id = (select auth.jwt()->>'sub'))
      or team_id in (
        select tm.team_id from team_members tm
        join users u on u.id = tm.user_id
        where u.clerk_id = (select auth.jwt()->>'sub') and tm.role = 'leader'
      )
    )
  );

-- Only accepted users can create join requests
create policy "Accepted users can create join requests"
  on team_join_requests for insert
  to authenticated
  with check (
    is_accepted_user()
    and user_id in (
      select id from users where clerk_id = (select auth.jwt()->>'sub')
    )
  );

create policy "Users can withdraw own requests, leaders can update team requests"
  on team_join_requests for update
  to authenticated
  using (
    user_id in (select id from users where clerk_id = (select auth.jwt()->>'sub'))
    or team_id in (
      select tm.team_id from team_members tm
      join users u on u.id = tm.user_id
      where u.clerk_id = (select auth.jwt()->>'sub') and tm.role = 'leader'
    )
  );

-- ============================================================
-- APPLICATIONS TABLE (read-only for users, writes via service role)
-- ============================================================
alter table applications enable row level security;

create policy "Users can view their own application"
  on applications for select
  to authenticated
  using (
    user_id in (
      select id from users where clerk_id = (select auth.jwt()->>'sub')
    )
  );
