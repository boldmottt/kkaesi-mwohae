'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const HIDDEN_PATHS = ['/login', '/onboarding', '/join']

export function BottomNav() {
  const path = usePathname()

  if (HIDDEN_PATHS.some(p => path.startsWith(p))) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 flex">
      <Link
        href="/"
        className={`flex-1 py-4 text-center text-sm font-medium ${
          path === '/' ? 'text-amber-500' : 'text-gray-400'
        }`}
      >
        오늘
      </Link>
      <Link
        href="/memories"
        className={`flex-1 py-4 text-center text-sm font-medium ${
          path === '/memories' ? 'text-amber-500' : 'text-gray-400'
        }`}
      >
        추억
      </Link>
      <Link
        href="/settings"
        className={`flex-1 py-4 text-center text-sm font-medium ${
          path === '/settings' ? 'text-amber-500' : 'text-gray-400'
        }`}
      >
        설정
      </Link>
    </nav>
  )
}
