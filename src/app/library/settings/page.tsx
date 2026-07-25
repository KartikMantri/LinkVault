import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { TokenGenerator } from '@/components/TokenGenerator'
import { TokenListItem } from '@/components/TokenListItem'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: tokens } = await supabase
    .from('api_tokens')
    .select('id, name, created_at, last_used_at')
    .order('created_at', { ascending: false })

  const headerList = await headers()
  const host = headerList.get('host')
  const proto = headerList.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https')
  const saveEndpoint = `${proto}://${host}/api/save`

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border p-4 text-sm">
        <h2 className="font-medium">iOS Shortcut setup</h2>
        <p className="mt-1 text-gray-500">
          Generate a token below, then in the Shortcuts app create a &quot;Get Contents of URL&quot; action:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-500">
          <li>
            URL: <code className="rounded bg-gray-100 px-1">{saveEndpoint}</code>
          </li>
          <li>Method: POST</li>
          <li>
            Headers: <code className="rounded bg-gray-100 px-1">Authorization: Bearer &lt;your token&gt;</code>,{' '}
            <code className="rounded bg-gray-100 px-1">Content-Type: application/json</code>
          </li>
          <li>
            Request Body (JSON): <code className="rounded bg-gray-100 px-1">{'{ "url": Shortcut Input }'}</code>
          </li>
          <li>Enable &quot;Show in Share Sheet&quot; in the shortcut&apos;s settings</li>
        </ul>
      </div>

      <TokenGenerator />

      <div className="flex flex-col gap-2">
        {tokens && tokens.length > 0 ? (
          tokens.map((t) => (
            <TokenListItem
              key={t.id}
              id={t.id}
              name={t.name}
              createdAt={t.created_at}
              lastUsedAt={t.last_used_at}
            />
          ))
        ) : (
          <p className="py-6 text-center text-gray-400">No tokens yet.</p>
        )}
      </div>
    </div>
  )
}
