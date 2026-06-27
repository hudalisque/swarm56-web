# swarm56.com — Personal Brand Hub

> 최종 갱신: 2026-06-27 (설계 v4 — 옵시디언 단일소스 확정)
> 이 README는 프로젝트 진입점입니다. 작업 전 여기부터 읽으세요.

## 한 줄 정의
**Peter의 8개 채널 활동을 서버가 자동 클리핑해 옵시디언(지식 단일소스)에 전문으로 모으고, 홈페이지가 그 위에 카드 형태로 보여주는 Personal Brand Hub.** 카드 클릭 시 원문 외부 페이지로 이동.

## 아키텍처 (옵시디언 단일소스)
```
[8채널: 네이버블로그·노션·유튜브·깃헙·LinkedIn·Instagram·Facebook·Swarm]
   │ 새 글/수정 감지 → 클리핑(전문) → upsert(content-hash)
   ▼
[서버의 swarm56 옵시디언 Vault]  ← 단일 소스 (raw/<채널>/*.md, 전문)
   │   (CouchDB 3.5.2로 Peter 기기 Obsidian과 동기화)
   ├─▶ 클리퍼가 동시에 카드 메타 기록
   ▼
[SQLite 카드 캐시]  제목/발췌/썸네일/원문URL
   ▼
[홈페이지(Next.js)]  카드 표시 → 클릭 → 원문 외부 URL
```

| 부품 | 역할 |
|------|------|
| 옵시디언 Vault | **단일 진실원천** (전문 + LLM-wiki 지식베이스), 서버 직접 생성 |
| CouchDB 3.5.2 | 볼트 호스팅 + Peter 기기 동기화 (**유지**) |
| SQLite | 옵시디언 파생 **카드 캐시** (전문 아님) |
| 클리핑 에이전트 | 채널 → 옵시디언(전문) + SQLite(카드) |
| 홈페이지 | SQLite 읽어 카드 → 원문 링크 |

## 핵심 문서 (현행 v4)
- **[INTEGRATED_PLAN.md](INTEGRATED_PLAN.md)** — 통합 기획서 (IA·구성요소·데이터모델·결정 Ledger)
- **[IMPLEMENTATION_SPEC.md](IMPLEMENTATION_SPEC.md)** — 실무 구현 명세 (Rebaseline R0~R8)
- **[DBMS_REVIEW.md](DBMS_REVIEW.md)** — 저장 계층 검토 (옵시디언/SQLite/파일시스템/CouchDB)
- **[pipeline/](pipeline/)** — 멀티에이전트 핸드오프 기록 (HANDOFF_LOG, Relume 프롬프트 등)

## 현재 상태
- ✅ DNS: Cloudflare에서 `swarm56.com` → 54.116.19.34 추가 완료 (해석 정상)
- ✅ CouchDB 3.5.2 운영 중 (sync.swarm56.com, 검증됨) — 유지
- ⚠️ **홈페이지 미배포**: swarm56.com 요청이 현재 CouchDB로 새고 있음. swarm56.com용 Nginx server block + Let's Encrypt 인증서 + 앱 배포 필요 (코딩 단계 R7)
- ⚠️ swarm56 전용 옵시디언 볼트 아직 없음 → 서버에 생성 필요 (R1)

## 채널 클리핑 상태
- ✅ 네이버블로그: 작동 (`naverblog_clipper.py`, RSS→md)
- ⏳ 나머지 7채널(노션·유튜브·깃헙·LinkedIn·IG·FB·Swarm): 신규 제작. 공식 API 자동 우선, 불가시 수동 등록 fallback.

## 협업 구조
- **Peter + Claude = 공동 오케스트레이터** (Peter 결정권), Simone(GPT 웹버전)=기획 협업, Relume/v0.dev=디자인 벤더
- 헤라(Hermes)·투투(OpenClaw) = Peter의 다른 Claude Code 인스턴스 — 필요시 Peter 통해 협업
- 핸드오프는 `pipeline/` + Google Drive `agent-shared/swarm56_pipeline`에 기록
- 원칙: **문서 정리 먼저 → 코딩.** 시안 없이 코드 진입 금지.

## 중요 이력 메모
v1~v3 기획서의 "옵시디언 제거 / SQLite 직접 저장"은 2026-06 GPT/Sonnet이 **승인 없이 넣은 무단 설계 변경**이었음. Peter가 원래 같이 설계한 **옵시디언 단일소스** 구조로 v4에서 정정. (자세히: 메모리 `project_swarm56_architecture`)

## 폴더 구조
```
homepage_project/
├── README.md              ← 이 파일
├── INTEGRATED_PLAN.md     현행 통합 기획서 (v4)
├── IMPLEMENTATION_SPEC.md 현행 구현 명세 (v4)
├── DBMS_REVIEW.md         현행 저장 검토 (v4)
├── pipeline/              멀티에이전트 핸드오프
├── web/                   Next.js 앱
├── deploy/                배포 스크립트(Nginx/systemd)
└── archive/              (정리 예정) 이전 세대 기획·참고 문서
```
