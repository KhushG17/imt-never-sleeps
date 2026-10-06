# IMT Never Sleeps

A student portal for IMT Ghaziabad. Type a roll number, get a greeting, then
open **Weekly** (this week's classes) or **Exam Seat** (hall and seat for each
paper). Unofficial, built from the college's own schedule files.

This README is the live record of the project: what is built, what was
decided, what was skipped, what is left, and which files are needed. It is
updated with every change. Last updated: 6 Oct 2026.

## Current status

| Part | Status |
|---|---|
| Portal (roll number, greeting, two buttons) | Built |
| Weekly, Batch 2025-27, Term 5 | Built, Week 1 (5-11 Oct 2026) loaded |
| Weekly, Batch 2026-28, Term 2 | Not built, waiting on files |
| Weekly, the one Batch 2025-27 course on its own schedule | Not built, waiting on files |
| Exam Seat | Built, locked: "Term 2 & Term 5 exams coming soon" |
| Test roll `TEST` | Works on all three pages |
| Published online | Yes: https://khushg17.github.io/imt-never-sleeps/ (repo `KhushG17/imt-never-sleeps`) |
| Usage tracking | On (Google Analytics 4) |

## Batch tracker

Which batch is in which term, and what data is loaded for it. The term and
alumni date are set in `js/portal-config.js`; update this table whenever they
change or new data is loaded.

| Batch | Roll prefix | Current term | Roster loaded | Weekly loaded | Exam seats loaded | Alumni from |
|---|---|---|---|---|---|---|
| 2025-27 | 25 (one roll starts 24, two are `25FPM`) | 5 | 361 students, `data/roster-2027.json`, from "Student and Courses - Term V". Missing: students of the one separately scheduled course | Week 1, 5-11 Oct 2026 | Old cycle only (Sep 2026, Term 4), locked | Not set. Day after their last Term 6 exam |
| 2026-28 | 26 | 2 | None | None | Old cycle only (Sep 2026, Term 1), locked | Not set |

A batch becomes alumni once its Term 6 exams are done. Until the date is
entered, nobody is treated as alumni.

## Run it locally

No build step. From this folder:

```
python -m http.server 8000
```

Then open http://localhost:8000 and type `TEST`. Opening `index.html` directly
in a browser also works.

## Greeting content

What a visitor sees on the portal after entering a roll number.

| Who | Heading | Line under the name | Message |
|---|---|---|---|
| Student in the roster | Hey {name} | Batch 2025-27 · Term 5 · Major MKT · Minor OPR | {Good morning. / Good afternoon. / Good evening. / Up late?} Your Term 5 schedule is ready. |
| Student whose batch has no roster yet | Hey there | Batch 2026-28 · Term 2 | Your name and courses for Batch 2026-28 are not loaded yet. They will show up here once added. |
| Alumni | Hey Alumni, {name} | Batch 2025-27 · Alumni · Major MKT · Minor OPR | Once IMT, always IMT. Good to see you back. |
| Unknown roll | (none) | (none) | No student found for "{typed}". Check the roll number and try again. |

Time of day: morning 5 am to noon, afternoon to 5 pm, evening to 10 pm, "Up
late?" from 10 pm to 5 am. The wording lives in `js/common.js` (`greeting`
and `welcome`).

Other messages: Exam Seat locked, "Term 2 & Term 5 exams coming soon."
Weekly for a batch with no schedule, "The weekly schedule for {batch} is
coming soon." Weekly for alumni, "Term 6 is done, so there are no more weekly
schedules for {batch}."

## The test roll

Type `TEST` as the roll number. It is a dummy student ("Test Student", Batch
2025-27, Major MKT, Minor BA) and exercises everything:

- the portal greeting,
- Weekly with 13 classes across the week, Add to Calendar and Save as PDF,
- Exam Seat, which `TEST` alone can open while it is locked, with 8 sample
  papers, Add to Calendar and Save as PDF.

Its roster entry is in `data/roster-test.json` (run `python
scripts/site_data.py` after editing it); its exam seats are under the `TEST`
key in `exam-seat/js/exam-data.js`. To switch it off, set `testRoll` to
`null` in `js/portal-config.js`.

## Features

