# IMT Never Sleeps

A student portal for IMT Ghaziabad. Type a roll number, get a greeting, then
open **Weekly** (this week's classes) or **Exam Seat** (hall and seat for each
paper). Unofficial, built from the college's own files.

Live at https://imtneversleeps.com/ (repo `KhushG17/imt-never-sleeps`,
hosted on GitHub Pages).

This README is the live record of the project: what is built, what was
decided, what was skipped, what is left, and which files are needed. It is
updated with every change. What we know about IMT itself (programmes, roll
codes, term dates, course lists, handbook rules) is in
[docs/IMT.md](docs/IMT.md). Last updated: 8 Oct 2026.

## Custom domain: imtneversleeps.com

The site is served at **https://imtneversleeps.com/** from 9 Oct 2026.
Hosting is still GitHub Pages (repo `KhushG17/imt-never-sleeps`); the domain
is registered and its DNS managed at GoDaddy.

- **In the repository:** the `CNAME` file holds the domain. Do not delete it;
  without it GitHub drops the domain on the next build.
- **DNS at GoDaddy:** four `A` records for `@` (`185.199.108.153`,
  `185.199.109.153`, `185.199.110.153`, `185.199.111.153`) and a `CNAME` for
  `www`. GitHub's guidance is for `www` to point to `khushg17.github.io`.
- **Old links keep working.** `khushg17.github.io/imt-never-sleeps/...`,
  including links with `?roll=`, redirects to the same page on
  `imtneversleeps.com`.
- **The repository must stay public** unless the GitHub account is on a paid
  plan: on the free plan, making it private switches GitHub Pages off and
  takes the site down.
- **Tracking:** the Google Analytics Measurement ID is unchanged and counts
  on the new domain with no code change. The Web data stream's address in
  Google Analytics (Admin, Data streams) should be updated to
  `imtneversleeps.com`; that only relabels it.
- Nothing in the site's code depends on the address: links between pages are
  relative, and the upload page talks to GitHub's API.

## Current status

Live at https://imtneversleeps.com (15 Oct 2026).

| Part | Status |
|---|---|
| Portal (roll number remembered on the device, greeting, live pill) | Live |
| Weekly | Live for all six batch-and-programme groups, Weeks 1 and 2 (5 to 18 Oct 2026), with corrections from mails |
| Exam Seat | Live, locked until the Term 2 and Term 5 seating plan arrives |
| Mess menu | Live, 1 to 16 Oct 2026 |
| Bus Schedule | Live, with the next bus each way |
| Campus events | Live (Onam, Sports Night, RESET 2026) |
| Nav bar | Resources (Bus Schedule, Study Material), Feedback, Install app |
| Installable app | Live: works offline, updates itself, install pop-up on Weekly |
| Master data | 1,330 students, 6 course lists, 12 weekly schedules |
| Weekly update | From the upload page in a browser (weekly PDFs), or one command on Khush's machine (everything) |
| Usage tracking | Google Analytics 4 with programme, section, term and app/browser on every event |

**What comes next:** stage A of the roadmap below, built now without IMT.
Stage B only if IMT gives permission and its requirement list.

## How it grew

The short history, so the next idea can be judged against where the last
ones came from. Each line is the question students had at that point.

| When | What was added | The question behind it |
|---|---|---|
| Sep 2026 | IMT Exam Seat Finder: one page, roll number in, hall and seat out | Where do I sit for each paper? |
| Early Oct 2026 | Renamed IMT Never Sleeps: a portal with a greeting, and Weekly beside Exam Seat | What classes do I have this week, and where? |
| 6 Oct | Usage tracking | Is anyone using it? |
| 8 Oct | All six programmes from one master data set; the upload page | Can it stay current without a laptop? |
| 9 Oct | imtneversleeps.com; campus occasions (Onam, Sports Night) | What else is on today? |
| 10 Oct | Mess menu; the day changes after the last class | What is for lunch? |
| 12 Oct | Remembered roll number, install as an app, nav menu, the wider usage tracking | Can it open in one tap, and what should come next? |
| 13 Oct | Bus Schedule page, Resources menu, cleaner phone overlays, the app updating itself | When is the next bus? |
| 14 Oct | Course-section corrections from lists (PDRM) | Is my section right? |
| 15 Oct | The roadmap: stage A now without IMT; stage B (Outlook sign-in, a smart timetable creator, mail notices, master search) only with IMT's permission | Can the timetable itself be made here? |

What the usage numbers are for: `lead` (how soon the next class is when
Weekly is opened), `mess_day` (how far ahead people look) and `fresh` (how
often an out-of-date schedule is seen) are the three most likely to point at
the next feature.

## Batch tracker

One row per batch and schedule group. The term is worked out from
`data/config/timeline.json` by date, never typed in.

| Batch | Group (programmes) | Term now | Students loaded | Weekly loaded | Weekly shows | Alumni from |
|---|---|---|---|---|---|---|
| 2025-27 | core (PGDM, Marketing, Finance) | 5 | 361, with each student's courses and course-sections | 5-11 Oct | Exactly the student's classes | 14 Mar 2027 (handbook, tentative) |
| 2025-27 | BFS | 5 | 150: Section A from its class list (77), everyone else Section B (73); elective (SERM or BF) for 148 | 5-11 Oct | Their section's classes plus the elective they chose | 14 Mar 2027 (assumed) |
| 2025-27 | DCP | 5 | 239 names; 160 with their five courses and each course's section | 5-11 Oct | Exactly their classes for the 160; all five tracks, labelled, for the other 79 | 14 Mar 2027 (assumed) |
| 2026-28 | core (PGDM, Marketing, Finance) | 2 | 338, with section A-F | 5-11 Oct | The student's section, plus all Design Thinking groups | 13 Mar 2028 |
| 2026-28 | BFS | 2 | 146, with section A or B | 5-11 Oct | The student's section | 13 Mar 2028 |
| 2026-28 | DCP | 2 | 96, with section A or B | 5-11 Oct | The student's section | 13 Mar 2028 |

Exam seats on file: the Sep 2026 cycle only (Term 1 and Term 4), locked.

## How the data is arranged

```
all files/                         The college's files, exactly as received
  _inbox/                          Drop new files here; update.py files them
  _superseded/                     Files replaced by a corrected version; not read
  batch 2027/
    handbook/
    core/term 5/                   Allocation sheet, student list
    core/term 5/weekly/            Every weekly schedule PDF for that term
    bfs/term 5/ ...                Same shape for each group
    dcp/term 5/ ...
  batch 2028/
    handbook/
    core/term 2/ ...  bfs/term 2/ ...  dcp/term 2/ ...

data/config/                       Hand-edited settings
  programmes.json                  Programme codes and schedule groups
  timeline.json                    Term dates, exam windows, alumni dates
  overrides.json                   Corrections, elective lists, the TEST roll
  weekly-revisions.json            Revised days of a week that arrived after its PDF

data/master/                       Generated from "all files" every run
  students.json                    Every student: programme, batch, section, courses
  students.csv                     The same list as a sheet that opens in Excel
  courses.json                     Course list per batch, group and term
  weekly/<batch>-<group>/<monday>.json   Every week ever received
```

`all files/` is kept out of the public repo (it holds raw student lists and
handbooks). `data/master/` and the three bundled files the pages load are
published.

Folders are by batch, then group, then **term**, because the course list
changes every term and electives start in Term 4. A new term is a new
`term N` folder; nothing is overwritten.

## The update: one command

```
python scripts/update.py
```

1. **Files the inbox.** Each file in `all files/_inbox/` is opened and
   recognised by its contents, whatever it is called: weekly schedule, course
   allocation sheet or student list; which batch, which group, which term. It
   is moved to the right `batch/group/term` folder under its original name. A
   file it cannot place stays in the inbox and is reported.
2. **Rebuilds the master data** by reading every file under `all files/`
   again from scratch.
3. **Rebuilds what the pages load**: `js/roster-data.js`,
   `js/site-data.js`, `weekly-seat/js/weekly-data.js` (the three newest weeks
   per group, so later weeks can be loaded early and simply extend the list).

4. **Re-stamps the pages.** Every link to a script or stylesheet carries a
   short fingerprint of that file (`portal.js?v=3f9a1c2e`), so a visitor's
   browser fetches a file again the moment it changes instead of showing a
   stored copy for up to ten minutes. Run the command after changing any
   script or style too, not only data.

Then commit and push.

**Every week:** either send the PDFs through the upload page (see "Uploading
from the browser"), or drop them into `all files/_inbox/` and run the
command. Student lists, allocation sheets and anything else go the second
way only.

**Days.** A row's day is read from where the day label sits on the page,
not from the row's own cell, because a merged, sideways label is often cut
into pieces by the table finder. A full date written in a row must still
agree with it.

**Checks.** A schedule is skipped, with a message, rather than loaded wrongly
if: its class count differs from the raw PDF text, its time slots or a day
label can't be read, or its days fall outside one Monday-Sunday week. It notes
(but still loads) skipped session numbers and course abbreviations with no
name. A student list is skipped if a "Total" column disagrees with the courses
read or an elective name matches no course; a roll number given to two
different names is left out on its own and reported. Everything else still builds.

**One-time setup:** `pip install pymupdf xlrd openpyxl`

### What it can read

| File | Layouts understood |
|---|---|
| Weekly schedule (PDF) | Rows by subject area with course-section cells (`CWB-C(1) PJ{C -201}`); rows by section with a venue (`SERM-(1)-SPP`, `HRM(1)FH`, `BC-A(1)-SHA`); rows by track (`VB-A(13)-MZ`); group sessions (`DTI-G-5(1)AT`); merged cells such as "ADP Placement Process"; whole-day notes such as "SSR Visits" |
| Course allocation (PDF) | Any table with a course name and an abbreviation column |
| Student list (xls, xlsx, PDF) | Any table with a "Roll No", "Roll Number" or "Enrolment No." column; one row per student, or one row per student and course ("Course" and "SEC" columns); reads name, section, major, minor, track, an "Elective Course" column, and course columns headed by a course's full name. Every sheet of a workbook is read |

Only roll number, name, section, major, minor, track and courses are ever
taken from a student list. Emails, dates of birth, gender, state and phone
numbers in the college's files are never read into the site's data.

### Hand edits

- **A new term's dates, or an alumni date:** `data/config/timeline.json`.
- **A course abbreviation with the wrong or no name:** `overrides.json`,
  under `courses`.
- **Courses that are electives in a section-wise schedule** (so only students
  who chose them see them): `overrides.json`, under `electives`.
- **A new programme code:** `programmes.json`.
- **Lock, pill, tracking, test roll:** `js/portal-config.js`.

Run `python scripts/update.py` after editing anything in `data/config/`.

## Run it locally

```
python -m http.server 8000
```

Then open http://localhost:8000 and type `TEST`. Use the local server, not a
double-click on `index.html`: links between pages are clean folder addresses
(`/weekly-seat/`, `/exam-seat/`), which only a web server resolves.

## The test rolls

Two dummy students, defined in `data/config/overrides.json` and listed in
`testRolls` in `js/portal-config.js`. Neither is counted in usage tracking.

| Roll | Who | What it shows |
|---|---|---|
| `TEST` | "Test Student", PGDM Marketing, Batch 2025-27, Major MKT, Minor BA | A full week in Weekly. The only roll that opens Exam Seat while it is locked (8 sample papers under the `TEST` key in `exam-seat/js/exam-data.js`). Shows the weekly live pill ("Live · 5 Oct - 11 Oct") on any day |
| `TESTA` | "Test Alumni", PGDM, Batch 2025-27 | The alumni experience: "Hey Alumni, Test Alumni", "Once IMT, always IMT", Weekly says Term 6 is done, Exam Seat says "No more exams, you have graduated". Shows the exam live pill ("Exam seating is live") on any day |

`TESTA` is alumni because its record says `"alumni": true`, which works for
any student whatever the timeline says. Real batches switch by date.

## Features

**Portal**
- The only place a roll number is typed. Spaces, hyphens and lower case are
  ignored. Weekly and Exam Seat have no search box; each has "Back to portal".
- A roll number is batch + programme code + serial, so the programme, batch
  and current term are known even for a student who is not in any list yet.
- While Exam Seat is locked its button names the student's own term
  ("Term 5 exams coming soon").
- Greeting: "Hey {name}" with the name as in the college's file, then
  programme, batch, term, and section or major and minor.
- **Pill above the heading.**
  - Green "Live · 5 Oct - 11 Oct": the schedule for these dates is in.
  - Red, dates only ("5 Oct - 11 Oct"): not up to date. Either the schedule
    day has passed those dates, or too many programmes still lack the week
    that is running. The colour is the only signal; it is not spelled out.
  - Red "New week's schedule not uploaded yet": nothing loaded at all.
  - Hidden during End Term Exams. While Exam Seat is unlocked it shows "Exam
    seating is live" and nothing else.
- **The six programmes' PDFs arrive separately.** Before a roll is entered
  the pill speaks for everyone. Its dates follow whatever is loaded: as soon
  as even one programme has a week, the dates include it, whether that week
  has started or was uploaded early. It is red while more than three
  programmes still lack the week that is running, so on a new Monday: none
  in, last week's dates in red; one or two in, the new dates in red; three or
  more in, green (`livePill.redWhenMissingMoreThan`). After a roll is entered
  it speaks for that student's own programme.
- **When "Today" becomes "Tomorrow".** In Weekly it is personal: the list
  leads with today until that student's own last class of the day has ended,
  and with the next day, tagged "Tomorrow", from then on. On a day with none
  of their classes, and for the pill and Exam Seat (which have no end times
  to go by), the switch is at 8 pm (`schedule.dayRollsAtHour` in
  `js/portal-config.js`). All of it runs on India time for every visitor.
- **Study Material** is a small book icon in the header, next to Feedback,
  on the portal, Weekly and Exam Seat. It opens the term-wise study material
  folder (SharePoint) in a new tab. The link is `studyMaterial.url` in
  `js/portal-config.js`; with no link the icon is hidden.
- The cursive accent word in every heading is always in capitals.
- One Disclaimer box in every page's footer: the portal is still in
  development, built from schedules and lists shared by students, so a detail may be missing or out of date; problems and ideas are
  welcome through the Feedback form; then the page's own points (unofficial
  tool, confirm against the official schedule, anonymous usage counts). It is
  wider on desktop, with the note and the points side by side.

