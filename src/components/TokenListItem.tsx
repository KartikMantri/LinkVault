'use client'

import { revokeApiToken } from '@/app/actions/tokens'

export function TokenListItem({
  id,
  name,
  createdAt,
  lastUsedAt,
}: {
  id: string
  name: string
  createdAt: string
  lastUsedAt: string | null
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-xs text-gray-500">
          Created {new Date(createdAt).toLocaleDateString()}
          {lastUsedAt && ` · Last used ${new Date(lastUsedAt).toLocaleDateString()}`}
        </p>
      </div>
      <button
        onClick={() => {
          if (confirm(`Revoke "${name}"? Anything using this token will stop working.`)) {
            revokeApiToken(id)
          }
        }}
        className="text-gray-400 hover:text-red-600"
        aria-label={`Revoke token ${name}`}
      >
        ✕
      </button>
    </div>
  )
}
