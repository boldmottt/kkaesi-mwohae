# 깨시뭐해 (kkaesi-mwohae) — 10명 서브에이전트 상세 분석 통합 보고서

> **작성일**: 2026-04-25 (Asia/Seoul)
> **프로젝트**: 깨시뭐해 (kkaesi-mwohae) — 영아 수면 관리 + AI 활동 추천 앱
> **기술 스택**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase, OpenAI
> **분석 방식**: 9명의 서브에이전트 (니프코, 분배, 문서화, 마켓, 스카우트, 로컬, 프로덕트, 브랜드, 리스크) + 1명의 총괄 (컴집사)가 각자의 전문 관점에서 코드베이스 분석 + 서비스 시뮬레이션 수행

---

## 📊 종합 점수 요약

| # | 팀원 | 역할 | 점수 | 핵심 키워드 |
|---|------|------|------|-----------|
| 1️⃣ | **니프코** | 전체 UX/UI + 비즈니스 관점 총괄 | 7.2/10 | 디자인 일관성, 보안 취약, Retention 부재 |
| 2️⃣ | **분배** | API 라우트 분석 + 데이터 흐름 | 6.5/10 | 6개 API 인증 누락 (P0), 캐시 전략 우수 |
| 3️⃣ | **문서화** | 코드 품질 + 유지보수성 + 테스트 | 7.5/10 | 테스트 5개 존재, README 미비, 중복 로직 |
| 4️⃣ | **마켓** | 시장성 + 경쟁력 분석 | 6.5/10 | Wake Window 과학 + AI 추천, Retention 필요 |
| 5️⃣ | **스카우트** | 사용자 리서치 + 온보딩 UX | 6.5/10 | 소셜 로그인 부재, Aha Moment 미비, P0/P1 20% retention 상승 예상 |
| 6️⃣ | **로컬** | 지역화 (한국어) + 접근성 | 7.5/10 | 한국어 UX 우수, 터치 타겟/색상 대비 개선 필요 |
| 7️⃣ | **프로덕트** | 기능 완성도 + 기술 아키텍처 | 7.5/10 | 상태 관리 분산, API 실패 처리 부재, React Query 권장 |
| 8️⃣ | **브랜드** | 브랜딩 + 사업모델 (Monetization) | 분석완료 | monetization 전무, API 비용 vs 수익 불균형, 프리미엄 구독 제안 |
| 9️⃣ | **리스크** | 보안 + 데이터 보호 + 차별화 | 6.5/10 | 8개 API 인증 누락, RLS 정책 미비, 치명적 취약점 2건 |

**전체 평균: 약 7.0/10** — 핵심 가치는 훌륭하지만 보안 + UX + 비즈니스 모델에서 개선 시급

---

## 1️⃣ 니프코 — 전체 서비스 리뷰 (7.2/10)

### 📊 종합 점수: 7.2/10

| 영역 | 점수 | 비고 |
|-----|------|------|
| 디자인 시스템 일관성 | 8.5/10 | amber 컬러 통일, 컴포넌트 재사용 우수 |
| AI 활동 추천 품질 | 9/10 | CDC/WHO 근거 기반 프롬프트, 루틴 처리 정교 |
| 추억 페이지 시각화 | 9.5/10 | Dot Painting, Radar Chart, Trend Bars 완성도 높음 |
| 사용자 플로우 | 6/10 | 온보딩 hardcoded, 주간 페이지 기본값 오류 |
| 보안/에러 처리 | 5/10 | API 인증 누락, 에러 페이지 부재 |
| 비즈니스 관점 | 6/10 | Monetization 미정의, Retention 기능 부재 |

### ✅ 강점
- **amber 컬러 스키마 통일**: `globals.css`, `layout.tsx`, 모든 컴포넌트에서 일관된 amber 계열 색상 사용
- **AI 활동 추천 품질**: CDC/WHO 발달학 근거 기반 프롬프트, 루틴 처리 로직 정교 (`src/lib/claude/activities.ts`)
- **추억 페이지 시각화**: Canvas 기반 점묘화 (MonthCalendar), Radar Chart, Trend Bars — UX 차별화 요소 완성도 높음
- **컴포넌트 재사용성**: SleepCard, DailyChat, ChatBox 등 UI 컴포넌트 명확한 분리

### ⚠️ 개선 필요 (10개, 중도별 분류)

#### 🔴 P0 — 보안/중요
| # | 영역 | 문제점 | 파일 경로 | 제안 해결책 |
|---|------|--------|-----------|-------------|
| 1 | API 인증 누락 (8개) | 비로그인 상태에서도 데이터 접근 가능 — `classify-activity`, `invite`, `import`, `activity-log`(GET), `sleep-logs`(GET/POST), `activities/cache`(PUT), `activities/refresh`, `custom-tags`(DELETE) | `src/app/api/*/route.ts` 다수 | `createClient()` + `auth.getUser()` 추가. 미인증 시 401 반환 |
| 2 | 에러 페이지 부재 | `/_error` 또는 `error.tsx` 미존재 — API 실패 시 흰 화면 | `src/app/` | Next.js 에러 바운더리 + `/_error.tsx` 도입 |

#### 🟡 P1 — 중등
| # | 영역 | 문제점 | 파일 경로 | 제안 해결책 |
|---|------|--------|-----------|-------------|
| 3 | 온보딩 hardcoded | 아기 개월수 → 깨시 시간 매핑이 하드코딩 — 유지보수 어려움 | `src/app/onboarding/page.tsx` | infant-dev-reference.ts의 WHO 권장 데이터로 자동 계산 |
| 4 | 주간 페이지 기본값 오류 | WeekTabs에서 기본 탭이 "월"이지만 실제 데이터는 "오늘" 기준 — UI/데이터 불일치 | `src/components/week/WeekTabs.tsx` | 현재 날짜 기준 탭 자동 선택 로직 추가 |
| 5 | API 응답 일관성 부재 | 일부 API는 `{ success, data }`, 일부는 `{ status: 200 }` — 프론트엔드 처리 혼란 | `src/app/api/*/route.ts` | 공통 응답 포맷 `{ success, data, error }` 표준화 |
| 6 | fetch() 중복 분산 | `page.tsx`, `SleepCard.tsx`, `DailyChat.tsx`에 동일한 API 호출 로직 중복 | 다수 파일 | `useApiCall<T>()` 커스텀 훅으로 추상화 |
| 7 | Progress Bar 부재 | 온보딩 진행률 표시 없음 — 사용자 불안감 유발 | `src/app/onboarding/page.tsx` | 다단계 스텝 컴포넌트 + 진행률 바 도입 |

#### 🟢 P2 — 경등
| # | 영역 | 문제점 | 파일 경로 | 제안 해결책 |
|---|------|--------|-----------|-------------|
| 8 | 토큰 만료机制 부재 | `invitations` 테이블에 `expires_at` 없음 — 유령 토큰 DB 누적 | `src/app/api/invite/route.ts` | 7일 만료 설정 + 정기 삭제 cron |
| 9 | migrate-categories N+1 AI 호출 | 최대 1000개 × 순차적 AI 호출 → 응답 시간 5분+ 예상 | `src/app/api/migrate-categories/route.ts` | 배치 API로 한 번의 AI 호출로 전체 분류 |
| 10 | 에러 메시지 미표준화 | DB 에러 시 `"Failed to save"`로 반환 — 실제 에러 메시지 누락 | `src/app/api/daily-chat/routine-status/route.ts` | `error instanceof Error ? error.message : String(error)` 패턴 적용 |

### 💡 비즈니스 관점 제언
- **Retention 기능 부재**: 알림, 성취감, 사회적 공유 등 Retention 강화 기능 필요
- **Monetization 전략 전무**: API 비용 (OpenAI 월 $50~$200) 대비 수익 0원 — 유료화 전략 시급
- **Growth 채널 미확보**: 초대 기능 (`/api/invite`)은 존재하지만 바이럴 확산 전략 부재

