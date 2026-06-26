# 작업노트 (Work Note) - 2026-06-25

## 1. 오늘 작업 및 의사결정 요약

### 1.1 아키텍처 방향 전환 (100% VPS 자립형)
- **기존 안**: 로컬 PC에 에이전트를 상주시켜 수집 및 LLM 가공 후 VPS 서버로 송신하는 구조.
- **결정 안**: 사용자의 로컬 자원을 쓰지 않고 **100% VPS 내부에서 24시간 독립 구동**되는 외부 서비스 구조로 정립.
  - **옵시디언 동기화**: Git 대신 VPS에 **CouchDB**를 올려 옵시디언 플러그인(`Self-hosted LiveSync`)을 통해 로컬 기기들과 실시간 양방향 파일 동기화.
  - **메모리 보호**: Headless Chrome 구동으로 인한 OOM 방지를 위해 VPS에 **4GB Swap Space 설정**을 백로그에 필수 반영.

### 1.2 LLM 연동 방식 확정 (공식 API 적용)
- **기존 안**: 계정 정지 위험 및 보안 취약점이 큰 유료 구독(ChatGPT/Claude Web UI) 세션 쿠키 주입 우회 방식.
- **결정 안**: **공식 API (GPT-4o-mini / Claude 3.5 Sonnet) 연동**.
  - 수집 데이터 요약 및 분류는 비용이 극도로 저렴한 **GPT-4o-mini**를 주 모델로 사용하여 월 요금을 수백 원 이하로 통제.

### 1.3 디자인 멀티에이전트 협업 워크플로우 정립
- **구조**: **Relume(기획/와이어프레임) ➔ v0.dev(디자인 코드 생성) ➔ Antigravity(조율 및 결합)**
- **역할**: **Antigravity**가 전체 오케스트레이터가 되어 프롬프트를 작성하고 최종 코드를 받아 Next.js와 SQLite DB에 병합하는 통합 담당.
- **디자인 시안 검토**: 개발 Phase 3~4 진입 시, **v0.dev가 제공하는 웹 프리뷰 링크**를 통해 실제 작동하는 디자인 시안을 브라우저로 확인하고 최종 컨펌하기로 결정.

---

## 2. 생성 및 수정된 기획 문서 목록
- [1_requirements_analysis.md](D:\Agent_Workspace\homepage_project\1_requirements_analysis.md) (요구사항 분석서)
- [2_feature_specification.md](D:\Agent_Workspace\homepage_project\2_feature_specification.md) (기능 명세서)
- [3_tech_design_agent_analysis.md](D:\Agent_Workspace\homepage_project\3_tech_design_agent_analysis.md) (기술 및 디자인 에이전트 분석서)
- [4_tech_platform_selection.md](D:\Agent_Workspace\homepage_project\4_tech_platform_selection.md) (기술 플랫폼 선정서)
- [5_development_design_brief.md](D:\Agent_Workspace\homepage_project\5_development_design_brief.md) (최종 개발/디자인 기획서)
- *경로 교정: 2026-06-27, Claude (Claude Code) — C:/shared → D:\Agent_Workspace\homepage_project*

---

## 3. 내일(다음 단계) 진행 예정 작업 (구현 착수 백로그)
1. **AWS Lightsail Ubuntu 인스턴스 초기 구성 및 4GB Swap 메모리 튜닝**
2. **CouchDB Docker 컨테이너 가동 및 Nginx 역방향 프록시/SSL 세팅**
3. **옵시디언 데스크톱/모바일 앱 CouchDB LiveSync 실시간 연동 테스트**
4. **Next.js 14 보일러플레이트 설치 및 SQLite/Prisma DB 초기화**
