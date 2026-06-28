"""Instagram 수집기 — Instagram API with Instagram Login (graph.instagram.com/me/media).

비즈니스/크리에이터 계정 + Instagram Login 액세스 토큰 필요(env SWARM56_INSTAGRAM_TOKEN).
토큰은 코드/Git 미포함. Basic Display API는 2024.12 종료 → 이 엔드포인트가 후속.
"""
import os
from datetime import datetime, timezone

import requests

from .. import settings
from ..models import NormalizedRecord

API = "https://graph.instagram.com"


def _load_token() -> str:
    """갱신 저장된 토큰 우선, 없으면 env seed 토큰."""
    p = settings.IG_TOKEN_FILE
    try:
        if p and os.path.exists(p):
            t = open(p, encoding="utf-8").read().strip()
            if t:
                return t
    except Exception:
        pass
    return settings.INSTAGRAM_TOKEN


def _refresh_and_store(token: str) -> str:
    """장기 토큰 refresh(60일 연장) 후 파일에 저장. 실패 시 기존 토큰 유지(24h 미만이면 정상 실패)."""
    try:
        r = requests.get(
            f"{API}/refresh_access_token",
            params={"grant_type": "ig_refresh_token", "access_token": token},
            headers={"User-Agent": settings.USER_AGENT},
            timeout=settings.HTTP_TIMEOUT,
        )
        if r.ok:
            new = (r.json() or {}).get("access_token")
            if new:
                p = settings.IG_TOKEN_FILE
                os.makedirs(os.path.dirname(p), exist_ok=True)
                with open(p, "w", encoding="utf-8") as f:
                    f.write(new)
                print("  [INSTAGRAM] 토큰 refresh 성공 (60일 연장)")
                return new
        else:
            print(f"  [INSTAGRAM] 토큰 refresh 스킵({r.status_code}) — 기존 토큰 유지")
    except Exception as e:
        print(f"  [INSTAGRAM] 토큰 refresh 실패: {e} — 기존 토큰 유지")
    return token


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
    token = _load_token()
    if not token:
        print("  [INSTAGRAM] 토큰 없음 — 스킵")
        return []
    token = _refresh_and_store(token)
    try:
        r = requests.get(
            f"{API}/me/media",
            params={
                "fields": "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp",
                "access_token": token,
                "limit": settings.MAX_PER_CHANNEL,
            },
            headers={"User-Agent": settings.USER_AGENT},
            timeout=settings.HTTP_TIMEOUT,
        )
        if r.status_code in (400, 401, 403):
            print(f"  [INSTAGRAM] 인증 거부({r.status_code}) — 토큰/권한 확인")
            return []
        r.raise_for_status()
    except Exception as e:
        print(f"  [INSTAGRAM] 실패: {e}")
        return []

    records: list[NormalizedRecord] = []
    for m in (r.json().get("data") or [])[: settings.MAX_PER_CHANNEL]:
        permalink = m.get("permalink") or ""
        if not permalink:
            continue
        cap = (m.get("caption") or "").strip()
        title = (cap.splitlines()[0] if cap else "Instagram 게시물")[:80]
        thumb = m.get("thumbnail_url") if m.get("media_type") == "VIDEO" else m.get("media_url")
        records.append(
            NormalizedRecord(
                channel="INSTAGRAM",
                title=title,
                original_url=permalink,
                published_at=_parse(m.get("timestamp")),
                full_markdown=f"# {title}\n\n{cap}\n\n{permalink}\n",
                excerpt=(cap[:150] + "…") if len(cap) > 150 else cap,
                external_id=m.get("id"),
                thumbnail_remote_url=thumb,
            )
        )
    return records
