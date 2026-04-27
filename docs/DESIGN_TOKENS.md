# 깨시뭐해 · Design Token System

> 작성일: 2026-04-27
> 기준: 추억 탭 (Memories) 시각 언어
> 철학: "따뜻하지만 전문적인 육아 친구"

---

## 1. 컬러 시스템

### 1.1 브랜드 컬러 (Amber 스케일)

| 토큰 | Hex | Tailwind | 용도 |
|------|-----|----------|------|
| `--brand-50` | #FFF8E1 | amber-50 | 앱 배경, 카드 배경 |
| `--brand-100` | #FFECB3 | amber-100 | 연한 하이라이트, 수면 카드 비활성 |
| `--brand-200` | #FFE082 | amber-200 | 태그 배경, 구분선 |
| `--brand-300` | #FFD54F | amber-300 | 보조 버튼, 배지 |
| `--brand-400` | #FFCA28 | amber-400 | 활성 뱃지, 현재 표시 |
| `--brand-500` | #F59E0B | amber-500 | **메인 브랜드 컬러**, CTA 버튼, 아이콘 |
| `--brand-600` | #D97706 | amber-600 | 제목 텍스트, 강조 텍스트 |
| `--brand-700` | #B45309 | amber-700 | 제목 (어두운 배경용), 링크 |
| `--brand-800` | #92400E | amber-800 | 부제목 |
| `--brand-900` | #78350F | amber-900 | 본문 텍스트 (다크 모드용) |

### 1.2 기능 컬러

| 토큰 | Hex | 용도 |
|------|-----|------|
| `--color-sleep` | #E8D5B7 | 수면 카드 (따뜻한 베이지) |
| `--color-sleep-active` | #D4A574 | 수면 카드 활성 |
| `--color-success` | #86C16F | 성공, 완료 상태 |
| `--color-warning` | #F59E0B | 경고 (브랜드와 동일) |
| `--color-error` | #EF4444 | 에러, 삭제 |
| `--color-info` | #60A5FA | 정보 (최소한으로 사용) |

### 1.3 그레이 스케일 (중립)

| 토큰 | Hex | Tailwind | 용도 |
|------|-----|----------|------|
| `--gray-100` | #F3F4F6 | gray-100 | 카드 배경 (다크) |
| `--gray-200` | #E5E7EB | gray-200 | 구분선, 보더 |
| `--gray-300` | #D1D5DB | gray-300 | 비활성 텍스트, 아이콘 |
| `--gray-400` | #9CA3AF | gray-400 | 보조 텍스트 |
| `--gray-500` | #6B7280 | gray-500 | 일반 보조 텍스트 |
| `--gray-600` | #4B5563 | gray-600 | 본문 보조 |
| `--gray-700` | #374151 | gray-700 | 본문 텍스트 |
| `--gray-800` | #1F2937 | gray-800 | 제목 (라이트) |
| `--gray-900` | #111827 | gray-900 | 가장 진한 텍스트 |

### 1.4 발달 영역 카테고리 (5색 → Amber 기반)

| 영역 | 기존 | 새 색상 | Hex |
|------|------|---------|-----|
| 신체 (physical) | 주황 #fb923c | **amber-500** | #F59E0B |
| 감각 (sensory) | 보라 #a855f7 | **amber-700** | #B45309 |
| 언어 (language) | 파랑 #60a5fa | **teal-500** | #14B8A6 |
| 인지 (cognitive) | 초록 #4ade80 | **green-500** | #22C55E |
| 정서 (emotional) | 분홍 #f472b6 | **rose-400** | #FB7185 |

> 참고: 5개 색상 모두 서로 구분되면서도 브랜드(amber)와 조화됨.
> 신체/감각은 amber 계열, 언어/인지/정서는 보조 계열.

---

## 2. 타이포그래피

### 2.1 폰트 스택

