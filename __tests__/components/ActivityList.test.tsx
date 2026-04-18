import { render, screen } from '@testing-library/react'
import { ActivityList } from '@/components/wake-window-card/ActivityList'
import { Activity } from '@/lib/supabase/types'

const activities: Activity[] = [
  { name: '터미타임', duration: '5분', effect: '목 가누기 연습' },
  { name: '흑백 카드', duration: '5분', effect: '시각 자극' },
]

describe('ActivityList', () => {
  it('활동 이름을 렌더링한다', () => {
    render(<ActivityList activities={activities} loading={false} />)
    expect(screen.getByText('터미타임')).toBeInTheDocument()
    expect(screen.getByText('흑백 카드')).toBeInTheDocument()
  })

  it('로딩 중에 스켈레톤을 표시한다', () => {
    render(<ActivityList activities={[]} loading={true} />)
    expect(screen.getByTestId('activity-skeleton')).toBeInTheDocument()
  })

  it('소요 시간과 효과를 표시한다', () => {
    render(<ActivityList activities={activities} loading={false} />)
    expect(screen.getAllByText('5분').length).toBeGreaterThan(0)
    expect(screen.getByText('목 가누기 연습')).toBeInTheDocument()
  })
})
