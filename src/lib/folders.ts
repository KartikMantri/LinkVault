import type { SupabaseClient } from '@supabase/supabase-js'

export type FolderRow = {
  id: string
  name: string
  parent_id: string | null
}

// Used for source-based auto-routing (e.g. Instagram links land in an
// "Instagram" root folder automatically). Get-or-create avoids duplicate
// folders across repeated saves.
export async function getOrCreateRootFolder(
  supabase: SupabaseClient,
  userId: string,
  name: string
): Promise<string | null> {
  const { data: existing } = await supabase
    .from('folders')
    .select('id')
    .eq('user_id', userId)
    .is('parent_id', null)
    .eq('name', name)
    .maybeSingle()

  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from('folders')
    .insert({ user_id: userId, name, parent_id: null })
    .select('id')
    .single()

  if (error) return null
  return created.id
}

// Flattens the folder tree into a depth-indented list, e.g. for populating
// a "move to folder" <select> where hierarchy needs to stay visually clear.
export function flattenFolderTree(folders: FolderRow[]): { id: string; label: string }[] {
  const byParent = new Map<string | null, FolderRow[]>()
  for (const folder of folders) {
    const siblings = byParent.get(folder.parent_id) ?? []
    siblings.push(folder)
    byParent.set(folder.parent_id, siblings)
  }

  const result: { id: string; label: string }[] = []
  function walk(parentId: string | null, depth: number) {
    const children = byParent.get(parentId) ?? []
    for (const child of children) {
      result.push({ id: child.id, label: `${'—'.repeat(depth)} ${child.name}`.trim() })
      walk(child.id, depth + 1)
    }
  }
  walk(null, 0)
  return result
}

export function breadcrumbFor(folders: FolderRow[], folderId: string): FolderRow[] {
  const byId = new Map(folders.map((f) => [f.id, f]))
  const trail: FolderRow[] = []
  let current = byId.get(folderId)
  while (current) {
    trail.unshift(current)
    current = current.parent_id ? byId.get(current.parent_id) : undefined
  }
  return trail
}
