# IMPLEMENTATION_TRACEABILITY.md
작성: Claude (Claude Code) — 2026-06-27
근거: Phase 2.0 문서·범위 정합성 확정

---

## 1. 공개 페이지 목록 (Phase 2 확정)

| Route | 기능 | 출처 문서 | 포함 섹션 | Phase |
|-------|------|-----------|-----------|-------|
| `GET /` | 홈페이지 (단일 페이지 MVP) | homepage_brief v0.2 §4.1, feature_spec F-01·F-02·F-03 | Header, Hero, Activity Feed Grid, Footer | **2** |
| `GET /api/health` | 서버/DB 상태 확인 | GPT Phase 2 계획 §Phase 2.4 | `{status, database}` JSON | **2** |
| `404` | 존재하지 않는 Route | Next.js App Router not-found.tsx | 커스텀 404 UI | **2** |

### Phase 2에서 구현하지 않는 Route (Phase 3+)

| Route | 이유 |
|-------|------|
| `/about` | homepage_brief v0.2 §4.2 "향후 확장"으로 명시 |
| `/projects` | 위 동일 |
| `/writing` | 위 동일 |
| `/notes` | 위 동일 |
| `/contact` | 위 동일 |
| `/admin` | GPT Phase 2 계획 명시 제외 범위 |

---

## 2. Route × 기능 × Prisma Model × 검증 매핑

| 요구사항 ID | 화면·Route | 구현 내용 | Prisma Model | 검증 방법 | Phase |
|------------|-----------|-----------|--------------|-----------|-------|
| F-01 (GNB) | `GET /` → Header | `Jongseok Won` 로고, About/Work/Projects/Contact 앵커, GitHub·LinkedIn·Naver Blog 아이콘 | 없음 (정적) | 모바일 레이아웃 확인, 링크 동작 | **2** |
| F-02 (Hero) | `GET /` → Hero | Label, Headline, Subcopy, CTA 버튼, 프로필 카드 | 없음 (정적) | 데스크톱·모바일 렌더링 | **2** |
| F-03 (Feed) | `GET /` → ActivityFeed | 카테고리 탭(All·Software·Business·Workflow), 카드 그리드(3열→2열→1열), 페이지네이션(9개+더보기) | `Post` | Seed 데이터 노출, draft 미노출, 잘못된 slug 없음 | **2** |
| — | `GET /api/health` | `{status:"ok", database:"reachable"}` | `Post` (DB ping용) | HTTP 200, 내부 경로 미노출 | **2** |
| — | `404` | 커스텀 Not Found UI | 없음 | 존재하지 않는 URL 접근 → 404 | **2** |
| B-01 (Admin) | `/admin` | 어드민 대시보드, Post 노출 제어, SyncLog 조회 | `Post`, `SyncLog` | — | **3** |
| B-02 (Agent ctrl) | `/admin` | API Key 관리, 수동 동기화 | `Config` | — | **3** |
| A-01 (Watcher) | VPS 백그라운드 | Python watchdog, Obsidian Vault 감시 | `Post` (write) | — | **3** |
| A-02 (LLM) | VPS 백그라운드 | GPT-4o-mini API 호출, 요약·태그 생성 | `Post` (write) | — | **3** |
| A-03 (DB pub) | VPS 백그라운드 | SQLite 직접 적재, 중복 방지 | `Post` (write) | — | **3** |

---

## 3. Prisma Model 확정 (Phase 2)

### 3.1 Phase 2에서 구현하는 Model

#### `Post`
출처: `5_development_design_brief.md` §2, feature_spec F-03

```prisma
model Post {
  id             String   @id @default(uuid())
  title          String
  summary        String
  originalUrl    String   @unique
  sourcePlatform String
  tags           String   // JSON Array String
  status         String   @default("ACTIVE")  // ACTIVE | INACTIVE
  publishedAt    DateTime
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

**Phase 2 필수 조건:**
- `status = "ACTIVE"` 인 Post만 공개 조회
- `originalUrl` unique constraint
- `publishedAt` 기준 내림차순 정렬
- 페이지네이션: 9개 단위

### 3.2 Phase 2에서 구현하지 않는 Model

| Model | 이유 |
|-------|------|
| `Config` | Admin API Key 관리 (Phase 3) |
| `SyncLog` | Agent 동기화 로그 (Phase 3) |

---

## 4. Phase 2 / Phase 3 경계 명시

```
Phase 2 경계 — 이 선 안만 구현한다
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Next.js 14 프로젝트 기반
- Post 모델 (읽기 전용, Seed 데이터)
- GET / (단일 페이지 MVP)
- GET /api/health
- 404 처리
- Seed 반복 실행 시 중복 없음
- swarm56.com HTTPS 운영 배포
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 3 경계 — Phase 2 완료 후
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Config, SyncLog 모델
- /admin 어드민 대시보드
- Python Watchdog 에이전트
- CouchDB 변경 감지
- GPT-4o-mini API 연동
- 네이버 블로그 크롤러
- Obsidian LiveSync ↔ Agent 연동
- Cloudflare Proxy 활성화
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 5. 문서 간 충돌 목록

