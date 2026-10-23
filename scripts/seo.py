"""Search and answer-engine pages: what a crawler (or an AI assistant that does not run scripts) reads.

Run by scripts/update.py after every data change (and by hand: python scripts/seo.py).
It rewrites, in the public pages, only what sits between the markers

    <!--seo:head-->  ...  <!--/seo:head-->      canonical, social cards, structured data (JSON-LD)
    <!--seo:about--> ...  <!--/seo:about-->     the visible "about / answers / questions" block
    <!--seo:busfallback--> ... <!--/seo:busfallback-->   the bus timetable as plain tables
    <!--seo:mess-->  ...  <!--/seo:mess-->      the mess menu, day by day (mess-menu page)

plus each page's <title>, meta description and <html lang>, and it writes sitemap.xml.
Everything is built from files already in the repository (the bundled data in js/ and
weekly-seat/js), so it also runs in the GitHub Action that has no "all files" folder.

The about block is wrapped in <noscript>: a crawler or AI assistant that runs no scripts reads it,
a visitor never sees it (so the pages look exactly as they did). It carries no FAQPage markup,
because Google asks that marked-up questions be visible. A page's facts (bus times, mess timings,
the weeks on file) come from the data, so they stay current.

"lastmod" in the sitemap and "dateModified" in the structured data only move when the
schedules, bus times or mess menu really change (data/master/seo-state.json keeps a
fingerprint), not on every build.
"""
import datetime as dt
import hashlib
import html
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://imtneversleeps.com"
NAME = "IMT Never Sleeps"
OG_IMAGE = SITE + "/assets/og-image.png"
IST = dt.timezone(dt.timedelta(hours=5, minutes=30))
FORM = "https://forms.gle/y2CWo8Nq7o2GqytcA"
LINKEDIN = "https://www.linkedin.com/in/khushgoyal17/"
MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
GROUP_NAME = {"core": "PGDM", "bfs": "PGDM (BFS)", "dcp": "PGDM (DCP)"}

esc = html.escape


# ------------------------------------------------------------------ reading the bundled data
def js_json(path, var):
    text = (ROOT / path).read_text(encoding="utf-8")
    start = text.index("window.%s = " % var) + len("window.%s = " % var)
    return json.loads(text[start:text.rindex(";")])


def read_bus():
    """js/bus-data.js is hand-edited JavaScript (unquoted keys), so it is read with patterns."""
    text = (ROOT / "js" / "bus-data.js").read_text(encoding="utf-8")
    times = lambda block: re.findall(r'"(\d\d:\d\d)"', block)
    stops = re.search(r'stops:\s*\{\s*a:\s*"([^"]+)",\s*b:\s*"([^"]+)"', text)
    shifts = []
    for m in re.finditer(r'name:\s*"([^"]+)",\s*fromA:\s*\[(.*?)\],\s*fromB:\s*\[(.*?)\]', text, re.S):
        shifts.append({"name": m.group(1), "fromA": times(m.group(2)), "fromB": times(m.group(3))})
    updated = re.search(r'updated:\s*"([\d-]+)"', text)
    return {"a": stops.group(1), "b": stops.group(2), "shifts": shifts, "updated": updated.group(1) if updated else ""}


def clock(hhmm):
    h, m = (int(x) for x in hhmm.split(":"))
    return "%d:%02d %s" % (h % 12 or 12, m, "AM" if h < 12 else "PM")


def long_date(iso):
    y, m, d = (int(x) for x in iso.split("-"))
    return "%d %s %d" % (d, MONTHS[m], y)


def week_range(start, end):
    ys, ms, ds = (int(x) for x in start.split("-"))
    ye, me, de = (int(x) for x in end.split("-"))
    left = "%d %s" % (ds, MONTHS[ms]) if ms != me or ys != ye else "%d" % ds
    return "%s to %d %s %d" % (left, de, MONTHS[me], ye)


