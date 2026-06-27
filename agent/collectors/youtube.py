"""YouTube 수집기 — 채널 RSS(무인증). 핸들/URL → channel_id 해석 후 feeds/videos.xml.

원문 URL은 영상 watch URL, 썸네일은 media:thumbnail.
"""
import re
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

import requests

from .. import settings
from ..models import NormalizedRecord

HEADERS = {"User-Agent": settings.USER_AGENT}
NS = {
    "a": "http://www.w3.org/2005/Atom",
    "yt": "http://www.youtube.com/xml/schemas/2015",
    "media": "http://search.yahoo.com/mrss/",
}


def _parse(s: str) -> datetime:
    try:
        return datetime.fromisoformat((s or "").replace("Z", "+00:00"))
    except Exception:
        return datetime.now(timezone.utc)


def _resolve_channel_id(handle: str) -> str | None:
    h = (handle or "").strip()
    if h.startswith("UC") and len(h) >= 20:
        return h
    url = h if h.startswith("http") else f"https://www.youtube.com/{h if h.startswith('@') else '@' + h}"
    try:
        r = requests.get(url, headers=HEADERS, timeout=settings.HTTP_TIMEOUT)
        r.raise_for_status()
    except Exception as e:
        print(f"  [YT] 채널 페이지 실패: {e}")
        return None
    m = re.search(r'"channelId":"(UC[\w-]+)"', r.text) or re.search(r"channel/(UC[\w-]+)", r.text)
    return m.group(1) if m else None


def fetch() -> list[NormalizedRecord]:
    cid = _resolve_channel_id(settings.YOUTUBE_CHANNEL)
    if not cid:
        print("  [YT] channel_id 해석 실패")
        return []
    try:
        r = requests.get(
            f"https://www.youtube.com/feeds/videos.xml?channel_id={cid}",
            headers=HEADERS, timeout=settings.HTTP_TIMEOUT,
        )
        r.raise_for_status()
    except Exception as e:
        print(f"  [YT] RSS 실패: {e}")
        return []

    root = ET.fromstring(r.content)
    records: list[NormalizedRecord] = []
    for e in root.findall("a:entry", NS)[: settings.MAX_PER_CHANNEL]:
        title = (e.findtext("a:title", default="", namespaces=NS) or "").strip()
        link_el = e.find("a:link", NS)
        link = link_el.get("href") if link_el is not None else ""
        if not title or not link:
            continue
        vid = e.findtext("yt:videoId", default="", namespaces=NS)
        pub = e.findtext("a:published", default="", namespaces=NS)
        mg = e.find("media:group", NS)
        desc = (mg.findtext("media:description", default="", namespaces=NS) or "").strip() if mg is not None else ""
        thumb_el = mg.find("media:thumbnail", NS) if mg is not None else None
        thumb = thumb_el.get("url") if thumb_el is not None else None
        records.append(
            NormalizedRecord(
                channel="YOUTUBE",
                title=title,
                original_url=link,
                published_at=_parse(pub),
                full_markdown=f"# {title}\n\n{desc}\n\n{link}\n",
                excerpt=(desc[:150] + "…") if len(desc) > 150 else desc,
                external_id=vid or None,
                thumbnail_remote_url=thumb,
            )
        )
    return records
