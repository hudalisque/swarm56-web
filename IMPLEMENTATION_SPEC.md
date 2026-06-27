# 실무 구현 명세서 v4 — Personal Brand Hub Rebaseline (옵시디언 단일소스)

> 작성: Opus (Claude Code) + Peter 확정 / 개정: v4 — 2026-06-27
> 기준 문서: `INTEGRATED_PLAN.md`, `DBMS_REVIEW.md`
> 상태: **실행 계획.** 문서 우선 → 코딩 착수는 Peter 명시 승인 후(Constitution §2).
> v4 정정: v1~v3의 "옵시디언 제거/SQLite 직접"은 무단 변경 → 폐기. **옵시디언 단일소스 + SQLite 카드 캐시 + CouchDB 유지**로 재작성.
> 기존 완료 이력(Phase 1A/1B/1C, 2.1~2.4) 보존. 행위자 표기: `Claude (Claude Code)`.

## 협업 R&R (멀티에이전트)
| 주체 | 회사 | 역할 |
|------|------|------|
| Peter + Claude | — / Anthropic | 공동 오케스트레이터 (Peter=결정, Claude=구동·문서화·게이트) |
| Simone (GPT 웹버전) | OpenAI | 기획 협업, Relume/v0.dev 프롬프트 협의 |
| Relume / v0.dev | Relume / Vercel | 와이어프레임 / 컴포넌트 시안 |
| Claude Code (Opus/Sonnet) | Anthropic | 시안→통합·클리퍼·DB·배포 |
| (참고) 헤라=Hermes · 투투=OpenClaw | Claude Code 인스턴스 | Peter의 다른 인스턴스 — 필요시 협업(Peter 통해), 이 빌드 담당과 별개 |

핸드오프 문서화: `pipeline/` + Google Drive `agent-shared/swarm56_pipeline`. 시안 없이 코드 진입 금지.

---

## 0. 의존 그래프
```
R0 기준선·채널 capability(비차단)
  → R1 서버 옵시디언 볼트 생성 + CouchDB 연동 확인
  → R2 SQLite 카드 캐시 스키마(FeedCard/SyncRun) + Post 폐기
  → R3 클리핑 vertical slice (네이버 이식: 채널→raw/ md + SQLite 카드)
  → R4 썸네일 서브시스템 (Python writer, SSRF)
  → R5 공개 홈피 UI (SQLite 카드 읽기, 8채널)
  → R6 나머지 채널 클리퍼 + upsert(content-hash) + SQLite 동시성(WAL)
  → R7 도메인·배포 (Nginx swarm56.com + LE cert + 앱 배포)
  → R8 최소 Admin + 수동 fallback
```
※ CouchDB decommission 항목 **삭제**(유지로 확정).

---

# R0 — 기준선 & 채널 Capability (비차단)
- 현재 상태 기록: VPS 1GB/40GB/Swap4GB, IP 54.116.19.34, CouchDB 3.5.2(sync.swarm56.com) 검증, **홈피 미배포**(apex가 CouchDB로 샘), DNS Cloudflare 수정 완료.
- 채널 8개 capability 기록(공식 API/계정 전제). **확인이 개발을 막지 않음**(가정 선구현, D-11/D-6).
- 기존 `Post`는 개발 seed → 폐기 예정(R2).
**Gate**: 결정 문서화, R2 backup plan 승인, 코드 변경 없음.

---

# R1 — 서버 옵시디언 볼트 생성 + CouchDB 연동
- swarm56 전용 볼트를 **서버에 직접 생성**, 구조 `raw/<채널>/` + `schema/` + `wiki/` (LLM-wiki 관례).
- CouchDB(기존 3.5.2)로 이 볼트를 Peter 기기 Obsidian과 LiveSync 연결 검증.
- 채널 폴더 생성: naver_blog/notion/youtube/github/linkedin/instagram/facebook/swarm.
**Gate**: 볼트 존재, CouchDB LiveSync로 Peter 기기 ↔ 서버 볼트 양방향 동기화 1회 검증, 기존 sync 서비스 무회귀.
**리스크**: CouchDB 설정 변경은 운영 서비스 영향 → 백업 후. credential 로그 금지.

---