def schedules_on_file():
    """The newest week of every group on file, for the list on the home page."""
    weekly = js_json("weekly-seat/js/weekly-data.js", "WEEKLY_DATA")
    site = js_json("js/site-data.js", "SITE_DATA")
    rows = []
    for key in sorted(weekly):
        weeks = weekly[key]
        if not weeks:
            continue
        w = max(weeks, key=lambda x: x["start"])
        group = key.split("-")[1]
        label = (site["timeline"].get(key) or {}).get("label", "").replace("Batch ", "")
        rows.append({"key": key, "name": GROUP_NAME.get(group, group.upper()), "batch": label, "term": w.get("term"),
                     "week": w.get("weekNumber"), "start": w["start"], "end": w["end"]})
    rows.sort(key=lambda r: (r["name"], r["batch"]))
    return rows


def read_mess():
    return js_json("js/mess-data.js", "MESS_DATA")


# ------------------------------------------------------------------ what changed, and when
def fingerprint():
    h = hashlib.sha256()
    for name in ("weekly-seat/js/weekly-data.js", "js/mess-data.js", "js/bus-data.js"):
        h.update((ROOT / name).read_bytes().replace(b"\r\n", b"\n"))
    return h.hexdigest()[:16]


def last_modified():
    """Today's date (India) if the schedules, bus times or menu changed since the last run, else the date kept."""
    path = ROOT / "data" / "master" / "seo-state.json"
    fp, today = fingerprint(), dt.datetime.now(IST).date().isoformat()
    state = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    if state.get("fingerprint") != fp:
        state = {"fingerprint": fp, "lastmod": today}
        path.write_text(json.dumps(state, indent=1) + "\n", encoding="utf-8", newline="\n")
    return state["lastmod"]


# ------------------------------------------------------------------ the words
def faq_home(rows):
    return [
        ("How do I find my IMT Ghaziabad class schedule?",
         "Type your roll number on the home page and open Weekly. It shows your classes for the week, day by day, with the room and "
         "session number, for your own programme, batch, section and electives. Each class can be added to Google Calendar."),
        ("Where can I see my exam seat?",
         "Open Exam Seat and enter your roll number. Once the exam seating plan is published it shows each of your papers with the date, "
         "time, hall and seat, and you can save it as a PDF. Until the plan is published the page says it is locked."),
        ("Is IMT Never Sleeps an official IMT Ghaziabad website?",
         "No. It is an unofficial tool made by a student. It is built from the class schedules and lists shared with students, "
         "so always confirm anything important against the official schedule you receive from the college."),
        ("Which programmes and batches does it cover?",
         "PGDM, PGDM (BFS) and PGDM (DCP) at IMT Ghaziabad. The list of schedules currently on file, with the latest week for each batch, "
         "is on this page under \"Schedules on file\"."),
        ("How often is the schedule updated?",
         "Whenever a new weekly schedule or a revision is shared, usually before the week starts. The latest week for each programme "
         "and batch is listed on this page."),
        ("Where is the IMT Ghaziabad bus schedule and the mess menu?",
         "The bus timings between CDL and Campus (day and night shift) are on the Bus Schedule page, and the daily mess menu with meal "
         "timings is on the Mess Menu page. Both are linked from the Resources menu and from this page."),
        ("Can I install it on my phone?",
         "Yes. Use the Install app button in the menu, or add the site to your home screen from your browser's menu. It then opens like an app."),
        ("Does it store my roll number?",
         "Your roll number is kept only on your own device so the next visit opens straight to your schedule. Usage is counted by "
         "programme and batch, never by roll number or name."),
    ]


def faq_weekly():
    return [
        ("What does the weekly schedule show?",
         "For your roll number it shows each day's classes with the time, room, course and session number, including your electives and "
         "your Design Thinking or other group sessions. Holidays and revised classes are marked on the day."),
        ("Can I add my classes to Google Calendar?",
         "Yes. Tap the calendar button on any class to add that class to Google Calendar with its time and room."),
        ("Why does a class show a different room or time than before?",
         "Schedules are revised during the week. The page always shows the latest revision shared with students, so check it again before you leave."),
    ]


