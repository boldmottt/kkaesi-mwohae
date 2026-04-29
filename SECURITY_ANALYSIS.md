# 리스크의 보안 + 데이터 보호 + 차별화 분석 보고서

## 📊 종합 점수: 6.5/10

RLS 정책이 대부분의 테이블에 잘 적용되어 있지만, **API 레이어 인증 체크 누락**이 다수 존재하며, 아동 정보 보호 측면에서 보완이 필요합니다.

---

### ✅ 강점 (3개)

1. **Supabase RLS(Row Level Security) 정책 전체 적용**
   - `profiles`, `wake_windows`, `activity_cache`, `invitations`, `profile_members`, `activity_logs`, `routines`, `daily_chat_sessions`, `daily_routine_status`, `custom_activity_tags`, `sleep_logs` 등 11개 테이블 모두 RLS 활성화
   - 정책: `owner_user_id = auth.uid()` 또는 `profile_members`를 통한 배우자 공유 로직 구현
   - 파일: `supabase/migrations/001_initial_schema.sql` (50~89행)

2. **서버 사이드 Supabase 클라이언트 사용**
   - `@supabase/ssr`를 활용한 SSR 클라이언트로 API 키가 클라이언트에 노출되지 않음
   - `.env.local`이 `.gitignore`에 포함되어 API 키가 레포지토리에 커밋되지 않음
   - 파일: `src/lib/supabase/server.ts`

3. **이중 인증 방식 제공 (이메일 링크 + 비밀번호)**
   - 사용자가 선택할 수 있는 `magic link`와 `password` 두 가지 로그인 방식 제공
   - 비밀번호 저장 없이 Supabase Auth에 위임하여 해싱 부담 제거
   - 파일: `src/app/login/page.tsx`

---

### ⚠️ 개선 필요 (5개, 중요도 P0~P3)

