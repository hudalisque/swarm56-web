# 현재 구현 코드 문서 v2 — swarm56.com

> v2 · 2026-07-09 · 이전 버전: [CODE_SPEC.md](CODE_SPEC.md) (보존 — 2026-06-27, **폐기된 옛 `web/` 앱(Post 모델·standalone·releases 배포) 기준**)
> 변경 사유: 현행 라이브 시스템(personal-brand-hub + agent, v5 볼트 단일소스)과 원본이 전면 불일치 + 백오피스 프로젝트 카드 추가 기능(2026-07-09) 반영.
> 대상: 브랜치 `fix/r1-obsidian-single-source` 현행 코드. 아키텍처 정본은 `INTEGRATED_PLAN_v6.md`.

---

## 1. 기술 스택

| 구분 | 버전 |
|------|------|
| Next.js | 16.2.6 (App Router, `next start` — standalone 아님) |
| React | 19 |
| TypeScript | 5.7 (`ignoreBuildErrors: true`) |
| Tailwind CSS | v4 |
| Prisma ORM | 6.19.3 + SQLite (WAL) |
| Python | 3.12 (클리핑 에이전트) |
| 폰트 | Pretendard(CDN) + Geist |

---

## 2. 폴더 구조 (현행 핵심만)

```
homepage_project/
├── agent/                            # ★ Python 클리핑 에이전트
│   ├── main.py                       # Phase A(클립)/B(파생) 오케스트레이터, SWARM56_FORCE
│   ├── collectors/                   # naver_blog·github·youtube·notion·swarm·instagram·(facebook)
│   ├── vault.py / db.py              # 볼트 md writer / 파생·suppression·SyncRun
│   ├── images.py / excerpt.py        # 본문이미지 webp(SSRF) / LLM 발췌 fallback
│   ├── settings.py / models.py       # env 설정 / NormalizedRecord
│   └── tests/                        # v5 자동 테스트
│
├── personal-brand-hub/               # ★ 배포된 Next.js 앱
│   ├── app/
│   │   ├── page.tsx                  # 홈 (Server Component, force-dynamic)
│   │   ├── layout.tsx / globals.css
│   │   └── admin/
│   │       ├── page.tsx              # 백오피스 대시보드
│   │       ├── actions.ts            # 서버 액션 전부
│   │       ├── edit-card.tsx         # 편집 disclosure (클라 컴포넌트)
│   │       └── login/                # 로그인
│   ├── components/                   # UI (아래 §3)
│   ├── lib/                          # admin-repo·auth·feed-repository·md-frontmatter·prisma·feed-data·site·utils
│   ├── prisma/
│   │   ├── schema.prisma             # 5모델 (§4)
│   │   └── migrations/               # init_feedcard / v5_obsidian_source_suppression / project_card
│   ├── public/docs/                  # 프로젝트 문서 HTML 3장 (서빙은 nginx /docs/로 이관)
│   └── next.config.mjs               # serverActions.bodySizeLimit 10mb
│
├── deploy/                           # nginx conf + systemd 유닛(web/agent/clip/force)
│   ├── swarm56-web.conf              # /vault/·/docs/ alias + proxy (※서버 실물엔 /thumbnails/도)
│   ├── swarm56-web.service           # User=ubuntu, npm start (EnvironmentFile 금지 — .env는 Next 단독 로드)
│   ├── swarm56-clip.{path,service}   # "지금 클리핑" 트리거 감시·1회 실행 (2026-07-03 서버 설치)
│   ├── swarm56-force.{path,service}  # "강제 갱신" (SWARM56_FORCE=1)
│   └── deploy_web.sh ⚠️              # 폐기된 releases/심링크 모델 잔재 — 사용 금지 (KNOWN_ISSUES_v2)
│
├── web/ ⚠️                           # 폐기된 옛 앱 (CODE_SPEC v1이 이걸 기술)
└── archive/                          # 시점 기록 (불변)
```

---

## 3. 모듈별 역할 (현행)

### 3.1 웹앱 `personal-brand-hub/`