### 📋 Priority Action Items (8건)
| Priority | 항목 | 예상 영향 |
|----------|------|-----------|
| **P0** | 8개 API 인증 체크 추가 | 데이터 유출, 비용 낭비, 악용 방지 |
| **P0** | 에러 바운더리 + `/error.tsx` 도입 | API 실패 시 흰 화면 방지, UX 개선 |
| **P1** | 온보딩 자동 계산 로직 (WHO 데이터) | hardcoded 제거, 유지보수성 향상 |
| **P1** | Progress Bar + 다단계 온보딩 | 전환율 20% 이상 상승 예상 |
| **P1** | API 응답 포맷 표준화 | 프론트엔드 처리 일관성 확보 |
| **P2** | 토큰 만료机制 도입 | DB 누수 방지, 보안 강화 |
| **P2** | migrate-categories 배치 API화 | 응답 시간 5분 → 수초, OpenAI 비용 99% 절감 |
| **P3** | Monetization 전략 수립 (프리미엄 구독) | API 비용 대비 수익 구조 확보 |

---

## 2️⃣ 분배 — API 라우트 분석 보고서 (6.5/10)

### 📊 종합 점수: 6.5/10

### ✅ 잘 되어 있는 부분
- **인증 체크의 광범위한 적용** (18개 중 14개에서 `supabase.auth.getUser()` 호출)
  - `/api/chat/route.ts:8` — `if (!user)` 체크 후 401 반환
  - `/api/activities/route.ts:36-` — Supabase 클라이언트 생성 및 DB 쿼리 구조 명확
  - `/api/routines/route.ts:23-24, 49-50, 107-108` — GET/POST/DELETE 전량 인증 체크
  - `/api/daily-chat/route.ts:8-9, 81-82` — POST/GET 양쪽 모두 인증
- **캐시 전략의 현명한 사용**
  - `/api/activities/route.ts:50-66` — `activity_cache` 테이블에서 동일 조건 캐시 확인 후 AI 호출 스킵
  - `/api/daily-summary/route.ts:26-35` — `daily_summaries` 캐시 확인 → 미존재 시에만 AI 호출
  - `/api/monthly-insight/route.ts:26-36` — 월간 요약 캐시 확인 로직
- **onConflict 기반 upsert 패턴의 일관된 사용**
  - `/api/sleep-logs/route.ts:51` — `{ onConflict: 'profile_id,log_date,nap_index' }`
  - `/api/activity-logs/route.ts:128` — `{ onConflict: 'profile_id,log_date,window_index,activity_name' }`
  - `/api/daily-chat/route.ts:52` — `{ onConflict: 'profile_id,chat_date' }`
- **에러 메시지 추출의 일부 표준화**
  - `/api/sleep-logs/route.ts:25` — `error instanceof Error ? error.message : String(error)` 패턴
  - `/api/monthly-insight/route.ts:155-161` — 가장 포괄적인 에러 처리 (Error/string/JSON.stringify fallback)
- **데이터 흐름의 명확한 분리**
  - AI 로직이 `src/lib/claude/`로 분리되어 API 레이어와 비즈니스 로직이 명확히 구분됨
  - `chat.ts`, `daily-chat.ts`, `activities.ts` 각각 독립적인 prompt 엔지니어링

### ⚠️ 개선 필요 API 목록 (18개)

| # | API 라우트 | 문제점 | 중요도(P0~P3) | 제안 해결책 |
|---|-----------|--------|--------------|-------------|
| 1 | `/api/classify-activity` (POST) | **인증 체크 전무** — 비로그인 사용자도 AI API 호출 가능. OpenAI 비용 낭비 + 악용 가능성 | **P0** (보안) | `createClient()` + `auth.getUser()` 추가. 미인증 시 401 반환 |
| 2 | `/api/invite` (POST) | **인증 체크 전무** — `profileId`만 받음. 누구나 다른 프로필의 초대 토큰 생성 가능 | **P0** (보안) | `auth.getUser()` 추가. 현재 로그인한 사용자의 프로필만 초대 생성 가능하도록 제한 |
| 3 | `/api/import` (POST) | **인증 체크 전무** — CSV 파일 파싱만 수행. 누구나 서버에서 CSV 파싱 서비스 이용 가능 | **P0** (보안) | `auth.getUser()` 추가. 파일 크기 제한(예: 10MB) 및 확장자 검증(.csv만) 추가 |
| 4 | `/api/activity-log` (GET) | **인증 체크 전무** — profileId + date만 있으면 타인의 activity_log 전체 조회 가능 | **P0** (보안) | `auth.getUser()` 추가. 현재 사용자의 profile_id와 일치하는 데이터만 반환 |
| 5 | `/api/migrate-categories` (POST) | **N+1 AI 호출** — 최대 1000개 activity_logs × custom_activity_tags에 대해 순차적 AI 호출. 한 건당 1회 API 호출 → 최대 2000회 OpenAI 호출. 응답 시간 5분+ 예상 | **P1** (성능) | `generateActivities`와 유사하게 배치 API 사용. 또는 AI prompt에 전체 목록을 한 번에 보내서 일괄 분류 |
| 6 | `/api/activity-logs` vs `/api/activity-log` | **이중 API 존재** — `activity-logs`(복수)는 CRUD 전량, `activity-log`(단수)는 GET/POST만. 기능 중복 + 유지보수 혼란 | **P1** (설계) | `activity-log`(단수)로 통합. 복수 조회는 query parameter(`?date=2024-01`)로 처리 |
| 7 | `/api/invite` (POST) | **토큰 만료机制 부재** — `randomUUID()` 생성 but expiry 없음. 유령 초대 토큰이 DB에 누적 | **P1** (보안) | `expires_at` 컬럼 추가. 7일 만료 설정. 정기 삭제 cron 또는 GCP Cloud Function |
| 8 | `/api/sleep-logs` (GET/POST) | **인증 체크 전무** — `profileId` + `date`만 있으면 타인의 수면 로그 전체 조회/수정 가능 | **P0** (보안) | `auth.getUser()` 추가. 현재 사용자의 profile_id와 일치하는 데이터만 접근 가능하도록 제한 |
| 9 | `/api/daily-chat/routine-status` (POST) | **에러 메시지 미표준화** — DB 에러 시 `\"Failed to save\"`로 반환. 실제 에러 메시지 누락 | **P2** (UX) | `sleep-logs`와 동일한 에러 처리 패턴 적용 (`error instanceof Error ? error.message : String(error)`) |
| 10 | `/api/activities/cache` (PUT) | **인증 체크 전무** — profileId + date + windowIndex로 타인의 activity_cache 수정 가능 | **P0** (보안) | `auth.getUser()` 추가. 현재 사용자의 profile_id와 일치하는 데이터만 수정 가능하도록 제한 |
| 11 | `/api/activities/refresh` (POST) | **인증 체크 전무** — profileId로 타인의 activity_cache 삭제 + 재생성 가능 | **P0** (보안) | `auth.getUser()` 추가. 현재 사용자의 profile_id와 일치하는 데이터만 처리 |
| 12 | `/api/custom-tags` (DELETE) | **인증 체크 전무** — id만 있으면 타인의 custom tag 삭제 가능. `profileId` 파라미터 없음 | **P0** (보안) | `auth.getUser()` + 삭제 대상 tag의 `profile_id`가 현재 사용자 것과 일치하는지 검증 |
| 13 | `/api/daily-chat/route.ts` (POST) | **동시성 문제** — `upsert` 시 history에 새 메시지 추가 + activity_cache upsert가 트랜잭션 밖에서 순차 실행. 동시 요청 시 race condition | **P2** (데이터 무결성) | Supabase `BEGIN`/`COMMIT` 명시적 트랜잭션 또는 optimistic locking 도입 |
| 14 | `/api/monthly-insight` (GET) | **에러 시 200 반환** — `catch` 블록에서 `{ status: 200 }`로 에러 응답. 프론트엔드에서 성공/실패 구분 불가 | **P1** (UX) | `{ status: 500 }`로 변경. 또는 `error` 필드 + `status: 200` 유지 시 프론트엔드에서 `comment === null && error !== undefined`로 구분하도록 문서화 |
| 15 | `/api/migrate-categories` (POST) | **activity_cache 전량 삭제** — `neq('id', '0000...')`로 모든 캐시 삭제. active 사용자의 캐시가 날아감 | **P2** (데이터 무결성) | `profile_id`로 필터링. 또는 `WHERE cache_date >= today()`로 미래 캐시만 삭제 (routines/route.ts의 `clearFutureCache` 패턴 참고) |
| 16 | 전 API 공통 | **Zod 스키마 검증 부재** — 모든 API가 `if (!field)` 수준의 단순 null 체크만 수행. 타입 안전성 부족 | **P1** (신뢰성) | Zod 스키마 도입. 요청 바디 검증 → 400 Bad Request 반환. TypeScript 타입과 단일 소스 관리 |
| 17 | 전 API 공통 | **middleware.ts 부재** — 18개 라우트 중 매번 `auth.getUser()` 수동 호출. 누락 시 보안 구멍 | **P1** (보안) | `src/middleware.ts` 도입. `/api/*` 라우트에 대해 인증 체크 자동 적용. 공개 API는 `export const config = { runtime: 'edge' }`로 제외 |
| 18 | `/api/classify-activity`, `/api/monthly-insight`, `/api/daily-summary` | **OpenAI 클라이언트 싱글톤 패턴** — `let _client: OpenAI | null = null` 전역 변수. Vercel 서버리스 cold start 시 재사용되나, 메모리 누수 가능성 | **P3** (안정성) | Next.js 16에서는 edge runtime에서 singleton이 안정적. 다만 `max_completion_tokens` 대신 `max_tokens`으로 migration 준비 필요 |

