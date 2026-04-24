# 깨시뭐해 UX 유저테스트 보고서

**테스트일:** 2026-04-24  
**테스터:** UX 디자인 에이전트 (AI)  
**대상 버전:** commit 7d1230f  

---

## 📊 테스트 개요

코드 리뷰 기반 UX 평가 (Heuristic Evaluation) 수행. Nielsen의 10가지 Heuristics 기준 적용.

---

## ✅ 강점 (Strengths)

### 1. 명확한 정보 구조
- 하단 네비게이션 (오늘/추억/설정)으로 주요 기능 3개 명확히 분리
- 각 페이지의 목적이 직관적

### 2. 피드백 시스템 우수
- 활동 완료 체크박스 (✓)
- 3단계 표정 피드백 (좋아함/보통/싫어함)
- 수면 카드에서 잠들기/깎 시간 표시
- AI 한줄 요약 (일일 뷰)

### 3. 시각적 피드백
- 카테고리별 색상 코딩 (신체/감각/언어/인지/정서)
- 캘린더의 점묘화 (dot canvas)로 활동량 시각화
- 레이더 차트로 발달 영역 균형 표시

### 4. 점진적 고도화
- 기본 추천 활동 → 직접 추가 활동 → AI 채팅 대화
- 단순 기록 → 인사이트 분석으로 점진적 가치 제공

### 5. 온보딩 흐름
- 로그인 → 온보딩(아기정보+깨시설정) → 메인 페이지
- 자연스러운 첫 경험 설계

---

## ⚠️ 개선 필요 사항 (Issues)

### 🔴 중등도 (Moderate) — 즉시 수정 권장

#### ISSUE-01: 하단 네비게이션 "주간" 탭 누락
**위치:** `src/components/ui/BottomNav.tsx`  
**문제:** `/week` 페이지(이번 주 깨시 미리보기)로 이동하는 네비게이션 링크가 없음  
**영향:** 사용자가 미래 일정을 미리 확인할 수 있는 경로 차단  
**해결:** BottomNav에 "주간" 탭 추가 (오늘/추억/주간/설정 4개)

```tsx
// BottomNav.tsx 수정 예시
<Link href="/week" className={`flex-1 py-4 text-center text-sm font-medium ${
  path === '/week' ? 'text-amber-500' : 'text-gray-400'
}`}>
  주간
</Link>
```

---

#### ISSUE-02: 에러 처리가 사용자에게 전달되지 않음
**위치:** 다수 컴포넌트 (DailyChat, WakeWindowCard, ActivityList 등)  
**문제:** `catch {}` 블록이 비어있거나 `console.error`만 출력  
**영향:** API 실패 시 사용자가 "왜 안 되지?"라고 생각하며 방치  
**해결:** 에러 상태 변수 추가 + 사용자에게 메시지 표시

```tsx
// 예: WakeWindowCard.tsx
const [error, setError] = useState<string | null>(null)

// catch 블록에서:
catch {
  setError('활동 추천을 불러오지 못했어요.') // 이미 있음! → 다른 컴포넌트도 동일하게
}
```

**특히 문제가 되는 곳:**
- `DailyChat.tsx` line 57: `console.error('Failed to load previous chat')`
- `ActivityList.tsx` line 43: `// swallow — logs are non-critical`
- `AddCustomActivity.tsx` line 127: `// 에러 시 조용히 실패`

---

#### ISSUE-03: 로딩 상태가 너무 단순
**위치:** `src/app/page.tsx` line 109-120, `src/app/week/page.tsx` line 34-40  
**문제:** "불러오는 중..." 텍스트만 표시, 스키레톤 UI 없음  
**영향:** 로딩 시간 길 때 사용자가 "멈췄나?"라고 생각  

**해결:** 스키레톤 UI 적용 (이미 ActivityList에 존재하므로 다른 컴포넌트에도 적용)

```tsx
// page.tsx의 로딩 상태 개선 예:
return (
  <main className="min-h-screen p-6">
    {/* 헤더 스키레톤 */}
    <div className="h-8 bg-amber-200 rounded animate-pulse mb-8 w-32" />
    {/* 카드 스키레톤 */}
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-48 bg-white rounded-2xl animate-pulse" />
      ))}
    </div>
  </main>
)
```

---

### 🟡 경등도 (Minor) — 일정 내 수정 권장

#### ISSUE-04: 인사이트 모드에서 "활동이 없는 날" 비활성화
**위치:** `src/components/memories/MonthCalendar.tsx` line 286-290  
**문제:** 인사이트 모드에서 활동이 없는 날은 `opacity-30 cursor-default`로 비활성화  
**영향:** 사용자가 "왜 이 날은 못 고르나?"라고 생각할 수 있음  
**해결:** 툴팁 또는 안내 텍스트 추가 ("활동이 있는 날만 선택 가능")

---

