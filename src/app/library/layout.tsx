import Link from 'next/link'
import { logout } from '@/app/actions/auth'

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">LinkVault</h1>
        <form action={logout}>
          <button type="submit" className="text-sm text-gray-500 hover:underline">
            Log out
          </button>
        </form>
      </div>

      <nav className="flex gap-4 border-b text-sm">
        <Link href="/library" className="pb-2 hover:text-black">
          Recent
        </Link>
        <Link href="/library/folders" className="pb-2 hover:text-black">
          Folders
        </Link>
        <Link href="/library/settings" className="pb-2 hover:text-black">
          Settings
        </Link>
      </nav>

      {children}
    </div>
  )
}
