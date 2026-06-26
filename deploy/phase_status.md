# Homepage Project Phase Status
업데이트: 2026-06-27

---

## 프로젝트 개요

- **목적**: 개인 브랜드 허브 + 에이전트 협업 워크플로우 확립
- **도메인**: swarm56.com (Cloudflare 등록, 2026-06-26)
- **아키텍처**: Obsidian LiveSync → VPS CouchDB → Python Watchdog → GPT-4o-mini → SQLite/Prisma → Next.js
- **인프라**: AWS Lightsail Ubuntu 1GB 단일 VPS + Nginx 역방향 프록시
- **오케스트레이터**: GPT (Peter 님 릴레이) / 실행: Claude Code

---

## VPS 접속 정보

- **공인 IP (Static)**: 54.116.19.34
- **Static IP 이름**: swarm56-prod-ip
- **인스턴스 이름**: swarm56-prod
- **리전**: ap-northeast-2a (서울)
- **OS**: Ubuntu 24.04.4 LTS (kernel 6.17.0-1010-aws)
- **플랜**: 1GB RAM / 2vCPU / 40GB SSD
- **SSH 사용자**: ubuntu
- **SSH 키**: `C:\Users\acepe\Downloads\LightsailDefaultKey-ap-northeast-2.pem`
- **SSH 명령**: `ssh -i "C:\Users\acepe\Downloads\LightsailDefaultKey-ap-northeast-2.pem" ubuntu@54.116.19.34`

---

## Phase 1A — 완료 (2026-06-26)

### 목표
Nginx Reverse Proxy 로컬 구현 및 VPS 기반 확보

### 완료 항목

#### 로컬 산출물 (D:\Agent_Workspace\homepage_project\deploy\)
- `nginx.conf` — CouchDB 역방향 프록시, SSL, WebSocket, 보안 헤더 포함
  - server_name: sync.swarm56.com (기존 sync.yourdomain.com에서 교체)
  - proxy_pass: http://127.0.0.1:5984
  - client_max_body_size: 100M
  - TLS 1.2/1.3
- `setup_swap.sh` — 4GB Swap 설정 스크립트 (멱등성 보장)
- `README.md` — 배포 가이드 (CouchDB 인증 설정 포함)
- `phase_status.md` — 이 파일

#### AWS Lightsail 설정
- 인스턴스: swarm56-prod (1GB/40GB, 서울 Zone A)
  - 초기 실수: Ubuntu-1 (512MB) 생성 → 삭제 후 swarm56-prod (1GB) 재생성
- Static IP: 54.116.19.34 (swarm56-prod-ip 연결)
- 방화벽: TCP 22/80/443 허용, 5984 없음

#### VPS 서버 설정
- Swap 4GB 활성화 (`/swapfile`, swappiness=10, fstab 영구 등록)
- Nginx 1.24.0 설치 및 실행
- 배포 파일 업로드: `/opt/swarm56/deploy/`
  - nginx.conf SHA256: 10d90ae7ae1ba2526a161f8a7eaabe5c9b3d92f0eae33a345beb07666b57caa4
  - setup_swap.sh SHA256: b0c711b3bb3a927ea1a4e031fc1250411250ac67cdf1bef0c3fb125038c2a663
  - README.md SHA256: 9c4357efe06be90183a3301fad8f7fc220f397ee4311c95ed43f708b13d67923
- Nginx 설정 배치:
  - bootstrap (HTTP only): `/etc/nginx/sites-available/swarm56-bootstrap` (현재 활성)
  - production (SSL): `/etc/nginx/sites-available/swarm56-sync` (인증서 발급 후 활성화)
- nginx -t: 통과
- 로컬 curl 응답: 502 (CouchDB 미설치, 예상 범위)

### 검증 결과
| 항목 | 결과 |
|------|------|
| 인스턴스 1GB | ✅ |
| Static IP 확정 | ✅ 54.116.19.34 |
| Swap 4GB | ✅ |
| nginx -t | ✅ |
| 5984 외부 미개방 | ✅ |
| 방화벽 80/443 | ✅ |

---

## Phase 1B — 완료 (2026-06-26)

### 목표
CouchDB 설치, localhost 바인딩, 관리자 인증, Nginx 프록시 검증

### 완료 항목

#### Apache CouchDB 저장소 등록
- 서명 키: `/usr/share/keyrings/couchdb-archive-keyring.gpg`
  - Fingerprint: 390E F70B B1EA 12B2 7739 6295 0EE6 2FB3 7A00 258D
- 저장소: `https://apache.jfrog.io/artifactory/couchdb-deb/ noble main`
- 등록 파일: `/etc/apt/sources.list.d/couchdb.list`

#### CouchDB 설치 (브라우저 SSH 대화형)
- 설치 버전: 3.5.2.1~noble
- 설치 방식: `sudo apt install couchdb` (대화형)
- 설정:
  - Configuration type: standalone
  - Bind address: 127.0.0.1
  - Erlang cookie: 설치 중 직접 입력 (초기 빈값 오류 → 재시도)
  - 관리자 계정: admin (비밀번호 별도 보관, 미기록)
- 설정 파일:
  - `/opt/couchdb/etc/local.ini` — [admins] 섹션 존재
  - `/opt/couchdb/etc/local.d/10-admins.ini` — admin 계정 저장

