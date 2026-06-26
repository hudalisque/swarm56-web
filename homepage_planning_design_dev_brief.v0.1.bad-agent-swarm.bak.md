# 개인 홈페이지 웹 기획 · 디자인 · 개발 착수 기획서

문서 버전: v0.1  
작성일: 2026-06-24  
프로젝트명: AI-native Solopreneur Homepage / Personal Brand Hub  
대상: 원종석 / Jongseok Won

---

## 1. Executive Summary

### 1.1 프로젝트 목적

본 홈페이지는 단순한 자기소개 페이지가 아니라, 원종석의 현재 활동을 하나로 연결하는 **공식 퍼스널 브랜드 허브**입니다.

핵심 역할은 다음과 같습니다.

- 20년 만의 개발자 복귀 서사를 신뢰감 있게 전달
- AI-native solopreneur로서의 현재 정체성 정리
- AI Agent Swarm 기반 작업 방식 소개
- Blog, Notion, GitHub, LinkedIn, YouTube, Instagram, Facebook 등 외부 채널을 하나의 중심점에서 연결
- `ai_team`, Intelligence Brief, Small Vill / Agent Village 같은 대표 프로젝트를 포트폴리오화
- 향후 협업, 자문, 콘텐츠, 프로젝트 문의를 받을 수 있는 공식 접점 마련

### 1.2 핵심 포지셔닝

> 20년 만에 돌아온 개발자,  
> AI-native solopreneur로 다시 시작합니다.

보조 설명:

> Founder, CEO, CFO로 회사를 만들고 운영해온 경험을 바탕으로,  
> AI Agent Swarm과 함께 소프트웨어, 자동화, 인텔리전스 시스템을 만드는  
> 새로운 solopreneur operating model을 실험하고 기록합니다.

### 1.3 사이트 성격

- 개인 명함 사이트가 아님
- 단순 포트폴리오가 아님
- 블로그 대체 사이트가 아님
- **모든 공개 활동의 canonical home / public hub**
- 보수적이고 신뢰감 있는 톤을 유지하되, Agent Swarm 요소로 생동감 부여

---

## 2. 기획 방법론

본 문서는 웹 기획 및 디자인·개발 실무 흐름에 맞춰 작성합니다.

1. Project Brief
2. Brand / Message Strategy
3. Target Audience & User Needs
4. Information Architecture
5. Content Strategy
6. UX Flow
7. Page-by-Page Requirements
8. Design Direction
9. Component System
10. Development Scope
11. MVP Backlog
12. QA / Acceptance Criteria
13. Next Action Plan

---

## 3. Project Brief

### 3.1 문제 정의

현재 원종석의 활동은 여러 채널에 분산되어 있습니다.

- Naver Blog: 긴 글, 개발 복귀기, AI Agent 실험 기록
- Notion Journal: 작업 메모, 프로젝트 로그
- GitHub: `ai_team` 및 개발 결과물
- LinkedIn: 비즈니스 네트워크와 전문성
- YouTube: 향후 데모, 설명, 기록 영상
- Instagram / Facebook: 가벼운 근황과 기존 네트워크

하지만 외부 방문자가 한 번에 이해할 수 있는 중심 페이지가 없습니다.

따라서 홈페이지는 다음 질문에 답해야 합니다.

- 이 사람은 누구인가?
- 왜 20년 만에 개발자로 돌아왔는가?
- 지금 무엇을 만들고 있는가?
- AI Agent Swarm과 함께 일한다는 것은 무엇인가?
- 어디에서 글, 코드, 영상, 작업기록을 볼 수 있는가?
- 어떤 일로 연락할 수 있는가?

### 3.2 MVP 목표

1차 MVP는 아래만 명확히 구현하면 됩니다.

- 홈 1페이지 중심 랜딩
- 명확한 Hero 메시지
- About 요약
- Agent Swarm Operating Model 소개
- 대표 프로젝트 3개 소개
- 채널 허브 카드 7개
- Contact CTA
- 모바일 반응형
- 향후 콘텐츠 확장 가능한 구조

---

## 4. Brand / Message Strategy

### 4.1 브랜드 키워드

