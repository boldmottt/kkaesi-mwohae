# 깨시뭐해 — 작업 현황

**최종 업데이트:** 2026-04-23  
**상태:** 운영 중 / 기능 개선 진행 중

---

## 완료된 기능

### 핵심 기능
- [x] Magic link 이메일 인증 (Supabase Auth)
- [x] 온보딩: 아기 프로필 + 깨시 설정
- [x] 오늘 화면: 깨시별 AI 활동 추천 카드
- [x] AI 대화 (ChatBox): 질문 답변 + 조건 변경 시 활동 재추천
- [x] 활동 캐싱 (같은 날/깨시 재호출 방지)
- [x] 설정 화면: 깨시 수/시간 편집 + 저장
- [x] 배우자 초대 링크 생성 + 클립보드 복사
- [x] BabyTime CSV 가져오기 (깨시 수 자동 제안)
- [x] 하단 네비게이션 (오늘/추억/설정)

### 활동 피드백 시스템
- [x] 활동 완료 체크 (did toggle)
- [x] 3단계 표정 피드백 (😊좋아함 / 😐보통 / 😟싫어함)
- [x] 활동 메모 (600ms 디바운스 자동 저장)
- [x] 활동 시간 수정 (+1분/+5분/+30분 버튼, 0분 초기화)
- [x] 커스텀 활동 추가 (사용자 태그 + AI 카테고리 분류)

### 활동 카테고리 라벨링
- [x] AI 추천 활동에 category 자동 부여 (physical/sensory/language/cognitive/emotional/other)
- [x] 커스텀 활동 AI 자동 분류 (/api/classify-activity)
- [x] activity_logs, custom_activity_tags에 category 컬럼

### 수면 카드
- [x] 깨시 사이 수면 카드 (간밤수면/낮잠/취침 3종)
- [x] 수면 시간 입력 → 깨시 start_time 자동 오버라이드 (당일 한정)
- [x] 수면 시간 삭제(취소) 가능
- [x] 낮잠 카드 잠든시간 → 이전 깨시 실제 종료 시간 표시

### DailyChat (일일 AI Q&A)
- [x] 매일 아침 AI 첫 인사 + 루틴 확인
- [x] 루틴 유지/스킵 토글
- [x] AI 대화를 통한 전체 스케줄 업데이트

### 추억 탭
- [x] /memories 페이지 — 날짜별 활동 로그 리스트
- [x] 메모 편집/삭제
- [x] 표정 아이콘 통일 (😊/😟)
- [ ] 달력 GUI (월간 뷰)
- [ ] 일간 상세 뷰 (날짜 탭 → 그날 활동 + 인사이트)
- [ ] 발달 영역 레이더 차트
- [ ] 선호/비선호 활동 랭킹
- [ ] 시간대별 패턴 분석
- [ ] AI 월간 요약 인사이트

### 주간 뷰 (레거시)
- [x] /week 페이지 유지 (직접 URL 접근 가능)
- [x] 향후 6일 날짜 탭 + 깨시 카드

---

## 핵심 파일 구조

```
src/
├── app/
│   ├── page.tsx                    # 오늘 화면 (메인)
│   ├── memories/page.tsx           # 추억 탭
│   ├── week/page.tsx               # 주간 뷰 (레거시)
│   ├── settings/page.tsx           # 설정 화면
│   ├── login/page.tsx              # 로그인
│   ├── onboarding/page.tsx         # 온보딩
│   ├── join/page.tsx               # 초대 링크 수락
│   └── api/
│       ├── activities/             # AI 활동 추천 + 캐싱 + 리프레시
│       ├── activity-logs/          # 활동 로그 CRUD
│       ├── classify-activity/      # 커스텀 활동 AI 카테고리 분류
│       ├── custom-tags/            # 사용자 커스텀 태그 CRUD
│       ├── chat/                   # AI 대화
│       ├── daily-chat/             # 일일 AI Q&A + 루틴 상태
│       ├── sleep-logs/             # 수면 로그 CRUD
│       ├── routines/               # 루틴 관리
│       ├── invite/                 # 초대 링크 생성
│       └── import/                 # BabyTime CSV 파싱
├── components/
│   ├── wake-window-card/
│   │   ├── WakeWindowCard.tsx      # 깨시 카드
│   │   ├── ActivityList.tsx        # 활동 목록 + 커스텀 로그
│   │   ├── ActivityItem.tsx        # 개별 활동 (체크/피드백/메모/시간수정)
│   │   ├── AddCustomActivity.tsx   # 커스텀 활동 추가
│   │   └── ChatBox.tsx             # AI 대화 박스
│   ├── sleep-card/SleepCard.tsx    # 수면 카드
│   ├── daily-chat/DailyChat.tsx    # 일일 AI Q&A
│   ├── settings/                   # 설정 관련 컴포넌트
│   ├── week/WeekTabs.tsx           # 날짜 탭
│   └── ui/BottomNav.tsx            # 하단 네비 (오늘/추억/설정)
├── lib/
│   ├── claude/
│   │   ├── activities.ts           # generateActivities() + category
│   │   ├── infant-dev-reference.ts # 근거 기반 발달 데이터
│   │   ├── chat.ts                 # chat(), detectResponseType()
│   │   └── daily-chat.ts           # 일일 AI 대화
│   ├── supabase/
│   │   ├── client.ts               # 브라우저 클라이언트
│   │   ├── server.ts               # 서버 클라이언트
│   │   └── types.ts                # 공유 인터페이스 (ActivityCategory 포함)
│   ├── utils/age.ts                # getAgeInMonths()
│   ├── utils/time.ts               # formatDuration(), formatPeriodTime() 등
│   └── babytime/parser.ts          # parseBabyTimeCsv()
└── hooks/
    ├── useProfile.ts
    └── useWakeWindows.ts

supabase/migrations/
├── 001_initial_schema.sql
├── 002_add_cache_duration.sql
├── 003_add_routines.sql
├── 004_add_cache_routines.sql
├── 005_fix_cache_integrity.sql
├── 006_daily_chat_and_routine_skip.sql
├── 007_custom_tags.sql             # (custom_activity_tags 테이블)
├── 008_sleep_logs.sql              # (sleep_logs 테이블)
└── 009_activity_category.sql       # (category 컬럼 추가)
```

---

## 다음 작업 (예정)

1. **추억 탭 리뉴얼** — 달력 GUI + 일간 뷰 + 인사이트 카드
2. **DailyChat 인사이트 연동** — 누적 통계 기반 아침 인사 개선
3. **발달 영역 분석** — 레이더 차트 + 주간/월간 리포트

---

## 기술 스택

- **프레임워크:** Next.js 14 App Router
- **DB/Auth:** Supabase (PostgreSQL + Magic Link)
- **AI:** OpenAI GPT-5.4-nano (활동 추천, 카테고리 분류, 대화)
- **스타일:** Tailwind CSS (amber 테마, max-w-md 모바일)
- **테스트:** Jest + @swc/jest + @testing-library/react
- **배포:** Vercel + Supabase
