#!/usr/bin/env python3
"""
Regenerate exam-seat/js/exam-data.js from IMT's official seating-plan Excel file.

Usage:
    python scripts/generate_exam_data.py path/to/SeatingPlan.xlsx

What it does (matches the algorithm documented in README.md):
  1. Finds each exam block by matching a "Subject(s): ... Date: ... Time: ...
     Exam Hall: ..." header line (case-insensitive, tolerant of "Sub(s):" too),
     searched for across each row's concatenated cell text so it doesn't
     matter whether the sheet puts all four fields in one cell or spreads
     them across a row.
  2. Locates that block's seat-grid header row by content (a row where most
     non-empty cells are short column labels like A, B, C...), not by a fixed
     offset from the header line - grids don't all start the same number of
     rows down.
  3. Reads the roll numbers under each column into
     {roll: [[blockIndex, rowLabel, colLabel], ...]}.
  4. Cross-checks the parsed block count against a raw full-sheet scan for the
     header pattern. If they don't match, something was silently dropped and
     the script stops instead of writing a wrong file.

This script was (re)written from that spec rather than ported from the
original one-off run, since that script was never checked into the repo. Run
it against a real seating-plan file and sanity-check the result (block count,
a few known roll numbers) before trusting it - if IMT's sheet layout differs
from what's assumed here, this will need small adjustments, and the
cross-check in step 4 is designed to fail loudly rather than produce a
silently wrong exam-data.js.
"""
import json
import re
import sys
from datetime import date
from pathlib import Path

try:
    import openpyxl
except ImportError:
    sys.exit("openpyxl is required: pip install openpyxl")

HEADER_RE = re.compile(
    r"Sub(?:ject)?\(?s\)?\s*:\s*(?P<subject>.*?)\s*"
    r"Date\s*:\s*(?P<date>\d{1,2}[./]\d{1,2}[./]\d{2,4})\s*"
    r"Time\s*:\s*(?P<time>\d{1,2}:\d{2}\s*[AP]M)\s*"
    r"Exam\s*Hall\s*:\s*(?P<hall>\S+)",
    re.IGNORECASE,
)
# A grid header row: most non-empty cells look like short column labels
# (A, B, C... or AA, AB...), not real data.
COL_LABEL_RE = re.compile(r"^[A-Za-z]{1,2}$")
WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def row_text(ws, row_idx, max_col):
    cells = [ws.cell(row=row_idx, column=c).value for c in range(1, max_col + 1)]
    return " ".join(str(c).strip() for c in cells if c not in (None, ""))


def normalize_date(raw):
    """'25.09.2026' or '25/9/26' -> 'Friday, 25.09.2026' (weekday computed,
    never trusted from the sheet, so it's always correct regardless of
    whether the source text already included one)."""
    m = re.match(r"(\d{1,2})[./](\d{1,2})[./](\d{2,4})", raw.strip())
    if not m:
        return raw.strip()
    d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
    if y < 100:
        y += 2000
    weekday = WEEKDAYS[date(y, mo, d).weekday()]
    return "%s, %02d.%02d.%04d" % (weekday, d, mo, y)


def normalize_time(raw):
    m = re.match(r"(\d{1,2}):(\d{2})\s*([AP]M)", raw.strip(), re.IGNORECASE)
    if not m:
        return raw.strip()
    return "%d:%s %s" % (int(m.group(1)), m.group(2), m.group(3).upper())


def is_grid_header_row(ws, row_idx, max_col):
    cells = [ws.cell(row=row_idx, column=c).value for c in range(1, max_col + 1)]
    nonblank = [str(c).strip() for c in cells if c not in (None, "")]
    if len(nonblank) < 2:
        return False
    labelish = sum(1 for c in nonblank if COL_LABEL_RE.match(c))
    return labelish / len(nonblank) >= 0.6


def parse_sheet(ws, blocks, rolls):
    max_row, max_col = ws.max_row, ws.max_column
    header_rows = []
    for r in range(1, max_row + 1):
        text = row_text(ws, r, max_col)
        m = HEADER_RE.search(text)
        if m:
            header_rows.append((r, m))

    for i, (hrow, m) in enumerate(header_rows):
        next_header_row = header_rows[i + 1][0] if i + 1 < len(header_rows) else max_row + 1
        block_index = len(blocks)
        blocks.append([
            re.sub(r"\s+", " ", m.group("subject")).strip().rstrip(";").strip(),
            normalize_date(m.group("date")),
            normalize_time(m.group("time")),
            m.group("hall").strip(),
        ])

        # find the seat-grid header row below this block's header, before the next block
        grid_header_row = None
        for r in range(hrow + 1, next_header_row):
            if is_grid_header_row(ws, r, max_col):
                grid_header_row = r
                break
        if grid_header_row is None:
            continue  # no grid found for this block; block is still recorded

        col_labels = {}
        for c in range(1, max_col + 1):
            v = ws.cell(row=grid_header_row, column=c).value
            if v not in (None, "") and COL_LABEL_RE.match(str(v).strip()):
                col_labels[c] = str(v).strip().upper()

        row_label_col = min(col_labels.keys()) - 1 if col_labels else 1

        for r in range(grid_header_row + 1, next_header_row):
            row_label_val = ws.cell(row=r, column=row_label_col).value if row_label_col >= 1 else None
            row_label = str(row_label_val).strip() if row_label_val not in (None, "") else None
            any_roll_in_row = False
            for c, col_label in col_labels.items():
                v = ws.cell(row=r, column=c).value
                if v in (None, "", "-"):
                    continue
                roll = str(v).strip().upper()
                if not roll or roll in ("-", "X"):
                    continue
                any_roll_in_row = True
                rolls.setdefault(roll, []).append([block_index, row_label or "", col_label])
            if not any_roll_in_row and row_label is None:
                # fully blank row: the grid for this block has ended
                break

    return len(header_rows)


def main():
    if len(sys.argv) != 2:
        sys.exit("Usage: python scripts/generate_exam_data.py path/to/SeatingPlan.xlsx")
    src = Path(sys.argv[1])
    if not src.exists():
        sys.exit("File not found: %s" % src)

    wb = openpyxl.load_workbook(src, data_only=True)
    blocks, rolls = [], {}
    raw_header_count = 0
    for ws in wb.worksheets:
        raw_header_count += parse_sheet(ws, blocks, rolls)

    if raw_header_count != len(blocks):
        sys.exit(
            "Cross-check failed: found %d header lines but only parsed %d blocks. "
            "Stopping rather than writing a possibly-incomplete exam-data.js. "
            "Check the sheet layout against this script's assumptions." % (raw_header_count, len(blocks))
        )

    out_path = Path(__file__).resolve().parent.parent / "exam-seat" / "js" / "exam-data.js"
    payload = json.dumps({"blocks": blocks, "rolls": rolls}, ensure_ascii=False, separators=(",", ":"))
    out_path.write_text("window.EXAM_DATA = %s;\n" % payload, encoding="utf-8")

    total_seats = sum(len(v) for v in rolls.values())
    print("Wrote %s" % out_path)
    print("%d exam blocks, %d roll numbers, %d total seat entries" % (len(blocks), len(rolls), total_seats))


if __name__ == "__main__":
    main()