- AI-native solopreneur
- 20년 만의 개발자 복귀
- Founder / CEO / CFO 경험
- Human-in-the-loop Agent Workflows
- Agent Swarm Operating Model
- Build in Public
- Intelligence Brief
- ai_team
- Small Vill / Agent Village

### 4.2 피해야 할 표현

아래 표현은 작고 방어적으로 들릴 수 있으므로 메인 카피에서 피합니다.

- 1인 소프트웨어 조직
- 혼자서도 할 수 있다
- AI 도움을 받는 초보 개발자
- 자동화 툴 사용자

대신 아래 표현을 사용합니다.

- AI-native solopreneur
- AI Agent Swarm과 함께 일하는 운영모델
- Founder 경험을 소프트웨어와 인텔리전스 시스템으로 확장
- Human-in-the-loop 방식으로 기획, 개발, 검증, 기록을 수행

### 4.3 Voice & Tone

- 한국어 우선
- 신뢰감 있고 절제된 톤
- 과장 없는 실무형 문장
- 미국 컨설팅회사·로펌 스타일의 보수적 신뢰감
- 기술 과시보다 운영모델과 실행력 강조
- 개인적인 복귀 서사는 담되 감상적으로 흐르지 않게 처리

---

## 5. Target Audience

### 5.1 1차 방문자

- LinkedIn에서 유입된 비즈니스 관계자
- 과거 네트워크에서 근황을 확인하는 사람
- AI Agent / solopreneur / 개발 복귀에 관심 있는 사람
- GitHub나 블로그를 보고 정체성을 확인하려는 사람
- 향후 협업, 자문, 프로젝트 문의 가능성이 있는 사람

### 5.2 방문자 핵심 니즈

- 이 사람이 신뢰할 만한 사람인지 빠르게 판단
- 현재 하는 일을 한눈에 이해
- 관련 채널로 이동
- 대표 프로젝트 확인
- 연락 방법 확인

---

## 6. Information Architecture

### 6.1 1차 MVP 사이트맵

단일 페이지 랜딩으로 시작합니다.

1. Hero
2. About
3. Agent Swarm Operating Model
4. Featured Projects
5. Build-in-Public Hub / Channels
6. Latest / Writing Preview
7. Contact
8. Footer

### 6.2 향후 확장 구조

MVP 이후 아래 페이지를 분리할 수 있습니다.

- `/about`
- `/projects`
- `/writing`
- `/agent-swarm`
- `/contact`

초기에는 단일 페이지가 적합합니다. 콘텐츠가 아직 분산되어 있고, 방문자는 빠르게 전체 맥락을 봐야 하며, 개발·유지보수 비용을 낮출 수 있기 때문입니다.

---

## 7. UX Flow

### 7.1 기본 방문 흐름

1. Hero에서 정체성 확인
2. About에서 배경 이해
3. Agent Swarm 섹션에서 차별점 이해
4. Projects에서 실제 작업 확인
5. Channels에서 관심 채널로 이동
6. Contact에서 연결

### 7.2 CTA 우선순위

Primary CTA:

- GitHub 보기
- Blog 읽기
- LinkedIn 연결

Secondary CTA:

- YouTube 보기
- Notion Journal 보기
- Contact

Tertiary Link:

- Instagram
- Facebook

---

## 8. Section Requirements

## 8.1 Hero Section

### 목적

첫 화면에서 “누구인지, 무엇을 하는지, 왜 흥미로운지”를 5초 안에 전달합니다.

### 구성 요소

- 작은 라벨: `AI-native Solopreneur · Founder · Former CEO/CFO`
- 메인 헤드라인
- 보조 설명
- CTA 버튼 3개
- 우측 또는 하단에 Agent Swarm을 시각화한 간단한 카드/노드 그래픽

### 카피 초안

Headline:

> 20년 만에 돌아온 개발자,  
> AI-native solopreneur로 다시 시작합니다.

Subcopy:

> Founder, CEO, CFO로 회사를 만들고 운영해온 경험을 바탕으로,  
> AI Agent Swarm과 함께 소프트웨어, 자동화, 인텔리전스 시스템을 만드는  
> 새로운 solopreneur operating model을 실험하고 기록합니다.

CTA:

- `Blog 읽기`
- `GitHub 보기`
- `LinkedIn 연결`

### 디자인 메모

