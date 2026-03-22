alter table profiles
  add column if not exists discord_username varchar;

alter table teams
  add column if not exists tracks text[],
  add column if not exists is_looking_for_members boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

update teams
set is_looking_for_members = true
where is_looking_for_members is null;

create table if not exists team_invitations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null constraint team_invitations_team_id_fkey references teams(id) on delete cascade,
  user_id uuid not null constraint team_invitations_user_id_fkey references users(id) on delete cascade,
  invited_by uuid not null constraint team_invitations_invited_by_fkey references users(id) on delete cascade,
  status varchar not null default 'pending',
  message text,
  expires_at timestamptz not null default (now() + interval '7 days'),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_invitations_status_check check (
    status in ('pending', 'accepted', 'declined', 'expired', 'revoked')
  )
);

create index if not exists idx_team_invitations_team_id on team_invitations(team_id);
create index if not exists idx_team_invitations_user_id on team_invitations(user_id);
create index if not exists idx_team_invitations_status on team_invitations(status);
create unique index if not exists idx_team_invitations_pending_unique
  on team_invitations(team_id, user_id)
  where status = 'pending';
