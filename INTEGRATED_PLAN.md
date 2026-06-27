# 통합 기획서 v4 — Personal Brand Hub (swarm56.com)

> 작성: Opus (Claude Code) + Peter 공동 설계 확정
> 개정: v4 — 2026-06-27 (**옵시디언 단일소스 구조로 정정** — v1~v3의 "옵시디언 제거"는 무단 변경이라 폐기)
> 문서 상태: **확정 설계 기준 문서**. 코딩은 이 문서 정리 후 착수(문서 우선 원칙).

## v4 정정 핵심 (v3 대비 반전)
v1~v3는 OPUS_PROMPT의 **"Obsidian/CouchDB 제거, SQLite 직접 저장"** 위에 작성됐으나, 이는 2026-06 GPT/Sonnet이 **Peter 승인 없이 넣은 무단 설계 변경**(Constitution §1·§2 위반, HF-001 패턴)으로 확인됨. Peter가 직접 같이 설계한 **정식 구조 = 옵시디언 단일소스**로 되돌린다.

| 항목 | v3 (잘못됨) | **v4 (정식)** |
|------|-------------|---------------|
| 콘텐츠 단일소스 | SQLite 직접 | **옵시디언 Vault** |
| 전문 저장 | 미보관(summary만) | **옵시디언에 전문 보관** |
| SQLite 역할 | 1차 DB | **옵시디언 파생 카드 캐시** |
| CouchDB | R8 제거 | **유지** (볼트 호스팅·동기화) |
| 채널 수 | 7 | **8 (노션 포함)** |

---

## 0. 프로젝트 정체성

### 0.1 정의
> **swarm56.com은 Peter의 8개 채널 활동을 서버가 자동 클리핑해 옵시디언(지식 단일소스)에 전문으로 모으고, 홈페이지가 그 위에 카드 형태의 표현(presentation) 레이어를 얹어 보여주는 Personal Brand Hub다.**

- 옵시디언 = **콘텐츠의 단일 진실원천(single source of truth)** 이자 Peter의 LLM-wiki 지식베이스
- 홈페이지 = 그 지식베이스의 **표현 레이어** (카드 → 원문 링크)
- 카드 클릭 = **원본 외부 페이지로 이동** (사이트 내부 상세 없음)

### 0.2 단방향 데이터 흐름
```
[8채널: 네이버블로그·노션·유튜브·깃헙·LinkedIn·Instagram·Facebook·Swarm]
   │ 새 글/수정 감지 → 클리핑(전문) → upsert(content-hash로 변경 반영)
   ▼
[서버의 swarm56 옵시디언 Vault]  ← 단일 소스 (raw/<채널>/*.md, 전문 + frontmatter)
   │   (CouchDB 3.5.2로 Peter 기기 Obsidian과 동기화)
   ├─▶ 클리퍼가 동시에 카드 메타 기록
   ▼
[SQLite 카드 캐시]  제목/발췌/썸네일경로/원문URL/채널/게시일
   ▼
[홈페이지]  SQLite 읽어 카드(잘라서) 표시 → 클릭 → 원문 외부 URL
```
멱등 upsert + 단방향 + Peter는 옵시디언을 직접 편집하지 않음(원본 수정→재업로드→재클립).

---

## 1. 구성요소 역할 (확정)

| 부품 | 역할 | 위치 |
|------|------|------|
| 클리핑 에이전트 | 채널 감지 → 전문 md(옵시디언) + 카드(SQLite) 동시 기록, 변경 시 재클립 | 서버(VPS) |
| **옵시디언 Vault** | **단일 소스** — 전문 아카이브 + LLM-wiki 지식베이스 | 서버에 직접 생성 |
| **CouchDB 3.5.2** | 옵시디언 볼트 호스팅 + Peter 기기 동기화 (LiveSync) | 서버, sync.swarm56.com (검증됨) |
| **SQLite** | 옵시디언 파생 **카드 캐시**(빠른 읽기용) | 서버 |
| 홈페이지(Next.js) | SQLite 읽어 카드 렌더 → 원문 링크 | 서버, swarm56.com |

> 옵시디언을 매 요청마다 읽으면 느리므로 **카드용으로 추출해 SQLite에 캐시**하고 홈피는 캐시를 읽는다(Peter 결정).

---

## 2. 멀티에이전트 협업 구조 (프로젝트 핵심 목적)

