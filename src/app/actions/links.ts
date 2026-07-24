'use server'

import * as z from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { detectSource, fetchMetadata } from '@/lib/metadata'
import { enrichLink } from '@/lib/ai/enrich'
import { getOrCreateRootFolder } from '@/lib/folders'

const AddLinkSchema = z.object({
  url: z.url({ error: 'Enter a valid URL.' }),
  note: z.string().optional(),
  folderId: z.string().optional(),
})

// Sources that auto-file into a same-named root folder so shares from that
// app never land nowhere — e.g. every Instagram share ends up in "Instagram".
const AUTO_FOLDER_BY_SOURCE: Partial<Record<string, string>> = {
  instagram: 'Instagram',
}

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

  const { url, note, folderId: explicitFolderId } = validated.data
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in.' }
  }

  const source = detectSource(url)

  let folderId: string | null = explicitFolderId ?? null
  if (!folderId) {
    const autoFolderName = AUTO_FOLDER_BY_SOURCE[source]
    if (autoFolderName) {
      folderId = await getOrCreateRootFolder(supabase, user.id, autoFolderName)
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from('links')
    .insert({ user_id: user.id, url, source, note, status: 'pending', folder_id: folderId })
    .select('id')
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      return { error: "You've already saved this link." }
    }
    return { error: 'Could not save the link. Try again.' }
  }

  // Metadata and AI enrichment fail independently so a Groq error (or an
  // unscrapeable page) never discards metadata that was fetched successfully.
  let metadata: Awaited<ReturnType<typeof fetchMetadata>> | null = null
  try {
    metadata = await fetchMetadata(url)
    await supabase
      .from('links')
      .update({
        title: metadata.title,
        caption: metadata.caption,
        thumbnail_url: metadata.thumbnailUrl,
      })
      .eq('id', inserted.id)
  } catch (err) {
    console.error('metadata fetch failed for', url, err)
  }

  // Nothing worth tagging (metadata fetch failed entirely) — skip the AI
  // call rather than let it invent tags from a placeholder string.
  if (!metadata?.title && !metadata?.caption) {
    await supabase.from('links').update({ status: 'error' }).eq('id', inserted.id)
    revalidatePath('/library')
    revalidatePath('/library/folders')
    return undefined
  }

  try {
    const enrichment = await enrichLink({
      title: metadata?.title ?? null,
      caption: metadata?.caption ?? null,
      thumbnailUrl: metadata?.thumbnailUrl ?? null,
    })

    await supabase
      .from('links')
      .update({
        ai_summary: enrichment.summary,
        ai_category: enrichment.category,
        ai_tags: enrichment.tags,
        status: 'processed',
      })
      .eq('id', inserted.id)
  } catch (err) {
    console.error('AI enrichment failed for', url, err)
    await supabase.from('links').update({ status: 'error' }).eq('id', inserted.id)
  }

  revalidatePath('/library')
  revalidatePath('/library/folders')
  return undefined
}

export async function deleteLink(id: string) {
  const supabase = await createClient()
  await supabase.from('links').delete().eq('id', id)
  revalidatePath('/library')
  revalidatePath('/library/folders')
}
