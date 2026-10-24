# IMT Never Sleeps: plan for a unified schedule system

Status: plan. Stage A is to be built now; stages B to D wait (see the
roadmap). Written and revised 15 Oct 2026.

Companion documents: `docs/requirements.md` (every feature, split into
without IMT and needs IMT) and `docs/unified-data-checklist.md` (every
piece of data, with what is in hand).

## The roadmap (decided by Khush, 15 Oct 2026)

| Stage | When | What |
|---|---|---|
| **A** | **Now.** Needs nothing from IMT | Better hosting with a small server of our own, student list kept private, app notifications, announcements, gossip of the day, Moodle and ERP links, dark mode, our own analytics. No mail and no sign-in anywhere |
| **B** | **Only if IMT gives permission and its requirement list** (with the data) | Sign in with Outlook, the smart timetable creator with faculty availability (rule-based, no AI service), notices by official IMT mail, master timetable search with all its variations, dashboards, official status |
| **C** | Later, after B | ERP data straight in, subject pages with Slide Gate, attendance |
| **D** | After everything | IMTinder, its own project |

Until IMT says yes, only stage A is built. Stage B is planned in full so it
can start the day permission and the requirement list arrive; IMT's list may
change parts of it.

**Which stage each section of this plan belongs to:**

| Section | Stage |
|---|---|
| 1. Who uses it (faculty, admin roles) | B |
| 1. Light and dark mode | A |
| 2. Data | B (stage A needs almost none) |
| 3 to 5. Making the timetable, the engine, handling changes | B |
| 6. Notifications | A for app alerts and the in-app list; B for Outlook mail and the morning digest |
| 7. Student side | A for announcements, gossip of the day, Moodle and ERP links, reminders; C for subject pages and Slide Gate |
| 8. Master timetable | A for a lite version (built 19 Oct 2026: hidden address, soft password, five views - rooms board, week by section, find a time, search, checks - from the published weekly schedules, no teachers); B for the full one with official lists, teachers and sign-in |
| 9. Sign-in, privacy and approval | B |
| 10. Security | A for the fixes to the current site; A and B for the rules |
| 11. Analytics | A for our own usage counts; B for dashboards built on official data |
| 12. How it could be built | A sets up the base; B and C add to it |
| 13. Stages in detail | All |

Today the site is read-only for students and is fed by schedules the college
already made (PDFs, Excel sheets, mails). The idea here is to move one step
earlier: the schedule itself is made in this system, by the program office,
from faculty availability and room data, and every student, faculty member
and admin sees the same live version. A change made in one place shows
everywhere and tells exactly the people it affects.

---

## 1. Who uses it and what each one does

| Role | Signs in with | Does |
|---|---|---|
| Student | Roll number now; later their IMT Microsoft account | Sees their week, exam seat, mess, bus, events, announcements, subject material. Gets notified of changes that affect them |
| Faculty | IMT Microsoft account (Outlook) | Marks availability for the term, sees their own timetable, asks for a reschedule, shares material per subject, searches the master timetable |
| Program office (admin) | IMT Microsoft account | Builds and publishes the timetable for their programme, handles changes, posts announcements, manages exams and seating |
| Super admin | IMT Microsoft account | Rooms, slot timings, term dates, holidays, users and roles across programmes |
| Content owners (mess, transport, clubs) | IMT Microsoft account | Each keeps their own part current: mess menu, bus timings, events |

Each programme office (PGDM, DCP, BFS) should only edit its own programme;
rooms and faculty are shared, so clashes across programmes are still checked.

**For every role: light and dark mode.** Every screen (student pages, the
faculty and admin views, the master timetable, and Slide Gate when opened
from here) comes in a light and a dark theme.

- It follows the phone or laptop setting by default, so it turns dark at
  night if the device does.
- A switch in the menu lets anyone choose Light, Dark or Automatic; the
  choice is remembered on that device, and with sign-in, on the account.
- Colours are set once as named tokens and defined twice, so every new
  screen gets both themes for free.
- Both themes are checked for readable contrast (WCAG AA), including the
  coloured pieces: event banners, the "Next" and "Today" tags, timetable
  cells, charts on the dashboards.
