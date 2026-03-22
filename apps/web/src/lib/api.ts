import { createClerkSupabaseClient } from './supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

function getClient(): SupabaseClient {
  return createClerkSupabaseClient()
}

/** Look up the current user's internal UUID from their Clerk ID. Auto-syncs on first login. */
async function getCurrentUserId(client: SupabaseClient): Promise<string> {
  const clerkId = window.Clerk?.user?.id
  if (!clerkId) throw new Error('Not authenticated')

  const { data } = await client
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single()

  if (data) return data.id

  // User not in DB yet (first login, webhook hasn't fired). Trigger sync via API route.
  const token = await window.Clerk?.session?.getToken()
  const syncRes = await fetch('/api/users/sync', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!syncRes.ok) throw new Error('Failed to sync user. Please refresh the page.')
  const synced = await syncRes.json()
  return synced.user_id
}

/** Flatten Supabase nested join results. Transforms { users: { first_name, ... } } → { first_name, ... } */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenMember(member: any) {
  const { users, ...rest } = member
  return { ...rest, ...users }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenJoinRequest(request: any) {
  const { users, ...rest } = request
  return {
    ...rest,
    user_first_name: users?.first_name ?? null,
    user_last_name: users?.last_name ?? null,
    user_avatar_url: users?.avatar_url ?? null,
    user_email: users?.email ?? null,
  }
}

export const api = {
  // ─── Profiles ───────────────────────────────────────────────
  getProfile: async () => {
    const client = getClient()
    const userId = await getCurrentUserId(client)
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error && error.code === 'PGRST116') return null // not found
    if (error) throw new Error(error.message)
    return data
  },

  upsertProfile: async (profileData: {
    display_name: string
    bio?: string
    linkedin_url?: string
    github_url?: string
    portfolio_url?: string
    discord_username?: string
    looking_for_team?: boolean
  }) => {
    const client = getClient()
    const userId = await getCurrentUserId(client)
    const { data, error } = await client
      .from('profiles')
      .upsert({ user_id: userId, ...profileData }, { onConflict: 'user_id' })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  listProfiles: async () => {
    const client = getClient()
    const { data, error } = await client
      .from('profiles')
      .select('*, users(first_name, last_name, avatar_url, email)')
      .eq('looking_for_team', true)
    if (error) throw new Error(error.message)
    return data
  },

  listAllProfiles: async () => {
    const client = getClient()
    const { data, error } = await client
      .from('profiles')
      .select('*, users(first_name, last_name, avatar_url)')
    if (error) throw new Error(error.message)
    return data
  },

  // ─── Teams ──────────────────────────────────────────────────
  createTeam: async (teamData: { name: string; description?: string; tracks?: string[] }) => {
    const client = getClient()
    const userId = await getCurrentUserId(client)

    // Generate invite code with retry on collision (UNIQUE constraint)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const generateCode = () => Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let team: any = null
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await client
        .from('teams')
        .insert({ ...teamData, created_by: userId, invite_code: generateCode() })
        .select()
        .single()
      if (!error) { team = data; break }
      if (error.code !== '23505') throw new Error(error.message) // not a unique violation, throw
    }
    if (!team) throw new Error('Failed to generate unique invite code. Please try again.')

    // Add creator as leader
    const { error: memberError } = await client
      .from('team_members')
      .insert({ team_id: team.id, user_id: userId, role: 'leader' })
    if (memberError) throw new Error(memberError.message)

    return team
  },

  getMyTeam: async () => {
    const client = getClient()
    const userId = await getCurrentUserId(client)

    const { data: membership } = await client
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)
      .single()

    if (!membership) return null

    const { data: team, error } = await client
      .from('teams')
      .select('*, team_members(*, users(id, first_name, last_name, avatar_url, email, clerk_id))')
      .eq('id', membership.team_id)
      .single()
    if (error) throw new Error(error.message)

    // Flatten nested user data into each member for component compatibility
    return {
      ...team,
      members: (team.team_members ?? []).map(flattenMember),
    }
  },

  joinTeam: async (data: { invite_code: string }) => {
    const client = getClient()
    const userId = await getCurrentUserId(client)

    // Find team by invite code
    const { data: team, error: findError } = await client
      .from('teams')
      .select('*, team_members(id)')
      .eq('invite_code', data.invite_code.toUpperCase())
      .single()
    if (findError || !team) throw new Error('Team not found. Check the invite code.')

    // Check if full
    if (team.team_members.length >= team.max_size) throw new Error('Team is full.')

    // Check if already in a team
    const { data: existing } = await client
      .from('team_members')
      .select('id')
      .eq('user_id', userId)
      .single()
    if (existing) throw new Error('You are already in a team. Leave your current team first.')

    // Join
    const { error } = await client
      .from('team_members')
      .insert({ team_id: team.id, user_id: userId, role: 'member' })
    if (error) throw new Error(error.message)
    return team
  },

  leaveTeam: async () => {
    const client = getClient()
    const userId = await getCurrentUserId(client)

    // Find current membership
    const { data: membership } = await client
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', userId)
      .single()
    if (!membership) throw new Error('Not in a team.')

    // Delete membership
    await client.from('team_members').delete().eq('user_id', userId).eq('team_id', membership.team_id)

    // Check remaining members
    const { data: remaining } = await client
      .from('team_members')
      .select('id, role, joined_at')
      .eq('team_id', membership.team_id)
      .order('joined_at', { ascending: true })

    if (!remaining || remaining.length === 0) {
      // Delete empty team
      await client.from('teams').delete().eq('id', membership.team_id)
    } else if (membership.role === 'leader') {
      // Promote earliest member to leader
      await client
        .from('team_members')
        .update({ role: 'leader' })
        .eq('id', remaining[0].id)
    }
  },

  // ─── Team Browsing ──────────────────────────────────────────
  listTeams: async (params?: { offset?: number; limit?: number; has_openings?: boolean }) => {
    const client = getClient()
    let query = client
      .from('teams')
      .select('*, team_members(id)', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (params?.offset) query = query.range(params.offset, params.offset + (params.limit ?? 50) - 1)
    else if (params?.limit) query = query.limit(params.limit)

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let teams = (data ?? []).map((t: any) => ({
      ...t,
      member_count: t.team_members?.length ?? 0,
      is_full: (t.team_members?.length ?? 0) >= t.max_size,
    }))

    if (params?.has_openings) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      teams = teams.filter((t: any) => !t.is_full)
    }

    return { data: teams, meta: { total: count ?? teams.length } }
  },

  getTeamById: async (teamId: string) => {
    const client = getClient()
    const userId = await getCurrentUserId(client)

    const { data: team, error } = await client
      .from('teams')
      .select('*, team_members(*, users(id, first_name, last_name, avatar_url, email))')
      .eq('id', teamId)
      .single()
    if (error) throw new Error(error.message)

    // Check for existing join request from current user
    const { data: joinRequest } = await client
      .from('team_join_requests')
      .select('id, status')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single()

    return {
      ...team,
      members: (team.team_members ?? []).map(flattenMember),
      join_request_status: joinRequest?.status ?? null,
      join_request_id: joinRequest?.id ?? null,
    }
  },

  // ─── Join Requests ──────────────────────────────────────────
  createJoinRequest: async (teamId: string, data: { message?: string }) => {
    const client = getClient()
    const userId = await getCurrentUserId(client)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { data: request, error } = await client
      .from('team_join_requests')
      .insert({
        team_id: teamId,
        user_id: userId,
        message: data.message ?? null,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return request
  },

  listTeamJoinRequests: async (teamId: string, statusFilter = 'pending') => {
    const client = getClient()
    const { data, error } = await client
      .from('team_join_requests')
      .select('*, users(id, first_name, last_name, avatar_url, email)')
      .eq('team_id', teamId)
      .eq('status', statusFilter)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return { data: (data ?? []).map(flattenJoinRequest) }
  },

  updateJoinRequest: async (
    teamId: string,
    requestId: string,
    data: { status: 'approved' | 'rejected' }
  ) => {
    const client = getClient()
    const userId = await getCurrentUserId(client)

    // Update the request status
    const { data: request, error } = await client
      .from('team_join_requests')
      .update({ status: data.status, reviewed_by: userId, reviewed_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('team_id', teamId)
      .select('*, users(id, first_name, last_name)')
      .single()
    if (error) throw new Error(error.message)

    // If approved, add user to team
    if (data.status === 'approved' && request) {
      const { error: memberError } = await client
        .from('team_members')
        .insert({ team_id: teamId, user_id: request.user_id, role: 'member' })
      if (memberError) throw new Error(memberError.message)
    }

    return request
  },

  withdrawJoinRequest: async (requestId: string) => {
    const client = getClient()
    const { error } = await client
      .from('team_join_requests')
      .update({ status: 'withdrawn' })
      .eq('id', requestId)
    if (error) throw new Error(error.message)
  },

  // ─── Users ──────────────────────────────────────────────────
  listUsers: async (params?: { offset?: number; limit?: number }) => {
    const client = getClient()
    const limit = params?.limit ?? 50
    const offset = params?.offset ?? 0

    const { data, error, count } = await client
      .from('users')
      .select('id, clerk_id, email, first_name, last_name, avatar_url', { count: 'exact' })
      .range(offset, offset + limit - 1)
    if (error) throw new Error(error.message)
    return { data: data ?? [], meta: { total: count ?? 0, offset, limit } }
  },
}
