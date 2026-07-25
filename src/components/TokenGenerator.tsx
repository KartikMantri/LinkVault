'use client'

import { useActionState, useState } from 'react'
import { createApiToken } from '@/app/actions/tokens'

export function TokenGenerator() {
  const [state, formAction, pending] = useActionState(createApiToken, undefined)
  const [copied, setCopied] = useState(false)

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <form action={formAction} className="flex gap-2">
        <input
          name="name"
          type="text"
          placeholder="Token name (e.g. iOS Shortcut)"
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? 'Generating…' : 'Generate token'}
        </button>
      </form>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      {state?.token && (
        <div className="flex flex-col gap-2 rounded border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-900">
            Copy this now — it won&apos;t be shown again.
          </p>
          <code className="break-all rounded bg-white px-2 py-1 text-xs">{state.token}</code>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(state.token!)
              setCopied(true)
            }}
            className="w-fit rounded border px-3 py-1 text-xs"
          >
            {copied ? 'Copied ✓' : 'Copy to clipboard'}
          </button>
        </div>
      )}
    </div>
  )
}
