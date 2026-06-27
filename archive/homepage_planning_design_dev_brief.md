# 개인 홈페이지 웹 기획 · 디자인 · 개발 착수 기획서

문서 버전: v0.2  
작성일: 2026-06-24  
대상: 원종석 / Jongseok Won  
용도: 디자인 및 개발 착수용 실무 기획서

---

## 0. v0.2 수정 방향

v0.1의 문제점은 명확합니다.

- "Agent Swarm"을 전면에 세워 메시지가 과했습니다.
- "20년 만에 돌아온 개발자, AI-native solopreneur..." 문구가 캐치프레이즈처럼 보여 촌스러웠습니다.
- 홈페이지가 사람의 신뢰를 만드는 공간이 아니라 AI 용어를 전시하는 공간처럼 보였습니다.

v0.2에서는 방향을 바꿉니다.

- 전면 메시지는 사람, 이력, 신뢰, 현재 작업으로 구성합니다.
- AI는 주인공이 아니라 현재 일하는 방식의 일부로만 다룹니다.
- 홈페이지는 자기소개서가 아니라 공개 활동의 기준점이자 채널 허브입니다.
- 톤은 보수적이고 절제된 전문가 사이트로 잡습니다.

---

## 1. 프로젝트 정의

### 1.1 홈페이지의 역할

이 홈페이지는 원종석의 공개 프로필과 작업 기록을 한곳에 모으는 개인 공식 사이트입니다.

방문자가 이 사이트에서 바로 파악해야 할 것은 네 가지입니다.

1. 이 사람은 누구인가
2. 과거에 어떤 일을 해왔는가
3. 지금 무엇을 다시 만들고 있는가
4. 더 보려면 어디로 가야 하는가

### 1.2 사이트의 성격

- 개인 명함 사이트
- 공개 포트폴리오
- 블로그, GitHub, LinkedIn, YouTube, Notion으로 연결되는 social nedia HUB
- 개발 복귀와 현재 프로젝트를 정리하는 기준 페이지

### 1.3 사이트가 피해야 할 방향

- AI 유행어 중심의 과장된 랜딩페이지
- 스타트업식 과장 카피
- "미래를 바꾼다" 류의 추상 문구
- 지나치게 개인 감성에 기대는 복귀 서사
- 기술 용어를 앞세운 설명
- 게임 UI나 장난스러운 비주얼

---

## 2. 핵심 포지셔닝

### 2.1 한 문장 정의

> 회사를 만들고 운영해온 경험을 바탕으로, 다시 개발자로 돌아와 기술과 비즈니스가 만나는 작업을 기록합니다.

### 2.2 짧은 소개문

> 원종석은 개발자로 시작해 Founder, CEO, CFO로 회사를 만들고 운영했습니다. 지금은 다시 개발자로 돌아와 소프트웨어, 업무 자동화, 비즈니스 인텔리전스, AI 활용 워크플로를 직접 만들고 기록하고 있습니다.

### 2.3 더 짧은 프로필 라벨

선호 순서:

1. `Founder · Developer · Operator`
2. `Founder / Developer / Business Operator`
3. `Developer returning with founder experience`
4. `Business operator rebuilding through software`

한국어 병기 후보:

- `창업자 · 개발자 · 운영자`
- `사업을 운영해온 개발자`
- `비즈니스 경험을 가진 개발자`

### 2.4 메인 카피 후보

캐치프레이즈처럼 보이지 않는 방향으로 갑니다.

후보 A:

> 사업을 운영해온 경험으로, 다시 소프트웨어를 만듭니다.

후보 B:

> 개발자로 시작해 회사를 운영했고, 지금은 다시 직접 만들고 있습니다.

후보 C:

> 기술과 비즈니스 사이에서, 다시 개발자로 일합니다.

후보 D:

> Founder의 경험으로 제품과 시스템을 다시 만듭니다.

추천안:

> 개발자로 시작해 회사를 운영했고, 지금은 다시 직접 만들고 있습니다.

이 문장이 가장 덜 과장되어 있고, 사용자의 실제 서사와 맞습니다.

---

## 3. 목표 방문자

### 3.1 주요 방문자

- LinkedIn에서 프로필을 확인하러 온 사람
- 과거 네트워크에서 현재 활동을 확인하는 사람
- 블로그 글을 읽고 더 알고 싶은 사람
- GitHub 프로젝트를 보고 배경을 확인하려는 사람
- 협업, 자문, 프로젝트 논의를 검토하는 사람

### 3.2 방문자 질문

방문자는 긴 설명을 읽기 전에 아래 질문에 답을 얻어야 합니다.

