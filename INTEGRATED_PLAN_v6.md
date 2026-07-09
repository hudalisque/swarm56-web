# 통합 기획서 v6 — swarm56 (백오피스 프로젝트 카드 + 볼트 쓰기 예외 개정)

> v6 · 2026-07-09 · 이전 버전: [INTEGRATED_PLAN_v5.md](INTEGRATED_PLAN_v5.md) (보존, v4=`INTEGRATED_PLAN.md`도 보존)
> 작성: Claude (Claude Code) + Peter 결정.
> 성격: **v5 설계를 전문 승계**하되, 백오피스 프로젝트 카드 추가 기능(2026-07-09)으로 필요해진 **원칙 개정 3건**을 반영한 개정본. v5에서 바뀐 곳엔 `[v6]` 표시.
> 관련: `BACKOFFICE_FEATURE_CONTEXT_v2.md`(기능 상세), `PROJECT_OVERVIEW_v2.md`, `VERIFICATION_CHECKLIST_v2.md`

---

## 1. v5 대비 변경점 (요약) `[v6]`

1. **Work/Projects 프로젝트 카드의 DB화** — 하드코딩 배열 → SQLite `ProjectCard` 테이블. 백오피스에서 추가(제목·요약·HTML·MD·태그), 홈은 DB 렌더링. **카드 추가에 재빌드·재배포 불필요.**
2. **프로젝트 문서 HTML 서빙** — Next `public/docs/`(빌드 고정) → **nginx `location /docs/` alias**(`/var/lib/swarm56/web/docs/`) — 기존 `/vault/`·`/thumbnails/`와 동일 패턴, 런타임 업로드 즉시 서빙.
3. **⚠️ 원칙 개정: "홈피·백오피스는 볼트에 절대 안 씀" → "`raw/` 불가 · `project/` 한정 쓰기 예외"** — 백오피스 카드 추가 시 MD를 볼트 `project/`(지식그래프용, 피드 파생 대상 밖)에 저장. 개정 이유: 개인 규모에서 가장 단순한 구조(Peter 결정 2026-07-09 "이번엔 간단하게"). **원칙 무손상이 필요해지면 중립 대기폴더+systemd `.path` 릴레이(기존 트리거 패턴)로 전환.**
   **← 이번 개정의 핵심 의사결정. 트레이드오프 비교 분석(직접쓰기 vs 릴레이) 전문 = `BACKOFFICE_FEATURE_CONTEXT_v2.md` §2-③.**
4. (운영) 백오피스 #9/#10 트리거의 systemd path-unit **서버 설치 완료(2026-07-03)** — v5 시점 미설치였던 것 복구.

v5의 나머지 설계(클리퍼·채널·이미지·발췌·삭제 방식 B·용량·마이그레이션)는 **변경 없음** — 아래에 전문 승계.

---

## 2. 아키텍처 (확정) `[v6 개정]`
```
[8채널] ──클립──▶ [옵시디언 볼트: raw/ md(전문)+이미지 · project/ md(지식그래프)]  ← 메인 DB·단일소스
                        │  (에이전트가 볼트 raw/ → 파생)
                        ▼
                  [SQLite: FeedCard 캐시 + ProjectCard]  ← 홈피측
                        │
                        ▼
                  [홈피(Next.js)]  ── SQLite 읽기 / 이미지·문서는 Nginx가 서빙(/vault/·/docs/)
                        │ 카드 클릭
                        ▼
                  [원문 외부 URL 또는 /docs/*.html]

[백오피스 /admin] ── 피드: 삭제·복원·편집(SQLite) · 트리거 파일(→systemd)
                  └─ 프로젝트 카드 추가: ProjectCard insert + HTML→docs디렉토리 + MD→볼트 project/ (⚠️한정 예외)
```
- **저장소는 둘뿐: 옵시디언 볼트(메인) + SQLite(파생 캐시+프로젝트 카드).** CouchDB 없음.
- **볼트 `raw/`는 웹이 절대 안 씀**(단일소스 보호 — 코드상 접근 경로 없음). `project/`만 백오피스 업로드 예외. `[v6]`

