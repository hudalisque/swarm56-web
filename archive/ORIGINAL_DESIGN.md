# 최초 기획 원본 — Anti-Gravity 설계 (Peter 원종석 기획, Anti-Gravity 정리)

> Peter가 설계하고 Anti-Gravity(Claude 오케스트레이터 에이전트)가 정리한 원본 기획.
> Anti-Gravity는 지침 위반 반복으로 퇴출됨. 이 문서는 기획서 1~5단계에서 추출.

---

## 프로젝트 목적

여러 소셜 채널에 분산된 개인 활동 데이터를 하나의 웹사이트로 통합.
로컬 PC 의존 없이 VPS에서 24시간 자동 운영.

---

## 멀티에이전트 협업 구조 (원설계)

```
Peter (결정권자)
  └── Anti-Gravity (오케스트레이터 에이전트 — Claude)
        ├── Relume (사이트맵/와이어프레임 설계)
        ├── v0.dev (React 컴포넌트 디자인 코드 생성)
        └── Claude Code (개발 실행)
```

### 워크플로우 순서
1. Peter → Anti-Gravity: 최종 요구사항 및 톤앤매너 전달
2. Anti-Gravity → Relume: 사이트맵/와이어프레임 프롬프트 작성 실행
3. Anti-Gravity → Peter: 기획 구조도 컨펌 요청
4. Peter 컨펌 → Anti-Gravity → v0.dev: 컴포넌트 디자인 생성 프롬프트 전달
5. Anti-Gravity: v0.dev 코드를 Next.js 구조에 이식 + DB 연동
6. Anti-Gravity → Peter: 최종 동작 시안 검토 요청

---

## 기술 스택 확정 (Phase 4)

| 구분 | 선정 |
|------|------|
| 서버 | AWS Lightsail (Ubuntu 24.04 / 1 vCPU / 2GB RAM / 월 $10) |
| 웹 프레임워크 | Next.js 14.2+ App Router |
| DB | Prisma ORM + SQLite |
| 동기화 | CouchDB (Docker) + Obsidian Self-hosted LiveSync |
| 에이전트 | Python 3.11+ (watchdog, openai, anthropic) |
| 프로세스 관리 | PM2 |
| LLM | GPT-4o-mini (요약/태그) / Claude 3.5 Sonnet (고급 분석) |

---

## 데이터베이스 스키마 (기획서 원본)

```prisma
model Post {
  id             String   @id @default(uuid())
  title          String
  summary        String        // LLM 요약 (최대 300자)
  originalUrl    String   @unique
  sourcePlatform String        // naver_blog, github, notion, linkedin
  tags           String        // JSON Array String
  publishedAt    DateTime
  status         String   @default("ACTIVE")  // ACTIVE, INACTIVE
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model Config {
  id        String   @id @default(uuid())
  key       String   @unique  // 'openai_api_key', 'anthropic_api_key'
  value     String            // 암호화된 API Key
  updatedAt DateTime @updatedAt
}

model SyncLog {
  id       String   @id @default(uuid())
  status   String   // SUCCESS, ERROR
  message  String
  syncTime DateTime @default(now())
}
```

---

## 백오피스 기능 (기획서 원본)

경로: `/admin` (쿠키 기반 세션 로그인)

- 전체 포스팅 페이징 목록 테이블
- ACTIVE ↔ INACTIVE 즉시 토글 스위치
- 제목/요약/태그 인라인 편집 또는 모달 편집
- SyncLog 최근 50건 조회 + 실패 에러 세부 보기
- OpenAI/Anthropic API Key 입력 폼
- 수동 동기화 즉시 실행 버튼

---

## 홈페이지 피드 기능 (기획서 원본)

- 카테고리 필터 탭: All / Software / Business / Workflow & Automation
- 카드 클릭 → originalUrl (외부 원본)
- 출처 아이콘 표기 (네이버 블로그, GitHub, Notion 등)
- 초기 9개 + Load More 페이지네이션

---

## VPS 에이전트 파이프라인 (기획서 원본)

```
네이버 블로그 포스팅
  → Python 크롤러 (VPS 크론탭)
    → 마크다운 파일 → Obsidian Vault 저장
      → watchdog 감시 (publish: true 감지)
        → GPT-4o-mini API 요약 + 태그 생성
          → SQLite Post 테이블 INSERT
            → 홈페이지 피드 노출 (ACTIVE)
```

오류 시: Discord/Telegram 웹훅 알림 → 재시도 큐 → 최대 3회 → SyncLog ERROR 기록

---

## 서버 디렉토리 구조 (기획서 원본)

```
homepage_project/
├── web/                      # Next.js (홈페이지 + 백오피스)
│   ├── app/
│   │   ├── page.tsx          # 공개 메인 피드
│   │   ├── admin/
│   │   │   ├── page.tsx      # 백오피스 어드민
│   │   │   └── actions.ts    # 어드민 서버 액션
│   │   └── api/posts/route.ts
│   └── prisma/schema.prisma
├── agent/                    # Python 에이전트
│   ├── main.py               # Watcher + Scraper
│   ├── blog_scraper.py       # 네이버 블로그 수집
│   ├── llm_api.py            # OpenAI/Anthropic API
│   └── db_updater.py         # SQLite 적재
├── docker-compose.yml        # CouchDB
└── obsidian_vault/           # Obsidian Vault
```

---

## 인프라 메모

- Swap: 4GB (OOM 방지)
- 포트: 22(SSH), 80(HTTP), 443(HTTPS), 5984(CouchDB — Nginx 뒤)
- 예상 비용: GPT-4o-mini 월 약 20원 (30개 포스트 기준)
- Obsidian 동기화: CouchDB Self-hosted LiveSync 플러그인 (모바일/노트북 양방향)
