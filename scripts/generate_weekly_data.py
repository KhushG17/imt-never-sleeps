#!/usr/bin/env python3
"""
Load a week's schedule PDF into the site. This is the one command to run every week.

Usage:
    pip install pymupdf      # once
    python scripts/generate_weekly_data.py "path/to/Weekly Schedule ... .pdf"

The batch is read from the PDF itself (the "[2025-27]" in its title). To force
it, put the batch first:  python scripts/generate_weekly_data.py 2027 "file.pdf"

The batch picks data/batch-<batch>.json, the hand-edited per-term
catalog (course abbreviation -> name, area, section count). The catalog
only changes once a term; the PDF changes every week.

How the PDF is read
-------------------
The schedule is a ruled grid: one column per time slot, one band of rows per
day, one cell per class written as

    CWB-C(1)            <course abbreviation>-<section>(<session number>)
    PJ{C -201}          <faculty initials>{<room>}   (faculty is read past, not kept)

PyMuPDF's table finder recovers that grid directly. The first column holds
the day ("Mon, Oct. 05, 2026") only on a day's first row, so it's carried
down to the rows under it. The AREA column is ignored - a course's area comes
from the catalog. A day row with no classes but some text ("Thu | SSR
Visits") becomes a note on that day.

The result is saved as data/weekly-<batch>.json and the site's weekly bundle
(weekly-seat/js/weekly-data.js) is rebuilt from every batch's file - see
site_data.py. So one batch's weekly update can never touch another's.

The script stops instead of writing a possibly-wrong file if:
  - the number of classes parsed differs from a raw count of "ABC-A(1)"
    patterns in the PDF text (i.e. the grid was misread somewhere),
  - a class uses a course abbreviation or section the catalog doesn't have,
  - a time-slot header or a day label can't be understood,
  - the days found don't all fall in one Monday-Sunday week.
It only warns (and still writes) for session numbers that skip, and two different classes in one room at
the same time.
"""
import datetime as dt
import re
import sys
from pathlib import Path

import site_data

CLASS_RE = re.compile(r"([A-Z][A-Z0-9]*)\s*-\s*([A-Z])\s*\(\s*(\d+)\s*\)\s*([^{}]*)\{([^{}]*)\}")
RAW_CLASS_RE = re.compile(r"[A-Z][A-Z0-9]*\s*-\s*[A-Z]\s*\(\s*\d+\s*\)")
MONTHS = {m: i for i, m in enumerate("jan feb mar apr may jun jul aug sep oct nov dec".split(), 1)}
WEEKDAYS = {d: i for i, d in enumerate("mon tue wed thu fri sat sun".split())}


def parse_slot(text):
    """'11:45 am -01:00 pm' -> ('11:45', '13:00'). A missing start am/pm is
    taken from the end, e.g. '02:00 -03:15 pm'."""
    m = re.fullmatch(r"\s*(\d{1,2}):(\d{2})\s*(am|pm)?\s*-\s*(\d{1,2}):(\d{2})\s*(am|pm)\s*", text.lower())
    if not m:
        return None

    def to24(h, mi, mer):
        h = int(h) % 12 + (12 if mer == "pm" else 0)
        return h * 60 + int(mi)

    end = to24(m.group(4), m.group(5), m.group(6))
    start = to24(m.group(1), m.group(2), m.group(3) or m.group(6))
    if start >= end:
        return None
    return ("%02d:%02d" % divmod(start, 60), "%02d:%02d" % divmod(end, 60))


def parse_day(text):
    """'Mon, Oct. 05, 2026' -> date; 'Thu' -> weekday index; else None."""
    t = text.strip().lower()
    m = re.search(r"([a-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})", t)
    if m and m.group(1) in MONTHS:
        return dt.date(int(m.group(3)), MONTHS[m.group(1)], int(m.group(2)))
    if t[:3] in WEEKDAYS and len(t) <= 9:
        return WEEKDAYS[t[:3]]
    return None


def clean(s):
    return re.sub(r"\s+", " ", str(s or "")).strip()