#### 서비스 상태
- systemctl: active (running)
- 바인딩: 127.0.0.1:5984 전용 (0.0.0.0 없음)
- cluster_setup: `{"state":"single_node_enabled"}`
- 시스템 DB: `_replicator`, `_users`

#### 검증 결과
| 항목 | 결과 |
|------|------|
| CouchDB 서비스 | ✅ active |
| 127.0.0.1:5984만 청취 | ✅ |
| cluster_setup single_node_enabled | ✅ |
| 비인증 직접 /_all_dbs | ✅ 401 |
| 인증된 내부 요청 | ✅ 200 |
| Nginx 경유 비인증 | ✅ 401 |
| Nginx 경유 인증 (Authorization 헤더 전달) | ✅ 200, [_replicator, _users] |
| Nginx 루트 응답 (502→200) | ✅ CouchDB Welcome JSON |
| 외부 5984 차단 | ✅ |
| 관리자 인증정보 미노출 | ✅ |

---

## Phase 1C — 완료 (2026-06-27)

### 목표
Cloudflare DNS 연결, TLS 인증서 발급, HTTPS 전환

### 완료 항목
- Nginx 설정 백업 (타임스탬프 .bak, 2026-06-26 16:42)
  - swarm56-bootstrap.bak.20260626164222
  - swarm56-sync.bak.20260626164222
- Certbot 5.6.0 설치 (snap, /snap/bin/certbot → /usr/local/bin/certbot)

### Phase 1C 검증 결과
| 항목 | 상태 |
|------|------|
| sync.swarm56.com → 54.116.19.34 | ✅ |
| Certbot 5.6.0 설치 (snap) | ✅ |
| TLS 인증서 발급 (유효 ~2026-09-24) | ✅ |
| HTTPS 루트 200 + CouchDB Welcome JSON | ✅ |
| HTTP → HTTPS 301 리다이렉트 | ✅ |
| HTTPS 비인증 /_all_dbs → 401 | ✅ |
| 외부 TCP 5984 차단 (timeout) | ✅ |
| certbot renew --dry-run | ✅ 성공 |
| 인증정보/개인키 미노출 | ✅ |

---

## Phase 1 — 전체 완료 (2026-06-27)

**VPS·CouchDB·Nginx·DNS·TLS 배포 및 운영 검증 완료**

- https://sync.swarm56.com 정상 서비스 중
- Cloudflare DNS only (Proxy 비활성) 상태 유지
- 자동 갱신: snap certbot 타이머 활성

---

## Nginx 설정 파일 구조

```
/etc/nginx/sites-available/
  default                          — Nginx 기본 (충돌 시 제거 예정)
  swarm56-bootstrap                — HTTP only (현재 활성 심볼릭 링크)
  swarm56-bootstrap.bak.20260626164222
  swarm56-sync                     — Production SSL (인증서 발급 후 활성화)
  swarm56-sync.bak.20260626164222

/etc/nginx/sites-enabled/
  default → /etc/nginx/sites-available/default
  swarm56-sync → /etc/nginx/sites-available/swarm56-bootstrap  ← 현재 bootstrap 가리킴
```

---

## 문제 해결 기록

### 1. 인스턴스 512MB 오류 (Phase 1A)
- 원인: 초기 생성 시 512MB 플랜 선택
- 해결: 삭제 후 1GB 플랜(swarm56-prod)으로 재생성

### 2. nginx.conf 전역 지시문 오류 (Phase 1A)
- 원인: nginx.conf에 `user nginx;` 등 전역 지시문 포함 → sites-available 불가
- 해결: server 블록만 추출한 별도 파일 생성 (swarm56-bootstrap)

### 3. CouchDB Erlang cookie 빈값 오류 (Phase 1B)
- 원인: 설치 중 Erlang cookie 필드 빈값으로 Ok 누름
- 해결: 오류 메시지 확인 후 다시 입력

### 4. CouchDB 관리자 인증 실패 (Phase 1B)
- 원인: SSH 환경에서 curl 비밀번호 프롬프트 미작동
- 해결: 브라우저 SSH 터미널에서 `curl --user 'admin'` 직접 실행

### 5. .pem 파일 권한 오류 (Phase 1A)
- 원인: Windows 파일 권한 (CodexSandboxUsers)
- 해결: `icacls` 권한 제거

---

## 파일 위치 요약

| 파일 | 위치 |
|------|------|
| nginx.conf (로컬 원본) | D:\Agent_Workspace\homepage_project\deploy\nginx.conf |
| setup_swap.sh (로컬) | D:\Agent_Workspace\homepage_project\deploy\setup_swap.sh |
| README.md (로컬) | D:\Agent_Workspace\homepage_project\deploy\README.md |
| SSH 키 | C:\Users\acepe\Downloads\LightsailDefaultKey-ap-northeast-2.pem |
| VPS 배포 디렉터리 | /opt/swarm56/deploy/ |
| Nginx bootstrap | /etc/nginx/sites-available/swarm56-bootstrap |
| Nginx production | /etc/nginx/sites-available/swarm56-sync |
| CouchDB 설정 | /opt/couchdb/etc/local.d/10-admins.ini |
| Certbot | /snap/bin/certbot → /usr/local/bin/certbot |
