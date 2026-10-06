#!/usr/bin/env python3
"""
Regenerate a batch's roster from its "Student and Courses" sheet
(roll number -> name, major, minor, and the section taken in each course).

Usage:
    pip install xlrd openpyxl      # once (xlrd for .xls, openpyxl for .xlsx)
    python scripts/generate_roster_data.py 2027 "path/to/Student and Courses - Term -V.xls"

The batch argument picks data/batch-<batch>.json, the hand-edited per-term
catalog (course abbreviation -> full name). It's what lets this script turn
the sheet's full course names in the header row into the abbreviations the
weekly schedule uses.

Expected sheet layout (first sheet, header in the first row):
    Sl. | Roll No. | Student Name | Major | Minor | Total | <one column per course>
where each course cell is blank or the student's section letter (A, B, ...).

The result is saved as data/roster-<batch>.json and the site's roster bundle
(js/roster-data.js) is rebuilt from every batch's file - see site_data.py.
So regenerating one batch can never wipe another's roster or the TEST roll.

The script stops instead of writing a possibly-wrong file if:
  - a course column in the sheet isn't in the catalog,
  - a section letter is outside the catalog's section count for that course,
  - a student's "Total" doesn't match the number of courses read for them,
  - the same roll number appears twice.
"""
import re
import sys
from pathlib import Path

import site_data

FIXED_COLUMNS = {
    "sl": None, "sl no": None, "s no": None,
    "roll no": "roll", "roll number": "roll", "roll": "roll",
    "student name": "name", "name": "name",
    "major": "major", "minor": "minor", "total": "total",
}


def norm(s):
    return re.sub(r"[^a-z0-9]+", " ", str(s).lower()).strip()


def clean_roll(v):
    if isinstance(v, float) and v == int(v):
        v = int(v)
    return re.sub(r"[^A-Z0-9]", "", str(v).upper())


def read_rows(path):
    if path.suffix.lower() == ".xls":
        try:
            import xlrd
        except ImportError:
            sys.exit("xlrd is required for .xls input: pip install xlrd")
        ws = xlrd.open_workbook(str(path)).sheet_by_index(0)
        return [[ws.cell_value(r, c) for c in range(ws.ncols)] for r in range(ws.nrows)]
    try:
        import openpyxl
    except ImportError:
        sys.exit("openpyxl is required for .xlsx input: pip install openpyxl")
    ws = openpyxl.load_workbook(path, data_only=True).worksheets[0]
    return [["" if c.value is None else c.value for c in row] for row in ws.iter_rows()]


def main():
    if len(sys.argv) != 3:
        sys.exit('Usage: python scripts/generate_roster_data.py <batch> "path/to/Student and Courses.xls"')
    batch, src = sys.argv[1], Path(sys.argv[2])
    if not src.exists():
        sys.exit("File not found: %s" % src)
    catalog = site_data.load_catalog(batch)
    catalog_name = "data/batch-%s.json" % batch
    by_name = {norm(c["name"]): abbr for abbr, c in catalog["courses"].items()}

    rows = read_rows(src)
    if not rows:
        sys.exit("The sheet is empty.")

    columns, problems = {}, []
    for idx, cell in enumerate(rows[0]):
        key = norm(cell)
        if not key:
            continue
        if key in FIXED_COLUMNS:
            if FIXED_COLUMNS[key]:
                columns[idx] = ("field", FIXED_COLUMNS[key])
        elif key in by_name:
            columns[idx] = ("course", by_name[key])
        else:
            problems.append("Column %d (%r) is not a course in %s" % (idx + 1, cell, catalog_name))
    fields = {v[1] for v in columns.values() if v[0] == "field"}
    for needed in ("roll", "name"):
        if needed not in fields:
            problems.append("No %r column found in the header row" % needed)
    if problems:
        sys.exit("Stopping, nothing written:\n  " + "\n  ".join(problems))

    roster = {}
    for rnum, row in enumerate(rows[1:], start=2):
        rec, courses = {}, {}
        for idx, (kind, key) in columns.items():
            v = row[idx] if idx < len(row) else ""
            if kind == "field":
                rec[key] = v
            else:
                sec = str(v).strip().upper()
                if not sec:
                    continue
                limit = catalog["courses"][key]["sections"]
                if not re.fullmatch(r"[A-Z]", sec) or ord(sec) - 64 > limit:
                    problems.append("Row %d: section %r for %s (catalog has %d section(s))" % (rnum, v, key, limit))
                courses[key] = sec
        roll = clean_roll(rec.get("roll", ""))
        name = re.sub(r"\s+", " ", str(rec.get("name", ""))).strip()
        if not roll and not name:
            continue
        if not roll or not name:
            problems.append("Row %d: missing roll number or name" % rnum)
            continue
        if roll in roster:
            problems.append("Row %d: roll %s appears twice" % (rnum, roll))
        total = rec.get("total", "")
        if total not in ("", None) and int(float(total)) != len(courses):
            problems.append("Row %d (%s): Total says %s but %d course(s) read" % (rnum, roll, total, len(courses)))
        entry = {"name": name, "batch": catalog["batch"]}
        for k in ("major", "minor"):
            if str(rec.get(k, "")).strip():
                entry[k] = str(rec[k]).strip().upper()
        entry["courses"] = courses
        roster[roll] = entry

    if problems:
        sys.exit("Stopping, nothing written:\n  " + "\n  ".join(problems))

    site_data.save("roster", batch, roster)
    print("%d students, %d courses" % (len(roster), sum(1 for v in columns.values() if v[0] == "course")))
    empty = [r for r, e in roster.items() if not e["courses"]]
    if empty:
        print("Note: %d student(s) with no courses marked: %s" % (len(empty), ", ".join(empty)))


if __name__ == "__main__":
    main()
