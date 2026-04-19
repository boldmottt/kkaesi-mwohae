# 깨시뭐해 — 작업 현황

**최종 업데이트:** 2026-04-18  
**상태:** 구현 완료 / 배포 준비 중

---

## 완료된 작업 (18 커밋)

| 커밋 | 내용 |
|------|------|
| ddd6221 | fix: pre-deploy 보안 + 버그 수정 |
| e3adafe | chore: Vercel 배포 설정 + 배포 가이드 |
| a2fecd3 | feat: 하단 네비게이션 + 전체 통합 완료 |
| 184fd79 | feat: BabyTime 파일 가져오기 (TDD) |
| b7d17ac | feat: 설정 화면 + 배우자 초대 링크 |
| 5998cdb | feat: 주간 뷰 (6일 날짜 탭 + 깨시 카드) |
| d64b296 | feat: 오늘 화면 메인 (깨시 카드 + 인증 가드) |
| 0185693 | feat: AI 대화 기능 (질문/조건변경 + 활동 재추천) |
| 3bb7180 | feat: 깨시 카드 컴포넌트 (TDD) |
| 1ed102d | feat: Claude API 활동 추천 (캐싱 포함) |
| c4fb619 | feat: 온보딩 프로필 + 깨시 설정 |
| c222a06 | feat: Supabase magic link 인증 |

---

## 구현된 기능

- [x] Magic link 이메일 인증 (Supabase Auth)
- [x] 온보딩: 아기 프로필 + 깨시 설정
- [x] 오늘 화면: 깨시별 활동 추천 카드
- [x] AI 대화: 질문 답변 + 조건 변경 시 활동 재추천
- [x] 활동 캐싱 (같은 날/깨시 재호출 방지)
- [x] 주간 뷰: 향후 6일 날짜 탭 + 깨시 카드
- [x] 설정 화면: 깨시 수/시간 편집 + 저장
- [x] 배우자 초대 링크 생성 + 클립보드 복사
- [x] BabyTime CSV 가져오기 (깨시 수 자동 제안)
- [x] 하단 네비게이션 (오늘/주간/설정)
- [x] pre-deploy 보안 + 버그 수정

---

## 테스트 현황

**20 tests passing / 5 suites**

| 파일 | 테스트 |
|------|--------|
| `__tests__/utils/age.test.ts` | getAgeInMonths, getAgeLabel |
| `__tests__/utils/time.test.ts` | formatDuration, parseTimeString, formatTimeRange |
| `__tests__/components/ActivityList.test.tsx` | 로딩 스켈레톤, 활동 목록 렌더링 |
| `__tests__/lib/claude-chat.test.ts` | detectResponseType |
| `__tests__/lib/babytime-parser.test.ts` | parseBabyTimeCsv |

---

## 핵심 파일 구조

```
src/
├── app/
│   ├── page.tsx                    # 오늘 화면 (메인)
│   ├── week/page.tsx               # 주간 뷰
│   ├── settings/page.tsx           # 설정 화면
│   ├── login/page.tsx              # 로그인
│   ├── onboarding/page.tsx         # 온보딩
│   ├── join/page.tsx               # 초대 링크 수락
│   └── api/
│       ├── activities/route.ts     # Claude 활동 추천 + 캐싱
│       ├── chat/route.ts           # Claude 대화 (auth guard 있음)
│       ├── invite/route.ts         # 초대 링크 생성
│       └── import/route.ts         # BabyTime CSV 파싱
├── components/
│   ├── wake-window-card/
│   │   ├── WakeWindowCard.tsx      # 깨시 카드 (활동 + 채팅)
│   │   ├── ActivityList.tsx        # 활동 목록 + 로딩
│   │   └── ChatBox.tsx             # AI 대화 박스
│   ├── settings/
│   │   ├── WakeWindowSettings.tsx  # 깨시 횟수/시간 설정
│   │   └── BabyTimeImport.tsx      # CSV 가져오기 UI
│   ├── week/WeekTabs.tsx           # 날짜 탭
│   └── ui/BottomNav.tsx            # 하단 네비
├── lib/
│   ├── claude/
│   │   ├── activities.ts           # generateActivities()
│   │   └── chat.ts                 # chat(), detectResponseType()
│   ├── supabase/
│   │   ├── client.ts               # 브라우저 클라이언트
│   │   ├── server.ts               # 서버 클라이언트
│   │   └── types.ts                # 공유 인터페이스
│   ├── utils/age.ts                # getAgeInMonths()
│   ├── utils/time.ts               # formatDuration() 등
│   └── babytime/parser.ts          # parseBabyTimeCsv()
└── hooks/
    ├── useProfile.ts
    └── useWakeWindows.ts

supabase/migrations/001_initial_schema.sql   # DB 스키마 (RLS 포함)
```

---

## 배포 남은 작업

`DEPLOY.md` 참고. 요약:

1. **Supabase 설정**
   - `supabase/migrations/001_initial_schema.sql` 실행
   - Auth → Email → Magic Link 활성화
   - Auth → URL Configuration → Site URL = `https://your-domain.vercel.app`

2. **Vercel 환경변수 설정**
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ANTHROPIC_API_KEY=
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   ```

3. **Vercel 배포**
   ```bash
   vercel --prod
   ```

---

## 알려진 이슈 (잔여)

- `useProfile` / `useWakeWindows` hooks가 RLS에만 의존 (명시적 user 필터 없음) — RLS가 올바르게 설정되면 안전하지만, 추가 방어 코드 고려 가능
- `WakeWindowCard` 컴포넌트 테스트 없음 (Claude API mocking 복잡성으로 생략)

---

## 기술 스택

- **프레임워크:** Next.js 14 App Router
- **DB/Auth:** Supabase (PostgreSQL + Magic Link)
- **AI:** Anthropic SDK (`claude-sonnet-4-6`)
- **스타일:** Tailwind CSS (amber 테마, max-w-md 모바일)
- **테스트:** Jest + @swc/jest + @testing-library/react
- **배포:** Vercel + Supabase
