import { detectResponseType } from '@/lib/claude/chat'
import { ChatResponse } from '@/lib/supabase/types'

describe('detectResponseType', () => {
  it('activities 배열이 있으면 "update"를 반환한다', () => {
    const response: ChatResponse = {
      type: 'update',
      content: '외출 일정에 맞게 바꿨어요',
      activities: [{ name: '카페 관찰하기', duration: '30분', effect: '시각 자극' }],
    }
    expect(detectResponseType(response)).toBe('update')
  })

  it('activities 배열이 없으면 "answer"를 반환한다', () => {
    const response: ChatResponse = {
      type: 'answer',
      content: '터미타임 30분은 괜찮아요!',
    }
    expect(detectResponseType(response)).toBe('answer')
  })
})
