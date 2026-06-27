"""swarm56 클리핑 에이전트 — one-shot 오케스트레이터.

실행: (homepage_project/ 에서) python -m agent.main
흐름: 채널 수집 → 전문 md(볼트 raw/) + SQLite FeedCard upsert → SyncRun 기록 → exit.
watchdog/무한 loop 없음.
"""
from . import settings, db
from .vault import write_md
from .thumbnail import save_from_url
from .collectors import naver_blog, github, youtube, notion, swarm


def run_channel(conn, channel: str, fetch_fn) -> None:
    rid = db.create_sync_run(conn, channel)
    conn.commit()
    fetched = upserted = skipped = errors = 0
    try:
        records = fetch_fn()
        fetched = len(records)
        for rec in records:
            try:
                chash = db.content_hash(rec.full_markdown)
                vault_path = write_md(settings.VAULT_DIR, channel, rec, chash)
                result = db.upsert_card(conn, rec, chash, vault_path)
                if result == "skipped":
                    skipped += 1
                else:
                    upserted += 1
                    # 썸네일은 신규/변경분만 다운로드 (원문 referer로 핫링크 우회)
                    tpath = save_from_url(
                        rec.thumbnail_remote_url, channel,
                        settings.THUMBNAIL_DIR, referer=rec.original_url,
                    )
                    db.set_thumbnail(conn, rec.original_url, tpath,
                                     "ORIGINAL" if tpath else "DEFAULT")
                conn.commit()
                print(f"  [{result.upper()}] {rec.title}")
            except Exception as e:
                errors += 1
                conn.rollback()
                print(f"  [ERROR] {rec.original_url}: {e}")
        status = "SUCCESS" if errors == 0 else ("PARTIAL" if (upserted or skipped) else "ERROR")
        db.finish_sync_run(conn, rid, status, fetched, upserted, skipped, errors)
        conn.commit()
    except Exception as e:
        db.finish_sync_run(conn, rid, "ERROR", fetched, upserted, skipped, errors + 1, str(e))
        conn.commit()
        print(f"[{channel}] FATAL: {e}")
    print(f"[{channel}] fetched={fetched} upserted={upserted} skipped={skipped} errors={errors}")


def main() -> None:
    print(f"[agent] DB={settings.DB_PATH}")
    print(f"[agent] VAULT={settings.VAULT_DIR}")
    conn = db.connect(settings.DB_PATH)
    try:
        run_channel(conn, "NAVER_BLOG", naver_blog.fetch)
        run_channel(conn, "GITHUB", github.fetch)
        run_channel(conn, "YOUTUBE", youtube.fetch)
        run_channel(conn, "NOTION", notion.fetch)
        run_channel(conn, "SWARM", swarm.fetch)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
