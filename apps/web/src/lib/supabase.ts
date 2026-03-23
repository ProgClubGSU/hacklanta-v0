import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY

/**
 * Waits for Clerk to be fully loaded before proceeding.
 * Clerk's global object exposes a `loaded` property; poll until true.
 */
export async function waitForClerk(): Promise<void> {
  if (window.Clerk?.loaded) return
  const maxWait = 5000
  const interval = 50
  let elapsed = 0
  while (elapsed < maxWait) {
    await new Promise((resolve) => setTimeout(resolve, interval))
    elapsed += interval
    if (window.Clerk?.loaded) return
  }
}

/**
 * Creates a Supabase client authenticated with the current Clerk session.
 * Call this inside React components that have access to window.Clerk.
 */
export function createClerkSupabaseClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    async accessToken() {
      await waitForClerk()
      return (await window.Clerk?.session?.getToken()) ?? null
    },
  })
}