- 너무 화려한 스타트업 랜딩 느낌은 피함
- 다크 네이비 / 화이트 / 차분한 그레이 계열
- Agent Swarm은 선과 점, 카드로 은근하게 표현
- Hero는 넓은 여백과 강한 타이포그래피 중심

---

## 8.2 About Section

### 목적

사용자의 배경을 짧고 신뢰감 있게 정리합니다.

### 포함 내용

- 개발자로 시작한 과거
- Founder / CEO / CFO 경험
- 20년 만의 개발 복귀
- AI Agent와 함께 일하는 현재 방식
- 기록과 공개 실험을 계속하는 이유

### 카피 초안

> 저는 개발자로 시작해 회사를 만들고 운영하며 CEO와 CFO 역할을 경험했습니다.  
> 오랜 시간 비즈니스와 운영의 현장에 있었지만, 이제 다시 개발자로 돌아와 AI Agent와 함께 일하는 새로운 방식을 실험하고 있습니다.
>
> 이 홈페이지는 그 복귀 과정, 프로젝트, 코드, 글, 영상, 작업 기록을 하나로 연결하는 공식 허브입니다.

---

## 8.3 Agent Swarm Operating Model Section

### 목적

홈페이지의 차별화 핵심입니다. “AI를 쓴다”가 아니라 “Agent Swarm과 함께 일하는 운영모델을 만든다”는 점을 설명합니다.

### 섹션 제목 후보

- `Agent Swarm Operating Model`
- `AI Agent Swarm과 함께 일합니다`
- `혼자가 아니라, Agent Swarm과 함께 만드는 방식`

### 설명 카피

> 저는 AI를 단순한 챗봇이나 보조도구로 사용하지 않습니다.  
> 리서치, 기획, 개발, 검토, 문서화, 마케팅 역할을 나눈 여러 AI Agent들과 함께 일하며, 사람은 방향 설정과 최종 판단, 검증을 맡는 Human-in-the-loop 방식으로 프로젝트를 진행합니다.

### 역할 카드

1. Research Agent — 자료 수집, 시장/기업 조사, 출처 기록
2. Planning Agent — 요구사항 정리, 실행계획 작성, 작업 단위 분해
3. Coding Agent — 구현, 리팩토링, 테스트 보조
4. Review Agent — 오류 검토, 품질 확인, 보안/논리 점검
5. Writing Agent — 블로그 글, README, 문서화
6. Marketing Agent — 콘텐츠 기획, 채널 운영, 메시지 정리
7. Memory / Archive Agent — Notion Journal, Obsidian / LLM-wiki, 작업 지식화

### 시각 요소

- 중앙에 `Human-in-the-loop` 또는 `Peter / Jongseok`
- 주변에 역할별 Agent 카드
- 선으로 연결된 swarm diagram
- hover 시 카드가 살아나는 정도의 미세한 인터랙션

---

## 8.4 Featured Projects Section

### 프로젝트 1: ai_team

Description:

> AI Agent Swarm을 활용해 소프트웨어 개발, 문서화, 검토, 기록을 수행하는 Human-in-the-loop multi-agent workflow 실험입니다.

Links:

- GitHub: `https://github.com/hudalisque/ai_team`

Tags:

- AI Agent
- Workflow
- Human-in-the-loop
- Build in Public

### 프로젝트 2: Intelligence Brief

Description:

> 기업·시장·투자 검토를 위한 정보 수집, 선별, 분석, 검토 과정을 AI Agent와 함께 수행하고, 사람이 최종 판단하는 맞춤형 intelligence workflow입니다.

Tags:

- Market Intelligence
- Research Automation
- Business Brief
- Decision Support

### 프로젝트 3: Small Vill / Agent Village

Description:

> Agent Swarm의 작업 흐름을 가상 업무공간 UI로 시각화하는 실험입니다. AI Agent 협업을 사람이 이해하고 조율할 수 있는 형태로 표현합니다.

Tags:

- Agent UI
- Virtual Workspace
- Workflow Visualization
- Small Business AI

---

## 8.5 Channels / Build-in-Public Hub Section

### 목적

홈페이지의 핵심 허브 기능입니다. 모든 외부 채널로 이동할 수 있어야 합니다.

