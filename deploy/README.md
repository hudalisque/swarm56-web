# Personal Brand Hub Deployment (Phase 1)

이 폴더는 개인 활동 허브 및 옵시디언 동기화 서버를 VPS 환경에 구성하기 위한 인프라 설정 패키지입니다.

## 📂 포함된 파일 목록

1. **`setup_swap.sh`**: 4GB 가상 메모리(Swap) 설정 스크립트
   - AWS Lightsail 1GB RAM 환경 등에서의 OOM(Out of Memory) 방지를 위해 물리 메모리를 보완합니다.
2. **`nginx.conf`**: Let's Encrypt SSL이 적용된 CouchDB용 Nginx Reverse Proxy 설정
   - Obsidian LiveSync 등 대용량 노트/이미지 동기화 및 끊김 없는 WebSockets 통신을 지원하도록 최적화되어 있습니다.

---

## 🔧 배포 전 필수 변경 사항 (Replacement Guide)

`nginx.conf` 파일을 사용자의 실배포 서버 환경에 맞춰 다음 항목들을 필수적으로 교체해 주어야 합니다.

### 1. 도메인 (Domain Name) 교체
- **대상**: `sync.yourdomain.com` (파일 내 총 4군데 존재)
- **교체할 내용**: 실제 Obsidian 동기화 서버로 사용할 본인의 도메인 이름 (예: `sync.example.com`)
- **자동 치환 명령어 예시 (Linux)**:
  ```bash
  sed -i 's/sync.yourdomain.com/실제도메인/g' nginx.conf
  ```

### 2. SSL 인증서 경로 교체
- **대상**:
  ```nginx
  ssl_certificate /etc/letsencrypt/live/sync.yourdomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/sync.yourdomain.com/privkey.pem;
  ```
- **교체할 내용**: Let's Encrypt 등으로 발급받은 실제 SSL 인증서 파일 경로
- **인증서 발급 가이드 (Let's Encrypt Certbot standalone 방식)**:
  Nginx 포트를 일시적으로 중단하고 standalone 모드로 발급받습니다.
  ```bash
  sudo certbot certonly --standalone -d 실제도메인
  ```

### 3. CouchDB 백엔드 주소 (`proxy_pass`) 조정
- **대상**: `proxy_pass http://127.0.0.1:5984;`
- **교체할 내용**:
  - **호스트 직접 매핑 시**: Nginx를 VPS 호스트 환경에 바로 띄우고 CouchDB를 Docker 컨테이너(포트 5984 바인딩)로 가동하는 경우 **기본값(`127.0.0.1:5984`) 유지**
  - **Docker Compose 네트워크 공유 시**: Nginx와 CouchDB를 동일한 Docker Compose 스펙 내부에서 돌리는 경우 `http://couchdb:5984;` (CouchDB 컨테이너 서비스 이름)로 치환

### 4. CouchDB 인증 설정 (보안 필수)

CouchDB는 기본적으로 인증 없이 접근 가능한 "Admin Party" 상태로 시작됩니다. 배포 전 반드시 비활성화해야 합니다.

**4-1. 관리자 계정 생성**
```bash
curl -X PUT http://127.0.0.1:5984/_node/nonode@nohost/_config/admins/admin \
  -d '"your_password"'
```

**4-2. nginx.conf에 인증정보 직접 기록 금지**
- nginx.conf에 CouchDB 계정/비밀번호를 하드코딩하지 않는다
- Obsidian LiveSync 플러그인에서 직접 인증 처리 (CouchDB URL에 포함)
- 예: `https://admin:password@sync.yourdomain.com` (클라이언트 측 설정)

**4-3. CouchDB 5984 포트 외부 직접 공개 금지**
```bash
# UFW 방화벽에서 5984 포트 차단 (Nginx를 통해서만 접근)
sudo ufw deny 5984
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

**4-4. Authorization 헤더 전달 확인**
현재 nginx.conf에 `proxy_set_header` 설정이 있으나 Authorization 헤더는 별도 명시 불필요 — Nginx가 기본적으로 클라이언트 헤더를 그대로 전달합니다.

---

## 🚀 인프라 세팅 실행 순서

### Step 1. Swap 메모리 가동 (OOM 방지)
서버 성능이 1GB~2GB RAM인 경우 다음 스크립트를 최초 1회 실행하여 OOM 크래시를 미연에 예방합니다. (멱등성이 보장되므로 다중 실행 가능)
```bash
sudo chmod +x setup_swap.sh
sudo ./setup_swap.sh
```

### Step 2. DNS 설정 및 SSL 인증서 발급
도메인의 DNS A 레코드가 VPS IP를 정상적으로 가리키는지 확인한 뒤 Certbot 등으로 인증서를 발급합니다.

### Step 3. Nginx 설정 테스트 및 적용
Nginx 서비스에 변경사항을 적용하기 전 구문 오류를 검증하고 프로세스를 리로드합니다.
```bash
# 설정 구문 검증
nginx -t -c /path/to/deploy/nginx.conf

# Nginx 서비스 재시작
sudo systemctl restart nginx
```
