# 현재 구현 코드 문서 — swarm56.com

> 작성: Claude (Claude Code) — 2026-06-27
> 대상: dev 브랜치 기준 현재 구현 코드

---

## 1. 기술 스택

| 구분 | 버전 |
|------|------|
| Next.js | 16.2.9 (App Router, `output: "standalone"`) |
| React | 19.2.7 |
| TypeScript | 5.x |
| Tailwind CSS | 3.4.1 |
| Prisma ORM | 6.19.3 |
| SQLite | Prisma 내장 |
| 폰트 | Inter (Google Fonts) — 기획서는 Pretendard |

---

## 2. 폴더 구조

```
homepage_project/
├── web/                              # Next.js 웹앱
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx            # 루트 레이아웃 (Inter 폰트, OG 메타)
│   │   │   ├── page.tsx              # 메인 페이지 (Server Component)
│   │   │   ├── globals.css           # 전역 스타일
│   │   │   ├── error.tsx             # 에러 바운더리
│   │   │   ├── not-found.tsx         # 404 페이지
│   │   │   └── api/
│   │   │       └── health/
│   │   │           └── route.ts      # GET /api/health
│   │   ├── components/
│   │   │   ├── site-header.tsx       # GNB (sticky)
│   │   │   ├── hero-section.tsx      # Hero + 프로필 카드
│   │   │   ├── post-list.tsx         # PostCard 목록 그리드
│   │   │   ├── post-card.tsx         # 개별 포스트 카드
│   │   │   ├── empty-posts.tsx       # 포스트 없을 때 표시
│   │   │   └── site-footer.tsx       # 푸터
│   │   ├── lib/
│   │   │   ├── db/
│   │   │   │   └── prisma.ts         # PrismaClient 싱글턴
│   │   │   └── repositories/
│   │   │       └── post-repository.ts # DB 쿼리 레이어
│   │   └── types/
│   │       └── post.ts               # Post 타입 정의
│   ├── prisma/
│   │   ├── schema.prisma             # DB 스키마
│   │   ├── seed.ts                   # 개발용 시드 데이터
│   │   └── dev.db                    # SQLite (로컬 개발용, gitignore)
│   ├── next.config.mjs               # output: standalone
│   └── package.json
├── deploy/                           # VPS 배포 패키지
│   ├── build_release_linux.sh        # Linux x86_64 빌드
│   ├── deploy_web.sh                 # VPS 배포 (symlink swap + health check)
│   ├── rollback_web.sh               # 롤백
│   ├── swarm56-web.service           # systemd 유닛
│   ├── swarm56-web.conf              # Nginx HTTPS 설정
│   ├── swarm56-web-bootstrap.conf    # Nginx HTTP-only (초기)
│   ├── web.env.example               # 환경변수 예시
│   └── migrator/
│       └── package.json              # prisma + tsx 별도 번들
├── GAP_ANALYSIS.md
├── ADDITIONAL_DEV_PLAN.md
├── ORIGINAL_DESIGN.md
├── CODE_SPEC.md                      # 이 파일
├── TECH_SPEC.md
└── SESSION_LOG.md
```

---

## 3. 모듈별 역할

### `src/app/layout.tsx`
- 전체 HTML 루트 레이아웃
- Inter 폰트 로드 (`--font-inter` CSS 변수)
- OG 메타데이터 설정 (`metadataBase: https://swarm56.com`)
- `lang="ko"` 설정

### `src/app/page.tsx`
- 메인 페이지 (Server Component)
- `connection()` 호출로 동적 렌더링 강제
- DB에서 published 포스트 조회 후 PostList에 전달
- `CHANNELS`, `PROJECTS` 배열 하드코딩
- 섹션 구성: Hero → About → Current Work → Projects → 최근 기록 → Writing & Channels → Contact

### `src/app/globals.css`
- Tailwind base/components/utilities 임포트
- `scroll-behavior: smooth`
- body 기본 폰트 스택 (Inter → Apple SD Gothic Neo → Malgun Gothic → Noto Sans KR)
- `:focus-visible` 스타일 (`#1D4ED8` 아웃라인)

### `src/app/api/health/route.ts`
- `GET /api/health`
- `prisma.$queryRaw SELECT 1`로 DB 연결 확인
- 응답: `{ status: "ok"|"degraded", db: "ok"|"error" }`
- HTTP는 항상 200 (모니터링 시 JSON 값 확인 필수)

### `src/components/site-header.tsx`
- sticky top GNB
- 좌측: `Jongseok Won` 텍스트 로고 (홈 링크)
- 중앙: About / Work / Projects / Writing / Contact (앵커 링크, `sm:` 이상 표시)
- 우측: LinkedIn 버튼
- **모바일 햄버거 메뉴 없음** (기획서 미구현)

