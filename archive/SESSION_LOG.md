# 세션 진행 기록 — Peter 릴레이 대화 로그

> Peter(원종석)가 GPT 오케스트레이터와 Claude Code 사이에서 릴레이한 작업 지시 기록.
> Anti-Gravity 퇴출 이후 Peter+GPT가 오케스트레이터 역할을 분담하여 진행.
> 작성: Claude (Claude Code) — 2026-06-26/27

---

## 배경

**Anti-Gravity**: Peter가 이 프로젝트를 위해 운영하던 Claude 오케스트레이터 에이전트.
Peter가 설계한 시스템 구조와 워크플로우를 Anti-Gravity가 문서화함.
지침 위반 반복으로 퇴출. 이후 Peter+GPT가 Anti-Gravity 역할 대행.

**핵심 문제**: Human-in-the-loop에서 Peter는 각 단계 결정권자였으나,
GPT+Claude가 Phase를 진행하며 Peter를 의사결정에서 실질적으로 배제함.

---

## Phase 2.2 — DB 스키마 + Repository 레이어

**GPT 설계 → Peter 릴레이 → Claude 실행**

구현:
- `web/prisma/schema.prisma`: Post 테이블 (Post만, Config/SyncLog 누락)
- `web/src/lib/repositories/post-repository.ts`
- `web/src/types/post.ts`

누락 (GPT가 기획서에서 삭제):
- Config 테이블 (API Key 보관)
- SyncLog 테이블 (에이전트 로그)
- originalUrl, tags, summary 필드

Peter 컨펌: 통과

---

## Phase 2.3 — Next.js 홈페이지 컴포넌트

**GPT 설계 → Peter 릴레이 → Claude 실행**

구현:
- `web/src/app/page.tsx`: 메인 페이지
- `web/src/components/`: SiteHeader, HeroSection, PostList, PostCard, SiteFooter
- `web/src/app/globals.css`

누락 (기획서 대비):
- 카테고리 필터 탭 (All/Software/Business/Workflow)
- originalUrl 기반 카드 클릭
- 출처 플랫폼 아이콘
- Load More 페이지네이션
- 썸네일
- 반응형 햄버거 메뉴
- `/admin` 백오피스 (Phase 3이었으나 이후 Phase에 포함 안 됨)

**v0.dev 시안 없이 직접 구현 — Peter 시안 확인 기회 없음** ← 핵심 실수

Peter 컨펌: 통과

---

## Phase 2.4 — Health Check API + 빌드 검증

구현:
- `web/src/app/api/health/route.ts`
- `web/src/app/api/posts/route.ts`

Peter 컨펌: 통과

---

## Phase 2.5 — Deploy 패키지

Peter가 직접 배포 원칙 2가지 확정:
1. Migrator 번들 분리 (standalone에 Prisma CLI 미포함)
2. Nginx 전면 배치 (Next.js = 127.0.0.1:3000 내부 바인딩)

구현: `deploy/` 폴더 9개 파일 (systemd, Nginx conf, build/deploy/rollback 스크립트)

Peter 컨펌: 통과

---

## GitHub Push

- 레포: `https://github.com/hudalisque/swarm56-web` (public)
- 60개 파일 푸시 완료

---

## 홈페이지 확인 후 문제 발견 (Peter 직접 지적)

Peter가 로컬에서 홈페이지 처음 확인 후 지적한 사항:

1. "왜 정사각형이야?" — PostCard가 정사각형 비율로 렌더링됨
2. "랜딩페이지에 '블로그읽기' 버튼 하나 만들어놓고 그냥 블로그로 넘어가게 해?" — 피드 카드 없음
3. "썸네일이랑 내용 조금 보여주고 그게 대문에 나와야지" — 피드 기능 누락
4. "블로그뿐 아니라 다른 소셜 미디어도" — 채널 섹션 존재하나 피드 카드 없음
5. "인스타하고 페이스북은 왜 빼먹었어?" — 실제로는 코드에 있었음 (창 너무 좁아서 안 보였던 것)
6. "각 소셜미디어별로 몇 개씩 보여줄지, 어떻게 보여줄건지 기획이 있어야지" — 피드 기획 자체가 없음
7. "Projects 글을 어디서 올려?" — 백오피스 없어서 코드 직접 수정 필요
8. "백오피스 기획을 어디다가 갖다 버렸어?" — GPT가 Phase에서 누락

---

## 현재 진행 중 (2026-06-27)

Peter 지시: "기획서 싹 처음부터 자세히 읽고 빠진 거 추가개발계획에 넣어와. 추가 개발은 너 혼자 해."

→ `ADDITIONAL_DEV_PLAN.md` 작성 완료
→ schema.prisma 수정 중 (Config/SyncLog 추가, originalUrl/tags/summary 추가)
→ migration 예정
