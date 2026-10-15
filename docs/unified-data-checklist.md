# Data checklist for the unified schedule system

Everything the unified system (see `docs/unified-system-plan.md`) needs to
know, with what is already in hand. Kept up to date: whenever a file arrives
or a gap is filled, its row changes here.

**Which stage needs it:** almost all of this list is for **stage B**, which
starts only if IMT gives permission and its requirement list. **Stage A**
(now) needs only what is already in hand plus: the Moodle and ERP addresses
(H2, H1 as links), club and committee contacts for announcements (F7), and
student moderators for the chat (D12). IMT's own requirement list, when it
comes, is added here and may change rows.

Last updated: 15 Oct 2026.

**Status:** **Have** = complete for the current terms. **Partly** = some of
it, or only for some programmes. **Missing** = not received. **Ask** = a
decision or a fact only someone at IMT can give. **System** = created by the
system itself, nothing to collect.

**Sources:** *files* = schedules, allocation sheets and lists in
`all files/`; *handbook* = the student handbooks in `all files/batch
*/handbook/` (PGDM 2025-27; PGDM, Marketing, BFS, DCP 2026-28); *Khush* =
told in chat; *site* = data the current site already keeps.

**Sensitive** marks personal data: collect only if a feature needs it, show
only to those who must see it.

## Summary

| Area | Have | Partly | Missing or Ask | Other |
|---|---|---|---|---|
| A. Institute set-up | 4 | 6 | 6 | |
| B. Programmes and courses | 6 | 8 | 2 | |
| C. Students | 6 | 6 | 5 | 1 made by the system, 1 not to collect |
| D. Faculty and staff | 0 | 4 | 8 | |
| E. Timetable and exams | 5 | 3 | 5 | 1 made by the system |
| F. Campus life | 4 | 5 | 4 | |
| G. Rules from the handbooks | 7 | 2 | 2 | |
| H. Links and integrations | 1 | 2 | 7 | |
| I. Accounts, roles, approvals | 0 | 0 | 8 | |
| **Total (127 items)** | **33** | **36** | **47** | **3** |

The biggest gaps, in the order they block work: faculty list with mails
(D1-D3), room capacities (A6), institute calendar with holidays (A10-A12),
sessions needed per course (B8), student IMT mail IDs (C9), and everything in
section I.

---

## A. Institute set-up

| # | Data | Fields | Status | Where it is now / source | Used for |
|---|---|---|---|---|---|
| A1 | Campuses | Ghaziabad, Dubai | Have | handbook (DCP terms 3-5 in Dubai) | Which classes a DCP batch has where |
| A2 | Buildings and blocks | Name, which rooms | Missing | IT / admin office | Room finder, walking time between classes |
| A3 | Classrooms seen in schedules | Code as printed | Partly: 21 so far (301, 302, 401, 402, 501-504, C-001, C-002, C-101, C-102, C-201, C-202, C-403, Analytics, Gurukul, Old Audi, Chandragupta, Eklavya, Samudragupta) | `data/master/weekly/` | Every class needs a room |
| A4 | Exam halls | Code | Partly: 21 halls from the Sep 2026 seating plan (C401...) | `exam-seat/js/exam-data.js` | Exam Seat, room use |
| A5 | Full room list | Every bookable room, including labs, auditoriums, seminar halls | Missing | Admin / estate office | Free-room finder, events |
| A6 | Room capacity | Seats, exam seats | Missing | Admin office | Capacity check on every class |
| A7 | Room type and equipment | Classroom, lab, auditorium; projector, computers, case-style seating | Missing | Admin / IT | Putting labs in labs ("Analytics") |
| A8 | Time-slot grid per programme | Slot start and end | Have for the six current groups: 2025-27 core 8:45-8:00 pm in 7; 2026-28 core 9:15-5:15 pm in 5; BFS and DCP 9:00-8:15 pm in up to 7 | `data/master/weekly/` (`slots`) | The scheduling grid |
| A9 | Days classes run | | Have: all seven days | files | |
| A10 | Term dates per batch | Term start, end | Partly: 2026-28 all three handbooks; 2025-27 core from handbook and files; 2025-27 BFS and DCP missing | `data/config/timeline.json`, `docs/IMT.md` | Term set-up, alumni date |
| A11 | Exam windows | Mid-term, end-term per term | Partly: end-term dates in timeline; mid-term not | `timeline.json` | No classes during exams |
| A12 | Holidays | Date, name, who is off | Missing | Academic calendar / admin | No classes placed on them |
| A13 | Institute days | Convocation, foundation day, fests, placement days (ADP), SSR visit days | Partly: a few seen in grids ("ADP Placement Process", "SSR Visits") | files | Blocking those days |
| A14 | Session length | | Have: 75 minutes | files, handbook | Slot grid, credits to sessions |
| A15 | Break rules | Gap between classes, lunch break | Partly: a lunch gap visible in each grid | files | Grid rules |
| A16 | Feedback sessions | Mid-term and end-term course feedback, scheduled as a slot in the week | Missing (rule known) | handbook 3.11 | Placing feedback slots in the timetable |