- 이 사람은 어떤 배경을 가진 사람인가
- 개발자로 다시 돌아왔다는 말이 무슨 의미인가
- 현재 어떤 프로젝트를 하고 있는가
- 실제 결과물은 어디에서 볼 수 있는가
- 연락하거나 팔로우하려면 어디로 가야 하는가

---

## 4. 정보 구조

### 4.1 MVP 사이트맵

초기 버전은 단일 페이지가 적합합니다.

1. Header
2. Hero
3. About
4. Current Work
5. Projects
6. Writing & Channels
7. Contact
8. Footer

### 4.2 향후 확장

콘텐츠가 쌓이면 아래 페이지로 분리합니다.

- `/about`
- `/projects`
- `/writing`
- `/notes`
- `/contact`

초기에는 단일 페이지로 충분합니다. 목적은 긴 설명이 아니라 방문자가 전체 맥락과 링크를 빠르게 파악하는 것입니다.

---

## 5. 페이지별 기획

## 5.1 Header

### 구성

- 좌측: `Jongseok Won` 또는 `Won Jongseok`
- 우측 메뉴:
  - About
  - Work
  - Projects
  - Writing
  - Contact

### 우측 버튼

- `LinkedIn`
- 또는 `GitHub`

### 디자인

- 얇은 하단 라인
- 흰색 또는 아주 옅은 회색 배경
- 고정 헤더는 선택사항
- 모바일에서는 햄버거보다 단순 앵커 메뉴 축약 권장

---

## 5.2 Hero

### 목적

첫 화면은 한눈에 신뢰와 방향을 보여줘야 합니다. 멋있는 문구보다 정확한 설명이 우선입니다.

### 구성

- 작은 라벨
- 메인 문장
- 2~3줄 설명
- CTA 2~3개
- 우측에는 프로필 카드 또는 단순한 작업 카드

### 권장 카피

Label:

```text
Founder · Developer · Operator
```

Headline:

```text
개발자로 시작해 회사를 운영했고,
지금은 다시 직접 만들고 있습니다.
```

Subcopy:

```text
Founder, CEO, CFO로 회사를 만들고 운영해온 경험을 바탕으로
소프트웨어, 업무 자동화, 비즈니스 인텔리전스, AI 활용 워크플로를
직접 실험하고 기록합니다.
```

CTA:

- `블로그 읽기`
- `GitHub 보기`
- `LinkedIn 보기`

### 대체 헤드라인 후보

1. `사업을 운영해온 경험으로, 다시 소프트웨어를 만듭니다.`
2. `기술과 비즈니스 사이에서, 다시 개발자로 일합니다.`
3. `Founder의 경험을 바탕으로 제품과 시스템을 다시 만듭니다.`

### 피해야 할 카피

- `20년 만에 돌아온 개발자, AI-native solopreneur로 다시 시작합니다.`
- `AI Agent Swarm과 함께 미래를 만듭니다.`
- `혼자가 아니라 AI 팀과 일합니다.`
- `새로운 운영모델을 실험합니다.`

---

## 5.3 About

### 목적

방문자가 이력을 이해하도록 짧게 설명합니다. 감동 서사가 아니라 신뢰의 배경이어야 합니다.

### 내용 구조

1. 개발자로 시작
2. 창업과 회사 운영 경험
3. CEO/CFO 경험
4. 다시 개발자로 복귀
5. 현재 만드는 것과 기록하는 것

### 본문 초안

```text
저는 개발자로 일을 시작했고, 이후 회사를 만들고 운영하며 Founder, CEO, CFO 역할을 경험했습니다.
오랫동안 사업과 운영의 현장에 있었지만, 지금은 다시 직접 코드를 쓰고 시스템을 만들고 있습니다.

현재의 관심사는 소프트웨어 개발, 업무 자동화, 비즈니스 인텔리전스, 그리고 AI를 실제 업무에 어떻게 적용할 수 있는가입니다.
이 사이트는 그 과정에서 만든 프로젝트, 글, 코드, 작업 기록을 모아두는 공간입니다.
```

### 보조 정보 카드

- Started as a developer
- Built and operated companies
- Returned to hands-on software work
- Writing and building in public

---

## 5.4 Current Work

### 목적

"요즘 무엇을 하는 사람인가"를 설명합니다.

### 섹션 제목 후보

- `Current Work`
- `지금 하고 있는 일`
- `What I am building now`

### 내용

세 가지 축으로 정리합니다.

1. Software
   - 개인 프로젝트와 개발 복귀 과정
   - GitHub 기반 실험
   - `ai_team` 프로젝트

2. Business Intelligence
   - Intelligence Brief
   - 기업/시장/투자 검토를 위한 정보 정리
   - 리서치와 판단을 돕는 문서화

