# KNOWN ISSUES — 알려진 잠재 문제 / 미해결 위험

> 최초 작성: 2026-07-03, Claude (Claude Code). 서버 읽기 전용 진단 기반.
> 목적: **지금 당장 안 고치되, 문제가 터졌을 때 바로 원인을 짚도록** 잠재 위험을 기록한다.
> 각 항목: 증상 / 증거 / **언제 터지나(트리거 조건)** / **어디를 고치나**.
>
> 회고 배경: [verification/PROCESS_RETROSPECTIVE.md](verification/PROCESS_RETROSPECTIVE.md)

---

## 🔴 HIGH — config split-brain (vault / DB 이중 경로)

- **증상(잠재):** 서버에 v5 이전(死) 경로와 v5(現) 경로가 병존한다.
  - `죽음`: `/var/lib/swarm56/vault/` (Jun-29에서 멈춤), `/var/lib/swarm56/web/site.db`
  - `현행`: `/var/lib/swarm56/vault-v5/` (Jul-02 신규), `/var/lib/swarm56/web/site-v5.db`
- **증거:** `swarm56-agent.service`의 inline `Environment=SWARM56_VAULT_DIR=/var/lib/swarm56/vault`·`…/site.db`는 **낡은 경로**를 가리킨다. 그럼에도 현행으로 도는 이유는 `EnvironmentFile=/etc/swarm56/agent.env`가 `SWARM56_VAULT_DIR=/var/lib/swarm56/vault-v5`·`SWARM56_DB_PATH=…/site-v5.db`로 **override**하기 때문. (systemd: EnvironmentFile이 Environment=를 override) 실제 이미지·신규 클리핑이 vault-v5에 기록됨을 확인.
- **언제 터지나:** `agent.env`에서 `SWARM56_VAULT_DIR`/`SWARM56_DB_PATH` 줄을 지우거나 override가 깨지면, 유닛이 **낡은 `vault/`·`site.db`로 폴백**해 이미지 404 + 데이터 되돌아감(빈/구버전).
- **어디를 고치나:** 근본 해결은 유닛 inline의 낡은 경로를 v5로 정정하거나 제거하고, `agent.env`에 v5 경로를 단일 소스로 확정. (신규 clip/force 유닛은 이 함정을 피해 작성됨 — `deploy/swarm56-clip.service` 참조.) 죽은 `vault/`·`site.db`는 백업 후 정리 검토.

---

## 🟠 MEDIUM — /vault·nginx 서버 수정이 repo에 미반영 (드리프트)

- **증상(잠재):** 이미지 서빙 nginx 설정이 **서버에만 있고 repo엔 없다.**
- **증거:** 서버 `nginx -T`에 `location /vault/ { alias /var/lib/swarm56/vault-v5/raw/; }`·`location /thumbnails/ { alias /var/lib/swarm56/web/thumbnails/; }` 존재 → 이미지 실제 `HTTP 200`. 그러나 repo `deploy/swarm56-web.conf`·`deploy/nginx.conf`에는 `/vault`·`/thumbnails` location이 **없음**. (1차 검증 861c62c `:35,:205`에서 원래 FAIL로 지적됐던 항목이 서버에서만 수정됨)
- **언제 터지나:** repo 설정으로 **재배포하거나 롤백**하면 서버의 `/vault` alias가 사라져 **홈페이지 이미지 전부 404**.
- **어디를 고치나:** `deploy/swarm56-web.conf`(또는 nginx.conf)에 위 두 location 블록을 추가해 repo↔서버 일치.

---

## 🟠 MEDIUM — deploy_web.sh 가 실제 서버 구성과 불일치 (웹 배포 경로 드리프트)

