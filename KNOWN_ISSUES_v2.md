# KNOWN ISSUES v2 — 알려진 잠재 문제 / 미해결 위험

> v2 · 2026-07-09 · 이전 버전: [KNOWN_ISSUES.md](KNOWN_ISSUES.md) (보존 — 2026-07-03 최초 조사 시점)
> 변경 사유: 백오피스 카드 추가 기능(R9)으로 인한 상태 변화(웹 배포 경로 확인·nginx 부분 반영) + 신규 발견(public repo 내 서버 IP) 반영.
> 목적: **지금 당장 안 고치되, 문제가 터졌을 때 바로 원인을 짚도록** 잠재 위험을 기록한다. (Peter 원칙: 실제 발생한 문제만 수정)
> 각 항목: 증상 / 증거 / **언제 터지나(트리거 조건)** / **어디를 고치나**.
> 회고 배경: [verification/PROCESS_RETROSPECTIVE.md](verification/PROCESS_RETROSPECTIVE.md)

---

## 🔴 HIGH — config split-brain (vault / DB 이중 경로) — 변화 없음

- **증상(잠재):** 서버에 v5 이전(死) 경로와 v5(現) 경로가 병존한다.
  - `죽음`: `/var/lib/swarm56/vault/` (Jun-29에서 멈춤), `/var/lib/swarm56/web/site.db`
  - `현행`: `/var/lib/swarm56/vault-v5/`, `/var/lib/swarm56/web/site-v5.db`
- **증거:** `swarm56-agent.service`의 inline `Environment=`가 **낡은 경로**(vault·site.db)를 가리키나, `EnvironmentFile=/etc/swarm56/agent.env`가 v5 경로로 **override** 중이라 현행으로 동작. (systemd: EnvironmentFile이 Environment=를 override)
- **언제 터지나:** `agent.env`에서 `SWARM56_VAULT_DIR`/`SWARM56_DB_PATH` 줄을 지우거나 override가 깨지면 **낡은 경로로 폴백** → 이미지 404 + 데이터 되돌아감.
- **어디를 고치나:** 유닛 inline의 낡은 경로를 v5로 정정/제거, `agent.env`를 단일 소스로. (clip/force 유닛은 이 함정을 피해 작성됨.) 죽은 `vault/`·`site.db`는 백업 후 정리 검토.

---

## 🔴 HIGH (신규 2026-07-09) — public repo에 서버 IP 노출

- **증상:** 프로덕션 서버 공인 IP가 **public repo의 커밋된 문서들에 평문으로 존재**한다. (이 문서에는 재기재하지 않음 — 값은 로컬 전용 `AGENTS_v2.md` 참조)
- **증거:** `PROJECT_OVERVIEW.md`(:164·:195), `PROJECT_OVERVIEW.html`(:194·:241), `DOCUMENTATION.md`(:141), `DBMS_REVIEW.md`(:4), `PHASES.md`(:33), `deploy/phase_status.md` 등 — 모두 tracked 상태로 push됨(`github.com/hudalisque/swarm56-web` = public). AGENTS.md만 07-03에 gitignore로 차단됐음.
- **언제 터지나:** 상시 노출 상태. IP를 아는 공격자는 도메인 뒤 Cloudflare 같은 보호 없이 서버를 직접 스캔·공격 가능(SSH 포트 등). 단 SSH는 키 인증 전용이라 즉시 위험은 제한적.
- **어디를 고치나:** ① v2 문서 세대는 IP 미기재로 작성됨(이 문서 포함) — v2를 canonical로 쓰고 ② 원본 문서들의 IP는 히스토리에 이미 있으므로 완전 제거는 불가(BFG 등 히스토리 재작성은 과함) → 실질 대응 = **Lightsail 방화벽에서 SSH 접근 IP 제한** 또는 IP 변경(Static IP 재할당) 검토. Peter 판단 대기.

---

