# DBMS 및 저장 적정성 검토 v4 — swarm56.com (옵시디언 단일소스)

> 작성: Opus (Claude Code) / 개정: v4 — 2026-06-27
> 실제 환경: AWS Lightsail Ubuntu 24.04, **RAM 1GB / SSD 40GB / Swap 4GB**, IP 54.116.19.34
> v4 정정: 콘텐츠 단일소스는 **옵시디언(전문 md)**, **SQLite는 그 파생 카드 캐시**. CouchDB **유지**(볼트 호스팅).

---

## 0. 결론
1. **콘텐츠 전문 = 옵시디언 Vault(markdown 파일)** 에 보관 (단일 소스).
2. **SQLite = 홈피용 카드 캐시**(제목/발췌/썸네일경로/원문URL/메타). 전문은 SQLite에 안 넣음.
3. **CouchDB(3.5.2, 검증됨) 유지** — 옵시디언 볼트를 서버 호스팅하고 Peter 기기와 동기화.
4. 썸네일 이미지는 **파일시스템** 저장 + DB엔 경로만 + Nginx 정적 서빙. BLOB 금지.
5. 원격 이미지 핫링크 금지 → Python Agent가 다운로드·캐시(SSRF 등 검증).
6. WAL + busy_timeout을 동시 write 테스트로 실증. 자동 hard delete 없음.

---

## 1. 저장 계층 (3-tier)
| 계층 | 저장소 | 내용 | 위치 |
|------|--------|------|------|
| 전문 아카이브 | **옵시디언 Vault (md 파일)** | 클리핑 전문 + frontmatter | 서버, CouchDB 동기화 |
| 카드 캐시 | **SQLite** | 카드 메타(발췌/썸네일경로/원문URL/hash) | 서버 |
| 이미지 | **파일시스템** | 썸네일 바이트 | `/var/lib/swarm56/web/thumbnails/<채널>/` |

홈피는 옵시디언을 매 요청 읽지 않고 **SQLite 카드 캐시**를 읽는다(속도). 옵시디언 md가 진실원천, SQLite는 파생 사본.

---

## 2. SQLite 적정성 (카드 캐시용)
- 행 = 클리핑 항목당 1개(카드). **전문 미포함**이라 행이 가볍다.
- 규모: 채널당 수백 × 8채널 × 수년 = 수천~수만 행. index 조회 중심 → SQLite에 차고 넘침.
- 워크로드: 클리퍼(Python) write(주기 batch), 홈피 read(가벼움), 어드민 write(낮은 빈도).
- 1GB VPS에 별도 DB 데몬 불필요 → **SQLite 유지**가 정답. Postgres는 과설계.
- Postgres 재검토 조건: 다중 VPS 동시 write / 지속 고빈도 / 검증된 lock 병목 / HA.

---

## 3. 전문은 왜 옵시디언(파일)인가 (SQLite/BLOB 아님)
- 전문은 Peter의 **지식베이스(LLM-wiki)** 이기도 함 → 옵시디언 md가 자연스러운 1급 저장.
- 전문을 SQLite에 넣으면 DB 비대화 + 옵시디언 동기화와 이중화. 분리가 깔끔.
- 검색/편집/링크는 옵시디언 생태계가 담당, 홈피는 카드 캐시만 빠르게 읽음.

---

## 4. 이미지(썸네일) 저장
| 방식 | 판단 |
|------|------|
| SQLite BLOB | ❌ DB 비대·서빙 불가 |
| **파일시스템 + DB 경로** | ✅ **채택** (Nginx 정적, 가벼움) |
| Object Storage | 향후 옵션 |
| 원격 핫링크 | ❌ 네이버 referrer 차단 등 → 다운로드 캐시 |

저장: `/var/lib/swarm56/web/thumbnails/<채널>/<sha256>.<ext>`, DB `thumbnailPath`. 기본 이미지 `web/public/channel-defaults/<채널>.png`.

