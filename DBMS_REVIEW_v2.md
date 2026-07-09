# DBMS 및 저장 적정성 검토 v2 — swarm56.com

> v2 · 2026-07-09 · 이전 버전: [DBMS_REVIEW.md](DBMS_REVIEW.md) (보존 — v4 시점 2026-06-27)
> 변경 사유: ① v5 라이브 반영(site-v5.db·본문 이미지 볼트 저장·suppression) ② **백오피스 프로젝트 카드 추가**(ProjectCard 테이블 + 웹 writer 확대 + 저장소 2곳 신설) ③ CouchDB 위상 변화(v5에서 아키텍처 제거, 서비스 잔존).
> 실제 환경: AWS Lightsail Ubuntu 24.04, **RAM 1GB / SSD 40GB / Swap 4GB** (주소는 로컬 전용 문서 참조)

---

## 0. 결론 (v2)
1. **콘텐츠 전문 = 옵시디언 Vault(`vault-v5`, md+이미지)** 보관 — 단일 소스. `raw/`=피드 소스, `project/`=지식그래프 문서.
2. **SQLite(`site-v5.db`) = 홈피 카드 저장소** — `FeedCard`(볼트 파생 캐시) + **`ProjectCard`(v2 신설, 파생 아닌 1급 데이터)**. 전문은 SQLite에 안 넣음.
3. 이미지·문서는 **파일시스템** + DB엔 경로만 + Nginx 정적 서빙(alias 3종: /vault/·/thumbnails/·**/docs/**). BLOB 금지.
4. WAL + busy_timeout 유지(writer 증가에도 부하 특성 동일 — 저빈도 admin write).
5. CouchDB: v5 아키텍처에서 **제거됨**(볼트는 서버 파일시스템이 직접 단일소스). 서비스는 잔존 — 정리는 문제 시(`KNOWN_ISSUES_v2.md`).

---

## 1. 저장 계층 (v2 — 5-tier)
| 계층 | 저장소 | 내용 | 위치 | writer |
|------|--------|------|------|--------|
| 전문 아카이브 | 옵시디언 Vault `raw/` | 클리핑 전문 md + `_assets/` webp | `/var/lib/swarm56/vault-v5/raw/` | 에이전트 |
| 지식그래프 문서 | 옵시디언 Vault `project/` | 프로젝트 문서 md | `/var/lib/swarm56/vault-v5/project/` | **백오피스 업로드(v2, 한정 예외)** · Peter/scp |
| 카드 DB | SQLite `site-v5.db` | `FeedCard`(파생 캐시) + `ProjectCard`(v2) + Suppression·Audit·SyncRun | `/var/lib/swarm56/web/` | 에이전트(파생) + 백오피스(삭제·**카드 추가**) |
| 프로젝트 문서 HTML | 파일시스템 | 카드 링크 대상 `.html` | `/var/lib/swarm56/web/docs/` (v2) | **백오피스 업로드(v2)** |
| 썸네일 | 파일시스템 | webp | `/var/lib/swarm56/web/thumbnails/` | 에이전트 |

홈피는 볼트를 매 요청 읽지 않고 **SQLite만** 읽는다(속도). 볼트 md가 피드의 진실원천, FeedCard는 파생 사본. **ProjectCard는 파생이 아니라 그 자체가 원본**(볼트 project/ md는 지식그래프용 병행 사본).

---

## 2. SQLite 적정성 (v4 판정 유지 + v2 보강)
- FeedCard: 채널당 수백 × 8채널 × 수년 = 수천~수만 행, index 조회 중심 → SQLite 충분.
- **ProjectCard(v2): 수십 행 규모**(프로젝트 문서 카드) — 부하 무시 가능.
- 워크로드: 클리퍼 write(일 1회 batch + 온디맨드), 홈피 read, 어드민 write(저빈도 — 삭제·편집·카드 추가).
- 1GB VPS에 별도 DB 데몬 불필요 → **SQLite 유지.** Postgres 재검토 조건(다중 VPS write 등) 변화 없음.

---

## 3. 전문·문서는 왜 파일인가 (v4 논리 유지)
- 전문 md = Peter의 지식베이스 → 옵시디언 1급 저장. SQLite에 넣으면 비대화+이중화.
- **(v2) 프로젝트 HTML도 파일**: 정적 문서라 nginx 직접 서빙이 최적. DB/BLOB에 넣을 이유 없음. `public/`은 빌드에 굳으므로 **런타임 업로드 가능한 서버 디렉토리 + nginx alias** 채택(기존 /vault/ 패턴).

---

## 4. Writer/Reader 권한 지도 (v2 개정 — 핵심 변화)
| 저장소 | writer | reader |
|--------|--------|--------|
| 볼트 `raw/` | 에이전트**만** (웹 접근 코드 없음) | 에이전트(파생), Nginx(이미지) |
| 볼트 `project/` | **백오피스(v2 — 유일한 웹→볼트 예외)**, Peter | (향후 그래프/RAG) |
| `FeedCard` | 에이전트(파생 insert), 백오피스(삭제) | 홈피 |
| `ProjectCard` | **백오피스(추가)** (v2) | 홈피 |
| `web/docs/` | **백오피스(업로드)** (v2) | Nginx |
| 썸네일 | 에이전트만, **Next.js write 금지 유지** | Nginx |

**v2 업로드 방어**(웹 writer 확대에 따른 보강): 확장자 화이트리스트(.html/.md) · 4MB 상한 · `basename`+`[a-z0-9-]` sanitize(traversal 차단) · `wx` 플래그(덮어쓰기 방지) · 부분 실패 시 파일 롤백 + FAILED 감사. 볼트 접근은 `project/` 경로 상수 고정.
썸네일 다운로드 보안(v4 유지): HTTPS 우선, ≤2MB, MIME allowlist, SVG 금지, magic byte, **SSRF 차단**.

---

## 5. CouchDB (v2 위상 변경)
- v4 "유지(볼트 호스팅)" → **v5 아키텍처에서 제거**(서버 볼트 파일시스템이 직접 단일소스, 클라이언트 LiveSync=R1 보류).
- 현재: 서비스 잔존(sync.swarm56.com, ~40MB RAM 점유, 5984 로컬 바인딩). **정리는 문제 발생 시**(Peter 원칙) — `KNOWN_ISSUES_v2.md` 등재.

---

## 6. SQLite 동시성 (v4 실증 유지)
- writer: 클리퍼(Python) + 어드민(Prisma — 삭제·편집·**ProjectCard insert**). reader: 홈피.
- WAL + busy_timeout 실증(v4 Test A/B/C). v2의 어드민 write 추가는 저빈도 단건 트랜잭션이라 경합 특성 변화 없음.

---

## 7. Backup / Restore (v2 확장)
- backup set: `site-v5.db`(`.backup` API; WAL main file 단독 cp 금지) + `thumbnails` + **`web/docs/`(v2)** + `manifest.sha256`.
- **볼트 백업에 `project/` 포함**(v2 — raw/만 아님).
- 마이그레이션 전 DB 백업 필수(예: `site-v5.db.bak-<date>` — project_card 마이그레이션 시 실행).
- restore 후 `integrity_check`, FeedCard/ProjectCard count, thumbnail/vaultPath/docPath 존재율 검증.

---

## 8. 정합성 (v2 추가 항목)
- vaultPath 있는데 md 없음 → missing 표시·report, 자동삭제 금지. (v4 유지)
- **(v2) `ProjectCard.docPath` 있는데 `/docs/` 파일 없음** → 카드 링크 404. 점검: DB docPath ↔ `web/docs/` 파일 대사. (추가는 트랜잭션+롤백으로 예방, 수기 파일 삭제 시 발생 가능)
- **(v2) 고아 파일**(html/md는 있는데 카드 없음 — 추가 실패 롤백 누락 등) → dry-run report 후 정리.

---

## 9. 결정표 (v2)
| ID | 결정 | 최종 |
|----|------|------|
| DB-1 | SQLite 유지(FeedCard 캐시 + ProjectCard) | YES |
| DB-2 | 전문=옵시디언 md, SQLite/BLOB 아님 | YES |
| DB-3 | 썸네일·문서=파일시스템+Nginx | YES |
| DB-4 | 원격 핫링크 대신 다운로드 캐시(+SSRF 차단) | YES |
| DB-5 | WAL+busy_timeout 동시write 실증 | YES |
| DB-6 | CouchDB 아키텍처 유지 | **NO (v5에서 제거 — 서비스 잔존만)** |
| DB-7 | 자동 hard delete | NO |
| DB-8 | Next.js 썸네일 write | NO |
| DB-9 (v2) | ProjectCard = SQLite 1급 테이블(파생 아님) | YES |
| DB-10 (v2) | 프로젝트 HTML = 서버 디렉토리 + nginx alias(빌드 독립) | YES |
| DB-11 (v2) | 웹→볼트 쓰기 = `project/` 한정 예외(raw/ 코드상 불가) | YES — 무손상 필요 시 릴레이 전환 |

---

## 10. 최종 판정 (v2)
> **옵시디언 볼트(전문·지식그래프) + SQLite(피드 캐시+프로젝트 카드) + 파일시스템(썸네일·문서 HTML)** 구조가 1GB/40GB VPS에 계속 적합하다.
> v2의 위험 이동: writer가 셋(클리퍼·어드민 삭제·**어드민 업로드**)이 됐지만 전부 저빈도라 lock 경합 특성은 동일. 새 정합성 축은 **ProjectCard.docPath ↔ docs 파일 ↔ 볼트 project/ md 3자 대사** — 추가는 트랜잭션·롤백으로 보호, 수기 개입 시 §8 점검.