| 번호 | 항목 | 기획 문서 기재 | 실제 현황 / GPT 계획 | 판정 |
|------|------|----------------|----------------------|------|
| C-01 | VPS RAM | `4_tech_platform_selection.md`: 2GB RAM | 실제 인프라: 1GB RAM (Phase 1 완료) | **실제 우선** — 1GB로 운영 중 |
| C-02 | Node.js 버전 | `4_tech_platform_selection.md`: "LTS Node v20" | GPT Phase 2: Node 22 LTS | **GPT 계획 우선** — Node 22 LTS 사용 |
| C-03 | CouchDB 설치 방식 | 모든 기획 문서: Docker 컨테이너 | 실제 설치: apt 직접 설치 (Docker 없음) | **실제 우선** — Docker 없이 운영 중 |
| C-04 | SQLite 위치 | `4_tech_platform_selection.md`: `web/prisma/dev.db` | GPT Phase 2: `/var/lib/swarm56/web/site.db` (release 외부) | **GPT 계획 우선** — release 외부 저장 |
| C-05 | 환경변수 파일 위치 | `4_tech_platform_selection.md`: `web/.env` | GPT Phase 2: `/etc/swarm56/web.env` | **GPT 계획 우선** — VPS 전용 env 파일 |
| C-06 | Prisma db url | `4_tech_platform_selection.md`: `file:./dev.db` | GPT Phase 2: 환경변수 주입 `DATABASE_URL` | **GPT 계획 우선** |
| C-07 | 프로세스 매니저 | `4_tech_platform_selection.md`: PM2 | GPT Phase 2: systemd 서비스 (`swarm56-web.service`) | **GPT 계획 우선** — systemd 사용 |
| C-08 | 오케스트레이터 에이전트 | `2_feature_specification.md` §5: Antigravity | 현재: Antigravity 강제 종료, GPT + Claude Code 체계 | **현재 체계 우선** |

**치명적 충돌 없음** — 모든 충돌은 인프라 실제 상태 또는 GPT Phase 2 계획이 우선함으로써 해소된다.

---

## 6. .bak.md 파일 목록 및 처리 방침

| 파일 | 버전 | 작성자 | 상태 |
|------|------|--------|------|
| `homepage_planning_design_dev_brief.v0.1.bad-agent-swarm.bak.md` | v0.1 (2026-06-24) | Antigravity (bad-agent-swarm) | **실행 지시로 사용 금지** |
| `homepage_planning_design_dev_brief.md` | v0.2 (2026-06-24) | — | 현행 유효 디자인 기획서 |

**방침:** `.bak.md` 파일은 삭제하지 않지만, 어떤 구현 결정의 근거로도 사용하지 않는다. v0.2(`homepage_planning_design_dev_brief.md`)가 유효한 디자인 기획서다.

---

## 7. 프로젝트 루트 경로 통일

**기준 경로:**

| 환경 | 경로 |
|------|------|
| 로컬 (개발) | `D:\Agent_Workspace\homepage_project\` |
| 웹 프로젝트 | `D:\Agent_Workspace\homepage_project\web\` |
| VPS 배포 | `/opt/swarm56/web/releases/<timestamp>/` |
| VPS SQLite | `/var/lib/swarm56/web/site.db` |
| VPS 환경변수 | `/etc/swarm56/web.env` |

`work_note.md`의 `file:///C:/shared/homepage_project/` 경로는 잘못됨 — 실제 경로는 `D:\Agent_Workspace\homepage_project\`

---

## 8. Phase 2.1R 기술 결정 기록 (2026-06-27)

| 번호 | 항목 | 변경 전 | 변경 후 | 사유 |
|------|------|---------|---------|------|
| C-09 | Next.js 버전 | 14.2.35 | 16.2.9 | self-hosted SSRF·App Router DoS 취약점 — 14.x 패치 미제공, 보안 최신 라인으로 변경 |
| C-10 | Node.js 버전 | 22.x LTS (계획) | 24.x LTS (실제) | 개발 환경이 Node 24이며 현행 LTS 라인. 개발·빌드·운영 major version 24로 통일 |
| C-11 | Prisma 버전 | 6.19.0 | 6.19.3 | effect 의존성 취약점 패치 버전으로 교정 |
| C-12 | ESLint 버전 | 8.x | 9.x | eslint-config-next@16.2.9 최소 요구사항 ESLint ≥9.0.0 |

## 9. Gate 2.0 점검표

| 항목 | 상태 |
|------|------|
| 공개 페이지 목록 확정 | ✅ `/` 단일 페이지 + `/api/health` + 404 |
| 데이터 모델 후보 확정 | ✅ `Post` (Phase 2 유일) |
| Phase 2 제외 범위 확정 | ✅ §4 경계 명시 |
| 문서 간 치명적 충돌 없음 | ✅ §5 충돌 8건, 모두 해소 가능 |
| 프로젝트 루트 경로 통일 | ✅ §7 기준 경로 확정 |
