'use client'

import Image from 'next/image'
import { deleteLink } from '@/app/actions/links'
import { moveLinkToFolder } from '@/app/actions/folders'
import { flattenFolderTree, type FolderRow } from '@/lib/folders'

export type LinkRow = {
  id: string
  url: string
  source: string
  title: string | null
  caption: string | null
  thumbnail_url: string | null
  ai_summary: string | null
  ai_category: string | null
  ai_tags: string[] | null
  status: 'pending' | 'processed' | 'error'
  note: string | null
  created_at: string
  folder_id: string | null
}

export function LinkCard({ link, folders }: { link: LinkRow; folders: FolderRow[] }) {
  const folderOptions = flattenFolderTree(folders)

  return (
    <div className="flex gap-4 rounded-lg border p-4">
      {link.thumbnail_url && (
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded bg-gray-100">
          <Image
            src={link.thumbnail_url}
            alt=""
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="uppercase">{link.source.replace('_', ' ')}</span>
          {link.ai_category && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5">{link.ai_category}</span>
          )}
          {link.status === 'pending' && <span>processing…</span>}
          {link.status === 'error' && <span className="text-red-500">AI tagging unavailable</span>}
        </div>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate font-medium hover:underline"
        >
          {link.title || link.url}
        </a>
        {link.ai_summary && <p className="text-sm text-gray-600">{link.ai_summary}</p>}
        {link.note && <p className="text-sm italic text-gray-500">Note: {link.note}</p>}
        {link.ai_tags && link.ai_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {link.ai_tags.map((tag) => (
              <span key={tag} className="rounded bg-gray-50 px-1.5 py-0.5 text-xs text-gray-500">
                #{tag}
              </span>
            ))}
          </div>
        )}
        <select
          defaultValue={link.folder_id ?? ''}
          onChange={(e) => moveLinkToFolder(link.id, e.target.value || null)}
          className="mt-1 w-fit rounded border px-1.5 py-1 text-xs text-gray-500"
        >
          <option value="">Unfiled</option>
          {folderOptions.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={() => deleteLink(link.id)}
        className="self-start text-sm text-gray-400 hover:text-red-600"
        aria-label="Delete link"
      >
        ✕
      </button>
    </div>
  )
}
