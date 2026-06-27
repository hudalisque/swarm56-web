"""네이버 블로그 수집기 (naverblog_clipper.py 로직 이식 — 원본 미수정).

RSS로 글 목록 → 모바일 본문 파싱(iframe 우회) → HTML→Markdown → NormalizedRecord.
원본: D:/Agent_Workspace/Claude/script/naverblog_clipper.py
"""
import re
import xml.etree.ElementTree as ET
from datetime import datetime
from email.utils import parsedate_to_datetime

import requests
from bs4 import BeautifulSoup
import markdownify

from .. import settings
from ..models import NormalizedRecord

RSS_URL = f"https://rss.blog.naver.com/{settings.NAVER_BLOG_ID}.xml"
HEADERS = {"User-Agent": settings.USER_AGENT}


def _pc_to_mobile(url: str) -> str:
    url = url.strip()
    if "m.blog.naver.com" in url:
        return url
    m = re.search(r"blogId=([^&]+)&logNo=(\d+)", url)
    if m:
        return f"https://m.blog.naver.com/{m.group(1)}/{m.group(2)}"
    return url.replace("https://blog.naver.com/", "https://m.blog.naver.com/")


def _external_id(url: str):
    m = re.search(r"logNo=(\d+)", url) or re.search(r"/(\d{6,})", url)
    return m.group(1) if m else None


def _parse_pub(pub: str) -> datetime:
    try:
        return parsedate_to_datetime(pub)
    except Exception:
        return datetime.now()


def _clean_md(md: str) -> str:
    md = re.sub(r'\*\*\\\*\\\*(.+?)\\\*\\\*\*\*', r'**\1**', md)
    md = re.sub(r'^\*\*-{3,}\*\*$', '---', md, flags=re.MULTILINE)
    md = re.sub(r'^\*\*(#{1,6} .+?)\*\*$', r'\1', md, flags=re.MULTILINE)
    md = re.sub(r'^\\\* ', '- ', md, flags=re.MULTILINE)
    md = re.sub(r'\n{3,}', '\n\n', md)
    return md.strip()


def _fetch_body(url: str):
    mobile = _pc_to_mobile(url)
    resp = requests.get(mobile, headers=HEADERS, timeout=settings.HTTP_TIMEOUT)
    resp.raise_for_status()
    resp.encoding = "utf-8"
    soup = BeautifulSoup(resp.text, "html.parser")

    title_tag = (
        soup.select_one(".se-title-text")
        or soup.select_one(".pcol1")
        or soup.select_one("h3.tit_h3")
        or soup.select_one("title")
    )
    title = title_tag.get_text(strip=True) if title_tag else ""

    body_tag = (
        soup.select_one(".se-main-container")
        or soup.select_one("#postViewArea")
        or soup.select_one(".post-view")
        or soup.select_one("div.se_component_wrap")
    )
    thumb = None
    if body_tag:
        for img in body_tag.find_all("img"):
            src = img.get("data-lazy-src") or img.get("src")
            if src and src.startswith("http"):
                thumb = src
                break
    body_html = str(body_tag) if body_tag else None
    return title, body_html, thumb


def _excerpt(md: str, limit: int = 150) -> str:
    text = re.sub(r'[#*`>\-\[\]()!]', ' ', md)
    text = re.sub(r'\s+', ' ', text).strip()
    return (text[:limit] + "…") if len(text) > limit else text


def fetch() -> list[NormalizedRecord]:
    resp = requests.get(RSS_URL, headers=HEADERS, timeout=settings.HTTP_TIMEOUT)
    resp.raise_for_status()
    root = ET.fromstring(resp.content)
    items = root.findall(".//item")[: settings.MAX_PER_CHANNEL]

    records: list[NormalizedRecord] = []
    for item in items:
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pub = (item.findtext("pubDate") or "").strip()
        if not title or not link:
            continue
        try:
            fetched_title, body_html, thumb = _fetch_body(link)
        except Exception as e:
            print(f"  [WARN] 본문 실패 {link}: {e}")
            continue
        if not body_html:
            print(f"  [WARN] 본문 없음, 건너뜀: {link}")
            continue
        md = _clean_md(markdownify.markdownify(body_html, heading_style="ATX", bullets="-", strip=["script", "style"]))
        records.append(
            NormalizedRecord(
                channel="NAVER_BLOG",
                title=title or fetched_title or "untitled",
                original_url=link,
                published_at=_parse_pub(pub),
                full_markdown=md,
                excerpt=_excerpt(md),
                external_id=_external_id(link),
                thumbnail_remote_url=thumb,
            )
        )
    return records
