import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY

/**
 * Creates a Supabase client authenticated with the current Clerk session.
 * Call this inside React components that have access to window.Clerk.
 */
export function createClerkSupabaseClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    async accessToken() {
      // Wait briefly for Clerk to initialize if needed
      if (!window.Clerk) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
      return (await window.Clerk?.session?.getToken({ template: 'supabase' })) ?? null
    },
  })
}
