#!/usr/bin/env python3
"""Checks that every citation anchor's quote appears on its stated page of
public/packet.pdf, using the same whitespace/case normalization as the
packet viewer's highlighter. Exits non-zero on any miss.

Run from the repo root:  python3 scripts/check-packet.py
Requires: pypdf
"""

import json
import os
import re
import sys

from pypdf import PdfReader

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def norm(s):
    return re.sub(r'\s+', ' ', s).strip().lower()


def main():
    index = json.load(open(os.path.join(ROOT, 'src', 'data', 'packetIndex.json')))
    reader = PdfReader(os.path.join(ROOT, 'public', 'packet.pdf'))
    failures = 0
    if len(reader.pages) != index['totalPages']:
        print(f"FAIL page count: PDF has {len(reader.pages)}, index says {index['totalPages']}")
        failures += 1
    for key, a in index['anchors'].items():
        text = norm(reader.pages[a['page'] - 1].extract_text())
        ok = norm(a['quote']) in text
        failures += not ok
        print(f"{'ok  ' if ok else 'FAIL'} {key:14} p.{a['page']:<4} {a['quote'][:70]}")
    print(f"\n{len(index['anchors']) - failures} of {len(index['anchors'])} anchors found")
    sys.exit(1 if failures else 0)


if __name__ == '__main__':
    main()
