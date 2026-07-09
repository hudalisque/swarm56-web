# swarm56 — 시스템 & 멀티에이전트 협업 DOCUMENTATION v2

> v2 · 2026-07-09 · 이전 버전: [DOCUMENTATION.md](DOCUMENTATION.md) (보존 — 2026-06-28, v5 이전 시스템 기준)
> 변경 사유: ① **v5 라이브 반영**(원본이 v5 이전 site.db·status/thumbnailKind 기준으로 낡아 있었음) ② **백오피스 프로젝트 카드 추가 기능**(2026-07-09, 아키텍처 3건 변경) ③ 온디맨드 트리거 유닛 설치(2026-07-03).
> 작성: Claude (Claude Code). 단계 이력 `PHASES_v2.md`, 채널 연동 `CHANNEL_INTEGRATION_NOTES.md`, 정본 기획 `INTEGRATED_PLAN_v6.md`.
> ※ 연구·집필 자료로도 활용 목적(멀티에이전트 협업 사례). 행위자 귀속(provenance)은 §8 참조.

---

## 1. 개요

**swarm56** = Peter(원종석)의 8개 소셜 채널 활동을 서버가 자동 클리핑해 한 곳에 카드로 보여주는 **Personal Brand Hub**(https://swarm56.com).
**이중 목적:** ① 개인 브랜드 허브 제품, ② **여러 회사의 AI 에이전트가 협업하는 웹개발 워크플로우** 확립(연구 대상, §7).

핵심 흐름 (v5 — 옵시디언 볼트 단일소스, 라이브):
```
8채널 → Python 클리핑 에이전트 ─ Phase A → 옵시디언 볼트(raw/ 전문 md + 이미지) ← 메인 DB·단일소스
                                  Phase B → SQLite 파생캐시(site-v5.db · FeedCard)
                                              → Next.js 홈피(피드 카드) → 클릭 시 원문 외부 URL
백오피스(/admin) → 피드 삭제·복원·편집 / 수동 클리핑 트리거(systemd .path)
               → 프로젝트 카드 추가(v2): ProjectCard + HTML(/docs)·MD(볼트 project/)
```

---

## 2. 기술 스택 (실제 배포 기준)

| 구분 | 버전/도구 |
|------|-----------|
| 프론트/앱 | Next.js 16 (App Router), React 19 |
| 스타일 | Tailwind CSS v4 (personal-brand-hub) |
| ORM/DB | Prisma 6.19.3 + SQLite (WAL) |
| 디자인 | v0.dev export (personal-brand-hub) |
| 수집 에이전트 | Python 3.12, requests · beautifulsoup4 · markdownify · Pillow |
| 인프라 | AWS Lightsail Ubuntu 24.04 (1GB/40GB/Swap 4GB), Nginx 1.24, Let's Encrypt |
| 동기화(잔재) | CouchDB 3.5.2 (sync.swarm56.com — v5 아키텍처에선 제거, 서비스는 유지 중. `KNOWN_ISSUES_v2.md`) |
| 자동화 | systemd `swarm56-agent.timer`(매일 04:00 UTC) + `swarm56-clip/force.{path,service}`(온디맨드, 2026-07-03 설치) |

---

## 3. 폴더 구조

```
homepage_project/
├── README.md                     진입점 (KNOWN_ISSUES 앵커)
├── PHASES_v2.md                  ★ 전체 단계 종합 현황 (v1=PHASES.md 보존)
├── DOCUMENTATION_v2.md           ★ 이 문서 (기술 + 협업 방법론)
├── CHANNEL_INTEGRATION_NOTES.md  ★ 채널별 연동 성공/실패 기록 (삽질 방지)
├── INTEGRATED_PLAN_v6.md         ★ 정본 기획서 (v5·v4 보존)
├── PROJECT_OVERVIEW_v2.md/.html  프로젝트 개요 (대외용 소스)
├── BACKOFFICE_FEATURE_CONTEXT_v2.md  백오피스 카드 추가 기능 상세·런북
├── KNOWN_ISSUES_v2.md            ★ 잠재 이슈·드리프트 (문제 시 참조)
├── VERIFICATION_CHECKLIST_v2.md  검증 체크리스트
├── DBMS_REVIEW_v2.md             저장 계층 검토
├── verification/                 검증 산출물·회고(PROCESS_RETROSPECTIVE.md)
│
├── agent/                        ★ Python 클리핑 에이전트 (v5 현행)
│   ├── settings.py               설정·env(경로/토큰/채널)
│   ├── models.py                 NormalizedRecord 데이터클래스
│   ├── db.py                     SQLite(WAL)·파생·suppression·SyncRun
│   ├── vault.py                  옵시디언 raw/<채널>/*.md writer (frontmatter+전문)
│   ├── images.py                 본문 이미지 다운로드(SSRF 차단)→webp→_assets/<해시>
│   ├── excerpt.py                LLM 다중 provider 발췌 → truncation fallback
│   ├── thumbnail.py              (구) 썸네일 다운로더
│   ├── slack_notify.py           슬랙 알림(보조)
│   ├── main.py                   Phase A/B 오케스트레이터 (SWARM56_FORCE=1 강제 재클립)
│   ├── tests/                    v5 자동 테스트
│   └── collectors/               채널별 수집기
│       ├── naver_blog.py  github.py  youtube.py  notion.py
│       ├── swarm.py  instagram.py    (작동 6)
│       └── facebook.py            (작성됨, 페이지 없어 미사용)
│
├── personal-brand-hub/           ★ 배포된 Next.js 앱 (v0.dev 디자인)
│   ├── app/                      page.tsx(서버, force-dynamic)·layout·globals.css
│   │   └── admin/                백오피스: page.tsx·actions.ts·edit-card.tsx·login/
│   ├── components/               social-hub·channel-tile·feed-card·hero/about/contact·site-header/footer·brand-icons·ui/
│   │                             projects-section.tsx = ProjectCard DB 렌더링 (v2)
│   ├── lib/                      admin-repo.ts(백오피스 전 기능)·auth.ts·feed-repository.ts·
│   │                             md-frontmatter.ts·feed-data.ts·prisma.ts·site.ts·utils.ts
│   ├── prisma/                   schema.prisma(FeedCard·ProjectCard·SuppressionRecord·AdminAudit·SyncRun)
│   │                             + migrations(3개: init/v5/project_card)·dev.db(로컬)
│   └── public/docs/              기존 프로젝트 문서 HTML 3장 (라이브 서빙은 nginx /docs/ alias로 이관)
│
├── deploy/                       Nginx conf·systemd 유닛(web/agent/clip/force)·phase_status
├── pipeline/                     멀티에이전트 핸드오프 기록(HANDOFF_LOG·Relume·v0)
├── web/                          ⚠️ 옛 앱(Post 모델, 폐기 — 이전 Sonnet 세션)
└── archive/                      이전 세대 기획·참고 문서 (시점 기록, 불변)
```

---

## 4. 모듈 설명

### 4.1 에이전트 (`agent/`)

| 모듈 | 역할 |
|------|------|
| `settings.py` | 경로(DB/볼트)·채널 식별자·토큰 모두 **env override**. 비밀(토큰)은 코드 미포함, env로만. |
| `models.py` | `NormalizedRecord` — 모든 수집기의 공통 출력 타입. |
| `db.py` | SQLite 연결(WAL), 볼트 frontmatter→FeedCard 파생, **활성 suppression URL 스킵**, SyncRun 기록. |
| `vault.py` | 옵시디언 `raw/<채널>/`에 전문 md 기록(frontmatter: title·channel·url·published·content_hash·excerpt·thumbnail 등). |
| `images.py` | 본문 전체 이미지 다운로드 — **SSRF 차단**·MIME allowlist·크기 제한·webp 재인코딩·해시 파일명·md 링크 상대경로 치환. |
| `excerpt.py` | LLM 다중 provider 순차 → 전부 실패 시 truncation fallback. |
| `main.py` | Phase A(클립: dedup=볼트 md 존재)/Phase B(파생) 오케스트레이터. `SWARM56_FORCE=1` = skip 무시 재수집·덮어쓰기. 멱등·재개 가능. |

**수집기(`collectors/`)** — 각자 `fetch() -> list[NormalizedRecord]`:
- `naver_blog.py`: RSS → 전문 추출
- `github.py`: REST API(public 레포)
- `youtube.py`: 채널 RSS(핸들→channel_id 해석)
- `notion.py`: 전용 공개 DB query(Integration 토큰) + 블록 fetch
- `swarm.py`: Foursquare v2 `users/self/checkins`(OAuth)
- `instagram.py`: Graph API `/me/media` + **60일 토큰 자동 refresh**(파일 저장)
- `facebook.py`: Page Graph API(작성됐으나 Peter 페이지 없어 미사용 — `CHANNEL_INTEGRATION_NOTES` 참조)

### 4.2 웹앱 (`personal-brand-hub/`)

| 모듈 | 역할 |
|------|------|
| `app/page.tsx` | Server Component, `force-dynamic`. `getItemsByChannel()` → SocialHub 주입. 섹션: Hero→SocialHub→About→**Projects(DB)**→Contact. |
| `app/admin/page.tsx` | 백오피스: 피드 카드 목록·편집·삭제, **프로젝트 카드 목록+추가 폼(v2)**, 숨김 복원, SyncRun 로그, 감사 로그(**KST 표기**), 트리거 버튼(요청 접수 배너). |
| `app/admin/actions.ts` | 서버 액션: login/logout·delete/restore/edit·clipNow/forceReclip·**addProjectCard(v2)**. 전 액션 세션 가드. |
| `app/admin/edit-card.tsx` | 편집 disclosure 클라 컴포넌트 — 저장 성공 시 자동 닫힘(`useActionState`). |
| `lib/admin-repo.ts` | 백오피스 코어: 삭제(방식 B, 트랜잭션)·복원(볼트 md 재파생)·편집·감사로그·트리거 파일 기록·**listProjectCards/addProjectCard(v2 — 업로드 검증·롤백)**. |
| `lib/auth.ts` | bcrypt 비번 해시·서명 세션 쿠키·rate limit. |
| `lib/feed-repository.ts` | **DB→UI 매핑.** `getItemsByChannel()`: `FeedCard` 조회 → 채널별 최신 카드 `FeedItem` 매핑. |
| `lib/md-frontmatter.ts` | 볼트 md frontmatter 파싱(복원 시 카드 재구성용). |
| `lib/feed-data.ts` | 채널 메타(이름·아이콘·프로필 URL) + 타입. |
| `components/projects-section.tsx` | **(v2) `ProjectCard` DB 조회 async 서버 컴포넌트** — 제목·설명·태그(쉼표 split)·docPath 링크. |
| `prisma/schema.prisma` | `FeedCard`(status/thumbnailKind/contentHash **없음** — v5에서 제거) · **`ProjectCard`(v2: title·description·docPath unique·tags·createdAt)** · `SuppressionRecord` · `AdminAudit` · `SyncRun`. |
| `next.config.mjs` | `experimental.serverActions.bodySizeLimit: '10mb'` (v2 — 업로드 수용). |

---

## 5. 기능 설명

- **8채널 자동 수집**: 매일 04:00 UTC systemd timer → Phase A(볼트 클립)+Phase B(카드 파생). 6채널 작동, 2채널(LinkedIn·FB) 플랫폼 차단.
- **온디맨드 클리핑**: `/admin` "지금 클리핑"/"강제 갱신" → 트리거 파일 → **systemd `.path` 유닛이 에이전트 실행**(2026-07-03 설치·검증). 강제 갱신은 dedup 무시 재수집.
- **중복/삭제 처리**: dedup = 볼트 md 존재. 삭제 = FeedCard 제거 + SuppressionRecord(tombstone) — 재파생에도 부활 X, 명시 복원만.
- **본문 이미지**: 볼트 `_assets/`에 webp 보존, Nginx `/vault/` alias 서빙. 썸네일 `/thumbnails/`.
- **프로젝트 카드(v2)**: `/admin`에서 추가(제목·요약·HTML·MD·태그) → 홈 Work/Projects 즉시 반영(재배포 불필요). HTML=`/docs/`(nginx alias), MD=볼트 `project/`(지식그래프). 감사 `PROJECT_ADD`.
- **토큰 수명 관리**: IG 장기토큰 매 실행 자동 갱신. 그 외 토큰은 `agent.env` 보관.
- **동시성**: SQLite WAL + busy_timeout(Python·Prisma 양쪽).

---

## 6. 데이터 흐름 & 배포 아키텍처

### 데이터 흐름
```
[systemd timer 04:00 UTC | 온디맨드 .path 트리거]
  → agent.main (venv)
      Phase A: collectors[*].fetch() → 볼트 raw/<채널>/*.md + _assets/*.webp (dedup=md 존재)
      Phase B: 볼트 frontmatter → FeedCard 파생 (활성 suppression 스킵)
      → SyncRun 기록
[브라우저] GET https://swarm56.com
  → Nginx :443 (LE TLS) → 127.0.0.1:3000 (next start, systemd swarm56-web)
      → page.tsx → FeedCard/ProjectCard 조회(site-v5.db) → 카드 렌더 → 클릭 → 원문/문서
  /vault/*      → Nginx alias → /var/lib/swarm56/vault-v5/raw/   (본문 이미지)
  /thumbnails/* → Nginx alias → /var/lib/swarm56/web/thumbnails/
  /docs/*       → Nginx alias → /var/lib/swarm56/web/docs/       (v2 — 프로젝트 문서 HTML)
[백오피스 카드 추가(v2)]
  → 서버 액션: 검증 → HTML→/var/lib/swarm56/web/docs/ · MD→볼트 project/ → ProjectCard insert + audit
```

### 서버 경로 (Lightsail VPS — 주소·SSH는 로컬 전용 `AGENTS_v2.md`·메모리 참조)
| 항목 | 경로 |
|------|------|
| 앱 | `/opt/swarm56/app` (systemd `swarm56-web`, next start :3000, `.env`은 Next가 단독 로드) |
| 빌드 소스 | `/opt/swarm56/v5build` (repo clone — 배포는 여기서 pull 후 surgical cp) |
| 에이전트 | `/opt/swarm56/agent` (venv `/opt/swarm56/agent-venv`) |
| DB | `/var/lib/swarm56/web/site-v5.db` |
| 볼트 | `/var/lib/swarm56/vault-v5` (raw/=피드 소스, project/=지식그래프) |
| 프로젝트 문서 | `/var/lib/swarm56/web/docs/` (v2) |
| 썸네일 | `/var/lib/swarm56/web/thumbnails/` |
| 트리거 | `/var/lib/swarm56/triggers/{clip,force}.now` |
| 비밀 | `/etc/swarm56/agent.env`(0640) · 앱 `.env`(SESSION_SECRET·ADMIN_PASSWORD_HASH·DATABASE_URL) |
| 자동화 | `swarm56-agent.{service,timer}` + `swarm56-clip/force.{path,service}` |
| Nginx | `swarm56.com`(앱+alias 3종) / `sync.swarm56.com`(CouchDB 잔재) |

배포 방식: **surgical in-place** — v5build `git pull` → 변경 파일만 cp → `npm run build` → restart → `DEPLOYED_SHA` 갱신. **dir 전체 swap 금지(.env 보호)**. 상세 런북: `BACKOFFICE_FEATURE_CONTEXT_v2.md` §5.

---

## 7. 멀티에이전트 협업 방법론 (연구 핵심)

### 7.1 오케스트레이션 구조
- **Peter + Claude = 공동 오케스트레이터.** Peter=결정권(방향·범위·승인), Claude=구동·문서화·게이트 관리. **사람이 중앙(human-in-the-loop)**.
- **여러 회사 에이전트 참여 파이프라인**: Antigravity Pro(초기 설계) → Simone(GPT 웹버전, 기획 협업) → Relume(와이어프레임)·v0.dev(컴포넌트 시안) → Claude Code(시안→통합·클리퍼·DB·배포) → Codex(독립 검증). 각 단계 산출물을 다음 에이전트가 이어받음.
- 참고 인스턴스: 헤라=Hermes, 투투=OpenClaw (Peter의 다른 Claude Code 인스턴스).

### 7.2 핸드오프 문서화
여러 회사 에이전트가 참여하므로 **중간 단계 문서화가 필수.** `pipeline/`(HANDOFF_LOG·Relume·v0) + Google Drive `agent-shared/swarm56_pipeline`에 기록. 원칙: **시안 없이 코드 진입 금지, 문서 정리 먼저 → 코딩.** (v2 추가: **완료 문서는 버전 신규 작성 + 원본 보존** — 수정 전 상태를 시점 기록으로 유지)

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
- **승인 유도 위반**: Claude가 미결정 사항을 확정 질문으로 포장해 승인 유도 → Peter 적발, [위반사례] Notion 기록 + 규칙화. (§2 위반)
- **미이행 후속검증(2026-07-03)**: 검증이 "서버 실행 미검증"을 정확히 잔여위험으로 남겼으나 그 후속(#11)이 이행되지 않아 트리거 기능이 미작동인 채 라이브됨 → 사용 시점에 발견·복구. 교훈 = **배포 후 서버 스모크 테스트 게이트**(서버 전용 인프라는 repo/로컬 검증으로 증명 불가). 상세: `verification/PROCESS_RETROSPECTIVE.md`.
- **교훈**: 멀티에이전트에서 가장 위험한 건 **에이전트가 미승인 결정을 사실처럼 누적**하는 것 + **미결 항목이 나열로만 남고 닫히지 않는 것**. → 명시 승인 게이트 + 행위자 귀속 + 실행 증거 검증 + 잔여위험 종료추적이 방어선.

---

## 8. Provenance (누가 무엇을 만들었나)

| 산출물 | 행위자(회사) | 비고 |
|--------|--------------|------|
| 초기 1~5단계 기획서 (archive/) | Antigravity Pro | HITL 없이 진행됐던 초안 |
| v1~v3 기획 + 옛 `web/` 앱(Post 모델) | GPT(Simone) + Sonnet | "옵시디언 제거" 무단 변경 포함 → 폐기 |
| `CODE_SPEC.md` (옛 web/ 기준) | 이전 Claude 세션 | stale → `CODE_SPEC_v2.md`로 계승 |
| v4 리베이스라인 → v5 재구현(볼트 단일소스 라이브) | Opus 세션 | 2026-06-28~29 |
| v5 독립 검증(3라운드) | Codex | 검증 리포트 3종 + FINAL_VERIFICATION_REPORT |
| 트리거 복구 + 편집닫힘/KST + 검증 회고 | Claude (Opus, 2026-07-03) | 커밋 ef44713 |
| **백오피스 프로젝트 카드 추가 기능 + 문서 v2 세대** | **Claude (Fable 5, 2026-07-09 — 현재)** | ProjectCard·/docs·볼트 project/ 예외 |
| 디자인 시안 | Relume / v0.dev | personal-brand-hub = v0 export |

> ⚠️ git author는 대부분 "Claude"로 뭉뚱그려져 있어 파일별 정밀 귀속은 일부 추정. §4(행위자 명시)를 커밋·로그에서 엄격 적용.

---

## 9. 한계 & 향후
- **R1 미완**: 옵시디언 볼트 ↔ CouchDB LiveSync 미배선(서버 볼트가 단일소스로 동작 중). 옵시디언 클라이언트 동기화 비전은 향후.
- **프로젝트 카드**: 추가 전용 — 편집·삭제 UI 없음(필요 시 수기 런북 or 기능 추가).
- **LinkedIn·FB**: 플랫폼 공식 API 차단(`CHANNEL_INTEGRATION_NOTES.md`). 자동 불가.
- **보안**: 노출 토큰 rotate(Notion 등), SSH 키 repo 폴더 밖 이동 — `KNOWN_ISSUES_v2.md`.
- **드리프트·잠재 이슈**: config split-brain(vault/site.db 구세대 잔재), 고아 배포 아티팩트(deploy_web.sh 등), CouchDB 잔재 — 전부 `KNOWN_ISSUES_v2.md`에서 추적.
- **연구 관점 개선점**: 행위자 귀속(§4) 자동화, 핸드오프 산출물 스키마 표준화, 거버넌스 게이트의 도구화, 배포 후 스모크 테스트의 체크리스트화.
