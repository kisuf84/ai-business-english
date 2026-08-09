#!/usr/bin/env python3
"""
One-time local extraction: pulls the unique hero photo already embedded in
each English Training lesson's HTML (as a base64 data URI inside
<div class="hero-image"> ... <img src="data:image/...">), decodes it, and
resizes/compresses it into a static catalog thumbnail.

Does NOT modify the source lesson HTML files. Not part of the app runtime —
run manually when lesson content changes.
"""
from __future__ import annotations

import base64
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LESSONS_DIR = ROOT / "english-training-content" / "lessons"
OUTPUT_DIR = ROOT / "public" / "english-training-thumbnails"
THUMB_WIDTH = 640
JPEG_QUALITY = 65

HERO_PATTERN = re.compile(
    r'<div class="hero-image">.*?<img src="(data:image/[a-z]+;base64,[A-Za-z0-9+/=]+)"',
    re.S,
)


def extract_hero_data_uri(html: str) -> str | None:
    match = HERO_PATTERN.search(html)
    return match.group(1) if match else None


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    html_files = sorted(LESSONS_DIR.glob("*.html"))

    if not html_files:
        print(f"No lesson HTML files found in {LESSONS_DIR}", file=sys.stderr)
        return 1

    ok, missing = [], []

    for html_path in html_files:
        slug = html_path.stem
        html = html_path.read_text(encoding="utf-8")
        data_uri = extract_hero_data_uri(html)

        if not data_uri:
            missing.append(slug)
            continue

        header, b64_body = data_uri.split(",", 1)
        raw_bytes = base64.b64decode(b64_body)

        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            tmp.write(raw_bytes)
            tmp_path = tmp.name

        out_path = OUTPUT_DIR / f"{slug}.jpg"
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
            print(f"FAILED sips for {slug}: {result.stderr}", file=sys.stderr)
            missing.append(slug)
            continue

        ok.append(slug)

    print(f"Generated: {len(ok)} / {len(html_files)}")
    if missing:
        print("Missing/failed:", missing)
    return 0 if not missing else 1


if __name__ == "__main__":
    raise SystemExit(main())
