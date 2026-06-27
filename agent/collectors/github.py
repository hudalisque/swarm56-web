"""GitHub 수집기 — 공개 레포지토리("남들이 GitHub를 봤을 때 보이는 것")를 카드로.

공식 REST API(GET /users/{user}/repos), 비인증(rate limit 60/h). fork/archived 제외, 최근 push 순.
"""
from datetime import datetime, timezone

import requests

from .. import settings
from ..models import NormalizedRecord

API = "https://api.github.com"
HEADERS = {
    "User-Agent": settings.USER_AGENT,
    "Accept": "application/vnd.github+json",
}


def _parse(s: str) -> datetime:
    try:
        return datetime.fromisoformat((s or "").replace("Z", "+00:00"))
    except Exception:
        return datetime.now(timezone.utc)


def fetch() -> list[NormalizedRecord]:
    resp = requests.get(
        f"{API}/users/{settings.GITHUB_USER}/repos",
        headers=HEADERS,
        params={"sort": "pushed", "direction": "desc", "per_page": 30, "type": "owner"},
        timeout=settings.HTTP_TIMEOUT,
    )
    resp.raise_for_status()
    repos = resp.json()

    records: list[NormalizedRecord] = []
    for r in repos:
        if r.get("fork") or r.get("archived") or r.get("private"):
            continue
        name = r.get("full_name") or r.get("name")
        url = r.get("html_url")
        if not name or not url:
            continue
        desc = (r.get("description") or "").strip()
        lang = r.get("language") or ""
        md = (
            f"# {name}\n\n{desc}\n\n"
            f"- Language: {lang}\n"
            f"- Stars: {r.get('stargazers_count', 0)}\n"
            f"- Updated: {r.get('pushed_at', '')}\n\n{url}\n"
        )
        records.append(
            NormalizedRecord(
                channel="GITHUB",
                title=name,
                original_url=url,
                published_at=_parse(r.get("pushed_at") or r.get("updated_at")),
                full_markdown=md,
                excerpt=desc or (f"{lang} 레포지토리" if lang else "GitHub 레포지토리"),
                external_id=str(r.get("id")) if r.get("id") is not None else None,
                thumbnail_remote_url=None,
            )
        )
        if len(records) >= settings.MAX_PER_CHANNEL:
            break
    return records
