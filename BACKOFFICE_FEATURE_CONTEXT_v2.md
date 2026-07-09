# 백오피스 기능 컨텍스트 v2 — 프로젝트 카드 추가 기능 (구현 완료)

> 작성: 2026-07-09 [Claude (Claude Code)] · 상태: **구현 완료(로컬) — 배포 대기**
> 이전 버전: [BACKOFFICE_FEATURE_CONTEXT.md](BACKOFFICE_FEATURE_CONTEXT.md) (2026-06-29 설계 대기 시점 — 보존, 수기 런북 §9 포함)

## 1. 무엇이 만들어졌나

`/admin`에서 **Work/Projects 카드 추가**가 가능해짐. 폼 입력 = **제목 · 요약 · HTML 파일(카드 링크 대상) · MD 파일(볼트 지식그래프용) · 카테고리 태그(쉼표 구분)**.
제출 한 번으로: 카드 DB 등록 + HTML 서빙 + 볼트 반영이 동시에 처리. **재빌드·재배포 불필요.**

범위(Peter 지시): 추가 + **삭제**(2026-07-10 추가 — "삭제 후 같은 파일명 재업로드 = 수정 효과"가 운영 방식이므로 삭제가 필수). 편집/순서변경 UI 없음.
**삭제 동작**: DB 행 + `PROJECT_DELETE` 감사(트랜잭션) → HTML·볼트 md **파일도 제거**(안 지우면 재업로드가 중복 거부에 걸림). 볼트 md 파일명은 추가 당시 감사 기록에서 복원 — 시드 3장은 ADD 기록이 없어 **볼트 md는 보존**(수기 배치 원본). 확인 단계(disclosure) 포함.

## 2. 아키텍처 변경 (v1 §4의 결정사항이 이렇게 확정됨)

| # | 변경 전 | 변경 후 |
|---|---|---|
| ① 카드 데이터 | `projects-section.tsx` 하드코딩 배열 (카드 1장 = 코드수정+배포) | **SQLite `ProjectCard` 테이블** (site-v5.db) — 홈이 DB에서 읽음, 기존 3장은 마이그레이션 시드로 이관 |
| ② HTML 서빙 | Next `public/docs/` (빌드 시점 고정) | **nginx `location /docs/` alias** → `/var/lib/swarm56/web/docs/` (기존 /vault/·/thumbnails/ 패턴, 런타임 업로드 즉시 서빙) |
| ③ 볼트 MD | Claude가 SSH/scp 수기 배치 | **웹이 `vault-v5/project/`에 직접 저장** — "웹=볼트 읽기전용" 원칙의 유일한 예외 |

**③ 핵심 의사결정 — 아키텍처 원칙 트레이드오프 (Peter, 2026-07-09)**

> 이번 기능의 **가장 중요한 결정**. v5 아키텍처 불변식 "웹=볼트 읽기전용"을 실용주의적으로 개정한 것으로, 아래 비교 분석 후 Peter가 결정했다: **"간단하게 구현했다가 나중에 필요하면 원칙대로 바꾸지 뭐. 이번에는 간단하게."**

| | **직접 쓰기 (project/ 한정 예외) — 채택** | 대기폴더+systemd 릴레이 (예외 없음) |
|---|---|---|
| 원칙 | `project/` 한정 예외 1개 생김 | 원칙 무손상 |
| 구현/부품 | 단순 (코드 몇 줄) | `.path` 유닛+이동 스크립트 추가, 반영이 몇 초 비동기 |
| 실질 위험 | `raw/` 접근은 코드상 차단이라 낮음 | 더 낮음 (웹은 볼트 접근 자체가 없음) |

- 논의 경위: "HTML→MD 변환으로 하면 예외를 피하냐"는 질문이 있었으나, **변환이든 업로드든 볼트에 쓰는 주체가 웹인 건 동일** → 예외 회피가 아님을 확인. 원칙을 지키는 유일한 구조는 릴레이뿐임을 확인한 뒤 규모 대비 단순함을 택함.
- **복귀(업그레이드) 경로 — 원칙 무손상이 필요해지면:** 웹은 중립 대기폴더(예: `/var/lib/swarm56/inbox/`)에만 쓰고, systemd `.path` 유닛이 감지해 `project/`로 이동 — "지금 클리핑" 트리거와 동일한 검증된 패턴 재사용. (`INTEGRATED_PLAN_v6.md` §16에 재설계 트리거로 등재)

**불변:** 클리핑 파이프라인(채널→볼트 `raw/`→FeedCard→홈 피드), 인증, 트리거, 기존 카드 3장 URL. 업로드 코드는 `raw/` 접근 경로 자체가 없음(경로 상수 고정 + basename sanitize).

## 3. 변경 파일 (전부 로컬, 미커밋 — Peter 지시로 git 작업 없음)

