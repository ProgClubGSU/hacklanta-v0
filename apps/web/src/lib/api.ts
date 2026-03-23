import type { SupabaseClient } from '@supabase/supabase-js';

import { notifyProfileChanged, notifyTeamChanged } from './dashboard-events';
import { createClerkSupabaseClient, waitForClerk } from './supabase';

interface UserRow {
  id: string;
  clerk_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

interface ProfileRow {
  id: string;
  user_id: string;
  display_name: string | null;
  bio: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  discord_username: string | null;
  looking_for_team: boolean | null;
  users?: Partial<UserRow> | null;
}

interface TeamRow {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  max_size: number;
  tracks: string[] | null;
  is_looking_for_members: boolean | null;
  created_by: string;
  created_at?: string;
}

interface TeamMemberRow {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at?: string;
  users?: Partial<UserRow> | null;
}

interface TeamJoinRequestRow {
  id: string;
  team_id: string;
  user_id: string;
  status: string;
  message: string | null;
  expires_at: string;
  created_at: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  users?: Partial<UserRow> | null;
}

interface TeamInvitationRow {
  id: string;
  team_id: string;
  user_id: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked';
  message: string | null;
  expires_at: string;
  created_at: string;
  responded_at: string | null;
}

function getClient(): SupabaseClient {
  return createClerkSupabaseClient();
}

function isMissingRowError(error: { code?: string } | null) {
  return error?.code === 'PGRST116';
}

function getFullName(user: Partial<UserRow> | null | undefined) {
  const firstName = user?.first_name?.trim() ?? '';
  const lastName = user?.last_name?.trim() ?? '';
  return `${firstName} ${lastName}`.trim();
}

function flattenMember(member: TeamMemberRow) {
  const { users, ...rest } = member;

  return {
    ...rest,
    first_name: users?.first_name ?? null,
    last_name: users?.last_name ?? null,
    avatar_url: users?.avatar_url ?? null,
  };
}

function flattenJoinRequest(request: TeamJoinRequestRow) {
  const { users, ...rest } = request;

  return {
    ...rest,
    user_first_name: users?.first_name ?? null,
    user_last_name: users?.last_name ?? null,
    user_avatar_url: users?.avatar_url ?? null,
  };
}

function formatParticipant(
  user: UserRow,
  profile?: ProfileRow | null,
  membership?: { team_id: string; role: string; team_name: string | null },
) {
  const fullName = getFullName(user);

  return {
    id: user.id,
    user_id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    avatar_url: user.avatar_url,
    display_name: profile?.display_name?.trim() || fullName || 'Anonymous Hacker',
    bio: profile?.bio ?? null,
    linkedin_url: profile?.linkedin_url ?? null,
    github_url: profile?.github_url ?? null,
    portfolio_url: profile?.portfolio_url ?? null,
    discord_username: profile?.discord_username ?? null,
    looking_for_team: membership?.team_id ? false : (profile?.looking_for_team ?? false),
    has_profile: Boolean(profile),
    current_team: membership?.team_id
      ? {
          id: membership.team_id,
          name: membership.team_name ?? 'Team',
          role: membership.role,
        }
      : null,
  };
}

async function resolveCurrentUserId(client: SupabaseClient): Promise<string> {
  await waitForClerk();
  const clerkId = window.Clerk?.user?.id;
  if (!clerkId) throw new Error('Not authenticated');

  const { data, error } = await client.from('users').select('id').eq('clerk_id', clerkId).single();

  if (!error && data) return data.id as string;
  if (error && !isMissingRowError(error)) throw new Error(error.message);

  const token = await window.Clerk?.session?.getToken();
  const syncRes = await fetch('/api/users/sync', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!syncRes.ok) throw new Error('Failed to sync user. Please refresh the page.');

  const synced = await syncRes.json();
  return synced.user_id as string;
}

async function getCurrentMembership(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from('team_members')
    .select('id, team_id, user_id, role, joined_at')
    .eq('user_id', userId)
    .single();

  if (error && isMissingRowError(error)) return null;
  if (error) throw new Error(error.message);
  return data as TeamMemberRow;
}

async function getTeamMemberCount(client: SupabaseClient, teamId: string) {
  const { count, error } = await client
    .from('team_members')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', teamId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function syncTeamOpenStatus(client: SupabaseClient, teamId: string) {
  const { data, error } = await client
    .from('teams')
    .select('id, max_size, team_members(id)')
    .eq('id', teamId)
    .single();

  if (error) throw new Error(error.message);

  const team = data as TeamRow & { team_members?: Array<{ id: string }> };
  const memberCount = team.team_members?.length ?? 0;
  const isLookingForMembers = memberCount < team.max_size;

  const { error: updateError } = await client
    .from('teams')
    .update({ is_looking_for_members: isLookingForMembers })
    .eq('id', teamId);

  if (updateError) throw new Error(updateError.message);
}

async function withdrawPendingJoinRequests(client: SupabaseClient, userId: string) {
  await client
    .from('team_join_requests')
    .update({ status: 'withdrawn' })
    .eq('user_id', userId)
    .eq('status', 'pending');
}

async function markInviteAcceptedByCode(client: SupabaseClient, userId: string, teamId: string) {
  const { data, error } = await client
    .from('team_invitations')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .eq('status', 'pending');

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return;

  const invitationIds = data.map((invitation) => invitation.id as string);
  const { error: updateError } = await client
    .from('team_invitations')
    .update({ status: 'accepted', responded_at: new Date().toISOString() })
    .in('id', invitationIds);

  if (updateError) throw new Error(updateError.message);
}

export const api = {
  getCurrentUserId: async () => {
    const client = getClient();
    return resolveCurrentUserId(client);
  },

  getProfile: async () => {
    const client = getClient();
    const userId = await resolveCurrentUserId(client);
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && isMissingRowError(error)) return null;
    if (error) throw new Error(error.message);
    return data;
  },

