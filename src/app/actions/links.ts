'use server'

import * as z from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { saveLink } from '@/lib/save-link'

const AddLinkSchema = z.object({
  url: z.url({ error: 'Enter a valid URL.' }),
  note: z.string().optional(),
  folderId: z.string().optional(),
})

export type AddLinkState = { error?: string } | undefined

export async function addLink(_state: AddLinkState, formData: FormData): Promise<AddLinkState> {
  const validated = AddLinkSchema.safeParse({
    url: formData.get('url'),
    note: formData.get('note') || undefined,
    folderId: formData.get('folderId') || undefined,
  })

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const result = await saveLink(supabase, user.id, validated.data)

  revalidatePath('/library')
  revalidatePath('/library/folders')

  return result.ok ? undefined : { error: result.error }
}

export async function deleteLink(id: string) {
  const supabase = await createClient()
  await supabase.from('links').delete().eq('id', id)
  revalidatePath('/library')
  revalidatePath('/library/folders')
}