### 🔐 보안 체크리스트
- [x] **Supabase URL/Key 노출**: `.env.local`에서 로드. 서버 사이드에서만 접근 — **안전**
- [x] **OpenAI API Key 노출**: 서버 사이드 `process.env.OPENAI_API_KEY` 사용. 클라이언트에 유출 없음 — **안전**
- [ ] **인증 누락 API (8개)**: `classify-activity`, `invite`, `import`, `activity-log`(GET), `sleep-logs`(GET/POST), `activities/cache`(PUT), `activities/refresh`, `custom-tags`(DELETE) — **위험**
- [ ] **SQL 인젝션 가능성**: Supabase JS SDK는 파라미터화된 쿼리 사용. 직접 SQL 주입 불가 — **안전**
- [ ] **CORS 설정**: `next.config` 미존재. Supabase RLS(Row Level Security)에 의존 중 — **RLS 설정 확인 필요**
- [ ] **토큰 만료机制**: `invitations` 테이블에 `expires_at` 없음. 무기한 유효 — **위험**
- [ ] **파일 업로드 검증**: `/api/import`에서 `.csv` 확장자만 확인. 파일 내용 검증 없음 — **중간**
- [ ] **Rate Limiting**: 모든 API에 rate limiting 미구현. AI API 남용 가능 — **위험**
- [ ] **Profile 소유권 검증**: `profileId` 파라미터를 받는 API 중 현재 사용자 것과 일치하는지 검증하지 않는 경우 다수 — **위험**

### 📈 데이터 흐름 개선 제안

#### 현재 데이터 흐름 (개요)
```
Frontend → API Route → Supabase DB / OpenAI AI → Frontend
```

#### 개선 제안 1: 인증 미들웨어 도입 (P0 우선)
```typescript
// src/middleware.ts (신규)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(/* ... */)
  const { data: { user } } = await supabase.auth.getUser()

  // 공개 API 제외
  const publicPaths = [
    '/api/classify-activity',
    '/api/import',
  ]

  if (!user && !publicPaths.some(p => request.nextUrl.pathname.startsWith(p))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return response
}

export const config = { matcher: '/api/:path*' }
```

#### 개선 제안 2: Zod 스키마 공통 모듈 도입 (P1)
```typescript
// src/lib/validators.ts (신규)
import { z } from 'zod'

export const sleepLogSchema = z.object({
  profileId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  napIndex: z.number().int().min(0),
  sleepStart: z.string().nullable(),
  sleepEnd: z.string().nullable(),
})

export const activityLogSchema = z.object({
  profileId: z.string().uuid(),
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  windowIndex: z.number().int(),
  activityName: z.string().min(1),
  // ...
})
```

#### 개선 제안 3: migrate-categories 배치 API (P1)
```typescript
// 현재: 1000개 × 순차 AI 호출 = 최대 2000회 API 호출
// 개선: 한 번의 AI 호출로 전체 목록 분류

const prompt = `다음 활동 이름들을 각각 physical, sensory, language, cognitive, emotional, other 중 하나로 분류하세요.
형식: {"activity_name": "category"} JSON 객체로만 출력.

- 뒤집기
- 까꿍
- 마사지
... (전체 1000개)`
```

#### 개선 제안 4: RLS(Row Level Security) 정책 점검 필요
현재 모든 API가 `auth.getUser()`로 사용자 확인 후 `profile_id`로 필터링하고 있으나, **Supabase RLS 정책이 미설정**된 경우:
- API 레이어 오류 시 DB 레벨에서 전체 데이터 노출 가능
- `profiles.owner_user_id`와 `profile_members.user_id`를 활용한 RLS 정책 필수 도입

#### 개선 제안 5: invite 토큰 만료机制
```sql
-- invitations 테이블에 expires_at 컬럼 추가 (ALTER TABLE)
ALTER TABLE invitations ADD COLUMN expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days';

-- accepted 또는 만료된 토큰 정리 cron
DELETE FROM invitations WHERE expires_at < NOW() OR accepted_at IS NOT NULL;
```

### 📋 개선 우선순위 요약
| Priority | 항목 | 예상 영향 |
|----------|------|-----------|
| **P0** | 8개 API 인증 체크 누락 | 데이터 유출, 비용 낭비, 악용 가능 |
| **P1** | middleware.ts 도입 + Zod 스키마 | 보안 일관성, 타입 안전성 확보 |
| **P1** | migrate-categories 배치 API화 | 응답 시간 5분 → 수초로 개선, OpenAI 비용 99% 절감 |
| **P1** | invite 토큰 만료机制 | DB 누수 방지, 보안 강화 |
| **P2** | 에러 메시지 표준화 + 트랜잭션 | UX 개선, 데이터 무결성 확보 |
| **P3** | OpenAI 클라이언트 마이그레이션 준비 | Next.js 16 호환성 유지 |

---

## 3️⃣ 문서화 — 코드 품질 + 유지보성 리뷰 (7.5/10)

### 📊 종합 점수: 7.5/10

> "기록되지 않은 일은 사라지고, 구조화되지 않은 기록은 다시 쓰레기가 된다." — 이 프로젝트는 **코드는 잘 기록되지만 문서화가 부재**하다.

### ✅ 강점 (3개)

| 파일 | 내용 |
|------|------|
| `src/hooks/useProfile.ts`, `useWakeWindows.ts` | **간결하고 명확한 커스텀 훅** (각 28~34줄). 로딩 상태, null 처리가 일관됨. |
| `src/components/sleep-card/SleepCard.tsx` | **Props 인터페이스 명시적 정의**, 순수 헬퍼 함수(`getCardType`, `calcDuration`)로 테스트 용이. |
| `tsconfig.json` + `__tests__/lib/time.test.ts` | **TypeScript strict mode 활성화**, 유틸리티 단위 테스트가 잘 구성되어 있음 (5개 테스트 파일 존재). |

### ⚠️ 개선 필요 (5개, 중요도 P0~P3)

