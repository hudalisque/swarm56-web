"""swarm56 클리핑 에이전트 설정.

경로는 환경변수로 오버라이드 가능. 기본값은 로컬 개발 기준.
- DB_PATH: Prisma SQLite (FeedCard 카드 캐시) — Prisma가 만든 dev.db
- VAULT_DIR: 옵시디언 볼트(로컬 스탠드인). 서버 배포 시 실제 볼트 경로로 교체.
"""
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent  # homepage_project/

DB_PATH = os.environ.get(
    "SWARM56_DB_PATH",
    str(PROJECT_ROOT / "personal-brand-hub" / "prisma" / "dev.db"),
)
VAULT_DIR = os.environ.get(
    "SWARM56_VAULT_DIR", str(PROJECT_ROOT / ".local-data" / "vault")
)

NAVER_BLOG_ID = os.environ.get("SWARM56_NAVER_BLOG_ID", "acepetra")
GITHUB_USER = os.environ.get("SWARM56_GITHUB_USER", "hudalisque")
YOUTUBE_CHANNEL = os.environ.get("SWARM56_YOUTUBE_CHANNEL", "@jongsukwon1497")
# Notion DB id는 비밀 아님(기본값 OK). 토큰은 비밀 → env로만(코드/Git 금지).
NOTION_DATABASE_ID = os.environ.get(
    "SWARM56_NOTION_DATABASE_ID", "f75cf5da3cbb4823bbe642a199a6f462"
)
NOTION_TOKEN = os.environ.get("SWARM56_NOTION_TOKEN", "")
FOURSQUARE_TOKEN = os.environ.get("SWARM56_FOURSQUARE_TOKEN", "")

# R3 vertical slice: 채널당 처리 상한 (네트워크/비용 보호)
MAX_PER_CHANNEL = int(os.environ.get("SWARM56_MAX_PER_CHANNEL", "5"))

# 썸네일 (R4)
THUMBNAIL_DIR = os.environ.get(
    "SWARM56_THUMBNAIL_DIR", str(PROJECT_ROOT / ".local-data" / "thumbnails")
)
THUMB_MAX_WIDTH = 640
THUMB_ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/gif"}
THUMB_MAX_DOWNLOAD_BYTES = 8_000_000  # 8MB 원본 상한

HTTP_TIMEOUT = 15
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)