def main():
    if len(sys.argv) not in (2, 3):
        sys.exit('Usage: python scripts/generate_weekly_data.py [batch] "path/to/Weekly Schedule.pdf"')
    batch, src = (sys.argv[1] if len(sys.argv) == 3 else None), Path(sys.argv[-1])
    if not src.exists():
        sys.exit("File not found: %s" % src)
    try:
        import pymupdf
    except ImportError:
        sys.exit("pymupdf is required: pip install pymupdf")

    doc = pymupdf.open(str(src))
    raw_text = "\n".join(page.get_text() for page in doc)
    if batch is None:
        batch = site_data.detect_batch(raw_text)
    catalog = site_data.load_catalog(batch)
    catalog_name = "data/batch-%s.json" % batch
    raw_count = len(RAW_CLASS_RE.findall(raw_text))

    slots = None        # [(start, end)] in column order
    slot_cols = None    # column index of each slot within a table row
    classes = []        # (day_key, slot_idx, abbr, section, session, faculty, room)
    notes = {}          # day_key -> text
    problems, warnings = [], []
    day = None
    for page in doc:
        for table in page.find_tables().tables:
            for row in table.extract():
                cells = [clean(c) for c in row]
                parsed = [parse_slot(c) for c in cells]
                if sum(1 for p in parsed if p) >= 3:
                    cols = [i for i, p in enumerate(parsed) if p]
                    found = [parsed[i] for i in cols]
                    bad = [cells[i] for i in range(cols[0], len(cells)) if cells[i] and not parsed[i]]
                    if bad:
                        problems.append("Unreadable time-slot header(s): %s" % bad)
                    if slots is not None and found != slots:
                        problems.append("Time slots differ between pages: %s vs %s" % (slots, found))
                    slots, slot_cols = found, cols
                    continue
                if slots is None:
                    continue  # title rows above the first header
                if cells[0]:
                    day = parse_day(cells[0])
                    if day is None:
                        problems.append("Unreadable day label: %r" % cells[0])
                        continue
                if day is None:
                    continue
                row_classes = 0
                for slot_idx, col in enumerate(slot_cols):
                    text = cells[col] if col < len(cells) else ""
                    for m in CLASS_RE.finditer(text):
                        abbr, sec, num = m.group(1), m.group(2), int(m.group(3))
                        fac = re.sub(r"\s+", "", m.group(4))
                        room = re.sub(r"\s*-\s*", "-", clean(m.group(5)))
                        classes.append((day, slot_idx, abbr, sec, num, fac, room))
                        row_classes += 1
                if not row_classes:
                    # e.g. "Thu | SSR Visits": text outside any class pattern
                    extra = " ".join(c for c in cells[1:] if c and c.upper() not in area_labels(catalog))
                    if extra:
                        notes[day] = (notes.get(day, "") + " " + extra).strip()

    if slots is None:
        sys.exit("Stopping, nothing written: no time-slot header row found in the PDF.")

    # Resolve weekday-only labels ("Thu") against the dated days of the week.
    dated = sorted({d for d in [c[0] for c in classes] + list(notes) if isinstance(d, dt.date)})
    if not dated:
        sys.exit("Stopping, nothing written: no dated day labels found.")
    monday = dated[0] - dt.timedelta(days=dated[0].weekday())
    if any((d - monday).days > 6 for d in dated):
        problems.append("Days span more than one Monday-Sunday week: %s to %s" % (dated[0], dated[-1]))

    def resolve(d):
        return d if isinstance(d, dt.date) else monday + dt.timedelta(days=d)

    classes = [(resolve(c[0]),) + c[1:] for c in classes]
    notes = {resolve(k): v for k, v in notes.items()}

    if len(classes) != raw_count:
        problems.append("Cross-check failed: PDF text has %d class entries but %d were parsed from the grid."
                        % (raw_count, len(classes)))
    for d, s, abbr, sec, num, fac, room in classes:
        course = catalog["courses"].get(abbr)
        where = "%s slot %s" % (d, slots[s][0])
        if not course:
            problems.append("%s: course %r is not in %s" % (where, abbr, catalog_name))
        elif ord(sec) - 64 > course["sections"]:
            problems.append("%s: %s-%s but the catalog has %d section(s)" % (where, abbr, sec, course["sections"]))
    if problems:
        sys.exit("Stopping, nothing written:\n  " + "\n  ".join(dict.fromkeys(problems)))

    classes.sort(key=lambda c: (c[0], c[1], c[2], c[3]))
    by_stream, by_room = {}, {}
    for d, s, abbr, sec, num, fac, room in classes:
        by_stream.setdefault((abbr, sec), []).append(num)
        by_room.setdefault((d, s, room), set()).add("%s-%s" % (abbr, sec))
    for (abbr, sec), nums in sorted(by_stream.items()):
        if nums != list(range(nums[0], nums[0] + len(nums))):
            warnings.append("%s-%s session numbers run %s - expected consecutive." % (abbr, sec, nums))
    for (d, s, room), who in sorted(by_room.items()):
        if len(who) > 1:
            warnings.append("%s %s: %s all in room %s." % (d, slots[s][0], ", ".join(sorted(who)), room))

    m = re.search(r"Week\s*-?\s*(\d+)", raw_text, re.I)
    days = []
    for i in range(7):
        d = monday + dt.timedelta(days=i)
        entry = {"date": d.isoformat()}
        if d in notes:
            entry["note"] = notes[d]
        days.append(entry)
    used = {c[2] for c in classes}
    data = {
        "batch": catalog["batch"],
        "label": catalog["label"],
        "term": catalog["term"],
        "week": {"number": int(m.group(1)) if m else None,
                 "start": monday.isoformat(),
                 "end": (monday + dt.timedelta(days=6)).isoformat()},
        "slots": [list(s) for s in slots],
        "days": days,
        "courses": {k: {"name": v["name"], "area": v["area"]} for k, v in catalog["courses"].items()},
        # [dayIndex (0 = Monday), slotIndex, course, section, session no., room]
        "sessions": [[(c[0] - monday).days, c[1], c[2], c[3], c[4], c[6]] for c in classes],
    }

    site_data.save("weekly", batch, data)
    print("Week %s, %s to %s: %d classes across %d courses"
          % (data["week"]["number"], data["week"]["start"], data["week"]["end"], len(classes), len(used)))
    for d in days:
        if "note" in d:
            print("Note on %s: %s" % (d["date"], d["note"]))
    idle = sorted(set(catalog["courses"]) - used)
    if idle:
        print("No classes this week for: %s" % ", ".join(idle))
    for w in dict.fromkeys(warnings):
        print("WARNING: %s" % w)


def area_labels(catalog):
    return {c["area"] for c in catalog["courses"].values()} | {"AREA"}


if __name__ == "__main__":
    main()
