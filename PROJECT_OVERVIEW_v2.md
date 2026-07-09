# swarm56 — 프로젝트 개요 v2 (Project Overview)

> v2 · 2026-07-09 · 이전 버전: [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) (보존)
> 변경 사유: **백오피스 프로젝트 카드 추가 기능** — 아키텍처 3건 변경(카드 DB화 · /docs nginx 서빙 · 웹→볼트 project/ 쓰기 예외) + 온디맨드 트리거 유닛 설치 완료(2026-07-03) 반영.
> 핵심 주제: **이종 멀티에이전트(hetero-multi-agent) 협업 워크플로우** — swarm56.com은 그 워크플로우로 만든 산출물(케이스 스터디).
> 관련: `INTEGRATED_PLAN_v6.md`, `BACKOFFICE_FEATURE_CONTEXT_v2.md`, `VERIFICATION_CHECKLIST_v2.md`, `KNOWN_ISSUES_v2.md`

---

## 1. 프로젝트 개요

### 목적 — 흩어진 활동을 모으는 퍼스널 소셜미디어 허브

원종석은 네이버블로그·GitHub·YouTube·Notion·Instagram·Swarm 등 **여러 채널**에 글·코드·영상·메모를 흩어 발행한다. **swarm56.com의 1차 목적은 이 흩어진 활동을 한 곳에 자동으로 모아, 방문자가 "원종석이 무엇을 생각하고 무엇을 하는가" — 그의 철학과 활동 흐름을 한눈에 보게 하는 퍼스널 소셜미디어 허브**다. 채널마다 쪼개진 정체성을 **하나의 큐레이션된 피드**로 통합한다.

### 두 층위

1. **산출물 (Product)** — 위 목적을 구현한 `swarm56.com`. **8개 채널 → 자동 수집 → 통합 카드 피드** + **Work/Projects 프로젝트 문서 카드**(백오피스에서 추가).
2. **핵심 주제 (Process / 연구)** — 그것을 **만드는 과정 자체**. 서로 다른 종류의 AI 에이전트·도구를 역할별로 협업시키는 **이종 멀티에이전트 워크플로우(hetero-multi-agent workflow)** 의 확립·사례화. **Peter의 평소 멀티에이전트 연구 주제와 직접 맞닿아 있다**(논문/책 자료화).

> 산출물의 목적은 **"흩어진 나를 한 곳에 모으는 허브"**, 그 과정의 핵심은 **"이종 에이전트들이 협업해 만든 방법"**. 요구사항 정리부터 디자인·구현·**검증까지 전 과정**을 에이전트들이 릴레이로 수행했다.

---

## 2. ★ Hetero-Multi-Agent Workflow (핵심)

단일 AI에 전부 맡기지 않고, **이종(異種)의 AI 에이전트·도구**를 *오케스트레이션 / 디자인 / 구현 / 검증* 역할로 나눠 협업시킨다. 강점이 다른 모델·도구를 조합하고, 역할 간 **견제·검증**으로 신뢰성을 확보한다.

### 2.1 협업 변천사 (실제 진행)
```mermaid
timeline
  title swarm56 협업 변천사
  요구사항·설계 : Peter 요구사항 → Antigravity가 청취·정리 → 워크플로우 설계 + 디자인툴(Relume·V0) 선정
  오케스트레이터 공석 : Antigravity 교체·하차 → 오케스트레이터 자리 비움
  체제 재편 : Peter + ChatGPT(Simone) 공동 오케스트레이션 + Peter 릴레이 + Claude 구현
  검증·미완 발견 : Codex 독립 검증 → 1차 "완료"였으나 구현 미완·재현불가 다수 발견
  모델 교체 : Opus로 교체 → 재구현·재검증 → Agentic Engineering Execution Protocol 탄생
  운영 클로징 : 트리거 미작동 발견(미이행 후속검증) → 복구 + 검증절차 회고 → 백오피스 기능 확장
```
1. **요구사항·초기 설계** — Peter 요구사항을 **Antigravity**(Google Gemini 에이전트)가 청취·정리 → 워크플로우 설계 + **디자인 에이전트(Relume·V0 by Vercel) 선정**. (초기 오케스트레이터/아키텍트)
2. **오케스트레이터 공석** — 협업 중 Antigravity가 교체되어 하차.
3. **체제 재편** — 이전 프로젝트처럼 **Peter + ChatGPT(=Simone)** 가 오케스트레이션을 맡고, **Peter가 에이전트 간 릴레이**, **Claude가 구현**.
4. **1차 검증 → 미완 발견** — 화면엔 카드가 떠 "완료" 보고됐지만, **Codex 독립 검증**에서 구현 미완·재현불가·배포 미연결 다수 발견(Prisma P3005, `/vault` Nginx 누락, systemd 트리거 부재, lint 미실행, 세션 secret fallback 등). *"보이는 완료 ≠ 실제 완료."*
5. **Opus로 모델 교체 → 재구현·재검증** — 구현 모델을 Opus로 올려 미완분 수정·재검증. 이 경험이 **Agentic Engineering Execution Protocol**(구현·동결·검증·수정·재검증 운영 절차)을 낳음.
6. **운영 클로징 사건(2026-07-03)** — 라이브 후 백오피스 트리거 버튼이 실제로는 미작동임을 발견. 원인은 검증이 남긴 "서버 실행 미검증" 후속 항목의 **미이행**(체크리스트·검증 자체는 정확했음) → 복구 + **배포 후 서버 스모크 테스트 게이트** 교훈 확립(`verification/PROCESS_RETROSPECTIVE.md`).

