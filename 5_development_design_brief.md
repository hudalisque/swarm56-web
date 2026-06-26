# 개인 활동 허브 (Personal Brand Hub) 구축 프로젝트 - 5단계: 최종 개발 및 디자인 기획서 (Development & Design Brief)

## 1. 디자인 및 스타일 명세

### 1.1 CSS 토큰 및 전역 스타일 (`web/app/globals.css`)
- **디자인 테마**: 다크 네이비 테마 및 미니멀 오프화이트 레이아웃 조합.
- **Tailwind CSS 색상 변수 설정**:
```css
@theme {
  --color-primary-dark: #0F172A;     /* Slate-900 */
  --color-primary-medium: #1E293B;   /* Slate-800 */
  --color-accent-blue: #1D4ED8;      /* Royal Blue-700 */
  --color-neutral-bg: #F8FAFC;       /* Off-white */
  --color-neutral-border: #E2E8F0;   /* Slate-200 */
  --color-text-main: #0F172A;
  --color-text-muted: #64748B;
}
```

### 1.2 반응형 피드 레이아웃 명세
- **컨테이너 가이드라인**: 최대 폭 `1120px` 중앙 정렬 (`max-w-6xl mx-auto px-4`).
- **피드 카드 그리드**:
  - 모바일(768px 미만): 1열 구성 (`grid-cols-1`)
  - 태블릿(1024px 미만): 2열 구성 (`grid-cols-2`)
  - 데스크톱(1024px 이상): 3열 구성 (`grid-cols-3`)
  - 카드 마크업: 얇은 테두리(`border border-neutral-border`), 마우스 오버 시 그림자 애니메이션(`hover:shadow-md transition-shadow duration-300`).

---

## 2. 데이터베이스 스키마 명세 (SQLite / Prisma Schema)

```prisma
// web/prisma/schema.prisma

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

// 1. 홈페이지 피드용 테이블
model Post {
  id             String   @id @default(uuid())
  title          String
  summary        String   // LLM 요약 (최대 300자)
  originalUrl    String   @unique
  sourcePlatform String   // naver_blog, github, notion, linkedin 등
  tags           String   // JSON Array String
  publishedAt    DateTime
  status         String   @default("ACTIVE") // ACTIVE, INACTIVE
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

// 2. 백오피스 환경 설정 테이블 (LLM API Key 보관용)
model Config {
  id        String   @id @default(uuid())
  key       String   @unique // 예: 'openai_api_key', 'anthropic_api_key'
  value     String   // 암호화된 API Key
  updatedAt DateTime @updatedAt
}

// 3. 에이전트 동기화 로그 테이블
model SyncLog {
  id        String   @id @default(uuid())
  status    String   // SUCCESS, ERROR
  message   String   // 에러 사유 혹은 동기화 개수 요약
  syncTime  DateTime @default(now())
}
```

---

## 3. 백오피스 어드민 기능 구현 명세

### 3.1 관리자 세션 처리 (`web/app/admin/actions.ts`)
- **로그인 처리**: 관리자 암호 해시(`ADMIN_PASSWORD_HASH`)와 일치 여부를 대조하여 쿠키에 JWT 토큰 또는 세션 아이디를 저장.
- **API Key 입력 서버 액션**:
```typescript
"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

export async function updateApiKey(provider: "openai" | "anthropic", newKey: string) {
  const configKey = `${provider}_api_key`
  
  await prisma.config.upsert({
    where: { key: configKey },
    update: { value: newKey },
    create: { key: configKey, value: newKey }
  })
  
  revalidatePath("/admin")
  return { success: true }
}
```

---

## 4. VPS 동기화 에이전트 구현 가이드 (Python)

VPS 백그라운드에서 옵시디언 Vault 디렉토리를 실시간 감시하고, 공식 LLM API를 호출하여 요약한 뒤 SQLite DB에 직접 적재하는 에이전트 핵심부 소스코드 구조입니다.