def faq_exam():
    return [
        ("How do I find my exam seat at IMT Ghaziabad?",
         "Enter your roll number. When the seating plan is published, each of your papers is listed with its date, time, hall and seat."),
        ("Why is Exam Seat locked?",
         "It stays locked until the exam seating plan is published. It opens by itself for everyone once the plan is on the site."),
        ("Can I save my exam schedule?",
         "Yes. Use Save as PDF on your results to keep a copy of your own exam dates and seats."),
    ]


def bus_summary(bus):
    parts = []
    for s in bus["shifts"]:
        fa, fb = s["fromA"], s["fromB"]
        if fa and fb:
            parts.append("The %s has %d buses from %s (first at %s) and %d from %s (first at %s, last at %s)." % (
                s["name"].lower(), len(fa), bus["a"], clock(fa[0]), len(fb), bus["b"], clock(fb[0]), clock(fb[-1])))
    return " ".join(parts)


def faq_bus(bus):
    day = bus["shifts"][0] if bus["shifts"] else None
    out = []
    if day:
        out.append(("When is the first bus from %s to %s?" % (bus["a"], bus["b"]),
                    "On the day shift the first bus from %s leaves at %s and the first from %s leaves at %s." % (
                        bus["a"], clock(day["fromA"][0]), bus["b"], clock(day["fromB"][0]))))
    out.append(("Is there a night bus at IMT Ghaziabad?",
                "Yes. " + (" ".join(s for s in bus_summary(bus).split(". ") if "night" in s.lower()).rstrip(".") + "." if bus["shifts"] else "")))
    out.append(("Do the bus timings change?",
                "They can. The timings are those shared with students" + (" and were last updated on %s" % long_date(bus["updated"]) if bus["updated"] else "") +
                ". A bus may leave early or late, so allow some margin."))
    return out


def faq_mess(mess):
    t = mess.get("timings", {})
    names = [("breakfast", "Breakfast"), ("lunch", "Lunch"), ("snacks", "Snacks"), ("dinner", "Dinner")]
    line = ", ".join("%s %s to %s" % (label, clock(t[k][0]), clock(t[k][1])) for k, label in names if k in t)
    return [
        ("What are the mess timings at IMT Ghaziabad?", (line + ". " if line else "") + "The menu on this page lists what is served at each meal."),
        ("How do I see today's mess menu?", "Today's menu is shown first on this page, with the days after it. Tomorrow's menu is below today's."),
        ("Can the mess menu change?", (mess.get("note") or "The menu is subject to change based on availability of items without prior notice.")),
    ]


# ------------------------------------------------------------------ html blocks
def faq_html(faqs):
    items = "".join('<div class="seo-q"><h3>%s</h3><p>%s</p></div>' % (esc(q), esc(a)) for q, a in faqs)
    return '<h2>Frequently asked questions</h2><div class="seo-faq">%s</div>' % items