**Portal**
- The only place a roll number is typed. Weekly and Exam Seat have no search
  box of their own; each has a "Back to portal" button that returns to the
  greeting. Opening a tool page directly, or with a roll the portal does not
  know, sends the visitor to the portal.
- One roll number field. Spaces, hyphens and lower case are ignored
  (`25fpm-003` = `25FPM003`).
- Greeting: "Hey {name}", with the name exactly as it appears in the college
  sheet, then batch, term, major and minor.
- Greeting message under the name: "Good morning / afternoon / evening" (or
  "Up late?" from 10 pm to 5 am) plus "Your Term N schedule is ready."
  Alumni get "Once IMT, always IMT. Good to see you back."
- The cursive accent word in every heading is always in capitals.
- The portal hero has extra room above the heading, between the heading and
  the search card, and below the steps, scaled to the screen height.
- How-it-works strip: enter your roll number, pick Weekly or Exam Seat, save
  as PDF or Add to Calendar.
- Two buttons: Weekly and Exam Seat. Exam Seat is greyed out with a lock
  while locked.

**Weekly**
- Every class the student is registered for this week, grouped by day, with
  time, room, section and session number.
- Day notes from the schedule (for example "SSR Visits" on Thursday).
- "Today" tag on the current day; "No classes" on free days.
- "Clash" tag when the official schedule puts two of the student's classes in
  the same slot.
- Add to Calendar on every class (Google Calendar, real start and end time,
  IST converted to UTC).
- Save as PDF: a one-page table, with a clickable calendar icon on every row.

**Exam Seat**
- Subject, date, time, hall and seat per paper, Add to Calendar, Save as PDF.
- Shows the student's name and batch from the roster.

## Usage tracking

Built with Google Analytics 4 and **switched on since 6 Oct 2026**
(Measurement ID `G-F0R29KD608`, set in `analytics.measurementId` in
`js/portal-config.js`; set it to `""` to switch tracking off). Google's
standard snippet is not pasted into the pages: `js/common.js` loads the same
tag on every page from that one setting.

| Question | Where to read it in Google Analytics |
|---|---|
| How many people came to the site | Users and page views (automatic) |
| How many typed a roll number | Event `roll_search`, with `result` = `found`, `batch_only` or `not_found` |
| How many opened Weekly, how many opened Exam Seat | Event `tool_open`, split by `tool` = `weekly` or `exam_seat`, with `status` (`shown`, `locked`, `no_schedule`, `no_roster`, `no_seat`, `alumni`) |
| How many saved a PDF, per tool | Event `save_pdf`, split by `tool` |
| How many added to calendar, per tool | Event `add_to_calendar`, split by `tool` |
| How many tapped Exam Seat while locked | Event `locked_tool_click` |

Every event also carries `batch` (for example "Batch 2025-27").

- A roll number is typed once, on the portal, so `roll_search` is the single
  count of roll entries. The per-tool split comes from `tool_open`.
- Never sent: roll numbers, names, courses.
- The `TEST` roll is not counted. Pages opened as local files send nothing.
- Not counted: calendar icons clicked inside a downloaded PDF, since a PDF
  cannot report back.
- `tool`, `status`, `result` and `batch` are registered as event-scoped
  custom dimensions in GA (done 6 Oct 2026), so reports can be split by
  them. Events from before that date are not split.
- All of it lives in one function, `track` in `js/common.js`.
- The portal footer tells visitors that anonymous usage counts are collected.

## Decisions made

- **A, B, C are sections.** `CWB-B(2)` means Creating Winning Brands, section
  B, session 2. A student sees a class only when the course and their section
  letter in the "Student and Courses" sheet both match.
- **Faculty names are not shown** anywhere in Weekly (page, PDF, calendar).
- **Names are shown as they are** in the college sheet, not shortened.
- **Alumni = Term 6 exams done.** Each batch has an `alumniFrom` date, the
  day after its last Term 6 exam. From that date the greeting becomes "Hey
  Alumni, {name}" and Weekly shows "Term 6 is done" instead of a schedule.
- **Exam Seat is locked** between exam cycles, with the label "Term 2 & Term
  5 exams coming soon".
- **Roll prefix 25 = Batch 2025-27, currently Term 5. Prefix 26 = Batch
  2026-28, currently Term 2.** A roster entry's own batch wins over the
  prefix (one Batch 2025-27 roll starts with 24).