- Dark mode is not just inverted colours: event banners, the mess card and
  the bus cards get their own dark versions, and printed pages and saved
  PDFs stay light.

---

## 2. Data the system needs

The full, itemised list, with what is already in hand and where, is kept in
**`docs/unified-data-checklist.md`** (127 items, updated as data arrives).
This section is the overview.

**Found in the handbooks:** the college ERP already holds the timetable,
attendance, exam schedule, announcements, assignments, elective choice,
course outlines and session plans, and has its own phone app; Moodle already
holds course material and announcements. So the unified system should read
from them where it can and link to them, not ask anyone to type the same
data twice. What the ERP can export is the first thing to ask IT (open
question 4).

### The points you listed

| Data | Notes |
|---|---|
| Student: roll, name, batch, programme, year, term, section, electives, major, minor, IMT mail, groups (DTI, APO) | Groups need their own lists; today Design Thinking group membership is unknown |
| Subjects per programme and term | Code, full name, which term, core or elective |
| Timeline: batch, programme, year, term, dates | Already kept in `data/config/timeline.json` |
| Subject and teacher: who teaches what, for which term and section | Some classes have two faculty (for example `BR(9)AKB/FH`) |
| Rooms | Every room, not only classrooms |
| Bus and mess | Already on the site; would move to their owners |

### What is also needed (not in your list)

| Data | Why it matters |
|---|---|
| **Sessions required per course** (and credits) | To know how many classes each subject still needs, and to number sessions automatically |
| **Slot timings per programme** | PGDM runs 9:15 to 10:30, BFS 9:00 to 10:15, DCP 9:00 to 10:15 with evening slots; one grid will not fit all |
| **Room details:** capacity, type (classroom, lab, Gurukul, auditorium), equipment, which building | A 70-student section cannot go in a 40-seat room; "Analytics" is a lab |
| **Institute calendar:** holidays, exam weeks, institute events, convocation, placement days | No classes should be placed on these |
| **Enrolment per student per course** (course + section) | The real source for who attends what; electives and Term 4 to 6 courses work this way already |
| **Combined classes** | One class for two sections, or a group drawn from several sections (DCP "DTI - C") |
| **Faculty details:** full name, initials as printed, department, mail, visiting or full-time | Visiting faculty come on fixed days; initials link the old PDFs to people |
| **Faculty rules:** maximum classes a day, no back-to-back limit, preferred slots | Keeps the timetable humane and avoids later changes |
| **Exam data:** papers, dates, halls, seating plan | Exam Seat already uses this |
| **Change log** | Who changed what, when, and why; needed for trust and for undo |
| **Notification preferences** | Instant or daily digest, mail or app, quiet hours |
| **Clubs and committees** | So events and announcements carry an owner (HAWC, MALCOM, Sports Committee) |

### Data to avoid

The PDRM lists carried phone numbers, dates of birth, home state and work
experience. None of that is needed for scheduling. Keeping less personal data
makes the system safer and easier to get approved (see section 9).

---

## 3. How a term would run

1. **Before the term** the super admin sets term dates, holidays and rooms.
   The program office loads the subjects, sections, enrolments and who
   teaches what.
2. **Faculty mark availability** for the whole term on a simple weekly grid
   (tap to mark a slot unavailable), plus specific dates they are away.
   The system reminds anyone who has not filled it in by a deadline.
3. **The program office builds the timetable.** Two ways, both useful:
   - by hand on a week grid, where every placement is checked live (see 4);
   - or "draft for me": the system proposes a whole term that respects all
     the rules, and the office adjusts it.
4. **Publish.** Students and faculty see it at once.
5. **During the term,** every change goes through the same checks, is logged,
   and notifies only the people it touches.

---

## 4. The scheduling engine (the heart of it)

### Checks on every placement

| Check | Example it catches |
|---|---|
| Faculty is free and available | Two sections given to the same teacher at 10:30 |
| Room is free and big enough | Two classes in C-201; 70 students in a 40-seat room |
| No student has two classes at once | An elective clashing with a core class for some students |
| Section has no other class then | |
| Not on a holiday or exam day | |
| Course still needs sessions | Stops a course getting 22 sessions when it needs 20 |
| Faculty daily limit and gaps | A fourth class in a row |

