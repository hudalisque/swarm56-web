"""옵시디언 Vault(raw/<채널>/) 에 전문 md 작성.

frontmatter: title/source/url/published/synced_at/content_hash
파일명: YYYY-MM-DD_제목.md (제목 정규화)
반환: DB vaultPath용 상대경로 (raw/<채널>/<파일>)
"""
import re
from datetime import datetime
from pathlib import Path


def safe_filename(text: str) -> str:
    text = re.sub(r'[\\/:*?"<>|]', "", text)
    return text.strip()[:80]


def write_md(vault_dir: str, channel: str, rec, content_hash_val: str) -> str:
    sub = channel.lower()
    folder = Path(vault_dir) / "raw" / sub
    folder.mkdir(parents=True, exist_ok=True)

    date_str = rec.published_at.strftime("%Y-%m-%d")
    fname = f"{date_str}_{safe_filename(rec.title)}.md"
    path = folder / fname

    synced_at = datetime.now().isoformat(timespec="seconds")
    front = (
        "---\n"
        f'title: "{rec.title}"\n'
        f'source: "{sub}"\n'
        f'url: "{rec.original_url}"\n'
        f'published: "{rec.published_at.isoformat()}"\n'
        f'synced_at: "{synced_at}"\n'
        f'content_hash: "{content_hash_val}"\n'
        "---\n\n"
        f"{rec.full_markdown}\n"
    )
    path.write_text(front, encoding="utf-8")

    return f"raw/{sub}/{fname}"