# R2 — SQLite 카드 캐시 스키마 + Post 폐기
> **비가역**: migration 전 백업+승인.
- `web/prisma/schema.prisma`: `Post` 제거 → `FeedCard` + `SyncRun` (INTEGRATED_PLAN §5.2). Config 모델 없음.
- 핵심: `originalUrl @unique`, `@@unique([channel, externalId])`, `vaultPath`, `contentHash`, `excerpt`(전문 아님), 자동 hard delete 없음.
- 백업: `.backup`(WAL main file 단독 cp 금지) + sha256.
- repository/타입: `findActiveCardsByChannel(5)`, `upsertCard()`, `findCardByOriginalUrl()`, SyncRun.
- 기존 Post 기반 코드(page.tsx 포함) 정리, build 항상 통과.
**Gate**: migrate clean, 빈DB migrate deploy 성공, 공개쿼리 ACTIVE만, typecheck/lint/build, Critical/High 0, backup hash.

---

# R3 — 클리핑 Vertical Slice (네이버 이식)
> 목적: **채널 → 옵시디언 raw/ 전문 md + SQLite 카드** 최소 경로를 실제로 증명.
- `agent/` 골격(one-shot): 실행→수집→normalize→(md+카드)upsert→SyncRun→exit. watchdog/무한loop/web spawn 금지.
- 네이버 클리퍼 이식: 원본 `naverblog_clipper.py` **수정·이동 금지**, 로직 복사·재작성. 출력 목적지를 **볼트 `raw/naver_blog/`** 로, 동시에 **SQLite FeedCard** 기록.
- `NormalizedRecord{channel,title,original_url,published_at,external_id,excerpt,thumbnail_remote_url,full_markdown,content_hash}`.
- Publisher: originalUrl 1차 + (channel,externalId) 보조 dedup. **신규 추가 / content_hash 변경 시 재클립(md+카드 갱신)**. 자동삭제 없음.
**Gate**: 실제 네이버 글 → raw/naver_blog/ 전문 md + SQLite 카드 생성, 재실행 중복 0, 수정본 재반영 동작, SyncRun SUCCESS(허위 금지 §7).

---

# R4 — 썸네일 서브시스템 (Python writer)
- 저장: `/var/lib/swarm56/web/thumbnails/<채널>/<hash>.<ext>`, 개발 `.local-data/thumbnails/`. `web/public/thumbnails` 금지.
- Python ThumbnailStore: `save_from_url()`, `delete_if_orphan()`.
- **보안**: connect/read timeout, redirect 제한, ≤2MB, MIME allowlist(jpeg/png/webp), SVG 금지, magic byte 검증, **SSRF 차단(사설IP·localhost redirect 거부)**, atomic rename, hash 파일명, traversal 차단, 실패→DEFAULT.
- Next.js read helper: `/thumbnails/` prefix 검증, 아니면 채널 default. 쓰기 없음.
- Nginx: `location /thumbnails/ { alias ...; add_header X-Content-Type-Options nosniff; expires 7d; }`(적용 R7).
- 기본 이미지: `web/public/channel-defaults/<채널>.png` (8개).
**Gate**: 정상 캐시 / invalid 차단 / atomic / default fallback / Next.js read-only / 외부 데이터 디렉토리 유실 방지.

---

# R5 — 공개 홈피 UI (8채널)
- `page.tsx`: Server Component, `findActiveCardsByChannel(5)` (SQLite 카드 캐시 읽기). 옵시디언 직접 안 읽음.
- 컴포넌트: `social-hub-grid / channel-filter / channel-tile / feed-card / empty-channel`.
- All + 8채널 필터, 모바일1/태블릿2/데스크톱3열, 채널당 5개, 빈 채널 placeholder.
- 카드: 썸네일/제목/발췌/게시일, 전체 클릭 → originalUrl `target=_blank rel=noopener`.
- GNB: GitHub/LinkedIn/NaverBlog 아이콘 + 768px 햄버거. Pretendard 교체. globals.css 토큰.
- 보안: `dangerouslySetInnerHTML` 금지, 발췌 plain text, 썸네일 local/default만.
**Gate**: 8타일·채널당≤5·빈채널·원문링크, INACTIVE/DELETED 미노출, 320px 가로스크롤 없음, build/standalone, Critical/High 0.

---