| 파일 | 역할 |
|------|------|
| `app/page.tsx` | `force-dynamic`. `getItemsByChannel()` → Hero→SocialHub→About→**ProjectsSection(DB)**→Contact. |
| `app/admin/page.tsx` | 인증 가드(`isAuthed`) → 병렬 조회(피드카드·숨김·SyncRun·감사·**프로젝트카드**) → 대시보드. 시간은 `ymd()`=**Asia/Seoul(KST)**. 배너: `?req=clip/force/card/cardfail`. |
| `app/admin/actions.ts` | `"use server"`. login/logout(rate limit) · delete/restore(방식 B) · edit(`useActionState` 시그니처, `{ok}` 반환) · clipNow/forceReclip(트리거 파일 + redirect 배너) · **addProjectCard**(검증→저장→insert→audit, redirect는 try 밖=NEXT_REDIRECT 보호). 전 액션 `guard()`. |
| `app/admin/edit-card.tsx` | 클라 컴포넌트. 저장 성공(`state.ok`) 시 `<details>` 자동 닫힘, pending 중 버튼 disable. |
| `lib/admin-repo.ts` | 백오피스 코어. `listCards/listSuppressed/listSyncRuns` · `deleteCard`(FeedCard 제거+tombstone+audit 한 트랜잭션) · `restoreCard`(tombstone 해제+볼트 md 재파생) · `editCard` · `writeTrigger`(실패 시 FAILED audit+에러 전파) · **`listProjectCards`(createdAt asc)** · **`addProjectCard`**: `safeName`(basename+`[a-z0-9-]`, 확장자 화이트리스트) → `saveUpload`(4MB 상한, `wx` 플래그=중복 거부) → HTML=`SWARM56_DOCS_DIR`, MD=`SWARM56_VAULT_DIR/project/` → ProjectCard+audit 트랜잭션 → **실패 시 저장 파일 unlink 롤백 + PROJECT_ADD_FAILED**. |
| `lib/auth.ts` | bcrypt 해시 비교(`ADMIN_PASSWORD_HASH`), 서명 세션 쿠키(HttpOnly/Secure/SameSite), rate limit. |
| `lib/feed-repository.ts` | `getItemsByChannel()`: FeedCard → 채널별 FeedItem 매핑(홈 피드). |
| `lib/md-frontmatter.ts` | 볼트 md frontmatter 파싱(복원용). |
| `components/projects-section.tsx` | **async 서버 컴포넌트** — `listProjectCards()` 조회, `tags.split(',')` 렌더. (v1은 하드코딩 배열이었음) |
| `components/social-hub.tsx` 등 | 8채널 타일+피드 카드 그리드 (v0.dev 디자인). |

### 3.2 에이전트 `agent/` — DOCUMENTATION_v2.md §4.1 참조 (동일 내용 중복 기재 생략)

---

## 4. DB 스키마 (site-v5.db, 현행 5모델)

```prisma
model FeedCard {          // 피드 카드 캐시 (볼트 파생) — status/thumbnailKind/contentHash 없음(v5 제거)
  id String @id @default(cuid())
  channel String; title String; excerpt String?
  thumbnailPath String?; originalUrl String @unique
  vaultPath String?; publishedAt DateTime; externalId String?
  createdAt/updatedAt
  @@unique([channel, externalId]); @@index([channel, publishedAt])
}
model ProjectCard {       // (v2 신설) Work/Projects 카드 — 백오피스에서 추가
  id String @id @default(cuid())
  title String; description String
  docPath String @unique  // "/docs/<file>.html"
  tags String             // 쉼표 구분
  createdAt/updatedAt     // 정렬 = createdAt asc (시드 3장 → 새 카드 뒤에)
}
model SuppressionRecord { // 삭제 의도 보존(방식 B) — restoredAt=null=활성
  originalUrl @unique; vaultPath?; deletedAt; deletedBy; reason?; restoredAt?
}
model AdminAudit {        // 감사: DELETE|RESTORE|EDIT|CLIP_NOW|FORCE_RECLIP|PROJECT_ADD(+_FAILED)
  action; target?; actor; at; detail?
}
model SyncRun {           // 클리핑 실행 로그
  channel?; trigger; status; startedAt/finishedAt; fetched/upserted/skipped/error counts
}
```
마이그레이션: `20260627174330_init_feedcard` → `20260629120000_v5_obsidian_source_suppression` → `20260709030000_project_card`(테이블+**시드 3장 INSERT**).

---

## 5. 데이터 흐름

```
[일 1회 timer | 온디맨드 .path] → agent.main
   Phase A: 채널 fetch → 볼트 raw/<채널>/*.md + _assets/*.webp  (dedup=md 존재)
   Phase B: 볼트 frontmatter → FeedCard (활성 suppression 스킵) → SyncRun

GET /            → page.tsx → FeedCard(피드) + ProjectCard(Work/Projects) → 렌더
GET /docs/*.html → nginx alias → /var/lib/swarm56/web/docs/     (v2)
GET /vault/*     → nginx alias → 볼트 raw/ 이미지
GET /thumbnails/*→ nginx alias → 썸네일

POST /admin 카드 추가(v2) → addProjectCardAction
   → 검증(확장자/4MB/sanitize/중복) → HTML 저장 + MD 저장(볼트 project/ 한정)
   → ProjectCard insert + PROJECT_ADD audit (트랜잭션) → 배너
POST /admin 트리거 → 트리거 파일 기록 → systemd .path → 에이전트 1회 실행 → SyncRun
```

