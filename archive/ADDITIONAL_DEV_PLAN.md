# 추가 개발 계획 — swarm56.com

기획서(1~5단계) 대비 현재 미구현 항목 전체. 우선순위 순 정렬.

---

## Phase A. DB 스키마 완성

기획서 `schema.prisma` 기준으로 누락된 테이블 추가.

### A-1. Post 테이블 필드 보완
- `originalUrl String @unique` — 외부 원본 URL (카드 클릭 이동 대상)
- `tags String` — JSON 배열 문자열 (예: `["Software","Workflow"]`)
- `summary String` — LLM 요약문 (최대 300자), `excerpt` 대체
- `status` 값을 `ACTIVE` / `INACTIVE` 로 변경 (현재 `published` / `draft`)

> 현재 `slug`, `content`, `thumbnailUrl`, `sourcePlatform` 은 유지.

### A-2. Config 테이블 추가
```prisma
model Config {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String
  updatedAt DateTime @updatedAt
}
```
용도: OpenAI / Anthropic API Key 암호화 보관.

### A-3. SyncLog 테이블 추가
```prisma
model SyncLog {
  id       String   @id @default(cuid())
  status   String
  message  String
  syncTime DateTime @default(now())
}
```
용도: 에이전트 동기화 성공/실패 이력.

---

## Phase B. 홈페이지 피드 기능 완성

### B-1. 카테고리 필터 탭
- `All` / `Software` / `Business` / `Workflow & Automation`
- 탭 클릭 시 클라이언트 즉시 필터링 (flickering 없음)
- `tags` 필드 기반 분류

### B-2. 카드 UI 완성
- 출처 아이콘 표기 (`sourcePlatform`: naver_blog, github, notion, linkedin)
- 카드 클릭 시 `originalUrl`로 이동 (`target="_blank"`)
- 썸네일 이미지 상단 표시 (현재 진행 중)

### B-3. Load More 페이지네이션
- 초기 9개 카드 노출
- 하단 `더 보기` 버튼 → 추가 9개 로드 (서버 액션 또는 API Route)

---

## Phase C. 백오피스 `/admin`

### C-1. 어드민 로그인
- `/admin/login` 페이지
- `ADMIN_PASSWORD_HASH` 환경변수와 bcrypt 대조
- 로그인 성공 시 `httpOnly` 쿠키 세션 발급
- 미인증 접근 시 로그인 페이지 리다이렉트

### C-2. 포스트 관리
- 전체 포스트 페이징 테이블 출력
- ACTIVE ↔ INACTIVE 즉시 토글 스위치
- 제목 / 요약 / 태그 인라인 편집 또는 모달 편집
- 새 포스트 수동 등록 폼

### C-3. LLM API 설정
- OpenAI / Anthropic API Key 입력 폼
- `Config` 테이블 upsert (`updateApiKey` 서버 액션)
- Key 마스킹 표시 (마지막 4자만 노출)

### C-4. 에이전트 모니터링
- `SyncLog` 최근 50건 테이블 출력
- 실패 건 에러 메시지 세부 보기
- 수동 동기화 즉시 실행 버튼 (HTTP POST → 에이전트 트리거)

---

## Phase D. VPS 동기화 에이전트 (Python)

### D-1. Obsidian Vault Watcher
- `watchdog` 라이브러리로 VPS 내 Obsidian Vault 디렉토리 실시간 감시
- `.md` 파일 변경 이벤트 감지
- Frontmatter `publish: true` 감지 시 처리 파이프라인 실행

### D-2. 네이버 블로그 크롤러
- VPS 크론탭으로 주기 실행
- 신규 포스트 수집 → `.md` 변환 → Vault 저장
- `originalUrl` 중복 체크로 재수집 방지

### D-3. LLM 요약 모듈
- `openai` 공식 SDK 사용 (GPT-4o-mini)
- 프롬프트: 2~3문장 한글 150자 이내 요약 + 태그 1~3개 JSON 출력
- API Key는 SQLite `Config` 테이블에서 런타임 조회
- 실패 시 재시도 큐 + 최대 3회 후 SyncLog에 에러 기록

### D-4. DB Publisher
- 요약 완료 시 `Post` 테이블 upsert (originalUrl 기준 중복 방지)
- 성공/실패 `SyncLog` 기록

### D-5. 알림 (Discord/Telegram)
- API 한도 초과 / 크롤러 오류 시 웹훅으로 즉시 알림

---

## Phase E. CouchDB 동기화 서버

- Docker 컨테이너로 CouchDB 가동
- `https://sync.swarm56.com` Nginx 리버스 프록시 연동
- Obsidian 앱 (모바일/노트북) → VPS CouchDB 양방향 실시간 동기화

---

## Phase F. 디자인 개선

### F-1. v0.dev 시안 이식 (미완)
- 원래 설계 순서: Relume 와이어프레임 → v0.dev 시안 → 코드 이식
- 현재 시안 없이 직접 구현된 상태 → v0.dev로 피드 그리드 / GNB / Hero 재디자인 후 이식 필요

### F-2. 반응형 모바일 GNB
- 768px 이하: 햄버거 메뉴 + 드로워

### F-3. 글로벌 CSS 토큰 적용
- `--color-primary-dark: #0F172A` 등 기획서 색상 변수 전면 적용

---

## 작업 순서 (권장)

1. A (스키마) → B (피드 완성) → C (백오피스) → D (에이전트) → E (CouchDB) → F (디자인)
2. Phase C까지는 Claude Code 단독 개발 가능
3. Phase D~E는 VPS 서버 준비 (Phase 2.6) 이후 실행