- **Rework later, with all the files in hand.** Exam Seat's subject matching
  and its separate config, and anything else the remaining files expose, get
  reworked once every batch's and programme's files are here, not before.
- **One site, one entry point.** Exam Seat must not behave like the old
  standalone "Find your IMT exam seat" site: its search box and Clear button
  are gone, replaced by "Back to portal". Weekly follows the same rule.
- **Separate page per tool**, sharing the roster and design, so weekly churn
  cannot break Exam Seat.
- **One generated data file per batch** in `data/`, bundled into one file
  per page, so updating one batch never touches another and the pages never
  change.
- The original `imt-exam-seat-finder` site is left untouched. This project
  only copied from it.

## Skipped for now

- Hero bubbles around the heading: tried as flat chips and as 3D glass
  spheres, removed on 6 Oct 2026 because they did not work visually.
- Faculty names (decided against).
- Week history or a next-week view: each weekly update replaces the last one.
- Course-level subject matching in Exam Seat (still term-level, as before).
- An `.ics` calendar download (Google Calendar links only).

## What is left

1. Batch 2026-28 Weekly. Their Term 1-3 schedule is organised section-wise,
   not per elective, so it needs its own parser once the real file is seen.
2. The one Batch 2025-27 course that runs on a separate schedule. Until then
   those students see "your course list isn't loaded yet".
3. Alumni dates: the last Term 6 exam date for each batch.
4. Unlocking Exam Seat for the Term 2 and Term 5 exams.

## Files needed from Khush

| File or detail | Needed for | Status |
|---|---|---|
| Batch 2026-28 weekly schedule (Term 2) | Weekly for rolls starting 26 | Waiting |
| Batch 2026-28 student list with sections | Names and matching for that batch | Waiting |
| Which programme codes `0601` and `0201` are | Naming programmes correctly, fixing Exam Seat subject matching | Waiting |
| Schedule and student list for the separate Batch 2025-27 course | Weekly for those students | Waiting |
| Student handbook, PGDM DCP 2026-28 | DCP structure, calendar, course lists | Received 6 Oct 2026 |
| Student handbooks for the other programmes and for the 2025-27 batch | Term dates, course lists, programme rules for everyone else | Waiting |
| Last Term 6 exam date for each batch | Switching that batch to alumni | Waiting (not urgent until Term 6) |
| Next seating-plan Excel (Term 2 and Term 5 exams) | Unlocking Exam Seat | When released |
| Google Analytics Measurement ID | Switching usage tracking on | Received 6 Oct 2026 |
| Each new week's schedule PDF | Weekly update | Every week |
| Revised "Student and Courses" sheet | Only if registrations change | As needed |

## About IMT Ghaziabad (background)

From public sources on 6 Oct 2026, mainly imt.edu. To be corrected against
the student handbooks once Khush shares them; where this and the college's
own files disagree, the files win.

- **Full-time two-year programmes:** PGDM, PGDM Marketing, PGDM Finance
  (Financial Management), PGDM Banking & Financial Services (launched 2019),
  and PGDM Dual Country Programme (DCP). DCP students spend three terms at
  the Dubai campus and three at Ghaziabad. There are also executive and
  part-time PGDMs and a doctoral programme (the two `25FPM` rolls in the
  roster).
- **Shape of the two years:** six terms. Year one is mostly common core
  courses taken in sections, which is why Term 1-3 schedules are
  section-wise. Year two is electives chosen by a Major and a Minor, which is
  why Term 4-6 schedules are per course and per section.
- **Core courses named on imt.edu:** Marketing Management, Accounting for
  Business Decisions, Organizational Behavior, Macroeconomics for Managers,
  Operations Management, Business and Corporate Finance, Managerial
  Accounting, Human Resource Management, Digital Business Strategy,
  Entrepreneurial Manager, Strategic Management. These match the Term 1 names
  already used in Exam Seat.
- **Practice courses:** Summer Internship Project, Business Research or
  Startup Incubation, Technology Readiness, Business Environment.
