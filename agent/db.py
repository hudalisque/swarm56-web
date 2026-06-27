"""SQLite(FeedCard 카드 캐시) 쓰기 레이어.

Prisma가 만든 dev.db에 직접 쓴다. Prisma 호환을 위해:
- DateTime = INTEGER(ms epoch)
- id = TEXT (cuid-like 고유 문자열)
- createdAt/updatedAt 명시적으로 채움(DEFAULT CURRENT_TIMESTAMP는 TEXT라 사용 금지)
동시성: WAL + busy_timeout=5000 (Python 클리퍼 ↔ Next.js 동시 접근 대비).
"""
import hashlib
import sqlite3
import time
import uuid
from datetime import datetime


def connect(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path, timeout=5.0)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    return conn


def gen_id() -> str:
    # Prisma는 id를 불투명 문자열로 취급 → 고유 TEXT면 충분.
    return "c" + uuid.uuid4().hex[:24]


def content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _ms(dt: datetime) -> int:
    return int(dt.timestamp() * 1000)


def _now_ms() -> int:
    return int(time.time() * 1000)


def get_existing(conn, original_url: str):
    return conn.execute(
        "SELECT id, contentHash FROM FeedCard WHERE originalUrl=?",
        (original_url,),
    ).fetchone()


def upsert_card(conn, rec, content_hash_val: str, vault_path: str) -> str:
    """신규 insert / 변경 시 update / 동일하면 skip. 반환: inserted|updated|skipped."""
    now = _now_ms()
    existing = get_existing(conn, rec.original_url)
    if existing is None:
        conn.execute(
            """INSERT INTO FeedCard
               (id, channel, title, excerpt, thumbnailPath, thumbnailKind,
                originalUrl, vaultPath, contentHash, publishedAt, status,
                externalId, createdAt, updatedAt)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                gen_id(), rec.channel, rec.title, rec.excerpt, None, "NONE",
                rec.original_url, vault_path, content_hash_val, _ms(rec.published_at),
                "ACTIVE", rec.external_id, now, now,
            ),
        )
        return "inserted"

    card_id, old_hash = existing
    if old_hash == content_hash_val:
        return "skipped"

    # 원본 변경 → 재클립(상태는 건드리지 않음: 어드민이 INACTIVE/DELETED 했으면 유지)
    conn.execute(
        """UPDATE FeedCard
           SET title=?, excerpt=?, vaultPath=?, contentHash=?, publishedAt=?,
               externalId=?, updatedAt=?
           WHERE id=?""",
        (
            rec.title, rec.excerpt, vault_path, content_hash_val,
            _ms(rec.published_at), rec.external_id, now, card_id,
        ),
    )
    return "updated"


def set_thumbnail(conn, original_url: str, thumb_path, kind: str) -> None:
    conn.execute(
        "UPDATE FeedCard SET thumbnailPath=?, thumbnailKind=?, updatedAt=? WHERE originalUrl=?",
        (thumb_path, kind, _now_ms(), original_url),
    )


def create_sync_run(conn, channel: str, trigger: str = "MANUAL_CLI") -> str:
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
