"""썸네일 다운로드·검증·저장 (Python 전담 writer).

보안:
- 스킴 http(s)만, SSRF 차단(사설/loopback/link-local/reserved IP 거부, 리다이렉트 후 재검증)
- MIME allowlist(jpeg/png/webp/gif), 다운로드 크기 상한
- Pillow로 재인코딩(.webp) → 악성 페이로드 무력화 + 리사이즈(thumbnail화)
- atomic write, sha256 파일명
실패 시 None 반환(호출측이 DEFAULT 처리).
저장: <THUMBNAIL_DIR>/<channel>/<sha256>.webp, 반환 public 경로 /thumbnails/<channel>/<file>
"""
import hashlib
import io
import ipaddress
import socket
from pathlib import Path
from urllib.parse import urlparse

import requests

from . import settings

try:
    from PIL import Image
    _HAS_PIL = True
except Exception:  # pragma: no cover
    _HAS_PIL = False


def _host_is_safe(host: str | None) -> bool:
    if not host:
        return False
    try:
        infos = socket.getaddrinfo(host, None)
    except Exception:
        return False
    for info in infos:
        ip = info[4][0]
        try:
            addr = ipaddress.ip_address(ip)
        except ValueError:
            return False
        if (addr.is_private or addr.is_loopback or addr.is_link_local
                or addr.is_reserved or addr.is_multicast or addr.is_unspecified):
            return False
    return True


def save_from_url(remote_url: str | None, channel: str, thumb_dir: str,
                  referer: str | None = None) -> str | None:
    if not remote_url:
        return None
    if not _HAS_PIL:
        print("  [THUMB] Pillow 미설치 — 썸네일 스킵")
        return None

    parsed = urlparse(remote_url)
    if parsed.scheme not in ("http", "https"):
        return None
    if not _host_is_safe(parsed.hostname):
        print(f"  [THUMB] SSRF 차단: {parsed.hostname}")
        return None

    headers = {"User-Agent": settings.USER_AGENT}
    if referer:
        headers["Referer"] = referer  # 네이버 등 핫링크 차단 우회

    try:
        resp = requests.get(remote_url, headers=headers, timeout=(5, 10),
                            stream=True, allow_redirects=True)
        resp.raise_for_status()
    except Exception as e:
        print(f"  [THUMB] 다운로드 실패: {e}")
        return None

    # 리다이렉트 후 최종 호스트 SSRF 재검증
    if not _host_is_safe(urlparse(resp.url).hostname):
        print("  [THUMB] 리다이렉트 후 SSRF 차단")
        return None

    ctype = resp.headers.get("Content-Type", "").split(";")[0].strip().lower()
    if ctype not in settings.THUMB_ALLOWED_MIME:
        print(f"  [THUMB] 허용 안 되는 MIME: {ctype}")
        return None

    data = b""
    for chunk in resp.iter_content(8192):
        if not chunk:
            continue
        data += chunk
        if len(data) > settings.THUMB_MAX_DOWNLOAD_BYTES:
            print("  [THUMB] 크기 초과")
            return None

    # 재인코딩 + 리사이즈 (검증 겸 sanitize)
    try:
        Image.open(io.BytesIO(data)).verify()
        img = Image.open(io.BytesIO(data)).convert("RGB")
        if img.width > settings.THUMB_MAX_WIDTH:
            ratio = settings.THUMB_MAX_WIDTH / img.width
            img = img.resize((settings.THUMB_MAX_WIDTH, max(1, int(img.height * ratio))))
        out = io.BytesIO()
        img.save(out, format="WEBP", quality=80)
        out_bytes = out.getvalue()
    except Exception as e:
        print(f"  [THUMB] 이미지 디코드 실패: {e}")
        return None

    sub = channel.lower()
    folder = Path(thumb_dir) / sub
    folder.mkdir(parents=True, exist_ok=True)
    fname = hashlib.sha256(out_bytes).hexdigest() + ".webp"
    path = folder / fname
    tmp = folder / (fname + ".tmp")
    tmp.write_bytes(out_bytes)
    tmp.replace(path)  # atomic

    return f"/thumbnails/{sub}/{fname}"
