# Handoff 1: GPT+Claude → Relume (와이어프레임)

- 일시: 2026-06-27
- 단계: R4-0a — IA·사이트맵·와이어프레임 생성
- 입력(프롬프트): [작성: Claude, GPT 보완 예정]
- 산출물: **Relume 와이어프레임 생성 완료 (2026-06-28, Peter 스크린샷 보유)** [생성: Relume]
- Peter 결정: **합격(구조 참고용)** — 핵심 8채널 그리드는 편차, v0에서 정밀화
- 다음 단계 트리거: → R5-0b (v0.dev 시안, 02_v0_components.md)
- 기록: Claude (Claude Code)

---

## Relume 입력 프롬프트 초안 (Peter 검토용)

> 사용법: Relume의 "AI Site Builder"에 아래 영문 프롬프트를 입력. 한글 카피는 그대로 유지하도록 명시함. Peter 검토 후 수정/승인.

### Prompt (English, for Relume)

```
Build a single-page personal brand hub website called "swarm56.com" for Jongseok Won —
a founder/developer who started as a software engineer, ran companies (Founder/CEO/CFO),
and now builds things himself again. The site's PURPOSE is to present his identity and
promote his ongoing activities to visitors — a HUB for his social media presence. It is an
AGGREGATOR/INDEX of his activity across 8 social channels — NOT a blog or CMS.
It shows summaries and links out to the original posts.

Design tone: minimal, professional, dark navy + off-white. Clean, editorial, trustworthy.
Single page with anchor navigation. Korean copy.

Page sections (in order):

1. Global Nav Bar (sticky)
   - Left: text logo "Jongseok Won"
   - Center: anchor menu — About / Work / Projects / Contact
   - Right: social icon buttons (GitHub, LinkedIn, Naver Blog), open in new tab
   - Mobile (<768px): hamburger menu + drawer

2. Hero + Profile Card (2-column on desktop, stacked on mobile)
   - Left: headline (Korean): "개발자로 시작해 회사를 운영했고, 지금은 다시 직접 만들고 있습니다."
     subcopy (Korean): "Founder, CEO, CFO로 회사를 만들고 운영해온 경험을 바탕으로 소프트웨어,
     업무 자동화, 비즈니스 인텔리전스, AI 활용 워크플로를 직접 실험하고 기록합니다."
   - Right: profile card — photo/illustration, "Current focus" list (Software, Business
     Intelligence, Workflow Automation), "Contact Me" button

3. Social Hub Grid (THE CORE SECTION)
   - A channel filter bar: chips "All" + 8 channels
     (Naver Blog, Notion, YouTube, GitHub, LinkedIn, Instagram, Facebook, Swarm)
   - Below it: 8 channel tiles laid out in a responsive grid
     (1 column mobile / 2 columns tablet / 3 columns desktop)
   - Each channel tile contains:
       - tile header: channel icon + channel name + a "더보기"(See more) link to the channel home
       - up to 5 feed cards, each card showing:
           - thumbnail image (top)
           - title
           - short summary (2-3 lines)
           - published date (YYYY-MM-DD)
       - clicking a card opens the original post in a new tab
   - Empty channel state: a placeholder card "아직 수집된 글이 없습니다"

4. About — short bio block
5. Work / Projects — a few project summary cards
6. Footer — copyright + GitHub / LinkedIn / Naver Blog links

Important constraints for the wireframe:
- No in-site article detail pages (cards always link OUT).
- No category tabs like Software/Business/Workflow (filtering is by CHANNEL only).
- Feed is fixed at max 5 items per channel (no infinite scroll / pagination).
- Tags exist in data but are NOT shown in this MVP UI.
```

### 와이어프레임에서 Relume가 반드시 반영할 것 (체크리스트)
- [ ] 단일 페이지 + 앵커 네비, 모바일 햄버거
- [ ] Hero 2열(데스크톱) + 프로필 카드
- [ ] Social Hub Grid: 채널 필터(All+8) + 8 타일 + 타일당 카드 5개(썸네일/제목/요약/날짜)
- [ ] 카드 클릭 외부 이동, 사이트 내부 상세 없음
- [ ] 채널 기준 필터만(카테고리 탭 없음)
- [ ] 빈 채널 placeholder
- [ ] 반응형 1/2/3열

### Peter 확인 포인트
1. 8개 채널 순서/명칭 이대로? (Naver Blog · Notion · YouTube · GitHub · LinkedIn · Instagram · Facebook · Swarm)
2. Hero 카피·서브카피 문구 그대로?
3. About/Work/Projects 섹션 포함 범위 — 지금 수준이면 OK?
4. 톤(다크 네이비+오프화이트) 방향 OK?

---

## Relume 산출 결과 검토 (2026-06-28)
Relume Free로 단일 페이지 와이어프레임 생성. **구조 참고용으로 합격**, 단 핵심부 편차 있어 v0에서 정밀화.

**반영된 것**: 단일 페이지+앵커, navbar/hero/channels/about/work/contact/footer, "Eight channels, one hub" 컨셉, contact·footer 소셜 링크.

**편차(→ v0에서 교정)**:
- 핵심 Social Hub Grid: "8채널 타일 × 타일당 피드 5개"가 아니라 **채널 링크 카드 4개**(Blog/Notes/Video/Code)만 생성. 나머지 4채널 + 채널당 피드 리스트 없음.
- Hero: 2열(카피+프로필 카드) 아님 → 가운데 정렬 + 큰 이미지.
- Navbar: 소셜 아이콘 대신 Light/Dark 토글.
- 부가물(불필요): 뉴스레터 구독, Webflow/Relume 파트너 로고.

**결론**: Relume = 러프 구조까지. 정밀 8채널 피드 그리드는 02_v0_components.md 프롬프트로 v0가 생성.
