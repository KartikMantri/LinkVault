import type { SupabaseClient } from '@supabase/supabase-js'
import { detectSource, fetchMetadata } from '@/lib/metadata'
import { enrichLink } from '@/lib/ai/enrich'
import { getOrCreateRootFolder } from '@/lib/folders'

// Sources that auto-file into a same-named root folder so shares from that
// app never land nowhere — e.g. every Instagram share ends up in "Instagram".
const AUTO_FOLDER_BY_SOURCE: Partial<Record<string, string>> = {
  instagram: 'Instagram',
}

export type SaveLinkResult = { ok: true } | { ok: false; error: string }

// Shared by the manual Add Link form and the Android share-target handler
// so both paths get metadata scraping, AI tagging, and auto-routing for free.
export async function saveLink(
  supabase: SupabaseClient,
  userId: string,
  input: { url: string; note?: string; folderId?: string | null }
): Promise<SaveLinkResult> {
  const source = detectSource(input.url)

  let folderId: string | null = input.folderId ?? null
  if (!folderId) {
    const autoFolderName = AUTO_FOLDER_BY_SOURCE[source]
    if (autoFolderName) {
      folderId = await getOrCreateRootFolder(supabase, userId, autoFolderName)
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from('links')
    .insert({
      user_id: userId,
      url: input.url,
      source,
      note: input.note,
      status: 'pending',
      folder_id: folderId,
    })
    .select('id')
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      return { ok: false, error: "You've already saved this link." }
    }
    return { ok: false, error: 'Could not save the link. Try again.' }
  }

  // Metadata and AI enrichment fail independently so a Groq error (or an
  // unscrapeable page) never discards metadata that was fetched successfully.
  let metadata: Awaited<ReturnType<typeof fetchMetadata>> | null = null
  try {
    metadata = await fetchMetadata(input.url)
    await supabase
      .from('links')
      .update({
        title: metadata.title,
        caption: metadata.caption,
        thumbnail_url: metadata.thumbnailUrl,
      })
      .eq('id', inserted.id)
  } catch (err) {
    console.error('metadata fetch failed for', input.url, err)
  }

  // Nothing worth tagging (metadata fetch failed entirely) — skip the AI
  // call rather than let it invent tags from a placeholder string.
  if (!metadata?.title && !metadata?.caption) {
    await supabase.from('links').update({ status: 'error' }).eq('id', inserted.id)
    return { ok: true }
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
    console.error('AI enrichment failed for', input.url, err)
    await supabase.from('links').update({ status: 'error' }).eq('id', inserted.id)
  }

  return { ok: true }
}
