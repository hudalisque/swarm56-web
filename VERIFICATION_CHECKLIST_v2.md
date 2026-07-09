# swarm56 — 검증 체크리스트 v2

> v2 · 2026-07-09 · 이전 버전: [VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md) (보존 — v5 검증에 사용됨, 판정 기록은 검증 리포트 3종 참조)
> 변경 사유: ① 정본이 `INTEGRATED_PLAN_v6.md`로 개정(볼트 project/ 예외·ProjectCard) ② **R9 백오피스 프로젝트 카드 추가** 검증 항목 신설 ③ **배포 후 서버 스모크 테스트 게이트** 신설(2026-07-03 트리거 사건 교훈 — 서버 전용 인프라는 repo/로컬 검증으로 증명 불가).
> **목적**: 구현이 `INTEGRATED_PLAN_v6.md` 설계대로 됐는지 **매 단계 확인.** 근거: CLAUDE.md §9 Loop Engineering "단계별 검증".

## 표기 규칙

```
[ ] = 미구현 또는 미검증
[~] = 구현자가 구현 및 자체시험 완료
[x] = 독립 검증자가 증거를 확인하고 PASS 판정
```
- **구현자는 항목을 `[x]`로 변경하지 않는다.** 최종 `[x]` 판정은 **독립 검증자**가 수행.
- 검증 상태 병기: `PASS` / `FAIL` / `BLOCKED` / `NOT TESTED` / `NOT APPLICABLE`
- **PASS는 검증 계층을 명시한다**: `PASS/local`(로컬·코드) ≠ `PASS/prod`(서버 실측). **좁은 PASS가 넓은 미검증을 덮지 않는다** — "로컬서 트리거 파일 생성됨"은 "서버서 에이전트 실행됨"의 증거가 아니다. (07-03 교훈)
- 잔여위험/NOT TESTED 항목은 **소유자+종료 조건**을 붙여 추적 — 닫히기 전 해당 기능 "완료" 보고 금지.

---

