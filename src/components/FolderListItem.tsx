'use client'

import Link from 'next/link'
import { deleteFolder } from '@/app/actions/folders'

export function FolderListItem({
  id,
  name,
  parentId,
}: {
  id: string
  name: string
  parentId: string | null
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <Link href={`/library/folders/${id}`} className="font-medium hover:underline">
        📁 {name}
      </Link>
      <button
        onClick={() => {
          if (confirm(`Delete "${name}"? Subfolders will be deleted too; links inside will become unfiled.`)) {
            deleteFolder(id, parentId)
          }
        }}
        className="text-sm text-gray-400 hover:text-red-600"
        aria-label={`Delete folder ${name}`}
      >
        ✕
      </button>
    </div>
  )
}
