'use client'

import { useActionState } from 'react'
import { addLink } from '@/app/actions/links'

export function AddLinkForm() {
  const [state, formAction, pending] = useActionState(addLink, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-lg border p-4">
      <div className="flex gap-2">
        <input
          name="url"
          type="url"
          required
          placeholder="Paste a link…"
          className="flex-1 rounded border px-3 py-2"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
      </div>
      <input
        name="note"
        type="text"
        placeholder="Optional note…"
        className="rounded border px-3 py-2 text-sm"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  )
}
