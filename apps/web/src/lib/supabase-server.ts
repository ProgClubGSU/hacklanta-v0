import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Server-side Supabase client using service role key.
 * Bypasses RLS — use only in Astro API routes / server-side code.
 */
export function createServerSupabaseClient(): SupabaseClient {
  return createClient(supabaseUrl!, supabaseServiceKey!, {
    auth: { persistSession: false },
  })
}