### 섹션 제목 후보

- `Build-in-Public Hub`
- `Where I Build, Write, and Share`
- `제가 만들고 기록하는 곳들`
- `Follow the Build`

### 추천 채널 순서

1. Blog
2. Notion
3. GitHub
4. LinkedIn
5. YouTube
6. Instagram
7. Facebook

이 순서는 `기록 → 작업 → 코드 → 신뢰 → 영상 → 소셜` 흐름입니다.

### 채널 카드 내용

#### Naver Blog

- Role: 긴 글, 개발 복귀기, AI Agent 실험 기록
- URL: `https://blog.naver.com/acepetra`

#### Notion Journal

- Role: 작업 저널, 프로젝트 로그, 실행 기록
- URL: 추후 공개 가능 링크 입력

#### GitHub

- Role: 코드, ai_team, 공개 프로젝트 증거
- URL: `https://github.com/hudalisque/ai_team`

#### LinkedIn

- Role: 비즈니스 신뢰, 전문성, 네트워킹, 협업 문의
- URL: `https://www.linkedin.com/in/peter-jong-suk-won-08588239`

#### YouTube

- Role: 작업 과정, 데모, Agent Swarm 설명
- URL: 추후 입력

#### Instagram

- Role: 짧은 스냅샷, 작업 장면, 일상적 build-in-public
- URL: `https://www.instagram.com/hudalisque`

#### Facebook

- Role: 기존 네트워크, 근황 공유, 글/영상 재공유
- URL: `https://www.facebook.com/share/1GzASnaNjK/`

### 섹션 설명 카피

> 이 홈페이지는 제가 다시 개발자로 돌아오며 만들고, 배우고, 기록하는 모든 활동의 허브입니다.  
> 긴 글은 블로그에, 작업 기록은 Notion에, 코드는 GitHub에, 비즈니스 대화는 LinkedIn에, 영상은 YouTube에, 짧은 순간들은 Instagram과 Facebook에 남깁니다.

---

## 8.6 Latest / Writing Preview Section

### 목적

사이트가 정적인 명함처럼 보이지 않게 만들고, 지속적으로 업데이트되는 활동감을 줍니다.

### MVP 방식

초기에는 자동 연동하지 않고 수동 링크 3~5개로 구성합니다.

항목 예시:

- 최근 블로그 글
- 최근 GitHub 업데이트
- 최근 YouTube 영상
- 대표 Notion Journal 공개 글
- LinkedIn 대표 포스트

향후 RSS, GitHub API, YouTube RSS, Notion 공개 DB 연동을 검토할 수 있지만 MVP에서는 수동 관리가 적합합니다.

---

## 8.7 Contact Section

### CTA 카피

> 협업, 자문, Intelligence Brief, AI Agent workflow 관련 대화를 환영합니다.

### 연락 수단

- LinkedIn DM
- Email: 추후 입력
- GitHub
- Blog 댓글 또는 문의 링크

---

## 9. Design Direction

### 9.1 디자인 키워드

- Conservative
- Professional
- Editorial
- Technical but human
- Trustworthy
- Calm premium
- Agent Swarm visual accent

### 9.2 레퍼런스 톤

- 컨설팅회사 / 로펌의 신뢰감
- 개발자 포트폴리오의 명료함
- 미디어 허브의 콘텐츠 연결성
- 스타트업 랜딩의 CTA 구조는 일부만 차용

### 9.3 컬러 방향

Primary:

- Navy / Slate 계열
- `#0F172A`
- `#1E293B`
- `#1D4ED8`

Neutral:

- White
- Off-white
- Light gray
- `#F8FAFC`
- `#E2E8F0`

Accent:

- Blue for tech trust
- Green or violet for Agent Swarm highlight, 과하지 않게 사용

### 9.4 Typography

Korean:

- Pretendard
- Noto Sans KR
- Apple SD Gothic Neo / Malgun Gothic fallback

English:

- Inter
- system-ui

### 9.5 Layout

- Desktop: max-width 1120~1200px
- Mobile-first responsive
- Hero는 넓은 여백
- Section별 카드 구조
- 채널 허브는 7개 카드 grid
- Agent Swarm은 diagram + role cards 혼합

### 9.6 Visual Motif