이 프로젝트의 실제 목적 중 하나는 **여러 회사 에이전트의 협업 워크플로우 확립**이다(메모리 `project_homepage_workflow_goal`). 멀티에이전트 협업은 부가가 아니라 핵심이다.

### 현행 에이전트 로스터 (회사별)
| 회사 | 에이전트 | 역할 |
|------|----------|------|
| — / Anthropic | **Peter + Claude** | 공동 오케스트레이터 (Peter=최종 결정, Claude=구동·문서화·게이트) |
| OpenAI | Simone (GPT 웹버전) | 기획 협업, Relume/v0.dev 프롬프트 협의 |
| Relume | Relume | IA·사이트맵·와이어프레임 |
| Vercel | v0.dev | UI 컴포넌트 시안 |
| Anthropic | Claude Code (Opus/Sonnet) | 시안→통합·클리퍼·DB·배포 |
| OpenAI | GPT-4o-mini (선택) | 클리핑 요약 |
| Anthropic (Claude Code 인스턴스) | 헤라 = Hermes | Peter의 다른 Claude Code 인스턴스 — 필요시 협업(Peter 통해) |
| Anthropic (OpenClaw 구동) | 투투 = OpenClaw | Peter 개인 Claude Code 인스턴스 — 필요시 협업, swarm56 빌드 담당과 **별개** |
| ~~퇴출~~ | ~~Antigravity~~ | 무단 설계 변경(HF-001 패턴) 후 퇴출 → Peter+Claude가 조율자 대체 |

### 두 층위 (원안 대비)
- **멀티벤더 디자인 파이프라인 (유지)**: GPT/Claude가 프롬프트 → Relume(와이어) → [Peter 승인] → v0.dev(시안) → [Peter 승인] → Claude Code(통합). 상세: IMPLEMENTATION_SPEC R4-0.
- **기능별 빌드 서브에이전트 (폐기)**: 원안의 Infra/Web/Sync 회사별 분리는 사용 안 함 → **Claude Code가 인프라·웹·클리퍼(Sync)를 통합 담당**(필요시 Claude 내부 서브에이전트 활용).

### 원칙
- Peter 중앙, 결정권은 항상 Peter. **시안 없이 코드 진입 금지.**
- 회사가 다른 에이전트 간 핸드오프는 산출물 단위로 `pipeline/` + Google Drive `agent-shared/swarm56_pipeline`에 기록 (Constitution §4 행위자 명시·§9 상태 영속성).

### 서브에이전트 활용
**A. 내부 Claude Code 서브에이전트** (Agent 툴, Claude가 직접 spawn) — 코딩 단계(R3·R5·R6)의 병렬·독립 태스크에 한정:
- **8채널 클리퍼**: 채널당 1 서브에이전트(worktree 격리)로 네이버 패턴 복제 → 병렬, 각자 완료 Gate
- **API 조사**(유튜브/노션/Foursquare 등): Explore/general-purpose 서브에이전트 병렬
- **UI 컴포넌트**(v0.dev 시안 확정 후) 통합 분담
- 원칙: 명세 구체적인 독립 작업만 위임, worktree 격리, 산출물은 Gate + `pipeline/` 기록. **임의 spawn 금지 — Peter 승인 후 건건이 제안.**

**B. 외부 협업 에이전트** (Claude 권한 밖 → Peter 통해 요청):
- **Simone(GPT)**: 기획·프롬프트 협의 / **Relume·v0.dev**: 디자인 산출물(Peter 운전)
- **투투(OpenClaw)·헤라(Hermes)**: Peter의 다른 Claude Code 인스턴스 — 병렬 분담·별도 환경 작업 시 요청
- **Peter**: 결정·승인, VPS 접근, 외부 계정/토큰

**도움 요청 예고 지점**: VPS 작업(볼트 생성·Nginx·cert·배포, SSH 필요) → Peter/투투 · Cloudflare/토큰 → Peter · 디자인 시안 → Relume·v0.dev + Simone.

---

## 3. 정보 구조 (IA)

```
swarm56.com
├── /                         메인 허브 (단일 페이지, 앵커 네비)
│   ├── GNB                   로고 + 앵커메뉴 + 소셜아이콘 + (모바일)햄버거
│   ├── Hero                  메인/서브 카피 + 프로필 카드
│   ├── About / Work / Projects
│   ├── Social Hub Grid       채널 필터 + 8 채널 타일 (각 최신 5개 카드)
│   │     └── 카드 = 썸네일/제목/발췌/게시일 → 클릭 시 원문
│   └── Footer
└── /admin                    (선택, 후반) 카드 노출 제어 + 클립 로그
```

