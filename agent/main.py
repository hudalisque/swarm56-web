"""swarm56 클리핑 에이전트 — one-shot 오케스트레이터 (v5: 옵시디언 볼트 단일소스).

Phase A: 채널 → 옵시디언 볼트 md(전문) + 본문 이미지(_assets). SQLite 안 건드림.
Phase B: 볼트 md → SQLite 카드 파생 (활성 suppression URL 스킵 = 삭제 의도 보존, 방식 B).
실행: (homepage_project/ 에서) python -m agent.main
watchdog/무한 loop 없음. 멱등·재개 가능.
"""
from . import settings, db, images
from .vault import write_md, existing_hash, iter_vault
from .collectors import naver_blog, github, youtube, notion, swarm, instagram, facebook

CHANNELS = [
    ("NAVER_BLOG", naver_blog.fetch),
    ("GITHUB", github.fetch),
    ("YOUTUBE", youtube.fetch),
    ("NOTION", notion.fetch),
    ("SWARM", swarm.fetch),
    ("INSTAGRAM", instagram.fetch),
    ("FACEBOOK", facebook.fetch),
]


def clip_channel(conn, channel: str, fetch_fn) -> None:
    """Phase A: 채널 → 볼트 md + 본문 이미지. 볼트 md 존재 시 스킵(dedup)."""
    rid = db.create_sync_run(conn, channel)
    conn.commit()
    fetched = written = skipped = errors = 0
    try:
        records = fetch_fn()
        fetched = len(records)
        for rec in records:
            try:
                chash = db.content_hash(rec.full_markdown)
                if existing_hash(settings.VAULT_DIR, channel, rec) == chash:
                    skipped += 1
                    continue
                body, assets, first = images.process(
                    rec.full_markdown, channel, settings.VAULT_DIR, referer=rec.original_url
                )
                if not first and rec.thumbnail_remote_url:
                    first = images.fetch_thumbnail(
                        rec.thumbnail_remote_url, channel, settings.VAULT_DIR, referer=rec.original_url
                    )
                write_md(settings.VAULT_DIR, channel, rec, chash, body, first)
                written += 1
                print(f"  [MD] {rec.title}  (img {len(assets)})")
            except Exception as e:
                errors += 1
                print(f"  [ERROR] {getattr(rec, 'original_url', '?')}: {e}")
        status = "SUCCESS" if errors == 0 else ("PARTIAL" if (written or skipped) else "ERROR")
        db.finish_sync_run(conn, rid, status, fetched, written, skipped, errors)
        conn.commit()
    except Exception as e:
        db.finish_sync_run(conn, rid, "ERROR", fetched, written, skipped, errors + 1, str(e))
        conn.commit()
        print(f"[{channel}] FATAL: {e}")
    print(f"[{channel}] fetched={fetched} md={written} skipped={skipped} errors={errors}")


def sync_vault_to_db(conn) -> None:
    """Phase B: 볼트 md → SQLite 카드 파생. 활성 suppression URL은 스킵(삭제 의도 보존)."""
    rid = db.create_sync_run(conn, None)
    conn.commit()
    items = iter_vault(settings.VAULT_DIR)
    ins = upd = sup = errors = 0
    for relpath, fm in items:
        try:
            r = db.upsert_from_frontmatter(conn, fm, relpath)
            if r == "inserted":
                ins += 1
            elif r == "updated":
                upd += 1
            elif r == "suppressed":
                sup += 1
            conn.commit()
        except Exception as e:
            conn.rollback()
            errors += 1
            print(f"  [DERIVE ERROR] {relpath}: {e}")
    db.finish_sync_run(conn, rid, "SUCCESS" if errors == 0 else "PARTIAL",
                       len(items), ins + upd, sup, errors, f"suppressed={sup}")
    conn.commit()
    print(f"[VAULT→DB] md={len(items)} inserted={ins} updated={upd} suppressed(skip)={sup} errors={errors}")


def main() -> None:
    print(f"[agent] DB={settings.DB_PATH}")
    print(f"[agent] VAULT={settings.VAULT_DIR}")
    conn = db.connect(settings.DB_PATH)
    try:
        for ch, fn in CHANNELS:
            clip_channel(conn, ch, fn)
        sync_vault_to_db(conn)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