3. Workflow & Automation
   - 반복 업무 자동화
   - 문서 작성, 리서치, 일정 관리, 기록 체계
   - 사람이 판단하고 도구가 보조하는 구조

### 주의

여기서 AI는 직접적 주제가 아니라 도구와 방법론 중 하나로 다룹니다.

---

## 5.5 Projects

### 목적

말이 아니라 실제 작업을 보여주는 섹션입니다.

### 프로젝트 1. ai_team

```text
개발 복귀 과정에서 만든 AI 협업형 개발 워크플로 실험 프로젝트입니다.
기획, 구현, 검토, 기록을 분리해 실제 개발 업무에 적용하는 방식을 실험합니다.
```

링크:

- `https://github.com/hudalisque/ai_team`

태그:

- Software
- Workflow
- GitHub
- Build log

### 프로젝트 2. Intelligence Brief

```text
기업과 시장을 검토하기 위한 정보 수집, 정리, 분석 문서 작업입니다.
단순 요약이 아니라 의사결정에 필요한 맥락과 판단 근거를 정리하는 데 초점을 둡니다.
```

태그:

- Business intelligence
- Research
- Briefing
- Decision support

### 프로젝트 3. Small Vill

```text
소상공인과 작은 조직이 AI와 자동화 도구를 실제 업무에 적용하는 방식을 탐색하는 프로젝트입니다.
복잡한 기술보다 일상 업무에서 바로 이해하고 쓸 수 있는 형태를 지향합니다.
```

태그:

- Small business
- AI adoption
- Workflow
- Product concept

---

## 5.6 Writing & Channels

### 목적

외부 채널을 정리합니다. 홈페이지는 허브이고, 각 채널은 역할이 다릅니다.

### 섹션 제목 후보

- `Writing & Channels`
- `읽고 볼 수 있는 곳`
- `글, 코드, 영상, 기록`

### 채널 순서

1. Blog
2. GitHub
3. LinkedIn
4. Notion
5. YouTube
6. Instagram
7. Facebook

### 채널 설명

#### Blog

- 역할: 긴 글, 복귀 과정, 프로젝트 기록
- URL: `https://blog.naver.com/acepetra`

#### GitHub

- 역할: 코드와 프로젝트 결과물
- URL: `https://github.com/hudalisque/ai_team`

#### LinkedIn

- 역할: 비즈니스 프로필과 네트워크
- URL: `https://www.linkedin.com/in/peter-jong-suk-won-08588239`

#### Notion

- 역할: 작업 메모와 정리된 기록
- URL: 'https://river-perfume-8d6.notion.site/f75cf5da3cbb4823bbe642a199a6f462?v=4087b243c83a4398adff8a1c61ce8d3f'

#### YouTube

- 역할: 데모, 설명, 작업 과정 영상
- URL: 추후 입력

#### Instagram

- 역할: 짧은 작업 기록과 스냅샷
- URL: `https://www.instagram.com/hudalisque`

#### Facebook

- 역할: 기존 네트워크와 근황 공유
- URL: `https://www.facebook.com/share/1GzASnaNjK/`

### 본문 카피

```text
긴 글은 블로그에, 코드는 GitHub에, 비즈니스 프로필은 LinkedIn에 정리합니다.
작업 메모와 영상, 짧은 기록은 Notion, YouTube, Instagram, Facebook으로 나눠서 남깁니다.
```

---

## 5.7 Contact

### 목적

협업과 연락 경로를 명확히 합니다.

### 카피

```text
협업, 자문, 프로젝트 논의는 LinkedIn으로 연락해 주세요.
소프트웨어, 업무 자동화, 비즈니스 인텔리전스, AI 활용 워크플로에 관한 대화를 환영합니다.
```

### CTA

- `LinkedIn에서 연락하기`
- `GitHub 보기`
- `Blog 보기`

---

## 6. 디자인 방향

### 6.1 전체 톤

- 보수적
- 신뢰감 있음
- 조용하지만 선명함
- 컨설팅회사나 로펌의 정돈된 느낌
- 개발자 포트폴리오의 명확한 정보 구조

### 6.2 피해야 할 톤

- 네온, 사이버펑크
- 게임 UI
- 과한 그라디언트
- AI 스타트업 랜딩페이지 느낌
- 과장된 모션
- 둥둥 떠다니는 로봇/노드 그래픽

### 6.3 컬러

Primary:

- Navy: `#0F172A`
- Slate: `#1E293B`
- Blue: `#1D4ED8`

Neutral:

- White: `#FFFFFF`
- Off-white: `#F8FAFC`
- Border: `#E2E8F0`
- Muted text: `#64748B`

Accent:

- Blue만 제한적으로 사용
- Green/Violet 계열은 MVP에서 사용하지 않는 편이 좋음

