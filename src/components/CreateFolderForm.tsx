'use client'

import { useActionState } from 'react'
import { createFolder } from '@/app/actions/folders'

export function CreateFolderForm({ parentId }: { parentId: string | null }) {
  const [state, formAction, pending] = useActionState(createFolder, undefined)

  return (
    <form action={formAction} className="flex gap-2">
      <input type="hidden" name="parentId" value={parentId ?? ''} />
      <input
        name="name"
        type="text"
        required
        placeholder="New folder name…"
        className="flex-1 rounded border px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded border px-3 py-2 text-sm disabled:opacity-50"
      >
        {pending ? 'Creating…' : 'New folder'}
      </button>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  )
}
