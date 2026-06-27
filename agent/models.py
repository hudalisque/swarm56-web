from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass(frozen=True)
class NormalizedRecord:
    """채널 수집기가 반환하는 정규화 레코드."""
    channel: str            # NAVER_BLOG 등 (대문자 enum)
    title: str
    original_url: str       # 1차 dedup 키 + 카드 클릭 대상
    published_at: datetime
    full_markdown: str      # 전문 (옵시디언 raw/ md 본문)
    excerpt: Optional[str] = None          # 카드용 발췌
    external_id: Optional[str] = None      # 플랫폼 native id (보조 dedup)
    thumbnail_remote_url: Optional[str] = None  # R4에서 다운로드