### 6.4 Typography

Korean:

- Pretendard
- Noto Sans KR
- Apple SD Gothic Neo
- Malgun Gothic fallback

English:

- Inter
- system-ui

### 6.5 Layout

- 최대 폭: 1120px
- Hero는 좌측 텍스트, 우측 프로필/작업 요약 카드
- Section 간격은 넓게
- 카드에는 얇은 border와 옅은 배경 사용
- 모바일에서는 1열 카드 구조

---

## 7. 주요 컴포넌트

### 7.1 Header

- Logo / name
- Navigation
- External CTA

### 7.2 Hero

- Label
- Headline
- Subcopy
- CTA group
- Profile summary card

### 7.3 Profile summary card

예시:

```text
Jongseok Won
Founder · Developer · Operator

Current focus
- Software projects
- Business intelligence
- Workflow automation
- Public writing
```

### 7.4 ProjectCard

필드:

```ts
type Project = {
  title: string;
  description: string;
  tags: string[];
  links: { label: string; url: string }[];
};
```

### 7.5 ChannelCard

필드:

```ts
type Channel = {
  name: string;
  role: string;
  url: string;
  priority: 'primary' | 'secondary';
};
```

---

## 8. 개발 방향

### 8.1 추천 스택

1순위: Next.js

이유:

- 컴포넌트 구조가 명확함
- 향후 프로젝트/글 페이지 확장 가능
- GitHub 기반 배포와 잘 맞음
- 개인 홈페이지에서 충분히 표준적인 선택

2순위: Astro

이유:

- 정적 사이트에 적합
- 빠름
- 마크다운 콘텐츠와 잘 맞음

MVP 권장:

- Next.js + TypeScript + Tailwind CSS

### 8.2 폴더 구조

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
    CurrentWork.tsx
    Projects.tsx
    ChannelHub.tsx
    Contact.tsx
    Footer.tsx
  data/
    projects.ts
    channels.ts
  public/
    images/
  README.md
```

---

## 9. MVP 백로그

### Phase 1. 기본 구조

- Next.js 프로젝트 생성
- Tailwind 설정
- 기본 layout 구성
- 색상/타이포 토큰 정의

### Phase 2. 콘텐츠 데이터

- 프로젝트 데이터 작성
- 채널 데이터 작성
- Hero / About 카피 입력

### Phase 3. 화면 구현

- Header
- Hero
- About
- Current Work
- Projects
- Writing & Channels
- Contact
- Footer

### Phase 4. 디자인 정리

- spacing 정리
- 카드 스타일 정리
- 모바일 반응형 확인
- CTA 강조도 조정

### Phase 5. QA

- 링크 확인
- 모바일 확인
- 데스크톱 확인
- 오탈자 확인
- Lighthouse 기본 점검

---

## 10. Acceptance Criteria

### 내용

- 첫 화면에서 사람의 배경과 현재 방향이 이해된다.
- AI 용어가 앞서지 않는다.
- 개발 복귀 서사가 과장되지 않는다.
- Founder / CEO / CFO 경험이 신뢰 근거로 보인다.
- Blog, GitHub, LinkedIn, Notion, YouTube, Instagram, Facebook으로 이동할 수 있다.
- 프로젝트가 말이 아니라 실제 작업으로 보인다.

### 디자인

- 보수적이고 신뢰감 있다.
- 카피가 촌스럽지 않다.
- 장난스럽거나 과장된 AI 사이트처럼 보이지 않는다.
- 모바일에서 읽기 쉽다.

### 개발

- 단일 페이지가 정상 렌더링된다.
- 외부 링크는 새 탭으로 열린다.
- 반응형 레이아웃이 깨지지 않는다.
- 컴포넌트와 데이터가 분리되어 있다.

---

## 11. 개발 착수용 최종 지시

개발자는 아래 방향으로 착수합니다.

1. 메인 카피는 `개발자로 시작해 회사를 운영했고, 지금은 다시 직접 만들고 있습니다.`를 기본안으로 사용합니다.
2. `Agent Swarm`이라는 표현은 메인 화면에서 사용하지 않습니다.
3. AI는 Current Work나 프로젝트 설명 안에서 제한적으로만 언급합니다.
4. 디자인은 보수적인 전문가 사이트 톤으로 잡습니다.
5. 홈페이지의 핵심 기능은 외부 채널 허브와 현재 작업의 정리입니다.
6. 첫 버전은 단일 페이지로 개발합니다.

---

## 12. 최종 방향

> 개발자로 시작해 회사를 운영한 사람이, 다시 직접 소프트웨어와 시스템을 만들며 그 과정을 공개적으로 기록하는 개인 홈페이지.
