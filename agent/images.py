"""본문 이미지 → 볼트 `raw/<채널>/_assets/`에 다운로드 + md 링크를 로컬 상대경로로 치환.

- SSRF 차단(thumbnail._host_is_safe 재사용) · MIME allowlist · 크기 상한 · Pillow 재인코딩(sanitize)
- 파일명 = 콘텐츠 해시(.webp) → 중복 자동 제거
- 디스크 임계(서킷브레이커): 초과 시 신규 다운로드 중단(원격 링크 유지), 텍스트는 보존
- 실패 시 해당 이미지는 원격 링크 그대로 둠(파이프라인 안 멈춤)
"""
import hashlib
import io
import re
import shutil
from pathlib import Path
from urllib.parse import urlparse

import requests

from . import settings
from .thumbnail import _host_is_safe

try:
    from PIL import Image
    _HAS_PIL = True
except Exception:  # pragma: no cover
    _HAS_PIL = False

# markdown 이미지: ![alt](http...)
MD_IMG = re.compile(r"!\[([^\]]*)\]\((https?://[^)\s]+)\)")


def _disk_ok(path: str) -> bool:
    try:
        u = shutil.disk_usage(path)
        return (u.used / u.total) * 100 < settings.DISK_STOP_PERCENT
    except Exception:
        return True


def _download_one(url: str, assets_dir: Path, referer: str | None) -> str | None:
    if not _HAS_PIL:
        return None
    p = urlparse(url)
    if p.scheme not in ("http", "https") or not _host_is_safe(p.hostname):
        return None
    headers = {"User-Agent": settings.USER_AGENT}
    if referer:
        headers["Referer"] = referer  # 네이버 등 핫링크 우회
    try:
        r = requests.get(url, headers=headers, timeout=(5, 15), stream=True, allow_redirects=True)
        r.raise_for_status()
    except Exception:
        return None
    if not _host_is_safe(urlparse(r.url).hostname):  # 리다이렉트 후 재검증
        return None
    ctype = r.headers.get("Content-Type", "").split(";")[0].strip().lower()
    if ctype not in settings.THUMB_ALLOWED_MIME:
        return None
    data = b""
    for chunk in r.iter_content(8192):
        if not chunk:
            continue
        data += chunk
        if len(data) > settings.IMG_MAX_BYTES:
            return None
    try:
        Image.open(io.BytesIO(data)).verify()
        img = Image.open(io.BytesIO(data)).convert("RGB")
        if img.width > settings.IMG_MAX_WIDTH:
            ratio = settings.IMG_MAX_WIDTH / img.width
            img = img.resize((settings.IMG_MAX_WIDTH, max(1, int(img.height * ratio))))
        out = io.BytesIO()
        img.save(out, format="WEBP", quality=85)
        body = out.getvalue()
    except Exception:
        return None

    assets_dir.mkdir(parents=True, exist_ok=True)
    fname = hashlib.sha256(body).hexdigest() + ".webp"
    path = assets_dir / fname
    if not path.exists():
        tmp = path.with_suffix(".webp.tmp")
        tmp.write_bytes(body)
        tmp.replace(path)  # atomic
    return fname


def fetch_thumbnail(url: str | None, channel: str, vault_dir: str, referer: str | None = None) -> str | None:
    """단일 이미지(예: 영상 썸네일·IG media_url)를 _assets에 받아 상대경로 반환. 본문에 이미지 없을 때 대표용."""
    if not url or not _disk_ok(str(vault_dir)):
        return None
    assets_dir = Path(vault_dir) / "raw" / channel.lower() / "_assets"
    fn = _download_one(url, assets_dir, referer)
    return f"_assets/{fn}" if fn else None


def process(markdown: str, channel: str, vault_dir: str, referer: str | None = None):
    """본문 원격 이미지 → _assets 다운로드 + 링크 치환. 반환 (new_md, asset_rel_list, first_image_rel)."""
    sub = channel.lower()
    assets_dir = Path(vault_dir) / "raw" / sub / "_assets"
    assets: list[str] = []
    first: str | None = None
    disk_ok = _disk_ok(str(vault_dir))
    if not disk_ok:
        print(f"  [IMG] 디스크 임계({settings.DISK_STOP_PERCENT}%) 초과 — 이미지 다운로드 중단, 원격 링크 유지")

    def repl(m: re.Match) -> str:
        nonlocal first
        alt, url = m.group(1), m.group(2)
        if not disk_ok:
            return m.group(0)
        fn = _download_one(url, assets_dir, referer)
        if not fn:
            return m.group(0)  # 실패 → 원격 링크 유지
        rel = f"_assets/{fn}"
        assets.append(rel)
        if first is None:
            first = rel
        return f"![{alt}]({rel})"

    new_md = MD_IMG.sub(repl, markdown or "")
    return new_md, assets, first