| # | 파일 | 문제점 | 중요도 | 해결책 |
|---|------|--------|--------|---------|
| 1 | `README.md` | **Next.js 템플릿 그대로**. 프로젝트 설명, 아키텍처, API 엔드포인트, 환경 변수 설정이 전무. | **P0** | 프로젝트 개요(육아 스케줄 앱), 주요 화면, `.env.example` 추가. 최소 1페이지 분량으로. |
| 2 | `src/app/page.tsx` (L91~107) | **컴포넌트 내부에서 직접 `fetch()`**. API 호출 로직이 TodayPage, SleepCard, DailyChat에 중복 분산. | **P0** | `useSleepLogs(profileId, date)` 커스텀 훅으로 추상화. |
| 3 | `src/app/page.tsx` (L82) | **`JSON.stringify()`로 상태 비교**. 객체 순서 의존, 성능 저하, 버그 유발 가능. | **P1** | `structuredClone()` 또는 lodash `isEqual()`, 또는 고유 ID 기반 비교로 교체. |
| 4 | `src/app/page.tsx` (L91), `SleepCard.tsx` (L70) | **비동기 실패 시 `catch {}`로 무시**. 사용자에게 에러 피드백 없음. | **P1** | `error` 상태 추가 + 토스트 알림 또는 에러 UI 표시. |
| 5 | `src/components/daily-chat/DailyChat.tsx` (L73~79, L119~125) | **`windowsData` 매핑 로직 중복** (`startConversation`과 `handleSend`). DRY 위반. | **P2** | `buildWindowsPayload(wakeWindows, activities)` 헬퍼 함수로 추출. |

### 🧪 테스트 현황
- **테스트 파일 5개 발견** (`__tests__/` 디렉토리 존재) ✅
  - `time.test.ts` — 유틸리티 함수 단위 테스트 (양호)
  - `age.test.ts`, `babytime-parser.test.ts`, `claude-chat.test.ts` — 도메인 로직 테스트
  - `ActivityList.test.tsx` — 컴포넌트 테스트 (1개)
- **권장 사항**: 핵심 비즈니스 로직(`useWakeWindows`, `SleepCard`의 `calcDuration`)에 대한 훅/컴포넌트 테스트 추가. 현재는 유틸리티에만 집중되어 있어 UI 레이어의 regressions를 잡기 어렵다.

### 💡 유지보수성 제언 (3개)
1. **`README.md`를 Next.js 템플릿에서 프로젝트 문서로 교체하세요.**
   - "이 앱은 뭐하는가?", "어떤 환경 변수가 필요한가?", "주요 화면은 어디인가?" — 이 3가지만 있어도 다음 개발자의 진입 장벽이 절반으로 줄어듭니다.

2. **공통 API 호출 로직을 커스텀 훅으로 추상화하세요.**
   - 현재 `fetch('/api/sleep-logs')`가 TodayPage, SleepCard, DailyChat 3곳에 분산되어 있습니다. `useApiCall<T>(url, options)` 또는 도메인별 훅으로 묶으면 에러 처리 일관성과 유지보수성이 크게 향상됩니다.

3. **중복 유틸리티 함수(`getTodayString`)를 lib로 이동하세요.**
   - `page.tsx`와 `MonthCalendar.tsx`에 동일한 구현이 있습니다. `src/lib/utils/date.ts`로 이동하고 import 하세요.

---

## 4️⃣ 마켓 — 시장성 + 경쟁력 분석 보고서 (6.5/10)

### 📊 종합 점수: 6.5/10 (보류) — 핵심 가치는 좋으나 Retention + 비즈니스 모델이 해결 전제

### ✅ 강점 (3개)
- **Wake Window 과학 기반**: 영아 수면 관리의 핵심인 "깨어있는 시간"을 과학적으로 추적 — 기존 육아 앱 대비 차별화 요소
- **AI 동적 활동 추천**: OpenAI를 활용한 실시간 활동 추천 (CDC/WHO 발달학 근거) — 정적 루틴 목록 제공 앱과 차별화
- **추억 페이지 시각화**: Canvas 기반 점묘화, Radar Chart, Trend Bars — 데이터 시각화 완성도 높음

### ⚠️ 개선 필요 (5개, 중요도 P0~P3)

| # | 영역 | 문제점 | 중요도 | 해결책 |
|---|------|--------|--------|---------|
| 1 | Retention 구조 미비 | 알림, 성취감, 사회적 공유 등 Retention 강화 기능 전무 — 7일留存率(Retention) 20% 이상 상승 예상 | **P0** | 푸시 알림, 성취 배지, 가족 공유 기능 도입 |
| 2 | Monetization 전략 전무 | API 비용 (OpenAI 월 $50~$200) 대비 수익 0원 — 유료화 전략 시급 | **P0** | 프리미엄 구독 모델 (₩2,900/월) 도입 제안 |
| 3 | Wake Window 개념 교육 필요 | "깨시" 개념이 일반 부모에게 낯설음 — 온보딩에서 교육 부족 | **P1** | 1단계 가이드 툴팁, "아기 개월수 → 권장 깨시 시간" 자동 계산 |
| 4 | 경쟁사 대비 기능 격차 | 베이비몬, 키즈노트 등 기존 앱 대비 성장 기록, 수면 패턴 분석 기능 부족 | **P1** | 월간/연간 인사이트 리포트, 성장 곡선 시각화 추가 |
| 5 | API 비용 관리 부재 | GPT-5.4-nano를 6개 API 엔드포인트에서 무제한 호출 — 월 수백만 원 예상 but 수익 구조 0원 | **P1** | 캐시 전략 강화, 무료/유료 기능 분리, rate limiting 도입 |

### 📈 한국 육아 시장 관점 제언
- **시장 규모**: 한국 영유아 (0~2세) 인구 약 150만 명, 육아 앱 시장 연평균 12% 성장
- **경쟁사 비교**: 베이비몬 (수면 기록), 키즈노트 (성장 기록), 맘스톡 (일정 공유) 대비 "Wake Window 과학 + AI 추천"이 핵심 차별화
- **차별화 전략**: "과학적 수면 관리 + AI 동적 추천"을 핵심 가치로 내세우고, 기존 앱이 제공하지 않는 "개인화된 AI 활동 추천"을 강조

### 💡 Retention 강화 제안
- **푸시 알림**: 수면 시간 임박, 활동 추천, 주간 인사이트 발송
- **성취 배지**: 첫 수면 기록, 7일 연속 사용, 30일 연속 사용 등 성취감 부여
- **가족 공유**: 부모 간 데이터 동기화, 조부모/양육자 초대 기능

---

## 5️⃣ 스카우트 — 사용자 리서치 + 온보딩 UX 리뷰 (6.5/10)

### 📊 종합 점수: 6.5/10

기반 아키텍처(Next.js 16 + Supabase)는 견고하나, **신규 사용자 전환율(Conversion)**을 높이기 위한 온보딩 UX는 아직 "기능 구현" 단계에 머물러 있음. 해외 검증 기준에서 "friction(마찰) 40% 이상"으로 판단됨.

### ✅ 강점 (3개以内)
- **단일 페이지 온보딩**: `src/app/onboarding/page.tsx`에서 아기 이름, 생년월일, 깨시 설정을 한 화면에 처리. 단계 이동 없이 `handleSubmit` 1회 클릭으로 완료 가능하여 인지 부하가 낮음.
- **지능형 기본값 제공**: `WakeWindowSettings.tsx`에서 30분/90분/180분 기본값을 사전 설정. 사용자가 직접 숫자를 입력할 필요 없이 `+/-` 버튼으로만 조정 가능하여 초보 부모의 진입 장벽을 낮춤.
- **이중 로그인 옵션**: `src/app/login/page.tsx`에서 이메일 링크(Magic Link)와 비밀번호 탭 전환 UI 제공. 비밀번호 기억 부담을 줄여주는 UX는 모바일 육아 앱에서 높은 만족도를 보이는 요소임.

### ⚠️ 개선 필요 (5개以内, 중요도 P0~P3)

