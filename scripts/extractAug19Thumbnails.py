#!/usr/bin/env python3
"""Phase E thumbnail extraction for the Aug 19 batch (Business Industries,
Syntax Flow). Unlike the Aug 12 extractor, source markup is NOT uniform:
at least 3 different hero-section templates were found, and some wrap a
Brice/avatar headshot ahead of (or instead of) the real content hero inside
the same "hero" block. So instead of one fixed regex/class name, this scans
every embedded <img data:image ...> in the document, excludes anything that
looks like an avatar/author/creator/brand/footer photo by nearby class name
or alt text, and picks the largest remaining candidate by base64 payload
size (real hero photos are the biggest images on the page; avatar chips are
small). Does NOT modify source HTML. Not part of the app runtime."""
from __future__ import annotations

import base64
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
THUMB_WIDTH = 640
JPEG_QUALITY = 65

EXCLUDE_KEYWORDS = [
    "avatar", "author", "creator", "chip", "footer", "brand", "portrait", "logo",
]

IMG_PATTERN = re.compile(
    r'<img\b(?P<pre>[^>]{0,300}?)src="(?P<uri>data:image/[a-z]+;base64,[A-Za-z0-9+/=]+)"(?P<post>[^>]{0,300})>',
    re.S,
)
# Only the nearest STILL-OPEN wrapper matters (a closed </div> means whatever
# came before it is a sibling, not this img's parent) — a flat text window
# false-positives on unrelated preceding captions (e.g. a huge base64 blob's
# trailing "alt=\"Brice Gadou\"" sitting just before the next, unrelated img).
WRAPPER_PATTERN = re.compile(r'<div\b[^>]*\bclass="([^"]*)"[^>]*>|</div>')
WRAPPER_SCAN_WINDOW = 600


def nearest_open_wrapper_class(html: str, pos: int) -> str | None:
    window = html[max(0, pos - WRAPPER_SCAN_WINDOW):pos]
    matches = list(WRAPPER_PATTERN.finditer(window))
    if not matches:
        return None
    last = matches[-1]
    if last.group(0) == "</div>":
        return None
    return last.group(1)


def pick_hero_data_uri(html: str) -> str | None:
    best = None
    best_len = -1
    for m in IMG_PATTERN.finditer(html):
        own_tag_context = (m.group("pre") + m.group("post")).lower()
        wrapper_class = (nearest_open_wrapper_class(html, m.start()) or "").lower()
        combined = own_tag_context + " " + wrapper_class
        if any(kw in combined for kw in EXCLUDE_KEYWORDS):
            continue
        uri = m.group("uri")
        if len(uri) > best_len:
            best_len = len(uri)
            best = uri
    return best


def extract_one(html_path: Path, out_path: Path) -> tuple[bool, str]:
    html = html_path.read_text(encoding="utf-8")
    data_uri = pick_hero_data_uri(html)
    if not data_uri:
        return False, "no_non_avatar_candidate"

    header, b64_body = data_uri.split(",", 1)
    try:
        raw_bytes = base64.b64decode(b64_body)
    except Exception as e:
        return False, f"decode_failed:{e}"

    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp.write(raw_bytes)
        tmp_path = tmp.name

    out_path.parent.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(
        [
            "sips",
            "--resampleWidth", str(THUMB_WIDTH),
            "-s", "formatOptions", str(JPEG_QUALITY),
            tmp_path,
            "--out", str(out_path),
        ],
        capture_output=True,
        text=True,
    )
    Path(tmp_path).unlink(missing_ok=True)
    if result.returncode != 0:
        return False, f"sips_failed:{result.stderr.strip()[:200]}"
    return True, "ok"


def main() -> int:
    jobs: list[tuple[Path, Path]] = []

    biz_src = ROOT / "content-library" / "business-industries"
    biz_out = ROOT / "public" / "business-industries-thumbnails"
    for f in sorted(biz_src.glob("*.html")):
        jobs.append((f, biz_out / f"{f.stem}.jpg"))

    for lang in ("espanol", "francais", "portugues"):
        src = ROOT / "content-library" / f"syntax-flow-{lang}"
        out = ROOT / "public" / "syntax-flow-thumbnails" / lang
        for f in sorted(src.glob("*.html")):
            jobs.append((f, out / f"{f.stem}.jpg"))

    ok = 0
    skipped: list[tuple[str, str]] = []
    for html_path, out_path in jobs:
        success, reason = extract_one(html_path, out_path)
        if success:
            ok += 1
        else:
            skipped.append((str(html_path.relative_to(ROOT)), reason))

    print(f"Generated: {ok} / {len(jobs)}")
    if skipped:
        print("Skipped (falls back to gradient):")
        for rel, reason in skipped:
            print(f"  {rel}: {reason}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
