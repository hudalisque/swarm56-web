# 현재 구현 기술 명세 — swarm56.com

> 2026-06-27 기준. Anti-Gravity 퇴출 이후 GPT+Claude Code가 구현한 상태.
> 작성: Claude (Claude Code)

---

## 프로젝트 구조

```
homepage_project/
├── web/                          # Next.js 웹앱
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx        # 루트 레이아웃 (Pretendard 폰트)
│   │   │   ├── page.tsx          # 메인 페이지 (Server Component)
│   │   │   ├── globals.css       # 전역 스타일
│   │   │   └── api/
│   │   │       ├── health/route.ts   # GET /api/health
│   │   │       └── posts/route.ts    # GET /api/posts
│   │   ├── components/
│   │   │   ├── site-header.tsx   # GNB
│   │   │   ├── hero-section.tsx  # Hero
│   │   │   ├── post-list.tsx     # PostCard 목록 컨테이너
│   │   │   ├── post-card.tsx     # 개별 포스트 카드
│   │   │   └── site-footer.tsx   # Footer
│   │   ├── lib/
│   │   │   └── repositories/
│   │   │       └── post-repository.ts  # DB 쿼리 레이어
│   │   └── types/
│   │       └── post.ts           # Post 타입 정의
│   ├── prisma/
│   │   ├── schema.prisma         # Prisma 스키마
│   │   └── seed.ts               # 개발용 시드 데이터
│   ├── package.json
│   ├── next.config.ts            # output: "standalone"
│   └── tsconfig.json
├── deploy/                       # VPS 배포 패키지
│   ├── build_release_linux.sh    # Linux x86_64 빌드
│   ├── deploy_web.sh             # VPS 배포 (symlink swap + health check)
│   ├── rollback_web.sh           # 롤백 (--restore-db 옵션)
│   ├── swarm56-web.service       # systemd 유닛
│   ├── swarm56-web.conf          # Nginx HTTPS 설정
│   ├── swarm56-web-bootstrap.conf # Nginx HTTP-only (초기 부트스트랩)
│   ├── web.env.example           # 환경변수 예시
│   └── migrator/
│       └── package.json          # prisma + tsx (standalone용 별도 번들)
├── ORIGINAL_DESIGN.md            # Anti-Gravity 원본 기획
├── SESSION_LOG.md                # 릴레이 대화 기록
├── TECH_SPEC.md                  # 이 파일
├── ADDITIONAL_DEV_PLAN.md        # 미구현 추가 개발 계획
└── .gitignore
```

---

## 기술 스택

| 구분 | 현재 사용 버전 |
|------|---------------|
| Next.js | 15.2.9 (App Router, output: standalone) |
| React | 19.2.7 |
| Prisma | 6.9.0 |
| SQLite | (Prisma 내장) |
| TypeScript | 5.x |
| Tailwind CSS | 4.x |
| Node.js (빌드) | WSL2 Ubuntu 24.18.0 (Linux x86_64) |

---

## DB 스키마 (현재 상태)

```prisma
model Post {
  id             String    @id @default(cuid())
  slug           String    @unique
  title          String
  summary        String?
  content        String?
  thumbnailUrl   String?
  originalUrl    String?   @unique
  sourcePlatform String    @default("blog")
  tags           String    @default("[]")
  status         String    @default("ACTIVE")
  publishedAt    DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([status, publishedAt])
}

model Config {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String
  updatedAt DateTime @updatedAt
}

model SyncLog {
  id       String   @id @default(cuid())
  status   String
  message  String
  syncTime DateTime @default(now())
}
```

> 주의: migration 미실행 상태. dev.db는 아직 이전 스키마(Post만, excerpt/content 사용).

---

## 배포 아키텍처

```
Internet
  → Nginx :80/:443 (TLS 종료)
    → Next.js standalone 127.0.0.1:3000
        → SQLite /var/lib/swarm56/web/site.db
```

- 릴리스 심링크: `/opt/swarm56/web/current → releases/<id>`
- 롤백: `previous` 심링크 보존
- DB 백업: deploy 전 자동 `.backup` 파일 생성
- Health check: `GET /api/health` HTTP 200 + `{"status":"ok","db":"ok"}`

---

## API 엔드포인트

### GET /api/health
```json
{ "status": "ok", "db": "ok" }
```
- db가 오류 시: `{ "status": "degraded", "db": "error" }` (HTTP 200 유지)
- 모니터링 시 JSON `status` 값 확인 필수 (HTTP 코드만 보면 안 됨)

### GET /api/posts
```json
[{ "id": "...", "title": "...", "summary": "...", "publishedAt": "..." }]
```

---

## 홈페이지 섹션 구성 (현재)

1. **GNB** (site-header.tsx) — About / Work / Projects / Contact 메뉴
2. **Hero** (hero-section.tsx) — 메인 카피 + 서브카피
3. **About** — 소개 텍스트 + 4개 키워드 카드 (하드코딩)
4. **Current Work** — Software / Business Intelligence / Workflow (하드코딩)
5. **Projects** — 3개 프로젝트 카드 (하드코딩)
6. **최근 기록** — DB에서 ACTIVE 포스트 조회 + PostCard 렌더링
7. **Writing & Channels** — 6개 채널 링크 카드 (Blog, GitHub, LinkedIn, Notion, Instagram, Facebook) (하드코딩)
8. **Contact** — LinkedIn/GitHub/Blog 링크 버튼
9. **Footer** (site-footer.tsx)

---

## 미구현 (기획서 대비)

- `/admin` 백오피스 전체
- 카테고리 필터 탭
- Load More 페이지네이션
- 출처 아이콘
- 카드 클릭 → originalUrl
- 썸네일 표시 (migration 후 구현 예정)
- VPS 에이전트 (Python)
- CouchDB 동기화 서버
- v0.dev 시안 반영

상세 내용: `ADDITIONAL_DEV_PLAN.md`

---

## 환경변수 (VPS 운영)

```env
NODE_ENV=production
HOSTNAME=127.0.0.1
PORT=3000
DATABASE_URL=file:/var/lib/swarm56/web/site.db
ADMIN_PASSWORD_HASH=<bcrypt hash>
```

---

## GitHub

레포: `https://github.com/hudalisque/swarm56-web` (public)
푸시 완료: 2026-06-26