#### ISSUE-05: 수면 카드에서 "간밤 수면"과 "취침"의 구분 모호
**위치:** `src/components/sleep-card/SleepCard.tsx`  
**문제:** 
- napIndex=0 → "간밤 수면" (sleep_end만 표시)
- napIndex>=totalWindows → "취침" (sleep_start만 표시)
- 중간 → "N번째 낮잠" (양쪽 표시)

**영향:** 첫 번째/마지막 수면 카드의 의미가 직관적이지 않음  
**해결:** 아이콘 또는 설명 텍스트 추가

```
간밤 수면 🌙 → "어제 자고 일어난 시간"
취침 🛏️ → "오늘 밤에 잠들 시간"
```

---

#### ISSUE-06: DailyChat의 "오늘 하루 설계하기"가 항상 첫 메시지 고정
**위치:** `src/components/daily-chat/DailyChat.tsx` line 92-98  
**문제:** 사용자가 대화 내용을 지울 수 있는 방법이 없음 (재시작 방법 부재)  
**영향:** 잘못된 설계 후 재시도하고 싶을 때 불편  

**해결:** "새로운 설계 시작" 버튼 추가 또는 대화 지우기 기능

---

#### ISSUE-07: ActivityItem에서 메모 자동저장 600ms 딜레이
**위치:** `src/components/wake-window-card/ActivityItem.tsx` line 180-187  
**문제:** 메모 입력 시 600ms debounce 후 자동 저장  
**영향:** 빠르게 여러 활동 메모를 입력할 때 저장 타이밍이 불명확  

**해결:** 저장 완료 피드백 (체크마크 또는 "저장됨" 표시)

---

#### ISSUE-08: 태블릿/데스크톱 환경에서 중앙 정렬만
**위치:** `src/app/layout.tsx` line 16  
**문제:** `max-w-md mx-auto`로 고정되어 태블릿 이상에서 중앙에 작은 화면으로 표시  
**영향:** 태블릿 사용 시 여백이 너무 큼  

**해결:** `max-w-md lg:max-w-4xl` 등으로 반응형 너비 적용

---

### 🔵 사소한 사항 (Cosmetic) — 여유 시 수정

#### ISSUE-09: 폰트 일관성
- `layout.tsx`: Inter 폰트 사용
- `memories/layout.tsx`: Gamja_Flower 폰트 사용
- 각 컴포넌트内: `var(--font-gamja)` 또는 직접 스타일

**해결:** 전역 폰트 정책 통일 (예: headings는 Gamja_Flower, body는 Inter)

---

#### ISSUE-10: Dark Mode 스타일이 일부 누락
**위치:** 다수 컴포넌트  
**문제:** `dark:bg-gray-800` 등 dark mode 클래스가 일부 컴포넌트에만 적용  
**영향:** dark mode 사용 시 일부 요소가 눈에 거슬림  

---

## 📈 우선순위 요약

| 우선도 | 이슈 ID | 설명 | 예상 작업량 |
|--------|---------|------|-------------|
| 🔴 P0 | ISSUE-01 | 하단 네비 "주간" 탭 추가 | 5분 |
| 🔴 P0 | ISSUE-02 | 에러 처리 개선 (전체) | 30분 |
| 🔴 P0 | ISSUE-03 | 로딩 스키레톤 UI 적용 | 20분 |
| 🟡 P1 | ISSUE-04 | 인사이트 모드 안내 추가 | 10분 |
| 🟡 P1 | ISSUE-05 | 수면 카드 라벨 개선 | 10분 |
| 🟡 P1 | ISSUE-06 | DailyChat 재시작 기능 | 15분 |
| 🟡 P1 | ISSUE-07 | 메모 저장 피드백 | 10분 |
| 🟡 P2 | ISSUE-08 | 반응형 너비 개선 | 15분 |
| 🔵 P2 | ISSUE-09~10 | 폰트/dark mode 통일 | 20분 |

---

## 💡 UX 개선 제안 (신규 기능)

### 1. "오늘의 인사이트" 뱃지
메인 페이지 상단에 "오늘 이 활동이 많아요!" 같은 실시간 알림 배지 추가

### 2. 활동 기록 단축키
캘린더에서 날짜 탭 시 바로 메모 입력 모달 표시 (빠른 기록)

### 3. 수면 패턴 시각화
주간/월간 수면 그래프 추가 (잠들기 시간 변화 추적)

### 4. 공유 기능
인사이트 결과를 이미지로 저장하여 가족과 공유 (SNS 공유 버튼)

### 5. 액션 힌트
처음 사용하는 기능에 대한 툴팁 가이드 (onboarding 2차)

---

## ✅ 테스트 방법론

- **Heuristic Evaluation:** Nielsen's 10 Heuristics 기준 코드 리뷰
- **Scope:** 18개 컴포넌트 + 7개 페이지 전체 코드 분석
- **Limitation:** 실제 사용자 테스트 아님 → 코드 기반 예측 평가

---

**보고서 작성 완료** 🐾✨
