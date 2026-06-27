"""Notion 수집기 — Integration 토큰으로 데이터베이스 쿼리. 토큰은 env(SWARM56_NOTION_TOKEN)에서만.

DB가 Integration과 공유돼 있어야 함(공유 안 되면 404). 각 페이지 = 카드.
"""
from datetime import datetime, timezone

import requests

from .. import settings
from ..models import NormalizedRecord

API = "https://api.notion.com/v1"


def _headers():
    return {
        "Authorization": f"Bearer {settings.NOTION_TOKEN}",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
    }


def _parse(s: str) -> datetime:
    try:
        return datetime.fromisoformat((s or "").replace("Z", "+00:00"))
    except Exception:
        return datetime.now(timezone.utc)


def _title_of(page: dict) -> str:
    for p in (page.get("properties") or {}).values():
        if p.get("type") == "title":
            txt = "".join(t.get("plain_text", "") for t in (p.get("title") or []))
            if txt.strip():
                return txt.strip()
    return "(제목 없음)"


def fetch() -> list[NormalizedRecord]:
    if not settings.NOTION_TOKEN or not settings.NOTION_DATABASE_ID:
        print("  [NOTION] 토큰/DB id 없음 — 스킵")
        return []
    try:
        r = requests.post(
            f"{API}/databases/{settings.NOTION_DATABASE_ID}/query",
            headers=_headers(),
            json={
                "page_size": settings.MAX_PER_CHANNEL,
                "sorts": [{"timestamp": "last_edited_time", "direction": "descending"}],
            },
            timeout=settings.HTTP_TIMEOUT,
        )
        if r.status_code == 404:
            print("  [NOTION] 404 — Integration이 DB와 공유돼 있는지 확인 필요")
            return []
        r.raise_for_status()
    except Exception as e:
        print(f"  [NOTION] 쿼리 실패: {e}")
        return []

    records: list[NormalizedRecord] = []
    for pg in (r.json().get("results") or [])[: settings.MAX_PER_CHANNEL]:
        url = pg.get("url") or ""
        if not url:
            continue
        title = _title_of(pg)
        pub = pg.get("created_time") or pg.get("last_edited_time") or ""
        records.append(
            NormalizedRecord(
                channel="NOTION",
                title=title,
                original_url=url,
                published_at=_parse(pub),
                full_markdown=f"# {title}\n\n{url}\n",
                excerpt="",
                external_id=pg.get("id"),
                thumbnail_remote_url=None,
            )
        )
    return records
