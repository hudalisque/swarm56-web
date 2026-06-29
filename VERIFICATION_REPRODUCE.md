# 검증 재현 가이드 (독립 IDE 검증자용)

> 대상 브랜치: `fix/r1-obsidian-single-source` · 설계: `INTEGRATED_PLAN_v5.md` · 체크리스트: `VERIFICATION_CHECKLIST.md`
> 목적: 검증자가 **직접 실행해** 구현이 설계대로인지 확인. 증거 없는 `[x]` 불인정.

## 0. 준비
```bash
git clone <repo> && cd homepage_project
git checkout fix/r1-obsidian-single-source
# 검증 대상 commit SHA 확인/고정
git log --oneline -8
```

## 1. 에이전트 자동 테스트 (네트워크 불필요)
```bash
python -m agent.tests.test_v5
```
**기대**: `ALL PASS` (suppression 라운드트립·thumbnailPath·볼트 라운드트립·발췌 truncation·이미지 정규식).
→ 체크리스트 §2(삭제/재파생/복원, 방식 B), §5(thumbnailPath).

## 2. 스키마/마이그레이션 (로컬)
```bash
cd personal-brand-hub
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script
# 빈 출력(=no diff)이면 스키마와 마이그레이션 일치
python - <<'PY'
import sqlite3; c=sqlite3.connect("prisma/dev.db")
print(sorted(r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_prisma%' AND name NOT LIKE 'sqlite_%'")))
print([r[1] for r in c.execute("PRAGMA table_info(FeedCard)")])
PY
```
**기대**: tables = AdminAudit·FeedCard·SuppressionRecord·SyncRun. FeedCard에 `status`·`thumbnailKind`·`contentHash` 없음.
→ 체크리스트 §5.

## 3. 클리퍼 → 볼트 → SQLite (토큰 없이: 네이버·GitHub·YouTube)
```bash
cd ..
export PYTHONIOENCODING=utf-8
export SWARM56_VAULT_DIR=$PWD/.local-data/vault_verify
python -m agent.main
# 볼트 md frontmatter + 본문 이미지(_assets)
ls .local-data/vault_verify/raw/*/_assets/*.webp | head
head -14 "$(ls .local-data/vault_verify/raw/naver_blog/*.md | head -1)"
```
**기대**: `[MD] ... (img N)` 로 본문 이미지 다운로드, `[VAULT→DB] ... inserted/updated`. md frontmatter에 title·channel·url·content_hash·excerpt·thumbnail. `_assets/*.webp` 존재.
→ 체크리스트 §1, §2.

## 4. 홈피 + 백오피스 빌드/라우트
```bash
cd personal-brand-hub && npm install && npx prisma generate && npm run build
```
**기대**: `✓ Compiled successfully`, 라우트 `/`·`/admin`·`/admin/login`.
→ 체크리스트 §3, §4.

## 5. 백오피스 인증/삭제/복원 (런타임)
```bash
# 비번 해시 생성
node -e "console.log(require('bcryptjs').hashSync('테스트비번',10))"
# .env 에 ADMIN_PASSWORD_HASH, SESSION_SECRET, SWARM56_VAULT_DIR, DATABASE_URL 설정 후
npm start
# 브라우저: /admin/login 로그인 → /admin 에서 삭제(확인)→suppressed 목록→복원 동작,
# 감사로그 who/when/target 기록 확인
```
→ 체크리스트 §4(인증·삭제·복원·감사로그).

## 증거 형식
각 항목은 다음 중 하나 이상 첨부: 코드 파일·줄번호 / 테스트 이름 / 실행 명령 / exit code / HTTP 응답 / SQLite query / 파일 hash / 로그 경로.
구현자 자체 증거는 `IMPLEMENTER_EVIDENCE.md` 참조.
