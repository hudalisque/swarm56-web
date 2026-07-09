# swarm56 — Phase 종합 현황 v2

> v2 · 2026-07-09 · 이전 버전: [PHASES.md](PHASES.md) (보존 — 2026-06-28, v5 라이브 이전 기준)
> 변경 사유: v5 라이브(볼트 단일소스+백오피스, 06-29) · 트리거 복구(07-03) · **R9 백오피스 프로젝트 카드 추가**(07-09) 반영.
> 모든 단계(인프라 Phase 1 + 빌드 R0~R9)를 **실제 완료 상태** 기준으로 종합.

---

## 한눈에 — 단계별 상태

| 단계 | 내용 | 상태 |
|------|------|------|
| **Phase 1A** | VPS·Swap·Nginx 기반 | ✅ 완료 (2026-06-26) |
| **Phase 1B** | CouchDB 설치·localhost 바인딩·인증 | ✅ 완료 (2026-06-26) — ※v5에서 아키텍처 제거, 서비스 잔존 |
| **Phase 1C** | Cloudflare DNS·TLS·HTTPS (sync.swarm56.com) | ✅ 완료 (2026-06-27) |
| **R0** | 기준선·채널 capability | ✅ 완료 |
| **R1** | 옵시디언 볼트 ↔ CouchDB LiveSync(클라이언트 동기화) | ⏳ **미완**(보류) — ※서버 볼트 자체는 v5 단일소스로 라이브 |
| **R2** | SQLite 카드 캐시 스키마 | ✅ 완료 → **v5 개정**(status/thumbnailKind/contentHash 제거, Suppression·Audit 추가) |
| **R3** | 클리핑 vertical slice(네이버) | ✅ 완료 |
| **R4** | 이미지 서브시스템(SSRF·webp) | ✅ 완료 → v5에서 본문 전체 이미지 볼트 저장으로 확장 |
| **R5** | 공개 홈피 UI(8채널) | ✅ 완료 (personal-brand-hub) |
| **R6** | 나머지 채널 클리퍼 + upsert + WAL | ✅ 완료 (6/8 채널) |
| **R7** | 도메인·배포(Nginx swarm56.com + LE + 앱) | ✅ **완료 — 라이브** |
| **v5** | **옵시디언 볼트 단일소스 재구현 + 백오피스** (계획의 R8 어드민 대부분 포함) | ✅ **완료 — 라이브** (2026-06-29 cutover, Codex 3라운드 검증) |
| **v5 후속** | 온디맨드 트리거(systemd .path) 복구 + 편집닫힘/KST/배너 | ✅ 완료 (2026-07-03, `ef44713`) |
| **R9** | **백오피스 프로젝트 카드 추가**(ProjectCard DB화 + /docs nginx + 볼트 project/ 업로드) | 🔨 **구현 완료(로컬) — 배포 대기** (2026-07-09) |

**현 상태 요약: https://swarm56.com 라이브(v5). 6/8 채널 자동 수집(매일 04:00 UTC) + 온디맨드 트리거. 백오피스 = 로그인·삭제/복원/편집·SyncRun·감사로그·트리거. R9(프로젝트 카드 추가) 코드·문서 완료, 서버 배포 대기.**

---

## Phase 1 — 인프라 (완료)

`deploy/phase_status.md`에 상세. 요약:
- **1A**: AWS Lightsail Ubuntu 24.04, 1GB/40GB, Static IP, Swap 4GB, Nginx 1.24.
- **1B**: CouchDB 3.5.2, `127.0.0.1:5984` 전용 바인딩, admin 인증. → v5에서 아키텍처 제거, 서비스는 잔존(`KNOWN_ISSUES_v2.md`).
- **1C**: Cloudflare DNS(`sync.swarm56.com`), Certbot TLS, HTTPS 전환.

---

## R0~R9 — 빌드/배포 (실제 결과)

### R0 기준선 ✅
VPS·CouchDB 현황 기록, 8채널 capability 가정. 코드 변경 없음.

### R1 옵시디언 클라이언트 동기화 ⏳ 미완(보류)
- 계획: 서버 볼트를 CouchDB LiveSync로 Peter 기기 Obsidian과 동기화.
- 현실: **서버 볼트(`vault-v5`)는 v5에서 단일소스로 라이브** — 에이전트가 전문 md+이미지를 쓰고 홈피가 파생 소비. 다만 **Peter 기기와의 LiveSync 배선은 미완**(지식베이스 동기화 비전은 향후).

### R2 SQLite 스키마 ✅ (v5 개정)
- v5 현행: `FeedCard`(status/thumbnailKind/contentHash **없음**) + `ProjectCard`(R9) + `SuppressionRecord`(삭제 의도, 방식 B) + `AdminAudit` + `SyncRun`.
- 마이그레이션 3개: init_feedcard → v5_obsidian_source_suppression → project_card(R9).

