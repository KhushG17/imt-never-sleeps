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

| Part | Status |
|---|---|
| Portal (roll number, greeting, two buttons, live pill) | Built |
| Weekly | Built for all six batch-and-programme groups, week of 5-11 Oct 2026 |
| Exam Seat | Built, locked. Each student sees their own term: "Term 5 exams coming soon" or "Term 2 exams coming soon" |
| Master data from the college's files | Built: 1,328 students, 6 course lists, 6 weekly schedules |
| Weekly update | From the upload page in a browser (weekly PDFs), or one command on Khush's machine (everything) |
| Usage tracking | On (Google Analytics 4) |
| Study Material | Built: icon in the header next to Feedback, opens the term-wise SharePoint folder |
| Upload page | Built at `/upload/`; needs an access key created once by Khush |
| Published | Yes, but the live site still shows the build of 7 Oct. The master-data build of 8 Oct is local only until pushed |

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
- **The class count is of classes still to come** (10 Oct): the badge under
  the name reads "21 classes left". It counts the day on top and every day
  after it, across all the weeks listed, and drops a whole day at a time,
  when that day gives way to the next (after the student's last class, or at
  8 pm). Days under "Earlier this week" are not counted. The PDF still lists
  and counts its whole week.
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
  - It is the one exception to the day change (decided 9 Oct): on its date
    it stays on top with a Today tag until the date ends (midnight IST),
    even after the schedule has moved on to tomorrow's classes (after the
    student's last class, or at 8 pm). From the next date it is gone.
  - It is never part of the PDF.
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
`js/portal-config.js`; set it to `""` to switch off).

| Question | Where to read it |
|---|---|
| How many people came | Users and page views (automatic) |
| How many typed a roll number | Event `roll_search`, `result` = `found`, `batch_only`, `not_found` |
| How many opened Weekly, Exam Seat or Study Material | Event `tool_open`, by `tool` (`weekly`, `exam_seat`, `study_material`), with `status` (`shown`, `locked`, `no_schedule`, `no_roster`, `no_seat`, `alumni`) |
| How many saved a PDF | Event `save_pdf`, by `tool` |
| How many added to calendar | Event `add_to_calendar`, by `tool` |
| How many tapped Exam Seat while locked | Event `locked_tool_click` |

Every event carries `batch`. `tool`, `status`, `result` and `batch` are
registered as event-scoped custom dimensions. Never sent: roll numbers, names,
courses. Page addresses and referrers are sent to Google without anything
after the "?", because ours carry `?roll=`. **Until 8 Oct 2026 they were sent
whole**, so roll numbers (never names) reached Google Analytics inside page
addresses from 6 to 8 Oct; that is fixed, and the stored addresses can be
removed in GA with a data deletion request (Admin, Data deletion requests,
parameter `page_location` and `page_referrer`). `TEST` is not counted. Calendar icons clicked inside a downloaded PDF
cannot be counted.

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

## Skipped for now

- Faculty names (decided against).
- Hero bubbles: tried twice, removed.
- An `.ics` calendar download (Google Calendar links only).

## What is left

1. Khush creates the access key for the upload page (see "Uploading from the
   browser") and tries a real upload.
2. UI and content changes (next round).
3. Load the Term 2 and Term 5 seating plan when it is released (see
   "Unlocking Exam Seat"). The matching of each student to their own paper
   is built and simulated; it has not met a real Term 2/5 plan yet.
4. Push the 8 Oct build to the live site (see Privacy below).

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

## Corrections received

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
