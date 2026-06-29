# 검증 환경 셋업 — Codex가 막혔던 항목 재검증용

> 구현자(Claude)가 **환경만** 구성. 검증·판정은 Codex가 수행한다.
> 대상 브랜치: `fix/r1-obsidian-single-source` (Claude가 지적 반영 커밋을 푸시함 — 최신 HEAD 기준).
> 배선: agent `SWARM56_DB_PATH` 기본값 = `personal-brand-hub/prisma/dev.db` = web이 읽는 DB(동일 파일). 토큰/키는 전부 `SWARM56_*` env.

## 0. 한 번에 환경 구성
```powershell
# homepage_project 루트에서
powershell -ExecutionPolicy Bypass -File verification\setup_verify.ps1
```
이 스크립트가: 클리퍼 실행(볼트+dev.db 데이터) → `prisma migrate deploy` → 테스트 admin 해시/세션키 생성 → `personal-brand-hub\.env` 작성.

---

## 1. 백오피스 런타임 UI (이전 NOT TESTED)
```powershell
cd personal-brand-hub
npm install
npm run dev        # next dev = NODE_ENV=development → http 쿠키 동작(secure off)
```
- 로그인: http://localhost:3000/admin/login  (비번 **verify1234**)
- 검증 포인트:
  - 로그인 성공/실패(틀린 비번), 비로그인 `/admin` 접근 차단(이중 가드)
  - 카드 **삭제(확인 모달)** → `/admin` **suppressed 목록**에 표시 → 홈피에서 사라짐
  - **복원** → 카드 재등장(볼트 md에서 재삽입)
  - **편집**(제목/발췌)
  - **SyncRun 로그**, **감사로그**(who/when/target: DELETE/RESTORE/EDIT)
  - "지금 클리핑"/"강제 갱신" 클릭 → 트리거 파일 기록(로컬은 `.local-data/triggers/`), 실패 시 에러 노출(성공 위장 안 함)
- 참고: 로컬 http에선 `/vault/...` 이미지가 404(프로덕션 Nginx alias가 서빙). **카드 src 경로 형식**(`/vault/<채널>/_assets/x.webp`)은 DOM에서 확인 가능.

## 2. 삭제 원자성/감사 원자성 (코드 재확인)
- 삭제·복원·편집의 DB 변경 + 감사로그가 **하나의 `prisma.$transaction`** 안에 있음: `lib/admin-repo.ts` `deleteCard`/`restoreCard`/`editCard`.

## 3. 토큰 필요 채널 (Notion·Swarm·Instagram) (이전 NOT TESTED)
```
1) verification\agent.env.example → verification\agent.env 복사
2) Peter가 준 토큰을 SWARM56_NOTION_TOKEN / SWARM56_FOURSQUARE_TOKEN / SWARM56_INSTAGRAM_TOKEN 에 기입
3) setup_verify.ps1 재실행 (agent.env 자동 로드) 또는 직접:
   $env:SWARM56_NOTION_TOKEN="..."; python -m agent.main
4) 볼트 raw/notion|swarm|instagram/*.md 와 dev.db 카드 확인
```
- Facebook은 v5 **빈 채널**(자동 수집 안 함) — `agent/main.py` CHANNELS에서 제외됨(LinkedIn도 동일).

## 4. 실제 LLM 발췌 (이전 NOT TESTED)
- `verification\agent.env` 에 `SWARM56_OPENAI_API_KEY`(또는 GEMINI/ANTHROPIC) 기입 후 클리퍼 재실행 → 볼트 md frontmatter `excerpt`가 truncation이 아닌 LLM 생성문인지 확인(`agent/excerpt.py`).

## 5. prisma migrate deploy (이전 FAIL — 환경 이슈로 추정)
- Codex 환경에서 `Schema engine error` + AppData ENOENT가 났던 항목. prisma 쿼리/스키마 엔진이 `%APPDATA%`/`%LOCALAPPDATA%` 캐시를 못 써서 발생하는 패턴.
- 재시도: `%APPDATA%`·`%LOCALAPPDATA%`가 쓰기 가능한 경로로 설정됐는지 확인 후, 비샌드박스 셸에서
  ```powershell
  cd personal-brand-hub
  $env:DATABASE_URL="file:./dev.db"
  npx prisma migrate deploy
  ```
- 마이그레이션 SQL 자체는 `prisma validate` PASS + 수동 적용 시 스키마 일치였음 → 엔진 실행 환경 문제로 보고 재현 바람.

## 6. systemd 트리거 실행 경로 (이전 BLOCKED — 유닛 부재)
- 트리거 소비자 유닛을 추가함: `deploy/swarm56-clip.path` + `swarm56-clip.service`, `deploy/swarm56-force.path` + `swarm56-force.service`.
- 즉, 백오피스가 `clip.now`/`force.now`를 기록하면 path-unit이 감지해 에이전트를 1회 실행(force는 `SWARM56_FORCE=1`)하고 트리거 파일을 제거(멱등). 라이브 systemd 동작은 서버 배포(§7) 시 검증.

## 7. 이미지 서빙 (이전 FAIL — /vault alias 부재)
- `deploy/swarm56-web.conf` 에 `/vault/` location(alias `…/vault/raw/`) 추가됨. 라이브 서빙은 §7에서 검증.