MVP 제외: 사이트 내부 상세 페이지, 무한 스크롤, API Key 관리 UI, 직접 글쓰기 UI(옵시디언이 그 역할).

---

## 4. 옵시디언 Vault 구조 (확정)

- **위치**: 서버(VPS)에 **직접 생성** (프로젝트별 분리 원칙, Claude-Code 관리 LLM-wiki)
- **구조**: 관례대로 `raw → schema → wiki`, 클리핑 전문은 **`raw/<채널>/`** 에 적재
```
swarm56-vault/                 (서버, CouchDB로 Peter 기기 동기화)
├── raw/
│   ├── naver_blog/   ← 기존 클리퍼(작동) 출력 이식
│   ├── notion/   ├── youtube/   ├── github/
│   ├── linkedin/ ├── instagram/ ├── facebook/ └── swarm/
│   └── (각 채널 전문 md: YYYY-MM-DD_제목.md, frontmatter + 본문)
├── schema/
└── wiki/
```
- md frontmatter: `title / source(채널) / url(원문) / published / synced_at / content_hash`
- `production/` 류 휘발성 산출물은 wiki 인제스트 대상 아님(있다면 제외)

---

## 5. 채널별 클리핑 (8채널)

원칙: **본인 계정 공식 API/RSS 자동 클리핑이 기본.** 불가/미승인 채널은 어드민 수동 등록 fallback. 비공식 스크래핑 금지.

| 채널 | 클리핑 방법 | "전문" | Tier/난이도 | 상태 |
|------|-------------|--------|-------------|------|
| 네이버블로그 | RSS + 모바일 본문 파싱 | 글 본문 | 1 | ✅ 작동(`naverblog_clipper.py`) |
| 노션 | Notion API(이 세션 MCP 있음) | 페이지 본문 | 1~2 | 신규 |
| 유튜브 | Data API v3 / 채널 RSS | 제목+설명(+자막?) | 1 | 신규 |
| 깃헙 | REST API(event allowlist) | 커밋/릴리스/레포 ※정의 필요 | 1 | 신규 |
| LinkedIn | Posts API(`r_member_social`) | 게시물 | 2B | 신규(가정 선구현) |
| Instagram | Graph API(프로 계정) | 캡션 | 2A | 신규(가정 선구현) |
| Facebook | Page Graph API | 게시물 | 2A | 신규(가정 선구현) |
| Swarm | Foursquare `users/self/checkins` | 체크인(장소+shout) | 2A | 신규(가정 선구현) |

- 모든 클리퍼 공통: **신규 추가 / 원본 변경 시 재클립(upsert)** — content-hash 비교. (Peter가 원본 수정→재업로드하므로 SKIP만으로는 수정 누락)
- API 가용성은 가정하고 선구현, 운영서 불가하면 미사용+수동 등록(D-11).

---

## 6. 데이터 모델

### 6.1 옵시디언(전문) — md 파일
단일 소스. 전문 + frontmatter. (위 §4)

### 6.2 SQLite — 카드 캐시 (옵시디언 파생)
```prisma
model FeedCard {
  id            String   @id @default(cuid())
  channel       String                       // NAVER_BLOG|NOTION|YOUTUBE|GITHUB|LINKEDIN|INSTAGRAM|FACEBOOK|SWARM
  title         String
  excerpt       String?                       // 카드용 발췌(전문 아님)
  thumbnailPath String?                        // 로컬 캐시 경로
  thumbnailKind String   @default("NONE")      // ORIGINAL|DEFAULT|NONE
  originalUrl   String   @unique               // 1차 dedup + 카드 클릭 대상
  vaultPath     String?                        // 대응하는 옵시디언 md 경로
  contentHash   String?                        // 변경 감지용
  publishedAt   DateTime
  status        String   @default("ACTIVE")    // ACTIVE|INACTIVE|DELETED
  externalId    String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@unique([channel, externalId])
  @@index([channel, status, publishedAt])
}

model SyncRun {
  id            String    @id @default(cuid())
  channel       String?
  trigger       String    @default("SCHEDULED")
  status        String                          // RUNNING|SUCCESS|PARTIAL|ERROR
  startedAt     DateTime  @default(now())
  finishedAt    DateTime?
  fetchedCount  Int       @default(0)
  upsertedCount Int       @default(0)
  skippedCount  Int       @default(0)
  errorCount    Int       @default(0)
  message       String?
  @@index([startedAt])
}
// API Key는 DB 미저장 → /etc/swarm56/agent.env (root 0640)
```
- **전문은 SQLite에 넣지 않음** — 옵시디언 md에만. SQLite는 카드 표시용 발췌/메타.
- 홈피 공개 쿼리: `status=ACTIVE`, 채널별 `publishedAt` 최신 5개.