## 0. Loop Engineering 공통 (모든 단계 적용 — v5 검증 완료분 + v2 갱신)
- [ ] **상태 영속성**: 각 단계 출력이 파일/DB(볼트·SQLite·SyncRun)에 기록 — 중단 후 재개 가능
- [ ] **주 데이터 흐름**: 채널 → 볼트 raw/ → SQLite → 홈페이지
- [ ] **역방향 원문 수정 금지**: SQLite·홈페이지·백오피스가 볼트 **raw/** 원문 MD를 수정하지 않음
- [ ] **관리 흐름 분리 `[v2 개정]`**: 백오피스 = SQLite 편집 + 트리거 파일 + **docs/볼트 project/ 업로드(한정 예외)** 만 수행 — raw/ 접근 코드 없음
- [ ] **클리핑 실행 흐름**: 백오피스 → 트리거 파일 → systemd path-unit → Python clipper (**서버에서 E2E 실측** — 07-03 복구·검증됨)
- [ ] **부작용 격리** · **멱등성** · **탈출/재시도 규칙** · **문서화**(v6 문서 세대로 참조 가능)

---

## 1~8. v5 검증 항목 (승계)

v1 체크리스트 §채널계약·§1 클리퍼·§2 파생/복원·§3 홈피·§4 백오피스·§5 스키마·§6 마이그레이션·§7 전수대조·§8 독립검증 준비 — **내용 유지, 참조만 갱신**(`INTEGRATED_PLAN_v5` → `_v6`). v5 판정 기록은 `verification_swarm56_web_*.md`·`FINAL_VERIFICATION_REPORT_b2638f1.md` 참조.
v2에서 달라진 항목만 재검증 대상:
- [ ] §3 홈피: Work/Projects 섹션이 **DB(ProjectCard) 렌더링**으로 — 기존 3장 표시 회귀 없음
- [ ] §4 백오피스: "볼트 안 건드림" → **"raw/ 안 건드림 + project/ 한정 업로드"** 로 판정 기준 개정 (v6 §16)
- [ ] §5 스키마: `ProjectCard` 테이블(docPath unique·tags·createdAt) + 마이그레이션 `20260709030000_project_card`(시드 3장)

---

## 9. `[v2 신설]` R9 — 백오피스 프로젝트 카드 추가

### 9.1 기능 (로컬/코드)
- [ ] 폼: 제목·요약·HTML(필수)·MD(필수)·태그 — 미입력 시 거부
- [ ] 검증: 확장자 화이트리스트(.html/.md만) / 4MB 상한 / 파일명 sanitize(basename+`[a-z0-9-]`, traversal 차단) / **동일 파일명 거부**(`wx` 플래그)
- [ ] 저장: HTML→`SWARM56_DOCS_DIR`, MD→`SWARM56_VAULT_DIR/project/` — **경로 상수 고정, raw/ 접근 코드 없음** (코드 라인 증거)
- [ ] 원자성: ProjectCard insert + `PROJECT_ADD` 감사 = 한 트랜잭션 / **부분 실패 시 저장 파일 롤백 + `PROJECT_ADD_FAILED` 감사**(성공 위장 금지)
- [ ] redirect가 try 밖(NEXT_REDIRECT 미삼킴) / 성공·실패 배너 표시
- [ ] 시드 3장이 기존 하드코딩 값과 1:1 일치(제목·설명·태그·URL·순서)
- [ ] `npm run build`·`lint`·로컬 dev.db `migrate deploy` 통과

### 9.2 서버 (배포 후 실측 — PASS/prod만 인정)
- [ ] DB 백업 후 `migrate deploy` — 기존 테이블 무변경, ProjectCard 생성+시드 3행
- [ ] nginx `/docs/` alias + 기존 3 html 이관 → **기존 URL 3개 `HTTP 200` 회귀 없음**(nginx 경유 확인)
- [ ] 홈 `/` 200 + 기존 카드 3장 표시(DB에서) / 관리자 로그인 정상(.env 회귀 없음)
- [ ] **E2E**: 테스트 카드 추가 → `/docs/<new>.html` 200 → 홈 노출 → 서버 `vault-v5/project/<new>.md` 존재 → 감사 `PROJECT_ADD`
- [ ] 거부 경로 실측: 확장자 불일치 / 중복 파일명 → 빨간 배너 + 파일 미생성
- [ ] **볼트 안전**: `raw/` 무변화(파일 목록 diff) + 다음 정기 클리핑(04:00 UTC) SyncRun 정상
- [ ] 테스트 카드 정리(DB 1행 + 파일 2개)

---

## 10. `[v2 신설]` 배포 후 서버 스모크 테스트 (매 배포 공통 게이트)

> 근거: 2026-07-03 사건 — systemd 유닛 미설치로 트리거가 미작동인 채 라이브. **서버 전용 인프라(systemd·nginx·cron) 의존 기능은 서버에서 1회 실행 확인 없이 "완료" 금지.** (`verification/PROCESS_RETROSPECTIVE.md` §5.1)

- [ ] 홈 `/` = 200 (외부 HTTPS)
- [ ] 관리자 로그인 성공 (env 회귀 없음)
- [ ] 대표 자산 URL 200: `/vault/...webp` · `/thumbnails/...` · `/docs/...html`
- [ ] systemd 유닛 상태: `swarm56-web` active · `swarm56-agent.timer` 대기 · `swarm56-clip/force.path` active
- [ ] (기능 배포 시) 해당 기능의 서버 E2E 1회 실측
- [ ] `DEPLOYED_SHA` 갱신 확인 + 코드 드리프트 0 (`diff -rq app ↔ v5build`)
- [ ] 잔여 NOT TESTED 항목: 소유자·종료 조건 기록 (나열로 방치 금지)

> **증거 요구**: 각 항목은 `코드 파일·줄번호` / `실행 명령` / `exit code` / `HTTP 응답` / `SQLite query` / `로그 경로` 중 **하나 이상**. **증거 없는 `[x]`는 인정하지 않는다.**
