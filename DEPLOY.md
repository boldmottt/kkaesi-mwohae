# 깨시뭐해 — 배포 가이드

## 환경변수 설정

Vercel 대시보드 → Settings → Environment Variables에 다음 3가지를 추가하세요:

| 이름 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public 키 |
| `ANTHROPIC_API_KEY` | Anthropic API 키 |

## Supabase 설정

1. Supabase 대시보드 → SQL Editor에서 `supabase/migrations/001_initial_schema.sql` 실행
2. Authentication → URL Configuration:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs에 추가: `https://your-app.vercel.app/auth/callback`

## 배포

```bash
npx vercel
```

또는 GitHub 저장소를 Vercel에 연결하면 자동 배포됩니다.
