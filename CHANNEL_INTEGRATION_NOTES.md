# 채널 연동 노트 (삽질 방지용)

> swarm56 클리핑 에이전트의 채널별 연동 방법·인증·성공/실패 기록.
> **목적: 다음에 같은 시도를 반복하지 않기 위함.** 시도한 것/안 되는 것/왜/재시도 주의점.
> 최종 갱신: 2026-06-28 (Claude 작성)

## 현황 요약 — 6/8 라이브

| 채널 | 상태 | 방법 | 인증 |
|------|------|------|------|
| 네이버블로그 | ✅ 라이브 | RSS | 불필요 |
| GitHub | ✅ 라이브 | REST API (public) | 불필요 |
| YouTube | ✅ 라이브 | 채널 RSS (핸들→channel_id) | 불필요 |
| Notion | ✅ 라이브 | DB query | Integration 토큰 |
| Swarm | ✅ 라이브 | Foursquare v2 `users/self/checkins` | OAuth user token |
| Instagram | ✅ 라이브 | Graph API `/me/media` | 비즈니스 계정 + 토큰(자동갱신) |
| **Facebook** | ❌ **중단** | (아래) | 공식 API 불가 |
| **LinkedIn** | ⏳ 시도 예정 | (아래) | — |

비밀 토큰은 서버 `/etc/swarm56/agent.env`(root:ubuntu 0640)에만. 코드/Git 미포함.

---

## Instagram — 성공 경로 (재현용)

- **계정 조건**: 프로페셔널(비즈니스/크리에이터) 계정이어야 함. Peter 계정은 원래 커머셜이라 전환 불필요.
- **API**: `Instagram API with Instagram Login` → `https://graph.instagram.com/me/media` (Basic Display API는 2024.12.4 종료).
- **토큰 발급 절차**(실제로 통한 길):
  1. developers.facebook.com → 앱 생성(use case: "Manage messaging & content on Instagram")
  2. **App roles → Roles → Instagram Testers**에 본인 IG username 추가 → **인스타에서 테스터 초대 수락**(설정→Apps and websites→Tester invites). ← 이거 안 하면 "Insufficient developer role" 에러.
  3. use case 화면 → **API setup with Instagram login → Generate token** → IG 승인 → 토큰 복사.
- **토큰 수명**: 장기 토큰 60일. → `refresh_access_token`로 매 실행 자동 갱신(파일 `/var/lib/swarm56/ig_token`에 저장, daemon=ubuntu 쓰기). 만료 걱정 없음.
- 코드: `agent/collectors/instagram.py`

---

## Facebook — ❌ 중단 (공식 API 불가 확정)

### 핵심 결론
**개인 프로필 게시물은 어떤 공식 API로도 읽을 수 없음** (`user_posts`/`publish_actions` 2018년 Cambridge Analytica 이후 폐지). 공식 API는 **'페이지(Page)' 게시물만** 허용.

### 시도한 것 (전부 실패/막힘)
1. **Meta 앱(swarm56)에 "Manage everything on your Page" use case 추가** → Pages 권한 일부만 노출.
2. **Graph API Explorer로 페이지 토큰 시도**:
   - `pages_show_list`만으론 `me/accounts` = `{"data":[]}` (빈 배열).
   - 포럼 해법대로 **`business_management` 추가** → 그래도 `me/accounts`=0, `me/businesses`=0.
   - 부여된 권한 확인: pages_show_list, business_management, public_profile 모두 granted인데도 **페이지/비즈니스 0개**.
   - → **Peter 계정엔 브랜드용 '페이지'가 없음. 개인 프로필만 사용.** (페이지=별도 공개 엔티티, 개인 프로필과 다름)
   - 참고: 글 읽기용 `pages_read_engagement`는 Explorer 목록에 아예 안 뜸 = App Review(비즈니스 인증) 대상.
3. **mbasic.facebook.com 세션 쿠키 방식**(개인 프로필 우회 시도):
   - `c_user` + `xs` 쿠키로 `mbasic.facebook.com/{id}` 요청 → HTTP 200이지만 **title="Error"**, story 링크 0개. (쿠키 부족(datr 등)이거나 FB가 차단)
   - 추가 디버깅 중 Peter 지시로 중단.

### 재시도하려면 (다음 사람에게)
- **개인 프로필 글이 목표면 공식 API는 포기.** 길은 둘:
  - (a) FB **페이지를 새로 만들어** 거기 글을 올리는 워크플로우로 전환 → 그러면 Page Graph API로 깔끔하게 됨. (`agent/collectors/facebook.py` 이미 작성됨 — Page 토큰+ID만 넣으면 동작)
  - (b) 세션 쿠키 스크래핑을 제대로: `c_user`, `xs` 외 `datr`, `fr`, `sb` 쿠키도 함께, 데스크톱 UA 대신 정확한 모바일 헤더, 또는 `mbasic` 대신 graph 비공식 엔드포인트. FB가 적극 차단/구조 변경하므로 **가장 깨지기 쉬운 채널**.
- 코드: `agent/collectors/facebook.py` (Page 방식, env: `SWARM56_FACEBOOK_TOKEN`/`_PAGE_ID`). 페이지 없으면 미사용.

---

## LinkedIn — ⏳ 시도 예정

- **공식 API**: 파트너 프로그램 승인(수주~수개월) 필요 + 본인 피드/글 읽기(`r_member_social`) 제한 → 개인 프로젝트엔 비현실적.
- **계획**: 본인 세션 쿠키(`li_at`) 기반 자체 수집 시도 예정. (대안: Unipile/Phyllo 유료 통합 API)
- FB mbasic 교훈상, 세션 스크래핑은 쿠키 세트·헤더·HTML 구조에 민감 → 결과는 시도 후 이 문서에 추가.

---

## 일반 교훈
- "페이지(Page)" ≠ "개인 프로필" — Meta 용어 혼동 주의. API는 페이지만 읽음.
- 플랫폼 공식 API가 막힌 채널(FB 개인/LinkedIn)은 **세션 쿠키 우회**가 유일하나, 깨지기 쉽고 ToS 회색지대 → 본인 데이터·소량 한정.
- 토큰류는 채팅 노출 시 **rotate** 권장. 전부 `agent.env`(0640) 보관.
