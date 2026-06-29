# 백오피스 기능 컨텍스트 — 프로젝트 카드 관리 + 볼트 업로드

> 작성: 2026-06-29 [Claude (Claude Code)] · 상태: **설계 대기(미착수)**
> 목적: 다음 세션에서 이 기능을 바로 설계·구현할 수 있도록 요구사항·현황·결정사항을 남김.

## 1. 배경 / 목표
Peter 요구 — swarm56.com 백오피스(`/admin`)에서:
1. Work/Projects **카드 추가/수정** (제목 + 짧은 설명 + 링크/문서 + 태그)
2. 문서를 **볼트 `project/` 폴더에 업로드** (지식그래프용 `.md`)
→ 매번 Claude가 SSH로 수기 처리하던 것을 백오피스 기능으로 대체.

## 2. 현재 상태 (2026-06-29 기준)
- 프로젝트 카드 = `personal-brand-hub/components/projects-section.tsx`의 **하드코딩 배열**(`projects: Project[]`). 현재 3장: swarm56 프로젝트 개요 · Small Vill 메타연구 · MSI 시스템 문서. 모두 `/docs/*.html` 링크.
- 공개 문서 = `personal-brand-hub/public/docs/*.html` 정적 호스팅(Next `public/`, nginx 무변경).
- 볼트(`/var/lib/swarm56/vault-v5`) = **웹/백오피스에서 읽기전용**, 쓰기는 클리핑 에이전트만. 오늘 지식그래프용 md 3개는 Claude가 SSH로 `vault-v5/project/`에 **수기** 배치(임시 방편).
- 기존 백오피스 = feed 카드 삭제/복원/편집·SyncRun·트리거·감사로그 (`lib/admin-repo.ts`, `app/admin/`).

## 3. 구현해야 할 것
### 3.1 카드 DB화 (핵심 선결 조건)
- Prisma 새 모델 `ProjectCard` (id, title, description, href, tags, sortOrder, published, createdAt/updatedAt) + 마이그레이션.
- 홈피 `projects-section.tsx` → DB에서 읽도록 변경(서버 컴포넌트 + repo 함수, `lib/feed-repository.ts` 패턴 참고).
- 시드: 현재 하드코딩 3장 이관.
### 3.2 백오피스 카드 관리 UI
- `/admin`에 ProjectCard CRUD(추가/수정/삭제/순서). 폼: 제목 · 짧은 설명 · 링크(내부 `/docs` 또는 외부 URL) · 태그.
- 서버 액션 + 감사로그(기존 `AdminAudit` 패턴).
### 3.3 볼트/문서 업로드
- `/admin` 파일 업로드: `.md` → 서버 볼트 `project/`(지식그래프), `.html` → `/docs/`(카드 링크).
- 보안: 확장자 화이트리스트(.md/.html), 크기 제한, 파일명 sanitize, 경로 traversal 차단, (선택) HTML sanitize.

## 4. 결정해야 할 설계 사항
1. ⚠️ **볼트 쓰기 원칙 변경** — 현재 "웹=볼트 읽기전용". 백오피스 업로드는 볼트에 쓰는 새 경로 → `project/`만 예외 허용할지 / 별도 저장소·에이전트 경유할지 결정.
2. **public/docs 런타임 쓰기 문제** — `next start`는 빌드 시점 `public/`을 서빙. 런타임 업로드 파일을 서빙하려면 (a) nginx `/docs/` → 서버 디렉토리(예: `/var/lib/swarm56/docs`) alias, (b) Next route handler 서빙, (c) 업로드 후 재빌드. → **권장: (a) nginx alias** (빌드 독립, 런타임 업로드 가능).
3. 카드 링크 타입 — 내부 문서(`/docs`) vs 외부 URL 모두 허용.
4. 업로드 시 `.md`(볼트) + `.html`(카드) 동시 받을지, 변환할지.
5. 인증/권한 — 기존 admin 세션 재사용.

## 5. 워크플로우 / 제약
- 구현 = Claude, **검증 = Codex**(Prisma 마이그레이션 clean-DB 검증 포함), **배포 = Peter 승인 후**.
- 커밋·푸시·운영변경은 승인 필요. 배포는 surgical 방식(메모리 `swarm56-deploy-status` 참고), `DEPLOYED_SHA` 갱신.

