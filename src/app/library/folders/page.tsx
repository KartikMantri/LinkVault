import { createClient } from '@/lib/supabase/server'
import { CreateFolderForm } from '@/components/CreateFolderForm'
import { FolderListItem } from '@/components/FolderListItem'

export default async function FoldersRootPage() {
  const supabase = await createClient()

  const { data: folders } = await supabase
    .from('folders')
    .select('id, name, parent_id')
    .is('parent_id', null)
    .order('name')

  return (
    <div className="flex flex-col gap-6">
      <CreateFolderForm parentId={null} />

      <div className="flex flex-col gap-2">
        {folders && folders.length > 0 ? (
          folders.map((folder) => (
            <FolderListItem key={folder.id} id={folder.id} name={folder.name} parentId={null} />
          ))
        ) : (
          <p className="py-12 text-center text-gray-400">
            No folders yet — create one above, or save an Instagram link to auto-create one.
          </p>
        )}
      </div>
    </div>
  )
}