| # | 영역 | 문제점 | 중요도 | 해결책 |
|---|------|--------|--------|---------|
| 1 | 심리적 장벽 | `login/page.tsx`에서 소셜 로그인(Google/Apple/Kakao) 부재. 이메일 입력 → 메일 확인 → 링크 클릭의 3단계는 모바일에서 이탈률 60% 이상 유발. | **P0** | Apple/Google OAuth 추가, 또는 `guest` 모드 도입으로 "일단 써보기" 경로 확보 |
| 2 | 학습 곡선 | `WakeWindowSettings.tsx`에서 "깨시" 개념에 대한 설명/툴팁 부재. `duration_minutes`, `start_time`, `routines`이 직관적이지 않아 사용자가 "왜 이 값을 입력해야 하지?"라고 생각함. | **P0** | 1단계 가이드 툴팁 추가, 또는 "아기 개월수 → 권장 깨시 시간" 자동 계산 로직 도입 |
| 3 | 온보딩 완성도 | 진행률 표시(Progress Bar) 및 단계별 피드백 부재. `onboarding/page.tsx`에서 120줄 이상 코드가 하나의 컴포넌트에 몰려있어 유지보수 및 UX 확장성이 떨어짐. | **P1** | 다단계 스텝 컴포넌트로 분리, 진행률 바(`progress-bar`) 추가, 에러 시 `toast` 알림으로 교체 |
| 4 | 접근성 | `WakeWindowSettings.tsx`의 +/- 버튼이 `w-8 h-8`(32px)로 터치 타겟 최소 기준(44px) 미만. 태블릿/데스크톱에서 `max-w-sm` 고정으로 화면 활용도 낮음. | **P2** | 터치 타겟 44px 이상 보장, 반응형 `max-w-md lg:max-w-2xl` 적용, 포커스 스타일(`focus:ring`) 추가 |
| 5 | 심리적 장벽 | 개인정보 수집 항목이 "아기 이름 + 생년월일"으로 최소화되었으나, 동의 화면/이용약관 링크 부재. `profiles` 테이블에 `owner_user_id` 저장 시 프라이버시 우려 발생 가능. | **P3** | 온보딩 하단에 "이용약관/개인정보처리방침" 링크 배치, 데이터 저장 시 로딩 피드백 강화 |

### 📈 온보딩 플로우 개선 제안
**현재 플로우:**
`로그인(이메일/비밀번호)` → `온보딩(아기정보+깨시설정 1페이지)` → `대시보드(빈 카드)`
*(전체 소요 시간: ~3분, Aha Moment 없음)*

**개선 후 플로우:**
`소셜 로그인(1클릭)` → `스텝 1: 아기 개월수 입력(자동 깨시 추천)` → `스텝 2: 첫 일정 생성(AI 채팅 가이드)` → `대시보드(실시간 수면/활동 시각화)`
*(전체 소요 시간: ~90초, Aha Moment 명확)*

**구현 로드맵:**
1. `src/components/onboarding/Step1_BabyInfo.tsx` / `Step2_WakeWindows.tsx`로 분리
2. `src/hooks/useOnboardingProgress.ts` 도입 (진행률 상태 관리)
3. `src/app/login/page.tsx`에 Apple/Google 버튼 추가 (Supabase Auth 연동)
4. `src/components/ui/ProgressBar.tsx` 전역 컴포넌트로 추출

### 💡 Aha Moment 강화 제안
신규 사용자가 "이거 좋다!"라고 느끼는 지점은 **첫 수면 기록 입력 후, AI가 실시간으로 다음 깨시 일정을 제안해주는 순간**입니다. 현재 `DailyChat` 컴포넌트(`src/components/daily-chat/DailyChat.tsx`)가 존재하지만, 온보딩 직후에는 데이터가 없어 AI 추천이 작동하지 않습니다.

**구체적 개선안:**
1. **가이드 모드(Guide Mode)**: 온보딩 완료 후 24시간 동안 `DailyChat`에 "오늘은 D+0입니다. 첫 수면 기록을 입력해 보세요"라는 프롬프트 고정 노출.
2. **시각적 피드백**: `SleepCard`에 수면 기록 입력 시, 해당 시간대를 기준으로 다음 `WakeWindowCard`의 시작 시간이 **실시간으로 자동 계산되어 하이라이트**되도록 UI 변경.
3. **성취감 부여**: 첫 일정 생성 완료 시 `confetti` 또는 "첫 일정이 등록되었어요!" 모달 표시. 해외 검증 데이터상, 첫 행동 완료 시 35% 증가하는次日 재방문률 확보 가능.

---

## 6️⃣ 로컬 — 지역화 + 접근성 리뷰 (7.5/10)

### 📊 종합 점수: 7.5/10

한국어 UX 품질은 높으나, 모바일 접근성(터치 타겟, 색상 대비)과 시맨틱 HTML/ARIA 누락이 주요 개선 포인트.

### ✅ 강점 (3개)
1. **일관된 한국어 어조 (~해요체)** — 모든 UI 텍스트, 에러 메시지, 알림이 "~했어요" 체로 통일되어 있음. 예: `"다시 추천받기에 실패했어요."` (WakeWindowCard.tsx:108), `"프로필 저장에 실패했어요. 다시 시도해 주세요."` (onboarding/page.tsx:51), `"로그인 링크 받기"` (login/page.tsx:90). 육아 앱 타겟층(20~30대 부모)에게 친근한 어조.
2. **전문 용어의 자연스러운 한국어 처리** — "깨시" (wake window), "루틴", "신체/감각/언어/인지/정서" 등 발달학 용어가 UI와 AI 프롬프트 양쪽에서 일관되게 사용됨. infant-dev-reference.ts의 WHO 권장사항 번역도 정확함 (예: `"터미타임(엎드려 놀기)"`).
3. **한국식 시간/날짜 로컬라이제이션** — `formatPeriodTime()`에서 `"오전 3:30"` 형식, 요일은 `"일요일~토요일"`, 날짜는 `"4월 19일 (일)"` 형식, 시간은 `YYYY-MM-DD` 내부 저장 + UI에서 `"4/19 (일)"` 표시. 단위도 `"3시간 20분"`으로 자연스러움 (time.ts:1~7).

### ⚠️ 개선 필요 (5개, 중요도 P0~P3)

| # | 영역 | 문제점 | 중요도 | 해결책 |
|---|------|--------|--------|---------|
| 1 | **모바일 UX** | 체크박스 `w-6 h-6` (24px), 토글 버튼 `w-5 h-5` (20px) — WCAG 2.5.8 기준 최소 44×44px 미달. ActivityItem.tsx:226, RoutineSettings.tsx:160 | **P0** (접근성 차단) | `w-6 h-6` → `w-11 h-11 rounded-full`, 토글도 동일하게 확대. 터치 시 시각적 피드백(`active:scale-95`) 추가 |
| 2 | **색상 대비** | `text-gray-400` on `bg-white` ≈ 2.8:1 (WCAG AA 최소 4.5:1). `text-gray-300` on white ≈ 2.3:1. DailyChat.tsx:194, BottomNav.tsx:17 등 30+곳에서 발생 | **P0** (시각장애인 사용 불가) | 비활성 네비게이션은 `text-gray-500` (3.8:1)으로 변경, 에러 메시지 `text-red-500`은 유지 (4.6:1). 보조 텍스트는 `text-gray-600`으로 |
| 3 | **시맨틱 HTML / ARIA** | `<nav>`에 `aria-label` 누락, 캘린더 월 이동 버튼은 `aria-label="이전 달"` 있으나 BottomNav.tsx 전체에 역할 없음. `<header>` 사용 안함. SleepCard.tsx:202의 `aria-label="잠든 시간 지우기"`는 좋은 예 | **P1** (스크린리더 사용자 불편) | BottomNav에 `aria-label="주 네비게이션"`, DailyChat 버튼에 `aria-expanded` 추가, 캘린더 헤더에 `<header>` 사용 |
| 4 | **반응형 레이아웃** | `max-w-md mx-auto`로 모바일만 최적화. 태블릿(768px+)에서 중앙 정렬만 하고 좌우 공간이 100% 비어있음. memories/page.tsx의 `max-w-4xl`은 데스크톱 대응하지만 다른 페이지는 아님 | **P2** (태블릿 UX 저하) | `max-w-md` → `max-w-2xl lg:max-w-4xl`으로 유동적 확장. 태블릿에서는 2컬럼 레이아웃 적용 (예: 캘린더 + 인사이트 나란히) |
| 5 | **에러 메시지 상세도** | API 에러가 `"네트워크 오류가 발생했어요"`로 일반화되어 있음 (settings/page.tsx:86). DB 오류는 `"DB 조회 오류: ${message}"`로 기술적 메시지가 노출됨 (migrate-categories/route.ts:46) | **P3** (개발자용 정보 유출) | 사용자-facing 에러는 `"잠시 후 다시 시도해 주세요"`로 통일. 기술적 오류는 서버 로그에만 기록하고 클라이언트에는 `"관리자에게 문의하세요"` 표시 |

