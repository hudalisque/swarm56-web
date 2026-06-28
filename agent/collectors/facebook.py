"""Facebook 수집기 — Page 게시물. Graph API /{page-id}/posts + Page access token(env).

개인 프로필은 API 불가(2018~). 페이지 토큰/ID는 env(SWARM56_FACEBOOK_TOKEN / _PAGE_ID).
토큰 코드/Git 미포함.
"""
from datetime import datetime, timezone

import requests

from .. import settings
from ..models import NormalizedRecord

API = "https://graph.facebook.com/v21.0"


def _parse(s: str) -> datetime:
    try:
        return datetime.strptime(s, "%Y-%m-%dT%H:%M:%S%z")
    except Exception:
        pass
    try:
        return datetime.fromisoformat((s or "").replace("Z", "+00:00"))
    except Exception:
        return datetime.now(timezone.utc)


def fetch() -> list[NormalizedRecord]:
    if not settings.FACEBOOK_TOKEN or not settings.FACEBOOK_PAGE_ID:
        print("  [FACEBOOK] 토큰/페이지ID 없음 — 스킵")
        return []
    try:
        r = requests.get(
            f"{API}/{settings.FACEBOOK_PAGE_ID}/posts",
            params={
                "fields": "id,message,created_time,permalink_url,full_picture",
                "access_token": settings.FACEBOOK_TOKEN,
                "limit": settings.MAX_PER_CHANNEL,
            },
            headers={"User-Agent": settings.USER_AGENT},
            timeout=settings.HTTP_TIMEOUT,
        )
        if r.status_code in (400, 401, 403):
            print(f"  [FACEBOOK] 인증 거부({r.status_code}) — 토큰/권한 확인")
            return []
        r.raise_for_status()
    except Exception as e:
        print(f"  [FACEBOOK] 실패: {e}")
        return []

    records: list[NormalizedRecord] = []
    for p in (r.json().get("data") or [])[: settings.MAX_PER_CHANNEL]:
        url = p.get("permalink_url") or ""
        if not url:
            continue
        msg = (p.get("message") or "").strip()
        title = (msg.splitlines()[0] if msg else "Facebook 게시물")[:80]
        records.append(
            NormalizedRecord(
                channel="FACEBOOK",
                title=title,
                original_url=url,
                published_at=_parse(p.get("created_time")),
                full_markdown=f"# {title}\n\n{msg}\n\n{url}\n",
                excerpt=(msg[:150] + "…") if len(msg) > 150 else msg,
                external_id=p.get("id"),
                thumbnail_remote_url=p.get("full_picture"),
            )
        )
    return records