### `src/components/hero-section.tsx`
- 좌측: 메인 카피, 서브 카피, CTA 버튼 3개 (블로그/GitHub/LinkedIn)
- 우측: 프로필 카드 (`aside`) — 이름, 직함, Current Focus 4개 항목
- `lg:` 이상에서 2열 레이아웃

### `src/components/post-list.tsx`
- `PublishedPost[]` 배열을 받아 3열 그리드로 렌더링
- 빈 배열이면 `EmptyPosts` 표시

### `src/components/post-card.tsx`
- 날짜, 제목, excerpt 표시
- 썸네일 없음, 출처 아이콘 없음, 태그 없음, originalUrl 클릭 없음
- **기획서 F-03 대비 기능 미완**

### `src/components/site-footer.tsx`
- 저작권 표시
- GitHub / LinkedIn / Blog 텍스트 링크

### `src/components/empty-posts.tsx`
- 포스트가 없을 때 안내 메시지 표시

### `src/lib/db/prisma.ts`
- PrismaClient 싱글턴 패턴
- 개발 환경: error/warn 로그
- 운영 환경: error 로그만
- `globalThis`에 캐싱 (HMR 중복 인스턴스 방지)

### `src/lib/repositories/post-repository.ts`
- `findPublishedPosts()`: status="published" + publishedAt <= now 조건으로 전체 조회
- `findPublishedPostBySlug(slug)`: slug로 단건 조회
- select 필드: id, slug, title, excerpt, content, publishedAt, updatedAt

### `src/types/post.ts`
- `PostStatus`: "draft" | "published"
- `PublishedPost` 타입: id, slug, title, excerpt, content, publishedAt, updatedAt

---

## 4. DB 스키마

```prisma
model Post {
  id          String    @id @default(cuid())
  slug        String    @unique
  title       String
  excerpt     String?
  content     String
  status      String    @default("draft")
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([status, publishedAt])
}
```

**기획서 대비 누락 필드:** summary, originalUrl, tags, sourcePlatform, thumbnailUrl
**기획서 대비 누락 테이블:** Config, SyncLog
**status 값 불일치:** published/draft (기획서는 ACTIVE/INACTIVE)

---

## 5. 데이터 흐름

```
GET /
  └── page.tsx (Server Component)
        └── findPublishedPosts()
              └── prisma.post.findMany()
                    └── dev.db / site.db (SQLite)
        └── <PostList posts={posts} />
              └── <PostCard post={post} /> × N

GET /api/health
  └── route.ts
        └── prisma.$queryRaw SELECT 1
        └── { status, db }
```

---

## 6. 배포 아키텍처

```
Internet
  → Nginx :80 → redirect :443
  → Nginx :443 (TLS 종료, Let's Encrypt)
    → proxy_pass http://127.0.0.1:3000
      → Next.js standalone (systemd: swarm56-web.service)
        → SQLite /var/lib/swarm56/web/site.db
```

### 릴리스 디렉토리 구조 (VPS)
```
/opt/swarm56/web/
├── releases/
│   └── <release-id>/
│       ├── app/          # standalone 빌드
│       └── migrator/     # prisma migrate deploy용 번들
├── current -> releases/<latest>
└── previous -> releases/<prev>
```

### 배포 흐름 (`deploy_web.sh`)
```
1. DB 백업 (/var/lib/swarm56/web/site.db.backup)
2. 새 릴리스 압축 해제 → /opt/swarm56/web/releases/<id>/
3. migrator로 prisma migrate deploy 실행
4. current 심링크 교체 (atomic)
5. systemd restart
6. GET /api/health 확인 (최대 30초)
7. 실패 시 previous로 자동 롤백
```

---

## 7. 환경변수

### 로컬 개발 (`web/.env`)
```env
DATABASE_URL=file:./prisma/dev.db
```

### VPS 운영 (`/opt/swarm56/web/current/.env`)
```env
NODE_ENV=production
HOSTNAME=127.0.0.1
PORT=3000
DATABASE_URL=file:/var/lib/swarm56/web/site.db
```

---

## 8. 주요 제약사항

- `output: "standalone"` → Next.js 빌드 결과가 self-contained Node 번들. `node server.js`로 실행.
- Prisma Client는 standalone에 포함되나 Prisma CLI는 포함 안 됨 → migrator 번들 분리 필수.
- SQLite는 단일 라이터만 안전. 현재는 Next.js만 쓰지만 에이전트 추가 시 동시성 정책 필요.
- `connection()` 호출로 page.tsx는 동적 렌더링(캐시 없음). DB 변경 즉시 반영.

---

## 9. 미구현 (GAP_ANALYSIS.md 참조)

핵심 3축 전부 미착수:
- 백오피스 `/admin`
- VPS Python 에이전트 (크롤러 / Watcher / LLM / DB Publisher)
- CouchDB Obsidian 동기화 서버