### R3 클리핑 vertical slice ✅
- `agent/` Phase A/B 오케스트레이터. 네이버 이식 완료. dedup=볼트 md 존재(v5).

### R4 이미지 ✅ (v5 확장)
- v5: 본문 **전체 이미지**를 볼트 `_assets/<해시>.webp`로 저장(SSRF 차단·재인코딩) + md 링크 치환. Nginx `/vault/` 서빙.

### R5 공개 홈피 UI ✅
- **앱 = `personal-brand-hub/`** (v0.dev 디자인, Tailwind v4). Server Component → SocialHub 8채널 타일/카드. 카드 클릭 → 원문.
- R9: Work/Projects 섹션이 하드코딩 → **ProjectCard DB 렌더링**으로.

### R6 나머지 채널 클리퍼 ✅ (6/8)
- 작동(6): 네이버·GitHub·YouTube(RSS)·Notion(토큰)·Swarm(Foursquare OAuth)·Instagram(Graph API+토큰 자동갱신).
- 차단(2): **LinkedIn·Facebook** — 플랫폼 공식 API 막힘(`CHANNEL_INTEGRATION_NOTES.md`).

### R7 도메인·배포 ✅ 라이브
- `swarm56.com` Nginx(→:3000) + Let's Encrypt. 앱 `/opt/swarm56/app`(next start).
- 배포 방식: release/symlink 계획 대신 **surgical in-place**로 단순화(`BACKOFFICE_FEATURE_CONTEXT_v2.md` §5). 계획 잔재(deploy_web.sh)는 `KNOWN_ISSUES_v2.md`.

### v5 볼트 단일소스 + 백오피스 ✅ 라이브 (2026-06-29)
- 옵시디언 볼트 단일소스 재구현(HF-001 정정 노선), site-v5.db·vault-v5 cutover.
- **백오피스 `/admin`**: bcrypt 로그인·세션·rate limit, 카드 삭제(방식 B)/복원/편집, SyncRun, 감사로그, 트리거 버튼. → 계획상 R8 "최소 Admin"의 대부분이 여기서 구현됨(잔여: LinkedIn/FB 수동 등록).
- Codex 3라운드 독립 검증(861c62c → c4e97ff → b2638f1 채택).

### v5 후속 — 트리거 복구 + UI (2026-07-03, `ef44713`) ✅
- 온디맨드 트리거가 실제 미작동이었음을 발견(systemd `.path` 유닛 미설치 — 검증이 남긴 후속항목 미이행이 원인) → 유닛 정정·서버 설치·E2E 검증.
- 편집폼 저장 후 닫힘 · 관리자 시간 KST · 요청접수 배너. 회고: `verification/PROCESS_RETROSPECTIVE.md`.

### R9 백오피스 프로젝트 카드 추가 🔨 구현 완료(로컬) — 배포 대기 (2026-07-09)
- `/admin`에서 카드 추가: 제목·요약·**HTML 업로드**(카드 링크)·**MD 업로드**(볼트 지식그래프)·태그. 재배포 불필요.
- 아키텍처 3건 변경: ①카드 DB화(`ProjectCard`+시드 3장) ②`/docs/` nginx alias(런타임 서빙) ③**웹→볼트 `project/` 한정 쓰기 예외**(정본 개정 — `INTEGRATED_PLAN_v6.md` §1·§16).
- 로컬 검증: build·lint·마이그레이션(dev.db) ✅. 상세·배포 절차: `BACKOFFICE_FEATURE_CONTEXT_v2.md`.

---

## 남은 작업 (미완)
1. **R9 배포** — 서버 DB 백업 → nginx `/docs/`+디렉토리 → push/pull → migrate → build → **배포 후 스모크 테스트**(체크리스트 `VERIFICATION_CHECKLIST_v2.md` §9)
2. **R1** — 볼트 ↔ Peter 기기 LiveSync (옵시디언 동기화 비전 완성)
3. **R8 잔여** — LinkedIn/FB 수동 등록 (필요 시)
4. (보안) 노출 토큰 rotate(Notion 등), SSH 키 repo 폴더 밖 이동, **public repo 내 서버 IP 정리** — `KNOWN_ISSUES_v2.md`

## 비가역/운영 주의
- R2 Post drop, R7 운영 DB migration·Nginx·cert, v5 cutover = 비가역(백업 후 수행, 완료). R9 마이그레이션도 백업 선행.
- CouchDB decommission 없음(잔존). 자동 hard delete 없음.
- ⚠️ **알려진 잠재 위험·repo↔서버 드리프트는 [KNOWN_ISSUES_v2.md](KNOWN_ISSUES_v2.md) 참조.** 검증 절차 회고: [verification/PROCESS_RETROSPECTIVE.md](verification/PROCESS_RETROSPECTIVE.md).
