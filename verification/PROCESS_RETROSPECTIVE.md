# 검증 절차 회고 및 개선안 — 백오피스 클리핑 트리거 미작동 건

> 작성: 2026-07-03, Claude (Claude Code). 사용자(Peter) 제기: swarm56.com/admin '지금 클리핑'/'강제 갱신' 버튼 무반응.
> 성격: 사후 회고(retrospective) + 절차 개선안. 근거는 서버 읽기 전용 진단과 리포지토리 검증 산출물.

---

## 1. 무슨 일이 있었나 (요약)

백오피스의 '지금 클리핑'/'강제 갱신' 버튼이 **실제로 아무 일도 하지 않고 있었다.**
- 웹은 트리거 파일(`/var/lib/swarm56/triggers/clip.now`)을 정상 기록하고 감사로그도 남긴다. (여기까지 정상)
- 그러나 그 파일을 감지해 클리핑 에이전트를 실행할 **systemd `.path` 유닛이 서버에 설치되어 있지 않았다.**
- 그래서 트리거 파일은 소비되지 않고 쌓이기만 했고, 온디맨드 클리핑은 한 번도 실행된 적이 없다.
- 매일 04:00 UTC 정기 실행(`swarm56-agent.timer`)만 별도로 동작해, SyncRun 로그가 채워지니 겉보기엔 클리핑이 되는 것처럼 보였다.

**서버 실측 증거(2026-07-03):**
- `systemctl is-enabled swarm56-clip.path swarm56-force.path …` → 전부 `not-found`
- `/etc/systemd/system`에 `swarm56-agent.{service,timer}`, `swarm56-web.service`만 존재 (clip/force 유닛 없음)
- `/var/lib/swarm56/triggers/clip.now`(07-03 00:32), `force.now`(07-02 23:23) — 소비되지 않고 잔존
- `journalctl -u swarm56-clip.*` → "No entries"

---

## 2. 핵심 결론 — 체크리스트도, 검증(Codex)도 실수가 아니다

이 건의 통념적 원인 후보 두 가지는 **모두 사실이 아니다.**

### 2.1 체크리스트는 항목을 정확히 갖고 있었다
`VERIFICATION_CHECKLIST.md`:
- `:26` "클리핑 실행 흐름: 백오피스 → 트리거 파일 → **systemd path-unit** → Python clipper"
- `:95` "기능 동작: … 지금클리핑(#9)·강제갱신(#10)"
- `:96` "#9 트리거: web→python 직접 spawn 없음 (트리거 파일 → **systemd path-unit**)"

→ 체크리스트는 지금 터진 바로 그 지점(트리거→path-unit→clipper)을 검증하라고 명시하고 있었다.

### 2.2 검증(Codex)은 이 버그를 실제로 잡아냈다
1차 검증 `verification_swarm56_web_861c62c.md`:
- `:37` "Backoffice trigger execution | **BLOCKED / INCOMPLETE** … actual trigger execution path **NOT PROVEN**"
- `:101` "no systemd path-unit files for clip/force. Only comments claim systemd path-unit."
- `:163` "Clipper execution flow via systemd path-unit: **BLOCKED/FAIL**."

최종 리포트 `FINAL_VERIFICATION_REPORT_b2638f1.md`:
- `:82` "systemd path/service | **PASS config** | **실제 서버 실행은 미검증**"
- §9 NOT TESTED: "운영 서버의 live systemd trigger 실행"
- §10 Smoke Test #11: "clip trigger가 실제 Python agent 실행으로 연결되는지 확인"

→ 검증은 "코드·설정까지는 확인했으나 **실제 서버 실행은 증명 안 됨**"을 정직하게 표기하고, 후속 확인 항목으로 남겼다.

---

## 3. 진짜 원인 — 미이행된 후속 검증 + repo↔서버 드리프트

문제는 검증 내용이 아니라 **검증 이후의 클로징(close-out)** 에서 발생했다.

