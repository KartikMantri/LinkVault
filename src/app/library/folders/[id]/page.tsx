import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreateFolderForm } from '@/components/CreateFolderForm'
import { FolderListItem } from '@/components/FolderListItem'
import { LinkCard, type LinkRow } from '@/components/LinkCard'
import { PendingAutoRefresh } from '@/components/PendingAutoRefresh'
import { breadcrumbFor, type FolderRow } from '@/lib/folders'

export default async function FolderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: allFolders }, { data: links }] = await Promise.all([
    supabase.from('folders').select('id, name, parent_id').order('name'),
    supabase
      .from('links')
      .select('*')
      .eq('folder_id', id)
      .order('created_at', { ascending: false }),
  ])

  const folders = (allFolders as FolderRow[]) ?? []
  const current = folders.find((f) => f.id === id)

  if (!current) {
    notFound()
  }

  const trail = breadcrumbFor(folders, id)
  const subfolders = folders.filter((f) => f.parent_id === id)
  const hasPending = (links ?? []).some((link) => link.status === 'pending')

  return (
    <div className="flex flex-col gap-6">
      <PendingAutoRefresh hasPending={hasPending} />
      <div className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
        <Link href="/library/folders" className="hover:underline">
          Folders
        </Link>
        {trail.map((folder) => (
          <span key={folder.id} className="flex items-center gap-1">
            <span>/</span>
            {folder.id === id ? (
              <span className="text-black">{folder.name}</span>
            ) : (
              <Link href={`/library/folders/${folder.id}`} className="hover:underline">
                {folder.name}
              </Link>
            )}
          </span>
        ))}
      </div>

      <CreateFolderForm parentId={id} />

      {subfolders.length > 0 && (
        <div className="flex flex-col gap-2">
          {subfolders.map((folder) => (
            <FolderListItem key={folder.id} id={folder.id} name={folder.name} parentId={id} />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {links && links.length > 0 ? (
          links.map((link) => (
            <LinkCard key={link.id} link={link as LinkRow} folders={folders} />
          ))
        ) : (
          <p className="py-12 text-center text-gray-400">
            No links in this folder yet — move some in from Recent, or create a subfolder above.
          </p>
        )}
      </div>
    </div>
  )
}