Agent Swarm 표현 방식:

- 점과 선으로 연결된 노드
- 역할별 미니 카드
- Human-in-the-loop 중심 노드
- hover 시 연결선 또는 카드 강조

주의:

- 과한 SF/사이버펑크 느낌 금지
- Gather Town 같은 게임 UI 느낌은 홈페이지 메인에 과하게 쓰지 않음
- Small Vill은 프로젝트 섹션에서만 소개

---

## 10. Component System

### 10.1 Core Components

- Header / Navigation
- HeroBlock
- CTAButton
- SectionHeading
- AboutCard
- AgentRoleCard
- ProjectCard
- ChannelCard
- LatestItem
- ContactCTA
- Footer

### 10.2 Header

Items:

- About
- Agent Swarm
- Projects
- Channels
- Contact

Right CTA:

- LinkedIn 또는 GitHub

### 10.3 ChannelCard Data Model

```ts
type Channel = {
  name: string;
  role: string;
  description: string;
  url: string;
  priority: 'primary' | 'secondary';
  icon?: string;
};
```

### 10.4 ProjectCard Data Model

```ts
type Project = {
  title: string;
  description: string;
  tags: string[];
  links: {
    label: string;
    url: string;
  }[];
};
```

---

## 11. Development Scope

### 11.1 Recommended Tech Stack

Option A: Next.js / React

- 장점: 확장성, 컴포넌트화, 향후 블로그/MDX 연동 가능
- 적합: 장기적으로 포트폴리오+콘텐츠 허브 확장 시

Option B: Astro

- 장점: 정적 사이트에 강함, 빠름, 콘텐츠 허브에 적합
- 적합: 블로그/마크다운 중심 확장 시

Option C: 단일 HTML/CSS

- 장점: 빠른 MVP
- 단점: 장기 유지보수와 확장성 낮음

추천:

> MVP는 Astro 또는 Next.js.  
> 이미 `ai_team` 저장소와 연결해 개발할 계획이면 Next.js가 더 자연스럽습니다.

### 11.2 Suggested File Structure

Next.js 기준 예시:

```text
homepage/
  app/
    page.tsx
    layout.tsx
    globals.css
  components/
    Header.tsx
    Hero.tsx
    About.tsx
    AgentSwarm.tsx
    Projects.tsx
    ChannelHub.tsx
    Latest.tsx
    Contact.tsx
    Footer.tsx
  data/
    channels.ts
    projects.ts
    latest.ts
  public/
    images/
  README.md
```

---

## 12. MVP Backlog

### Phase 0: Setup

- 저장소/프로젝트 위치 확인
- 기술스택 확정
- 기본 라우팅 구성
- 디자인 토큰 정의

### Phase 1: Content Foundation

- Hero 카피 입력
- About 카피 입력
- Agent Swarm 설명 작성
- 프로젝트 3개 데이터 작성
- 채널 7개 데이터 작성

### Phase 2: Layout Implementation

- Header 구현
- Hero 구현
- About 구현
- Agent Swarm 구현
- Projects 구현
- ChannelHub 구현
- Contact 구현
- Footer 구현

### Phase 3: Design Pass

- 색상/타이포 정리
- 카드 디자인 정리
- Agent Swarm visual 추가
- 모바일 반응형 점검
- CTA 강조도 조정

### Phase 4: QA

- 링크 동작 확인
- 모바일 확인
- 데스크톱 확인
- Lighthouse 기본 점검
- 오탈자 점검
- 톤앤매너 확인

### Phase 5: Publish Prep

- README 작성
- 배포 방식 결정
- 도메인 연결 검토
- SNS 프로필에 홈페이지 링크 반영

---

## 13. Acceptance Criteria

### Content

- Hero에서 정체성이 5초 안에 이해된다.
- `20년 만에 돌아온 개발자` 메시지가 명확하다.
- `AI-native solopreneur`가 중심 정체성으로 보인다.
- `Agent Swarm`은 일하는 방식으로 설명된다.
- Blog, Notion, GitHub, LinkedIn, YouTube, Instagram, Facebook 링크가 모두 있다.
- Instagram/Facebook은 포함하되 메인 전문성보다 과하게 부각되지 않는다.

### Design

