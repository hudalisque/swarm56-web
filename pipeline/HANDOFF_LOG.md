# HANDOFF LOG — swarm56.com 멀티에이전트 파이프라인

> 회사가 다른 에이전트(Relume / v0.dev / GPT / Claude) 간 모든 핸드오프 인덱스.
> 규칙: 산출물·Peter 결정 없이 다음 단계 진입 금지. (Constitution §4 행위자 명시, §9 상태 영속성·검증)
> 저장: 로컬 `homepage_project/pipeline/` + Google Drive 공유 폴더 동기.

## 협업 R&R
| 주체 | 회사 | 역할 |
|------|------|------|
| Peter + Claude | — / Anthropic | 공동 오케스트레이터 (Peter=최종 결정, Claude=구동·문서화·게이트) |
| Simone (GPT 웹버전) | OpenAI | 기획 협업, Relume/v0.dev 프롬프트 협의 |
| Relume | Relume | IA·사이트맵·와이어프레임 |
| v0.dev | Vercel | UI 컴포넌트 시안 |
| Claude Code (Opus/Sonnet) | Anthropic | 시안→Next.js 통합·DB·백엔드·에이전트 |

## 핸드오프 인덱스

| # | 단계 | 보낸→받는 | 산출물 문서 | Peter 결정 | 일시 |
|---|------|-----------|-------------|------------|------|
| 1 | Relume 와이어프레임 | GPT+Claude → Relume | [01_relume_wireframe.md](01_relume_wireframe.md) | **생성 완료·합격(구조 참고용)** — 핵심 8채널 그리드는 편차 → v0에서 정밀화 | 2026-06-28 |
| 2 | v0.dev 컴포넌트 프롬프트 | Claude → v0.dev | [02_v0_components.md](02_v0_components.md) | **Peter v0 실행 대기** | 2026-06-28 |

> 기록: Claude (Claude Code) — 2026-06-28