→ **요구사항·디자인·구현·검증 전 과정이 멀티에이전트 협업.** 핵심 교훈:
> **에이전트 말 = 가설 · commit = 검증대상 · 실행로그 = 증거 · 독립검증 = 판정 · Owner = 최종승인.** 좋은 구현 = Functional · Conformance · Reproducibility · Operational 4기준 충족. (상세: Notion *"'완료했습니다'를 믿지 않게 된 날"*) — Peter의 연구 **Context-Preserving Multi-Assistant Collaboration Layer**(맥락 + 책임·증거의 연속성)와 직결.

**검증 자체도 멀티에이전트다** — **Claude**가 검증 기준(`VERIFICATION_CHECKLIST_v2.md`) 작성 → **Codex**가 그에 의거해 **독립 검증**(라운드별 commit SHA 고정, 증거 기반 PASS/FAIL, delta 재검증) → **ChatGPT(Simone)가 Peter의 자문역**(체크리스트 검토·진단 확인). 즉 구현뿐 아니라 **검증 절차 자체가 역할 분담된 멀티에이전트** 과정.

### 2.2 역할별 참여 에이전트
| 에이전트 / 도구 | 종류 | 역할 | 단계/시기 |
|---|---|---|---|
| **Antigravity** | Google Gemini 에이전트 | 초기 오케스트레이터·아키텍트: 요구사항 정리, 워크플로우 설계, 디자인툴(Relume·V0) 선정 | 초기 (이후 교체) |
| **Peter (원종석)** | 인간 | 오케스트레이터(공동)·결정권자·**릴레이** | 전 단계 |
| **ChatGPT (Simone)** | OpenAI GPT | 공동 오케스트레이터 + **Peter 자문역**(설계·체크리스트 검토) | 오케스트레이션·자문 |
| **Relume** | 디자인 AI | 사이트 구조·와이어프레임·컴포넌트 라이브러리 | 디자인 |
| **V0 by Vercel** | 디자인 AI | UI 컴포넌트 생성(React/Tailwind 코드) | 디자인 |
| **Claude (투투/OpenClaw)** | 코딩 AI | 구현·통합·문서화 + **검증 체크리스트 작성** | 구현·검증 |
| **Codex** | 검증 AI | 체크리스트 의거 **독립 검증**(증거 기반 PASS/FAIL) | 검증 |
| **Hermes (헤라)** | 코딩 AI(별도 Claude) | 연구 보조 | 보조 |

> "이종(hetero)" = 서로 다른 벤더·종류의 AI(Antigravity·Relume·V0·Claude·Codex·GPT)를 한 워크플로우에 조합.

### 2.3 설계 철학 — Boris Cherny "Loop Engineering"
이 워크플로우·시스템은 **Boris Cherny의 Loop Engineering 철학**을 설계 단계에서 반영했다. 그래서 **단계별 상태저장 + 지속 검증**을 계속한다.
- **상태 영속성** — 각 단계 출력을 외부에 기록, **체크포인트**로 중단 후 재개. (예: 옵시디언 볼트=메인 DB이자 상태 저장소, 단계별 산출물 파일화)
- **단계별 검증** — 다음 단계 진입 전 현재 단계 검증(Codex 독립 검증 게이트, 검증 체크리스트) + **배포 후 서버 스모크 테스트**(2026-07-03 교훈).
- **탈출/재시도 규칙** — 최대 재시도·중단 조건 명시.
- **멱등성·재개 가능** — 클리퍼는 언제 재실행해도 안전.
- **단방향 데이터 흐름** + 부작용(side effect) 격리.

