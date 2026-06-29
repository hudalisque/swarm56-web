# swarm56 v5 — 검증 체크리스트

> **목적**: 구현이 `INTEGRATED_PLAN_v5.md` 설계대로 됐는지 **매 단계 확인.**
> **근거**: CLAUDE.md §9 Loop Engineering(보리스 처니) — 특히 "단계별 검증".
> **사용법**: 각 단계 구현 후 해당 섹션을 채움. 마지막 §7~§8은 독립 검증.
> **과거 실수**: 검증 단계가 없어 설계와 구현이 어긋남 → 이번엔 이 체크리스트로 게이트.

## 표기 규칙

```
[ ] = 미구현 또는 미검증
[~] = 구현자가 구현 및 자체시험 완료
[x] = 독립 IDE 검증자가 증거를 확인하고 PASS 판정
```
- **구현자는 항목을 `[x]`로 변경하지 않는다.** 최종 `[x]` 판정은 **독립 IDE 검증자**가 수행.
- 검증 상태는 필요 시 함께 기록: `PASS` / `FAIL` / `BLOCKED` / `NOT TESTED` / `NOT APPLICABLE`
- 지금은 전부 `[ ]`.

---

## 0. Loop Engineering 공통 (모든 단계 적용)
- [ ] **상태 영속성**: 각 단계 출력이 파일/DB(볼트·SQLite·SyncRun)에 기록 — 중단 후 재개 가능
- [ ] **주 데이터 흐름**: 채널 → 볼트 → SQLite → 홈페이지
- [ ] **역방향 원문 수정 금지**: SQLite·홈페이지·백오피스가 볼트 원문 MD를 직접 수정하지 않음
- [ ] **관리 흐름 분리**: 백오피스는 SQLite 편집과 트리거 파일 생성만 수행
- [ ] **클리핑 실행 흐름**: 백오피스 → 트리거 파일 → systemd path-unit → Python clipper
- [ ] **부작용 격리**: 외부 IO(네트워크/파일/LLM)는 격리된 함수/인터페이스로만
- [ ] **멱등성**: 재실행해도 중복·손상 없음
- [ ] **탈출/재시도 규칙**: 최대 재시도·비용 한도·중단 조건 명시
- [ ] **스킬/규칙 문서화**: 동작 규칙이 v5 문서로 참조 가능

---

## 최종 채널 계약
- [ ] 최종 8채널의 정확한 이름·내부 enum·표시 순서가 `INTEGRATED_PLAN_v5`와 일치
- [ ] 각 채널의 자동 수집 / 수동 fallback 여부가 문서와 일치
- [ ] 빈 채널로 허용된 채널이 명시됨
- [ ] 채널별 홈페이지 노출 개수 N이 숫자로 확정됨

```
CHANNELS (표시 순서 — 현재 feed-data 기준, v5와 대조 확인):
1. 네이버블로그   NAVER_BLOG   자동
2. 노션          NOTION       자동 (소스=전용 클린 DB 38d6855569978076822bd6a41125b90a)
3. 유튜브        YOUTUBE      자동
4. GitHub        GITHUB       자동 (공개 레포/릴리스)
5. LinkedIn      LINKEDIN     빈 채널 (자동 불가, 수동등록 없음)
6. Instagram     INSTAGRAM    자동
7. Facebook      FACEBOOK     빈 채널 (자동 불가, 수동등록 없음)
8. Swarm         SWARM        자동

PER_CHANNEL_LIMIT: 5
```

---

## 1. 클리퍼 (채널 → 볼트)
- [ ] 채널 수집 → `raw/<채널>/` 전문 md 작성
- [ ] **본문 전체 이미지** 다운로드 → `_assets/<해시>` + md 링크 **로컬 상대경로** 치환
- [ ] frontmatter 전 필드 기록: title·channel·source·url·published·synced_at·content_hash·external_id·excerpt·thumbnail
- [ ] **dedup = 볼트 md 존재 → 스킵** (자동 클리퍼가 삭제 카드 부활 안 시킴)
- [ ] 발췌 = **LLM 다중 provider → 실패 시 truncation fallback**
- [ ] 이미지 보안: SSRF 차단·referer·MIME allowlist·크기 상한
- [ ] SyncRun 기록(시작/완료/실패, 허위 금지)
- [ ] 멱등: 재실행 시 신규 0건이면 변경 0

## 2. 볼트 → SQLite 파생 + 복원
- [ ] 볼트 md → SQLite 카드 파생(필수 필드만)
- [ ] 매핑 정확: title→title·url→originalUrl·published→publishedAt·channel→channel·발췌→excerpt·대표이미지→thumbnailPath·md경로→vaultPath·external_id→externalId
- [ ] **최초 적재** 동작(기존 볼트 전체 → SQLite)
- [ ] 대표 썸네일 = 본문 첫 이미지
- [ ] **삭제 의미 확정**: SQLite 카드 삭제가 일시 삭제인지, 재파생 후에도 유지되는 영구 숨김인지 설계 문서에 명시
- [ ] **재파생 시나리오 검증**:
  1. Admin에서 카드 삭제
  2. 볼트 MD는 유지
  3. 전체 볼트→SQLite 재파생
  4. 카드가 다시 생성되는지 또는 계속 숨김 상태인지 설계와 일치
- [ ] **복원 의미 검증**: 복원이 SQLite row 재생성인지, suppression/tombstone 해제인지 설계와 일치