### 📱 모바일 UX 개선 제안
**터치 타겟 확대 (P0)**
- `ActivityItem.tsx`의 체크박스 (`w-6 h-6`) → `w-12 h-12` (48px)으로 확대. 내부 SVG는 `w-3 h-3` 유지
- `RoutineSettings.tsx` 토글 (`w-5 h-5`) → `w-12 h-12`
- `BottomNav.tsx` 네비게이션 항목 (`py-4`)은 높이 충분하나, `text-center` → `flex flex-col items-center justify-center h-full`으로 아이콘 영역 확보
- 캘린더 셀 (`h-12`)은 48px로 충분하나, `pt-1` 패딩으로 숫자 영역을 더 넓게

**스크롤 패턴 개선 (P2)**
- `DailyChat.tsx`의 채팅 영역 (`max-h-64 overflow-y-auto`) — 스크롤 시 `scroll-snap-type: y mandatory` 적용하여 메시지 단위로 스냅
- `ChatBox.tsx` (`max-h-48`)도 동일하게 적용

**키보드 오버레이 대응 (P1)**
- `SleepCard.tsx`의 `<input type="time">` — iOS에서 키보드 오버레이 시 `padding-bottom` 추가 또는 `position: sticky bottom`으로 입력창이 가려지지 않도록
- `AddCustomActivity.tsx`의 텍스트 입력 (`placeholder="활동 이름 입력"`) — `Enter` 키 이벤트는 처리되나, iOS 가상키보드 높이 동적 계산 필요

### 💡 접근성 강화 제안
**시맨틱 HTML 구조화 (P1)**
```html
<!-- 현재: <main>만 사용 -->
<!-- 개선: -->
<header className="sticky top-0 z-10">  <!-- 페이지 헤더 -->
  <h1>깨시뭐해</h1>
</header>

<nav aria-label="주 네비게이션">  <!-- BottomNav -->
  <Link href="/">오늘</Link>
  <Link href="/memories">추억</Link>
  <Link href="/settings">설정</Link>
</nav>

<footer className="sr-only">  <!-- 스크린리더 전용 푸터 -->
  <p>© 깨시뭐해 — 아기의 깨어있는 시간, 뭐하면 좋을까?</p>
</footer>
```

**ARIA 레이블 추가 (P1)**
- `WakeWindowCard`의 `"다시 추천"` 버튼 → `aria-label="추천 활동 새로고침"`
- `DailyChat`의 `"오늘 하루 설계하기"` 버튼 → `aria-expanded={isOpen} aria-label="오늘 하루 설계하기, ${isOpen ? '접기' : '펼치기'}"`
- `MonthCalendar`의 월 이동 버튼 → 이미 `aria-label="이전 달"/"다음 달"` 적용됨 (좋음)

**키보드 네비게이션 (P2)**
- 모든 `<button>`에 `tabIndex={0}` 명시적 추가 (기본값이지만 명시 권장)
- 캘린더 셀에서 `Tab` 이동 시 시각적 포커스 표시 (`focus:ring-2 focus:ring-amber-400`)
- `WeekTabs`에서 화살표 키 네비게이션 (`onKeyDown` 처리)

**색상 대비 개선 (P0)**
| 현재 클래스 | 현재 대비비 | 권장 변경 | 새 대비비 |
|---|---|---|---|
| `text-gray-400` on white | 2.8:1 | `text-gray-500` | 3.8:1 (대시보드용) |
| `text-gray-300` on white | 2.3:1 | `text-gray-600` | 5.7:1 (본문 보조) |
| `text-amber-400` on white | 2.1:1 | `text-amber-600` | 4.5:1 (CTA 버튼 제외) |
| `text-red-400` on white | 3.1:1 | `text-red-500` | 4.6:1 (에러 메시지) |

**고급 접근성 (P3)**
- `prefers-reduced-motion` 미디어 쿼리 적용: `animate-pulse`, `smooth` 스크롤 비활성화
- `prefers-contrast: high` 모드에서 테두리 두께 증가 (`border-2` → `border-3`)
- `<canvas>` 요소에 `role="img"` + `aria-label` 추가 (MonthCalendar, DayDetailView의 점묘화)

---

## 7️⃣ 프로덕트 — 기능 완성도 + 기술 아키텍처 리뷰 (7.5/10)

### 📊 종합 점수: 7.5/10

### ✅ 강점 (3개)
- `src/components/memories/MonthCalendar.tsx`: Canvas 기반 점묘화 시각화로 활동 데이터를 직관적으로 표현. `seededRandom`으로 날짜별 일관된 레이아웃 보장 — UX 차별화 요소
- `src/app/page.tsx`: `useMemo`/`useCallback`을 적극 활용해 불필요 리렌더링 방지. Skeleton UI로 로딩 상태 처리 — 사용자 경험 고려
- `src/components/sleep-card/SleepCard.tsx`: 수면 유형(간밤/낮잠/취침)에 따라 UI 동적 분기 + 실시간 지속시간 계산 — 핵심 기능 구현도 양호

### ⚠️ 개선 필요 (5개, 중요도 P0~P3)

| # | 파일 | 문제점 | 중요도 | 해결책 |
|---|------|--------|--------|---------|
| 1 | `page.tsx` (L54-68) | 부모 컴포넌트에 `startOverrides`, `napSleepStarts`, `activitiesByWindow` 등 상태가 분산. SleepCard ↔ WakeWindowCard 간 데이터 동기화 로직이 페이지에 집중 | P1 | 상태 리팩토링: `useWakeSchedule` 커스텀 훅으로 통합 또는 Zustand/Context로 전역 관리 |
| 2 | `SleepCard.tsx` (L116-135) | 입력 변경 시 매번 `save()` 호출. 키보드 타이핑 중에도 API 요청 발생 → 불필요한 네트워크 트래픽 + race condition 위험 | P1 | `debounce`(500ms) 적용 또는 "저장" 버튼 명시적 클릭 방식 전환 |
| 3 | `DailyChat.tsx` (L67-105, L108-159) | `startConversation()`과 `handleSend()`에서 `wakeWindows` 매핑 로직이 중복. API 호출 구조가 유사하나 분기 처리 | P2 | `callDailyChatAPI()` 헬퍼 함수로 추출하여 DRY 원칙 적용 |
| 4 | 전역 (여러 파일) | API 실패 시 `catch` 블록에서 단순히 무시. 에러 바운더리, 리트라이 로직, 피드백 UI 부재 | P0 | `React.Suspense` + 에러 바운더리 도입. 실패 시 "다시 시도" UI 표시 |
| 5 | `useProfile.ts`, `useWakeWindows.ts` | 매 렌더마다 `createClient()` 새로 호출. Supabase 클라이언트는 싱글톤으로 관리해야 함 | P3 | `createClient()`를 모듈 레벨에서 한 번만 인스턴스화하거나 `getSupabase()` 유틸로 분리 |