용량(40GB): 100KB×1만장=1GB 수준 → 충분. 자동 FeedCard 삭제 대신 디스크는 70/80% 임계, orphan 정리, backup 보관 관리.

---

## 5. Writer/Reader & 썸네일 보안
- **Python Agent = 유일한 썸네일 writer**(다운로드·timeout·redirect제한·MIME·size·decode·hash·atomic rename·orphan). **Next.js read-only.**
- 다운로드 보안: HTTPS우선, ≤2MB, MIME allowlist(jpeg/png/webp), SVG 금지, magic byte 검증, **SSRF 차단(사설IP·localhost redirect 거부)**, 응답 본문 로그 금지.
- Nginx: `location /thumbnails/ { alias /var/lib/swarm56/web/thumbnails/; add_header X-Content-Type-Options nosniff always; expires 7d; }`.

---

## 6. CouchDB (유지)
- 역할: **옵시디언 볼트 서버 호스팅 + Peter 기기 LiveSync**. 홈피 콘텐츠 파이프라인의 일부(클리핑된 전문이 모이는 볼트를 떠받침).
- 상태: 3.5.2 운영 중(sync.swarm56.com, 원격 검증 2026-06-27).
- 1GB RAM: ~100~150MB 점유 → Swap 4GB 필수, 클리퍼는 순차 oneshot.
- ※ v3의 "R8 decommission"은 **취소**(Obsidian이 단일소스라 CouchDB 필요).

---

## 7. SQLite 동시성 (WAL + busy_timeout, 실증)
- writer: 클리퍼(Python, 카드 upsert) + 어드민(Prisma, status). reader: 홈피.
- `PRAGMA journal_mode=WAL;` (결과 `wal` 검증). Python `busy_timeout=5000` 검증. Prisma도 실제 connection에서 적용 검증(불가시 어드민 write serial queue).
- **동시 write 통합 테스트** (Python↔Prisma) Test A/B/C 각 10회: 우발 `database is locked` 0, timeout은 의도적 실패, 중복/부분commit 없음, `integrity_check` 통과.

---

## 8. Backup / Restore
- backup set: `site.db`(`.backup` API; raw WAL main file 단독 cp 금지) + `thumbnails.tar.zst` + `manifest.sha256`.
- 옵시디언 볼트는 별도(CouchDB 데이터 + 볼트 파일) 백업 — 전문 아카이브이므로 중요.
- restore 후 `PRAGMA integrity_check`, FeedCard count, thumbnail/vaultPath 존재율 검증.
- backup 전 `PRAGMA wal_checkpoint(PASSIVE)`.

---

## 9. 정합성
- vaultPath 있는데 md 없음 → 카드 missing 표시·report, 자동삭제 금지.
- 썸네일 missing → channel default.
- orphan(파일/카드 한쪽만) → dry-run report 후 보존기간 지나 정리.

---

## 10. 결정표
| ID | 결정 | 최종 |
|----|------|------|
| DB-1 | SQLite 유지(카드 캐시) | YES |
| DB-2 | 전문=옵시디언 md, SQLite/BLOB 아님 | YES |
| DB-3 | 썸네일=파일시스템+Nginx | YES |
| DB-4 | 원격 핫링크 대신 다운로드 캐시(+SSRF 차단) | YES |
| DB-5 | WAL+busy_timeout 동시write 실증 | YES |
| DB-6 | CouchDB 유지(볼트 호스팅) | YES |
| DB-7 | 자동 hard delete | NO |
| DB-8 | Next.js 썸네일 write | NO |

---

## 11. 최종 판정
> **옵시디언(전문) + SQLite(카드 캐시) + 파일시스템(썸네일) + CouchDB(볼트 호스팅)** 의 4계층이 1GB/40GB VPS에 적합하다.
> 리스크는 데이터 용량이 아니라 **두 writer(클리퍼·어드민) lock 경합 + 옵시디언↔SQLite↔파일 정합성**이다. → WAL·busy_timeout 실증, 일관 backup/restore, 정합성 점검을 완료 Gate로 삼는다.