## 🟠 MEDIUM — /vault·/thumbnails nginx 서버 수정이 repo에 미반영 (드리프트) — 부분 변화

- **증상(잠재):** 이미지 서빙 nginx 설정이 **서버에만 있고 repo엔 없다.**
- **증거:** 서버 `nginx -T`에 `/vault/`(→vault-v5/raw)·`/thumbnails/` alias 존재(이미지 200 정상). repo `deploy/swarm56-web.conf`에는 `/vault/`(**낡은 경로** `/var/lib/swarm56/vault/raw/` — 서버와 불일치!)만 있고 `/thumbnails/` 없음.
- **(v2 갱신)** R9에서 `location /docs/` 블록은 **repo에 먼저 반영**됨(`deploy/swarm56-web.conf`) — 신규 항목은 드리프트 없이 시작. 기존 두 블록의 드리프트는 여전.
- **언제 터지나:** repo 설정으로 **재배포하거나 롤백**하면 `/vault`가 낡은 경로를 보고 `/thumbnails`가 사라져 **이미지 404**.
- **어디를 고치나:** `deploy/swarm56-web.conf`의 `/vault/` alias를 `vault-v5/raw/`로 정정 + `/thumbnails/` 블록 추가 → repo↔서버 일치.

---

## 🟠 MEDIUM — deploy_web.sh 등 고아 배포 아티팩트 (v2 정정: "배포 경로 없음" 아님)

- **증상(잠재):** repo에 **폐기된 배포 모델**(releases/심링크·`swarm56-web` 계정·web.env)을 기술하는 파일들이 남아 있어, 그대로 믿고 실행하면 실패하거나 서버를 망가뜨린다.
- **증거:** `deploy/deploy_web.sh`·`deploy/rollback_web.sh`·`deploy/web.env.example`·`archive/TECH_SPEC.md`·`CODE_SPEC.md`(v1)가 releases 모델 전제. 실제 서버는 `/opt/swarm56/app` + `npm start` + `User=ubuntu`. 원인 = **2026-06-29 배포모델 전환**(EnvironmentFile bcrypt 깨짐 핫픽스 → surgical 방식) 후 일부 아티팩트만 갱신됨.
- **(v2 정정)** v1의 "재현 가능한 배포 경로가 없다"는 **부정확** — 실제 surgical 런북이 문서화돼 있음(`BACKOFFICE_FEATURE_CONTEXT_v2.md` §5, 07-03·07-09 배포에 사용·검증). v1의 "[미해결] 웹 코드 프로덕션 미반영"도 **해소**(07-03 배포 완료, DEPLOYED_SHA=ef44713).
- **언제 터지나:** 새 세션/에이전트가 deploy_web.sh를 신뢰하고 실행할 때(pre-flight에서 실패하나 혼란 유발).
- **어디를 고치나:** deploy_web.sh·rollback_web.sh·web.env.example를 surgical 방식으로 재작성 또는 폐기 표시.

## ✅ 조치됨 (2026-07-09) — CouchDB 잔재 → 외부 문 폐쇄 + 서비스 중지

- **배경:** v5 설계상 제거 대상인 CouchDB가 가동 중 + `sync.swarm56.com`으로 외부 노출. Peter 보안 원칙(외부 공격면 = 선제 대응)에 따라 조치.
- **조치(2026-07-09, Peter 승인, Claude 실행):**
  - nginx `sites-enabled/swarm56-sync` **심링크 제거**(원본 `sites-available/swarm56-sync` 보존 — 되돌리기 = `ln -s` 한 줄) → `nginx -t` OK → reload
  - `couchdb` **stop + disable** (데이터 무삭제 보존 — R1 재개 시 enable+링크 복구만 하면 됨)
  - 검증: 5984 리스닝 0 · sync.swarm56.com 접속 불가 · swarm56.com 200 무회귀 · weekly vhost 무접촉
