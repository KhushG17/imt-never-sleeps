# IMT Never Sleeps: requirements, split by who has to say yes

Two lists:

1. **Without IMT** (stage A): things students can build and run on their
   own. **This is what gets built now.**
2. **Needs IMT** (stages B and C): things that need the institute's people,
   systems, data or permission. **Built only if IMT gives permission and its
   requirement list.**

The split and the roadmap are Khush's (15 Oct 2026). Last updated: 15 Oct
2026. Companion documents: the plan (`docs/unified-system-plan.md`) and the
data list (`docs/unified-data-checklist.md`).

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

---

## Already live (no IMT involvement)

Weekly schedule by roll number for all six programmes, exam seat, mess menu,
bus schedule with the next bus, campus events, add a
class to Google Calendar, remembered roll number, installable app that works
offline and updates itself, the upload page, usage counts.

---

## 1. Without IMT (stage A, now)

| # | Feature | In easy words | What it needs |
|---|---|---|---|
| S1 | Announcements | Clubs, committees and the student council post notices; students see the ones meant for them | Club accounts we create; someone in each club to post |
| S2 | Gossip of the day | An anonymous chat for IMT students | No mail and no sign-in: entry with the remembered roll number plus a join code shared in the batch WhatsApp groups and changed regularly; a private random ID per phone for moderation; a bot check; student moderators; rules agreed before launch. It falls under the handbook's social media policy, so tell the Committee on Digital Communications before launch. Moves to Outlook sign-in in stage B |
| S3 | Moodle and ERP links | Two links in Resources | The two addresses |
| S4 | Notification system (app) | Alerts on the phone: a class moved, a class in 30 minutes, new announcements, events | No sign-in: the phone registers with the roll number it already remembers. On iPhone it works only after "Add to Home Screen" |
| S5 | Dark mode | Light and dark themes, following the phone, with a switch | Nothing. **Built 19 Oct 2026, live 20 Oct 2026** |

**Behind the scenes:** S1, S2 and S4 need a small server and database of our
own (Supabase, free to low cost), set up with the better hosting. **No mail
and no sign-in anywhere in stage A** (Khush, 15 Oct 2026); mail belongs to
stage B. Notifications use the roll number the phone remembers; the chat
uses that plus a join code (S2).

**The trade-off for the chat without mail:** a blocked person can return by
clearing the app or using another phone, and a post can be traced only to a
phone and network, not a person. Moderation, the join code and limits on new
phones keep this manageable; stage B's Outlook sign-in removes it.

---

## 2. Needs IMT (stage B, and C where marked)

Nothing here is built until IMT gives permission and its requirement list.
Items marked **C** come after the rest of stage B.

### Making the timetable

| # | Feature | In easy words | Who at IMT |
|---|---|---|---|
| O1 | Timetable made inside the system | The program office builds the weekly timetable here instead of in Excel and PDF, with a smart tool that decides on fixed rules and a scheduling solver, not an AI service, so it never needs someone to fix things by hand | Program offices (PGDM, DCP, BFS), Dean (Academics) |
| O2 | Faculty availability | Teachers mark, for the whole term, when they can and cannot teach | Program offices, faculty |
| O3 | Clash checks | The system stops two classes in one room, a teacher in two places, or a student in two classes at once | Comes with O1 |
| O4 | Find a new slot | When a class must move, the system shows the times that work for teacher, section and room | Comes with O1, O2 |
| O5 | Session numbers that fix themselves | If a class is cancelled or moved, all later session numbers update everywhere | Comes with O1 |
| O6 | Change history | Every change is recorded: who, what, when, why; a wrong change can be undone | Comes with O1 |

### Seeing the timetable

| # | Feature | In easy words | Who at IMT |
|---|---|---|---|
| O7 | Master timetable | Faculty and admins search by roll number, course, section, room, teacher or date | Program offices (needs O1 and official lists). **A lite version exists since 19 Oct 2026** (stage A: hidden address, soft password, no teachers, from the published weekly schedules); this item is the full one |
| O8 | Free room and free teacher finder | Which rooms and which teachers are free at a given time | Admin office (room list), program offices |
| O9 | Faculty's own timetable | Each teacher sees their own week | Program offices, faculty |
| O10 | Subject pages (C) | One page per course: sessions, teacher, slides, notices | Program offices, faculty |
| O11 | Slides in subject pages (Slide Gate) (C) | Teachers' slides appear next to each session, for enrolled students only | Faculty; Slide Gate stays a separate project, linked in |

### Signing in and getting messages

| # | Feature | In easy words | Who at IMT |
|---|---|---|---|
| O12 | Sign in with Outlook | Faculty, admins and students sign in with their IMT Microsoft account | IT Head |
| O13 | Mail from an official IMT address | Change notices and announcements arrive as normal IMT mail | IT |
| O14 | Outlook calendar invites for faculty | Classes appear in teachers' Outlook calendars and update when moved | IT |
| O15 | Instant change notices from the source | The moment the program office changes a class, the affected students and teacher are told | Comes with O1 |
| O16 | Official announcements | Program offices post notices for a programme, batch, section or course | Program offices |

### Data from IMT

| # | Feature | In easy words | Who at IMT |
|---|---|---|---|
| O17 | Student and course data from the ERP (C) | Students, sections, electives and course outlines come straight from the college system, not typed again | IT, ERP vendor |
| O18 | Course material from Moodle (C) | Moodle content shown on subject pages, not just a link | IT, faculty |
| O19 | Official lists | Faculty list with mail IDs, all rooms with size and type, holidays and the term calendar, Design Thinking and APO groups | Program offices, admin office |
| O20 | Exams from the exam office | Exam timetable and seating as soon as they are made | Exam office |
| O21 | Placement and institute days | Days with no classes, blocked in the timetable | Placement office, administration |
| O22 | Attendance (C) | Students see their attendance and how many classes they can still miss | ERP owner |

### Reports

| # | Feature | In easy words | Who at IMT |
|---|---|---|---|
| O23 | Detailed analytics | Usage cut by programme, section, course and room; how fast changes reach students | Program offices, administration |
| O24 | Institute dashboards | Room use, course progress, teacher load, how often the timetable changes | Administration |

### Running it officially

| # | Feature | In easy words | Who at IMT |
|---|---|---|---|
| O25 | Official status | An owner at IMT, a security check by IT, a privacy notice, and a plan for who runs it after 2028 | Administration, IT Head |
| O26 | Protect student data | Student list kept private, each person sees only their own details | IT (follows from O12) |

---

## Dropped

- **Calendar subscription** (a live calendar link per section): not needed,
  app notifications (S4) cover it sooner. Dropped 15 Oct 2026.

## Later, separate project

- **IMTinder**, only after everything here is done.

---

## If IMT says yes: the first conversations, in order

1. **IT Head:** sign in with Outlook (O12), official mail (O13), and what the
   ERP can export (O17). These unlock the most for the least effort.
2. **One program office as a pilot:** O1 to O6 and the official lists (O19)
   for one programme, for one term.
3. **Administration:** official status (O25), once the pilot works.

The "without IMT" list (stage A) goes ahead now regardless.