Each check shows as a clear warning with the reason. The office can still
override with a note, since real life has exceptions.

### Find a slot

For any class that has to move: "show me every time this week or next when
this faculty member, this section and a suitable room are all free", ranked
by how little it disturbs. This is the tool that makes rescheduling quick.

### Session numbers are never typed

A session number is worked out from the order of that course's classes for
that section, counting only classes that are held or still planned. If a
class is cancelled or postponed, every later session renumbers itself, on
every screen and in every notice. (This is exactly what had to be done by
hand for Introduction to Financial Markets on 15 Oct.)

### Status of each class

Planned, held, cancelled, postponed (date to be fixed), moved. A postponed
class stays visible to the office as "owed" until it is placed again.

### Versions

Every publish is a version. The office can see what changed between two
versions and roll back a mistake.

---

## 5. When something changes (the loophole you named)

Example: a faculty member says on Monday they cannot take Thursday's classes.

1. They mark Thursday unavailable (or the office does it for them).
2. The system lists every published class affected, across all sections.
3. For each, the office sees suggested new times from "find a slot", or can
   cancel and mark it owed.
4. On saving, session numbers after it renumber, clashes are rechecked, and
   the change log records it with the reason.
5. Notifications go out, but only to the students in those sections, that
   faculty member, and anyone whose room is affected. The message says
   exactly what changed: "Business Research, Section A: Thu 9:15 moved to
   Fri 2:30, Room 501. Session numbers after this are one lower."

Safeguards:

- **A short hold before sending** (for example 10 minutes) so a mistake can
  be undone before anyone is mailed.
- **Several edits become one message,** so a student gets one mail for a
  reshuffled day, not six.
- **Two admins editing at once:** the second sees that the week changed and
  must reload, so nobody overwrites another's work.

---

## 6. Notifications

| Channel | Use | Notes | Stage |
|---|---|---|---|
| In-app list | Everything, kept as a history | Always available | A |
| Push on phone | Changes for today and tomorrow, reminders before class, announcements, events | Tied to the roll number the phone remembers, no sign-in. On iPhone this works only once the app is added to the home screen (iOS 16.4 and later) | A |
| Outlook mail | Changes, the weekly schedule, announcements | Sent through Microsoft Graph from a shared IMT mailbox, so it lands like any college mail | B |
| Morning digest | "Your day" at 7 am, by mail | Optional | B |

A calendar subscription (a live calendar link per person) was considered and
dropped on 15 Oct 2026: app notifications cover the same need, sooner.

Everyone chooses instant or digest. Changes inside the next 24 hours always
go out at once.

---

## 7. Student side

| Feature | Notes | Stage |
|---|---|---|
| Weekly, exam seat, mess, bus | As today (from the PDFs); fed live from the system in B | Live, then B |
| Announcements | From clubs, committees and the student council in A; from program offices in B. Targeted: whole institute, a programme, a batch, a section, a course | A, then B |
| Resources | Moodle and ERP links, bus, mess, student handbook | A |
| Gossip of the day | An anonymous chat for students; see below | A |
| Reminders before class and events | Push notifications; the "coming soon" already promised on the promo | A |
| Subject pages | One page per course the student takes: faculty, schedule of sessions, material, announcements for that course | C |
| Faculty material (slides, PPTs, projects) | Through Slide Gate (below); OneDrive or Moodle as fallbacks | C |

**Gossip of the day, as an anonymous chat.** Students talk freely without
names showing. This is the riskiest feature in the plan, so it needs rules
built in from the first day:

- **No mail, no sign-in in stage A (decided 15 Oct 2026).** Mail-based
  sign-in is kept for stage B. Until then the chat works like this:
  - **Getting in:** the roll number the phone already remembers, plus a
    **join code** shared only in the official batch WhatsApp groups and
    changed every week or two. Outsiders who guess a roll number still lack
    the code.
  - **Who posted:** each phone gets a random private ID the first time.
    Posts carry no name; the ID lets moderators hide everything from one
    phone, slow it down or block it.
  - **Bots:** an invisible check (for example Cloudflare Turnstile) before
    the first post.
  - **New phones on probation:** their first few messages wait for a
    moderator, or post with tighter limits.