- **Specialisation areas on imt.edu:** Marketing; Finance; Operations and
  Supply Chain; Human Resource Management; Business Analytics; Information
  Technology Management; Strategy, Innovation and Entrepreneurship; Economics
  and Sustainability. The Term 5 files use the codes MKT, FIN, OPR, HRM, BA,
  ITM and SIE.
- **Not confirmed yet:** what "SSR Visits" stands for, which programme the
  separately scheduled Batch 2025-27 course is, exact term dates, and the
  rules on Major and Minor credit counts.

## PGDM DCP 2026-28, from its student handbook

Source: the official handbook, saved at
`handbooks/PGDM-DCP-2026-28-student-handbook.pdf` (112 pages, from the campus
intranet, reachable only on campus; not published with this site). The
handbook says dates and structure are tentative.

**Where the batch is, term by term**

| Term | Campus | Dates | End Term Exam |
|---|---|---|---|
| Foundation | Ghaziabad | 23 Jun - 12 Jul 2026 | |
| I | Ghaziabad | 13 Jul - 4 Oct 2026 | 26 Sep - 4 Oct 2026 |
| II | Ghaziabad | 5 Oct 2026 - 3 Jan 2027 | 26 Dec 2026 - 3 Jan 2027 |
| III | Dubai | 11 Jan - 4 Apr 2027 | 29 Mar - 4 Apr 2027 |
| IV + internship | Dubai | 5 Apr - 12 Sep 2027 | 6 - 12 Sep 2027 |
| V | Dubai | 4 Oct - 31 Dec 2027 | 27 - 31 Dec 2027 |
| VI | Ghaziabad | 3 Jan - 12 Mar 2028 | 6 - 12 Mar 2028 |

So this batch needs Weekly and Exam Seat at Ghaziabad only in Terms I, II and
VI. Its Term 6 exams end on 12 Mar 2028, so `alumniFrom` would be
`2028-03-13` if DCP is tracked as its own batch.

**Credits:** 105 in total. Core 36, practice 21, major electives 36,
electives outside the major 12. One credit is 10 classroom hours, so a
3-credit course is 30 hours, which is 24 sessions of 75 minutes.

**Majors:** Marketing, Operations and Supply Chain, Finance. The minor (12
credits) must be from a different area.

**Foundation (no credit):** Microeconomics, Quantitative Methods for Business,
Case Learning Pedagogy, Personal Growth Lab, Spreadsheet Modelling,
Introduction to Accounting and Finance, Introduction to Management.

**Core (3 credits each):** Marketing Management, Accounting For Business
Decisions, Organizational Behaviour, Macroeconomics for Managers, Operations
Management, Business and Corporate Finance, Managerial Accounting, Human
Resource Management, Digital Business Strategy, Entrepreneurial Manager,
Strategic Management, Data Analytics and AI for Business, plus Indian
Knowledge Systems for Contemporary Leaders (non-credit).

**Practice:** Summer Internship Project, Business Research Project,
Technology Readiness, Global Business Environment, Business Communication
(3 each); Design Thinking, Critical Thinking, Legal Aspects of Business
(2 each).

**Electives:** Terms III and IV carry major electives 1 to 10, Term V major
11 and minors 1 and 2, Term VI major 12 and minors 3 and 4. The handbook
lists 12 Marketing, 13 Operations and Supply Chain (choose 12) and 12 Finance
electives by name and code (pages 33-34).

**Not in the handbook:** which core courses fall in Term I versus Term II,
section names, roll number format, and what SSR stands for (it is mentioned
once, as "SIP and SSR projects").

**Still to settle:** whether the 2025-27 DCP batch followed the same pattern.
If it did, that batch is in Dubai for Term V now, which would explain why it
is not on the Ghaziabad Term V schedule.

## What the loaded data shows

Worked out on 6 Oct 2026 from the Term V student sheet (361 students), the
Week 1 schedule and the Sep 2026 seating plan (1,100 students). These are
patterns in the data, not official statements.

**Roll numbers are batch + programme + serial.** A roll such as `25 0103 xxx` is
batch 25, programme code `0103`, then a three-digit serial.