### 2.4 거버넌스 (신뢰성 장치)
`CLAUDE.md` 헌법: **승인 추론 금지** · **계획≠실행** · **행위자 명시** · **실행증거 없는 완료보고 금지** · **메모리 무결성** · 구현(Claude)/검증(Codex) 분리(자가검증 불인정). 문서는 **버전 신규 작성 + 원본 보존**(수정 전 상태의 기록 유지).

### 2.5 협업 통신
Slack `#all-agent-collab`(핸드오프 실험) · Notion Journal(업무일지·위반사례·Work Note) · 검증 산출물(`VERIFICATION_CHECKLIST_v2.md`).

---

## 3. 요구사항

### 3.1 목적·배경 (왜 만드나)
- **통합(Hub)** — 8개 채널에 흩어진 글·활동을 한 곳에 모아 보여준다.
- **정체성** — 방문자가 원종석의 **철학·관심사·활동 흐름**을 한눈에 파악하게 한다.
- **최신성** — 새 글이 손 안 대고 **자동(일 1회)** 반영된다.
- **소유·통제** — 원본은 내 옵시디언 볼트에 **영속 보관**, 노출 여부는 내가 **통제**(삭제/복원/편집)한다.
- **(v2 추가) 자가 운영** — 프로젝트 문서 카드를 개발자 손 없이 **백오피스에서 직접 추가**한다(코드 수정·재배포 불필요).

### 3.2 기능
- 채널별 **카드 피드 + 채널 필터**, 카드 → **원문 링크**(본문 이미지 포함).
- **Work/Projects 프로젝트 카드** — 백오피스에서 **추가**(제목·요약·HTML 문서·MD 문서·태그). 홈은 DB에서 렌더링.
- 백오피스(`/admin`): 로그인, 피드 카드 **삭제/복원/편집**, **프로젝트 카드 추가**, 수집 이력(SyncRun), **"지금 클리핑"/"강제 갱신"** 수동 트리거(요청 접수 배너), 감사 로그(KST 표기).
- **삭제 의도 영속**(재수집해도 부활 안 함), **일 1회 자동 수집**.

### 3.3 비기능
단방향 데이터 흐름 · 멱등성·재개 가능 · **볼트 쓰기 권한: 클리핑 에이전트(raw/) + 백오피스 업로드(project/ 한정 예외)** — 홈피·백오피스의 `raw/` 접근은 코드상 불가 · 비밀은 **env로만** · 개인 규모(1GB VPS) 운영.

> **원칙 개정 이력(2026-07-09)**: v1 "홈피/백오피스는 볼트 읽기전용" → 백오피스 카드 추가 기능으로 **`project/`(지식그래프, 피드 파생 대상 밖) 한정 쓰기 예외** 신설. 이유: 개인 규모에서 가장 단순한 구조(Peter 결정 "이번엔 간단하게"). 원칙 무손상이 필요해지면 **중립 대기폴더 + systemd .path 릴레이**(기존 트리거 패턴 재사용)로 전환 — `BACKOFFICE_FEATURE_CONTEXT_v2.md` §2 참조.

---

## 4. 기술 스펙

| 영역 | 스택 |
|---|---|
| 홈피/백오피스 | Next.js 16, React 19, TypeScript, Tailwind v4 |
| ORM/DB | Prisma 6.19, SQLite |
| 클리핑 에이전트 | Python 3.12 (requests, beautifulsoup4, markdownify, Pillow) |
| 발췌 | LLM 다중 provider → truncation fallback |
| 볼트 / 동기화 | 옵시디언(Markdown+이미지) / CouchDB livesync(`sync.swarm56.com`) |
| 디자인 | Relume(구조/와이어프레임), V0 by Vercel(UI 컴포넌트) |
| 배포 | AWS Lightsail(Ubuntu), systemd, Nginx, Let's Encrypt |

---

## 5. 아키텍처 — 채널에서 허브까지의 데이터 흐름

