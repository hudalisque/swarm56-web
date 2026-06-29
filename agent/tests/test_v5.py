"""v5 핵심 로직 자동 테스트 (네트워크 없이).

실행: (homepage_project/ 에서)  python -m agent.tests.test_v5
검증 대상: suppression(방식 B) 스킵/복원, 볼트→SQLite 파생·thumbnailPath, 볼트 frontmatter 라운드트립,
발췌 truncation fallback, 본문 이미지 정규식.
"""
import datetime
import os
import sqlite3
import tempfile

from agent import db, vault, excerpt, images
from agent.models import NormalizedRecord


def _temp_db():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    c = sqlite3.connect(path)
    c.executescript(
        """
        CREATE TABLE FeedCard (id TEXT PRIMARY KEY, channel TEXT, title TEXT, excerpt TEXT,
          thumbnailPath TEXT, originalUrl TEXT UNIQUE, vaultPath TEXT, publishedAt INTEGER,
          externalId TEXT, createdAt INTEGER, updatedAt INTEGER);
        CREATE TABLE SuppressionRecord (id TEXT PRIMARY KEY, originalUrl TEXT UNIQUE, vaultPath TEXT,
          deletedAt INTEGER, deletedBy TEXT, reason TEXT, restoredAt INTEGER);
        """
    )
    c.commit()
    return c, path


def test_suppression_roundtrip():
    c, path = _temp_db()
    fm = {"url": "http://x/1", "channel": "NAVER_BLOG", "title": "T", "excerpt": "E",
          "published": "2026-01-01T00:00:00", "thumbnail": "_assets/a.webp"}
    assert db.upsert_from_frontmatter(c, fm, "raw/naver_blog/x.md") == "inserted"
    # 삭제 = FeedCard 행 제거 + 활성 SuppressionRecord (방식 B)
    c.execute("DELETE FROM FeedCard WHERE originalUrl=?", ("http://x/1",))
    c.execute("INSERT INTO SuppressionRecord (id,originalUrl,deletedAt,deletedBy) VALUES (?,?,?,?)",
              (db.gen_id(), "http://x/1", db._now_ms(), "admin"))
    c.commit()
    assert db.is_suppressed(c, "http://x/1")
    # 전체 재파생 → 부활 X
    assert db.upsert_from_frontmatter(c, fm, "raw/naver_blog/x.md") == "suppressed"
    assert c.execute("SELECT count(*) FROM FeedCard WHERE originalUrl=?", ("http://x/1",)).fetchone()[0] == 0
    # 복원 → 되살아남
    c.execute("UPDATE SuppressionRecord SET restoredAt=? WHERE originalUrl=?", (db._now_ms(), "http://x/1"))
    c.commit()
    assert not db.is_suppressed(c, "http://x/1")
    assert db.upsert_from_frontmatter(c, fm, "raw/naver_blog/x.md") == "inserted"
    c.close()
    os.remove(path)
    print("test_suppression_roundtrip OK")


def test_thumbnail_web_path():
    c, path = _temp_db()
    fm = {"url": "http://x/2", "channel": "YOUTUBE", "title": "T",
          "published": "2026-01-01T00:00:00", "thumbnail": "_assets/h.webp"}
    db.upsert_from_frontmatter(c, fm, "raw/youtube/x.md")
    tp = c.execute("SELECT thumbnailPath FROM FeedCard WHERE originalUrl=?", ("http://x/2",)).fetchone()[0]
    assert tp == "/vault/youtube/_assets/h.webp", tp
    c.close()
    os.remove(path)
    print("test_thumbnail_web_path OK")


def test_vault_roundtrip():
    d = tempfile.mkdtemp()
    rec = NormalizedRecord(channel="NAVER_BLOG", title="제목/테스트", original_url="http://x/3",
                           published_at=datetime.datetime(2026, 1, 2), full_markdown="본문",
                           excerpt="요약", external_id="e1", thumbnail_remote_url=None)
    vault.write_md(d, "NAVER_BLOG", rec, "hash123", "본문 치환됨", "_assets/t.webp", excerpt="요약문")
    items = vault.iter_vault(d)
    assert len(items) == 1
    _, fm = items[0]
    assert fm["url"] == "http://x/3" and fm["content_hash"] == "hash123"
    assert fm["thumbnail"] == "_assets/t.webp" and fm["excerpt"] == "요약문"
    assert vault.existing_hash(d, "NAVER_BLOG", rec) == "hash123"
    print("test_vault_roundtrip OK")


def test_excerpt_truncation():
    out = excerpt.generate("![i](http://x/y.png) 본문 " + ("가 " * 100) + " https://l", fallback="fb")
    assert "http" not in out and "![" not in out and len(out) <= 201
    print("test_excerpt_truncation OK")


def test_image_regex():
    found = images.MD_IMG.findall("t ![a](https://h/i.png) m ![](http://h/j.jpg) end")
    assert len(found) == 2
    print("test_image_regex OK")


if __name__ == "__main__":
    test_suppression_roundtrip()
    test_thumbnail_web_path()
    test_vault_roundtrip()
    test_excerpt_truncation()
    test_image_regex()
    print("ALL PASS")