| Code | 2025 batch | 2026 batch | What the data says |
|---|---|---|---|
| `0101` | 150 | 133 | Mixed majors (80 MKT, 56 FIN, 8 OPR, 6 HRM): the general PGDM |
| `0102` | 31 | 27 | Every student is a FIN major: PGDM Finance |
| `0103` | 178 | 178 | Every student is a MKT major: PGDM Marketing |
| `0601` | 151 | 145 | Not in the Term V sheet at all. This is the separately scheduled programme. Its Sep 2026 papers were Wealth Management, Financial Derivatives, Risk Management in BFS-II, Banking and Treasury Management, SAPM, which reads like Banking & Financial Services. Khush says the separate programme is DCP. **To confirm which.** |
| `0201` | none | 96 | Only in the 2026 batch. Its Sep 2026 papers match the DCP core list, and the DCP handbook puts DCP 2026-28 in Ghaziabad for Term I while an older DCP batch would be in Dubai. That fits DCP. **To confirm.** |
| `FPM` | 2 | 2 | Doctoral students sitting PGDM courses |

**Second year (Term 5), codes 0101-0103:**
- 7 areas, 25 electives: MKT 6, FIN 5, SIE 4, HRM 3, ITM 3, OPR 2, BA 2.
- Most students take 4 courses (277 of 361); 68 take 5; a few take 2, 3 or 6.
- The usual split is 2 courses in the Major and 2 in the Minor (210 students).
- Majors: MKT 258, FIN 87, OPR 8, HRM 6. Minors: BA 97, SIE 71, OPR 68,
  HRM 56, ITM 31, MKT 21, FIN 14, and one "ES" (probably Economics and
  Sustainability, which has no Term 5 course).
- Sections hold 15 to 74 students. Popular courses split into 2 or 3 sections.

**Weekly rhythm (Week 1):**
- Seven slots of 75 minutes, 8:45 am to 8:00 pm.
- Classes run on six days including Saturday and Sunday. Thursday was kept
  free for SSR Visits. Friday, Saturday and Monday are the heaviest days.
- A course usually meets in a double block (two slots back to back), and 2 to
  4 times a week; three courses met 6 times.
- Seven rooms: C-201, C-202, C-403, Eklavya, Chandragupta, Analytics, Gurukul.

**Exams (Sep 2026 cycle):** 9 days, two sittings (10:00 am and 2:30 pm), 21
halls. Students sat 4 to 8 papers; first-years mostly 6 to 8, second-years
mostly 5 or 6.

**Why it matters for the build:** the programme code means a student's
programme can be read from the roll alone, before any roster is loaded. Exam
Seat's subject matching still assumes "25 = Term 4 electives, 26 = Term 1
core", which does not hold for code `0601`; it needs revisiting before the
next unlock.

## Known oddities in the college's files

These come from the source files and are shown as printed, not corrected.

- **Clashes:** 19 students have two different courses in the same slot in
  Week 1 (for example VCPE section A and PDRM section B, both Saturday 8:45
  am). Both are shown with a "Clash" tag.
- **Two rooms each hold two classes at once in the PDF:** Chandragupta on
  Monday 11:45 am (BIBC and CRA) and C-403 on Friday 2:00 pm (DSCS and EF).
  Probably a typo in one room on the college's side.
- **Fixed Income Securities and Adaptive Leadership** have no classes in Week
  1, so students taking them see nothing for those courses this week.
- The schedule writes `DSL1`; the allocation sheet writes `DSL-1`. The
  schedule's spelling is used.

## How updates work

Everything a routine update touches is in one of three places:

| What changes | Where | How |
|---|---|---|
| This week's classes | `data/weekly-<batch>.json` | One command, from the PDF |
| Who is registered for what | `data/roster-<batch>.json` | One command, from the sheet |
| A batch's term, the Exam Seat lock, alumni dates | `js/portal-config.js` | Edit one line |
| A term's course list | `data/batch-<batch>.json` | Edit once per term |

The pages never need editing for a data update or a new batch. Each command
saves its batch's JSON file and then rebuilds the two files the pages load
(`js/roster-data.js` and `weekly-seat/js/weekly-data.js`) from every batch's
JSON, so one batch's update cannot touch another's. `scripts/site_data.py`
is the single place that knows these paths.

### Every week

```
python scripts/generate_weekly_data.py "path/to/Weekly Schedule.pdf"
```

