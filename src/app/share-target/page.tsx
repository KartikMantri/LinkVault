import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { saveLink } from '@/lib/save-link'
import { extractSharedUrl } from '@/lib/extract-url'

export default async function ShareTargetPage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string; text?: string; url?: string }>
}) {
  const { title, text, url: sharedUrl } = await searchParams
  const url = extractSharedUrl({ url: sharedUrl, text, title })

  if (!url) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4 text-center">
        <h1 className="text-xl font-semibold">Couldn&apos;t find a link in that share</h1>
        <p className="text-sm text-gray-500">
          Whatever was shared didn&apos;t contain a recognizable URL. You can paste it manually instead.
        </p>
        <Link href="/library" className="rounded bg-black px-4 py-2 text-white">
          Go to LinkVault
        </Link>
      </div>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4 text-center">
        <h1 className="text-xl font-semibold">Log in to save this link</h1>
        <p className="break-all text-sm text-gray-500">{url}</p>
        <Link href="/login" className="rounded bg-black px-4 py-2 text-white">
          Log in
        </Link>
      </div>
    )
  }

  const result = await saveLink(supabase, user.id, { url })

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4 text-center">
      {result.ok ? (
        <>
          <h1 className="text-xl font-semibold">Saved to LinkVault ✓</h1>
          <p className="break-all text-sm text-gray-500">{url}</p>
        </>
      ) : (
        <>
          <h1 className="text-xl font-semibold">Couldn&apos;t save that link</h1>
          <p className="text-sm text-gray-500">{result.error}</p>
        </>
      )}
      <Link href="/library" className="rounded bg-black px-4 py-2 text-white">
        View library
      </Link>
    </div>
  )
}