> **✅ 결정: 방식 B (삭제 의도 보존)** — 삭제 시 `SuppressionRecord` 기록 → 활성 suppression URL은 파생/재파생에서 **스킵** → **전체 재파생에도 부활 X**. 명시적 복원 때만 `restoredAt`로 해제. (v5 §8/§13)
- [ ] **삭제 키 = originalUrl** (재파생 후에도 동일 보장; vaultPath 보조)
- [ ] **재파생 전 활성 tombstone 먼저 조회** → suppressed URL 카드 생성 전 스킵
- [ ] **복원 = tombstone 해제 + 카드 재삽입을 하나의 원자적 작업** (부분 상태 없음)

## 3. 홈피 (읽기 / 이미지 서빙)
- [ ] 홈피 = **SQLite 읽기만** (볼트에 안 씀 — 코드 확인)
- [ ] 8채널 타일 · 채널당 N(=5)개 · 빈 채널 placeholder(LinkedIn/FB)
- [ ] 카드 클릭 → **원문 외부 URL** (`target=_blank rel=noopener`)
- [ ] 이미지 = **Nginx가 볼트 `_assets` 서빙** (이미지 확장자만 + nosniff)
- [ ] 삭제된(SQLite 없는) 카드 미노출

## 4. 백오피스 (+보안·인증)
- [ ] 로그인: 비번 **해시(bcrypt/argon2)** + 세션 쿠키(HttpOnly·Secure·SameSite=Lax·만료12h)
- [ ] 로그인 **rate limit**
- [ ] `/admin` **이중 가드**(서버 레이아웃 + 모든 서버액션 세션검증)
- [ ] 기능 동작: 조회·삭제(확인단계)·복원·편집·SyncRun로그·지금클리핑(#9)·강제갱신(#10)
- [ ] **#9 트리거**: web→python 직접 spawn 없음 (트리거 파일 → systemd path-unit)
- [ ] 백오피스가 **볼트 안 건드림**(SQLite+트리거만)
- [ ] **감사 로그**: 삭제/복원/강제갱신 — **who / when / target(originalUrl)**
- [ ] 비밀: agent.env(0640)/웹env, 코드·Git에 0

## 5. 데이터 모델 / 스키마
- [ ] SQLite에서 `thumbnailKind`·`contentHash` 제거가 v5 설계와 일치
- [ ] `content_hash`는 **볼트 frontmatter에만** 존재
- [ ] 카드 노출·삭제·복원 상태를 **어떤 데이터로 관리하는지 명시**
- [ ] 삭제 지속성: **`SuppressionRecord` 테이블 존재**(originalUrl·vaultPath·deletedAt·deletedBy·reason·restoredAt) + 파생/재파생이 **활성 suppression URL 스킵** (방식 B)
- [ ] **원문 URL = 볼트 `url` + SQLite `originalUrl`** 양쪽
- [ ] 빈 카드·필수 필드 누락 0

> `status 제거` 자체를 무조건 PASS로 두지 않는다. **삭제·복원 설계(§2 A/B)와 함께 판정.**

## 6. 마이그레이션 (라이브 적용)
- [ ] **로컬/브랜치에서 구현·검증 완료 후** 라이브 적용 (라이브 직접 개발 X)
- [ ] **백업**(site.db·볼트·썸네일·앱) + 체크섬
- [ ] 데이터 전환: 강제 재클립 → 볼트 보강(이미지·새 필드) → SQLite 재파생
- [ ] 검증 게이트: 외부 https 200 · 카드 정상 · 이미지 서빙 · 삭제/복원 · 클리퍼 1회 성공
- [ ] **롤백 테스트** 통과
- [ ] sync.swarm56.com / 기존 서비스 **무회귀**

## 7. 최종 — "설계대로 구현됐나" 전수 대조
- [ ] v5 §2~14 **각 항목을 실제 구현과 1:1 대조** (불일치 없는지 확인)
- [ ] 채널 8개 동작/빈채널 상태 = 설계와 일치 (위 "최종 채널 계약"과 대조)
- [ ] **현재 코드·환경변수·런타임에서 CouchDB 의존성 0**
- [ ] CouchDB decommission은 **별도 운영 승인 항목으로 분리**
- [ ] **검증**: Git tracked file·Git history·로그·artifact에서 Notion·Foursquare·Instagram 토큰 노출 여부 확인
- [ ] **운영자 조치 기록**: 노출된 토큰 목록과 rotate 필요 여부를 Peter에게 보고
- [ ] **Peter 확인 후** 토큰 rotate 완료 증거 기록 *(Verifier가 직접 rotate 하지 않음)*
- [ ] 옛 문서(README/CODE_SPEC) 갱신 또는 "구버전" 표시
- [ ] v5 문서와 구현 불일치 = 0

## 8. 독립 최종 검증 준비
- [ ] 전체 미구현 항목 0
- [ ] 전체 PARTIAL 항목 0
- [ ] Critical·High BLOCKED 0
- [ ] 미승인 설계 편차 0
- [ ] typecheck·lint·test·build 자체시험 성공
- [ ] 동일 입력 재실행 멱등성 자체시험 성공
- [ ] backup·restore dry-run 성공
- [ ] secret scan 완료
- [ ] `VERIFICATION_REPRODUCE.md` 작성 (검증 재현 방법)
- [ ] `IMPLEMENTER_EVIDENCE.md` 작성 (항목별 증거)
- [ ] 검증 대상 Git commit SHA 고정
- [ ] 독립 IDE 검증 요청 가능 상태

> **증거 요구**: 최종 검증의 각 항목은 다음 중 **하나 이상**의 증거를 요구한다 —
> `코드 파일·줄번호` / `테스트 이름` / `실행 명령` / `exit code` / `HTTP 응답` / `SQLite query` / `파일 hash` / `로그 경로`.
> **증거 없는 `[x]`는 인정하지 않는다.**