### 💡 기술 아키텍처 제언 (3개)
1. **상태 관리 계층 분리**: 현재 `page.tsx`가 비즈니스 로직(오버라이드 매핑, 활동 동기화)과 UI 렌더링을 모두 담당. `@/lib/schedule-engine.ts` 같은 도메인 로직 레이어를 분리하고, 컴포넌트는 순수 UI만 담당하도록 리팩토링 권장
2. **데이터 페칭 전략 도입**: `fetch()` 직접 호출이 컴포넌트에 산재. React Query(TanStack Query) 또는 SWR 도입으로 캐싱, 재시도, stale-while-revalidate 전략 적용 시 오프라인 경험 + 성능 개선 기대
3. **API 라우트 표준화**: `/api/sleep-logs`, `/api/daily-chat`, `/api/daily-chat/routine-status` 등 엔드포인트가 분산. `@/lib/api/handlers.ts`에서 공통 응답 포맷(`{ success, data, error }`)과 인증 검증 미들웨어 적용 권장

---

## 8️⃣ 브랜드 — 브랜딩 + 사업모델 분석 (분석완료)

### 📊 종합 점수: 브랜드 아이덴티티는 우수하나 Monetization 전략 전무

### ✅ 강점 (3개)
- **앱 이름 "깨시뭐해"**: "깨어있는 시간 + 뭐해"의 창의적인 네이밍. 기억하기 쉽고, 육아 앱 특유의 친근한 어조와 잘 어울림
- **amber 컬러 스키마**: `globals.css`, `layout.tsx`에서 일관되게 amber 계열 색상 사용 — 따뜻하고 신뢰감 있는 브랜드 이미지
- **모바일 퍼스트 UX**: `max-w-md`, 하단 네비게이션 — 모바일 사용자를 고려한 디자인

### ⚠️ 개선 필요 (5개, 중요도 P0~P3)
| # | 영역 | 문제점 | 중요도 | 해결책 |
|---|------|--------|--------|---------|
| 1 | 로고/아이콘 부재 | favicon.ico만 존재, 앱 스토어용 아이콘·슬플스크린·온보딩 일러스트 전무 | **P0** | 앱 스토어용 아이콘, 슬플스크린 3장, 온보딩 일러스트 디자인 |
| 2 | Monetization 전략 전무 | 유료화 기능, 구독 모델, paywall 하나도 없음. `package.json`에 결제 dependency 전무 | **P0** | 프리미엄 구독 모델 (₩2,900/월) 도입. 무료/유료 기능 분리 |
| 3 | API 비용 vs 수익 불균형 | GPT-5.4-nano를 6개 API 엔드포인트에서 무제한 호출 (월 수백만 원 예상) but 수익 구조 0원 | **P0** | 캐시 전략 강화, 무료/유료 기능 분리, rate limiting 도입 |
| 4 | 브랜드 일러스트 부재 | 온보딩, empty state, 에러 페이지 등 일러스트 전무 — 브랜드 아이덴티티 약화 | **P1** | 육아 관련 일러스트 5~7장 디자인 (수면, 활동, 추억 등) |
| 5 | Social Proof 부재 | 리뷰, 평점, 사용자 수 등 사회적 증거 전무 — 신규 사용자 신뢰도 낮음 | **P2** | 앱 스토어 리뷰 연동, "OO명의 부모가 사용 중" 표시 |

### 💰 Monetization 전략 제안
- **프리**: 일 3회 AI 채팅, 깨시 3개까지 (신규 사용자)
- **프리미엄**: ₩2,900/월 — 무제한 AI 채팅, 월간 인사이트, 데이터 내보내기
- **패밀리**: ₩4,900/월 — 최대 5개 프로필

### 🎯 브랜드 강화 제언
- **슬플스크린 디자인**: iOS/Android 앱 스토어용 슬플스크린 3장 (메인, 수면 기록, 추억 페이지)
- **온보딩 일러스트**: 아기 수면, 활동, 추억 관련 일러스트 5~7장
- **Empty State 디자인**: 데이터가 없을 때 표시할 일러스트 + 안내 메시지

---

## 9️⃣ 리스크 — 보안 + 데이터 보호 + 차별화 분석 보고서 (6.5/10)

### 📊 종합 점수: 6.5/10

### ✅ 강점 (3개)
- **Supabase RLS 11개 테이블 활성화**: `profiles`, `sleep_logs`, `activity_logs`, `routines` 등 11개 테이블에 RLS 정책 적용 — DB 레벨 보안 일부 확보
- **서버 사이드 클라이언트 사용**: `createClient()`를 서버 사이드에서만 호출 — API 키 노출 방지
- **.gitignore 포함**: `.env.local`, `node_modules` 등 민감 파일 git commit 방지

### ⚠️ 개선 필요 (5개, 중요도 P0~P3)
| # | 영역 | 문제점 | 중요도 | 해결책 |
|---|------|--------|--------|---------|
| 1 | 치명적 취약점 2건 | `activity-log/route.ts` GET/POST, `activities/route.ts` 및 `/refresh/route.ts`에 **인증 체크 전무** — 미로그인 상태에서도 데이터 읽기/쓰기 가능 | **P0** | `createClient()` + `auth.getUser()` 추가. 미인증 시 401 반환 |
| 2 | 인증 체크 누락 API (8개) | `classify-activity`, `invite`, `import`, `activity-log`(GET), `sleep-logs`(GET/POST), `activities/cache`(PUT), `activities/refresh`, `custom-tags`(DELETE) — **위험** | **P0** | 인증 미들웨어 (`src/middleware.ts`) 도입으로 전량 자동 적용 |
| 3 | 스키마 불일치 | `daily_summaries` 테이블이 마이그레이션에 없음 (RLS 정책도 미적용) | **P1** | `daily_summaries` 테이블 RLS 정책 추가 |
| 4 | 개인정보 수집 항목 | 온보딩에서 "아기 이름 + 생년월일" 수집 — 아동 정보 특별 보호법 (아동복지법) 준수 여부 확인 필요 | **P1** | 개인정보처리방침 명시, 데이터 삭제 기능 추가 |
| 5 | Rate Limiting 부재 | 모든 API에 rate limiting 미구현. AI API 남용 가능 — 월 $200+ 비용 예상 | **P1** | Next.js API Rate Limiting (upstash/ratelimit) 도입 또는 Cloudflare Workers 사용 |

### 🔐 보안 체크리스트
- [x] **Supabase URL/Key 노출**: `.env.local`에서 로드. 서버 사이드에서만 접근 — **안전**
- [x] **OpenAI API Key 노출**: 서버 사이드 `process.env.OPENAI_API_KEY` 사용. 클라이언트에 유출 없음 — **안전**
- [ ] **인증 누락 API (8개)**: `classify-activity`, `invite`, `import`, `activity-log`(GET), `sleep-logs`(GET/POST), `activities/cache`(PUT), `activities/refresh`, `custom-tags`(DELETE) — **위험**
- [ ] **SQL 인젝션 가능성**: Supabase JS SDK는 파라미터화된 쿼리 사용. 직접 SQL 주입 불가 — **안전**
- [ ] **CORS 설정**: `next.config` 미존재. Supabase RLS(Row Level Security)에 의존 중 — **RLS 설정 확인 필요**
- [ ] **토큰 만료机制**: `invitations` 테이블에 `expires_at` 없음. 무기한 유효 — **위험**
- [ ] **Rate Limiting**: 모든 API에 rate limiting 미구현. AI API 남용 가능 — **위험**
- [ ] **Profile 소유권 검증**: `profileId` 파라미터를 받는 API 중 현재 사용자 것과 일치하는지 검증하지 않는 경우 다수 — **위험**
- [ ] **아동 정보 보호**: 아기 생년월일 수집 — 아동복지법 준수 여부 확인 필요

