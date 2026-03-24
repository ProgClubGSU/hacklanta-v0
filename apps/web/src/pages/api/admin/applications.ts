import type { APIRoute } from 'astro'
import { verifyAdmin } from '../../../lib/admin'
import { createServerSupabaseClient } from '../../../lib/supabase-server'

const VALID_STATUSES = ['pending', 'accepted', 'accepted_overflow', 'confirmed', 'confirmed_overflow', 'rejected', 'waitlisted']
const VALID_SORT_COLUMNS = ['created_at', 'status', 'university', 'email', 'experience_level', 'year_of_study']
const MAX_LIMIT = 200
const DEFAULT_LIMIT = 50

export const GET: APIRoute = async ({ locals, url }) => {
  if (!import.meta.env.DEV) {
    const auth = await verifyAdmin(locals)
    if (!auth.authorized) return auth.response
  }

  const supabase = createServerSupabaseClient()

  // Parse query params
  const statusParam = url.searchParams.get('status')
  const search = url.searchParams.get('search')?.trim() ?? ''
  const dateFrom = url.searchParams.get('date_from')?.trim() ?? ''
  const dateTo = url.searchParams.get('date_to')?.trim() ?? ''
  const sortBy = url.searchParams.get('sort_by') ?? 'created_at'
  const sortDir = url.searchParams.get('sort_dir') ?? 'desc'
  const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10) || 0)
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(url.searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT))

  // Validate sort_by
  if (!VALID_SORT_COLUMNS.includes(sortBy)) {
    return new Response(JSON.stringify({ error: `sort_by must be one of: ${VALID_SORT_COLUMNS.join(', ')}` }), { status: 400 })
  }

  // Validate sort_dir
  if (sortDir !== 'asc' && sortDir !== 'desc') {
    return new Response(JSON.stringify({ error: 'sort_dir must be "asc" or "desc"' }), { status: 400 })
  }

  // Parse and validate status filter
  let statuses: string[] | null = null
  if (statusParam) {
    statuses = statusParam.split(',').map(s => s.trim()).filter(Boolean)
    const invalid = statuses.filter(s => !VALID_STATUSES.includes(s))
    if (invalid.length > 0) {
      return new Response(JSON.stringify({ error: `Invalid status values: ${invalid.join(', ')}. Valid: ${VALID_STATUSES.join(', ')}` }), { status: 400 })
    }
  }

  const selectFields = '*, user:users!applications_user_id_fkey(id, first_name, last_name, email, avatar_url, is_accepted, acceptance_sent_at)'

  // Build count query (same filters, no pagination)
  let countQuery = supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })

  // Build data query
  let dataQuery = supabase
    .from('applications')
    .select(selectFields)

  // Apply status filter
  if (statuses?.length) {
    countQuery = countQuery.in('status', statuses)
    dataQuery = dataQuery.in('status', statuses)
  }

  // Apply date range filter
  if (dateFrom) {
    countQuery = countQuery.gte('created_at', dateFrom)
    dataQuery = dataQuery.gte('created_at', dateFrom)
  }
  if (dateTo) {
    // Add a day so "2026-03-23" includes the whole day
    const toDate = new Date(dateTo)
    toDate.setDate(toDate.getDate() + 1)
    const toStr = toDate.toISOString().split('T')[0]
    countQuery = countQuery.lt('created_at', toStr)
    dataQuery = dataQuery.lt('created_at', toStr)
  }

  // Apply search filter (searches application email, university, AND user name/email)
  if (search) {
    const pattern = `%${search}%`

    // Find users matching by name or Clerk email
    const { data: matchedUsers } = await supabase
      .from('users')
      .select('id')
      .or(`email.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern}`)

    const matchedIds = (matchedUsers ?? []).map(u => u.id)

    let orFilter = `email.ilike.${pattern},university.ilike.${pattern}`
    if (matchedIds.length > 0) {
      orFilter += `,user_id.in.(${matchedIds.join(',')})`
    }

    countQuery = countQuery.or(orFilter)
    dataQuery = dataQuery.or(orFilter)
  }

  // Apply sorting
  dataQuery = dataQuery.order(sortBy, { ascending: sortDir === 'asc' })

  // Apply pagination
  dataQuery = dataQuery.range(offset, offset + limit - 1)

  // Execute both queries in parallel
  const [countResult, dataResult] = await Promise.all([countQuery, dataQuery])

  if (countResult.error) {
    return new Response(JSON.stringify({ error: countResult.error.message }), { status: 500 })
  }

  if (dataResult.error) {
    return new Response(JSON.stringify({ error: dataResult.error.message }), { status: 500 })
  }

  const data = dataResult.data ?? []
  const total = countResult.count ?? 0

  return new Response(JSON.stringify({
    data,
    meta: { total, offset, limit },
  }))
}