```css
--font-heading: 'Gamja Flower', cursive;     /* 제목, 감성 텍스트 */
--font-body: 'Pretendard', -apple-system, sans-serif;  /* 본문, UI */
--font-mono: 'JetBrains Mono', monospace;    /* 코드, 데이터 */
```

### 2.2 크기 스케일

| 레벨 | 크기 | 줄높이 | 무게 | 용도 |
|------|------|--------|------|------|
| `text-xl` | 20px | 1.3 | 700 | 페이지 제목 |
| `text-lg` | 18px | 1.4 | 600 | 섹션 제목 |
| `text-base` | 16px | 1.5 | 400 | 본문 (최소) |
| `text-sm` | 14px | 1.5 | 400 | 보조 텍스트 |
| `text-xs` | 12px | 1.4 | 400 | 메타, 라벨 (최소 한계) |

> ⚠️ **10px 이하 금지** - 가독성 저하

### 2.3 무게

| 무게 | 용도 |
|------|------|
| 700 (bold) | 페이지 제목, 강조 숫자 |
| 600 (semibold) | 섹션 제목, 버튼 텍스트 |
| 500 (medium) | 라벨, 탭 |
| 400 (regular) | 본문, 설명 |

---

## 3. 간격 (Spacing)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `space-1` | 4px | 아이콘-텍스트 간격 |
| `space-2` | 8px | 관련 요소 간격 |
| `space-3` | 12px | 카드 내부 패딩 |
| `space-4` | 16px | 섹션 간격 |
| `space-5` | 20px | 컴포넌트 간격 |
| `space-6` | 24px | 페이지 마진 |
| `space-8` | 32px | 큰 섹션 구분 |

---

## 4. 모서리 (Border Radius)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `rounded-sm` | 4px | 작은 태그, 뱃지 |
| `rounded-md` | 8px | 버튼, 입력창 |
| `rounded-lg` | 12px | 작은 카드 |
| `rounded-xl` | 16px | **기본 카드** |
| `rounded-2xl` | 20px | 주요 카드, 모달 |
| `rounded-full` | 9999px | 아바타, 토글, 뱃지 |

---

## 5. 그림자 (Shadow)

| 레벨 | 용도 |
|------|------|
| `shadow-sm` | 기본 카드 (현재) |
| `shadow-md` | 활성 카드, 호버 |
| `shadow-lg` | 모달, 드롭다운 |

---

## 6. 컴포넌트 패턴

### 6.1 카드

```
배경: white
모서리: rounded-2xl
그림자: shadow-sm
패딩: p-4 (16px)
마진하단: mb-4 (16px)
```

### 6.2 버튼

```
기본: bg-brand-500 text-white rounded-xl px-4 py-2
보조: bg-brand-100 text-brand-700 rounded-xl px-4 py-2
텍스트: text-brand-600 hover:text-brand-700
```

### 6.3 입력창

```
보더: border border-gray-200
포커스: border-brand-400 ring-1 ring-brand-400
모서리: rounded-lg
```

---

## 7. 다크 모드

| 라이트 | 다크 |
|--------|------|
| bg-amber-50 | bg-gray-900 |
| bg-white | bg-gray-800 |
| text-gray-700 | text-gray-200 |
| text-gray-400 | text-gray-500 |
| border-gray-200 | border-gray-700 |

---

## 8. 변경 대상 컴포넌트

| 컴포넌트 | 변경 내용 |
|----------|-----------|
| `globals.css` | CSS 변수 전체 정의 |
| `layout.tsx` | 폰트 로드 (Pretendard) |
| `SleepCard.tsx` | indigo → amber/sleep 색상 |
| `InsightCard.tsx` | violet → amber, 카테고리 색상 |
| `MonthCalendar.tsx` | 보더/배경 통일 |
| `BottomNav.tsx` | 활성 색상 통일 |
| `WeekTabs.tsx` | 탭 색상 통일 |
| `DailyChat.tsx` | 버튼/카드 색상 |
