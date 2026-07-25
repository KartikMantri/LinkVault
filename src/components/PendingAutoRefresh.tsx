'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Enrichment now finishes in the background after Save returns, so a link
// can still say "processing…" for a couple seconds after the page loads.
// This nudges the page to refetch once so the status/tags show up without
// the user having to manually reload.
export function PendingAutoRefresh({ hasPending }: { hasPending: boolean }) {
  const router = useRouter()

  useEffect(() => {
    if (!hasPending) return
    const timer = setTimeout(() => router.refresh(), 3000)
    return () => clearTimeout(timer)
  }, [hasPending, router])

  return null
}
