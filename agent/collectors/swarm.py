"""Swarm(Foursquare) 수집기 — 사용자 체크인. v2 API users/self/checkins, OAuth user token.

토큰은 env(SWARM56_FOURSQUARE_TOKEN)에서만. 레거시 API라 응답 막힐 수 있음(그땐 수동 fallback).
"""
from datetime import datetime, timezone

import requests

from .. import settings
from ..models import NormalizedRecord

API = "https://api.foursquare.com/v2"


def _ts(sec) -> datetime:
    try:
        return datetime.fromtimestamp(int(sec), tz=timezone.utc)
    except Exception:
        return datetime.now(timezone.utc)


def fetch() -> list[NormalizedRecord]:
    if not settings.FOURSQUARE_TOKEN:
        print("  [SWARM] 토큰 없음 — 스킵")
        return []
    try:
        r = requests.get(
            f"{API}/users/self/checkins",
            params={
                "oauth_token": settings.FOURSQUARE_TOKEN,
                "v": "20240101",
                "limit": settings.MAX_PER_CHANNEL,
            },
            headers={"User-Agent": settings.USER_AGENT},
            timeout=settings.HTTP_TIMEOUT,
        )
        if r.status_code in (401, 403):
            print(f"  [SWARM] 인증 거부({r.status_code}) — 토큰/권한 확인")
            return []
        r.raise_for_status()
    except Exception as e:
        print(f"  [SWARM] 실패: {e}")
        return []

    items = (
        (((r.json().get("response") or {}).get("checkins") or {}).get("items")) or []
    )
    records: list[NormalizedRecord] = []
    for ci in items[: settings.MAX_PER_CHANNEL]:
        cid = ci.get("id")
        venue = ci.get("venue") or {}
        vname = venue.get("name") or "체크인"
        loc = venue.get("location") or {}
        locstr = ", ".join([x for x in [loc.get("city"), loc.get("country")] if x])
        shout = (ci.get("shout") or "").strip()
        url = ci.get("checkinShortUrl") or (f"https://www.swarmapp.com/c/{cid}" if cid else "")
        if not url:
            continue
        thumb = None
        photos = ((ci.get("photos") or {}).get("items")) or []
        if photos:
            p = photos[0]
            if p.get("prefix") and p.get("suffix"):
                thumb = f"{p['prefix']}300x300{p['suffix']}"
        excerpt = shout or (f"{vname}{(' · ' + locstr) if locstr else ''} 체크인")
        records.append(
            NormalizedRecord(
                channel="SWARM",
                title=vname,
                original_url=url,
                published_at=_ts(ci.get("createdAt")),
                full_markdown=f"# {vname}\n\n{shout}\n\n- 위치: {locstr}\n- {url}\n",
                excerpt=excerpt[:150],
                external_id=str(cid) if cid else None,
                thumbnail_remote_url=thumb,
            )
        )
    return records
