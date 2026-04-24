import { Gamja_Flower } from 'next/font/google'

const gamja = Gamja_Flower({ weight: '400', subsets: ['latin'] })

export default function MemoriesLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className={gamja.className}>
      {children}
    </main>
  )
}