## B. Programmes and courses

| # | Data | Fields | Status | Where it is now / source | Used for |
|---|---|---|---|---|---|
| B1 | Programmes and roll codes | 0101 PGDM, 0102 Finance, 0103 Marketing, 0201 DCP, 0601 BFS, FPM | Have | `data/config/programmes.json` | Everything |
| B2 | Batches | 2025-27, 2026-28 | Have | timeline, students | |
| B3 | Schedule groups | Core (PGDM + Marketing + Finance), BFS, DCP | Have | `programmes.json` | Who shares a timetable |
| B4 | Sections per batch and group | Core 2026-28 A-F; BFS and DCP A, B | Have | files | |
| B5 | Tracks (DCP 2025-27) | AQF, ITL, IBM-A, IBM-B, ITA | Partly: tracks known, students' tracks not | files | DCP timetable |
| B6 | Course list per programme and term | Code as printed, full name | Have for the six current terms (74 courses) | `data/master/courses.json` | Every class |
| B7 | Official course codes | PGPCMM101 and so on | Partly: in the handbooks, not transcribed | handbook course tables | Matching to ERP and Moodle |
| B8 | Sessions required per course | Count (a 3-credit course = 30 hours = 24 sessions of 75 min) | Partly: rule known, per course not confirmed | handbook 2.3 | Counting sessions held and owed, numbering |
| B9 | Credits per course | 2 or 3, non-credit | Partly: in handbooks | handbook | Sessions, attendance rules |
| B10 | Course type | Foundation, core, practice, elective, essential prerequisite | Partly: handbook | handbook | Rules, display |
| B11 | Elective lists by area | Marketing, Finance, HR, Operations, Strategy, IT, Analytics, Economics | Partly: Marketing transcribed; rest in handbook pages | handbook, `docs/IMT.md` | Elective choice, majors |
| B12 | Majors and minors offered | Per programme | Have from handbooks | handbook | Student records |
| B13 | Combined classes | Courses taught to two sections or across programmes together | Partly: seen in grids (DTI groups, DCP "DTI - C") | files | One class, many sections |
| B14 | Group-based courses | Design Thinking groups, SSR teams, APO groups | Partly: group numbers seen; members missing (see C12-C14) | files | Group classes |
| B15 | Prerequisites | Course needs course | Missing | handbook (some marked "EP") | Registration checks |
| B16 | Course outline and session plan | Topic per session, evaluation weights | Missing (lives in ERP) | ERP, faculty | Subject pages |

## C. Students