---

## 6. 배포 아키텍처 (실제 — surgical in-place)

```
Internet → Nginx :443 (LE TLS)
  ├─ proxy_pass 127.0.0.1:3000 → next start (systemd swarm56-web, User=ubuntu)
  ├─ /vault/ → /var/lib/swarm56/vault-v5/raw/
  ├─ /thumbnails/ → /var/lib/swarm56/web/thumbnails/
  └─ /docs/ → /var/lib/swarm56/web/docs/   (v2)
```

**배포 절차**: `/opt/swarm56/v5build`(repo clone) `git pull` → **변경 파일만** `/opt/swarm56/app`에 cp → `npm run build`(in-place, `.env`·node_modules 유지) → `sudo systemctl restart swarm56-web` → `DEPLOYED_SHA` 갱신 → 스모크 검증.
- ⚠️ **금지**: app 디렉토리 전체 swap(.env 소실→로그인 깨짐) · `deploy_web.sh` 사용(폐기 모델) · 서버 파일 직접 수정(드리프트).
- DB 스키마 변경 시: **백업 먼저** → `npx prisma migrate deploy`(app 디렉토리).
- **프로젝트 카드 추가는 배포 아님** — `/admin` 폼으로 런타임 처리.

---

## 7. 환경변수

### 웹앱 (`/opt/swarm56/app/.env` — Next @next/env가 **단독 로드**, systemd EnvironmentFile 금지)
```env
DATABASE_URL=file:/var/lib/swarm56/web/site-v5.db
SESSION_SECRET=<서명키>
ADMIN_PASSWORD_HASH=<bcrypt>
SWARM56_VAULT_DIR=/var/lib/swarm56/vault-v5
SWARM56_CLIP_TRIGGER=/var/lib/swarm56/triggers/clip.now
SWARM56_FORCE_TRIGGER=/var/lib/swarm56/triggers/force.now
# SWARM56_DOCS_DIR — 미설정 시 코드 기본값 /var/lib/swarm56/web/docs (v2)
```
### 에이전트 (`/etc/swarm56/agent.env`, 0640)
```env
SWARM56_DB_PATH=/var/lib/swarm56/web/site-v5.db
SWARM56_VAULT_DIR=/var/lib/swarm56/vault-v5
# + 채널 토큰(Notion·Foursquare·IG)·LLM 키
```
> ⚠️ systemd `swarm56-agent.service`의 inline `Environment=`에 구세대 경로(vault·site.db)가 남아 있고 agent.env가 override 중 — 건드릴 때 주의 (`KNOWN_ISSUES_v2.md` config split-brain).

---

## 8. 주요 제약사항

- `.env`는 Next가 직접 로드 — systemd `EnvironmentFile`로 중복 로드하면 bcrypt 해시의 `$`가 이중 확장돼 로그인 깨짐(2026-06-29 핫픽스, `swarm56-web.service` 주석).
- SQLite 동시성: WAL + busy_timeout (Python 에이전트·Prisma 양쪽에서 접근).
- 서버 액션 body 기본 1MB → `next.config.mjs`에서 10MB로 상향(업로드 수용). 업로드 개별 상한 4MB는 코드에서 검증.
- 볼트 접근 경계: 웹 코드의 볼트 쓰기는 `admin-repo.ts`의 `VAULT_PROJECT_DIR`(=`<vault>/project`) 상수 하나뿐 — `raw/` 접근 코드 없음.
- 파일명 정책: 업로드 파일명은 영문/숫자/하이픈으로 정규화 — **한글 파일명은 거부됨**(stem이 비면 에러).

---

## 9. 검증

- 로컬: `npm run build` · `npm run lint` · `python -m agent.tests.test_v5` · dev.db `migrate deploy`.
- 서버(배포 후 스모크 — 필수): 기존 URL 회귀(200) · 관리자 로그인 · 카드 추가 E2E(/docs 200 + 홈 노출 + project/ md + audit) · 트리거→SyncRun · `raw/` 무변화. 체크리스트: `VERIFICATION_CHECKLIST_v2.md`.
