# Handoff 2: Claude → v0.dev (컴포넌트 시안)

- 일시: 2026-06-28
- 단계: R5-0b — v0.dev 시안 (Relume 건너뛰고 v0 직행: IA는 기획서에 이미 정의됨)
- 입력(프롬프트): [작성: Claude] — 아래 영문 프롬프트
- 산출물: (v0 실행 후 채움 — 시안 스크린샷 + 코드/share 링크) [생성: v0.dev]
- Peter 결정: 대기 중 (v0 실행 → 시안 검토 → 전달)
- 다음: 시안 코드 → Claude가 Next.js 8채널 Social Hub Grid로 통합 + SQLite 카드 바인딩
- 기록: Claude (Claude Code)

---

## Peter가 할 일 (4단계)
1. **v0.app** 접속 → Vercel(또는 구글) 로그인 (무료 티어)
2. 새 채팅에 **아래 프롬프트 전체 붙여넣기** → 전송
3. 시안 나오면 검토. 맘에 안 들면 채팅으로 수정 요청 (예: "카드 더 작게", "타일 간격 넓게", "색 더 진하게")
4. 됐으면 **① 화면 스크린샷 + ② 코드 복사(또는 share 링크)** → 나한테 전달

---

## v0.dev 프롬프트 (붙여넣기용)

```
Build a polished single-page personal brand hub website called "swarm56.com"
in React + Tailwind CSS + TypeScript (shadcn/ui ok). Korean copy. It is an
AGGREGATOR/INDEX of one person's activity across 8 social channels — cards link
OUT to original posts; there are NO in-site detail pages.

DESIGN TOKENS (use exactly):
- primary dark: #0F172A   - primary medium: #1E293B
- accent blue: #1D4ED8    - neutral bg: #F8FAFC
- border: #E2E8F0         - text: #0F172A   - muted text: #64748B
- Font: Pretendard. Max content width 1120px, centered. Minimal, editorial,
  trustworthy. Subtle hover shadow on cards (transition).

SECTIONS (single page, anchor nav):

1) Sticky top nav: left text logo "Jongseok Won"; center anchors About / Work /
   Projects / Contact; right social icon buttons (GitHub, LinkedIn, Naver Blog,
   open new tab). Mobile (<768px): hamburger + drawer.

2) Hero (2-col desktop, stacked mobile):
   - Left headline (KR): "개발자로 시작해 회사를 운영했고, 지금은 다시 직접 만들고 있습니다."
     subcopy (KR): "Founder, CEO, CFO로 회사를 만들고 운영해온 경험을 바탕으로 소프트웨어,
     업무 자동화, 비즈니스 인텔리전스, AI 활용 워크플로를 직접 실험하고 기록합니다."
   - Right profile card: avatar, name, role line, "Current focus" list
     (Software, Business Intelligence, Workflow Automation), "Contact Me" button.

3) ★ SOCIAL HUB GRID (the core, give it the most attention):
   - A channel filter bar: pill buttons "All" + 8 channels:
     Naver Blog, Notion, YouTube, GitHub, LinkedIn, Instagram, Facebook, Swarm.
     Selecting a channel filters which tiles show (client-side, smooth).
   - Below: a responsive grid of 8 CHANNEL TILES
     (1 col mobile / 2 col tablet / 3 col desktop).
   - Each channel tile = a card containing:
       • tile header: channel icon + channel name + a small "더보기" link (top-right)
       • a vertical list of up to 5 FEED CARDS, each feed card:
           - small thumbnail image (left or top)
           - title (1-2 lines, bold)
           - 2-3 line excerpt (muted, line-clamp)
           - published date "YYYY-MM-DD" (small, muted)
       • whole feed card is a link (opens original in new tab)
       • empty channel state: placeholder "아직 수집된 글이 없습니다"
   - Use realistic Korean dummy feed items so the layout looks real.

4) About: short bio block (KR).
5) Work / Projects: a few project summary cards (name, description, tags).
6) Contact: short line + buttons (LinkedIn / GitHub / Blog).
7) Footer: copyright + GitHub / LinkedIn / Naver Blog links.

CONSTRAINTS:
- Cards always link OUT (no internal article pages).
- Filtering is by CHANNEL only — no Software/Business/Workflow category tabs.
- Max 5 feed items per channel tile (no infinite scroll / pagination).
- Accessible (semantic landmarks, alt text, focus states).
- Clean component structure so it's easy to integrate into a Next.js App Router project.
```

### 통합 시 매핑 (Claude 참고)
- 채널 enum: NAVER_BLOG/NOTION/YOUTUBE/GITHUB/LINKEDIN/INSTAGRAM/FACEBOOK/SWARM
- 카드 데이터 소스: SQLite `FeedCard` (findActiveCardsByChannel(5)) — 더미 자리에 실제 바인딩
- 썸네일: thumbnailKind=ORIGINAL → /thumbnails/..., DEFAULT → /channel-defaults/<channel>.png