이 프로젝트의 심장은 **"8개 채널에 흩어진 글이 어떻게 자동으로 홈페이지의 통합 피드가 되는가"** 다. 흐름은 **단방향**이며, 각 단계가 파일/DB에 상태를 남겨(상태 영속성) 언제든 **재개**할 수 있다. v2에서 **관리 흐름(백오피스 프로젝트 카드)** 이 추가됐고, 피드 파이프라인과 격리되어 있다.

### 5.1 전체 데이터 흐름 (수집 → 허브)
```mermaid
flowchart TB
  subgraph SRC[① 8개 소셜 채널 — 흩어진 발행]
    direction LR
    C1[네이버블로그]
    C2[GitHub]
    C3[YouTube]
    C4[Notion]
    C5[Swarm]
    C6[Instagram]
    C7[LinkedIn*]
    C8[Facebook*]
  end
  SRC --> COL[② 클리핑 에이전트<br/>collectors/ 채널별 수집기]
  COL -->|Phase A — 전문 md + 본문이미지 webp + 링크치환 + LLM 발췌<br/>dedup = content_hash| VAULT[(③ 옵시디언 볼트 = 메인 DB<br/>raw/&lt;채널&gt;/*.md + _assets/*.webp<br/>+ project/*.md 지식그래프<br/>원본 영속 보관)]
  VAULT -->|Phase B — 파생, 활성 suppression URL 스킵<br/>raw/만 대상| DB[(④ SQLite 파생캐시<br/>site-v5.db<br/>FeedCard + ProjectCard)]
  DB --> WEB[⑤ 홈페이지 swarm56.com<br/>통합 카드 피드 + Work/Projects 카드]
  DB --> ADMIN[백오피스 /admin<br/>피드: 삭제·복원·편집<br/>프로젝트 카드: 추가]
  ADMIN -.->|삭제의도 = SuppressionRecord| DB
  ADMIN -.->|수동 트리거 파일 → systemd .path| COL
  ADMIN -.->|카드 추가: HTML → docs 디렉토리<br/>MD → 볼트 project/ ⚠️한정 예외| VAULT
  VAULT -.->|이미지 /vault/ alias| WEB
```
> `*` LinkedIn·Facebook은 현재 **빈 채널**(공식 API 제약, UI 플레이스홀더).

- **Phase A (클립)** — 채널 → 볼트 md(전문) + 본문 이미지(webp 재인코딩·SSRF 차단) + 링크 치환 + LLM 발췌. 중복은 `content_hash`로 제거.
- **Phase B (파생)** — 볼트 **`raw/`** md → SQLite `FeedCard`. **활성 suppression URL은 스킵**(삭제 의도 보존). `project/`는 파생 대상 밖.
- **관리 흐름 (v2 신설)** — 백오피스 카드 추가: `ProjectCard` insert + HTML→`/var/lib/swarm56/web/docs/`(nginx 서빙) + MD→볼트 `project/`(지식그래프). **피드 파이프라인과 완전 격리**(raw/ 무접촉), 감사 로그 `PROJECT_ADD`.

### 5.2 삭제 영속성 — "방식 B" (tombstone)
```mermaid
flowchart LR
  DEL[관리자: 카드 삭제] --> R["FeedCard 제거<br/>+ 활성 SuppressionRecord(tombstone) 생성"]
  R --> RE[이후 재파생 / 재수집]
  RE -->|suppression URL 스킵| NO[부활하지 않음 ✓]
  RES[관리자: 복원] --> T[tombstone 해제<br/>+ 볼트 md 재삽입]
  T --> BACK[다시 노출]
```
삭제 키 = `originalUrl`. 모든 변경은 **원자적 트랜잭션** — 재실행해도 안전(멱등). (피드 카드에만 해당 — 프로젝트 카드는 추가 전용, 삭제·편집 UI 없음)