def about_home(rows, modified):
    table = "".join("<tr><th scope=\"row\">%s %s</th><td>%s</td><td>%s</td></tr>" % (
        esc(r["name"]), esc(r["batch"]), ("Term %s" % r["term"]) if r["term"] else "",
        esc(("Week %s · " % r["week"] if r["week"] else "") + week_range(r["start"], r["end"]))) for r in rows)
    return (
        '<noscript><section class="seo-about" id="about" aria-labelledby="aboutTitle">'
        '<h2 id="aboutTitle">What is IMT Never Sleeps?</h2>'
        "<p>IMT Never Sleeps is a free, unofficial student tool for IMT Ghaziabad (PGDM, PGDM BFS and PGDM DCP). Enter your roll number to see your own "
        "weekly class schedule and End Term exam seats, with the campus bus timings and the mess menu one tap away. The schedules are updated "
        "every week from the timetables shared with students.</p>"
        '<h2>What you can do here</h2>'
        '<ul class="seo-links">'
        '<li><a href="/weekly-seat/">Weekly class schedule</a>: your classes day by day, with rooms, and add them to Google Calendar.</li>'
        '<li><a href="/exam-seat/">Exam seat finder</a>: your End Term exam dates, halls and seats, saved as a PDF.</li>'
        '<li><a href="/bus/">Campus bus schedule</a>: day and night timings between CDL and Campus, with the next bus on top.</li>'
        '<li><a href="/mess-menu/">Mess menu</a>: what is served at breakfast, lunch, snacks and dinner, and when.</li>'
        "</ul>"
        '<h2>Schedules on file</h2>'
        '<p class="seo-meta">Last updated <time datetime="%s">%s</time>.</p>'
        '<div class="seo-table-wrap"><table class="seo-table"><caption class="sr-only">Latest week on file for each programme and batch</caption>'
        "<thead><tr><th scope=\"col\">Programme and batch</th><th scope=\"col\">Term</th><th scope=\"col\">Latest week</th></tr></thead>"
        "<tbody>%s</tbody></table></div>"
        "%s"
        '<h2>Who made it</h2>'
        '<p>Created by <a href="%s" rel="noopener" target="_blank">Khush Goyal</a>, a student at IMT Ghaziabad, for fellow students. '
        'It is not run by the college. If something is wrong or missing, <a href="%s" rel="noopener" target="_blank">tell us here</a> and it will be fixed.</p>'
        "</section></noscript>"
    ) % (modified, esc(long_date(modified)), table, faq_html(faq_home(rows)), LINKEDIN, FORM)


def about_simple(title, intro, faqs):
    return ('<noscript><section class="seo-about" id="about" aria-labelledby="aboutTitle"><h2 id="aboutTitle">%s</h2><p>%s</p>%s</section></noscript>'
            % (esc(title), esc(intro), faq_html(faqs)))


def bus_fallback(bus):
    out = []
    for s in bus["shifts"]:
        def table(label, times):
            return ('<table class="seo-table"><caption>%s</caption><tbody><tr><td>%s</td></tr></tbody></table>'
                    % (esc(label), esc(", ".join(clock(t) for t in times))))
        out.append('<section class="seo-shift"><h2>%s</h2>%s%s</section>' % (
            esc(s["name"]), table("From %s to %s" % (bus["a"], bus["b"]), s["fromA"]), table("From %s to %s" % (bus["b"], bus["a"]), s["fromB"])))
    return "".join(out)


def mess_html(mess):
    t = mess.get("timings", {})
    names = [("breakfast", "Breakfast"), ("lunch", "Lunch"), ("snacks", "Snacks"), ("dinner", "Dinner")]
    days = []
    for iso in sorted(mess["days"]):
        d = mess["days"][iso]
        y, m, dd = (int(x) for x in iso.split("-"))
        dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][dt.date(y, m, dd).weekday()]
        meals = ""
        for k, label in names:
            if d.get(k):
                when = " (%s to %s)" % (clock(t[k][0]), clock(t[k][1])) if k in t else ""
                meals += "<dt>%s%s</dt><dd>%s</dd>" % (esc(label), esc(when), esc(", ".join(d[k])))
        days.append('<article class="mess-day" id="day-%s" data-date="%s"><h2>%s, %s</h2><dl>%s</dl></article>' % (
            iso, iso, dow, esc(long_date(iso)), meals))
    return '<div id="messDays">%s</div>' % "".join(days)


