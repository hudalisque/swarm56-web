# 기획서 vs 현재 구현 Gap Analysis

> 기획서(Anti-Gravity 설계, 1~5단계) ↔ 현재 구현(Claude Code) 1:1 비교
> Opus 검증 결과 반영. 작성: Claude (Claude Code) — 2026-06-27

---

## F-01: GNB (Global Navigation Bar)

| 기획서 | 현재 구현 | 상태 |
|--------|-----------|------|
| 좌측 텍스트 로고 `Jongseok Won` | 구현됨 | ✅ |
| About / Work / Projects / Contact 메뉴 | 구현됨 | ✅ |
| 모바일 햄버거 메뉴 + 드로워 | 없음 | ❌ |
| 헤더/푸터 소셜 아이콘 고정 (GitHub, LinkedIn, Naver Blog) | 없음 | ❌ |

---

## F-02: Hero 영역

| 기획서 | 현재 구현 | 상태 |
|--------|-----------|------|
| 메인 카피 (Pretendard Bold 32~40px) | 구현됨 (Inter 폰트) | ⚠️ 폰트 불일치 |
| 서브 카피 | 구현됨 | ✅ |
| 프로필 카드 (사진/일러스트, Current focus 리스트, Contact Me 버튼) | 없음 | ❌ |

---

## F-03: 동적 활동 피드 그리드

| 기획서 | 현재 구현 | 상태 |
|--------|-----------|------|
| 카테고리 필터 탭 (All / Software / Business / Workflow) | 없음 | ❌ |
| 출처 아이콘 (네이버 블로그, GitHub, Notion 등) | 텍스트 라벨만 | ❌ |
| LLM 요약문 2~3줄 노출 | 수동 입력 excerpt | ⚠️ |
| 태그 뱃지 | 없음 | ❌ |
| 카드 클릭 → originalUrl | 없음 | ❌ |
| 초기 9개 + Load More | 전체 로드, 페이지네이션 없음 | ❌ |
| 썸네일 | 없음 | ❌ |

---

## 디자인 토큰

| 기획서 | 현재 구현 | 상태 |
|--------|-----------|------|
| Pretendard 폰트 | Inter 사용 | ❌ |
| `--color-primary-dark: #0F172A` 등 CSS 토큰 | 미적용 | ❌ |
| 컨테이너 max-w-6xl | 구현됨 | ✅ |
| 카드 hover:shadow-md transition | 구현됨 | ✅ |

---

## DB 스키마

| 기획서 | 현재 구현 | 상태 |
|--------|-----------|------|
| Post.summary (LLM 요약, 300자) | excerpt (수동 입력) | ❌ |
| Post.originalUrl @unique | 없음 | ❌ |
| Post.tags (JSON Array String) | 없음 | ❌ |
| Post.status: ACTIVE / INACTIVE | published / draft | ❌ |
| Post.sourcePlatform | 없음 | ❌ |
| Post.thumbnailUrl | 없음 | ❌ |
| Config 테이블 (API Key 보관) | 없음 | ❌ |
| SyncLog 테이블 (에이전트 로그) | 없음 | ❌ |

---

## B-01: 백오피스 `/admin` 대시보드

| 기획서 | 현재 구현 | 상태 |
|--------|-----------|------|
| 쿠키 세션 로그인 | 없음 | ❌ |
| 포스트 목록 페이징 테이블 | 없음 | ❌ |
| ACTIVE ↔ INACTIVE 토글 스위치 | 없음 | ❌ |
| 제목/요약/태그 인라인 편집 | 없음 | ❌ |
| 수동 포스트 등록 폼 | 없음 | ❌ |

---

## B-02: LLM API 설정 패널

| 기획서 | 현재 구현 | 상태 |
|--------|-----------|------|
| OpenAI/Anthropic API Key 입력 폼 | 없음 | ❌ |
| updateApiKey 서버 액션 | 없음 | ❌ |
| 수동 동기화 즉시 실행 버튼 | 없음 | ❌ |

---

## B-03: Obsidian 동기화 서버

| 기획서 | 현재 구현 | 상태 |
|--------|-----------|------|
| CouchDB Docker 컨테이너 | 없음 | ❌ |
| sync.swarm56.com Nginx 프록시 | 없음 | ❌ |
| Obsidian Self-hosted LiveSync | 없음 | ❌ |

---

## A-01: Obsidian Watcher & 네이버 블로그 크롤러

| 기획서 | 현재 구현 | 상태 |
|--------|-----------|------|
| watchdog Vault 감시 | 없음 | ❌ |
| 네이버 블로그 RSS 크롤러 → md 저장 | `naverblog_clipper.py` 존재 (로컬, VPS 미이식) | ⚠️ |
| Frontmatter `publish: true` 감지 | 없음 | ❌ |
| VPS 크론탭 등록 | 없음 | ❌ |

---

## A-02: LLM 요약 모듈

| 기획서 | 현재 구현 | 상태 |
|--------|-----------|------|
| GPT-4o-mini API 호출 | 없음 | ❌ |
| 요약 2~3문장 + 태그 JSON 출력 | 없음 | ❌ |
| Config 테이블에서 API Key 런타임 조회 | 없음 | ❌ |
| 실패 시 재시도 큐 (최대 3회) | 없음 | ❌ |

---

## A-03: DB Publisher

| 기획서 | 현재 구현 | 상태 |
|--------|-----------|------|
| Post upsert (originalUrl 중복 방지) | 없음 | ❌ |
| SyncLog 성공/실패 기록 | 없음 | ❌ |
| Discord/Telegram 오류 알림 | 없음 | ❌ |

---

## 인프라

| 기획서 | 현재 구현 | 상태 |
|--------|-----------|------|
| Nginx 리버스 프록시 + SSL 설정 | deploy/ 폴더에 conf 파일 있음 | ✅ |
| systemd 유닛 | 있음 | ✅ |
| 배포 스크립트 (symlink swap + 롤백) | 있음 | ✅ |
| 4GB Swap 설정 | VPS 작업, 미확인 | ⚠️ |
| PM2 프로세스 관리 | 미적용 (systemd로 대체) | ⚠️ |

---

## 디자인 파이프라인

| 기획서 | 현재 구현 | 상태 |
|--------|-----------|------|
| Relume 와이어프레임 | 미수행 | ❌ |
| v0.dev 컴포넌트 시안 | 미수행 | ❌ |
| 시안 → Next.js 이식 | 시안 없이 직접 구현 | ❌ |

---

## 재사용 가능한 기존 자산

| 파일 | 용도 | 활용 방안 |
|------|------|-----------|
| `naverblog_clipper.py` | RSS 수집 → md 변환 | A-01 크롤러로 이식. 경로/Frontmatter 수정 필요 |
| `deploy/` 패키지 | Nginx/systemd/배포 스크립트 | 그대로 사용 |

---

## 구현된 것 요약

- 공개 사이트 정적 골격 (GNB, Hero, About, Current Work, Projects, Channels, Contact)
- PostCard 기초 (DB 연동, excerpt 표시)
- Health Check API `/api/health`
- Nginx/systemd/배포/롤백 패키지 (`deploy/`)
- GitHub 레포 (`hudalisque/swarm56-web`)

**핵심 3축 — 백오피스 / VPS 에이전트 / CouchDB — 전부 미착수**
