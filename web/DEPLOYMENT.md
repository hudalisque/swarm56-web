# Deployment Guide — swarm56.com

## Overview

- **App**: Next.js 16.2.9 standalone (`node server.js`)
- **DB**: SQLite via Prisma 6.19.3 (`/var/lib/swarm56/web/site.db`)
- **Service**: systemd (`swarm56-web.service`)
- **Proxy**: Nginx → `127.0.0.1:3000`

## Build (Linux x86_64 only)

```bash
# On Linux x86_64 with Node 24.18.0
bash deploy/build_release_linux.sh
# Output: /tmp/swarm56-web-<RELEASE_ID>.tar.gz
```

Windows 빌드 산출물을 VPS에 직접 배포하지 않는다.

## First Deployment

### VPS 사전 준비

```bash
# 사용자 생성
sudo useradd --system --no-create-home --shell /bin/false swarm56-web

# 디렉터리 생성
sudo mkdir -p /opt/swarm56/web/releases
sudo mkdir -p /var/lib/swarm56/web
sudo mkdir -p /var/backups/swarm56/web
sudo mkdir -p /etc/swarm56

# 권한 설정
sudo chown swarm56-web:swarm56-web /opt/swarm56/web/releases
sudo chown swarm56-web:swarm56-web /var/lib/swarm56/web
sudo chown swarm56-web:swarm56-web /var/backups/swarm56/web

# 환경 파일
sudo install -o root -g swarm56-web -m 0640 \
  deploy/web.env.example /etc/swarm56/web.env
# 실제 값으로 편집:
sudo nano /etc/swarm56/web.env

# systemd 서비스 설치
sudo cp deploy/swarm56-web.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable swarm56-web.service
```

### 배포 (초기 seed 포함)

```bash
# 아티팩트 전송
scp /tmp/swarm56-web-<RELEASE_ID>.tar.gz ubuntu@<VPS_IP>:/tmp/

# VPS에서
sudo bash deploy/deploy_web.sh \
  /tmp/swarm56-web-<RELEASE_ID>.tar.gz \
  --seed
```

## Subsequent Deployments

```bash
sudo bash deploy/deploy_web.sh /tmp/swarm56-web-<RELEASE_ID>.tar.gz
```

Seed는 자동 실행하지 않는다.

## Nginx

TLS 발급 전 (bootstrap):

```bash
sudo cp deploy/swarm56-web-bootstrap.conf \
  /etc/nginx/sites-available/swarm56-web.conf
sudo ln -s /etc/nginx/sites-available/swarm56-web.conf \
  /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

TLS 발급 후 (production):

```bash
sudo cp deploy/swarm56-web.conf \
  /etc/nginx/sites-available/swarm56-web.conf
sudo nginx -t && sudo systemctl reload nginx
```

`sync.swarm56.com` (CouchDB) 블록은 수정하지 않는다.

## Rollback

```bash
sudo bash deploy/rollback_web.sh
```

DB 복원이 필요한 경우 (명시적 승인 필요):

```bash
sudo bash deploy/rollback_web.sh \
  --restore-db /var/backups/swarm56/web/site-<timestamp>.db
```

## Health Check

```bash
curl http://127.0.0.1:3000/api/health
# Expected: {"status":"ok","db":"ok"}
```

`status`와 `db` 모두 `"ok"`여야 정상이다. HTTP 200만으로는 DB 연결을 확인할 수 없다.

## Directory Structure

```
/opt/swarm56/web/
├── releases/<RELEASE_ID>/    # 릴리스별 불변 디렉터리
├── current -> releases/<id>  # 현재 서비스 중인 릴리스
└── previous -> releases/<id> # 직전 릴리스 (롤백 대상)

/var/lib/swarm56/web/
└── site.db                   # SQLite DB (릴리스 밖에 위치)

/var/backups/swarm56/web/
└── site-<timestamp>.db       # 배포 전 자동 백업

/etc/swarm56/
└── web.env                   # 운영 환경변수 (root:swarm56-web 0640)
```
