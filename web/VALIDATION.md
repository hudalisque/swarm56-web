# Validation Checklist — swarm56.com

## Phase 2.5 Local Linux Validation

```bash
# 임시 DB
export DATABASE_URL="file:/tmp/swarm56-phase2-5.db"

# Migration
cd release/migrator
./node_modules/.bin/prisma migrate deploy
./node_modules/.bin/prisma db seed

# Standalone 실행
cd ../app
HOSTNAME=127.0.0.1 \
PORT=3100 \
NODE_ENV=production \
DATABASE_URL="file:/tmp/swarm56-phase2-5.db" \
node server.js &

# 다른 터미널에서 검증
curl -i http://127.0.0.1:3100/
curl -i http://127.0.0.1:3100/api/health
curl -i http://127.0.0.1:3100/non-existent-page
```

### 통과 조건

```
Homepage HTTP 200 ✅
Published Post 2건 렌더링 ✅
Health { status: "ok", db: "ok" } ✅
404 정상 ✅
Prisma Linux engine 오류 없음 ✅
```

## Phase 2.6 VPS Post-deployment Validation

```bash
# VPS에서 직접
curl -i http://127.0.0.1:3000/
curl -i http://127.0.0.1:3000/api/health
curl -i http://127.0.0.1:3000/non-existent-page

# systemd 상태
sudo systemctl status swarm56-web.service

# Nginx 확인
sudo nginx -t
```

## Smoke Test (로컬 서버 대상)

```bash
# web/ 디렉터리에서
SMOKE_BASE_URL=http://localhost:3000 npm run smoke:phase2-4
```

## Security Checks

```bash
# 아티팩트 내 비밀정보 검색
grep -rInE \
  'DATABASE_URL=file:|BEGIN.*PRIVATE KEY|AWS_SECRET|CLOUDFLARE|password\s*=' \
  release/ | grep -v node_modules | grep -v manifest.sha256 || echo "Clean"

# Windows 바이너리 확인
find release/app -name "*.exe" -o -name "query_engine-windows*" \
  && echo "WARNING: Windows binaries found" || echo "No Windows binaries ✅"

# 소스 코드 내 PrismaClient 직접 생성
grep -r "new PrismaClient" web/src | grep -v "prisma.ts" \
  && echo "WARNING" || echo "PrismaClient singleton only ✅"
```

## Gate Checklist

### Gate 2.5

```
[ ] Linux x86_64 에서 build 성공
[ ] Linux Prisma Client 생성
[ ] standalone server.js 존재
[ ] .next/static 포함
[ ] public 복사 (또는 미사용 확인)
[ ] 빈 DB migrate deploy 성공
[ ] seed 성공
[ ] Homepage HTTP 200
[ ] Post 2건 렌더링
[ ] Health { status: ok, db: ok }
[ ] 404 정상
[ ] deploy_web.sh bash -n 통과
[ ] rollback_web.sh bash -n 통과
[ ] build_release_linux.sh bash -n 통과
[ ] swarm56-web.service 작성
[ ] Nginx bootstrap 작성
[ ] Nginx TLS 작성
[ ] SHA-256 manifest 생성
[ ] 아티팩트 내 .env 없음
[ ] 아티팩트 내 운영 DB 없음
[ ] Windows 바이너리 없음
[ ] Phase 1 파일 무변경
[ ] Critical 0 / High 0
```

### Gate 2.6 (VPS 배포 후)

```
[ ] systemd enable + start 성공
[ ] Nginx swarm56.com 블록 활성화
[ ] curl https://swarm56.com/ → 200
[ ] curl https://swarm56.com/api/health → { status: ok, db: ok }
[ ] sync.swarm56.com 정상 (CouchDB 무변경)
[ ] TLS 인증서 swarm56.com 유효
[ ] Cloudflare Proxy 활성화 후 확인
```