- 보수적이고 신뢰감 있다.
- 너무 장난스럽거나 게임 UI처럼 보이지 않는다.
- Agent Swarm 요소가 생동감을 주지만 과하지 않다.
- 모바일에서도 읽기 좋다.

### Development

- 단일 페이지가 정상 렌더링된다.
- 모든 외부 링크가 새 창으로 열린다.
- 반응형 레이아웃이 깨지지 않는다.
- Lighthouse 기본 성능/접근성 점검에서 큰 오류가 없다.

---

## 14. Initial Copy Deck

### Hero

```text
20년 만에 돌아온 개발자,
AI-native solopreneur로 다시 시작합니다.
```

```text
Founder, CEO, CFO로 회사를 만들고 운영해온 경험을 바탕으로,
AI Agent Swarm과 함께 소프트웨어, 자동화, 인텔리전스 시스템을 만드는
새로운 solopreneur operating model을 실험하고 기록합니다.
```

### Site Intro

```text
이 홈페이지는 제가 다시 개발자로 돌아오며 만들고, 배우고, 기록하는 모든 활동의 허브입니다.
긴 글은 블로그에, 작업 기록은 Notion에, 코드는 GitHub에, 비즈니스 대화는 LinkedIn에,
영상은 YouTube에, 짧은 순간들은 Instagram과 Facebook에 남깁니다.
```

### Agent Swarm

```text
저는 AI를 단순한 챗봇이나 보조도구로 사용하지 않습니다.
리서치, 기획, 개발, 검토, 문서화, 마케팅 역할을 나눈 여러 AI Agent들과 함께 일하며,
사람은 방향 설정과 최종 판단, 검증을 맡는 Human-in-the-loop 방식으로 프로젝트를 진행합니다.
```

---

## 15. Open Questions

개발 착수 전 확인하면 좋은 항목입니다.

1. 홈페이지 도메인
2. Notion 공개 링크
3. YouTube 채널 URL
4. Email 공개 여부
5. 프로필 사진 사용 여부
6. Next.js와 Astro 중 최종 기술스택

---

## 16. Recommended Next Step

### 바로 개발 착수용 작업 순서

1. 홈페이지 프로젝트 폴더 확정
2. 기술스택 확정: Next.js 또는 Astro
3. `data/channels.ts`와 `data/projects.ts` 먼저 작성
4. 단일 페이지 레이아웃 구현
5. Hero와 Channel Hub부터 디자인
6. Agent Swarm diagram 추가
7. 모바일 반응형 확인
8. 실제 링크 입력
9. 배포

### 우선순위

1순위:

- Hero
- Channel Hub
- Projects

2순위:

- Agent Swarm visual
- Latest section
- Contact polish

3순위:

- 자동 최신 글 연동
- 별도 project pages
- blog/MDX 통합

---

## 17. Implementation Notes for Designer / Developer

- 홈페이지는 “멋있게 보이는 것”보다 “정체성과 링크 허브가 명확한 것”이 우선입니다.
- Hero는 짧고 강하게 둡니다.
- Founder/CEO/CFO 이력은 과시가 아니라 신뢰 근거로 배치합니다.
- Agent Swarm은 기술 과시가 아니라 사용자의 현재 작업 방식으로 설명합니다.
- Blog / Notion / GitHub / LinkedIn / YouTube / Instagram / Facebook은 모두 포함하되, 각 채널의 역할을 다르게 설명합니다.
- Instagram/Facebook은 사람 냄새와 네트워크 연결을 위한 보조 채널로 처리합니다.
- 사이트 전체는 보수적 신뢰감 + AI-native 생동감의 균형을 잡습니다.

---

## 18. Deliverables

1차 산출물은 다음과 같습니다.

1. 단일 페이지 홈페이지 MVP
2. 반응형 웹 디자인
3. 채널 허브 카드 7개
4. 대표 프로젝트 카드 3개
5. Agent Swarm Operating Model 섹션
6. Contact CTA
7. 향후 확장을 위한 데이터 구조

---

## 19. Final Direction

> 20년 만에 개발자로 돌아온 Founder가 AI Agent Swarm과 함께 소프트웨어, 자동화, 인텔리전스 시스템을 만들고 기록하는 모든 활동의 공식 허브.