| # | 영역 | 문제점 | 중요도 | 해결책 |
|---|------|--------|--------|--------|
| 1 | **보안** | `src/app/api/activity-log/route.ts` GET/POST에 **인증 체크 전무** — profileId만 알면 모든 사용자의 활동 로그 읽기/쓰기 가능 | **P0** (치명적) | 모든 API에 `const { data: { user } } = await supabase.auth.getUser()` 추가. profileId가 auth.uid()의 프로필과 일치하는지 검증 |
| 2 | **보안** | `src/app/api/activities/route.ts`, `/refresh/route.ts`에 **인증 체크 전무** — 미로그인 상태에서도 AI 활동 추천 생성/조회 가능 | **P0** (치명적) | 인증 체크 + profileId 소유자 검증 추가. OpenAI API 호출 비용 남용 방지 |
| 3 | **보안** | `src/app/api/custom-tags/route.ts`, `/sleep-logs/route.ts`에 **인증 체크 전무** — 프로필 ID만 알면 태그/수면 로그 접근 가능 | **P1** (중요) | 인증 체크 + 소유자 검증 추가. RLS가 있지만 API 레벨 방어 필요 |
| 4 | **데이터 보호** | 온보딩에서 **아기 이름 + 생년월일 수집** — GDPR 아동정보(Kids' Data) 보호 규정 위반 가능성. 만 13세 미만 아동 데이터는 COPPA(미국), 아동복지법(한국)의 특별 보호 대상 | **P1** (중요) | 생년월일 대신 "태어난 달"만 수집하거나, 보호자 동의 절차 추가. 데이터 삭제 시 프로필/생년월일도 함께 삭제하는 기능 제공 |
| 5 | **데이터 보호** | `daily_summaries` 테이블이 마이그레이션에 **미등록** — `daily-summary/route.ts`(120행)와 `monthly-insight/route.ts`(143행)에서 참조하지만 스키마에 없음. RLS 정책도 미적용 | **P1** (중요) | 마이그레이션 파일 추가: `010_daily_summaries.sql` — 테이블 생성 + RLS 활성화 |

---

### 🔐 보안 체크리스트

- [x] **RLS 정책 전체 적용**: 11개 테이블 중 10개에 RLS 활성화 (daily_summaries 누락)
- [ ] **모든 API 인증 체크**: 21개 route 중 14개만 인증 체크 완료 (7개 누락)
- [ ] **profileId 소유자 검증**: 인증 체크가 있는 API도 profileId가 현재 사용자의 것인지 검증 안 함 (모든 API 공통 문제)
- [ ] **API 키 노출 방지**: ✅ 서버 사이드 클라이언트 사용, .env.local gitignore 포함
- [ ] **SQL 인젝션 방지**: ✅ Supabase 클라이언트 파라미터 바인딩 사용 (문자열拼接 없음)
- [ ] **Rate Limiting**: ❌ API 호출 횟수 제한 없음 — OpenAI API 비용 폭주 가능
- [ ] **입력값 검증**: ⚠️ Zod 스키마 검증 없음 — 모든 API가 수동 필드 체크만 수행
- [ ] **에러 메시지 노출**: ⚠️ DB 오류 메시지가 클라이언트에 그대로 반환됨 (일부 API)
- [ ] **데이터 삭제 기능**: ❌ 프로필/아동 정보 전체 삭제 API 미구현 (GDPR "잊혀질 권리")
- [ ] **보안 헤더**: ❌ CSP, X-Content-Type-Options 등 보안 응답 헤더 미설정

---

### 💡 차별화 전략 제언

#### 1. Wake Window 과학 기반 — 경쟁사 대비 핵심 우위
- 기존 육아 앱(맘톡, 베베스코 등)은 단순 수면 기록에 그침
- 깨시뭐해는 **영아 발달 단계별 Wake Window(깨어있을 수 있는 적정 시간)**를 과학적으로 적용하여 활동 추천
- **제언**: Wake Window 알고리즘을 논문/백서로 공개 → "과학적 육아" 브랜드 포지셔닝 강화

#### 2. AI 카테고리 자동 분류 — 수동 입력 부담 제거
- `classify-activity/route.ts`에서 GPT-5.4-nano를 활용해 활동명을 5개 카테고리(신체/감각/언어/인지/정서)에 자동 분류
- 기존 앱은 수동 카테고리 선택만 제공
- **제언**: "아기가 오늘 어떤 발달 영역을 가장 많이 경험했는지 AI가 분석" 기능 강조 → 부모의 피로도 해소

#### 3. 월간/일일 AI 코멘트 — 일기장 느낌의 감정적 가치
- `daily-summary/route.ts`와 `monthly-insight/route.ts`에서 GPT가 아기 하루/월간 활동을 따뜻한 문장으로 요약
- 기존 앱은 통계 차트만 제공, 감정적 연결고리 부족
- **제언**: "매달 아기 발달 리포트"를 유료 프리미엄 기능으로 제공 → 구독 모델 연계

#### 4. 배우자 공유 시스템 — 가족 협업 차별화
- `invitations` 테이블과 `profile_members`를 통한 배우자 초대 시스템 구현
- 기존 앱은 대부분 1인 사용만 지원
- **제언**: "부부가 함께 보는 아기 일기" 마케팅 → 가족 공유 가치 강조

#### 5. AI 채팅 상담 — 실시간 육아 고민 해결
- `chat/route.ts`와 `daily-chat/route.ts`에서 OpenAI를 활용한 실시간 상담
- 기존 앱은 FAQ/글판 수준
- **제언**: "아기 월령 + 현재 활동 + 수면 패턴"을 고려한 맞춤형 AI 상담 → 경쟁사 대비 최고 수준의 개인화

---

### 📋 Priority Action Plan

| 우선순위 | 작업 | 예상 영향 |
|---------|------|----------|
| **P0** | `activity-log/route.ts`, `activities/route.ts`, `/refresh/route.ts`에 인증 체크 + 소유자 검증 추가 | 보안 취약점 즉시 해결 |
| **P1** | `daily_summaries` 테이블 마이그레이션 추가 (RLS 포함) | DB 스키마 불일치 해결 |
| **P1** | 나머지 미인증 API 5개 (`custom-tags`, `sleep-logs`, `import`, `invite`, `daily-chat GET`)에 인증 체크 추가 | API 레이어 보안 완성 |
| **P2** | Zod 스키마 검증 도입 (모든 API 입력값) | 타입 안전성 + SQL 인젝션 방어 강화 |
| **P2** | Rate Limiting 도입 (Next.js API Route Rate Limiter) | OpenAI 비용 남용 방지 |
| **P3** | 프로필 전체 삭제 API 구현 (GDPR 대응) | 법적 준수 + 신뢰도 향상 |
| **P3** | 온보딩에서 생년월일 수집 최소화 (태어난 달만) + 보호자 동의 절차 추가 | 아동정보 보호법 준수 |
