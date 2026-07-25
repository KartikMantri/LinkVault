'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateApiToken, hashApiToken } from '@/lib/tokens'

export type CreateTokenState = { error?: string; token?: string } | undefined

export async function createApiToken(
  _state: CreateTokenState,
  formData: FormData
): Promise<CreateTokenState> {
  const name = (formData.get('name') as string | null)?.trim() || 'iOS Shortcut'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const token = generateApiToken()
  const { error } = await supabase
    .from('api_tokens')
    .insert({ user_id: user.id, name, token_hash: hashApiToken(token) })

  if (error) {
    return { error: 'Could not create token.' }
  }

  revalidatePath('/library/settings')
  // Returned once, in plaintext — never stored or retrievable again.
  return { token }
}

export async function revokeApiToken(id: string) {
  const supabase = await createClient()
  await supabase.from('api_tokens').delete().eq('id', id)
  revalidatePath('/library/settings')
}
