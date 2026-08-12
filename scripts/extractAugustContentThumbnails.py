#!/usr/bin/env python3
"""
One-time local extraction for the August content-expansion libraries that
render catalog cards (Situational English, Listening Training, Reading
Training, Gossip English). Bilingual Compendium, Lexipro, Lexica, and Biz
Compendium have no catalog page (children/nav links open their reader
directly per the approved Phase C routing), so no thumbnail is ever
displayed for them and none is generated here.

Same extraction approach as scripts/extractEnglishTrainingThumbnails.py:
pulls the hero photo already embedded in each lesson's HTML (as a base64
data URI inside <div class="hero-image"> ... <img src="data:image/...">),
decodes it, and resizes/compresses it into a static catalog thumbnail.

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
THUMB_WIDTH = 640
JPEG_QUALITY = 65

LIBRARIES = [
    ("content-library/situational-english", "public/situational-english-thumbnails"),
    ("content-library/listening-training", "public/listening-training-thumbnails"),
    ("content-library/reading-training", "public/reading-training-thumbnails"),
    ("content-library/gossip-english", "public/gossip-english-thumbnails"),
]

HERO_PATTERN = re.compile(
    r'<div class="hero-image">.*?<img src="(data:image/[a-z]+;base64,[A-Za-z0-9+/=]+)"',
    re.S,
)


def extract_hero_data_uri(html: str) -> str | None:
    match = HERO_PATTERN.search(html)
    return match.group(1) if match else None


def main() -> int:
    ok_total = 0
    file_total = 0
    missing: list[str] = []

    for src_rel, out_rel in LIBRARIES:
        src_dir = ROOT / src_rel
        out_dir = ROOT / out_rel
        out_dir.mkdir(parents=True, exist_ok=True)

        html_files = sorted(src_dir.glob("*.html"))
        file_total += len(html_files)

        for html_path in html_files:
            slug = html_path.stem
            html = html_path.read_text(encoding="utf-8")
            data_uri = extract_hero_data_uri(html)

            if not data_uri:
                missing.append(f"{src_rel}/{slug}")
                continue

            header, b64_body = data_uri.split(",", 1)
            raw_bytes = base64.b64decode(b64_body)

            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
                tmp.write(raw_bytes)
                tmp_path = tmp.name

            out_path = out_dir / f"{slug}.jpg"
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
                print(f"FAILED sips for {src_rel}/{slug}: {result.stderr}", file=sys.stderr)
                missing.append(f"{src_rel}/{slug}")
                continue

            ok_total += 1

    print(f"Generated: {ok_total} / {file_total}")
    if missing:
        print("Missing/failed:", missing)
    return 0 if not missing else 1


if __name__ == "__main__":
    raise SystemExit(main())
