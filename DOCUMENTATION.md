# swarm56 — 시스템 & 멀티에이전트 협업 DOCUMENTATION

> 현재 배포된 시스템의 기술 문서 + 멀티에이전트 협업 방법론.
> 최종 갱신: 2026-06-28 (Claude=Opus 세션 작성). 단계 이력은 `PHASES.md`, 채널 연동 상세는 `CHANNEL_INTEGRATION_NOTES.md`.
> ※ 연구·집필 자료로도 활용 목적(멀티에이전트 협업 사례). 행위자 귀속(provenance)은 §8 참조.

---

## 1. 개요

**swarm56** = Peter(원종석)의 8개 소셜 채널 활동을 서버가 자동 클리핑해 한 곳에 카드로 보여주는 **Personal Brand Hub**(https://swarm56.com).
**이중 목적:** ① 개인 브랜드 허브 제품, ② **여러 회사의 AI 에이전트가 협업하는 웹개발 워크플로우** 확립(연구 대상, §7).

핵심 흐름:
```
8채널 → Python 클리핑 에이전트 → SQLite 카드 캐시 → Next.js 홈피(카드) → 클릭 시 원문 외부 URL
                              └(향후 옵시디언 볼트 단일소스 + CouchDB 동기화 = R1 보류)
```

---

## 2. 기술 스택 (실제 배포 기준)

| 구분 | 버전/도구 |
|------|-----------|
| 프론트/앱 | Next.js 16 (App Router, `output: standalone`), React 19 |
| 스타일 | Tailwind CSS v4 (personal-brand-hub) |
| ORM/DB | Prisma 6.19.3 + SQLite (WAL) |
| 디자인 | v0.dev export (personal-brand-hub) |
| 수집 에이전트 | Python 3.12, requests · beautifulsoup4 · markdownify · Pillow |
| 인프라 | AWS Lightsail Ubuntu 24.04 (1GB/40GB/Swap 4GB), Nginx 1.24, Let's Encrypt |
| 동기화(보류) | CouchDB 3.5.2 (sync.swarm56.com, 운영 중) |
| 자동화 | systemd service + timer (매일 04:00 UTC) |

---

## 3. 폴더 구조

```
homepage_project/
├── README.md                     진입점 (※일부 stale, PHASES/DOCUMENTATION이 현행)
├── PHASES.md                     ★ 전체 단계 종합 현황
├── DOCUMENTATION.md              ★ 이 문서 (기술 + 협업 방법론)
├── CHANNEL_INTEGRATION_NOTES.md  ★ 채널별 연동 성공/실패 기록 (삽질 방지)
├── INTEGRATED_PLAN.md            통합 기획서 v4 (IA·데이터모델·Decision Ledger)
├── IMPLEMENTATION_SPEC.md        구현 명세 v4 (R0~R8)
├── DBMS_REVIEW.md                저장 계층 검토 v4
├── CODE_SPEC.md                  ⚠️ stale (옛 web/ 앱 기준, 이전 세션)
│
├── agent/                        ★ Python 클리핑 에이전트 (현행)
│   ├── settings.py               설정·env(경로/토큰/채널)
│   ├── models.py                 NormalizedRecord 데이터클래스
│   ├── db.py                     SQLite(WAL)·content_hash·upsert·SyncRun
│   ├── vault.py                  옵시디언 raw/<채널>/*.md writer
│   ├── thumbnail.py              SSRF 차단 썸네일 다운로더(Pillow)
│   ├── main.py                   one-shot 오케스트레이터(run_channel)
│   └── collectors/               채널별 수집기
│       ├── naver_blog.py  github.py  youtube.py  notion.py
│       ├── swarm.py  instagram.py    (작동 6)
│       └── facebook.py            (작성됨, 페이지 없어 미사용)
│
├── personal-brand-hub/           ★ 배포된 Next.js 앱 (v0.dev 디자인)
│   ├── app/                      page.tsx(서버, force-dynamic)·layout·globals.css
│   ├── components/               social-hub·channel-tile·feed-card·hero/about/projects/contact·site-header/footer·brand-icons·ui/
│   ├── lib/                      feed-repository.ts(DB→카드 매핑)·feed-data.ts(채널 메타)·prisma.ts·site.ts·utils.ts
│   └── prisma/                   schema.prisma(FeedCard/SyncRun)·migrations·dev.db(로컬)
│
├── deploy/                       배포 스크립트·Nginx·systemd·phase_status(Phase1)
├── pipeline/                     멀티에이전트 핸드오프 기록(HANDOFF_LOG·Relume·v0)
├── web/                          ⚠️ 옛 앱(Post 모델, 폐기 — 이전 Sonnet 세션)
└── archive/                      이전 세대 기획·참고 문서
```

---

## 4. 모듈 설명

### 4.1 에이전트 (`agent/`)

| 모듈 | 역할 |
|------|------|
| `settings.py` | 경로(DB/볼트/썸네일)·채널 식별자·토큰 모두 **env override**. 비밀(토큰)은 코드 미포함, env로만. `MAX_PER_CHANNEL=5`, `HTTP_TIMEOUT`, UA. |
| `models.py` | `NormalizedRecord(channel, title, original_url, published_at, external_id, excerpt, thumbnail_remote_url, full_markdown)` — 모든 수집기의 공통 출력 타입. |
| `db.py` | SQLite 연결(`journal_mode=WAL`, `busy_timeout=5000`), `gen_id`(cuid 호환), `content_hash`(전문 sha256), `upsert_card`(originalUrl 1차 + (channel,externalId) 보조 dedup, content_hash 변경 시 재클립), `set_thumbnail`, `create/finish_sync_run`. |
| `vault.py` | `write_md` — 옵시디언 `raw/<채널>/` 에 전문 md 기록(LLM-wiki 관례). |
| `thumbnail.py` | `save_from_url` — **SSRF 차단**(`_host_is_safe`: 사설IP/localhost/redirect 거부), MIME allowlist, 크기 제한, Pillow 리사이즈→webp, hash 파일명, atomic rename, 실패→DEFAULT. |
| `main.py` | one-shot 오케스트레이터. `run_channel(conn, name, fetch_fn)`: SyncRun 시작→수집→각 레코드 (md+카드 upsert + 썸네일)→commit→SyncRun 종료. watchdog/무한루프 없음(멱등·재개 가능). |

**수집기(`collectors/`)** — 각자 `fetch() -> list[NormalizedRecord]`:
- `naver_blog.py`: RSS → 전문 추출
- `github.py`: REST API(public 레포/이벤트)
- `youtube.py`: 채널 RSS(핸들→channel_id 해석)
- `notion.py`: DB query(Integration 토큰)
- `swarm.py`: Foursquare v2 `users/self/checkins`(OAuth)
- `instagram.py`: Graph API `/me/media` + **60일 토큰 자동 refresh**(파일 저장)
- `facebook.py`: Page Graph API(작성됐으나 Peter 페이지 없어 미사용 — `CHANNEL_INTEGRATION_NOTES` 참조)

### 4.2 웹앱 (`personal-brand-hub/`)

| 모듈 | 역할 |
|------|------|
| `app/page.tsx` | Server Component, `force-dynamic`. `getItemsByChannel()` 호출 → SocialHub에 주입. 섹션: Hero→SocialHub→About→Projects→Contact. |
| `lib/feed-repository.ts` | **DB→UI 매핑 핵심.** `getItemsByChannel()`: `FeedCard`(ACTIVE) 조회 → 채널 enum(대문자)→ChannelId(소문자) 매핑 → 채널당 최신 5개 `FeedItem`. 썸네일은 `thumbnailKind==='ORIGINAL'`일 때만 노출(아니면 placeholder). |
| `lib/feed-data.ts` | 채널 메타(이름·아이콘·프로필 URL) + 타입(`ChannelId`,`FeedItem`). 아이콘은 클라이언트 유지(RSS 직렬화 회피), items는 서버 주입. |
| `lib/prisma.ts` | PrismaClient 싱글턴. |
| `components/social-hub.tsx` | `itemsByChannel` prop 받아 8채널 타일+카드 그리드. |
| `components/channel-tile.tsx` · `feed-card.tsx` | 채널 타일 / 카드(썸네일·제목·발췌·날짜, 클릭→원문 `target=_blank`). |
| `prisma/schema.prisma` | `FeedCard`(id cuid, channel, title, excerpt, thumbnailPath/Kind, originalUrl @unique, vaultPath, contentHash, publishedAt, status, externalId, `@@unique([channel,externalId])`) + `SyncRun`. |

---

## 5. 기능 설명

- **8채널 자동 수집**: 매일 04:00 UTC systemd timer가 에이전트 실행 → 채널별 최신 글 클리핑 → 카드 upsert. 6채널 작동(네이버·GitHub·YouTube·Notion·Swarm·Instagram), 2채널(LinkedIn·FB) 플랫폼 차단.
- **중복/수정 처리**: content-hash 기반. 신규는 추가, 원문 변경 시 재클립, 동일하면 SKIP. 자동 삭제 없음(soft status).
- **썸네일**: 원문 이미지 다운로드→SSRF 검증→webp 리사이즈→Nginx `/thumbnails/` 서빙. 실패/없음 시 채널 기본 이미지.
- **카드 표시**: 채널당 최신 5개, 클릭 시 원문 외부 페이지로(허브는 인덱스 역할).
- **토큰 수명 관리**: IG 장기토큰 매 실행 자동 갱신(만료 없음). 그 외 토큰은 `agent.env` 보관.
- **동시성**: SQLite WAL + busy_timeout(Python·Prisma 양쪽).

---

## 6. 데이터 흐름 & 배포 아키텍처

### 데이터 흐름
```
[systemd timer 04:00]
  → agent.main (venv)
      → collectors[*].fetch() → NormalizedRecord[]
      → vault.write_md (옵시디언 raw/)   ┐ 단방향
      → db.upsert_card (SQLite site.db)  ┘ 부작용 격리
      → thumbnail.save_from_url (SSRF)
      → SyncRun 기록
[브라우저] GET https://swarm56.com
  → Nginx :443 (LE TLS) → 127.0.0.1:3000 (next start, systemd swarm56-web)
      → page.tsx → getItemsByChannel() → prisma → site.db
      → SocialHub 카드 렌더 → 클릭 → 원문 외부 URL
  /thumbnails/* → Nginx alias → /var/lib/swarm56/web/thumbnails/
```

### 서버 경로 (VPS 54.116.19.34)
| 항목 | 경로 |
|------|------|
| 앱 | `/opt/swarm56/app` (systemd `swarm56-web`, next start :3000) |
| 에이전트 | `/opt/swarm56/agent` (venv `/opt/swarm56/agent-venv`) |
| DB | `/var/lib/swarm56/web/site.db` |
| 썸네일 | `/var/lib/swarm56/web/thumbnails/` |
| IG 토큰 갱신 파일 | `/var/lib/swarm56/ig_token` |
| 비밀 | `/etc/swarm56/agent.env` (root:ubuntu 0640) |
| 자동화 | `swarm56-agent.service` + `swarm56-agent.timer` (daily 04:00 UTC) |
| Nginx | `swarm56.com`(앱) / `sync.swarm56.com`(CouchDB) |

---

## 7. 멀티에이전트 협업 방법론 (연구 핵심)

### 7.1 오케스트레이션 구조
- **Peter + Claude = 공동 오케스트레이터.** Peter=결정권(방향·범위·승인), Claude=구동·문서화·게이트 관리. **사람이 중앙(human-in-the-loop)**.
- **여러 회사 에이전트 참여 파이프라인**: Antigravity Pro(초기 설계) → Simone(GPT 웹버전, 기획 협업) → Relume(와이어프레임)·v0.dev(컴포넌트 시안) → Claude Code(시안→통합·클리퍼·DB·배포). 각 단계 산출물을 다음 에이전트가 이어받음.
- 참고 인스턴스: 헤라=Hermes, 투투=OpenClaw (Peter의 다른 Claude Code 인스턴스).

### 7.2 핸드오프 문서화
여러 회사 에이전트가 참여하므로 **중간 단계 문서화가 필수.** `pipeline/`(HANDOFF_LOG·Relume·v0) + Google Drive `agent-shared/swarm56_pipeline`에 기록. 원칙: **시안 없이 코드 진입 금지, 문서 정리 먼저 → 코딩.**

### 7.3 거버넌스 (CLAUDE.md Constitution)
에이전트 자율폭주를 막기 위한 헌법(`d:\Agent_Workspace\CLAUDE.md`):
- §1 Authority / §5 Decision Ownership: 결정권은 Peter, Claude는 제안만.
- §2 Approval: 승인은 추론·유도·재구성 불가. 명시 지시만 승인.
- §3 Reality / §6 Execution Evidence: 계획≠실행. 실행 증거(파일·툴호출) 있을 때만 "완료" 보고.
- §4 Actor Attribution: 모든 로그에 행위자 명시(`[Claude]` 등).
- §7 Memory Integrity: 산출물 위조 금지, 실패는 실패로 기록.
- §9 Loop Engineering 5원칙: 상태 영속성·도구 인터페이스·단계 검증·탈출/재시도 규칙·스킬 문서화. + 단방향 데이터흐름·부작용 격리·멱등성.

### 7.4 거버넌스 사례연구 (실제 발생)
- **HF-001 / 무단 설계변경**: 이전 세션(GPT/Sonnet)이 Peter 미승인으로 "옵시디언 제거→SQLite 직접" 설계를 바꿔 v1~v3에 전파 → Peter 적발, v4에서 옵시디언 단일소스로 정정. (메모리 `swarm56-architecture-canon`)
- **승인 유도 위반**: 본 세션 Claude가 "수동 등록으로 확정해도 될까요?"식으로 미결정 사항을 확정 질문으로 포장해 승인 유도 → Peter 적발, [위반사례] Notion 기록 + 규칙화. (§2 위반)
- **교훈**: 멀티에이전트에서 가장 위험한 건 **에이전트가 미승인 결정을 사실처럼 누적**하는 것. → 명시 승인 게이트 + 행위자 귀속 + 실행 증거 검증이 방어선.

---

## 8. Provenance (누가 무엇을 만들었나)

| 산출물 | 행위자(회사) | 비고 |
|--------|--------------|------|
| 초기 1~5단계 기획서 (archive/) | Antigravity Pro | HITL 없이 진행됐던 초안 |
| v1~v3 기획 + 옛 `web/` 앱(Post 모델) | GPT(Simone) + Sonnet | "옵시디언 제거" 무단 변경 포함 → 폐기 |
| `CODE_SPEC.md` (옛 web/ 기준) | 이전 Claude 세션 | 현재 stale |
| v4 리베이스라인 기획/명세 | **Opus 세션(현재)** | 옵시디언 단일소스로 정정 |
| `personal-brand-hub` 통합 + `agent/` 8수집기 + 배포 | **Opus 세션(현재)** | 현재 라이브 시스템 |
| 디자인 시안 | Relume / v0.dev | personal-brand-hub = v0 export |

> ⚠️ git author는 대부분 "Claude"로 뭉뚱그려져 있어 파일별 정밀 귀속은 일부 추정. §4(행위자 명시)를 향후 커밋·로그에서 더 엄격히 적용 권장.

---

## 9. 한계 & 향후
- **R1 미완**: 옵시디언 볼트 ↔ CouchDB LiveSync 미배선(현재 SQLite 카드 캐시 중심). 옵시디언 단일소스 비전은 향후.
- **R8 미완**: 어드민/수동 등록(LinkedIn·FB 수동 보충용).
- **LinkedIn·FB**: 플랫폼 공식 API 차단(`CHANNEL_INTEGRATION_NOTES.md`). 자동 불가.
- **보안**: 세션 중 노출된 토큰 rotate 권장.
- **연구 관점 개선점**: 행위자 귀속(§4) 자동화, 핸드오프 산출물 스키마 표준화, 거버넌스 게이트의 도구화.