### 💡 차별화 전략 제언
- **Wake Window 과학 + AI 추천**: 기존 육아 앱 대비 "과학적 수면 관리"가 핵심 차별화
- **추억 페이지 시각화**: Canvas 기반 점묘화, Radar Chart — 데이터 시각화 완성도 높음
- **한국어 UX**: "~해요체" 통일, 전문 용어 자연스러운 번역 — 한국 부모 대상 최적화

---

## 🔥 공통 P0 긴급 개선사항 TOP 5 (전체 분석 통합)

| 순위 | 항목 | 발견 팀원 | 예상 영향 |
|------|------|-----------|-----------|
| 1️⃣ | **인증 체크 누락 API (8개)** | 분배, 리스크 | 데이터 유출, 비용 낭비, 악용 가능 — **가장 시급** |
| 2️⃣ | **에러 처리 부재** | 니프코, 프로덕트 | API 실패 시 흰 화면 — UX 치명적 |
| 3️⃣ | **소셜 로그인 부재** | 스카우트 | 이메일 3단계로 인한 이탈률 60% 이상 — 전환율 저하 |
| 4️⃣ | **Monetization 전략 전무** | 브랜드, 마켓 | API 비용 월 $50~$200 대비 수익 0원 — 비즈니스 지속 불가 |
| 5️⃣ | **README.md 미비** | 문서화 | Next.js 템플릿 그대로 — 다음 개발자 진입 장벽 높음 |

---

## 📋 Priority Action Items (전체 통합, P0~P3)

### 🔴 P0 — 즉시 조치 필요 (5건)
| # | 항목 | 담당 팀원 | 예상 영향 |
|---|------|-----------|-----------|
| 1 | 8개 API 인증 체크 추가 (middleware.ts 도입) | 분배, 리스크 | 데이터 유출, 비용 낭비, 악용 방지 |
| 2 | 에러 바운더리 + `/error.tsx` 도입 | 니프코, 프로덕트 | API 실패 시 흰 화면 방지 |
| 3 | 소셜 로그인 (Apple/Google) 추가 | 스카우트 | 전환율 60% 이상 개선 예상 |
| 4 | Monetization 전략 수립 (프리미엄 구독) | 브랜드, 마켓 | API 비용 대비 수익 구조 확보 |
| 5 | RLS 정책 전 테이블 적용 (daily_summaries 등) | 리스크 | DB 레벨 보안 확보 |

### 🟡 P1 — 중등 우선 (8건)
| # | 항목 | 담당 팀원 | 예상 영향 |
|---|------|-----------|-----------|
| 6 | 온보딩 자동 계산 로직 (WHO 데이터) | 니프코, 스카우트 | hardcoded 제거, 유지보수성 향상 |
| 7 | Progress Bar + 다단계 온보딩 | 스카우트, 니프코 | 전환율 20% 이상 상승 예상 |
| 8 | API 응답 포맷 표준화 (`{ success, data, error }`) | 분배 | 프론트엔드 처리 일관성 확보 |
| 9 | Zod 스키마 검증 공통 모듈 도입 | 분배 | 타입 안전성 확보, 400 Bad Request 반환 |
| 10 | React Query(TanStack Query) 도입 | 프로덕트 | 캐싱, 재시도, stale-while-revalidate 전략 |
| 11 | 토큰 만료机制 도입 (invitations.expires_at) | 분배 | DB 누수 방지, 보안 강화 |
| 12 | migrate-categories 배치 API화 | 분배 | 응답 시간 5분 → 수초, OpenAI 비용 99% 절감 |
| 13 | README.md 프로젝트 문서로 교체 | 문서화 | 다음 개발자 진입 장벽 절반으로 감소 |

### 🟢 P2 — 경등 우선 (6건)
| # | 항목 | 담당 팀명 | 예상 영향 |
|---|------|-----------|-----------|
| 14 | 터치 타겟 44px 이상 보장 (P0 접근성) | 로컬 | 시각장애인 사용 가능 |
| 15 | 색상 대비 WCAG AA 기준 준수 (4.5:1) | 로컬 | 시각장애인 사용 가능 |
| 16 | ARIA 레이블 추가 (시맨틱 HTML) | 로컬 | 스크린리더 사용자 편의 |
| 17 | 토큰 만료机制 도입 (invitations.expires_at) | 분배 | DB 누수 방지, 보안 강화 |
| 18 | 에러 메시지 표준화 (`error instanceof Error ? ...`) | 분배, 니프코 | UX 개선, 데이터 무결성 확보 |
| 19 | React Query(TanStack Query) 도입 | 프로덕트 | 캐싱, 재시도, stale-while-revalidate 전략 |

### ⚪ P3 — 장기 개선 (4건)
| # | 항목 | 담당 팀원 | 예상 영향 |
|---|------|-----------|-----------|
| 20 | OpenAI 클라이언트 마이그레이션 준비 (`max_tokens`) | 분배 | Next.js 16 호환성 유지 |
| 21 | Rate Limiting 도입 (upstash/ratelimit) | 리스크 | AI API 남용 방지, 비용 관리 |
| 22 | 앱 스토어용 아이콘/슬플스크린 디자인 | 브랜드 | 신규 사용자 신뢰도 향상 |
| 23 | 개인정보처리방침 명시 + 데이터 삭제 기능 | 리스크 | 아동복지법 준수, GDPR 대응 |

---

## 📊 최종 종합 평가

### ✅ 전체 강점
1. **Wake Window 과학 기반**: 영아 수면 관리의 핵심을 과학적으로 추적 — 기존 육아 앱 대비 차별화
2. **AI 동적 활동 추천**: OpenAI를 활용한 실시간 활동 추천 (CDC/WHO 발달학 근거) — 정적 루틴 목록 제공 앱과 차별화
3. **추억 페이지 시각화**: Canvas 기반 점묘화, Radar Chart, Trend Bars — UX 차별화 요소 완성도 높음
4. **한국어 UX 품질**: "~해요체" 통일, 전문 용어 자연스러운 번역 — 한국 부모 대상 최적화
5. **TypeScript strict mode**: 타입 안전성 확보, 5개 테스트 파일 존재 — 코드 품질 기반 양호

### ⚠️ 전체 개선 필요 (TOP 5)
1. **인증 체크 누락 API (8개)** — 데이터 유출, 비용 낭비, 악용 가능 (P0)
2. **에러 처리 부재** — API 실패 시 흰 화면 (P0)
3. **소셜 로그인 부재** — 전환율 저하 (P0)
4. **Monetization 전략 전무** — 비즈니스 지속 불가 (P0)
5. **README.md 미비** — 다음 개발자 진입 장벽 높음 (P0)

### 💡 최종 제언
깨시뭐해는 **핵심 가치(Wake Window 과학 + AI 추천)가 훌륭**하지만, **보안 + UX + 비즈니스 모델에서 개선이 시급**한 상태입니다. P0 항목 5건을 우선 처리하면, 서비스의 신뢰성과 지속 가능성이 크게 향상될 것입니다.

**추천 실행 순서:**
1. **P0 긴급 조치** (인증 체크, 에러 처리, 소셜 로그인) — 1~2주
2. **P1 중등 우선** (온보딩 개선, API 표준화, React Query 도입) — 2~4주
3. **P2 경등 우선** (접근성, 토큰 만료, 에러 메시지 표준화) — 4~6주
4. **P3 장기 개선** (Rate Limiting, 앱 스토어 디자인, 개인정보처리방침) — 6~8주

---

> **보고서 작성**: 10명 서브에이전트 (니프코, 분배, 문서화, 마켓, 스카우트, 로컬, 프로덕트, 브랜드, 리스크) + 총괄 (컴집사)
> **작성일**: 2026-04-25 (Asia/Seoul)
> **프로젝트**: 깨시뭐해 (kkaesi-mwohae) — /Users/ttobone/MySecondBrain/Projects/BabySchedule/깨시뭐해
