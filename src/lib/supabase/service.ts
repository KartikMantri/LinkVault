import { createClient } from '@supabase/supabase-js'

// Bypasses RLS entirely — only ever used server-side, after we've already
// verified an API token ourselves, for requests (like the iOS Shortcut)
// that have no browser session/cookies to authenticate with normally.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