**Weekly**
- Classes grouped by day with time, room, section or track, and session
  number. **One running list**: the current day at the top (tagged "Today",
  or "Tomorrow" after 8 pm), then the rest of the week, then next week's days
  under their own heading as soon as that week is uploaded, then the days
  already gone under "Earlier this week". When a week ends its days drop off.
  If every week on file is over, the last one is shown in calendar order.
  "No classes" on free days, "Clash" tag when two of a
  student's classes share a slot.
- **Group sessions end the day too** (10 Oct): the day changes after the last
  thing listed for the student that day, and that now includes group
  sessions (Design Thinking). Before, a day with only group sessions waited
  for 8 pm. Example: DCP 2026-28 on Sat 10 Oct has only Design Thinking
  Group C until 1:15 pm, so from 1:15 pm the Sports Night banner is on top
  and Sunday follows.
- **No class count on the Weekly page** (removed 10 Oct at Khush's request;
  it had read "21 classes left" for a day). The PDF still states how many
  classes its week has.
- **Campus occasions** (9 Oct): a green banner at the top of
  its day in Weekly, for every student, set by hand in `events` in
  `js/portal-config.js` (date, title, optional second line, optional link,
  theme). A link shows as a gold arrow button on the right that opens it in
  a new tab. The "onam" theme adds a pookalam, the Onam flower carpet, drawn
  in code. First entry: Onam on 13 Oct 2026, "Celebration by IMT MALCOM",
  linking to the club's form.
  - It shows whether or not that week's schedule is uploaded: if it is not,
    the day is listed with the banner and the line "The class schedule for
    this day is not uploaded yet."
  - **A day with an occasion does not change early** (decided 10 Oct,
    replacing the 9 Oct rule that moved the banner to the top once classes
    ended): on that date the whole day stays as it is until midnight IST,
    classes and banner in their usual places, with the Today tag. The
    next day takes over at 12:00 am. Days without an occasion still change
    after the student's last class, or at 8 pm.
  - It is never part of the PDF.
  - Festival greetings (15 Oct 2026), for every student: "Happy Mahashtami"
    on Mon 19 Oct (deep red and gold, a lotus) and "Happy Dussehra" on Tue
    20 Oct (saffron, a bow and arrow), on top of the day, title only (no
    second line, at Khush's request). Below it, PGDM 2025-27's day note reads
    just "Holiday" (set in `weekly-revisions.json`; the PDF says "Mahashtami &
    Dussehra Holiday"). Theme "festival",
    with `icon` "lotus" or "bow"; reusable for Diwali and other festivals.
    Holiday for everyone (15 Oct): both days carry `holiday: "Holiday"`, so
    every programme shows "Holiday" under the greeting, even where that
    week's schedule is not uploaded yet.
    Animated (15 Oct): the lotus petals open and close, the bow draws and
    shoots its arrow, sparks drift up and a sheen sweeps the banner; all of
    it stops for devices set to reduce motion.
  - Third entry (12 Oct): **RESET 2026 by HAWC**, 15, 16 and
    17 Oct, 6:30 pm each day, placed after the day's classes, with an arrow
    to the registration form (https://forms.gle/PoV2eyZwjzAt9gRYA). Day 1
    Penalty Shootout (Football Ground), Day 2 Arm Wrestling and Team Balance
    (Basketball Court; the poster's "Team Balance Reach Challenge", shortened
    at Khush's request), Day 3 Tug of War (Football Ground).
    Its "reset" theme follows the poster: paper beige, deep teal, the year in
    orange, a "HAWC · Day n" tag beside the title, the words running along
    the banner (one line on a laptop, two or three on a phone), a picture for the day on the
    left (`icon`: football, strength, rope), the venue (`where`) and the time
    as a tag on the right (`time`; beside the venue when there is a link, as
    here). `where` and `time` work on any theme.
  - `place: "after"` puts the banner below that day's classes instead of
    above them, for something held once classes are over.
  - Second entry (9 Oct): **Sports Night 2026**, 10 and 11
    Oct, "Crescent Crusaders vs Solstice Sovereigns" (the "by Sports Committee"
    line was dropped at Khush's request; `by` stays available as an optional
    smaller third line), no link, placed
    after the day's classes. The moon rocks gently and the sun turns (not for
    people who have asked their device for reduced motion). Its "sports" theme follows the poster: night purple on the
    left and gold on the right, a crescent (Crescent Crusaders, juniors) at
    the left end, a sun (Solstice Sovereigns, seniors) at the right end, and
    the text centred between them. One entry per date.
  - When the occasion's day leads the list because the uploaded week is
    over, the older days sit under "Last week", not "Earlier this week".
- Day notes and one-off entries from the schedule ("SSR Visits", "ADP
  Placement Process") appear on the right day, with their time.
- When the college's files don't yet say which section or track a student is
  in, every section or track is shown, labelled, with a note at the top,
  rather than nothing.
- Electives in a section-wise schedule (2025-27 BFS, Term 5: SERM and
  Behavioural Finance; every other subject is common): a student on an
  elective list sees only the one they chose. A student on neither list sees
  both, tagged "Elective".
- Group sessions (Design Thinking groups) are listed for everyone in the
  programme with the group number, since group membership isn't in the files.
- Each class is one compact row: time on the left, course, room, section
  and session in the middle, and a round navy calendar button on the right.
  On a phone a week is about 40% shorter to scroll than with the old
  four-box cards (a 17-class week went from 9.0 screens to 5.7). A one-line
  hint above the list says what the button does.
- Add to Calendar on every class (Google Calendar, real start and end, IST
  converted to UTC). Save as PDF: a table with a clickable calendar icon on
  every row. **One week per PDF**: the week that is running, titled with its
  week number ("Week 1, 5 Oct - 11 Oct 2026"), even when the page also lists
  the week after. When week 2 is running, the PDF is week 2.
- Both PDFs end with the same disclaimer as the site (unofficial, still in
  development, built from files shared by students, confirm against the
  official schedule) and a clickable "Give feedback" link to the form
  (`feedbackUrl` in `js/portal-config.js`).
- Terms held at the Dubai campus say so instead of "coming soon".

**Exam Seat**
- Today's papers are at the top, tagged "Today", then the days still to
  come, then earlier papers. The PDF stays in calendar order.
- The same compact rows and calendar button as Weekly.
- **Your own paper in a shared hall.** Where the seating plan puts two
  papers in one hall and slot, a student is shown only the one on their own
  course list for the term being examined: their registered courses (year-two
  core, DCP), or their programme's course list less any elective they did not
  choose. A subject in the plan is tied to a course by abbreviation, name, a
  near-identical name, or an entry in `examAliases`. If nothing on a
  student's list matches, every paper in the slot is shown. This needs the
  term's course list on file; the Sep 2026 plan (Terms 1 and 4) has none, so
  it still uses the older by-batch rule.
- Seat numbers read column letter first, then row (`L1`, not `1L`), in the
  page, the calendar entry and the PDF.
- Subject, date, time, hall and seat per paper, Add to Calendar, Save as PDF,
  with the student's name and programme from the master student list.

## Greeting content

| Who | Heading | Line under the name | Message |
|---|---|---|---|
| Student in a list | Hey {name} | PGDM Marketing · Batch 2025-27 · Term 5 · Major MKT · Minor OPR | {Good morning. / Good afternoon. / Good evening. / Up late?} Your Term 5 schedule is ready. |
| First-year in a list | Hey {name} | PGDM · Batch 2026-28 · Term 2 · Section A | Same |
| Valid roll, not in any list | Hey there | PGDM BFS · Batch 2025-27 · Term 5 | Your name and section for PGDM BFS, Batch 2025-27 are not loaded yet. They will show up here once added. |
| Alumni | Hey Alumni, {name} | PGDM · Batch 2025-27 · Alumni · ... | Once IMT, always IMT. Good to see you back. |
| Unknown roll or programme code | (none) | (none) | No student found for "{typed}". Check the roll number and try again. |

Time of day: morning 5 am to noon, afternoon to 5 pm, evening to 10 pm, "Up
late?" from 10 pm to 5 am. Wording is in `js/common.js` (`greeting`,
`welcome`).

## Usage tracking

Google Analytics 4, on since 6 Oct 2026 (Measurement ID `G-F0R29KD608` in
`js/portal-config.js`; set it to `""` to switch off). Widened on 12 Oct 2026
so that product decisions can rest on numbers.

**What is never sent:** roll numbers, names. Every event is tagged with the
student's group, not the student. `TEST` and `TESTA` send nothing. Page
addresses and referrers go to Google without anything after the "?", except
campaign tags (`utm_...`), which describe the link and not the person.
Roll numbers did reach Google inside page addresses from 6 to 8 Oct; that
was fixed on 8 Oct and the stored addresses can be removed in GA (Admin,
Data deletion requests, parameters `page_location` and `page_referrer`).

### On every event

| Parameter | Values | Tells you |
|---|---|---|
| `batch` | `Batch 2026-28`, ... | Which batch |
| `programme` | `PGDM`, `PGDM DCP`, `PGDM BFS`, ... | Which programme uses the site, and which does not |
| `section` | `A`, `B`, ... or a DCP track | Which section |
| `term` | `Term 2`, `Term 5`, `alumni` | Which term |
| `mode` | `app`, `browser` | The installed app, or a browser tab |

When an event has no student of its own (the mess menu on the portal, a nav
tap), the roll the device remembers supplies the group.

### Questions and where the answers are

| Question | Event | Read it by |
|---|---|---|
| How many people came, bounce rate, views per page | automatic | Reports, Engagement, Pages and screens |
| How often one person comes back | automatic | Reports, Retention (GA tells people apart by a browser cookie, not by roll) |
| Which shared link brought them | automatic | Reports, Acquisition. Share links as `https://imtneversleeps.com/?utm_source=whatsapp&utm_medium=group&utm_campaign=week3` |
| How the main page was reached | `portal_open` | `entry` = `fresh` (no roll yet), `remembered`, `link` (a roll in a link from outside), `portal` (Back to portal) |
| How many typed a roll number | `roll_search` | `result` = `found`, `batch_only`, `not_found`. Only real typing: it falls as rolls are remembered |
| How many opened Weekly, Exam Seat, Study Material, the mess menu | `tool_open` | `tool` = `weekly`, `exam_seat`, `study_material`, `mess`; `status` = `shown`, `locked`, `no_schedule`, `no_roster`, `no_seat`, `alumni` (mess: `today`, `tomorrow`, `no_menu`) |
| How they got into Weekly or Exam Seat | `tool_open` | `entry` = `portal`, `link`, `remembered` |
| How soon their next class was when they opened Weekly | `tool_open` (weekly) | `lead` = `in_class`, `under_30m`, `under_2h`, `later_today`, `tomorrow`, `later`, `none` |
| Whether the schedule they saw was current | `tool_open` (weekly) | `fresh` = `live`, `partial`, `stale`, `missing`, `exam`, `none` |
| Whether they scroll to next week, or back to days gone | `weekly_reach` | `result` = `next_week`, `earlier` (once each per visit) |
| How far ahead they look in the mess menu | `mess_day` | `result` = days ahead (`1` is tomorrow); `status` = `menu` or `no_menu` |
| How many saved a PDF | `save_pdf` | `tool` |
| How many added a class or paper to their calendar, and which | `add_to_calendar` | `tool`, `course` (the course name) |
| How many tapped an occasion's link | `event_click` | `result` = the occasion's title |
| Nav bar and Back to portal | `nav_click` | `result` = `menu`, `feedback`, `back_to_portal`, `lms`, `erp`; `tool` = the page |
| Master timetable use (staff) | `tool_open`, `master_unlock`, `master_view`, `master_action` | `tool` = `master`; `status` = `locked`/`shown`; `master_unlock` `result` = `ok`/`wrong`; `master_view` `result` = the tab; `master_action` `result` = `open_section`, `copy_window`, `copy_list`, `csv`, `see_on_board` |
| Which theme people switch to | `theme_change` | `result` = `light` or `dark` (the theme just switched to); `tool` = the page. Uses the existing `result` dimension |
| How many tapped Exam Seat while locked | `locked_tool_click` | |
| Installing | `install_click`, `install_popup`, `app_install` | `install_click`: `tool` = `nav` or `greeting`, `result` = `prompt` or `ios_hint`. `install_popup` (the pop-up on Weekly): `result` = `shown`, `install`, `dismissed` |
| Something broke on a page | `page_error` | `result` = the browser's message, `tool` = the page (three a visit at most) |
| Opened with no signal | `offline_opens` | `result` = how many times, reported on the next online visit |

### To set up once in Google Analytics

Admin, Data display, Custom definitions, Create custom dimension, scope
**Event**, with the dimension name and the event parameter both exactly as
written. Already registered: `tool`, `status`, `result`, `batch`. To add:

`programme`, `section`, `term`, `mode`, `entry`, `lead`, `fresh`, `course`

A dimension only fills from the day it is registered; events sent before
that keep the parameter but it cannot be used in reports.

### What it cannot tell you

- Anything about one named student.
- One student on two devices counts as two users.
- Google may withhold rows with very few users.
- Calendar icons clicked inside a downloaded PDF cannot be counted.

## Nav bar and the top of the tool pages

Changed and pushed 12 Oct 2026.

- **Nav bar, laptop:** buttons with icon and text. Since 13 Oct they are
  Resources (a drop-down: Bus Schedule, Study Material), Feedback and
  Install app, on every page.
- **Nav bar, phone (720px and under):** a three-line menu button; the menu
  lists the same items, icon and text. It closes on a tap outside, on Esc and
  after a link is followed. While it is open the page behind is blurred and
  dimmed (13 Oct), so the menu does not sit in a jumble of headings. Markup is the same on every page (`#navToggle`,
  `#navMenu`); the wiring is in `js/common.js`.
- **Top of Weekly and Exam Seat:** one card (`.id-card`) with the week or
  "Exam seats for", the name, then chips for the roll number, programme,
  batch, term and section (and the number of papers on Exam Seat), with Save
  as PDF, Back to portal and the calendar hint inside it. Exam Seat now leads
  with the student's name; it used to lead with the roll number.

## Bus schedule, and the Resources menu (13 Oct)

- **A new page, `/bus/`:** the campus bus timings, CDL to Campus and Campus
  to CDL. On top, a card with "Back to portal" and the next bus each way
  with how long until it leaves (the dot pulses gold inside 15 minutes).
  Below, Day shift and Night shift as two timetables: buses already gone in
  the current run are greyed, and the next one is filled navy and tagged
  "Next". On a phone, where the two are stacked, the shift that is running
  (the one the very next bus belongs to) is shown first; side by side on a
  laptop, Day stays on the left. It goes by India time and refreshes every
  half minute. No roll number needed.
- **Changing the timings:** edit `js/bus-data.js` by hand (24-hour times, in
  the order they run; the night shift's after-midnight times come last),
  then run `python scripts/update.py` so the pages pick up the new file.
  Stop names are shown as written there ("CDL", "Campus").
- **Nav bar:** Resources, Feedback, Install app. On a laptop, Resources is
  a plain word with a small arrow (not a button like the other two) that
  opens a simple drop-down: Bus Schedule first, then Study Material. On a
  phone there is no drop-down: the menu lists Bus Schedule, Study Material,
  Feedback and Install app, flat. "Install as an app" was shortened to
  "Install app" here and in the greeting card.
- **Counted as:** `tool_open` with `tool` = `bus`; nav taps as `nav_click`
  with `result` = `resources` or `bus_schedule`.
- The installed app's long-press shortcuts gain "Bus schedule".
- Files: `bus/index.html`, `js/bus.js`, `js/bus-data.js`.

## Weekly has no Save as PDF (13 Oct)

Removed at Khush's request: the schedule is one tap away in the app and is
remembered, so a saved copy goes out of date the moment a class moves. Gone
with it: the button, the PDF code in `weekly-seat/js/app.js` and the two PDF
library downloads on that page (it loads faster). "Back to portal" now sits
at the right end of the name's line in the top card on a laptop, and above
the week line on a phone (no room beside the name there); the calendar hint
is alone at the card's foot. Exam Seat keeps
its Save as PDF. The portal's third step now reads "Add classes to your
Calendar". Older notes in this file about the Weekly PDF (one week only, its
footer, occasions never being in it) describe what it did until 13 Oct.
`save_pdf` in the usage counts now comes from Exam Seat only.

## Clean edges for things that float (13 Oct)

Several things sit on top of the page on a phone: the nav bar and its menu,
the mess button, its "what is next" bubble, the mess menu card and the
install pop-up. Each used to land on whatever was under it. Now:

- **Menu open, or mess menu card open (phones):** the page behind is blurred
  and dimmed (`menu-open` / `mess-open` on `<html>`); the bar, the menu and
  the card stay sharp. A tap outside or Esc closes it and clears the blur.
- **Above the nav bar, once scrolled:** a white fade behind the bar
  (`.site-header::before`), so no content shows in the strip above it.
- **Foot of the screen (phones):** a white fade (`.bottom-fade`, added by
  `js/common.js`) under the mess button, the bubble and the install pop-up,
  so class rows fade out before reaching them. It cannot be tapped and is not
  printed.
- Laptops are unchanged apart from the fade above the nav bar: there the
  floating pieces sit in the empty margin.

## Remembered roll number, and installing as an app

Built and pushed 12 Oct 2026.

- **The roll number is remembered on the device.** Typing it on the portal
  saves it in that browser's own storage (`localStorage`, key `imt.roll`).
  The next visit opens straight on the greeting, with Weekly and Exam Seat
  one tap away. "Not you? Change roll number" forgets it. It never leaves
  the device, and a browser that blocks storage simply does not remember.
  - A roll that arrives in a link (`?roll=`) is used for that visit but is
    not saved, so opening a friend's shared link does not replace your own.
  - Weekly and Exam Seat opened with no roll in the address use the
    remembered one; with none remembered they go back to the portal.
  - Effect on the usage counts: `roll_search` now counts only real typing,
    so it will fall for returning students. `tool_open` is unaffected.
- **The site can be installed as an app** (a "PWA"): `manifest.webmanifest`
  names it and gives the icons (`assets/icon-192.png`, `icon-512.png`,
  `icon-maskable-512.png`, `apple-touch-icon.png`, all made from the logo),
  and `sw.js` is the service worker.
  - **"Install as an app" is offered in two places** (settled 12 Oct, after a
    button under the roll box and a pop-up on Weekly were tried and dropped):
    in the nav bar of every page (portal, Weekly, Exam Seat), and in the
    greeting card on the main page beside "Not you? Change roll number".
    Both show only when the browser offers installing, and never inside the
    installed app.
  - **A small pop-up on Weekly as well** (`js/install.js`; dropped on 12 Oct,
    brought back on 13 Oct at Khush's request): bottom left, after ten
    seconds on the schedule, with the app icon, "Get the app", an Install
    button and a cross. Not again for seven days after either (`QUIET_DAYS`).
    On an iPhone it has no button and says how. Counted as `install_popup`,
    `result` = `shown`, `install` or `dismissed`.
  - Android, and Chrome or Edge on a laptop: it opens the browser's own
    install box.
  - iPhone and iPad: no site can install itself there, so tapping it turns
    the menu item into the instruction: Tap Share, then "Add to Home Screen".
  - Counted as `install_click` (`tool` = `nav` or `greeting`, `result` =
    `prompt` or `ios_hint`), and a completed install as `app_install`.
  - Installed, it opens full screen with its own icon, on the portal, which
    opens on the greeting because the roll is remembered. Long-pressing the
    icon on Android offers "Weekly schedule" directly.
- **The installed app keeps itself current** (13 Oct). A phone does not
  reload an installed app when it is reopened; it brings back the page it
  had in memory, which left Khush's iPhone showing the site from before the
  bus page. Now, each time a page comes back into view (at most once a
  minute), `js/common.js` fetches that page afresh and reloads if it has
  changed (every script and style link in it carries a fingerprint, so any
  change to the site changes the page). `sw.js` also asks for pages with
  `no-cache`, so the browser's ten-minute copy is never used for a page.
  It does not reload while the menu or the mess card is open. Phones that
  installed the app before 13 Oct need one manual restart to get this.
- **With no signal**, pages already opened once still open, from a copy kept
  by `sw.js`. The rule is fresh first: every page and data file is fetched
  as usual and the copy is used only when that fails, so a newly uploaded
  schedule is never hidden behind an old copy. Fonts and the PDF library are
  served from the copy. The upload page and usage tracking are left alone.
- Installs are counted as the event `app_install` (Android/Chrome only).
- To retire every kept copy at once, change `CACHE` in `sw.js`.

## Mess menu

Built and pushed 10 Oct 2026.

- **What students see:** a round navy button, bottom right, on the portal,
  Weekly and Exam Seat. It opens a card with the day's four meals (time and
  items). The meal being served, or the next one, is tinted and tagged "Now"
  or "Next". The arrows step a day at a time, from today to the last day the menu has (changed 10 Oct; at first only today and tomorrow). After dinner ends the
  card opens on tomorrow. It needs no roll number. Esc, the cross, or a click
  outside closes it. It is not printed and not in the PDFs.
- **The button is always there**, fixed to the bottom right while the page
  scrolls. (It is attached to `<html>`, not `<body>`: the body's CSS
  `perspective`, used for the card tilt, would otherwise make it scroll away
  with the page, which is what happened in the first build.) Beside it a small pop-up says what is on or next ("Snacks at
  5:15 PM", and the first item). It shows for six seconds when a page opens
  and again on hover or keyboard focus; tapping it opens the card.
- **Where the menu comes from:** drop the mess menu PDF in `all files/_inbox`
  and run `python scripts/update.py`. It is filed to `all files/mess/`, read
  by `parse_mess` in `scripts/parsers.py`, added to `data/master/mess.json`
  (which keeps every date ever read; a newer file wins for a date both have)
  and bundled as `js/mess-data.js` (newest 45 days). Meal timings and the
  "subject to change" line are read from the PDF too.
- **From the upload page:** a mess menu PDF sent there is filed to
  `uploads/mess/` and handled by the same Action (the page's wording still
  says weekly schedules).
- **When the menu runs out:** the card says "The menu for this day is not
  uploaded yet." The current file covers 1 to 16 Oct 2026.
- **Oddity in the first file:** row 16 is dated 16-07-2026 but printed as
  Friday, straight after 15-10-2026; it is read as 16 Oct 2026 and the run
  prints a NOTE. Items are shown as printed ("Besan LAddu", "Machurian").
- **Switch:** `mess.enabled` in `js/portal-config.js`.
- **Files:** `js/mess.js` (the button and card), `js/mess-data.js`
  (generated), `data/master/mess.json` (generated), styles at the end of
  `css/styles.css`.

## Decisions made

- **The college's files are the source of truth.** The master data is rebuilt
  from them on every run, so it cannot drift, and their contents are never
  edited.
- **Arranged by batch, group and term**, with one inbox for new files.
- **Every year has three terms; electives start in Term 4.** Year-one
  schedules are matched by section, year-two core schedules by course and
  course-section.
- **A, B, C are sections.** `CWB-B(2)` is Creating Winning Brands, section B,
  session 2.
- **Alumni = Term 6 exams done.** Set per batch and group in the timeline.
- **Faculty names are not shown** anywhere.
- **Names are shown as they are** in the college's file.
- **One site, one entry point.** No search box on the tool pages.
- **Clean addresses**, no `index.html`.
- **The lock message names the student's own term**: "Term 5 exams coming
  soon" for a Term 5 student, "Term 2 exams coming soon" for a Term 2 one,
  from `lockedLabel: "Term {term} exams coming soon"`.
- **BFS 2025-27 sections:** the Section A class list is on file; per Khush
  (8 Oct 2026) every other BFS 2025-27 student is in Section B. That rule is
  one entry in `overrides.json` (`defaultSection`). Section and elective are
  independent: each section has both SERM and BF students, so an elective
  class is shown to whoever chose it, whichever section's row it is printed
  in. (An earlier same-day stop-gap that guessed the section from the
  elective was wrong for about half the batch and has been removed.)
- **DCP 2025-27 is matched by course and section**, like the core batch: its
  schedule cells name both (`VB-A(13)`), and the "Course and Section Name"
  sheet gives each student's five courses with a section each. The track
  rows (AQF, ITL, IBM-A, IBM-B, ITA) are only where a class is printed.
- **`all files/` is never uploaded to GitHub.** It is git-ignored.
- **Exam Seat stays locked** between cycles; its subject matching gets
  reworked when the next seating plan arrives, not before.
- **Show everything, labelled, when the mapping is missing**, instead of
  showing nothing or guessing.
- The original `imt-exam-seat-finder` site is left untouched.
- **Roadmap (15 Oct 2026):** stage A is built now without IMT; stage B
  starts only if IMT gives permission and its requirement list; then C
  (ERP data, subject pages with Slide Gate, attendance) and D (IMTinder).
- **No mail and no sign-in in stage A.** Notifications use the remembered
  roll number; gossip of the day uses the roll number and a join code. Mail
  and Outlook sign-in belong to stage B.
- **The timetable creator decides by itself** on fixed rules and an
  open-source scheduling solver, with no AI service and no hand fixes.
- **Slide Gate stays a separate project**, linked in at stage C.

## Skipped for now

- Faculty names (decided against).
- Hero bubbles: tried twice, removed.
- An `.ics` calendar download (Google Calendar links only).
- Calendar subscriptions per section (15 Oct 2026): app notifications cover
  the same need, sooner.
- Sign-in by a code sent to the IMT mail (15 Oct 2026): mail is kept for
  stage B.

## Roadmap: stage A now, stage B only with IMT

Decided by Khush, 15 Oct 2026.

| Stage | When | What |
|---|---|---|
| **A** | Now, without IMT | Better hosting with a small server of our own; student list kept private; app notifications (tied to the remembered roll number, no sign-in); announcements from clubs, committees and the student council; gossip of the day (anonymous, entry with the roll number and a join code from the batch WhatsApp groups, moderated); Moodle and ERP links; dark mode; our own usage analytics. **No mail and no sign-in anywhere** |
| **B** | Only if IMT gives permission and its requirement list | Outlook sign-in; a smart timetable creator with faculty availability that decides on fixed rules and a scheduling solver, with no AI service; notices by official IMT mail; master timetable search; dashboards; official status (owner, IT security check, privacy notice, a plan for after 2028) |
| **C** | Later | ERP data, subject pages with Slide Gate (Khush's separate app, linked in), attendance |
| **D** | After everything | IMTinder, its own project |

Dropped: calendar subscriptions (app notifications cover them).

The documents:

- `docs/unified-system-plan.md`: the full plan for every stage (who uses
  it, the timetable engine, notifications, student side, master timetable,
  sign-in and privacy, security, analytics, how to build it, stages, open
  questions).
- `docs/requirements.md`: every feature in easy words, split into without
  IMT (stage A) and needs IMT (stages B and C).
- `docs/unified-data-checklist.md`: every piece of data stage B needs (127
  items: in hand, partly, missing), kept up to date as files arrive.

## What is left

**Stage A (now, without IMT):**

1. Better hosting: a small server and database of our own (Supabase), and
   the site moved off public GitHub Pages so the student list can be made
   private.
2. App notifications (class changes, reminders, announcements, events),
   tied to the remembered roll number.
3. Announcements from clubs, committees and the student council.
4. Gossip of the day: join code, per-phone private ID, bot check,
   moderation, rules; tell the Committee on Digital Communications before
   launch.
5. ~~Moodle and ERP links in Resources.~~ Done and live 20 Oct 2026 (LMS and ERP side by side; the LMS opens its app store page on a phone).
6. ~~Dark mode.~~ Built 19 Oct 2026 and pushed 20 Oct 2026 (see "Dark mode, LMS and ERP, master timetable, staff tiles"). The same section covers LMS and ERP in Resources and a lite master timetable, both live.
7. Our own usage analytics on the new server.

**Ongoing:**

- Load each new weekly schedule, mess menu and event as it comes.
- Load the Term 2 and Term 5 seating plan when it is released (see
  "Unlocking Exam Seat"); the matching of each student to their paper is
  built and simulated.
- Each new BFS 2026-28 week: shift Introduction to Financial Markets
  session numbers down by one (done for Week 3) until the postponed class
  is held.
- The week of 19 to 25 Oct is now on file for all six groups.

**Stage B:** waits for IMT's permission and requirement list.

## Files and details still needed from Khush

| What | What it unlocks | Status |
|---|---|---|
| BFS 2025-27: Section B class list | Confirming Section B directly, in place of "everyone not in A" | Optional |
| BFS 2025-27: elective for rolls 250601100 and 250601109, and which list 250601092 belongs on | Those three see both electives until then | Waiting |
| DCP 2025-27: courses for the 79 students not on the "Course and Section Name" sheet | Their exact week; they see all tracks until then | Possibly off campus this term; Khush does not know yet (8 Oct 2026) |
| PGDM Finance 2026-28 handbook | Confirming it follows the core calendar | Waiting |
| Design Thinking group lists (2026-28 core groups 1-11, DCP groups A-C) | Showing each student only their own group | Not yet asked for; would tidy the Wednesday and Saturday lists |
| Handbooks for 2025-27 BFS and DCP | Real term dates and alumni dates for them | Only if they exist |
| Each week's schedule PDFs, all groups | Weekly update | Every week, through `/upload/` or into `all files/_inbox/` |
| Seating-plan Excel for the Term 2 and Term 5 exams | Unlocking Exam Seat | When released |
| Revised student or registration lists | Whenever sections or registrations change | As needed |
| ~~Moodle and ERP links~~ | Stage A: LMS and ERP in Resources | Received 19 Oct 2026; built and pushed 20 Oct 2026 |
| Club, committee and student council contacts | Stage A: who posts announcements | Needed |
| Student moderators and the chat's rules | Stage A: gossip of the day | Needed before launch |
| IMT's permission and requirement list | Stage B, with the data in `docs/unified-data-checklist.md` | Waiting on IMT |

Received: all six groups' Week of 5 Oct schedules and course allocation
sheets; student lists for all six groups (BFS 2025-27 as two elective lists);
the study material link; handbooks for PGDM, Marketing,
BFS and DCP 2026-28 and PGDM 2025-27; Google Analytics ID.

## Uploading from the browser

`https://imtneversleeps.com/upload/` is an admin page for
sending the week's schedule PDFs from any phone or computer. It is not linked
from the site and asks search engines not to list it.

**How it works.** The site is static files on GitHub Pages, so there is no
server of our own to log in to. The page talks to GitHub directly:

1. You paste an **access key** (a GitHub token, see below). The page checks
   it can write to the repository.
2. You drop the PDFs. The page adds them to `uploads/_inbox/` in one commit.
3. That commit starts the GitHub Action `Weekly schedule upload`, which runs
   `python scripts/update.py --uploads`: it files each PDF under
   `uploads/batch <year>/<group>/term <n>/weekly/`, reads it against the
   course lists already in `data/master/courses.json`, adds the week to
   `data/master/weekly/`, rebuilds `weekly-seat/js/weekly-data.js` and commits.
4. The page waits for the Action (about two minutes) and shows, per file,
   whether it was loaded or why not, from `uploads/last-run.json`.

**Creating the access key (once).** On github.com: Settings, Developer
settings, Personal access tokens, Fine-grained tokens, Generate new token.
Repository access: only `imt-never-sleeps`. Permissions: **Contents: Read and
write**, **Actions: Read-only**. Pick an expiry and copy the token; that is
the access key. It is stored in the browser tab, or on the device if
"Remember on this device" is ticked, and is sent only to api.github.com.
"Sign out" forgets it. Anyone holding the key can change the repository, so
share it with nobody; if it leaks, delete it on GitHub and make a new one.

**Limits.**
- Weekly schedule PDFs only. Student lists and allocation sheets hold
  personal details and stay in `all files/` on Khush's machine, which is
  never uploaded; the Action therefore cannot rebuild students or course
  lists and never touches them.
- Uploaded weekly PDFs are stored in the public repository under `uploads/`.
  They contain timetables and faculty initials, no student data.
- A new term's first week needs that term's course list loaded from Khush's
  machine first, or classes show as abbreviations until it is.
- A schedule in a layout the reader has never seen is reported as not loaded
  and needs a code fix.
- After uploading from the browser, run `git pull` before the next local
  `python scripts/update.py`, so the local copy has the uploaded PDFs. The
  full run reads both `all files/` and `uploads/`.

**Without the page.** Dropping PDFs into `uploads/_inbox/` on github.com or
in the GitHub phone app does the same thing.

## Data check, 8 Oct 2026

Every source compared with every other. Nothing here stops the site working.

| Finding | Detail |
|---|---|
| Students in the Sep 2026 seating plan but on no list | 2025-27 core: 3 (250103105, 250103163, 250103181). 2025-27 BFS: 3 (250601093, 250601100, 250601109). 2026-28 core: 1 (260102027) plus two FPM rolls. They get a greeting without a name |
| Students on a list but not in the Sep 2026 seating plan | One each in 2025-27 core, 2026-28 core and 2026-28 BFS. Probably joined late or sat no paper |
| 2025-27 DCP | All 239 are absent from the Ghaziabad seating plan, as expected if their Term 4 exams were in Dubai |
| Rolls that don't fit their list's pattern | 240102069 (a 2024 roll in the 2025-27 list) and 25FPM003, 25FPM004. Loaded as listed |
| Same name on two consecutive rolls | Three pairs: 250103026/027, 250201081/082, 260101019/020. Possibly different people with the same name; left as they are |
| 2025-27 core registrations | Every registered course-section exists in the schedule except ALCM and FIS, which have no class this week. Section counts agree with the allocation sheet. 17 students have a timetable clash this week |
| 2026-28 core head count | The allocation sheet says 341 students; the student list has 338 |
| BFS 2025-27 elective lists | One roll given to two names, one roll on both lists (see oddities) |
| Course codes | Every code in every schedule now has a name. Three needed correcting by hand (BF, DAIB, IAF) |
| Timeline | Each schedule's term and week number agree with the timeline. The 2025-27 handbook's own Term 4-5 dates did not, and were corrected |

## Privacy

The public site lets anyone who types a roll number see that student's name,
programme, section and (for the 2025-27 core batch) courses, and the bundled
student file is readable in the repo. The 7 Oct build published 361 students.
The 8 Oct build covers 1,328 across both batches. Khush decides whether and
when to push it.

## Looking at the master data

- **In Excel:** open `data/master/students.csv`. One row per student, sorted
  by batch, group, section and roll: roll number, name, batch, programme,
  group, term, section, track, major, minor, electives, courses.
- **Course lists:** `data/master/courses.json`, one block per batch, group and
  term (for example `2028-dcp-2`).
- **Weekly schedules:** `data/master/weekly/<batch>-<group>/<monday>.json`,
  one file per week received.
- **On GitHub:** the same files are in the repository under `data/master/`,
  viewable in a browser or the GitHub phone app.

These files are rebuilt by `python scripts/update.py` and are overwritten on
every run, so correct the college's file in `all files/` (or
`data/config/overrides.json`), never the master file itself.

## Dark mode, LMS and ERP, master timetable, staff tiles (pushed 20 Oct 2026)

Built 19 to 20 Oct 2026 and pushed on Khush's word as commit `6ebde55` (the
fixed navbar went earlier, commit `a08ccc6`). All of it passes its tests.

- **Dark mode, on every page** (home, Weekly, Exam Seat, Bus, Master, the
  upload page).
  - **One switch, two states.** A round sun/moon button in the bar, just left
    of Resources on a laptop and beside the menu button on a phone (never
    inside the Resources list). Moon while the page is light, sun while it is
    dark. There is no "Auto" in the interface: until the switch is used,
    nothing is kept and the page follows the phone or laptop live (dark at
    night if the device is). Switching to what the device already shows hands
    control back to the device. The choice is kept on that device only
    (`imt.theme` in the browser's storage).
  - `js/theme.js` runs in each page's `<head>`, before anything is drawn, so
    there is no flash; it sets `data-theme` ("light" or "dark", what is shown)
    and `data-theme-pref` ("auto", "light" or "dark", what is kept) on
    `<html>`, and the browser bar colour.
  - Colours are the existing named tokens with a second set of values
    (`:root[data-theme="dark"]` in `css/styles.css`, inside `@media screen`,
    so printing and saved PDFs stay light). New tokens: `--color-page` (behind
    the cards), `--color-accent` (the navy used as text, a border or an icon;
    the navy as a button background stays `--color-imt-navy`), and a few for
    the upload report, bus rows and so on.
  - The logo sits on a light plate in dark (its navy lettering would vanish).
  - One light-mode change: helper text `--color-slate-helper` is `#6b6b6b`
    (was `#797979`, 4.35:1 on white and 3.75:1 on the grey boxes; now 5.3:1
    and 4.6:1), so both themes reach WCAG AA.
  - Checked by `dark_test.py` (72 checks): behaviour (no flash, follows the
    device live, the switch's two states and the return to "follow the
    device", remembered across pages, print stays light) and an automatic
    text-contrast check on every page and every master tab, both themes,
    phone and desktop, menus and the mess card open. Banners and gradients
    are checked by eye; past bus times are faded on purpose; disabled buttons
    are exempt.
  - Tracking: `theme_change` with `result` = the theme just switched to.
- **LMS and ERP in Resources**, side by side on one line (desktop drop-down
  and the phone menu), with plain icons (a graduation cap, an institute
  building), in a new tab.
  - ERP: `https://erp.imt.edu/login.htm` everywhere.
  - LMS (Moodle): on a laptop `https://lms.imt.edu/login/`; on an iPhone or
    iPad the Moodle Workplace app page in the App Store; on Android its Google
    Play page. The addresses are `lms` and `erp` in `js/portal-config.js`.
  - Counted as `nav_click` with `result` = `lms` or `erp`.
  - Checked by `links_test.py` (91 checks, desktop, iPhone and Android
    browsers, all five pages).
- **Master timetable** at `/master/` (a hidden address: no link anywhere on
  the site; marked `noindex`). Behind a password.
  - **The lock is a soft lock.** Only a salted SHA-256 hash of the password is
    in `master/js/app.js` (the password itself is in no file), but anyone
    who reads that code can get past it, and a short password can be guessed
    by a tool. It is acceptable only because the page shows nothing that is
    not already published in `weekly-seat/js/weekly-data.js`. Real protection
    needs the stage A server. To change the password: compute
    `sha256("imt-never-sleeps/master:" + password)` and put it in `HASH`.
    Unlocking is remembered on that device (`imt.master`); the Lock button
    forgets it.
  - **Built from the same published weekly data** as Weekly, so it updates
    with every upload: the newest weeks per group (now 5 to 25 Oct, 960
    classes, 22 rooms, six groups). One colour per programme. Five views; the
    tab in the address (`#find`) is remembered on reload.
  - **Look:** a flat, square-cornered "operations console" (no capsules or
    pills): underlined tabs, a calendar strip for days, a strip of numbers,
    tiles, tables, hairline borders, all in the site's colour tokens so dark
    mode comes with it. Redesigned 20 Oct 2026 after Khush said the first
    version's capsule shapes were not liked.
    - *Rooms board*: rooms down the side, time across, every class a block,
      grouped as Rooms 3xx, 4xx, 5xx, the C block and halls. A time cursor
      (slider, drag, tap, a bar of the load strip, the arrow keys, **Now** or
      N) shows what is running, how many rooms are in use, and every free
      room as a tile ("till 2:30 PM" or "all day", longest free first). A
      strip above the board draws how many rooms are in use through the
      day (the shape of the day, the lunch dip, the peak). Week and day
      strip; the programme key highlights one programme; a combined lecture
      is one block ("A+B"); two classes in one room at overlapping times are
      outlined and flagged "!". A block opens its details and "Open this
      section's week". Below: hours booked per room per day for the week. On
      a phone the board opens centred on the cursor.
    - *Week by section*: the classic grid (days across, time slots down) for
      one section or track, or one student by roll number (using
      `IMT.buildView`, shared with Weekly in `js/common.js`). Holidays are
      hatched and labelled; group sessions are dashed; electives are tagged;
      a course key sits underneath.
    - *Find a time*: tick any sections (grouped by programme); each gets a
      strip for each day, and a green "All free" strip shows the windows (of
      at least a chosen length, inside a chosen day) when all are free.
      "Best windows" is a table of the longest, each with Copy; selecting a
      green window also copies it ("Wed, 21 Oct 2026, 5:15 - 8:30 PM (free
      for ...)"). A day-long note ("Holiday", "SSR Visits") counts as away.
    - *Search*: one box. Words narrow it together: a course, a room
      (`c201` and `C-201` are the same), a weekday, `today`, a section letter,
      a programme or batch (`bfs`, `2026`), `group 3`, or a whole roll number
      for that student's week. Results are a table (time, class, programme,
      section, room). Programme and "the week on show / every week" pickers.
      **Copy** puts one line per class on the clipboard; **Download CSV**
      saves them.
    - *Checks*: possible room clashes (two different classes in one room at
      overlapping times; a combined lecture is not one), classes without a
      room, and section overlaps (only for programmes laid out by section;
      electives and group sessions are not counted). Each clash has "See on
      the board". The tab shows the total. On the data of 19 Oct there are 7
      possible room clashes (for example C-403 on Fri 9 Oct, 2:00 PM, and
      C-202 on Wed 14 Oct, where a 15-minute difference between two
      programmes' slot grids makes classes overlap).
  - **Left out, as decided:** no faculty filter and no free-teacher finder
    (teacher initials are not stored in the site's data). Room capacity is not
    known; "known rooms" are those named in a schedule.
  - Counted as `tool_open` with `tool` = `master` (`status` = `locked` or
    `shown`), `master_unlock` (`result` = `ok` or `wrong`), `master_view`
    (`result` = the tab) and `master_action` (`result` = `open_section`,
    `copy_window`, `copy_list`, `csv`, `see_on_board`). No search word, filter,
    roll number or password is ever sent.
  - Checked by `master_test.py` (90 checks) against answers worked out
    separately in Python from the data file: the lock; the board's counts and
    every free room's "till" time at three moments; the room groups, the load
    strip's 52 bars and their heights, the arrow keys and N; Now, drag, week
    and day changes, the key's highlight, the A+B block, details; the section grids
    against the data and four students' grids against their Weekly pages;
    four combinations of sections in Find a time (every day's windows, the
    best-window order, the copy); eleven searches, Copy and the CSV; the
    clash count, the badge and "See on the board"; and phones (no sideways
    page scroll, board centred on the cursor).

- **Staff tiles for the test rolls (20 Oct 2026).** Typing `TEST` or `TESTA`
  (the `testRolls` in `js/portal-config.js`) on the home screen now adds two
  more tiles under Weekly and Exam Seat: **Upload timetable** (`/upload/`) and
  **Master timetable** (`/master/`). Any other roll number shows only Weekly
  and Exam Seat. The tiles are hidden in the page and shown by `js/portal.js`
  when the roll is a test roll; they are links to pages that keep their own
  locks (the upload page's access key, the master page's password).

## Smooth navbar, swiping, upload navigation, Diwali icon and decorations (20 Oct 2026, not yet pushed)

Built on 20 Oct 2026; waiting for Khush to say push.

- **The sticky navbar no longer shakes.** Three causes, all removed:
  1. `perspective:1600px` on `<body>` put the sticky header inside a 3D
     rendering context. The tilts now carry their own `perspective()`
     (`transform:perspective(1600px) ...`), in the animations, the button
     hover and the JS tilt in `common.js` and `exam-seat/js/app.js`.
  2. `will-change:transform` on every `.exam-card` made each card its own
     paint layer (dozens on a long schedule), which stutters a phone.
  3. The entrance animations used `forwards`, which left the header holding an
     identity transform (`matrix(1,0,0,1,0,0)`) for ever, and a transformed
     sticky header gets a paint layer of its own. They now use `backwards`:
     the animation plays, then the element goes back to its ordinary styles
     (`transform:none`). `cardIn` takes its start offset from `--rise`.
  The shake itself is a painting effect I could not see in the test browser
  (the header's position was perfectly steady in every measurement, before and
  after), so these are the known causes, removed. If it persists on a
  particular phone, note the phone and browser.
- **Master timetable, swiping on a phone.** The tabs, the rooms board, the
  week grid and the tables scroll sideways inside a page that scrolls up and
  down; on an iPhone one finger could move both at once. `master/js/app.js`
  now decides from the first few pixels of a swipe: sideways moves the box
  only (with a little coasting when the finger lifts, none for a slow drag),
  up or down moves the page only. `overscroll-behavior-x:contain` keeps a
  sideways swipe from turning into the browser's back gesture. Taps are
  untouched. Checked by `swipe_test.py` (15 checks): real finger drags, and
  the page's own logic with the browser's built-in touch scrolling switched
  off, so only the page's code can move the boxes.
- **The upload page has the same navigation as every other page** (brand,
  light/dark switch, Resources with Bus Schedule, Study Material, LMS and ERP,
  Feedback; the phone menu). Its Sign out button stays, now an entry in that
  menu, hidden until someone signs in. The page loads `site-data.js` and
  `common.js` for this; `common.js` does not report the staff upload page to
  analytics (`trackingOn` skips `/upload/`). Checked by `upload_nav_test.py`
  (23 checks): same parts, links, sizes and positions as the Bus page on a
  laptop and a phone, the theme switch, Sign out, and the entrance animation.
- **Diwali app icon.** The gold torch and "IMT" of the logo on a midnight sky
  with a warm glow and sparkles; the four navy dots became four lit diyas.
  - Drawn by `scripts/make_diwali_icon.py` (Pillow and Playwright) into
    `assets/icons/diwali/`: `icon-192.png`, `icon-512.png`,
    `icon-maskable-512.png` (everything inside the central 80% so any mask
    shape leaves it whole) and `apple-touch-icon.png` (180). The ordinary
    icons are kept in `assets/icons/standard/`.
  - `python scripts/app_icon.py diwali` (or `standard`) copies a set over the
    four files the site uses and tags every address that points at them with
    `?v=<set>` (the manifest, its shortcuts, each page's apple-touch-icon,
    the install pop-up), so devices fetch the new picture. **It is set to
    Diwali now.** After Diwali (8 Nov 2026) run `python scripts/app_icon.py
    standard` and push.
  - The browser-tab icon (the plain logo, `assets/imt-logo.png`) is unchanged.
  - Phones that already have the app: Android refreshes the icon by itself
    within a day or two; an iPhone keeps the icon from when the app was added,
    so the app has to be removed and added again to show the new one.
  - Checked by `icon_test.py` (12 checks): every manifest icon loads at its
    stated size and is the dark Diwali picture, each page's home-screen link is
    versioned and loads, the install pop-up, and the standard set is kept.

- **Diwali decorations** on Home, Weekly, Exam Seat and Bus; **never** on the
  upload page or the master timetable (they do not even load the files).
  The page's own background is not touched: it is decoration laid over it.
  - Under the navbar: a garland of twinkling fairy lights and swaying
    marigolds (an SVG that fits the screen width, redrawn on resize). At the
    foot of the page: four firecrackers (flowerpot, rocket, sparkler, ground
    chakra) that, tapped, set off a burst in front of the page; "Happy Diwali
    · tap a firecracker" beneath. (The three diyas above the heading were
    removed: they rendered glitchy on a phone.)
  - **Sky show**: a canvas fixed BEHIND the page's cards and text (nothing is
    covered, taps pass through). A first burst about a second after load, then
    one every 3 to 6 seconds at random places, picked from six kinds: peony,
    chrysanthemum, willow, ring, a rocket that climbs then bursts, and a
    cluster of small bursts. Brighter colours on a dark page, deeper with a
    soft halo on a light one. Sparks and rays in the garland are animated in
    the SVG itself. A tap on a cracker is counted as `festival_tap` with
    `result` = `anar`, `rocket`, `sparkler` or `chakri` (never who).
  - **Sound** (made in the browser with Web Audio, no files): boom, crackle,
    rocket whistle, shimmer, pops and fizz, behind a compressor
    with the level capped (master 0.55). The sky show is SILENT until the
    visitor turns sound on with the golden bell hanging from the garland (top
    right) or the "Sound off/on" button in the footer; the choice is saved
    (`imt.festSound`: `on` / `off`). Tapping a cracker sounds unless the
    visitor has switched sound off. Switching it on makes no sound itself (the bell just rings visually). Turning it on is counted as
    `festival_sound` (`result` = `on`/`off`). A browser only starts sound after
    a tap, so a saved "on" wakes with the first tap on the page.
    `festival.sound:false` in the config removes the bell, button and sound.
  - A device that asks for reduced motion gets the lights, still, and no
    fireworks, bell or sound. Printing hides everything. Everything is
    `aria-hidden` except the four cracker buttons and the sound controls
    (labelled, reachable by keyboard).
  - **Dates and switches** (`festival` in `js/portal-config.js`): on, from
    20 Oct 2026, until 12 Nov 2026 (Diwali is 8 Nov), India time; it switches
    itself off after `until`. `on:false` turns it off sooner;
    `?festival=on` shows it outside the dates and `?festival=off` hides it for
    a visit. To end it for good, remove `festival.js` and `festival.css` from
    the four pages (or just let the date pass).
  - Files: `css/festival.css`, `js/festival.js`.
  - Checked by `festival_test.py` and `sound_test.py` (42 checks on the sound: default silence, bell and footer switch, each cracker and show kind, saved choice, mute, reduced motion, config off, print): where it shows (and that the
    upload and master pages load nothing), the same background on, off and in
    dark, the dates (before, first day, Diwali, last day, after), the
    switches, taps passing through, no sideways scroll, the navbar still
    steady and working, the phone layout, the bursts (start, draw, go quiet,
    no repeat within ten minutes), each cracker and its count, reduced motion,
    dark mode and print.

## Halloween theme and icon; Diwali held back until 1 Nov (20 Oct 2026, not yet pushed)

- **Plan**: the Diwali look and icon are built but stay off until **1 Nov 2026
  (India time)**; the new Halloween look and icon run **25 to 31 Oct**. Nothing
  here is pushed yet. After 12 Nov everything is back to ordinary.
- **Dates and switch** (`festival` in `js/portal-config.js`): `themes` is a list
  of `{ name, from, until, greeting }` (diwali 1 to 12 Nov, halloween 25 to 31
  Oct); `IMT.festivalTheme()` in `js/common.js` picks today's (India time).
  `on:false` turns everything off, `sound:false` keeps the looks but no sound.
  To look early: `?festival=halloween` or `?festival=diwali`; `?festival=off`
  hides it. Only one theme ever runs.
- **Halloween look** (`js/halloween.js`, shares `css/festival.css`; Home, Weekly,
  Exam Seat, Bus only, never upload or master): orange/purple/green lights with
  hanging pumpkins, ghosts, bats and a spider; four characters at the foot
  (pumpkin, ghost, bat, cauldron) that act when tapped (`festival_tap` result =
  `pumpkin`, `ghost`, `bat`, `cauldron`); behind the content every 3 to 6 s a
  random sky show: bats flying by, a ghost floating up, a witch on her broom,
  will-o'-the-wisps or lightning (a faint wash, not a flash). Same golden bell
  and footer button for sound, same `imt.festSound` choice, `festival_sound`
  event. Sound is synthesised (wing flutter, ghost "whoo", thunder, witch laugh,
  music-box notes, creaking door, bubbles); sky silent until sound is switched
  on, taps sound unless muted; switching on is silent. Reduced motion: still
  lights and characters only.
- **App icons**: `scripts/make_halloween_icon.py` draws `assets/icons/halloween/`
  (night sky, moon glow, gold logo, bats, four jack-o'-lanterns);
  `assets/icons/diwali/` and `standard/` as before. The ordinary icon is in use
  now. `scripts/seasonal_icon.py` picks the set from the same dates, and
  `.github/workflows/seasonal-icon.yml` runs it every night at 23:40 IST for the
  next day and commits the change (so the icon changes by itself on 25 Oct, 1
  Nov and 13 Nov once this is pushed). Android refreshes an installed app's icon
  within a day or two; an iPhone keeps the icon it was added with.
- **Preview rolls `DIWA` and `HALLO`** (like `TEST`: dummy students defined in
  `data/config/overrides.json`, in `testRolls`, Exam Seat open for them via
  `examSeat.openFor`, the same eight sample seats copied into
  `exam-seat/js/exam-data.js`, upload/master tiles on Home, never counted in
  usage). Typing one on Home shows its theme at once (the page reloads once)
  whatever the date, and it follows the roll to Weekly, Exam Seat and Bus;
  "Change roll number" returns to the ordinary look. Set by
  `festival.previewRolls` in `js/portal-config.js`; the roll beats the date,
  `?festival=` beats the roll. Note: regenerating `exam-data.js` from a seating
  plan drops the sample seats for `TEST`, `DIWA` and `HALLO` unless the plan has
  them. Checked by `preview_roll_test.py` (19 checks).
- **To do by hand**: nothing, once pushed. If you push after 25 Oct the theme
  shows at once and the icon follows that night.
- Checked by `halloween_test.py`, `festival_test.py` (Diwali, dated 5 Nov),
  `sound_test.py` (Diwali sound), `icon_test.py` (19 checks: sets, dates, switch
  and back, nightly job).

## LMS opens the installed app (21 Oct 2026, not yet pushed)

- A tap on **LMS** on a phone now tries the Moodle Workplace app first and goes
  to the store only if it is not installed. Android: an `intent://` link with the
  app's package (`com.moodle.workplace`) and the Play Store page as its
  fallback, so Android decides. iPhone: the app's address
  `mmworkplace://https://lms.imt.edu` is tried and, if the page is still in
  front 1.4 s later, the App Store page opens (iOS cannot say whether an app is
  installed). Laptop: the website, unchanged. The link's own address stays the
  store page for browsers that block this. Settings: `lms.site`, `lms.scheme`,
  `lms.androidPackage` in `js/portal-config.js`; code in `js/common.js`.
- `mmworkplace` is the Workplace app's default URL scheme (Moodle Workplace app
  docs). **Not yet tried on a real phone**: if the app opens but not at the
  right site, or does not open, the scheme may need changing (IMT's Moodle
  settings say which app scheme the site allows). Checked by `lms_app_test.py`
  (6 checks, with the Android and iPhone browser identities).

## No double-tap zoom (22 Oct 2026, not yet pushed)

- A quick double tap on a phone zoomed the page in. `css/styles.css` now sets
  `touch-action: manipulation` on the page, links, buttons and fields on every
  page (Home, Weekly, Exam Seat, Bus, master, upload): double-tap zoom is off,
  pinch zoom and scrolling still work (kept for accessibility). The master
  timetable's swipe lock still passes (15/15).

## Garba Night, 23 Oct 2026 (not yet pushed)

- An event banner on Fri 23 Oct (below that day's classes) in a new `garba`
  look: magenta, orange and gold with mirror-work dots, a turning rangoli
  mandala at one end and crossed dandiya sticks at the other, a sheen across
  (motion off for reduced-motion devices). Third line: "CULCOM" (`by`). Entry in
  `events` in `js/portal-config.js`; art in `weekly-seat/js/app.js`
  (`garbaMandala`, `dandiya`), look in `css/styles.css`. No time or venue yet:
  add `time`, `where`, `note` or `link` to the same entry when known.

## Master timetable: one tab per job (22 Oct 2026, not yet pushed)

- The master timetable now opens on the things staff actually do, one tab each:
  **Student** (type a name or roll number, suggestions appear, tap the student,
  their week shows right there with week arrows; keyboard and phone friendly),
  **Vacant rooms** (pick a day and a window, see the rooms free for all of it,
  grouped, each with "till 3:45 PM" or "rest of the day", Now button, Copy the
  list; the old room board sits below it), **Section timetable** (programme
  and section, week by week), **Common time** (when chosen sections are all
  free), **Checks** (room clashes, with the count on the tab) and **Detailed search**
  (the old free-text search with Copy and CSV, last).
- Student suggestions come from the roster (students with a schedule on file,
  test rolls left out): matches on any part of the name or the start of the
  roll number, best matches first, up to seven. Vacant rooms are worked out
  from the room named on each class, and counted against an independent
  calculation in the tests. Events counted: `find_student`, `vacant_now`,
  `copy_vacant`. Code: `master/js/app.js` ("0. FIND"), `master/index.html`.
- Checked by `find_test.py` (32 checks) plus the updated `master_test.py` (90),
  `swipe_test.py` (15) and the dark-mode suite (72).

## Corrections received

- **19 Oct 2026, the navbar now stays fixed at the top on every page** (it
  scrolled away on phones and desktop). Cause: `html{ overflow-x:clip }`
  (added with the floating buttons) stopped `body{ overflow-x:hidden }` from
  passing up to the page, so the body became a scroll area of its own and the
  header's `position:sticky` had nothing to stick to. The body is now `clip`
  too. Checked on all four pages, phone and desktop: the bar stays at 14 px
  from the top, no sideways scrolling, menus open in place when scrolled.

- **19 Oct 2026, PGDM 2026-28 Term 2, Week 3 (19 to 25 Oct): a newer PDF**
  ("3-Weekly Schedule of PGDM-I(2026-28) Term - II Oct. 19 - 25, 2026.pdf").
  Both PDFs for the week are in `all files`; the loader reads files in name
  order and the last for a week wins, and this one sorts last. Against the
  earlier one (87 classes, now 84):
  - Section A, Fri 23: DAIB(7) moves to 10:45 and HRM(7) to 2:30.
  - Section D: BR(10) moves from Wed 21 (4:00) to Fri 23 (2:30).
  - Sun 25: MA 8 and 9 are gone for both Sections A and B.
  - Section F's HRM at 2:30 on Wed 21 is now in the PDF itself, so the
    correction typed for it is removed (only the "Holiday" notes remain).

- **17 Oct 2026, PGDM 2026-28 Term 2, Week 2, Sat 17 and Sun 18 Oct** (edits,
  picture). The struck-through cells on Sat 17 are cancelled: Design Thinking
  group 11 sessions 3 and 4 (Section A, 2:30 and 4:00) and group 7 sessions 3
  and 4 (Section B, 10:45 and 12:15). Sun 18: Section B's BR(10) is at 12:15
  (was 2:30); Section E has MA(3) at 12:15, MA(4) at 2:30 and BR(10) at 4:00.
  Retyped in `weekly-revisions.json`; Week 2's other days are unchanged.

- **16 Oct 2026, DCP 2025-27 Term 5, week of 19 to 25 Oct.** 16 classes,
  loaded from the PDF without trouble. The college titles it "Week-4" (this
  group's numbering runs one ahead of the others, as before), so the page
  and PDF name say Week 4. Mon and Tue show "Holiday". Wed 21 Oct has no
  classes. All six groups now have the week of 19 to 25 Oct.

- **16 Oct 2026, mess menu 17 to 31 Oct** (`Mess_Menu_17th_to_31st_Oct_2026.pdf`,
  filed under `all files/mess`). 15 days, so the menu now runs 1 to 31 Oct.
  The 17 Oct breakfast, which the PDF's text printed away from its row, was
  read in the right place; the last two rows are both numbered 14 in the
  PDF, which does not matter.

- **16 Oct 2026, PGDM 2026-28 Term 2, Section F, Wed 21 Oct** (notice: "On
  Wednesday, HRM class will be held at 2:30pm"). HRM session 7 moves from
  12:15 to 2:30 pm. In `weekly-revisions.json` the whole day is retyped (a
  revision replaces every class on its date), with only Section F changed.

- **16 Oct 2026, DCP 2026-28 Term 2, Week 3 (19 to 25 Oct).** 34 classes.
  The first run skipped it: the PDF text has 34 entries but 30 were read.
  Wednesday and Thursday have Design Thinking entries stacked in one cell
  with no times ("DTI- A (3)-NVS - 301" over "DTI- B (3)-NS - 302", and two
  "(4 & 5)" pairs side by side). `split_stacked` in `scripts/parsers.py` now
  reads those, one group session per slot, shown to every section as before.
  Mon and Tue show "Holiday". No other week on file changed.
  Updated picture the same day: Sat 24 Oct gains DTI group C sessions 7 and 8
  (10:30 to 1:15, Gurukul), added in `weekly-revisions.json` with the day's
  other class (Section A's EM 3 and 4) retyped. The reader now accepts a
  letter group in a revision (`DTI-G-C(7)SRT{Gurukul}`).

- **16 Oct 2026, DCP 2026-28 Term 2, Fri 16 Oct** (picture of the day's
  changes). Section A's Managerial Accounting session 14 moves from 12:00 to
  2:15 PM; Section B's Managerial Accounting session 11 and Financial
  Accounting session 6 swap (MA at 12:00, FA at 2:15 PM). In
  `weekly-revisions.json`; the rest of the day is unchanged.

- **16 Oct 2026, PGDM 2026-28 Term 2 and BFS 2026-28 Term 2, Week 3 (19 to
  25 Oct).** 87 and 24 classes. The PGDM file is named "PGDM - II (205-27)
  Term - V" but its contents are PGDM 2026-28 Term II; it is filed by its
  contents, under 2028.
  - PGDM: the "Mon - Tue" holiday row above Wednesday pushed every day band
    down a row, so Thursday's Section A classes were read as Wednesday's.
    `day_bands` now leaves such a row out of the bands (it is still read as
    both days' note).
  - PGDM Saturday rows carry only a room, no section. A class there (BR(10)
    in 501) now goes to the section that has that room all week (A); the
    Design Thinking groups show to their groups as before.
  - BFS: Introduction to Financial Markets is printed as IFM-(4) and IFM-(5);
    shown as sessions 3 and 4 because the 15 Oct class was postponed. The
    holiday cell spanning both days is shown as "Holiday" for both sections
    (a revision's day note now replaces a whole-day entry on that day).
  - Both show "Holiday" on Mon and Tue, like every programme.
  No other week on file changed.

- **15 Oct 2026, BFS 2025-27 Term 5, Week 3 (19 to 25 Oct).** 33 classes.
  - The first run filed it under a batch "2025": the classifier took the
    week's dates ("19/10/2026 - 25/10/2026" reads as "2026 - 25") for the
    batch. It now only accepts a pair two years apart ("2025-27"). Refiled
    under 2027.
  - Whole-day rows for both sections ("Holiday - Mahashtami") are now read
    as that day's note, and an entry repeated in every slot of a row
    (Section B's "VB-SSR" on Thursday) as one entry across the day.
  - The Wed 21 Oct Fixed Income Securities guest lecture (FIS-(8), 9:00 and
    10:30) is for Sections A and B together in New Audi; the PDF row gave it
    to Section A in C-001 only. Set right in `weekly-revisions.json`, with
    Mon and Tue shown as "Holiday" like every programme.
  No other week on file changed.

- **15 Oct 2026, PGDM 2025-27 Term 5, Week 3 (19 to 25 Oct).** Loaded from
  the PDF: 54 classes. Two things in this PDF the reader had not met before,
  now handled in `scripts/parsers.py`:
  - One row standing for two days, "Mon - Tue (Oct. 19 - 20, 2026)" with
    "Mahashtami & Dussehra Holiday": both days get that note and no classes
    (`parse_day_span`). Thursday's "SSR Visits" row is a note the same way.
  - A room printed without its opening brace, "CTM-A(7) SMC -201}": read as
    room C-201.
  No week already on file changed.

- **15 Oct 2026, BFS 2026-28 Term 2: Introduction to Financial Markets
  postponed** (BFS Program Office mail, 14 Oct). Both classes on Thu 15 Oct
  (9:00 AM Section A, 10:30 AM Section B) are taken off that day in
  `data/config/weekly-revisions.json` (no note shown, at Khush's request;
  a revision can carry one with `"notes"` if ever wanted). When the new date
  is announced, add the classes on that day the same way.
  The sessions after it are numbered one lower (Khush): Friday 16 Oct's
  Introduction to Financial Markets is session 2 for both sections, not 3.
  Later weeks' PDFs will need the same shift until the postponed class is
  held.

- **14 Oct 2026, PDRM sections, PGDM 2025-27 Term 5.** Khush sent the two
  "APO Groups" lists for Pricing Dynamics and Revenue Management (Section A,
  Section B). Tallied roll by roll against the master data: 139 students on
  each side, 135 agree, every name matches. Four corrections, in
  `data/config/overrides.json`:
  - 250103016 and 250103039: Section A to Section B.
  - 250101149: PDRM Section A added (the course list had no PDRM for him).
  - 250103168: on neither list; most likely dropped PDRM (Khush), so PDRM is
    taken off his courses (`"PDRM": null`); his other courses stay.
  The lists also carry emails, phone numbers and dates of birth; nothing but
  roll, name and section was read. They are kept in
  `all files/_reference/`, which the update does not read, so they are never
  taken for a student list.

- **14 Oct 2026, roll 250103136 (PGDM Marketing 2025-27, Term 5).** The
  course list on file has him in Pricing Dynamics and Revenue Management
  (PDRM) Section A; Khush confirmed Section B. Set in
  `data/config/overrides.json` under `students`. A correction there can now
  name just the course that changes: `"courses": { "PDRM": "B" }` keeps his
  other courses as the file gives them (before, it would have replaced the
  whole list).

- **PGDM 2026-28, Term 2, Week 2, 12 to 18 Oct: a newer version of the whole
  week (received 12 Oct, as a picture of a 240 KB PDF; the PDF on file is the
  earlier 237 KB one, which the mail attachment and the upload page kept
  sending).** All seven days are typed into
  `data/config/weekly-revisions.json` and applied over the PDF. 133 classes
  became 129. Against the earlier PDF:
  - Technology Readiness session 2 is gone everywhere: Mon (Sections E, F)
    and Sun (A, C, D).
  - Section A, Data Analytics and AI for Business: session 3 moved from Tue
    12:15 to Mon 4:00 pm; Tue 12:15 is now session 4; Thu 12:15 is session 5.
  - Section E: Data Analytics session 5 added, Fri 12:15.
  - Section F: Managerial Accounting 5 and 6 (Fri) and 7 and 8 (Sun) removed;
    Business Research 10 added, Fri 2:30; Legal Aspects 2 moved from Sun
    12:15 to Sat 12:15, and 3 from Sun 2:30 to Sun 12:15.
  - Design Thinking: Group 3 sessions 1 and 2 moved from Thu to Fri (Room
    502); Group 6 sessions 1 and 2 from Sat to Thu (Room 503); Group 7 gained
    sessions 1 and 2 on Thu (Room 504), and its 3 and 4 on Sat moved from
    Room 503 to 502.
  - Wed 14 Oct is unchanged.
  If the newer PDF itself is ever uploaded, delete this week's entry from
  `weekly-revisions.json` so the PDF speaks for itself.

- **PGDM 2026-28, Term 2, Week 1, Thu 8 to Sun 11 Oct (received 9 Oct, as a
  picture of the grid):** typed into `data/config/weekly-revisions.json` and
  applied on top of the PDF each time `scripts/update.py` runs, so the PDF is
  untouched. Against the PDF, three things changed:
  - Thu 8 Oct, Section A: Business and Corporate Finance moved from 10:45 am
    to 4:00 pm, and is now session 2 (was 3).
  - Thu 8 Oct, Section B: Business and Corporate Finance moved from 9:15 am
    to 2:30 pm, and is now session 2 (was 3).
  - Fri 9 Oct: Design Thinking Group 1 sessions 1 and 2 added, 2:30 pm and
    4:00 pm, Room 501.
  Sat and Sun are the same as the PDF. Open point: the PDF also has Design
  Thinking Group 1 sessions 1 and 2 on Wed 7 Oct (Room 503). The revision
  covers Thu to Sun only, so Wed is left as the PDF has it.
- **How to enter the next revised schedule:** add the group, the Monday of
  the week and the changed dates to `data/config/weekly-revisions.json`, one
  cell per time slot typed as on the schedule, then run `python
  scripts/update.py`. Every class on a listed date is replaced; other dates
  keep what the PDF says. The run prints how many classes were replaced.

- **8 Oct 2026, DCP 2026-28 Section A.** The first Section A list paired ten
  roll numbers with the wrong names (five pairs swapped). Khush supplied
  "DCP 28 for Term II.xlsx"; the old file was moved to
  `all files/_superseded/`, which the update does not read. Same 47 students
  and rolls, ten names corrected, nothing else changed.
- **8 Oct 2026, DCP 2026-28 Section B.** The same corrected workbook has a
  second sheet, "Section B", which was missed at first because the reader
  only opened a workbook's first sheet. It now reads every sheet. Same 49
  students and rolls, nine names corrected; the old Section B file was moved
  to `all files/_superseded/`. No other workbook on file has more than one
  sheet.

- **8 Oct 2026, BFS 2025-27.** "Section-A BFS-I (2025-27).pdf" received: 77
  students in Section A; the other 73 placed in Section B by rule. It also
  settled roll 250601109's name and added 250601100. Three names are spelled
  differently in this list than in the elective lists; this list's spelling
  is used.
- **8 Oct 2026, DCP 2025-27.** "Course and Section Name - Term V" received:
  160 students, five courses each, with sections (800 rows). No clashes this
  week, and every scheduled course-section has registered students.

- **8 Oct 2026, first uploads from the upload page.** BFS 2026-28 Week 2
  loaded at once. PGDM 2026-28 Week 2 was filed but skipped ("unreadable day
  label: '13, 2026'"): in that PDF the table finder cut the sideways day
  labels into pieces. The reader now takes each row's day from where the day
  label sits on the page (a label is centred in its day's band), and uses
  the text in the row only as a cross-check. The seven weeks loaded before
  came out identical, and the skipped week loaded with 133 classes.

- **9 Oct 2026, BFS 2025-27 Week 2 (12 to 18 Oct).** Received as a PDF in
  chat, filed through `all files/_inbox`. 52 classes, read cell for cell the
  same as the PDF; no classes on Thu 15 Oct. Week 2 is now on file for four
  of six groups; still to come: DCP 2026-28 and DCP 2025-27.

- **9 Oct 2026, two uploads from the upload page: DCP 2025-27 and DCP
  2026-28, both for 12 to 18 Oct.** Week 2 is now on file for all six groups.
  - DCP 2025-27 loaded at once: 39 classes, the same as the PDF cell for
    cell. The college titles this file "Week-3", so the page and the PDF name
    say Week 3 for this group while the other five say Week 2.
  - DCP 2026-28 was filed but skipped ("the PDF text has 44 class entries but
    42 were read from the grid"). Its Design Thinking classes sit in one cell
    merged across both sections, several entries in it, each with its own
    time and room: "DTI- A (1) - NVS [3.45 to 5.00 pm] - 301 DTI - B (1)-NSR
    - 302 [3.45 to 5.00 pm] - 302 ...". The reader now splits such a cell
    (`split_timed` in `scripts/parsers.py`): an entry that names a section
    and fits one time slot becomes that section's class in the room written
    after the time; anything else (here "DTI - C (3 & 4) -SRT - Gurukul",
    3:45 to 6:45 pm) is kept as a note shown to both sections, as in Week 1.
    The week then loaded with 44 classes, and no other week on file changed.
  - **Corrected the same day (Khush): in DCP 2026-28 the letter in "DTI - A",
    "DTI - B", "DTI - C" is a Design Thinking group, not a section,** and no
    list says which roll number is in which group. So all three are listed
    for every DCP 2026-28 student in the group card ("group sessions, attend
    only your own group"), the same way PGDM 2026-28's numbered groups are.
    "(3 & 4)" over 3:45 to 6:45 pm is read as two sessions back to back
    (`parse_group` in `scripts/parsers.py`). Week 1's "DTI- C (1 & 2)" on
    Sat 10 Oct is now read the same way. Week 2 has 46 classes, Week 1 has
    53; no other group's weeks changed.

## Known oddities in the college's files

Shown as printed, not corrected.

- **2025-27 core:** some students have two different courses in the same slot
  (shown with a "Clash" tag). Two rooms each hold two classes at once
  (Chandragupta, Mon 11:45 am: BIBC and CRA; C-403, Fri 2:00 pm: DSCS and EF).
  Fixed Income Securities and Adaptive Leadership have no classes this week.
- **2025-27 core registrations changed:** the registration sheet in
  `all files/` differs from the one received on 6 Oct for 78 students. The
  newer one is used.
- **2025-27 BFS allocation sheet** gives Behavioural Finance the abbreviation
  FIS, the same as Fixed Income Securities; the schedule uses BF. Corrected in
  `overrides.json`.
- **2025-27 BFS "BF Elective Course" list** gives roll 250601109 to two
  different names (rows 50 and 51). Neither is loaded until the file is
  corrected; that roll is greeted without a name. Roll 250601092 is on both
  the BF and the SERM list, so that student is shown both electives. The two
  lists hold 149 distinct rolls against roughly 151 who sat the Sep exams.
- **2026-28 core allocation sheet** abbreviates Data Analytics and AI for
  Business as DIB; the schedule uses DAIB. Corrected in `overrides.json`.
- **2026-28 DCP schedule** has a course IAF that is not on its allocation
  sheet. Named "Introduction to Accounting and Finance" in `overrides.json`
  from the handbook's foundation list; to be confirmed.
- **2026-28 core:** two session counters repeat a number in the week
  (Design Thinking group 10, and Legal Aspects of Business in section C).
- **2025-27 DCP:** Industry Project sections A and B sit in track rows (ITL,
  IBM-A) that they may not belong to.

## Project structure

```
index.html                    Portal
css/styles.css                Shared design system
js/portal-config.js           Settings: lock, pill, study material, upload, tracking, test rolls
js/common.js                  Roll lookup, timeline, greeting, tracking
js/portal.js                  Portal page logic
js/site-data.js               Generated: programmes and timeline
js/roster-data.js             Generated: every student
weekly-seat/                  Weekly page; js/weekly-data.js is generated
exam-seat/                    Exam Seat page, logic, config and data
data/config/                  Hand-edited settings (see above)
data/master/                  Generated master data (see above)
upload/                       The admin upload page
uploads/                      Weekly PDFs sent from the upload page, and its last report
.github/workflows/weekly-upload.yml   Runs the update when PDFs arrive
scripts/update.py             The one update command (--uploads on GitHub)
scripts/parsers.py            Readers for the college's file layouts
scripts/generate_exam_data.py Seating-plan Excel to exam data
docs/IMT.md                   What we know about IMT
design/                       Design system notes and tokens (reference only)
assets/imt-logo.png           Logo
all files/                    The college's files (not published)
```

## Unlocking Exam Seat for the next cycle

1. `python scripts/generate_exam_data.py path/to/SeatingPlan.xlsx` (rewrites
   `exam-seat/js/exam-data.js`; this drops the `TEST` exam entry unless it is
   added back).
2. Update `exam-seat/js/exam-config.js`: period, term label, and
   **`termByBatch`**, the term each batch is being examined on (for the next
   cycle `{ "2027": 5, "2028": 2 }`). That is what switches on matching by
   course list.
3. Check how the plan spells its subjects. Any spelling that is neither a
   course's abbreviation nor close to its name goes into `examAliases` in
   `data/config/overrides.json`, mapped to the course (for example
   `"Derivatives Mnagement": "Financial Derivatives"`), then run
   `python scripts/update.py`.
4. Set `examSeat.locked` to `false` in `js/portal-config.js`. The portal pill
   then shows "Exam seating is live" until it is locked again.

The course lists Exam Seat uses are the same ones Weekly uses
(`data/master/courses.json`, from each term's allocation sheet), so a term
whose weekly schedule works already has what the exams need.

## Testing done

8 Oct 2026, in Chrome against the local server: one student from each of the
six groups plus `TEST` opened Weekly from the portal, with the class count
checked against the master data and a PDF saved for each; the live pill
checked on six dates (shown Monday to Wednesday, hidden from Thursday and in a
week with no data); the alumni greeting and term change checked by date;
unknown rolls and programme codes rejected; Exam Seat lock and `TEST` bypass;
layout at 320, 390 and 768 px for every group. 50 of 50 checks passed, no
console errors. The inbox was tested with renamed copies of a schedule, a
student list and an allocation sheet, and a stray text file.

Also on 8 Oct: today-first ordering on five dates for Weekly and Exam Seat;
the pill on seven dates (green all week, red from the next Monday, hidden in
exams); the upload page against a pretend GitHub at 390 and 1280 px (wrong
key, read-only key, non-PDF refused, one commit to `uploads/_inbox/`, result
and failed-run screens, sign out); the Study Material button.

Exam matching, 8 Oct: a made-up Term 2 / Term 5 seating plan was built
from the real course lists and 152 real students (25 from each of the six
groups, plus two BFS students with no single elective on file). Every one of
their 1,171 papers shared its hall with a paper from another programme,
written five different ways (full name, abbreviation, "&" for "and", capitals,
British or American spelling) plus one deliberate typo handled by an alias.
All 1,171 were shown as exactly the student's own paper. The plan existed
only inside the test browser. This is a simulation: a real plan may spell
subjects in ways it did not cover.

Rollover and early uploads, 8 Oct: tested at fixed moments in India time,
with a copy of this week moved seven days on standing in for "next week"
(only inside the test browser). Thursday 7:59 pm leads with Thursday as
Today, 8:01 pm with Friday as Tomorrow, and the same from a New York
timezone; Sunday 8:01 pm with nothing uploaded turns the pill red; with two
of six programmes uploaded early their students' lists run on into next week
and the PDF is the running week only; on the new Monday the pill for
everyone shows last week's dates in red with none in, the new dates in red
with one or two in, and green from three. 26 of 26 passed.

Not tested: a real second week from the college, which may differ from a
copy of the first.

## Credit

Built by [Khush Goyal](https://www.linkedin.com/in/khushgoyal17/).