```python
import os
import sys
import json
import sqlite3
import openai # 공식 openai 라이브러리
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# 설정 파일 로드
AGENT_DIR = "/home/ubuntu/homepage_project/agent"
with open(f"{AGENT_DIR}/config.json", "r") as f:
    config = json.load(f)

DB_PATH = config["SQLITE_DB_PATH"]
VAULT_PATH = config["OBSIDIAN_VAULT_PATH"]

# SQLite DB에서 API Key 조회 함수
def get_api_key_from_db(provider):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM Config WHERE key=?", (f"{provider}_api_key",))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

class ObsidianPublishHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.is_directory or not event.src_path.endswith(".md"):
            return
        self.process_markdown(event.src_path)

    def process_markdown(self, file_path):
        print(f"파일 변경 감지: {file_path}")
        content, metadata = parse_markdown_file(file_path)
        
        if not metadata.get("publish") or metadata.get("status") == "synced":
            return
            
        if is_already_synced(metadata["url"]):
            return

        # DB에서 API Key 로드
        api_key = get_api_key_from_db("openai")
        if not api_key:
            log_sync_error("OpenAI API Key가 등록되지 않았습니다.")
            return

        # 공식 API 호출 요약
        try:
            summary, tags = fetch_llm_summary_api(content, api_key)
            
            # DB 직접 적재
            insert_post_to_db(metadata["title"], summary, metadata["url"], tags, metadata["date"])
            
            # 완료 상태 마크다운 수정
            mark_as_synced(file_path)
            log_sync_success(f"성공적으로 발행됨: {metadata['title']}")
        except Exception as e:
            log_sync_error(f"동기화 에러 발생: {str(e)}")

def fetch_llm_summary_api(content, api_key):
    # 공식 OpenAI SDK를 이용한 비동기/동기 호출
    client = openai.OpenAI(api_key=api_key)
    
    prompt = (
        "당신은 비즈니스와 소프트웨어 개발에 정통한 수석 큐레이터입니다.\n"
        "다음 글을 읽고 일반 대중이 이해하기 쉽게 2~3문장(한글 150자 이내)으로 요약하고,\n"
        "카테고리 [Software, Business, Workflow] 중 가장 관련 깊은 태그를 1~3개 선택하여\n"
        "JSON 포맷(keys: summary, tags)으로 출력하십시오."
    )
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": content}
        ],
        response_format={"type": "json_object"}
    )
    
    result = json.loads(response.choices[0].message.content)
    return result["summary"], result["tags"]

def insert_post_to_db(title, summary, url, tags, date):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO Post (id, title, summary, originalUrl, sourcePlatform, tags, publishedAt, status, createdAt, updatedAt)
        VALUES (lower(hex(randomblob(16))), ?, ?, ?, 'naver_blog', ?, ?, 'ACTIVE', datetime('now'), datetime('now'))
    """, (title, summary, url, json.dumps(tags), date))
    conn.commit()
    conn.close()

# 감시 대기 구동
if __name__ == "__main__":
    event_handler = ObsidianPublishHandler()
    observer = Observer()
    observer.schedule(event_handler, path=VAULT_PATH, recursive=True)
    observer.start()
    print("VPS 옵시디언 금고 감시 스크립트 실행 중 (API 연동 버전)...")
    try:
        while True:
            pass
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
```

---

## 5. 구현 백로그 (Development Backlog)

### Phase 1. VPS 환경 구축 및 메모리 최적화
- [ ] AWS Lightsail 인스턴스 생성 및 Ubuntu 24.04 초기화
- [ ] **가상 메모리 설정**: OOM 방지용 4GB Swap 파일 설정 및 확인 (`swapon --show`)
- [ ] Nginx Reverse Proxy 및 Let's Encrypt SSL 구성

### Phase 2. 옵시디언 동기화 서버 구축 (CouchDB)
- [ ] Docker 및 Docker-compose 설치
- [ ] CouchDB 컨테이너 실행 및 `https://sync.yourdomain.com` 리버스 프록시 연동
- [ ] 사용자의 로컬 노트북 및 폰 옵시디언 앱에서 CouchDB 동기화 설정 검증

### Phase 3. Next.js 홈페이지 & 백오피스 개발
- [ ] Next.js 프로젝트 세팅 및 Prisma SQLite 스키마 생성
- [ ] 백오피스 `/admin` 구축 및 어드민 세션 기능 구현
- [ ] **API Key 설정 화면**: 백오피스 설정창 내 OpenAI/Anthropic API Key 관리 폼 연동

### Phase 4. 디자인 멀티에이전트 협업 실행
- [ ] Relume을 활용한 사이트맵 및 와이어프레임 설계 (기획)
- [ ] v0.dev를 사용한 GNB, Hero, 활동 피드 컴포넌트 코드 마크업 추출 (디자인)
- [ ] Antigravity 조율 하에 디자인 코드를 Next.js 구조에 이식하고 데이터 바인딩 적용 (개발)

### Phase 5. VPS 동기화 에이전트 개발 및 통합 테스트
- [ ] 네이버 블로그 자동 수집 크롤러 파이썬 스크립트 작성 및 스케줄러 등록
- [ ] 공식 gpt-4o-mini API 연동 테스트 및 요약/태그 JSON 포맷 검증
- [ ] 통합 프로세스 검증 (모바일 작성 -> CouchDB 실시간 동기화 -> Python Watcher 감지 -> API 요약 -> SQLite 반영 -> 홈페이지 노출)
