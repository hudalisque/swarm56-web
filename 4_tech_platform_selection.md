# 개인 활동 허브 (Personal Brand Hub) 구축 프로젝트 - 4단계: 기술 플랫폼 및 디자인 에이전트 선정서 (Tech & Design Platform Selection)

## 1. 인프라 및 기술 스택 확정

상세 분석(3단계)을 바탕으로 프로젝트 개발에 도입할 인프라 사양 및 소프트웨어 스택을 다음과 같이 최종 확정합니다.

### 1.1 서버 인프라 및 네트워크 구성
- **선정 클라우드**: **AWS Lightsail (Ubuntu 24.04 LTS / 1 vCPU / 2GB RAM / 60GB SSD / 월 $10)**
- **보안 및 방화벽 설정**:
  - **인바운드 포트 제한**:
    - `TCP 22`: SSH 접속용
    - `TCP 80` (HTTP) & `TCP 443` (HTTPS): 외부 웹 서비스 접속용
    - `TCP 5984` (CouchDB): 옵시디언 동기화용 포트. Nginx 리버스 프록시 뒤에 배치하여 직접 노출하지 않고 `https://sync.yourdomain.com` 형태로 보안 터널링 및 SSL 적용.
- **가상 메모리(Swap)**: **물리 SSD에 4GB 스왑 파일 추가 생성** (메모리 안정성 확보용).

### 1.2 서버 사이드 소프트웨어 및 동기화 스택
- **웹 어플리케이션 엔진**: **Next.js 14.2+ (App Router)** (LTS Node v20 런타임)
- **동기화 DB 엔진**: **Apache CouchDB (Docker 컨테이너 구동)**
  - Obsidian의 `Self-hosted LiveSync` 플러그인과 연동하여 로컬 클라이언트와 파일 실시간 동기화.
- **데이터베이스 연동**: **Prisma ORM (v5.x 이상) + SQLite** (홈페이지 피드 및 어드민 데이터 전용)
- **프로세스 매니저**: **PM2** (웹 및 에이전트 데몬 상시 관리)

### 1.3 에이전트 및 API 스택
- **VPS 상주형 에이전트 엔진**: **Python 3.11+**
  - OS 파일 이벤트 감시 라이브러리 `watchdog` 사용 (VPS 상의 `/home/ubuntu/obsidian_vault` 감시).
  - LLM 처리를 위한 공식 `openai` 및 `anthropic` Python 라이브러리 탑재.
- **디자인 에이전트 협업 체계**:
  - 기획 레이아웃 설계: **Relume**
  - 컴포넌트 디자인 코드 생성: **v0.dev**
  - 최종 코드 병합 및 배포 조율: **Antigravity (본 에이전트)**

---

## 2. 세부 디렉터리 및 형상관리 구조

모든 코드와 데이터 저장 폴더를 VPS 서버 단일 디렉터리 내부에서 관리하도록 통합 설계합니다.

### 2.1 서버 및 에이전트 구성 (`/home/ubuntu/homepage_project/`)
```text
homepage_project/
├── web/                      # Next.js 프론트엔드 및 백오피스 웹앱
│   ├── app/
│   │   ├── layout.tsx        # 전역 레이아웃
│   │   ├── page.tsx          # 공개용 메인 허브 피드
│   │   ├── admin/
│   │   │   ├── page.tsx      # 백오피스 어드민 대시보드
│   │   │   └── actions.ts    # 어드민 전용 서버 액션 (로그인, 포스트 제어)
│   │   └── api/
│   │       └── posts/
│   │           └── route.ts  # 내/외부 수신용 API Route
│   ├── prisma/
│   │   ├── schema.prisma     # Prisma Schema (SQLite 연동)
│   │   └── dev.db            # SQLite 데이터베이스 파일
│   └── components/
│       ├── hero-section.tsx  # Hero 및 프로필 카드
│       ├── activity-feed.tsx # 활동 피드 그리드
│       └── project-card.tsx  # 프로젝트 요약 카드
├── agent/                    # VPS 백그라운드 구동 파이썬 에이전트
│   ├── config.json           # 에이전트 세팅 및 DB 경로 설정
│   ├── requirements.txt      # Python 라이브러리 목록 (watchdog, openai, anthropic, requests)
│   ├── main.py               # Watcher 및 Scraper 오케스트레이터
│   ├── blog_scraper.py       # 네이버 블로그 직접 수집 모듈 (md 파일 생성)
│   ├── llm_api.py            # 공식 OpenAI/Anthropic API 호출 및 요약 모듈
│   └── db_updater.py         # SQLite DB 직접 적재 모듈
├── docker-compose.yml        # CouchDB (Obsidian LiveSync용) 컨테이너 설정 파일
└── obsidian_vault/           # VPS 상의 옵시디언 금고(Vault) 루트 폴더
```

---

## 3. 환경 변수 및 설정 정의 (Environment Variables)

### 3.1 웹서버 전역 환경 변수 (`web/.env`)
```bash
# 데이터베이스 연동 경로 (Prisma용)
DATABASE_URL="file:../web/prisma/dev.db"

# 백오피스 관리자 페이지 진입용 계정 비밀번호 (bcrypt 해시값 권장)
ADMIN_PASSWORD_HASH="$2b$10$Un1qu3H4shV4lu3ForS3cur1ty..."

# 세션 암호화 키
NEXTAUTH_SECRET="super_secret_session_key..."

# 공식 LLM API Key (웹서버 모니터링 및 필요 시 호출용)
OPENAI_API_KEY="sk-proj-..."
ANTHROPIC_API_KEY="sk-ant-..."
```

### 3.2 CouchDB Docker Compose 설정 (`docker-compose.yml`)
```yaml
version: '3.8'
services:
  couchdb:
    image: couchdb:3.3
    container_name: obsidian-couchdb
    ports:
      - "5984:5984"
    environment:
      - COUCHDB_USER=admin
      - COUCHDB_PASSWORD=your_secure_couchdb_password
    volumes:
      - ./couchdb/data:/opt/couchdb/data
      - ./couchdb/etc:/opt/couchdb/etc/local.d
    restart: always
```

### 3.3 VPS 에이전트 설정 파일 (`agent/config.json`)
```json
{
  "OBSIDIAN_VAULT_PATH": "/home/ubuntu/homepage_project/obsidian_vault",
  "LLM_PROVIDER": "openai",
  "LLM_MODEL": "gpt-4o-mini",
  "OPENAI_API_KEY": "sk-proj-...",
  "ANTHROPIC_API_KEY": "sk-ant-...",
  "SQLITE_DB_PATH": "/home/ubuntu/homepage_project/web/prisma/dev.db"
}
```