- **증상(잠재):** repo의 웹 배포 스크립트를 그대로 실행하면 실패한다. 즉 웹 코드 변경을 프로덕션에 반영할 **재현 가능한 배포 경로가 없다.**
- **증거:** `deploy/deploy_web.sh`는 `BASE_DIR=/opt/swarm56/web/current`, `user swarm56-web`, `ENV_FILE=/etc/swarm56/web.env`, `DB=site.db`, `systemctl swarm56-web.service`(releases/심링크 방식)을 전제. 그러나 실제 서버는 `swarm56-web.service` → `WorkingDirectory=/opt/swarm56/app` + `ExecStart=/usr/bin/npm start`, `User=ubuntu`(`swarm56-web` 계정 없음), 웹 env는 `/opt/swarm56/app/.env`, DB는 `site-v5.db`. 스크립트의 pre-flight(`id swarm56-web`, `/opt/swarm56/web/releases`, `/etc/swarm56/web.env`)에서 즉시 실패.
- **언제 터지나:** 웹 코드 수정(예: 이 건의 편집폼 닫힘·시간 KST·요청접수 배너)을 프로덕션에 올릴 때. 배포 방법이 문서화/자동화돼 있지 않아 매번 수동·임기응변이 됨.
- **어디를 고치나:** `deploy_web.sh`를 실제 `/opt/swarm56/app`(npm start) 방식에 맞게 재작성하거나, 실제 수동 배포 절차를 `deploy/`에 문서화. **[미해결] 이번 세션의 웹 코드(B0/B2)는 repo에 커밋됐으나 프로덕션 미반영 상태 — 이 배포 경로 정리 후 반영 필요.**

## 🟠 MEDIUM — CouchDB 잔재 (죽은 아키텍처 가동 중)

- **증상(잠재):** v5 설계상 제거 대상인 CouchDB가 아직 돌고 있다.
- **증거:** `systemctl is-active couchdb` → `active`, `127.0.0.1:5984` LISTEN, `beam.smp` ~39MB RAM. nginx에 `server_name sync.swarm56.com` → `proxy_pass http://127.0.0.1:5984` + 전용 SSL cert 살아있음. repo `deploy/nginx.conf`도 CouchDB 프록시 유지(861c62c `:36` "Stale CouchDB deploy config").
- **언제 터지나:** 1GB 서버 메모리 압박(OOM) 시 자원 회수 대상. `sync.swarm56.com`이 외부 공격 표면으로 남음.
- **어디를 고치나:** CouchDB decommission(백업 후) 또는 최소한 `sync.swarm56.com` vhost·`deploy/nginx.conf` CouchDB 설정 정리 + 인증서 정리.

---

## 🟡 LOW / INFO — 채널 계약 드리프트 (Facebook)

- **증상(잠재):** 문서(v5)는 Facebook을 빈 채널로 규정하나 코드가 collector를 실행할 수 있다.
- **증거:** 861c62c `:41,:172` — `agent/main.py`가 `FACEBOOK` collector 포함(LinkedIn 없음), GitHub은 repos만 수집(releases 없음). `INTEGRATED_PLAN_v5` 채널 계약과 불일치.
- **언제 터지나:** Facebook 토큰이 env에 있으면 의도치 않게 FB 카드가 채워질 수 있음.
- **어디를 고치나:** `agent/main.py` 채널 목록을 v5 계약과 정렬(또는 문서 갱신).

---

## ✅ 확인됨 — 문제 아님 (오해 방지용 기록)

- **SESSION_SECRET**: `/opt/swarm56/app/.env`에 설정됨. dev 하드코딩 fallback 아님 → 세션 서명 안전.
- **/vault 이미지 서빙(런타임)**: 현재 `HTTP 200` 정상. (단, 위 MEDIUM 드리프트 위험은 별개)
- **정기 클리핑**: `swarm56-agent.timer` 매일 04:00 UTC 정상 실행.

---

## 갱신 이력
- 2026-07-03: 최초 작성. 백오피스 트리거 미작동 조사 중 발견한 형제 위험 4건 + 확인 3건 기록. (Claude)