### 저장소 역할 `[v6 개정]`
| 저장소 | 역할 | 쓰기 주체 | 읽기 |
|--------|------|-----------|------|
| 옵시디언 볼트 `raw/` | 단일소스(전문 md + 이미지) | 에이전트, Peter(옵시디언) | 에이전트(파생용), Nginx(이미지) |
| 옵시디언 볼트 `project/` | 지식그래프용 프로젝트 문서 md (피드 파생 대상 밖) | 에이전트 아님 — **백오피스 업로드(한정 예외)** `[v6]`, Peter/scp | (향후 그래프/RAG) |
| SQLite `FeedCard` 등 | 홈피 피드 카드 캐시(볼트 파생) | 에이전트(파생 insert), 백오피스(삭제) | 홈피(읽기 전용) |
| SQLite `ProjectCard` `[v6]` | Work/Projects 카드 | 백오피스(추가) | 홈피 |
| `/var/lib/swarm56/web/docs/` `[v6]` | 프로젝트 문서 HTML(카드 링크 대상) | 백오피스(업로드) | Nginx(`/docs/` alias) |

---

## 3. 데이터 흐름 / 클리퍼 (확정 — v5 무변경)
- **자동**: 1일 1회(systemd timer). **신규 글만.**
- **새 글 처리**(볼트에 md 없을 때): ① 전문 md 작성 ② **본문 전체 이미지** 다운로드 → `_assets/<해시>` + md 링크 상대경로 치환 ③ 발췌 생성(LLM 다중+fallback) ④ SQLite 카드 insert
- **dedup = 볼트 md 존재**: md 있으면 **스킵** → 같은 글 두 번 안 받음 + **삭제 카드 자동부활 X**
- **복원/최초적재 (별도 기능)**: "볼트 md → SQLite 카드" 파생. 백오피스 복원(#4)·최초 1회 적재가 호출. (자동 클리퍼와 분리)
- **수정 반영**: 자동 안 함(느슨 동기화). 관리자 **수동 강제 갱신**(백오피스 #10)으로만 — skip 무시·재수집·덮어쓰기.

### 채널별 수집 대상 (확정 — v5 무변경) — 원칙: **"남들에게 공개로 보이는 것을 전문 클립"**
| 채널 | 클립 대상 |
|------|-----------|
| 네이버블로그 | 공개 글 전문 + 본문 이미지 |
| GitHub | **공개 레포(+릴리스)** |
| YouTube | 공개 영상 제목+설명+썸네일 (영상 자체는 링크) |
| Notion | **공개 페이지 본문(전문)** — 소스 = **전용 깨끗한 DB** `38d6855569978076822bd6a41125b90a`(신규, 작업로그 DB 아님). 토큰=`agent.env`(rotate됨). 기술: 블록 fetch |
| Swarm | 공개 체크인(장소·코멘트·사진) |
| Instagram | 공개 게시물(캡션+이미지) |
| LinkedIn·Facebook | 자동 불가 → **빈 채널**(타일은 있되 "글 없음") |

---

## 4. 이미지 저장 (확정 — v5 무변경)
- 위치: **채널별** `raw/<채널>/_assets/<해시>.<ext>` (글마다 폴더 X, 채널당 _assets 하나)
- md 링크: **로컬 상대경로** `![](_assets/<해시>.jpg)`
- 파일명 = **콘텐츠 해시** → 중복 자동 제거 + 이름 충돌 0
- 글·이미지 **모두 볼트에 보존**. (원격 링크 의존 X — 네이버 핫링크 차단/인스타 URL 만료 때문)

## 5. 이미지·문서 웹 서빙 (확정) `[v6 확장]`
- **Nginx가 볼트 경로 직접 서빙**(alias), 이미지 확장자만 허용 + `nosniff`. 무복제, 볼트=단일소스 유지.
- `[v6]` **프로젝트 문서 HTML도 Nginx alias**: `location /docs/` → `/var/lib/swarm56/web/docs/`. 빌드와 무관하게 런타임 업로드 파일 즉시 서빙(기존 3장 html도 이 디렉토리로 1회 이관, URL 불변).

## 6. 홈피 읽기 (확정) `[v6 소폭]`
- 홈피(Next.js)는 **SQLite만 읽음**(빠름, 볼트 안 건드림) — 피드는 `FeedCard`, Work/Projects는 `ProjectCard` `[v6]`. 이미지·문서는 위 Nginx 경로로.

## 7. 발췌(카드 요약) (확정 — v5 무변경)
- 생성: **클립 때 1회** (홈피는 LLM 호출 안 함).
- 방식: **LLM 다중 provider(Peter 구독들) 순차 → 전부 실패 시 truncation(단순 자르기) 최후 fallback.** (API 의존성이 파이프라인 인질로 못 잡게)
- 모델: GPT-4o-mini 등. 키는 서버 `agent.env`(0640). 재시도 ≤ N회 후 fallback.

## 8. 삭제·복원 (확정 — 방식 B: 삭제 의도 보존, v5 무변경)
**원칙: 삭제는 Peter의 의도 → 한 번 삭제하면 전체 재파생/재구축에도 다시 안 나타난다. 명시적 복원 때만 되살아난다.**
- **FeedCard엔 status 없음.** 삭제 = ① **SQLite FeedCard 행 제거** + ② **`SuppressionRecord` 기록**(이 URL은 숨김 의도).
- **파생/재파생 규칙**: 볼트 md → SQLite 카드 생성 시, **활성 SuppressionRecord가 있는 URL은 스킵**(카드 안 만듦). → 전체 재파생해도 **부활 X**.
- **자동 클리퍼**: 볼트 md 존재 시 스킵(효율). 삭제 카드는 suppression으로도 이중 보호.
- **복원**: 백오피스 → SuppressionRecord 해제(`restoredAt` 기록) + 볼트 md에서 카드 재파생.
- 볼트 md 자체는 **항상 보존**(지식 원본). 삭제 = '홈피 표시 억제'지 '지식 삭제'가 아님.
- (숨김/삭제 별도 구분 없음 — "삭제=표시 억제 + 복원 가능"으로 통합)
- `[v6]` 프로젝트 카드(`ProjectCard`)는 이 방식과 무관 — **추가 전용**(삭제·편집 UI 없음, 필요 시 수기).

**구현 핵심 4 (필수):**
1. **삭제 키 = `originalUrl`** — 재파생 후에도 **안정적으로 동일한 값**이어야 매칭됨 (vaultPath 보조)
2. **재파생 전에 tombstone을 먼저 조회** → 활성 suppression URL은 **카드 생성 전에 스킵**
3. **복원 = tombstone 해제 + 카드 재삽입을 하나의 원자적(atomic) 작업** (부분 상태 금지)
4. **삭제·복원 모두 감사 로그에 who / when / target(originalUrl) 기록**
> (A안 = 재파생 한 번에 삭제가 무효화 → 관리 기능으로 무의미 → **채택 안 함**)

## 9. 용량 (확정 — v5 무변경)
- 개인 규모 · 영상 없음 · 고화질 없음 → **용량 비제약**, 이미지 원본 포함 보존.
- 안전장치: **디스크 임계(서킷브레이커) 1개**(예 80% 도달 시 신규 이미지 다운로드 중단 + 로그, 텍스트는 계속). 1장/장수 캡은 형식적 백업.
- `[v6]` 업로드 문서: HTML·MD 각 **4MB 상한**(서버 액션 body 10MB) — 개인 문서 규모로 충분.

## 10. 설계 가정 · 비목표 (debuggability — v5 무변경)
- **가정**: 개인 규모, 단일 작성자, **느슨 동기화**.
- **비목표(out of scope)**: 실시간/빡센 동기화. 필요해지면 **재설계 트리거**(현 캐시·dedup 모델로는 부족).
- 이 경계를 명시해 나중에 "왜 이렇게 설계했나" 추적 가능.

---

## 11. 백오피스 기능명세 (확정) `[v6 확장]`
*(피드 기능은 SQLite만 다룸. 프로젝트 카드 추가만 볼트 project/ 예외. 인증 후 접근.)*

| # | 기능 | 동작 |
|---|------|------|
| 1 | 로그인/인증 | 단일 관리자 비번 + 세션 쿠키(HttpOnly/Secure/SameSite) |
| 2 | 카드 목록 조회 | 채널·날짜·원문URL 등 카드 일람 |
| 3 | 삭제 | SQLite 행 **hard delete** + **확인 단계**(정말 삭제?) |
| 4 | 복원 | **볼트 md에서 재삽입** (실수 삭제 복구 수단) |
| 7 | 제목/발췌 편집 | SQLite 카드 수정 (볼트 불변) · 저장 성공 시 폼 자동 닫힘 |
| 8 | SyncRun 로그 조회 | 클리핑 실행 이력(중/완료/실패) — 디버깅 · KST 표기 |
| 9 | **지금 클리핑(수동 트리거)** | 버튼 → 트리거 파일 기록 → **systemd path-unit이 에이전트 실행**(2026-07-03 설치·검증 완료). 요청 접수 배너. 신규만(skip 유지) |
| 10 | **강제 갱신(force re-clip)** | 특정 글/전체 **skip 무시** 재수집 → md·이미지·카드 덮어쓰기 (= 원본 수정 반영) |
| 11 | **프로젝트 카드 추가** `[v6]` | 폼(제목·요약·HTML·MD·태그) → 검증(확장자·4MB·파일명 sanitize·중복 거부) → HTML=docs 디렉토리 · MD=볼트 `project/` 저장 → `ProjectCard` insert + 감사 `PROJECT_ADD`(한 트랜잭션, 부분 실패 시 파일 롤백) → 성공/실패 배너 |
| 12 | **프로젝트 카드 삭제** `[v6.1 — 2026-07-10]` | 확인 단계 → DB 행 + 감사 `PROJECT_DELETE`(트랜잭션) → **HTML·볼트 md 파일도 제거**(동일 파일명 재업로드=수정 워크플로우 지원). 시드 카드는 볼트 md 보존. 편집 UI 없음 — 수정 = 삭제 후 재업로드 |

- **제외**: 5 숨김, 6 피드 수동등록 (글은 소셜미디어에 직접 작성 → 클리핑됨). **프로젝트 카드 편집·삭제 UI도 제외**(추가 전용 — Peter 지시, 필요 시 수기 런북). `[v6]`
- **실수 삭제 안전장치**: 확인 단계 + 복원(#4). 볼트 원본이 늘 보존되므로 **손실 0**. (옵션: "최근 삭제됨" 목록 원클릭 복원)
- **#9 단서(동의됨)**: '바로'=클립 완료까지 수 초~수십 초(즉시 아님), 진행상황은 #8 SyncRun으로 표시, (옵션) 특정 채널만 클립.

### 보안·인증 (확정) `[v6 확장]`
- **로그인**: 단일 관리자 비밀번호, **bcrypt/argon2 해시 보관**(평문 X), 아이디 불필요.
- **세션**: 서명 쿠키 **HttpOnly·Secure·SameSite=Lax**, 만료 12h, `SESSION_SECRET`=env (stateless, 서버 세션 스토어 불필요).
- **rate limit**: 로그인 무차별 대입 방어(예 분당 5회).
- **/admin 이중 가드**: 서버 가드(레이아웃) + **모든 서버액션 세션 검증**.
- **감사 로그**: 관리자 작업(삭제/복원/강제갱신/**카드 추가** `[v6]`) — **who / when / target** 기록(추적·디버깅용).
- `[v6]` **업로드 방어**: 확장자 화이트리스트(.html/.md), 크기 상한 4MB, `basename`+`[a-z0-9-]` sanitize(경로 traversal 차단), `wx` 플래그(동일 파일명 거부·덮어쓰기 방지), 실패 시 저장 파일 롤백 + `PROJECT_ADD_FAILED` 감사(성공 위장 금지). 볼트 접근은 `project/` 경로 상수 고정 — `raw/` 접근 코드 자체가 없음.
- **IP 제한**: 없음 (비번 + rate limit으로 충분).
- **비밀 위치**: 채널 토큰·LLM 키 = `/etc/swarm56/agent.env`(0640) / 백오피스 **비번 해시·SESSION_SECRET** = 웹앱 env. 코드·Git에 비밀 0.
- 전송 HTTPS(Let's Encrypt). 백오피스 권한 경계: SQLite + 트리거 파일 + docs 디렉토리 + 볼트 `project/`만. `[v6]`

## 12. 후속/보류 (v5 무변경)
- **CouchDB 물리 처리 (결정)**: 아키텍처에선 제거. 서버 서비스는 **일단 유지(살려둠).** 제거 트리거 — ① 개발 완료 후 미사용이 확실해지면, 또는 ② 개발 중 RAM 부족 시 → **사용처 확인 후** 중지/제거. (지금은 안 건드림 — `KNOWN_ISSUES_v2.md` 참조)

## 13. 데이터 모델 (확정) `[v6 확장]`
**볼트 md = 전부 담음 (소스).**
- frontmatter: `title · channel · source · url(원문) · published · synced_at · content_hash · external_id · excerpt · thumbnail(대표 이미지 상대경로)`
- body: **전문 + 본문 이미지 전부**(`_assets`)

**SQLite FeedCard = 필수만 (가볍게).**
- `id · channel · title · excerpt · thumbnailPath · originalUrl(unique) · vaultPath · publishedAt · externalId · createdAt · updatedAt`
- **제거**: `status` · `thumbnailKind` · `contentHash` (SQLite엔 안 둠 — content_hash는 **볼트에만**, 재클립 판단용)
- **원문 URL = 볼트(`url`) + SQLite(`originalUrl`) 둘 다 보관**

**SQLite ProjectCard (v6 신설):**
- `id · title · description · docPath(unique, "/docs/<file>.html") · tags(쉼표 구분) · createdAt · updatedAt`
- 정렬 = `createdAt asc`. 시드 = 마이그레이션 `20260709030000_project_card`에 포함.
- **실제 표시 순서(Peter 확정 2026-07-09): 새 카드가 맨 앞, 시드 3장이 뒤.** (시드 createdAt=문자열 vs 앱 저장=숫자 → SQLite에서 숫자 우선 정렬. 발견 후 "그냥 둬" 결정 — 최신 우선이 자연스러움)

**SuppressionRecord (SQLite, 별도 테이블 — 삭제 의도 보존, 방식 B):**
- `id · originalUrl · vaultPath · deletedAt · deletedBy · reason · restoredAt(null=활성)`
- **활성(restoredAt=null)** suppression = 해당 URL **카드 파생 안 함**(전체 재파생에도 부활 X). 복원 시 `restoredAt` 기록.
- FeedCard엔 status 없음 — **삭제 의도는 이 테이블이 보존**(FeedCard는 표시 캐시만).

**대표 썸네일 규칙**: 본문 **첫 이미지** → 카드 thumbnailPath. (없으면 기본 이미지)

**매핑 (md → 카드)**: title→title · url→originalUrl · published→publishedAt · channel→channel · excerpt(LLM/앞부분)→excerpt · 대표이미지→thumbnailPath · md경로→vaultPath · external_id→externalId

## 14. 마이그레이션 (v5 절차 준용) `[v6 소폭]`
**원칙: 만들어 검증한 뒤, 라이브에 무중단·무손실로 적용. 라이브에서 바로 개발 안 함.**
1. **개발·검증 분리**: 로컬/브랜치에서 완성·검증 (라이브에 직접 X)
2. **백업 먼저**: 적용 직전 `site-v5.db`·볼트·앱 스냅샷
3. **새 코드 배포**: surgical in-place(변경 파일만 cp, dir swap 금지)
4. `[v6]` **DB 마이그레이션**: `prisma migrate deploy`(ProjectCard 신설 — 기존 테이블 무변경) + docs 디렉토리 생성·기존 3 html 이관 + nginx `/docs/` 블록
5. **검증 게이트**: 외부 https 200 · 기존 카드 3장 회귀 · 새 카드 추가 E2E · 이미지/문서 서빙 · 삭제/복원 · 클리퍼 정상 → 통과해야 완료. **배포 후 서버 스모크 테스트 필수**(2026-07-03 교훈 — 서버 전용 인프라는 서버에서 실측)
6. **롤백**: 실패 시 백업으로 즉시 복구

**검증 (필수, Loop Engineering §9)**: 모든 구현은 **`VERIFICATION_CHECKLIST_v2.md`** 로 **매 단계 체크박스 통과 후 다음 단계.**

## 15. 범위 밖 / 미래 (이번 개발 아님 — v5 무변경)
- **그래프 + RAG**: 데이터 축적 + Peter 지시 후 착수 (지금은 위치만 표시). 백오피스 카드 추가가 `project/`에 md를 쌓아 지식그래프 소스가 자동 축적됨. `[v6]`

## 16. 제약 `[v6 개정]`
- 홈피·백오피스 = 볼트 **`raw/` 쓰기 금지**(코드상 접근 경로 없음). 볼트 쓰기 예외는 **백오피스 카드 추가의 `project/` 저장 하나뿐** — 추가 예외는 Peter 명시 승인 필요.
- 옵시디언 단일소스·SQLite 파생 구조는 Peter 명시 지시 없이 변경 금지.
- 비가역 작업(스키마 변경 등)은 백업 후 + 승인.
- `[v6]` 원칙 무손상(웹의 볼트 무접촉)이 다시 필요해지면: 대기폴더+systemd `.path` 릴레이로 전환(기존 트리거 패턴 재사용) — 재설계 트리거로 명시.
