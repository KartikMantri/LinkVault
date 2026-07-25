import * as z from 'zod'
import type { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { hashApiToken } from '@/lib/tokens'
import { saveLink } from '@/lib/save-link'

const BodySchema = z.object({
  url: z.url(),
  note: z.string().optional(),
})

// Authenticated via a personal API token (Authorization: Bearer <token>)
// rather than a session cookie — this is what the iOS Shortcut calls, since
// Shortcuts has no way to carry a browser session.
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return Response.json({ error: 'Missing bearer token.' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const { data: tokenRow } = await supabase
    .from('api_tokens')
    .select('id, user_id')
    .eq('token_hash', hashApiToken(token))
    .maybeSingle()

  if (!tokenRow) {
    return Response.json({ error: 'Invalid token.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const validated = BodySchema.safeParse(body)
  if (!validated.success) {
    return Response.json({ error: 'Body must include a valid "url".' }, { status: 400 })
  }

  await supabase
    .from('api_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', tokenRow.id)

  const result = await saveLink(supabase, tokenRow.user_id, validated.data)

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 409 })
  }

  return Response.json({ ok: true })
}
