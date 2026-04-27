import type { Metadata } from 'next'
import { BottomNav } from '@/components/ui/BottomNav'
import './globals.css'

export const metadata: Metadata = {
  title: '깨시뭐해',
  description: '아기의 깨어있는 시간, 뭐하면 좋을까?',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-brand-50 max-w-md mx-auto pb-16">
        {children}
        <BottomNav />
      </body>
    </html>
  )
}