  upsertProfile: async (profileData: {
    display_name: string;
    bio?: string;
    linkedin_url?: string;
    github_url?: string;
    portfolio_url?: string;
    discord_username?: string;
    looking_for_team?: boolean;
  }) => {
    const client = getClient();
    const userId = await resolveCurrentUserId(client);
    const payload = {
      user_id: userId,
      display_name: profileData.display_name,
      bio: profileData.bio ?? null,
      linkedin_url: profileData.linkedin_url ?? null,
      github_url: profileData.github_url ?? null,
      portfolio_url: profileData.portfolio_url ?? null,
      discord_username: profileData.discord_username ?? null,
      looking_for_team: profileData.looking_for_team ?? false,
    };

    const { data, error } = await client
      .from('profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw new Error(error.message);

    notifyProfileChanged();
    return data;
  },

  listProfiles: async () => {
    const client = getClient();
    const { data, error } = await client
      .from('profiles')
      .select('*, users(first_name, last_name, avatar_url)')
      .eq('looking_for_team', true);

    if (error) throw new Error(error.message);
    return ((data ?? []) as ProfileRow[]).map((profile) =>
      formatParticipant(
        {
          id: profile.user_id,
          clerk_id: '',
          email: profile.users?.email ?? null,
          first_name: profile.users?.first_name ?? null,
          last_name: profile.users?.last_name ?? null,
          avatar_url: profile.users?.avatar_url ?? null,
        },
        profile,
      ),
    );
  },

  listAllProfiles: async () => {
    const client = getClient();
    const { data, error } = await client.from('profiles').select('*');

    if (error) throw new Error(error.message);
    return data;
  },

  listUsers: async (params?: { offset?: number; limit?: number }) => {
    const client = getClient();
    const limit = params?.limit ?? 50;
    const offset = params?.offset ?? 0;

    const { data, error, count } = await client
      .from('users')
      .select('id, clerk_id, email, first_name, last_name, avatar_url', { count: 'exact' })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return {
      data: (data ?? []) as UserRow[],
      meta: { total: count ?? 0, offset, limit },
    };
  },

  listParticipantDirectory: async () => {
    const client = getClient();

    const [
      { data: users, error: usersError },
      { data: profiles, error: profilesError },
      { data: memberships, error: membershipsError },
    ] = await Promise.all([
      client
        .from('users')
        .select('id, clerk_id, first_name, last_name, avatar_url')
        .order('created_at', { ascending: false }),
      client.from('profiles').select('*'),
      client.from('team_members').select('user_id, role, teams(id, name)'),
    ]);

    if (usersError) throw new Error(usersError.message);
    if (profilesError) throw new Error(profilesError.message);
    if (membershipsError) throw new Error(membershipsError.message);

    const profileByUserId = new Map<string, ProfileRow>();
    for (const profile of (profiles ?? []) as ProfileRow[]) {
      profileByUserId.set(profile.user_id, profile);
    }

    const membershipByUserId = new Map<
      string,
      { team_id: string; role: string; team_name: string | null }
    >();
    for (const membership of (memberships ?? []) as Array<{
      user_id: string;
      role: string;
      teams?: { id: string; name: string } | Array<{ id: string; name: string }> | null;
    }>) {
      const team = Array.isArray(membership.teams)
        ? membership.teams[0] ?? null
        : membership.teams ?? null;
      membershipByUserId.set(membership.user_id, {
        team_id: team?.id ?? '',
        role: membership.role,
        team_name: team?.name ?? null,
      });
    }

    return ((users ?? []) as UserRow[]).map((user) =>
      formatParticipant(user, profileByUserId.get(user.id), membershipByUserId.get(user.id)),
    );
  },

  createTeam: async (teamData: { name: string; description?: string; tracks?: string[] }) => {
    const client = getClient();
    const userId = await resolveCurrentUserId(client);

    const existingMembership = await getCurrentMembership(client, userId);
    if (existingMembership) {
      throw new Error('You are already in a team. Leave your current team first.');
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const generateCode = () =>
      Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

    let createdTeam: TeamRow | null = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { data, error } = await client
        .from('teams')
        .insert({
          name: teamData.name.trim(),
          description: teamData.description?.trim() || null,
          tracks: teamData.tracks?.length ? teamData.tracks : null,
          created_by: userId,
          invite_code: generateCode(),
          is_looking_for_members: true,
        })
        .select()
        .single();

      if (!error) {
        createdTeam = data as TeamRow;
        break;
      }

      if (error.code !== '23505') throw new Error(error.message);
    }

    if (!createdTeam) throw new Error('Failed to generate a unique invite code. Please try again.');

    const { error: memberError } = await client
      .from('team_members')
      .insert({ team_id: createdTeam.id, user_id: userId, role: 'leader' });

    if (memberError) throw new Error(memberError.message);

    await syncTeamOpenStatus(client, createdTeam.id);
    notifyTeamChanged();

    return createdTeam;
  },

  getMyTeam: async () => {
    const client = getClient();
    const userId = await resolveCurrentUserId(client);
    const membership = await getCurrentMembership(client, userId);

    if (!membership) return null;

    const { data, error } = await client
      .from('teams')
      .select('*, team_members(*, users(id, first_name, last_name, avatar_url))')
      .eq('id', membership.team_id)
      .single();

    if (error) throw new Error(error.message);

    const team = data as TeamRow & { team_members?: TeamMemberRow[] };

    return {
      ...team,
      members: (team.team_members ?? []).map(flattenMember),
      viewer_role: membership.role as string,
    };
  },

  joinTeam: async (data: { invite_code: string }) => {
    const client = getClient();
    const userId = await resolveCurrentUserId(client);
    const inviteCode = data.invite_code.trim().toUpperCase();

    if (inviteCode.length < 6) throw new Error('Enter a valid team code.');

    const existingMembership = await getCurrentMembership(client, userId);
    if (existingMembership) {
      throw new Error('You are already in a team. Leave your current team first.');
    }

    const { data: teamData, error: teamError } = await client
      .from('teams')
      .select('*, team_members(id)')
      .eq('invite_code', inviteCode)
      .single();

    if (teamError || !teamData)
      throw new Error('Team not found. Check the team code and try again.');

    const team = teamData as TeamRow & { team_members?: Array<{ id: string }> };
    const memberCount = team.team_members?.length ?? 0;
    if (memberCount >= team.max_size) throw new Error('This team is already full.');

    const { error: joinError } = await client
      .from('team_members')
      .insert({ team_id: team.id, user_id: userId, role: 'member' });

    if (joinError) throw new Error(joinError.message);

    await Promise.all([
      syncTeamOpenStatus(client, team.id),
      markInviteAcceptedByCode(client, userId, team.id),
      withdrawPendingJoinRequests(client, userId),
    ]);

    notifyTeamChanged();
    return team;
  },

  leaveTeam: async () => {
    const client = getClient();
    const userId = await resolveCurrentUserId(client);
    const membership = await getCurrentMembership(client, userId);

    if (!membership) throw new Error('You are not in a team.');

    const { error: deleteError } = await client
      .from('team_members')
      .delete()
      .eq('user_id', userId)
      .eq('team_id', membership.team_id);

    if (deleteError) throw new Error(deleteError.message);

    const { data: remaining, error: remainingError } = await client
      .from('team_members')
      .select('id, role, joined_at')
      .eq('team_id', membership.team_id)
      .order('joined_at', { ascending: true });

    if (remainingError) throw new Error(remainingError.message);

    if (!remaining || remaining.length === 0) {
      const { error: teamDeleteError } = await client
        .from('teams')
        .delete()
        .eq('id', membership.team_id);

      if (teamDeleteError) throw new Error(teamDeleteError.message);
    } else {
      if (membership.role === 'leader') {
        const { error: promoteError } = await client
          .from('team_members')
          .update({ role: 'leader' })
          .eq('id', remaining[0].id);

        if (promoteError) throw new Error(promoteError.message);
      }

      await syncTeamOpenStatus(client, membership.team_id);
    }

    notifyTeamChanged();
  },

  kickMember: async (teamId: string, targetUserId: string) => {
    const client = getClient();
    const userId = await resolveCurrentUserId(client);

    if (userId === targetUserId) throw new Error('You cannot kick yourself. Use "Leave team" instead.');

    const membership = await getCurrentMembership(client, userId);
    if (!membership || membership.team_id !== teamId || membership.role !== 'leader') {
      throw new Error('Only team leaders can remove members.');
    }

    const { error: deleteError } = await client
      .from('team_members')
      .delete()
      .eq('user_id', targetUserId)
      .eq('team_id', teamId);

    if (deleteError) throw new Error(deleteError.message);

    await syncTeamOpenStatus(client, teamId);
    notifyTeamChanged();
  },

  listTeams: async (params?: { offset?: number; limit?: number; has_openings?: boolean }) => {
    const client = getClient();
    let query = client
      .from('teams')
      .select('*, team_members(id, users(avatar_url, first_name, last_name))', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (typeof params?.offset === 'number') {
      query = query.range(params.offset, params.offset + (params.limit ?? 50) - 1);
    } else if (params?.limit) {
      query = query.limit(params.limit);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    let teams = ((data ?? []) as Array<TeamRow & { team_members?: TeamMemberRow[] }>).map(
      (team) => ({
        ...team,
        member_count: team.team_members?.length ?? 0,
        is_full: (team.team_members?.length ?? 0) >= team.max_size,
      }),
    );

    if (params?.has_openings) {
      teams = teams.filter((team) => !team.is_full);
    }

    return {
      data: teams,
      meta: { total: count ?? teams.length },
    };
  },

  getTeamById: async (teamId: string) => {
    const client = getClient();
    const userId = await resolveCurrentUserId(client);

    const [
      { data: teamData, error: teamError },
      { data: joinRequest, error: requestError },
      membership,
    ] = await Promise.all([
      client
        .from('teams')
        .select('*, team_members(*, users(id, first_name, last_name, avatar_url))')
        .eq('id', teamId)
        .single(),
      client
        .from('team_join_requests')
        .select('id, status')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .single(),
      getCurrentMembership(client, userId),
    ]);

    if (teamError) throw new Error(teamError.message);
    if (requestError && !isMissingRowError(requestError)) throw new Error(requestError.message);

    const team = teamData as TeamRow & { team_members?: TeamMemberRow[] };

    return {
      ...team,
      members: (team.team_members ?? []).map(flattenMember),
      join_request_status: joinRequest?.status ?? null,
      join_request_id: joinRequest?.id ?? null,
      viewer_team_id: membership?.team_id ?? null,
      viewer_is_member: membership?.team_id === teamId,
      viewer_role: membership?.team_id === teamId ? (membership?.role as string) ?? null : null,
    };
  },

  createJoinRequest: async (teamId: string, data: { message?: string }) => {
    const client = getClient();
    const userId = await resolveCurrentUserId(client);
    const membership = await getCurrentMembership(client, userId);

    if (membership) throw new Error('You are already on a team.');

    const pendingCountQuery = await client
      .from('team_join_requests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (pendingCountQuery.error) throw new Error(pendingCountQuery.error.message);
    if ((pendingCountQuery.count ?? 0) >= 3) {
      throw new Error('You already have 3 pending team requests.');
    }

    const existingRequestQuery = await client
      .from('team_join_requests')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (existingRequestQuery.error && !isMissingRowError(existingRequestQuery.error)) {
      throw new Error(existingRequestQuery.error.message);
    }
    if (existingRequestQuery.data)
      throw new Error('You already have a pending request for this team.');

    const memberCount = await getTeamMemberCount(client, teamId);
    const { data: teamData, error: teamError } = await client
      .from('teams')
      .select('max_size')
      .eq('id', teamId)
      .single();

    if (teamError) throw new Error(teamError.message);
    if (memberCount >= ((teamData as { max_size: number }).max_size ?? 4)) {
      throw new Error('This team is already full.');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: request, error } = await client
      .from('team_join_requests')
      .insert({
        team_id: teamId,
        user_id: userId,
        message: data.message?.trim() || null,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return request;
  },

  listTeamJoinRequests: async (teamId: string, statusFilter = 'pending') => {
    const client = getClient();
    const { data, error } = await client
      .from('team_join_requests')
      .select('*, users!team_join_requests_user_id_fkey(id, first_name, last_name, avatar_url)')
      .eq('team_id', teamId)
      .eq('status', statusFilter)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return {
      data: ((data ?? []) as TeamJoinRequestRow[]).map(flattenJoinRequest),
    };
  },

  updateJoinRequest: async (
    teamId: string,
    requestId: string,
    data: { status: 'approved' | 'rejected' },
  ) => {
    const client = getClient();
    const reviewerId = await resolveCurrentUserId(client);

    const { data: joinRequest, error: joinRequestError } = await client
      .from('team_join_requests')
      .select('*')
      .eq('id', requestId)
      .eq('team_id', teamId)
      .single();

    if (joinRequestError) throw new Error(joinRequestError.message);

    const request = joinRequest as TeamJoinRequestRow;
    if (request.status !== 'pending') throw new Error('This request has already been processed.');

    if (data.status === 'approved') {
      const existingMembership = await getCurrentMembership(client, request.user_id);
      if (existingMembership) throw new Error('This participant is already on a team.');

      const memberCount = await getTeamMemberCount(client, teamId);
      const { data: teamData, error: teamError } = await client
        .from('teams')
        .select('max_size')
        .eq('id', teamId)
        .single();

      if (teamError) throw new Error(teamError.message);
      if (memberCount >= ((teamData as { max_size: number }).max_size ?? 4)) {
        throw new Error('This team is already full.');
      }

      const { error: memberError } = await client
        .from('team_members')
        .insert({ team_id: teamId, user_id: request.user_id, role: 'member' });

      if (memberError) throw new Error(memberError.message);

      await Promise.all([
        syncTeamOpenStatus(client, teamId),
        withdrawPendingJoinRequests(client, request.user_id),
      ]);
      notifyTeamChanged();
    }

    const { data: updatedRequest, error: updateError } = await client
      .from('team_join_requests')
      .update({
        status: data.status,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('team_id', teamId)
      .select('*, users!team_join_requests_user_id_fkey(id, first_name, last_name, avatar_url)')
      .single();

    if (updateError) throw new Error(updateError.message);

    return flattenJoinRequest(updatedRequest as TeamJoinRequestRow);
  },

  withdrawJoinRequest: async (requestId: string) => {
    const client = getClient();
    const userId = await resolveCurrentUserId(client);
    const { error } = await client
      .from('team_join_requests')
      .update({ status: 'withdrawn' })
      .eq('id', requestId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  },

  inviteParticipantToTeam: async (teamId: string, participantUserId: string, message?: string) => {
    const client = getClient();
    const currentUserId = await resolveCurrentUserId(client);

    if (currentUserId === participantUserId) {
      throw new Error('You cannot invite yourself.');
    }

    const { data: leaderMembership, error: leaderError } = await client
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', currentUserId)
      .single();

    if (leaderError) throw new Error('Only team leaders can send invites.');
    if ((leaderMembership as { role: string }).role !== 'leader') {
      throw new Error('Only team leaders can send invites.');
    }

    const existingMembership = await getCurrentMembership(client, participantUserId);
    if (existingMembership) {
      throw new Error('This participant is already on a team.');
    }

    const memberCount = await getTeamMemberCount(client, teamId);
    const { data: teamData, error: teamError } = await client
      .from('teams')
      .select('max_size')
      .eq('id', teamId)
      .single();

    if (teamError) throw new Error(teamError.message);
    if (memberCount >= ((teamData as { max_size: number }).max_size ?? 4)) {
      throw new Error('Your team is already full.');
    }

    const { data: existingInvite, error: inviteLookupError } = await client
      .from('team_invitations')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', participantUserId)
      .eq('status', 'pending')
      .single();

    if (inviteLookupError && !isMissingRowError(inviteLookupError)) {
      throw new Error(inviteLookupError.message);
    }
    if (existingInvite) throw new Error('An invitation is already pending for this participant.');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error } = await client
      .from('team_invitations')
      .insert({
        team_id: teamId,
        user_id: participantUserId,
        invited_by: currentUserId,
        message: message?.trim() || null,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  listReceivedTeamInvitations: async () => {
    const client = getClient();
    const userId = await resolveCurrentUserId(client);

    const { data: invitationsData, error: invitationError } = await client
      .from('team_invitations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (invitationError) throw new Error(invitationError.message);

    const now = new Date();
    const invitations = (invitationsData ?? []) as TeamInvitationRow[];
    const expiredIds = invitations
      .filter((invitation) => new Date(invitation.expires_at) < now)
      .map((invitation) => invitation.id);

    if (expiredIds.length > 0) {
      const { error: expireError } = await client
        .from('team_invitations')
        .update({ status: 'expired', responded_at: now.toISOString() })
        .in('id', expiredIds);

      if (expireError) throw new Error(expireError.message);
    }

    const activeInvitations = invitations.filter(
      (invitation) => !expiredIds.includes(invitation.id),
    );
    if (activeInvitations.length === 0) return [];

    const teamIds = [...new Set(activeInvitations.map((invitation) => invitation.team_id))];
    const inviterIds = [...new Set(activeInvitations.map((invitation) => invitation.invited_by))];

    const [
      { data: teamsData, error: teamsError },
      { data: invitersData, error: invitersError },
      { data: membersData, error: membersError },
    ] = await Promise.all([
      client
        .from('teams')
        .select('id, name, description, invite_code, max_size, tracks, is_looking_for_members')
        .in('id', teamIds),
      client
        .from('users')
        .select('id, first_name, last_name, avatar_url, email')
        .in('id', inviterIds),
      client.from('team_members').select('team_id, id').in('team_id', teamIds),
    ]);

    if (teamsError) throw new Error(teamsError.message);
    if (invitersError) throw new Error(invitersError.message);
    if (membersError) throw new Error(membersError.message);

    const teamById = new Map<string, TeamRow>();
    for (const team of (teamsData ?? []) as TeamRow[]) {
      teamById.set(team.id, team);
    }

    const inviterById = new Map<string, UserRow>();
    for (const inviter of (invitersData ?? []) as UserRow[]) {
      inviterById.set(inviter.id, inviter);
    }

    const memberCountByTeamId = new Map<string, number>();
    for (const member of (membersData ?? []) as Array<{ team_id: string }>) {
      memberCountByTeamId.set(member.team_id, (memberCountByTeamId.get(member.team_id) ?? 0) + 1);
    }

    return activeInvitations.map((invitation) => {
      const team = teamById.get(invitation.team_id);
      const inviter = inviterById.get(invitation.invited_by);
      const inviterName = getFullName(inviter) || inviter?.email || 'Team leader';

      return {
        ...invitation,
        team: team
          ? {
              ...team,
              member_count: memberCountByTeamId.get(team.id) ?? 0,
            }
          : null,
        inviter: inviter
          ? {
              id: inviter.id,
              name: inviterName,
              avatar_url: inviter.avatar_url,
              email: inviter.email,
            }
          : null,
      };
    });
  },

  respondToTeamInvitation: async (invitationId: string, response: 'accepted' | 'declined') => {
    const client = getClient();
    const userId = await resolveCurrentUserId(client);

    const { data: invitationData, error: invitationError } = await client
      .from('team_invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('user_id', userId)
      .single();

    if (invitationError) throw new Error(invitationError.message);

    const invitation = invitationData as TeamInvitationRow;
    if (invitation.status !== 'pending')
      throw new Error('This invitation has already been processed.');
    if (new Date(invitation.expires_at) < new Date()) {
      const { error: expireError } = await client
        .from('team_invitations')
        .update({ status: 'expired', responded_at: new Date().toISOString() })
        .eq('id', invitationId);

      if (expireError) throw new Error(expireError.message);
      throw new Error('This invitation has expired.');
    }

    if (response === 'accepted') {
      const existingMembership = await getCurrentMembership(client, userId);
      if (existingMembership)
        throw new Error('Leave your current team before accepting an invitation.');

      const memberCount = await getTeamMemberCount(client, invitation.team_id);
      const { data: teamData, error: teamError } = await client
        .from('teams')
        .select('max_size')
        .eq('id', invitation.team_id)
        .single();

      if (teamError) throw new Error(teamError.message);
      if (memberCount >= ((teamData as { max_size: number }).max_size ?? 4)) {
        throw new Error('This team is already full.');
      }

      const { error: memberError } = await client
        .from('team_members')
        .insert({ team_id: invitation.team_id, user_id: userId, role: 'member' });

      if (memberError) throw new Error(memberError.message);

      await Promise.all([
        syncTeamOpenStatus(client, invitation.team_id),
        withdrawPendingJoinRequests(client, userId),
      ]);
      notifyTeamChanged();
    }

    const { data, error } = await client
      .from('team_invitations')
      .update({
        status: response,
        responded_at: new Date().toISOString(),
      })
      .eq('id', invitationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};