| # | Data | Fields | Status | Where it is now / source | Used for |
|---|---|---|---|---|---|
| C1 | Roll number | | Have: 1,330 | `data/master/students.*` | Everything |
| C2 | Name | | Have | same | Greeting, lists |
| C3 | Batch, programme, term | | Have | same | Everything |
| C4 | Section | | Partly: 730 have one; Term 4-6 core works by course-section instead (as designed) | same | First-year timetable |
| C5 | Courses with course-section | | Partly: 521 students; 79 DCP 2025-27 missing | same | Second-year timetable |
| C6 | Electives chosen | | Partly: BFS 2025-27 (148), three students unclear | same | Elective classes |
| C7 | Major and minor | | Have for 2025-27 core (359) | same | Records, elective rules |
| C8 | DCP track | | Missing for all 239 DCP 2025-27 | files | DCP timetable |
| C9 | IMT mail ID | e.g. pgp25...@imt.ac.in | Partly: only the 139 on the PDRM lists | `all files/_reference/` | Mail notices, sign-in and tying a person to their record: stage B only. Stage A uses no mail at all (Khush, 15 Oct) |
| C10 | Year (1 or 2) | | Have (from term) | derived | |
| C11 | Campus | Ghaziabad or Dubai | Have (from DCP term) | derived | |
| C12 | Design Thinking group | Group number | Missing, both batches | Program office | DTI classes per student |
| C13 | APO groups | Group per course | Partly: PDRM only | `all files/_reference/` | Group work, group classes |
| C14 | SSR team and mentor | | Missing | Program office | SSR visits |
| C15 | Status | Active, on leave, exchange, withdrawn, alumni | Partly: alumni worked out from dates | timeline | Who gets the timetable |
| C16 | Hostel | Campus or Hindon House | Missing | Hostel office | Bus notices (the handbook's Hindon House transport) |
| C17 | Notification preferences | Instant or digest, channels | System | | Notices |
| C18 | Phone, date of birth, home state, work experience | | Not needed (on the PDRM lists; deliberately not read) | | Sensitive. Do not collect |
| C19 | Leave records | Leave of absence, medical, official events | Missing (in ERP) | ERP | Only if attendance is ever shown |

## D. Faculty and staff

| # | Data | Fields | Status | Where it is now / source | Used for |
|---|---|---|---|---|---|
| D1 | Faculty list | Full name, title | Partly: names in the "Course and Faculty Allocation" PDFs for all six groups (not read into the data, by choice) | files | Faculty timetables, notices |
| D2 | Initials as printed in schedules | e.g. FH, ASP, RKR | Partly: in every weekly PDF | files | Linking schedules to people |
| D3 | Faculty IMT mail | | Missing | Program office / IT | Sign-in, notices, calendar |
| D4 | Department or area | Marketing, Finance, ... | Missing | Program office | Load reports |
| D5 | Type | Full-time, visiting, adjunct | Missing | Program office | Visiting faculty fixed days |
| D6 | Who teaches what | Course, section, term; co-teaching | Partly: in allocation PDFs | files | Clash checks, faculty view |
| D7 | Course coordinators | "Co-Co" per course | Partly: in BFS "Faculty, Course & Co-Co Details" | files | Who approves changes |
| D8 | Availability | Weekly pattern for the term, dates away | Missing (to be entered by faculty) | faculty, in the system | Scheduling |
| D9 | Load preferences | Max classes a day, no back-to-back, preferred slots | Missing | faculty | Humane timetables |
| D10 | Program office staff | Name, mail, programme | Missing | Program offices | Admin accounts |
| D11 | Content owners | Mess committee, transport, clubs, PRISM | Missing | Student council, admin | Their own pages |
| D12 | Moderators for the chat | | Ask | Student council, Committee on Digital Communications | Chat |

## E. Timetable and exams

| # | Data | Fields | Status | Where it is now / source | Used for |
|---|---|---|---|---|---|
| E1 | Weekly classes | Course, section or group, date, slot, room, session | Have: Weeks 1-2 for all six groups | `data/master/weekly/` | Weekly |
| E2 | Changes and reschedules | What, when, why | Partly: by hand in `data/config/weekly-revisions.json` | site | Change log |
| E3 | Postponed classes still owed | | Partly: IFM BFS 2026-28 (15 Oct) | `weekly-revisions.json` | Sessions owed |
| E4 | Exam timetable | Paper, date, sitting | Have: Sep 2026 cycle | `exam-seat/js/exam-data.js` | Exam Seat |
| E5 | Seating plan | Roll, hall, seat | Have: Sep 2026; Term 2/5 plan missing | same | Exam Seat |
| E6 | Exam aliases | Paper name to course | Have | `overrides.json` | Matching |
| E7 | Mid-term exams | | Missing | Program office | Exams, blocking |
| E8 | Improvement exams | | Missing (rules in handbook 3.6) | Exam office | Exams |
| E9 | Makeup classes | | Missing | Program office | Sessions owed |
| E10 | Online or hybrid classes | Mode, meeting link | Missing (handbook 4.1 has guidelines) | Faculty | Class detail |
| E11 | Guest lectures and workshops | | Missing | Program office, clubs | Events in timetable |
| E12 | Placement process days | | Partly: "ADP Placement Process" seen in grids | files, placement office | Blocking days |
| E13 | Exam rules for display | Formal dress, gates close 5 min before | Have | handbook 3.5 | Exam Seat notes |
| E14 | Version history | | System | | Rollback |

## F. Campus life

| # | Data | Fields | Status | Where it is now / source | Used for |
|---|---|---|---|---|---|
| F1 | Mess menu | Date, meal, items | Have to 16 Oct | `data/master/mess.json` | Mess |
| F2 | Mess timings | | Have | same | Mess |
| F3 | Mess committee and rules | Contacts, rules | Partly: rules in handbook 5.10 | handbook | Mess page |
| F4 | Bus timings | Day and night shift, CDL and Campus | Have | `js/bus-data.js` | Bus |
| F5 | Bus stops and what "CDL" is | Full names, where | Partly | Transport office | Bus page |
| F6 | Events | Date, time, place, club, link | Partly: entered by hand | `js/portal-config.js` | Events |
| F7 | Clubs and committees | Name, owner, mail | Missing (handbook names some) | Student council | Events, announcements |
| F8 | Announcements | Who, to whom, when | Missing (some sent by mail) | Program office, clubs | Announcements |
| F9 | Library hours | | Partly: handbook 10.3.2 | handbook | Resources |
| F10 | Important contacts | Office, hostel, medical, security | Missing | Admin, ERP | Resources |
| F11 | Hostel information | Blocks, quiet hours | Partly: handbook 5.4-5.9 | handbook | Resources |
| F12 | Study material links | | Have: SharePoint folder | `portal-config.js` | Resources |
| F13 | Subject material from faculty | Slides per course and session (in Slide Gate), readings | Missing (slides to come through Slide Gate; much else in Moodle) | Faculty, Slide Gate, Moodle | Subject pages |

## G. Rules from the handbooks (these shape what the system checks)

| # | Rule | Status | Handbook | Used for |
|---|---|---|---|---|
| G1 | 1 credit = 10 classroom hours; sessions of 75 min | Have | 2.3 | Sessions per course |
| G2 | Credit structure (107 to 120 credits; core, practice, electives, majors, minors) | Have | 2.3 | Registration checks |
| G3 | Attendance penalty: 3-credit course up to 5 missed sessions, 2-credit up to 3, no penalty; more costs grade steps | Have | 3.3.2 | Showing missed sessions, if attendance is ever added |
| G4 | Leave types: leave of absence, medical, official events with approval | Have | 3.4 | Leave-aware attendance |
| G5 | Course registration windows; no additions after the date | Have | 2.2 | Elective and course changes |
| G6 | Course feedback twice a term, in a scheduled slot | Have | 3.11 | Feedback slots (A16) |
| G7 | Promotion rule (CGPA 5.0, limits on F and D) | Have | 3.9 | Not needed by the timetable |
| G8 | Exam conduct rules | Partly | 3.5 | Exam Seat notes |
| G9 | Social media policy and the Committee on Digital Communications (Faculty-in-charge Media, Social Media Manager, Program Chair, a PRISM student, IT Head) | Partly: read, not yet discussed with them | 6, 6.6.3 | The anonymous chat must sit under this |
| G10 | Sexual harassment policy and complaints procedure | Missing (to read fully) | 5.14 | Chat and IMTinder |
| G11 | Data protection (DPDP Act 2023) duties | Ask | (law, not handbook) | Everything personal |

## H. Links and integrations

| # | Item | Status | Source | Used for |
|---|---|---|---|---|
| H1 | ERP: address, vendor, what it can export or share | Missing. The handbook says the ERP already holds the timetable, attendance, exam schedule, announcements, assignments, elective choice, course outlines and session plans, with its own phone app | IT | Avoiding typing data twice; links |
| H2 | Moodle address and course pages | Missing. Moodle already holds course material, announcements and assignments | IT | Subject pages link to Moodle |
| H3 | Microsoft 365 tenant details for sign-in | Ask | IT | Sign-in |
| H4 | Shared mailbox for sending notices | Ask | IT | Mail |
| H5 | Calendar permission | Ask | IT | Outlook calendar invites for faculty (calendar subscriptions dropped 15 Oct) |
| H6 | Slide Gate (Khush's PPT hosting app, built: `E:\Projects\SlideGate`) | Partly: built and read (upload, share link, release line, signed slide links, Supabase); stays a separate project, linked in (decided 15 Oct). Still needed: course/section/session tags on decks, Microsoft sign-in, the signed pass for enrolled students, timed release, release notices to the unified system | Khush | Subject pages, slide notices, deck analytics |
| H7 | Google Analytics | Have (G-F0R29KD608, 12 custom dimensions) | site | Public traffic |
| H8 | Domain and hosting | Partly: imtneversleeps.com on GitHub Pages; a server will be needed | site | Everything |
| H9 | Placement portal | Missing | Placement office | Placement days |
| H10 | Teams or Zoom for online classes | Missing | IT | Class links |

## I. Accounts, roles and approvals

| # | Item | Status | From | Why |
|---|---|---|---|---|
| I1 | Institute owner for the system | Ask | Administration | Approval, accountability, breach reporting |
| I2 | Agreement of each program office to schedule in the system | Ask | PGDM, DCP, BFS offices | Decides the size of the project |
| I3 | IT security review | Ask | IT Head | Going live |
| I4 | App registration in Microsoft | Ask | IT | Sign-in, mail, calendars |
| I5 | Who is admin for which programme | Missing | Program offices | Roles |
| I6 | Who runs it after 2028 | Ask | Administration, student council | Continuity |
| I7 | Privacy notice and data retention periods | Missing (to be written) | Administration | DPDP Act |
| I8 | Owner and moderators for the anonymous chat | Ask | Student council, Committee on Digital Communications | Chat |

---

## Already in hand, in one place

`data/master/students.json` and `.csv` (students), `data/master/courses.json`
(courses per term), `data/master/weekly/` (timetables), `data/master/mess.json`
(mess), `js/bus-data.js` (bus), `exam-seat/js/exam-data.js` (exams),
`data/config/timeline.json` (terms), `data/config/programmes.json`
(programmes), `data/config/overrides.json` (corrections, electives),
`data/config/weekly-revisions.json` (timetable changes), `docs/IMT.md` (what
the handbooks and files say), and the source files in `all files/`.