## 6. 관련 파일·경로
- 카드: `personal-brand-hub/components/projects-section.tsx`
- 백오피스: `app/admin/`, `lib/admin-repo.ts`, `lib/auth.ts`, `prisma/schema.prisma`
- 호스팅 문서: `personal-brand-hub/public/docs/`
- 볼트(서버): `/var/lib/swarm56/vault-v5/project/`
- **정식 문서 소스 경로**: MSI 브리프 = `D:\Agent_Workspace\ms-intel_brief\5. production\output\` (ms-newsletter 아님!), 메타연구 = `D:\Agent_Workspace\multi-Agents meta research\output\`

## 7. 오늘 수기 배치 내역 (참고)
- 볼트 `project/`: `PROJECT_OVERVIEW.md`(swarm56) · `2026-06-17-small-vill-meta-research.md` · `documentation.md`(MSI)
- 카드: Auto Report → **"MSI 시스템 문서"** (`/docs/msi-documentation.html`)로 교체

## 8. 오늘 고민한 내용 (의사결정 맥락)
- 시작은 "문서 1개 올리고 카드 1개 추가"였는데, 반복 작업이라 **"백오피스 기능으로 만들자"**로 확장됨.
- 핵심 깨달음: 카드가 **하드코딩**이라, 백오피스에서 추가하려면 **카드 DB화가 선결**. (§3.1)
- 텐션 1: 백오피스가 볼트에 쓰는 건 **"웹=볼트 읽기전용"** 원칙을 바꾸는 결정. (§4-1)
- 텐션 2: `public/docs`는 빌드 시점에 굳어 **런타임 업로드 파일 서빙이 안 됨** → nginx alias 권장. (§4-2)
- 결정: **오늘은 3개 수기 배치(옵션 3)**, 기능은 별도 설계로 미룸. + 이 컨텍스트 문서를 남겨 다음 세션이 이어가게 함.
- 보안/검증: 업로드는 검증 필요, 구현=Claude·검증=Codex·배포=승인. (§5)

## 9. 수기로 문서/카드 1개 추가하는 절차 (런북 — 기능 완성 전까지)
> 다음에도 하나씩 추가할 수 있으니, 컨텍스트 없이도 따라 할 수 있게 기록. **서버 접속·SSH 키·IP·배포 명령·DEPLOYED_SHA·surgical 배포 방식은 메모리 `swarm56-deploy-status` 참조** (여기엔 비밀/IP 미기재). **운영변경·push는 Peter 승인 후에만.**

**A. 지식그래프용으로 볼트에만 올릴 때 (.md):**
1. 대상 `.md` 확보 (정식 소스 경로 §6).
2. `scp`로 서버 `/var/lib/swarm56/vault-v5/project/`에 복사 (폴더 없으면 `mkdir -p`).
3. 확인: `ls`. → 홈피 feed엔 영향 없음(`raw/` 밖이라 Phase B 파생 대상 아님).

**B. 카드로도 노출할 때 (.html + 카드):**
1. `.html`을 repo `personal-brand-hub/public/docs/<name>.html`로 복사.
2. `components/projects-section.tsx`의 `projects` 배열에 카드 추가/교체:
   `{ name, description, tags: [...], url: '/docs/<name>.html' }`.
3. 지식그래프도 원하면 A(볼트 .md)도 수행.
4. **commit + push** (승인 후) — 카드 파일들만 add.
5. **배포(승인 후, surgical)**: v5build `git pull` → 변경 파일만(`projects-section.tsx` + `public/docs/<name>.html`)을 `/opt/swarm56/app`에 복사 → `npm run build` → `systemctl restart swarm56-web` → `DEPLOYED_SHA` 갱신.
6. **검증**: `curl /docs/<name>.html`=200, `/`에 카드 노출, (볼트면) 서버 `project/`에 파일 존재.

**금지:** app 디렉토리 전체 swap(.env 날아가 로그인 깨짐) · 볼트 `raw/`에 project 문서 넣기(피드로 파생됨).
