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
    "SWARM56_NOTION_DATABASE_ID", "38d6855569978076822bd6a41125b90a"  # v5 전용 클린 DB
)
NOTION_TOKEN = os.environ.get("SWARM56_NOTION_TOKEN", "")
FOURSQUARE_TOKEN = os.environ.get("SWARM56_FOURSQUARE_TOKEN", "")
INSTAGRAM_TOKEN = os.environ.get("SWARM56_INSTAGRAM_TOKEN", "")
FACEBOOK_TOKEN = os.environ.get("SWARM56_FACEBOOK_TOKEN", "")
FACEBOOK_PAGE_ID = os.environ.get("SWARM56_FACEBOOK_PAGE_ID", "")
# IG 장기 토큰(60일)은 매 실행 시 refresh해 이 파일에 갱신 저장(env 토큰은 최초 seed).
# 서버에선 ubuntu 쓰기 가능 경로로 override: SWARM56_IG_TOKEN_FILE=/var/lib/swarm56/ig_token
IG_TOKEN_FILE = os.environ.get(
    "SWARM56_IG_TOKEN_FILE", str(PROJECT_ROOT / ".local-data" / "ig_token")
)

# R3 vertical slice: 채널당 처리 상한 (네트워크/비용 보호)
MAX_PER_CHANNEL = int(os.environ.get("SWARM56_MAX_PER_CHANNEL", "5"))

# 썸네일 (R4)
THUMBNAIL_DIR = os.environ.get(
    "SWARM56_THUMBNAIL_DIR", str(PROJECT_ROOT / ".local-data" / "thumbnails")
)
THUMB_MAX_WIDTH = 640
THUMB_ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/gif"}
THUMB_MAX_DOWNLOAD_BYTES = 8_000_000  # 8MB 원본 상한

# 본문 이미지 (볼트 raw/<채널>/_assets/) — v5
IMG_MAX_WIDTH = 1280            # 본문 이미지 최대 폭(개인 규모·고화질 없음 → 넉넉)
IMG_MAX_BYTES = 8_000_000       # 1장 다운로드 상한(안전망)
DISK_STOP_PERCENT = 90          # 디스크 사용률 임계 — 초과 시 신규 이미지 다운로드 중단

HTTP_TIMEOUT = 15
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)
