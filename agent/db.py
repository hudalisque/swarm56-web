"""SQLite(FeedCard 카드 캐시) 쓰기 레이어 — v5: 볼트 md frontmatter에서 파생.

- 카드는 옵시디언 볼트 md에서 파생(upsert_from_frontmatter).
- 삭제 의도(SuppressionRecord, 방식 B): 활성 suppression URL은 파생/재파생에서 스킵 → 부활 X.
- v5 스키마: FeedCard에 status/thumbnailKind/contentHash 없음.
Prisma 호환: DateTime=INTEGER(ms epoch), id=TEXT(cuid-like), createdAt/updatedAt 명시.
동시성: WAL + busy_timeout.
"""
import hashlib
import sqlite3
import time
import uuid
from datetime import datetime

# 볼트 _assets → 웹 서빙 경로 prefix (Nginx alias: /vault/ → <vault>/raw/)
VAULT_WEB_PREFIX = "/vault"


def connect(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path, timeout=5.0)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    return conn


def gen_id() -> str:
    return "c" + uuid.uuid4().hex[:24]


def content_hash(text: str) -> str:
    return hashlib.sha256((text or "").encode("utf-8")).hexdigest()


def _ms(dt: datetime) -> int:
    return int(dt.timestamp() * 1000)


def _now_ms() -> int:
    return int(time.time() * 1000)


def _parse_iso_ms(s: str) -> int:
    try:
        return int(datetime.fromisoformat((s or "").replace("Z", "+00:00")).timestamp() * 1000)
    except Exception:
        return _now_ms()


def is_suppressed(conn, original_url: str) -> bool:
    """활성 suppression(삭제 의도, restoredAt IS NULL)인지."""
    row = conn.execute(
        "SELECT 1 FROM SuppressionRecord WHERE originalUrl=? AND restoredAt IS NULL",
        (original_url,),
    ).fetchone()
    return row is not None


def _thumb_web_path(channel: str, thumb_rel: str | None) -> str | None:
    """frontmatter thumbnail(_assets/x.webp) → 웹 경로 /vault/<채널>/_assets/x.webp."""
    if not thumb_rel:
        return None
    return f"{VAULT_WEB_PREFIX}/{channel.lower()}/{thumb_rel}"


def upsert_from_frontmatter(conn, fm: dict, relpath: str) -> str:
    """볼트 md frontmatter → FeedCard 파생. 활성 suppression이면 스킵. 반환: suppressed|inserted|updated."""
    url = fm.get("url")
    if not url:
        return "skip"
    if is_suppressed(conn, url):
        return "suppressed"

    channel = fm.get("channel") or (fm.get("source", "").upper())
    title = fm.get("title") or "(제목 없음)"
    excerpt = fm.get("excerpt") or None
    ext = fm.get("external_id") or None
    thumb = _thumb_web_path(channel, fm.get("thumbnail") or None)
    pub = _parse_iso_ms(fm.get("published"))
    now = _now_ms()

    row = conn.execute("SELECT id FROM FeedCard WHERE originalUrl=?", (url,)).fetchone()
    if row is None:
        conn.execute(
            """INSERT INTO FeedCard
               (id, channel, title, excerpt, thumbnailPath, originalUrl,
                vaultPath, publishedAt, externalId, createdAt, updatedAt)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (gen_id(), channel, title, excerpt, thumb, url, relpath, pub, ext, now, now),
        )
        return "inserted"

    conn.execute(
        """UPDATE FeedCard
           SET channel=?, title=?, excerpt=?, thumbnailPath=?, vaultPath=?,
               publishedAt=?, externalId=?, updatedAt=?
           WHERE id=?""",
        (channel, title, excerpt, thumb, relpath, pub, ext, now, row[0]),
    )
    return "updated"


def create_sync_run(conn, channel, trigger: str = "MANUAL_CLI") -> str:
    rid = gen_id()
    conn.execute(
        """INSERT INTO SyncRun
           (id, channel, trigger, status, startedAt,
            fetchedCount, upsertedCount, skippedCount, errorCount)
           VALUES (?,?,?,?,?,0,0,0,0)""",
        (rid, channel, trigger, "RUNNING", _now_ms()),
    )
    return rid


def finish_sync_run(conn, rid, status, fetched, upserted, skipped, errors, message=None):
    conn.execute(
        """UPDATE SyncRun
           SET status=?, finishedAt=?, fetchedCount=?, upsertedCount=?,
               skippedCount=?, errorCount=?, message=?
           WHERE id=?""",
        (status, _now_ms(), fetched, upserted, skipped, errors, message, rid),
    )