1. **배포 후 서버 검증(#11)이 이행되지 않았다.** 검증은 "서버에서 실제로 트리거→실행되는지 확인하라"를 후속 항목으로 남겼지만, 그 서버 스모크 테스트가 실행되지 않았다.
2. **`.path` 유닛이 서버에 설치되지 않았다.** 유닛 파일은 `deploy/`에 작성됐지만 어떤 배포 스크립트도 이를 설치하지 않는다. (정기용 `agent.timer`만 수동 설치되어 문제를 가렸다.)
3. **좁은 PASS가 넓은 BLOCKED를 덮었다.** 로컬 런타임에서 "트리거 파일 생성 + 감사로그"만 확인하고 트리거 UI를 PASS 처리한 반면, "path-unit→clipper 실행"이라는 더 깊은 미검증은 종료되지 않은 채 묻혔다. (로컬엔 systemd가 없어 소비자 측은 구조적으로 검증 불가였다.)
4. **repo↔서버 드리프트.** 형제 항목인 `/vault` 이미지 서빙은 반대로 **서버에서 수동으로 고쳐졌으나 그 수정이 repo에 반영되지 않았다.** 즉 "미룬 서버 검증은 안 닫히고, 수동 서버 수정은 repo에 안 올라온다"는 동일한 갭이 두 번 나타났다.

---

## 4. 근본 교훈

> **서버 전용 인프라(systemd·nginx·cron)에 의존하는 기능은, 리포지토리/로컬 검증으로는 원리적으로 증명할 수 없다.**

로컬/CI 검증은 systemd path-unit이 트리거를 소비하는지, nginx alias가 실제 서빙하는지를 볼 수 없다. 이런 기능은 **배포된 실제 서버에서의 1회 실행 확인(스모크 테스트)** 이 반드시 별도 게이트로 존재해야 한다. 이 게이트가 없었던 것이 이 사건의 구조적 원인이다.

---

## 5. 절차 개선안

### 5.1 (신설) 배포 후 서버 스모크 테스트 게이트 — 필수
- `FINAL_VERIFICATION_REPORT §10`의 12개 항목을 **독립 체크리스트 파일**로 승격하고, 배포 때마다 **실제 서버에서 실행·서명**한다.
- 서버 전용 의존 항목은 최소 다음을 실측한다:
  - systemd: `.path`/`.timer` 유닛 `is-enabled`·`is-active`, 트리거 1회 클릭 후 `journalctl` 실행 로그 + SyncRun 새 행
  - nginx: `nginx -t` + 대표 자산 URL `HTTP 200`(예: `/vault/...` 이미지, `/thumbnails/...`)
  - 서비스 계정/경로: 유닛의 `User`·`WorkingDirectory`·`EnvironmentFile`이 실제 서버와 일치
- **원칙: "코드가 X를 한다" ≠ "서버에서 X가 실행된다."**

### 5.2 잔여 위험 = 미결 티켓, 나열로 끝내지 않는다
- "NOT TESTED / DEFERRED / 잔여 위험"에 오른 항목은 **소유자 + 종료 조건**을 붙이고 추적한다.
- 이런 미결 항목이 하나라도 열려 있으면 그 기능은 "완료"로 보고하지 않는다. (문서에 항목이 있다는 사실 ≠ 실행 완료 — 프로젝트 §3 Reality 원칙)

### 5.3 PASS는 검증 계층/환경을 명시한다
- "트리거 파일이 로컬에서 생성됨(PASS/local)"과 "서버에서 트리거가 에이전트를 실행함(PASS/prod)"을 **다른 판정으로 분리 기록**한다.
- 좁은 범위의 PASS가 넓은 범위의 BLOCKED/미검증을 **자동으로 대체하지 못하게** 한다. 라운드 간 판정은 이전 BLOCKED의 명시적 종료가 있어야 닫는다.

### 5.4 repo = source of truth (드리프트 방지)
- nginx·systemd 등 서버 설정은 **repo에서 배포**하고, 불가피한 수동 서버 수정은 **즉시 repo에 역반영**한다.
- 배포 스크립트에 유닛/설정 설치 단계를 포함해 "작성됐지만 설치 안 됨"을 원천 차단한다.
- 주기적(또는 배포 시) **server ↔ repo diff** 로 드리프트를 감지한다.

---

## 6. 관련 문서
- 오늘 발견된 잠재 문제(형제 위험) 목록: [KNOWN_ISSUES.md](../KNOWN_ISSUES.md)
- 이번 수정 계획: 백오피스 클리핑 버튼 복구 (systemd 유닛 설치 + UI 보완)
