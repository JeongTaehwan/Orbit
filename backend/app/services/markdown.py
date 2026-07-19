"""마크다운 원본에서 목록용 '순수 텍스트 미리보기'를 뽑아내는 유틸.

기록 목록에서 전문을 다 내려주면 무거우므로, 첫 의미 있는 한 줄을
마크다운 문법(제목·강조·링크·이미지·코드 등)을 제거해 짧게 보여준다.
DB 접근이 없는 순수 계산이라 services 계층에 둔다.
"""

import re

# 펜스 코드 블록(``` ... ```) 통째 제거 — 미리보기로는 부적합
_FENCE = re.compile(r"```.*?```", re.DOTALL)
# ![alt](url) → alt (이미지)
_IMAGE = re.compile(r"!\[([^\]]*)\]\([^)]*\)")
# [text](url) → text (링크)
_LINK = re.compile(r"\[([^\]]*)\]\([^)]*\)")
# 줄 맨 앞의 블록 마커: 제목(#), 인용(>), 목록(-, *, +, 1.)
_LINE_PREFIX = re.compile(r"^\s{0,3}(#{1,6}\s+|>\s?|[-*+]\s+|\d+\.\s+)")
# 인라인 강조/코드 기호 제거: * _ ~ ` (텍스트만 남김)
_INLINE_MARKS = re.compile(r"[*_~`]+")


def to_preview(content: str, limit: int = 80) -> str:
    """마크다운 원본 → 한 줄 순수 텍스트 미리보기(최대 limit 자, 초과 시 …)."""
    text = _FENCE.sub(" ", content)

    for raw_line in text.splitlines():
        line = _LINE_PREFIX.sub("", raw_line.strip())
        line = _IMAGE.sub(r"\1", line)
        line = _LINK.sub(r"\1", line)
        line = _INLINE_MARKS.sub("", line)
        line = line.strip()
        if line:
            return line[:limit] + "…" if len(line) > limit else line

    return ""