# ------------------------------------------------------------------ the head
def jsonld(graph):
    return '<script type="application/ld+json">%s</script>' % json.dumps({"@context": "https://schema.org", "@graph": graph},
                                                                          ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


def head_block(page, modified, faqs):
    url = SITE + page["path"]
    og = [
        '<link rel="canonical" href="%s">' % url,
        '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">',
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="%s">' % NAME,
        '<meta property="og:locale" content="en_IN">',
        '<meta property="og:title" content="%s">' % esc(page["title"]),
        '<meta property="og:description" content="%s">' % esc(page["description"]),
        '<meta property="og:url" content="%s">' % url,
        '<meta property="og:image" content="%s">' % OG_IMAGE,
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        '<meta property="og:image:alt" content="IMT Never Sleeps: class schedule, exam seat, bus and mess menu for IMT Ghaziabad">',
        '<meta name="twitter:card" content="summary_large_image">',
        '<meta name="twitter:title" content="%s">' % esc(page["title"]),
        '<meta name="twitter:description" content="%s">' % esc(page["description"]),
        '<meta name="twitter:image" content="%s">' % OG_IMAGE,
    ]
    person = {"@type": "Person", "name": "Khush Goyal", "sameAs": [LINKEDIN]}
    org = {"@type": "Organization", "@id": SITE + "/#organization", "name": NAME, "url": SITE + "/", "founder": person,
           "logo": {"@type": "ImageObject", "url": SITE + "/assets/icon-512.png", "width": 512, "height": 512},
           "description": "An unofficial, student-built tool for IMT Ghaziabad students: weekly class schedule, exam seat, campus bus timings and mess menu."}
    site = {"@type": "WebSite", "@id": SITE + "/#website", "url": SITE + "/", "name": NAME, "alternateName": ["IMT Never Sleeps", "IMTNeverSleeps"],
            "description": "Class schedule, exam seat, bus timings and mess menu for IMT Ghaziabad students.", "inLanguage": "en-IN",
            "publisher": {"@id": SITE + "/#organization"}}
    webpage = {"@type": "WebPage", "@id": url + "#webpage", "url": url, "name": page["title"], "description": page["description"], "inLanguage": "en-IN",
               "isPartOf": {"@id": SITE + "/#website"}, "dateModified": modified, "primaryImageOfPage": {"@type": "ImageObject", "url": OG_IMAGE}}
    graph = []
    if page["path"] == "/":
        app = {"@type": "WebApplication", "@id": SITE + "/#app", "name": NAME, "url": SITE + "/", "applicationCategory": "EducationalApplication",
               "operatingSystem": "Any (runs in a web browser, installable)", "isAccessibleForFree": True, "inLanguage": "en-IN",
               "offers": {"@type": "Offer", "price": "0", "priceCurrency": "INR"},
               "audience": {"@type": "Audience", "audienceType": "Students of IMT Ghaziabad"}, "creator": person,
               "description": "Find your IMT Ghaziabad weekly class schedule and exam seat by roll number, plus campus bus timings and the mess menu.",
               "featureList": ["Weekly class schedule by roll number", "Exam seat finder with PDF", "Add classes to Google Calendar",
                               "Campus bus schedule with next bus", "Mess menu and meal timings", "Installable on a phone"]}
        webpage["about"] = {"@id": SITE + "/#app"}
        graph += [org, site, app, webpage]
    else:
        webpage["breadcrumb"] = {"@id": url + "#breadcrumb"}
        graph += [webpage, {"@type": "BreadcrumbList", "@id": url + "#breadcrumb", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": page["crumb"], "item": url}]}]
    if faqs:
        graph.append({"@type": "FAQPage", "@id": url + "#faq", "inLanguage": "en-IN", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faqs]})
    return "\n".join(og) + "\n" + jsonld(graph)


# ------------------------------------------------------------------ the pages
def pages(rows, bus, mess):
    mess_faq = faq_mess(mess)
    return [
        {"file": "index.html", "path": "/", "title": "IMT Ghaziabad Timetable & Exam Seat | IMT Never Sleeps",
         "description": "Free unofficial student tool for IMT Ghaziabad: find your weekly class schedule and exam seat by roll number, plus campus bus timings and the mess menu.",
         "faq": faq_home(rows)},
        {"file": "weekly-seat/index.html", "path": "/weekly-seat/", "crumb": "Weekly schedule", "title": "IMT Ghaziabad Weekly Class Schedule | IMT Never Sleeps",
         "description": "See your IMT Ghaziabad weekly class schedule by roll number: a day-by-day timetable with rooms and sessions for PGDM, BFS and DCP, with Google Calendar.",
         "faq": faq_weekly(), "about": ("About the weekly schedule", "The weekly schedule shows your own timetable for the current week at IMT Ghaziabad, built from the schedules shared with students and updated with every revision.")},
        {"file": "exam-seat/index.html", "path": "/exam-seat/", "crumb": "Exam seat", "title": "IMT Ghaziabad Exam Seat Finder | IMT Never Sleeps",
         "description": "Find your IMT Ghaziabad End Term exam date, time, hall and seat by roll number, and save your exam schedule as a PDF.",
         "faq": faq_exam(), "about": ("About the exam seat finder", "The exam seat finder lists your End Term papers with the date, time, hall and seat once the seating plan is published.")},
        {"file": "bus/index.html", "path": "/bus/", "crumb": "Bus schedule", "title": "IMT Ghaziabad Bus Schedule: CDL to Campus | IMT Never Sleeps",
         "description": "IMT Ghaziabad campus bus timings between CDL and Campus: the full day and night shift timetable, with the next bus each way.",
         "faq": faq_bus(bus), "about": ("About the campus bus", bus_summary(bus))},
        {"file": "mess-menu/index.html", "path": "/mess-menu/", "crumb": "Mess menu", "title": "IMT Ghaziabad Mess Menu & Timings | IMT Never Sleeps",
         "description": "The IMT Ghaziabad mess menu, day by day: breakfast, lunch, snacks and dinner, with the meal timings.",
         "faq": mess_faq, "about": ("About the mess menu", "The mess menu lists what is served at breakfast, lunch, snacks and dinner at IMT Ghaziabad, taken from the menu shared with students.")},
    ]


def replace_block(text, name, content):
    pattern = re.compile(r"<!--seo:%s-->.*?<!--/seo:%s-->" % (name, name), re.S)
    if not pattern.search(text):
        return text
    return pattern.sub(lambda m: "<!--seo:%s-->%s<!--/seo:%s-->" % (name, content, name), text, count=1)


def build():
    rows, bus, mess, modified = schedules_on_file(), read_bus(), read_mess(), last_modified()
    changed = []
    for page in pages(rows, bus, mess):
        path = ROOT / page["file"]
        if not path.exists():
            continue
        text = original = path.read_text(encoding="utf-8")
        text = re.sub(r"<html lang=\"[^\"]*\"", '<html lang="en-IN"', text, count=1)
        text = re.sub(r"<title>.*?</title>", lambda m: "<title>%s</title>" % esc(page["title"]), text, count=1, flags=re.S)
        text = re.sub(r'<meta name="description" content="[^"]*">', lambda m: '<meta name="description" content="%s">' % esc(page["description"]), text, count=1)
        text = replace_block(text, "head", "\n" + head_block(page, modified, None) + "\n")
        if page["path"] == "/":
            text = replace_block(text, "about", about_home(rows, modified))
        elif "about" in page:
            text = replace_block(text, "about", about_simple(page["about"][0], page["about"][1], page["faq"]))
        if page["path"] == "/bus/":
            text = replace_block(text, "busfallback", bus_fallback(bus))
        if page["path"] == "/mess-menu/":
            text = replace_block(text, "mess", mess_html(mess))
        if text != original:
            path.write_text(text, encoding="utf-8", newline="\n")
            changed.append(page["file"])
    urls = ["/", "/weekly-seat/", "/exam-seat/", "/bus/", "/mess-menu/"]
    lastmod = {"/": modified, "/weekly-seat/": modified, "/exam-seat/": modified, "/bus/": bus["updated"] or modified, "/mess-menu/": modified}
    sitemap = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        sitemap.append("  <url><loc>%s%s</loc><lastmod>%s</lastmod></url>" % (SITE, u, lastmod[u]))
    sitemap.append("</urlset>")
    new = "\n".join(sitemap) + "\n"
    target = ROOT / "sitemap.xml"
    if not target.exists() or target.read_text(encoding="utf-8") != new:
        target.write_text(new, encoding="utf-8", newline="\n")
        changed.append("sitemap.xml")
    return changed


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    print("seo: updated %s" % (", ".join(build()) or "nothing (already current)"))
