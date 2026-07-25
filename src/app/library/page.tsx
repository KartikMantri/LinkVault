import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AddLinkForm } from '@/components/AddLinkForm'
import { LinkCard, type LinkRow } from '@/components/LinkCard'
import { PendingAutoRefresh } from '@/components/PendingAutoRefresh'
import type { FolderRow } from '@/lib/folders'

const SOURCES = ['instagram', 'whatsapp_web', 'youtube', 'other'] as const

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; source?: string; category?: string }>
}) {
  const { q, source, category } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('links')
    .select('*')
    .order('created_at', { ascending: false })

  if (source) query = query.eq('source', source)
  if (category) query = query.eq('ai_category', category)
  if (q) {
    query = query.or(
      `title.ilike.%${q}%,caption.ilike.%${q}%,ai_summary.ilike.%${q}%`
    )
  }

  const [{ data: links }, { data: folders }] = await Promise.all([
    query,
    supabase.from('folders').select('id, name, parent_id').order('name'),
  ])

  const hasPending = (links ?? []).some((link) => link.status === 'pending')

  return (
    <>
      <PendingAutoRefresh hasPending={hasPending} />
      <AddLinkForm />

      <form className="flex flex-wrap gap-2" action="/library">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search…"
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <select name="source" defaultValue={source ?? ''} className="rounded border px-2 py-2 text-sm">
          <option value="">All sources</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded border px-3 py-2 text-sm">
          Filter
        </button>
        {(q || source || category) && (
          <Link href="/library" className="rounded border px-3 py-2 text-sm text-gray-500">
            Clear
          </Link>
        )}
      </form>

      <div className="flex flex-col gap-3">
        {links && links.length > 0 ? (
          links.map((link) => (
            <LinkCard key={link.id} link={link as LinkRow} folders={(folders as FolderRow[]) ?? []} />
          ))
        ) : (q || source || category) ? (
          <p className="py-12 text-center text-gray-400">
            No links match your search or filters.
          </p>
        ) : (
          <p className="py-12 text-center text-gray-400">
            No links saved yet — paste one above to get started.
          </p>
        )}
      </div>
    </>
  )
}