### 5.3 배포 토폴로지
```mermaid
flowchart LR
  U[방문자] -->|HTTPS 443| NGINX[Nginx + Let's Encrypt]
  NGINX -->|reverse proxy :3000| NEXT[swarm56-web<br/>Next.js · npm start]
  NGINX -->|/vault/ alias| IMG[볼트 이미지 webp]
  NGINX -->|/thumbnails/ alias| THUMB[썸네일]
  NGINX -->|/docs/ alias ← v2 신설| DOCS[프로젝트 문서 HTML<br/>런타임 업로드 즉시 서빙]
  NEXT -->|읽기·쓰기| DB[(site-v5.db)]
  TIMER[swarm56-agent.timer<br/>매일 04:00 UTC] --> AGENT[클리핑 에이전트] --> VAULTD[(옵시디언 볼트)]
  PATHU[swarm56-clip/force.path<br/>온디맨드 트리거 · 2026-07-03 설치] --> AGENT
  VAULTD --> DB
```
Lightsail VPS(Ubuntu) · 앱 `/opt/swarm56/app` · 볼트 `/var/lib/swarm56/vault-v5` · DB `/var/lib/swarm56/web/site-v5.db` · 문서 `/var/lib/swarm56/web/docs`. (서버 주소·SSH는 로컬 전용 `AGENTS_v2.md`·메모리 참조 — public repo에 미기재)

---

## 6. 모듈별 역할

**클리핑 에이전트(`agent/`)**: `main.py`(Phase A/B 오케스트레이터, FORCE) · `collectors/`(채널별) · `vault.py`·`db.py`(볼트 입출력·dedup / 파생·suppression·SyncRun) · `images.py`·`excerpt.py`(본문이미지 webp·SSRF / LLM 발췌·truncation) · `settings.py`(env).
**홈피/백오피스(`personal-brand-hub/`)**: `app/page.tsx`·`app/admin/`(page·actions·edit-card) · `components/`(hero·about·header·footer·feed-card·**projects-section=DB 렌더링**) · `lib/admin-repo.ts`(삭제B·복원·편집·트리거·감사·**listProjectCards/addProjectCard**) · `lib/auth.ts`(bcrypt·세션·rate limit) · `lib/feed-repository.ts`·`lib/md-frontmatter.ts` · `prisma/schema.prisma`(FeedCard·**ProjectCard**·SuppressionRecord·AdminAudit·SyncRun).

---

## 7. 채널 현황

| 채널 | 상태 | 수집 |
|---|---|---|
| 네이버블로그·GitHub·YouTube·Notion·Swarm·Instagram | ✅ LIVE | RSS/API/스크래핑 |
| **LinkedIn · Facebook** | ⛔ 빈 채널 | 공식 API 제약 → UI 플레이스홀더(자동수집 안 함) |

---

## 8. 향후 로드맵

- **옵시디언 지식그래프 시각화** — 볼트 노드/링크를 홈피에 그래프뷰로 (직접구현 / Quartz / Obsidian Publish).
- **RAG** — 볼트 임베딩 → 의미검색·질의응답("내 글에게 물어보기").
- **미연동 채널** LinkedIn·Facebook → 백오피스 수동 등록 검토.
- **프로젝트 카드 편집·삭제 UI** — 필요해지면(현재는 추가 전용 + 수기 런북).
- **볼트 쓰기 릴레이 전환** — 원칙 무손상 필요 시 대기폴더+systemd .path 방식으로.
- **운영 보완** — GitHub 릴리스 수집, 토큰 rotate, SSH 키 repo 밖 이동, 잠재 이슈는 `KNOWN_ISSUES_v2.md`.
- ~~트리거 path-unit 설치~~ → **완료(2026-07-03)**.

---

## 9. 운영 메모

- 서버: AWS Lightsail(Ubuntu). 앱 `/opt/swarm56/app`(npm start), DB `/var/lib/swarm56/web/site-v5.db`, 볼트 `/var/lib/swarm56/vault-v5`, 문서 `/var/lib/swarm56/web/docs`, 에이전트 `/opt/swarm56/agent`(+venv). systemd `swarm56-web`·`swarm56-agent.timer`·`swarm56-clip/force.{path,service}`. 접속 정보는 로컬 전용 문서·메모리 참조(public repo 미기재).
- 배포: surgical in-place — `v5build git pull` → 변경 파일만 cp → `npm run build` → restart → `DEPLOYED_SHA` 갱신. **dir 전체 swap 금지(.env 보호)**. 상세: `BACKOFFICE_FEATURE_CONTEXT_v2.md` §5.
- **프로젝트 카드 추가는 배포 불필요** — `/admin`에서 직접 (운영 런북: `BACKOFFICE_FEATURE_CONTEXT_v2.md` §6).
- 롤백: `app.old-*`·구 DB·백업 보존. 문구 수정: `personal-brand-hub/components/홈피_문구_수정가이드.md`.
