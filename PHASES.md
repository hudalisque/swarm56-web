# swarm56 — Phase 종합 현황

> 모든 단계(인프라 Phase 1 + 빌드 R0~R8)를 **실제 완료 상태** 기준으로 종합.
> 최종 갱신: 2026-06-28 (Claude 작성). 출처: `deploy/phase_status.md`(Phase1), `IMPLEMENTATION_SPEC.md`(R0~R8), 실 배포 검증.
> ⚠️ 기존 `README.md`/`CODE_SPEC.md`는 옛 `web/` 앱·미배포 기준이라 **stale**. 현행은 이 문서 + `DOCUMENTATION.md` 기준.

---

## 한눈에 — 단계별 상태

| 단계 | 내용 | 상태 |
|------|------|------|
| **Phase 1A** | VPS·Swap·Nginx 기반 | ✅ 완료 (2026-06-26) |
| **Phase 1B** | CouchDB 설치·localhost 바인딩·인증 | ✅ 완료 (2026-06-26) |
| **Phase 1C** | Cloudflare DNS·TLS·HTTPS (sync.swarm56.com) | ✅ 완료 (2026-06-27) |
| **R0** | 기준선·채널 capability | ✅ 완료 |
| **R1** | 서버 옵시디언 볼트 + CouchDB LiveSync | ⏳ **미완**(보류) |
| **R2** | SQLite 카드 캐시 스키마(FeedCard/SyncRun) | ✅ 완료 |
| **R3** | 클리핑 vertical slice(네이버) | ✅ 완료 |
| **R4** | 썸네일 서브시스템(Python, SSRF) | ✅ 완료 |
| **R5** | 공개 홈피 UI(8채널) | ✅ 완료 (personal-brand-hub) |
| **R6** | 나머지 채널 클리퍼 + upsert + WAL | ✅ 완료 (6/8 채널) |
| **R7** | 도메인·배포(Nginx swarm56.com + LE + 앱) | ✅ **완료 — 라이브** (2026-06-28) |
| **R8** | 최소 Admin + 수동 fallback | ⏳ **미완**(보류) |

**현 상태 요약: https://swarm56.com 라이브, 6/8 채널 자동 수집(매일 04:00). 미완 = R1(옵시디언 볼트 동기화), R8(어드민).**

---

## Phase 1 — 인프라 (완료)

`deploy/phase_status.md`에 상세. 요약:
- **1A**: AWS Lightsail Ubuntu 24.04, 1GB/40GB, Static IP `54.116.19.34`, Swap 4GB, Nginx 1.24.
- **1B**: CouchDB 3.5.2, `127.0.0.1:5984` 전용 바인딩, admin 인증, Nginx 프록시 검증.
- **1C**: Cloudflare DNS(`sync.swarm56.com`), Certbot TLS, HTTPS 전환. → **sync.swarm56.com 운영 중**.

---

## R0~R8 — 빌드/배포 (IMPLEMENTATION_SPEC 기준 실제 결과)

### R0 기준선 ✅
VPS·CouchDB 현황 기록, 8채널 capability 가정. 코드 변경 없음.

### R1 서버 옵시디언 볼트 + CouchDB 동기화 ⏳ 미완(보류)
- 계획: 서버에 swarm56 전용 볼트(`raw/<채널>/`) 생성 + CouchDB LiveSync로 Peter 기기 Obsidian과 동기화.
- 현실: **미배선.** 서버에 `/var/lib/swarm56/vault` 디렉토리 stub만 있고, 에이전트가 md를 거기 쓰지만 **CouchDB 동기화는 연결 안 됨.** 현재 시스템은 **SQLite 카드 캐시 중심**으로 동작(홈피는 site.db만 읽음).
- 영향: 홈피/수집은 정상 작동. 옵시디언 단일소스 비전(전문 지식베이스 동기화)은 향후 작업.

### R2 SQLite 카드 캐시 스키마 ✅
- `FeedCard`(originalUrl @unique, `@@unique([channel,externalId])`, vaultPath, contentHash, excerpt, thumbnailPath/Kind, status, publishedAt) + `SyncRun`. 구 `Post` seed 폐기.
- Prisma 6.19.3 + SQLite. (스키마: `personal-brand-hub/prisma/schema.prisma`)

### R3 클리핑 vertical slice ✅
- `agent/` one-shot 오케스트레이터: 수집→normalize→md(볼트)+카드(SQLite) upsert→SyncRun→exit.
- 네이버 클리퍼 이식 완료(`agent/collectors/naver_blog.py`). content-hash dedup/재클립 동작.

### R4 썸네일 서브시스템 ✅
- `agent/thumbnail.py`: SSRF 차단(사설IP/localhost), MIME allowlist, Pillow 리사이즈/webp, hash 파일명, atomic.
- 서버 저장: `/var/lib/swarm56/web/thumbnails/<채널>/`, Nginx `/thumbnails/` 서빙(R7).

### R5 공개 홈피 UI ✅
- **앱 = `personal-brand-hub/`** (v0.dev 디자인 export, Tailwind v4). ※기획서의 `web/`(구 Post 앱)은 폐기.
- Server Component `page.tsx`(force-dynamic) → `getItemsByChannel()`(채널당 ACTIVE 5개) → SocialHub(8채널 타일/카드). 카드 클릭 → 원문 외부 URL.

### R6 나머지 채널 클리퍼 + 업서트 ✅ (6/8)
- 작동(6): 네이버·GitHub·YouTube(RSS)·Notion(토큰)·Swarm(Foursquare OAuth)·Instagram(Graph API+토큰 자동갱신).
- 차단(2): **LinkedIn·Facebook** — 플랫폼 공식 API 막힘. 시도·결과는 `CHANNEL_INTEGRATION_NOTES.md`에 기록.
- 공통 upsert(content-hash), SQLite WAL + busy_timeout. systemd timer 매일 04:00.

### R7 도메인·배포 ✅ 라이브
- `swarm56.com` Nginx server block(→127.0.0.1:3000) + **Let's Encrypt 인증서 발급**, HTTP→301.
- 앱 `/opt/swarm56/app`(next start, systemd `swarm56-web`), DB `/var/lib/swarm56/web/site.db`.
- 에이전트 `/opt/swarm56/agent`(venv) + `swarm56-agent.service`/`.timer`.
- 검증: 외부 `https://swarm56.com` 200 + 실데이터, 인증서 정상, 썸네일 서빙.
- ※실제 배포는 IMPLEMENTATION_SPEC의 release/symlink 방식 대신 **직접 빌드+systemd** 방식으로 단순화(1GB VPS).

### R8 최소 Admin + 수동 fallback ⏳ 미완(보류)
- 계획: 로그인, 카드 status 토글, 수동 카드 등록(자동불가 채널=LinkedIn/FB), SyncRun 조회.
- 현실: 미착수. LinkedIn/FB를 수동으로 채우려면 이 단계 필요.

---

## 남은 작업 (미완)
1. **R1** — 서버 옵시디언 볼트 ↔ CouchDB LiveSync 연결 (옵시디언 단일소스 비전 완성)
2. **R8** — 어드민 + 수동 등록(LinkedIn/FB 수동 보충용)
3. (보안) 노출 토큰 rotate — `project_swarm56_deploy` 메모리 참조

## 비가역/운영 주의
- R2 Post drop, R7 운영 DB migration·Nginx·cert = 비가역(백업 후 수행, 완료).
- CouchDB decommission 없음(유지). 자동 hard delete 없음(soft status만).