# R6 — 나머지 채널 클리퍼 + 업서트 + SQLite 동시성
- 8채널 클리퍼(네이버 외 7) — **네이버 패턴 동일**, 채널별 "목록수집+전문추출"만 교체:
  - 노션: Notion API(MCP) → 페이지 본문
  - 유튜브: Data API/RSS → 제목+설명(+자막 옵션)
  - 깃헙: REST + `channel_policy.json` event allowlist → 커밋/릴리스/레포(정의)
  - LinkedIn/IG/FB/Swarm: 공식 API **가정 선구현**, 불가시 수동 fallback
- 공통 **upsert(content-hash)**: 신규 추가 / 원본 변경 재클립(md+카드). SKIP-only 금지(수정 누락 방지).
- LLM(선택): 카드 발췌 생성이 필요하면 GPT-4o-mini, 키는 `/etc/swarm56/agent.env`. 신규/변경분만 호출, retry≤3.
- systemd timer one-shot(기본 1일1회) + 수동 트리거. web→python spawn 금지.
- **SQLite 동시성**: `PRAGMA journal_mode=WAL` 검증(결과 `wal`), Python `busy_timeout=5000` 검증, Prisma도 실제 connection에서 `busy_timeout` 적용 검증(안되면 admin write serial queue).
- **동시 write 통합 테스트**: 클리퍼(Python)↔홈피/어드민(Prisma) Test A/B/C 각 10회. Gate: 우발 `database is locked` 0, timeout은 의도적 실패, 중복/부분commit 없음, integrity_check 통과.
**Gate**: 8채널 클리핑, idempotent, 신규0→LLM0, 재클립 반영, WAL/timeout 증거, 동시write 통과, backup/restore, 1GB resource budget.

---

# R7 — 도메인·배포
- Linux build: `npm ci → prisma generate → typecheck → lint → build`. Windows 산출물 배포 금지.
- Release: `/opt/swarm56/web/releases/<id>/`, `current`; 데이터 `/var/lib/swarm56/web/{site.db,thumbnails/}`; secret `/etc/swarm56/{web.env,agent.env}`; 볼트 서버 경로.
- Migrator 분리, 운영 `prisma migrate deploy`.
- **Nginx**: `swarm56.com`(+www) server block 신규 → `127.0.0.1:3000` 프록시. `/thumbnails/` 정적. sync.swarm56.com 유지. `nginx -t`.
- **Let's Encrypt 인증서 `swarm56.com`(+www) 발급** (현재 sync 전용 cert만 존재 → apex 미커버).
- 배포 순서: snapshot/backup → DB+thumbnail backup → checksum → migration → symlink swap → restart → cert 발급 → local health → external HTTPS → Social Hub smoke → 클리퍼 one-shot → rollback test.
**Gate**: `https://swarm56.com` 200 + 홈피 응답(CouchDB 아님), 인증서 swarm56.com 커버, Health ok, 외부 3000/5984 차단, thumbnail 200, rollback 성공, sync/CouchDB 무회귀.
**리스크**: Nginx 기본 server block이 CouchDB로 새는 현상 → swarm56.com server block 명시로 차단. cert 미발급 시 SSL 오류.

---

# R8 — 최소 Admin + 수동 Fallback
- 포함: 로그인/logout, 카드 ACTIVE/INACTIVE/DELETED 토글, 발췌/제목 편집, 수동 카드 등록(자동불가 채널), SyncRun 조회.
- 제외: API Key 관리, 다중 사용자, web→python spawn, 자동 hard delete.
- Next.js 16: `src/proxy.ts`(middleware.ts 신규 금지) + 모든 Server Action `verifySession()`.
- Session: HttpOnly/Secure/SameSite=Lax, `SESSION_SECRET`, 로그인 rate limit.
- 수동 등록: scheme allowlist https, 중복 검사, 썸네일은 Python 다운로더 경유, ingest=MANUAL.
- 카드 노출제어 vs 옵시디언 frontmatter `publish` — **결정 포인트**(권장: 어드민 status).
**Gate**: 인증 우회 테스트, proxy+Action 이중 검증, soft delete/restore, 공개 즉시 반영, secret 미노출, Critical/High 0.

---

# 비가역 작업 (실행 전 백업+해시+승인+보고)
1. R2 `Post` drop migration
2. R7 운영 DB migration / Nginx·cert 변경
※ rolling hard delete 없음. CouchDB decommission 없음(유지).

# 완료 보고 공통 양식
실행시각 / 승인 Gate / 변경 파일 / 실행 명령 / 검증 결과 / 보안 검사 / backup·hash / rollback / 리소스 / 미해결 / 다음 Gate
