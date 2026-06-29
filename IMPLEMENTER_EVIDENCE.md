# 구현자 증거 (IMPLEMENTER_EVIDENCE)

> 브랜치 `fix/r1-obsidian-single-source`. 검증자가 항목별 증거를 빠르게 찾도록 정리.
> 구현자(Claude)는 `[x]` 판정하지 않음 — 아래는 **자체시험(`[~]`) 근거**. 최종 `[x]`는 독립 IDE 검증자.
> 재현 명령: `VERIFICATION_REPRODUCE.md`.

## 커밋 (검증 대상)
- `7fd88e9` 설계+체크리스트
- `e6877e7` 에이전트 v5(스키마·클리퍼·이미지·파생·suppression)
- `05843f9` 발췌 LLM+fallback · Notion 본문
- `dea5dfd` 홈피 feed-repository v5
- `43316ea` 백오피스
- `21b7373` #10 강제갱신

## §1 클리퍼 (채널→볼트)
- 전문 md + frontmatter: `agent/vault.py:write_md` (FM_KEYS 전 필드)
- 본문 전체 이미지 → `_assets` + 링크 치환: `agent/images.py:process` / 단일 썸네일 `fetch_thumbnail`
- SSRF·referer·MIME·크기·디스크 임계: `agent/images.py:_download_one`, `_disk_ok`
- dedup(볼트 md 존재 스킵): `agent/main.py:clip_channel` (`existing_hash`)
- 발췌 LLM 다중+truncation fallback: `agent/excerpt.py:generate` (openai→gemini→anthropic→truncate)
- **증거**: 클립 실행 시 `[MD] 홈페이지를 만든 이유 - 설계 철학 (img 1)`, `AI는 왜 베이글... (img 3)` — 네이버 본문 이미지 실제 다운로드. `_assets/*.webp` 6개 생성 확인.

## §2 볼트→SQLite 파생 + suppression(방식 B)
- 파생: `agent/db.py:upsert_from_frontmatter`
- suppression 스킵: `agent/db.py:is_suppressed` (restoredAt IS NULL)
- **증거(테스트)**: `agent/tests/test_v5.py::test_suppression_roundtrip` →
  insert → 삭제(행제거+활성 suppression) → `is_suppressed=True` → 재파생=`suppressed`(카드 0) → 복원(restoredAt) → 재파생=`inserted`. **ALL PASS**.
- 라이브 검증(로컬 실DB)도 동일 결과 확인(github/helloworld url).

## §3 홈피
- SQLite 읽기만(status 제거): `personal-brand-hub/lib/feed-repository.ts:getItemsByChannel` (where 절 없음, thumbnail=thumbnailPath)
- 이미지 웹경로: `thumbnailPath = /vault/<채널>/_assets/...` (Nginx alias는 마이그레이션 §7)
- **증거**: `npm run build` ✓ 컴파일, 라우트 `/`.

## §4 백오피스 (+보안)
- 비번 해시(bcrypt)+세션(HMAC·HttpOnly·Secure·SameSite·12h)+rate limit: `lib/auth.ts`
- /admin 이중 가드: `app/admin/page.tsx`(서버컴포넌트 isAuthed) + `app/admin/actions.ts`(각 액션 guard)
- 삭제(확인)→suppression / 복원→재파생(원자적 $transaction) / 편집: `lib/admin-repo.ts`
- 삭제 키=originalUrl(안정), 재파생 전 suppression 조회=파생 시 `is_suppressed`, 복원=tombstone 해제+재삽입 한 트랜잭션
- 감사로그 who/when/target: `lib/admin-repo.ts:audit` (AdminAudit: actor·at·target)
- #9 지금클리핑 / #10 강제갱신 = 트리거 파일(web→python spawn 없음): `triggerClip`·`triggerForceReclip`; 에이전트 `agent/main.py:FORCE`
- **증거**: `npm run build` ✓, 라우트 `/admin`·`/admin/login`.

## §5 데이터 모델
- 스키마: `personal-brand-hub/prisma/schema.prisma` (FeedCard에 status/thumbnailKind/contentHash 없음, SuppressionRecord·AdminAudit 추가)
- 마이그레이션: `prisma/migrations/20260629120000_v5_obsidian_source_suppression/migration.sql`
- **증거**: dev.db PRAGMA — FeedCard cols에 status·thumbnailKind·contentHash 없음(37행 보존), SuppressionRecord/AdminAudit 생성.
- content_hash는 볼트 frontmatter에만(`vault.py`), SQLite엔 없음.

## §6 마이그레이션 (미실행 — §7, 승인 후)
- 계획: `INTEGRATED_PLAN_v5.md §14`. 라이브 미적용(로컬에서만 구현·검증).
- Nginx 이미지 alias(`/vault/`→볼트 raw/) = 마이그레이션 때.

## 한계/미검증 (정직)
- LLM 발췌는 키 없으면 truncation으로 동작 — 실제 LLM provider 호출은 키 주입 후 검증 필요.
- Notion 본문(blocks)·Swarm·IG 채널은 토큰 주입 후 라이브 검증 필요(코드는 작성됨).
- 백오피스 런타임(로그인·삭제·복원 UI)은 빌드만 확인 — `npm start` + 비번해시로 런타임 검증 필요.
- Nginx 이미지 서빙은 마이그레이션 후 검증.