- **What this cannot do, said plainly:** a blocked person can come back by
  clearing the app's data or using another phone; and a post can be traced
  only to a phone and network, not to a person. Serious complaints (threats,
  harassment) can then only be handled with the college's help. Stage B's
  Outlook sign-in closes both gaps: the chat moves to verified IMT accounts,
  still shown anonymously.
- **Moderation:** a report button on every message, messages hidden after a
  few reports until a moderator looks, a word filter, and an automatic block
  on phone numbers, roll numbers and full names of people.
- **Limits:** a few messages a minute per person, messages disappear after a
  day or a week, no images at first.
- **Rules shown before first use,** and agreed to.
- **Run by students, kept apart from the official system:** its own database
  and its own owner (for example the student council), so the institute's
  timetable system never carries anonymous posts, and a problem in the chat
  cannot touch schedules or student records.
- **Legal:** a platform hosting user posts in India has duties under the IT
  Rules 2021 (for example a grievance contact and acting on complaints within
  set times). Worth a check with someone who knows the law before launch.

**IMTinder (later, as its own project).** Kept out of this plan on purpose,
to start only once everything here is done. When it comes, it needs stricter
care than the chat: opt-in only, nothing shown until both people match,
blocking and reporting, no way to look anyone up, IMT sign-in to stop fake
profiles, photos and details deleted when someone leaves, and a clear owner.

**Slide Gate, for faculty slides.** Slide Gate is Khush's own app, already
built (`E:\Projects\SlideGate`, a separate project; read on 15 Oct 2026, not
changed). What it does today:

- A teacher uploads a `.ppt`, `.pptx` or `.pdf`; a conversion service turns it
  into one image per slide.
- The teacher gets **one share link** per deck and moves a **release line**
  after each class: students see only the slides released so far, and the
  rest appear the moment the line moves.
- Locked slides are never sent to the browser at all: one small public
  function hands out short-lived (60-second) signed links only for released
  slides, and is rate-limited.
- Teachers sign up with email and password and see only their own decks
  (database row-level security).
- Built on React and Vite with Supabase (PostgreSQL, sign-in, file storage,
  server functions); the converter runs as its own small service.
- The database already has a field for a scheduled release time
  (`auto_unlock_at`), not yet used by the app.

**Decided (15 Oct 2026): Slide Gate stays a separate project, linked in.**
It keeps its own code, database, storage and deployment, and keeps working on
its own for any teacher with or without the unified system. The unified
system links to it; neither reaches into the other's database.

**How the link works.**

