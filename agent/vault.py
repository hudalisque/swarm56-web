"""옵시디언 Vault(raw/<채널>/) = 단일 소스(메인 DB).

- 전문 md + 카드 파생용 frontmatter 기록(write_md). 본문 이미지는 images.process로 _assets에 받고 링크 치환됨.
- md 스캔/파싱(iter_vault, parse_frontmatter) → SQLite 카드는 여기서 파생(db.upsert_from_frontmatter).
파일명: YYYY-MM-DD_제목.md
"""
import re
from datetime import datetime
from pathlib import Path

FM_KEYS = (
    "title", "channel", "source", "url", "published",
    "synced_at", "content_hash", "external_id", "excerpt", "thumbnail",
)


def safe_filename(text: str) -> str:
    text = re.sub(r'[\\/:*?"<>|]', "", text or "")
    return text.strip()[:80]


def _esc(v) -> str:
    if v is None:
        return ""
    return (
        str(v).replace("\\", " ").replace('"', "'")
        .replace("\n", " ").replace("\r", " ").strip()
    )


def _target(vault_dir: str, channel: str, rec):
    sub = channel.lower()
    folder = Path(vault_dir) / "raw" / sub
    date_str = rec.published_at.strftime("%Y-%m-%d")
    fname = f"{date_str}_{safe_filename(rec.title)}.md"
    return folder, fname, f"raw/{sub}/{fname}"


def existing_hash(vault_dir: str, channel: str, rec):
    """같은 md가 있으면 content_hash 반환(없으면 None) — 재처리 판단용."""
    folder, fname, _ = _target(vault_dir, channel, rec)
    p = folder / fname
    if not p.exists():
        return None
    try:
        return parse_frontmatter(p.read_text(encoding="utf-8")).get("content_hash")
    except Exception:
        return None


def write_md(vault_dir, channel, rec, content_hash_val, body_markdown, thumbnail_rel, excerpt=None) -> str:
    """전문 md 작성. body_markdown=이미지 치환된 본문, thumbnail_rel=대표 이미지 상대경로(or None), excerpt=발췌."""
    folder, fname, relpath = _target(vault_dir, channel, rec)
    folder.mkdir(parents=True, exist_ok=True)
    fields = {
        "title": rec.title,
        "channel": channel,
        "source": channel.lower(),
        "url": rec.original_url,
        "published": rec.published_at.isoformat(),
        "synced_at": datetime.now().isoformat(timespec="seconds"),
        "content_hash": content_hash_val,
        "external_id": rec.external_id or "",
        "excerpt": excerpt or rec.excerpt or "",
        "thumbnail": thumbnail_rel or "",
    }
    front = (
        "---\n"
        + "".join(f'{k}: "{_esc(fields[k])}"\n' for k in FM_KEYS)
        + "---\n\n"
        + (body_markdown or "")
        + "\n"
    )
    (folder / fname).write_text(front, encoding="utf-8")
    return relpath


def parse_frontmatter(text: str) -> dict:
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.S)
    if not m:
        return {}
    fm = {}
    for line in m.group(1).splitlines():
        mm = re.match(r'^(\w+):\s*"(.*)"\s*$', line)
        if mm:
            fm[mm.group(1)] = mm.group(2)
    return fm


def iter_vault(vault_dir: str):
    """raw/**/*.md 전부 → [(relpath, frontmatter dict)]. _assets·url없음 제외."""
    root = Path(vault_dir)
    rawdir = root / "raw"
    out = []
    if not rawdir.exists():
        return out
    for p in sorted(rawdir.rglob("*.md")):
        if "_assets" in p.parts:
            continue
        try:
            fm = parse_frontmatter(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        if not fm.get("url"):
            continue
        out.append((p.relative_to(root).as_posix(), fm))
    return out