The batch is read from the PDF's own title, so there is nothing else to
type. It takes under a second. The script stops without writing anything if
the PDF does not cross-check: a class count that differs from the raw text, a
course or section not in the catalog, an unreadable time slot or day, or days
outside one Monday-Sunday week. It prints warnings for skipped session
numbers and double-booked rooms.

Once the site is published there is one more step each week: commit and push.

### When registrations change

```
python scripts/generate_roster_data.py 2027 "path/to/Student and Courses.xls"
```

Stops if a course column is unknown, a section letter is out of range, a
student's "Total" does not match, or a roll appears twice.

### Start of a new term

1. Edit `data/batch-<year>.json`: the term number and the course list
   (abbreviation exactly as the weekly schedule prints it, full name, area,
   number of sections), from the Course & Faculty Allocation sheet.
2. Set the batch's `term` in `js/portal-config.js`.
3. Run the roster command on the new "Student and Courses" sheet.
4. Run the weekly command on the first week's PDF.

### A new batch or programme

1. Add it to `batches` in `js/portal-config.js`.
2. Create its `data/batch-<year>.json` catalog.
3. Run the roster and weekly commands. No page edits.

This holds only if its files have the same layout as Batch 2025-27's. A
different layout (the section-wise Term 1-3 schedule is expected to be one)
needs a new parser written once, which then saves to the same
`data/weekly-<batch>.json` shape so nothing else changes.

### One-time setup

```
pip install pymupdf xlrd openpyxl
```

## Settings: `js/portal-config.js`

The one hand-edited settings file.

- `batches`: for each batch, its label, roll prefix, current `term`, and
  `alumniFrom` ("YYYY-MM-DD", the day after its last Term 6 exam). It is
  `null` for both batches today, so the alumni greeting never shows yet.
- `examSeat.locked` and `examSeat.lockedLabel`.
- `testRoll`.

## Unlocking Exam Seat for the next cycle

1. `python scripts/generate_exam_data.py path/to/SeatingPlan.xlsx`
   (rewrites `exam-seat/js/exam-data.js`; this drops the `TEST` exam entry
   unless it is added back).
2. Update `exam-seat/js/exam-config.js`: period, term label, roll prefix to
   term number.
3. Set `examSeat.locked` to `false` in `js/portal-config.js`.

## Project structure

```
index.html                    Portal
css/styles.css                Shared design system
js/portal-config.js           Settings (hand-edited)
js/common.js                  Shared roll lookup, greeting, helpers
js/portal.js                  Portal page logic
js/roster-data.js             Generated: every batch's roster, bundled
weekly-seat/index.html        Weekly page
weekly-seat/js/app.js         Weekly logic, calendar links, PDF
weekly-seat/js/weekly-data.js Generated: every batch's current week, bundled
exam-seat/                    Exam Seat page, logic, config and data
data/batch-2027.json          Per-term course catalog (hand-edited)
data/roster-2027.json         Generated roster, Batch 2025-27
data/weekly-2027.json         Generated week, Batch 2025-27
data/roster-test.json         The TEST roll (hand-edited)
scripts/site_data.py          Where data lives and how it is bundled
scripts/generate_*.py         The weekly, roster and exam generators
assets/imt-logo.png           Logo
design/                       Design system notes and tokens (reference only)
handbooks/                    Student handbooks from the college (not published)
Fw__1st_Weekly_Schedule.../   The college's Term V source files (not published)
```

Removed on 6 Oct 2026 as no longer needed: the `imt-exam-seat-finder-reference/`
copy of the old tool (everything in use was moved into this site; the original
lives on in its own repo) and `PLAN.md` (the original brief, replaced by this
README). The college's source files are kept because the generator scripts
read them.

## Testing done

Checked in Chrome on 6 Oct 2026: 10 page states at 7 screen widths (320 px to
1440 px) for sideways scrolling, off-screen or clipped content and small tap
targets, plus search, greeting, lock, calendar links and PDF downloads on all
three pages, every tracking event (with a fake ID and the request to Google
blocked), and the full journey portal, Exam Seat, back, Weekly, back,
change roll. All passed, no console errors. One fix came out of it: the brand
name was being cut off on 320 px phones.

## Credit

Built by [Khush Goyal](https://www.linkedin.com/in/khushgoyal17/).