| Join | How | What it gives |
|---|---|---|
| A deck is tagged with a course, section and session | When a faculty member adds a deck, they pick the course and section (and optionally the session) from a list the unified system provides; Slide Gate stores only those IDs | Each subject page shows "Session 7 slides" next to Session 7 |
| Subject pages show the decks | The unified system asks Slide Gate for the decks tagged with a course and section, through a small read-only interface | Students find slides where they already look |
| The same IMT sign-in in both | Both projects sign people in with their IMT Microsoft account (each registered with IMT's Microsoft tenant), so a faculty member is the same person in both, matched by mail | No second password, and decks map to the right teacher |
| Only enrolled students open a deck | When a student taps a deck on their subject page, the unified system checks the enrolment and gives a short-lived signed pass; Slide Gate's public function accepts the pass instead of (or as well as) the plain share link | Slides stay inside the section, without Slide Gate keeping its own copy of enrolments |
| Release follows the timetable | The unified system tells Slide Gate when each session ends (and again if the class moves); Slide Gate's scheduled-release field releases that session's slides then | Slides appear after class with no manual step, and a rescheduled class moves the release too |
| "New slides" notices | Slide Gate tells the unified system when slides are released or a deck changes; the unified system sends the notice | One notification system for everything, to that section only |
| Opens per deck and section | Slide Gate reports counts per deck; the unified system knows the sections | The faculty "My courses" dashboard, without naming students |

The interface between them is small: course and section lists out of the
unified system; deck lists, release events and counts out of Slide Gate; a
signed pass and session end times into Slide Gate. Each side keeps its own
secret for checking the other's messages.

**Same foundation, two projects.** Both on Supabase (PostgreSQL with
row-level security, sign-in with a Microsoft provider, storage, server
functions) and React with Vite: the same tools and security habits, but two
separate Supabase projects with separate data.

**Before linking them, in Slide Gate:**

- Teacher sign-in is email and password with open sign-up; for IMT it would
  switch to Microsoft sign-in, limited to `@imt.ac.in`.
- Students reach decks by link only; checking "is this student enrolled in
  this section" would be added to the public function.
- `supabase/functions/.env` is tracked in Git. Today it holds only a public
  address, but any secret added there later would be committed; it belongs
  in `.gitignore`, like `.env.server` already is.
- The scheduled-release field needs the code that acts on it.

---

## 8. Master timetable (faculty and admin)

Search and filter from any side:

- by roll number (one student's full week),
- by course and section,
- by faculty,
- by room ("what is in C-201 on Thursday"),
- by date or date range,
- by programme or batch.

Plus three finders:

- **Free rooms** at a given time, with capacity.
- **Free faculty** at a given time.
- **Common free time** for a set of sections (for a guest lecture or a
  makeup class).

And views: room use across the week (which rooms sit empty), faculty load
per week, sessions held against sessions required for every course.

---

## 9. Sign-in, privacy and approval

### Sign in with Microsoft (Outlook)

IMT runs on Microsoft 365 (`@imt.ac.in` addresses). "Sign in with Microsoft"
uses that: no new passwords, and access ends when someone leaves IMT.

- It needs **IMT's IT team** to register the app in IMT's Microsoft tenant
  and approve it. This is the first real dependency on the institute.
- Roles (student, faculty, admin) come from a list the super admin keeps, or
  from Microsoft groups IT already has.
- Students can move from roll number to Microsoft sign-in later; their mail
  is already in the PDRM lists (`pgp25...@imt.ac.in`).
- Sending mail and writing to calendars through Microsoft Graph needs the
  same approval.

### Privacy

- India's data protection law (DPDP Act, 2023) applies to student data:
  collect only what the system uses, say why, protect it, delete it when no
  longer needed (for example a year after a batch becomes alumni).
- Each role sees only what it needs: a student sees their own data; faculty
  see their sections; admins see their programme.
- Every change to student or schedule data is logged with who made it.
- No phone numbers or dates of birth unless there is a real use.

### This stops being an unofficial student tool

A system that the program office uses to make the real timetable and that
mails faculty is institute infrastructure. It needs:

- agreement from the program offices and the administration to use it,
- an owner on the institute side,
- a security check by IT,
- a plan for who runs it after you graduate in 2028.

This is the biggest question in the whole plan, bigger than any technical
one.

---

## 10. Security

### What the system protects

Student and faculty records, enrolments, faculty availability (it reveals
when people are away), the timetable itself (a wrong change misleads
hundreds of people), the mailing ability (a hijacked sender can phish the
whole institute), and the chat.

### What needs fixing in the current site first

These are true today and should be dealt with whatever happens to the plan:

| Issue | Why it matters | Fix |
|---|---|---|
| The repository is public and holds the full roster: roll numbers, names, programmes, sections, courses (`data/master/students.csv`, `students.json`, `js/roster-data.js`) | Anyone can look up any student by roll number, or download the whole list | Short term: make the repository private and publish only the built site (needs a paid GitHub plan or another host, since free Pages needs a public repo). Stage A: done with the move to better hosting. Stage B: the roster lives behind Outlook sign-in |
| Any roll number opens that student's name and timetable, with no sign-in | Anyone who knows or guesses a roll number sees where that person will be all week | Accepted in stage A as the price of no sign-in (decided 15 Oct 2026); closed in stage B by Outlook sign-in |
| The upload page uses a GitHub access key pasted into the browser, and one key was shared in a chat earlier | A leaked key can change the site | Stage A: keep keys short-lived and limited to this one repository; move uploads to our own server with the new hosting. Stage B: admin sign-in with Outlook |

### Rules for the new system

**Sign-in and roles**
- Microsoft sign-in only, with two-step verification enforced by IMT IT. No
  passwords stored by us.
- Sessions in secure, short-lived cookies; signing out everywhere is possible.
- Every request is checked on the server for role and scope (a DCP admin
  cannot edit PGDM; a student sees only their own record). The database
  enforces this too (row-level security), so one missed check in the code
  does not expose data.

**Data**
- HTTPS only, encrypted storage and backups. Daily backups, and a restore
  tested every term.
- Collect the minimum (section 2). Faculty availability visible to admins
  only.
- A log of every change to people and schedules: who, what, when, why. Admin
  actions that touch many records (a bulk import, a week deleted) need a
  second confirmation and are flagged.
- Usage tracking stays as now: no roll numbers or names sent to analytics.

**Microsoft access**
- Ask IT only for what is needed: sign-in, sending mail from **one** shared
  mailbox (restricted to that mailbox by IT), and writing calendar events.
- The app's secret lives only on the server, never in the code repository,
  and is rotated on a schedule and whenever someone with access leaves.

**The code**
- Everything users type (announcements, chat, material titles) is escaped
  before display, so no one can plant a script for others to run.
- Database queries are parameterised; forms are protected against forged
  requests; a content security policy limits what the pages can load.
- No file uploads at first; material is linked from OneDrive or SharePoint,
  which do their own scanning. If uploads come later: type and size limits
  and a virus scan.
- Limits on how fast anyone can call the server, to stop scraping and abuse.
- Dependencies kept up to date, with alerts for known vulnerabilities.

**Mail**
- Mail comes only from the official IMT domain and shared mailbox, with the
  same look every time, and never asks anyone to sign in from a link in the
  mail. Students and faculty learn that a real notice never asks for a
  password, which makes phishing in the system's name easier to spot.

**When something goes wrong**
- A named person to contact, a way to switch off sending and posting at
  once, and steps to rotate keys.
- Under the DPDP Act a personal-data breach must be reported to the Data
  Protection Board and the people affected; the institute's owner (section 9)
  is who does that, which is another reason the system needs one.

---

## 11. Analytics and reporting

### Why today's analytics fall short

Google Analytics was the right start for a static site, but it cannot give
the detailed picture wanted here:

| Limit | Effect |
|---|---|
| Blocked by many browsers and ad blockers (Brave blocks it by default; Safari limits it) | Every number is an undercount, by an unknown amount |
| Knows browsers, not people | One student on phone and laptop is two users; nobody is counted per section reliably |
| Cannot see the schedule | It knows a page was opened, not which class, room or faculty the student was looking at |
| No sign-in | Cannot say "38 of 62 students in DCP Section A saw the change" |
| Limits on custom details (50), sampling, thresholds, a day's delay | Small groups vanish, detail runs out |
| Offline opens are lost | Only recovered as a count, as now |

### Two kinds of numbers

**1. How the institute runs** (from the system's own records, needs no
tracking at all, because the timetable, changes and notices all live in the
database):

| Question | Measured by | Cut by |
|---|---|---|
| How full are the rooms? | Hours booked against hours open | Room, building, day, slot, week |
| Which rooms sit empty when? | Free slots | Room, slot |
| Is each course on track? | Sessions held against sessions required; sessions owed (postponed, not yet placed) | Course, section, faculty, programme |
| How stable is the timetable? | Changes per week; changes made under 24 hours before the class; reasons | Programme, course, faculty, week |
| How even is faculty load? | Classes per day and week; back-to-back runs | Faculty, department |
| How often are rules overridden? | Clash and capacity overrides, with reasons | Programme, admin, rule |
| Do changes reach people in time? | Time from publish to the first view by each affected student; share who saw it before the class | Change, section, channel |
| Do notices land? | Mails delivered and opened; push delivered and tapped | Channel, programme, section |
| Are faculty filling availability? | Share filled by the deadline; late changes to it | Faculty, department |

**2. How students and faculty use it** (first-party usage events, see below):

| Question | Measured by | Cut by |
|---|---|---|
| Who uses it? | Weekly active people as a share of each group | Programme, batch, section, role |
| When do they need it? | Opens by hour; time to the next class at open | Day, hour, section |
| What do they look at? | Views of each part (weekly, exam, mess, bus, events, subject pages) | Part, section |
| What do they look for in the master timetable? | Searches by kind (roll, course, room, faculty); empty results | Role, kind |
| Bus demand | "Next bus" checks by hour and direction | Hour, day |
| Mess interest | Views by meal and day ahead | Meal, day |
| Event reach | Views, link taps, registrations started | Event, club, programme |
| Subject material | Opens per item | Course, section, faculty |
| App adoption | Installs, push permission | Programme, device |
| Problems | Errors, slow pages, failed searches, offline opens | Page, device |
| Chat health | Posts, reports, removals, response time to reports | Day |

### How it would be built

- **Own events, not only Google.** Each action is recorded by the system's
  own server, on the same address as the site, so ad blockers do not drop
  it. Google Analytics can stay for public traffic and campaign links.
- **One event shape for everything:** time, a pseudonymous person ID (not
  the roll number), role, programme, batch, section, page, action, and what
  it was about (course, section, room, faculty, session, event), plus app or
  browser, phone or laptop, and online or offline.
- **Offline actions are kept on the phone and sent later,** with their real
  time.
- **Joined with the schedule:** because events name the course, room or
  session, any number can be cut by any of them.
- **Dashboards** in a ready-made tool reading the same database (for example
  Metabase, free and self-hosted, or Looker Studio), one per audience:

| Dashboard | For | Shows |
|---|---|---|
| Programme | Each program office | Course progress, sessions owed, changes and their reach, room use, faculty load, usage by section |
| Institute | Administration | Room use across buildings, timetable stability, adoption across programmes |
| My courses | Each faculty member | Their sessions held and owed, material opens, how many of their students saw a change |
| Product | You | Usage, retention, funnels (open to schedule to calendar), errors, performance |

### Privacy rules for analytics

- Reports show groups, never one named student. A group smaller than five
  people is not shown, so nobody can be singled out.
- The person ID in events is pseudonymous; the link to the real person is
  kept apart and used only for the "who saw the change" count.
- Raw events kept 13 months, then only the totals.
- Faculty see their own courses only; admins see their programme.
- Stated plainly in a privacy notice: what is measured and why.

### Until then (current site)

The current numbers are an undercount, most of all among students on Brave
and iPhones, so read them as trends, not totals. The fix needs a server of
our own, which comes with the better hosting in stage A, so first-party
analytics starts there; the dashboards on official data wait for stage B.

---

## 12. How it could be built

### What changes from today

Today: a static site on GitHub Pages, data built from files by a Python
script on a laptop. That cannot take logins, edits from many people,
notifications or a live timetable. A unified system needs a server, a
database and sign-in.

### Two ways

| | A. Microsoft tools | B. Own web app |
|---|---|---|
| What | SharePoint lists for data, Power Apps for screens, Power Automate for mail | The current site grown into a full app, with a database and a small server |
| Sign-in and mail | Built in | Through Microsoft sign-in and Graph |
| Cost | Inside IMT's Microsoft licence | Low: a hosted database and server, roughly free to a few thousand rupees a month at this size |
| Fits the scheduling rules (clashes, find a slot, renumbering, auto-draft) | Poorly; this logic is hard in Power Apps | Well |
| Student experience | Plain | As good as today, and keeps the installed app |
| Who can maintain it later | IMT IT already knows these tools | Needs someone who can code |

**Suggestion:** B for the system itself, using Microsoft only for sign-in,
mail and calendars, and built on the same base as Slide Gate (Supabase:
PostgreSQL with row-level security, sign-in with a Microsoft provider,
storage and server functions; React and Vite for the screens), the same
tools as Slide Gate. Slide Gate stays its own project with its own data; the
two are linked (section 7). A relational database (PostgreSQL) suits this data well.
The scale is small (about 1,400 students, 100 faculty, 50 rooms, a few
thousand classes a term), so performance is not a concern.

### What carries over

The student pages, the installed app, the mess, bus and events, the usage
tracking and the PDF readers. The readers stay useful during the switch:
schedules made the old way can still be read in until every programme
schedules inside the system.

---

## 13. Stages in detail (Khush's roadmap, 15 Oct 2026)

Build everything that needs no IMT approval now, on better hosting. Stage B
starts **only if IMT gives permission and its requirement list**, with the
data; then the later add-ons.

| Stage | What | Needs from IMT |
|---|---|---|
| **A. Now, without IMT** | Better hosting with our own small server and database (the base everything after builds on). Student list kept private. Notification system in the app, tied to the roll number the phone already remembers (no sign-in). Announcements. Moodle and ERP links. Dark mode. First-party analytics. Gossip of the day, with moderation, a join code and no mail or sign-in (mail is kept for stage B) | Nothing (tell the Committee on Digital Communications before the chat goes live) |
| **B. Only if IMT gives permission and its requirement list** | Sign in with Outlook. Timetable creator, a smart tool that decides on its own rules with no AI service behind it (see "A tool that decides by itself" below): faculty availability, clash checks, find a slot, session numbers that fix themselves, change history, and "draft it for me". Notifications by official IMT mail. Master timetable search with all its variations (roll, course, section, room, teacher, date; free rooms, free teachers, common free time). Programme and institute dashboards. Official status: owner, IT security check, privacy notice | The data (section 2 and the checklist), IT for Outlook sign-in and mail, one program office to pilot |
| **C. Later** | ERP data straight in. Subject pages with Slide Gate slides. Attendance | IT and the ERP vendor; faculty using Slide Gate |
| **D. After everything** | IMTinder, as its own project | |

Each stage is useful on its own, so the work can stop at any point and still
leave something working. Stage A's server and notifications are built so
that stage B only adds to them (Outlook sign-in, official mail alongside app
alerts), with nothing rebuilt.

**Notifications without sign-in (stage A).** When a student allows
notifications, the phone registers with the roll number it already
remembers. Schedule changes for that roll's section or courses are sent to
it. Nothing is checked, so someone could register another person's roll,
but they would only receive timetable alerts, which the site already shows
for any roll. Anything private (the chat, later personal data) waits for
proper sign-in.

### A tool that decides by itself, not an AI

The timetable creator must make its own decisions every time, without
calling an AI service and without anyone (including an AI assistant) fixing
schedules by hand as has been done so far. That rules out language models
inside the tool and means:

- **Fixed rules, written down:** the checks in section 4 (faculty free,
  room free and big enough, no student clash, holidays, sessions needed,
  daily load) are plain code. The same input always gives the same answer.
- **A scheduling solver for the hard part:** "find a slot" and "draft the
  term" use an open-source constraint solver (for example Google OR-Tools),
  the standard tool for timetabling. It runs on our own server, costs
  nothing per use, and works offline from any outside service.
- **Explains itself:** every suggestion says why ("Fri 2:30: teacher free,
  Section A free, Room 501 free, 62 seats for 58 students"), and every
  refusal names the rule that blocked it, so the program office can trust
  it and override with a reason.
- **Handles changes end to end:** a cancelled or moved class renumbers later
  sessions, rechecks clashes, logs the change and notifies the people
  affected, all in one step. The hand edits in `weekly-revisions.json`
  (postponed classes, renumbered sessions) are exactly what this replaces.
- **Tuned by settings, not code:** weights such as "avoid back-to-back for
  faculty" or "keep a course's sessions on separate days" are settings the
  super admin can change.
- **Tested on real terms:** before a pilot, it is run on past weeks'
  timetables to check it reaches the same or better results.

---

## 14. Open questions

1. Will the program offices make the timetable here, or keep making it as
   now and only publish here? (Changes the whole size of the project.)
2. Who at IMT owns it, and who runs it after 2028?
3. Will IT register the app for Microsoft sign-in and allow sending mail?
4. Does the ERP already hold students, enrolments or rooms, and can it export
   them? Typing them twice would cause the same mismatches seen with PDRM.
5. Slide Gate (separate project, linked in, decided 15 Oct): is any faculty
   member using it yet, and should the signed pass replace the plain share
   link for IMT decks or sit alongside it?
6. Who moderates the anonymous chat, and who may open the private record
   behind a reported post?
7. Should students also sign in with Microsoft, or keep the roll number?
8. Who decides when a faculty request clashes with another programme's
   timetable?
9. Which dashboards matter most to the program offices and administration,
   and who should see faculty-level numbers (load, changes)?
