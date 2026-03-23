-- RLS POLICIES
-- Run this in Supabase SQL Editor after creating the JWT template in Clerk
-- auth.jwt()->>'sub' returns the Clerk user ID (clerk_id column)
--
-- Key concepts:
-- * is_accepted gates dashboard access (profile editing, viewing own data).
-- * is_confirmed gates team finder access (browsing teams, other profiles, joining teams).
-- * is_accepted is set by service role (admin accept flow).
-- * is_confirmed is set by service role (user confirmation endpoint).
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

-- Helper: check if the requesting user is confirmed
-- Use in policies as: is_confirmed_user()
-- Gates team finder access — only confirmed attendees can browse teams/profiles
create or replace function is_confirmed_user()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.users
    where clerk_id = (select auth.jwt()->>'sub')
      and is_confirmed = true
  );
$$;

-- ============================================================
-- USERS TABLE
-- ============================================================
alter table users enable row level security;

-- Users can always see their own record (needed for getCurrentUserId).
-- Confirmed users can also see other accepted users (team finder directory).
create policy "Users can view own record or accepted users if confirmed"
  on users for select
  to authenticated
  using (
    clerk_id = (select auth.jwt()->>'sub')
    or (
      is_accepted = true
      and is_confirmed_user()
    )
  );

-- Users can update their own record, but NOT is_accepted/is_confirmed (enforced by app logic;
-- RLS can't restrict individual columns, so the update policy allows own-record
-- updates and the app never exposes is_accepted/is_confirmed in client-side mutations).
create policy "Users can update their own record"
  on users for update
  to authenticated
  using (clerk_id = (select auth.jwt()->>'sub'))
  with check (clerk_id = (select auth.jwt()->>'sub'));

-- ============================================================
-- PROFILES TABLE
-- ============================================================
alter table profiles enable row level security;

-- Accepted users can view their own profile (needed for profile editor + confirmation flow).
-- Confirmed users can view all profiles (team finder).
create policy "Own profile if accepted, all profiles if confirmed"
  on profiles for select
  to authenticated
  using (
    (
      is_accepted_user()
      and user_id in (
        select id from users where clerk_id = (select auth.jwt()->>'sub')
      )
    )
    or is_confirmed_user()
  );

-- Only accepted users can create a profile (needed before confirmation)
create policy "Accepted users can insert their own profile"
  on profiles for insert
  to authenticated
  with check (
    is_accepted_user()
    and user_id in (
      select id from users where clerk_id = (select auth.jwt()->>'sub')
    )
  );

-- Only accepted users can update their own profile (needed before confirmation)
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

-- Only confirmed users can view teams
create policy "Confirmed users can view teams"
  on teams for select
  to authenticated
  using (is_confirmed_user());

-- Only confirmed users can create teams
create policy "Confirmed users can create teams"
  on teams for insert
  to authenticated
  with check (
    is_confirmed_user()
    and created_by in (
      select id from users where clerk_id = (select auth.jwt()->>'sub')
    )
  );

create policy "Team members can update their team"
  on teams for update
  to authenticated
  using (
    id in (
      select tm.team_id from team_members tm
      join users u on u.id = tm.user_id
      where u.clerk_id = (select auth.jwt()->>'sub')
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

-- Only confirmed users can view team members
create policy "Confirmed users can view team members"
  on team_members for select
  to authenticated
  using (is_confirmed_user());

-- Only confirmed users can join teams
create policy "Confirmed users can join teams or leaders can add members"
  on team_members for insert
  to authenticated
  with check (
    is_confirmed_user()
    and (
      -- Users can add themselves (join by code, accept invitation)
      user_id in (
        select id from users where clerk_id = (select auth.jwt()->>'sub')
      )
      -- OR team leaders can add members (approve join request)
      or team_id in (
        select tm.team_id from team_members tm
        join users u on u.id = tm.user_id
        where u.clerk_id = (select auth.jwt()->>'sub') and tm.role = 'leader'
      )
    )
  );

create policy "Team leaders can update member roles"
  on team_members for update
  to authenticated
  using (
    team_id in (
      select tm.team_id from team_members tm
      join users u on u.id = tm.user_id
      where u.clerk_id = (select auth.jwt()->>'sub') and tm.role = 'leader'
    )
  );

create policy "Members can leave or leaders can kick"
  on team_members for delete
  to authenticated
  using (
    -- Users can delete their own membership (leave)
    user_id in (
      select id from users where clerk_id = (select auth.jwt()->>'sub')
    )
    -- OR team leaders can delete any member's row (kick)
    or team_id in (
      select tm.team_id from team_members tm
      join users u on u.id = tm.user_id
      where u.clerk_id = (select auth.jwt()->>'sub') and tm.role = 'leader'
    )
  );

-- ============================================================
-- TEAM_JOIN_REQUESTS TABLE
-- ============================================================
alter table team_join_requests enable row level security;

-- Confirmed users can view their own requests or requests to teams they lead
create policy "Users can view own or team leader requests"
  on team_join_requests for select
  to authenticated
  using (
    is_confirmed_user()
    and (
      user_id in (select id from users where clerk_id = (select auth.jwt()->>'sub'))
      or team_id in (
        select tm.team_id from team_members tm
        join users u on u.id = tm.user_id
        where u.clerk_id = (select auth.jwt()->>'sub') and tm.role = 'leader'
      )
    )
  );

-- Only confirmed users can create join requests
create policy "Confirmed users can create join requests"
  on team_join_requests for insert
  to authenticated
  with check (
    is_confirmed_user()
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
-- TEAM_INVITATIONS TABLE
-- ============================================================
alter table team_invitations enable row level security;

-- Confirmed users can see invitations where they are the invitee,
-- the inviter, or a leader of the team.
create policy "Confirmed users can view relevant team invitations"
  on team_invitations for select
  to authenticated
  using (
    is_confirmed_user()
    and (
      user_id in (select id from users where clerk_id = (select auth.jwt()->>'sub'))
      or invited_by in (select id from users where clerk_id = (select auth.jwt()->>'sub'))
      or team_id in (
        select tm.team_id from team_members tm
        join users u on u.id = tm.user_id
        where u.clerk_id = (select auth.jwt()->>'sub') and tm.role = 'leader'
      )
    )
  );

-- Team leaders can send invitations.
create policy "Team leaders can create team invitations"
  on team_invitations for insert
  to authenticated
  with check (
    is_confirmed_user()
    and invited_by in (
      select id from users where clerk_id = (select auth.jwt()->>'sub')
    )
    and team_id in (
      select tm.team_id from team_members tm
      join users u on u.id = tm.user_id
      where u.clerk_id = (select auth.jwt()->>'sub') and tm.role = 'leader'
    )
  );

-- Invitees can respond (accept/decline), inviters and leaders can revoke.
create policy "Invitees can respond, inviters and leaders can update invitations"
  on team_invitations for update
  to authenticated
  using (
    user_id in (select id from users where clerk_id = (select auth.jwt()->>'sub'))
    or invited_by in (select id from users where clerk_id = (select auth.jwt()->>'sub'))
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