- **잔여:** ① `sync.swarm56.com` Let's Encrypt cert가 남아 있어 자동 갱신이 실패 경고를 낼 수 있음(무해 — 시끄러우면 `certbot delete --cert-name sync.swarm56.com`) ② Cloudflare DNS의 sync 레코드 잔존(무해 — 원하면 Peter가 삭제) ③ repo `deploy/nginx.conf`의 CouchDB 프록시 설정은 여전히 낡음(고아 아티팩트 항목과 함께).

---

## 🟡 LOW / INFO — 채널 계약 드리프트 (Facebook) — 변화 없음

- **증상(잠재):** 문서(v5/v6)는 Facebook을 빈 채널로 규정하나 코드가 collector를 실행할 수 있다.
- **증거:** 861c62c `:41,:172` — `agent/main.py`가 `FACEBOOK` collector 포함(LinkedIn 없음), GitHub은 repos만(releases 없음).
- **언제 터지나:** Facebook 토큰이 env에 있으면 의도치 않게 FB 카드가 채워질 수 있음.
- **어디를 고치나:** `agent/main.py` 채널 목록을 계약과 정렬(또는 문서 갱신).

## 🟡 LOW / INFO — 관리자 헤더 버튼 hover/커서 밋밋함 (버그 아님, 미수정 결정) — 변화 없음

- **증상:** `/admin` 헤더 버튼들이 hover 반응이 거의 안 느껴지고 커서가 화살표.
- **증거(고장 아님):** 빌드 CSS에 hover 규칙 정상(`:hover` 47개). 색 변화가 미묘할 뿐 + Tailwind v4가 버튼 기본 `cursor:pointer` 제거.
- **어디를 고치나:** 원하면 `cursor-pointer` + 진한 hover. **2026-07-03 Peter 결정: 수정 안 함, 기록만.**

## 🟡 LOW / INFO (신규 2026-07-09) — R9 미배포 상태의 과도기

- **증상:** R9 코드(ProjectCard·/docs·업로드)가 로컬 완료·미배포. 이 상태에서 서버에 마이그레이션 없이 새 코드만 올라가면 홈 `/`가 ProjectCard 테이블 부재로 에러.
- **어디를 고치나:** 배포 절차 순서 준수(백업→migrate→build→restart — `BACKOFFICE_FEATURE_CONTEXT_v2.md` §5). 배포 완료 후 이 항목 삭제.

## ✅ 확인됨 — 문제 아님 (오해 방지용 기록)

- **SESSION_SECRET**: `/opt/swarm56/app/.env`에 설정됨 → 세션 서명 안전.
- **/vault 이미지 서빙(런타임)**: `HTTP 200` 정상. (위 MEDIUM 드리프트 위험은 별개)
- **정기 클리핑**: `swarm56-agent.timer` 매일 04:00 UTC 정상.
- **온디맨드 트리거**: 2026-07-03 복구 — 클릭→소비→SyncRun 검증 완료.
- **웹 배포 경로**: surgical 런북 존재·검증됨(07-03·예정 R9) — "배포 불가" 아님.

---

## 갱신 이력
- 2026-07-03: 최초 작성(v1). 백오피스 트리거 미작동 조사 중 발견한 형제 위험 4건 + 확인 3건. (Claude)
- 2026-07-03(추가, v1 미커밋분): 관리자 버튼 hover 메모.
- 2026-07-09: **v2 신규 작성**(v1 보존). deploy_web.sh 항목 정정(고아 아티팩트 — 배포 경로는 존재), nginx 드리프트에 /docs repo-first 반영·/vault 경로 불일치 명시, **신규: public repo 서버 IP 노출(HIGH)**, R9 과도기 항목. (Claude)
- 2026-07-09(추가): **CouchDB 외부 문 폐쇄 + 서비스 중지 실행**(Peter 승인 — 보안 원칙 정정: 외부 공격면은 선제 대응). SSH 방화벽 IP 제한은 Peter 콘솔 작업 대기. (Claude)