| 파일 | 내용 |
|---|---|
| `personal-brand-hub/prisma/schema.prisma` | `ProjectCard` 모델 추가 |
| `personal-brand-hub/prisma/migrations/20260709030000_project_card/` | CREATE TABLE + UNIQUE(docPath) + **시드 3장 INSERT**(기존 하드코딩 값 그대로) — ※표시 순서는 **새 카드가 맨 앞**(시드=문자열·앱저장=숫자 createdAt, SQLite 숫자 우선 — Peter 확정 2026-07-09 "그냥 둬") |
| `personal-brand-hub/lib/admin-repo.ts` | `listProjectCards()` · `addProjectCard()` — 파일 검증(.html/.md만, 4MB 상한, basename+`[a-z0-9-]` sanitize, `wx` 플래그로 덮어쓰기 방지), 부분 실패 시 저장 파일 롤백 + `PROJECT_ADD_FAILED` 감사 후 에러 전파(성공 위장 금지) |
| `personal-brand-hub/app/admin/actions.ts` | `addProjectCardAction` — redirect는 try 밖(NEXT_REDIRECT 삼킴 방지), 실패 사유를 배너 쿼리로 전달 |
| `personal-brand-hub/app/admin/page.tsx` | "프로젝트 카드" 섹션(현황 목록 + 추가 폼) + 성공/실패 배너 |
| `personal-brand-hub/components/projects-section.tsx` | DB 기반 async 서버 컴포넌트로 전환(마크업 동일, tags는 쉼표 split) |
| `personal-brand-hub/next.config.mjs` | `experimental.serverActions.bodySizeLimit: '10mb'` (기본 1MB로는 업로드 부족) |
| `deploy/swarm56-web.conf` | `location /docs/` alias 블록 추가(repo=source of truth, 드리프트 방지) |

환경변수(코드 기본값 있어 서버 .env 변경 불필요): `SWARM56_DOCS_DIR`(기본 `/var/lib/swarm56/web/docs`), `SWARM56_VAULT_DIR`(기존 값 사용).

## 4. 로컬 검증 결과 (2026-07-09)

- 마이그레이션: 로컬 dev.db에 `prisma migrate deploy` 적용 성공, 시드 3장 확인(한글 UTF-8 정상 저장 검증)
- `npm run build`: ✅ Compiled successfully (serverActions 실험 키 인식됨, 전 라우트 정상)
- `npm run lint`: ✅ 통과
- **미검증(서버에서만 가능):** 실제 업로드 E2E, nginx alias 서빙, 프로덕션 마이그레이션 — §5 배포 후 검증 필수 (지난 트리거 사건 교훈: 서버 전용 경로는 서버에서 실측)

## 5. 배포 절차 (승인 후 — surgical, 메모리 swarm56-deploy-status)

1. **서버 DB 백업**: `cp /var/lib/swarm56/web/site-v5.db /var/lib/swarm56/web/site-v5.db.bak-$(date +%Y%m%dT%H%M)` ← 마이그레이션 선행 필수
2. 서버 준비: `mkdir -p /var/lib/swarm56/web/docs` + 기존 3개 html 복사(`/opt/swarm56/app/public/docs/*.html` →) + nginx에 `/docs/` 블록 추가 + `nginx -t` + reload
3. 로컬 커밋 → **Peter push**(public repo) → 서버 `cd /opt/swarm56/v5build && git pull`
4. 변경 파일만 `/opt/swarm56/app`에 cp — **dir swap 금지(.env 보호)**: admin 2파일, projects-section.tsx, lib/admin-repo.ts, next.config.mjs, prisma/(schema+새 마이그레이션 폴더)
5. `/opt/swarm56/app`에서 `npx prisma migrate deploy` → `npx prisma generate` → `npm run build` → `sudo systemctl restart swarm56-web` → `DEPLOYED_SHA` 갱신

### 배포 후 검증 (서버 스모크 — 회고 개선안 적용)
1. 기존 URL 회귀: `/docs/project-overview.html` 등 3개 = 200(nginx 경유 확인: `curl -sI`에 X-Powered-By 없음), 홈에 기존 카드 3장 표시(이제 DB)
2. 관리자 로그인 정상(.env 회귀 없음)
3. **E2E**: 테스트 카드 추가 → `/docs/<new>.html` 200 → 홈 노출 → 서버 `vault-v5/project/<new>.md` 존재 → 감사로그 `PROJECT_ADD`
4. 볼트 안전: `raw/` 무변화, 다음 정기 클리핑(04:00 UTC) 정상
5. 거부 경로: 확장자 불일치·중복 파일명 → 빨간 배너로 거부
6. 테스트 카드 제거: `sqlite3 site-v5.db "DELETE FROM ProjectCard WHERE docPath='/docs/<test>.html'"` + 파일 2개 삭제

## 6. 카드 추가 운영 런북 (배포 후 — 이제 이렇게만 하면 됨)

1. 문서 준비: HTML(카드용) + MD(지식그래프용), **영문 파일명**(한글 파일명은 거부됨)
2. `/admin` 로그인 → **프로젝트 카드 (Work/Projects)** → **+ 카드 추가**
3. 제목 / 요약 / HTML / MD / 태그(쉼표) 입력 → 카드 추가
4. 초록 배너 확인 → 홈 새로고침으로 카드 확인. 실패 시 빨간 배너에 사유 표시(감사로그에도 기록)