---

## 7. 실제 운영 기준선 (검증됨)
- VPS: AWS Lightsail Ubuntu 24.04, **RAM 1GB / SSD 40GB / Swap 4GB**, Static IP `54.116.19.34`
- **CouchDB 3.5.2 운영 중** (sync.swarm56.com, 원격 검증 2026-06-27) — **유지**
- **DNS**: Cloudflare. `swarm56.com` A → 54.116.19.34 추가 완료(2026-06-27, DNS only). 해석 정상.
- ⚠️ **홈페이지 미배포**: swarm56.com 요청이 현재 CouchDB(sync) 설정으로 새고 있음(`{"error":"Database does not exist"}`, 인증서도 sync 전용). → **배포 과제**(아래 §9).
- 프로세스: systemd (PM2 아님). 에이전트 = systemd timer/cron. watchdog 불필요(클리퍼가 직접 씀).

### RAM 참고(1GB, 측정 검증 대상)
OS ~400 + Next.js ~200 + SQLite ~10 + CouchDB ~120 + 클리퍼(oneshot) ~50 → Swap 4GB 필수. CouchDB는 유지하므로 여유 빠듯 → 클리퍼는 순차·oneshot.

---

## 8. 결정 Ledger

| ID | 결정 | 상태 |
|----|------|------|
| D-0 | 옵시디언 단일소스 + 홈피 표현레이어 | 확정 |
| D-1 | 단일 페이지·앵커 네비 | 확정 |
| D-2 | 카드 노출제어 = status(ACTIVE/INACTIVE/DELETED), 자동삭제 없음 | 확정 |
| D-3 | 전문=옵시디언, SQLite=카드 캐시 | 확정 |
| D-4 | API Key = agent.env(root 0640), DB·UI 없음 | 확정 |
| D-5 | 클리퍼 upsert(content-hash) — 원본 수정 반영 | 확정 |
| D-6 | 공식 API/RSS 자동 + 불가시 수동 fallback | 확정 |
| D-7 | 8채널(노션 포함) | 확정 |
| D-8 | 볼트 = 서버 직접 생성, `raw/<채널>/` | 확정 |
| D-9 | Swarm = Foursquare Swarm, 8채널 중 하나로 동등 | 확정 |
| D-10 | 썸네일 = 파일시스템 저장 + Nginx 서빙(DBMS_REVIEW) | 확정 |
| OPS-1 | CouchDB 유지(볼트 호스팅), R8 제거 취소 | 확정 |
| OPS-2 | 도메인 DNS 수정 완료 / 홈피 배포는 미완 → 과제 | 확정 |
| OPS-3 | 헤라=Hermes·투투=OpenClaw(둘 다 Claude Code 인스턴스), 협업 GPT=Simone(GPT 웹버전) (행위자 명시) | 참고 |

---

## 9. 별도 과제 — 도메인·배포 (코딩 단계)
DNS는 됐으나 홈페이지가 swarm56.com으로 서비스되지 않음. 코딩 단계에서:
1. Nginx에 `swarm56.com`(+www) server block → Next.js `127.0.0.1:3000` 프록시
2. Let's Encrypt 인증서 `swarm56.com`(+www) 발급 (현재 sync 전용 cert만 존재)
3. Next.js 앱 실제 배포·실행(systemd) + SQLite 카드 캐시 연동

---

## 10. MVP 완료 기준
- 서버에 swarm56 옵시디언 볼트 생성 + CouchDB 동기화 확인
- 네이버·노션·유튜브·깃헙 자동 클리핑 → `raw/<채널>/` 전문 md + SQLite 카드
- IG/FB/LinkedIn/Swarm = 공식 API 가능시 자동, 불가시 수동 등록 (8채널 전원 타일 노출)
- 재클립 시 변경 반영(upsert), 신규 0이면 비용 0
- 홈피 8채널 타일, 채널당 최신 5개 카드 → 원문 링크
- swarm56.com 도메인으로 홈피 정상 접속(배포·인증서 완료)
- Critical/High 0, 백업/복원 검증
