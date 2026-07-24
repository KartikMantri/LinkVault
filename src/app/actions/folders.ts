'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type FolderState = { error?: string } | undefined

export async function createFolder(_state: FolderState, formData: FormData): Promise<FolderState> {
  const name = (formData.get('name') as string | null)?.trim()
  const parentIdRaw = formData.get('parentId') as string | null
  const parentId = parentIdRaw || null

  if (!name) {
    return { error: 'Folder name is required.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const { error } = await supabase
    .from('folders')
    .insert({ user_id: user.id, name, parent_id: parentId })

  if (error) {
    return { error: 'Could not create folder.' }
  }

  revalidatePath('/library/folders')
  return undefined
}

// Deleting a folder cascades to its subfolders (DB-level) and unfiles any
// links that were inside it — nothing is ever deleted except the folder itself.
export async function deleteFolder(id: string, parentId: string | null) {
  const supabase = await createClient()
  await supabase.from('folders').delete().eq('id', id)
  revalidatePath('/library/folders')
  revalidatePath(parentId ? `/library/folders/${parentId}` : '/library/folders')
}

export async function moveLinkToFolder(linkId: string, folderId: string | null) {
  const supabase = await createClient()
  await supabase.from('links').update({ folder_id: folderId }).eq('id', linkId)
  revalidatePath('/library')
  revalidatePath('/library/folders')
}
