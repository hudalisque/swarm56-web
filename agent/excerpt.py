"""카드 발췌 생성 — LLM 다중 provider 순차 → 전부 실패/키없음 시 truncation fallback.

- 발췌는 클립 때 1회(신규/변경분만). 홈피는 호출 안 함.
- provider 체인: openai → gemini → anthropic (env 키 있는 것만 시도).
- 전부 실패해도 truncation으로 항상 결과 반환(파이프라인 안 멈춤).
"""
import re

import requests

from . import settings

PROMPT = (
    "다음 글을 한국어로 2~3문장, 150자 이내로 핵심만 요약해줘. "
    "카드 미리보기용이니 머리말·군더더기 없이 요약문만 출력."
)


def _truncate(md: str, limit: int = 150) -> str:
    t = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", md or "")     # 이미지 제거
    t = re.sub(r"https?://\S+", " ", t)                      # URL 제거
    t = re.sub(r"[#*`>\[\]()!_~-]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return (t[:limit] + "…") if len(t) > limit else t


def _openai(text: str):
    key = settings.OPENAI_API_KEY
    if not key:
        return None
    r = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {key}"},
        json={
            "model": settings.OPENAI_MODEL,
            "messages": [{"role": "user", "content": f"{PROMPT}\n\n{text[:4000]}"}],
            "max_tokens": 220, "temperature": 0.3,
        },
        timeout=settings.HTTP_TIMEOUT,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


def _gemini(text: str):
    key = settings.GEMINI_API_KEY
    if not key:
        return None
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={key}"
    r = requests.post(
        url,
        json={"contents": [{"parts": [{"text": f"{PROMPT}\n\n{text[:4000]}"}]}]},
        timeout=settings.HTTP_TIMEOUT,
    )
    r.raise_for_status()
    return r.json()["candidates"][0]["content"]["parts"][0]["text"]


def _anthropic(text: str):
    key = settings.ANTHROPIC_API_KEY
    if not key:
        return None
    r = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={"x-api-key": key, "anthropic-version": "2023-06-01"},
        json={
            "model": settings.ANTHROPIC_MODEL,
            "max_tokens": 220,
            "messages": [{"role": "user", "content": f"{PROMPT}\n\n{text[:4000]}"}],
        },
        timeout=settings.HTTP_TIMEOUT,
    )
    r.raise_for_status()
    return r.json()["content"][0]["text"]


PROVIDERS = [("openai", _openai), ("gemini", _gemini), ("anthropic", _anthropic)]


def generate(full_markdown: str, fallback: str | None = None) -> str:
    """LLM 다중 provider → 실패 시 truncation. 항상 문자열 반환."""
    text = (full_markdown or "").strip()
    if not text:
        return (fallback or "")[: settings.EXCERPT_MAX]
    for name, fn in PROVIDERS:
        try:
            out = fn(text)
            if out and out.strip():
                return out.strip()[: settings.EXCERPT_MAX]
        except Exception as e:
            print(f"  [EXCERPT] {name} 실패: {e}")
            continue
    return (_truncate(text) or fallback or "")[: settings.EXCERPT_MAX]
