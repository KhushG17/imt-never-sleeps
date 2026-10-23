// The one hand-edited settings file for the whole portal. Loaded by every
// page (portal, Weekly, Exam Seat).
window.PORTAL_CONFIG = {
  // Which batch is in which term, term dates and alumni dates are not set
  // here: they come from data/config/timeline.json (run scripts/update.py
  // after editing it).

  // Exam Seat is locked between exam cycles. Set locked to false (and refresh
  // exam-seat/js/exam-data.js + exam-config.js) when the next seating plan is out.
  examSeat: {
    locked: true,
    // {term} becomes the student's own current term: "Term 5 exams coming soon".
    lockedLabel: "Term {term} exams coming soon",
    alumniLabel: "No more exams, you have graduated",
    // Rolls that can open Exam Seat even while it is locked.
    openFor: ["TEST", "DIWA", "HALLO"],
    liveLabel: "Exam seating is live"
  },

  // The general hour, India time, at which "today" becomes "tomorrow": used
  // by the pill and Exam Seat, and by Weekly on a day when the student has
  // no class. On a day with classes, Weekly instead moves on as soon as that
  // student's own last class has ended.
  schedule: {
    dayRollsAtHour: 20
  },

  // The pill above the portal heading.
  //   green "Live · <dates>"  the schedule for these dates is in
  //   red   "<dates>"         not up to date: the dates have passed, or too
  //                           many programmes still lack this week. The
  //                           colour is the only signal; it is not spelled out.
  //   red   missingLabel      nothing loaded at all
  // Hidden during End Term Exams. While Exam Seat is unlocked it shows
  // examSeat.liveLabel and nothing else.
  //   redWhenMissingMoreThan - the six programmes' PDFs arrive separately.
  //                   The dates move to a new week as soon as even one
  //                   programme has it. The pill is red while more than this
  //                   many programmes still lack the week that is running
  //                   (3: red with 1 or 2 of 6 in, green from 3).
  //   preview       - the pill a test roll shows after it is entered, on any
  //                   day: "weekly" or "exam". Everyone else gets the real one.
  livePill: {
    redWhenMissingMoreThan: 3,
    missingLabel: "New week's schedule not uploaded yet",
    preview: { "TEST": "weekly", "TESTA": "exam" }
  },

  // Campus occasions shown at the top of their day in Weekly, for everyone.
  //   date  - "YYYY-MM-DD"
  //   title - what it is
  //   note  - optional second line (who is hosting, a time, a place)
  //   link  - optional web address; shows as an arrow button on the right
  //           that opens it in a new tab (a registration form, a poster)
  //   theme - how it is dressed: "onam" (green, with a pookalam) or
  //           "plain" (green, no motif)
  //   by    - optional third line, smaller (who is holding it)
  //   place - "top" (the default): above that day's classes.
  //           "after": below that day's classes, for something held once
  //           classes are over.
  //   themes  - "garba" (Garba Night: magenta, orange and gold, a turning rangoli mandala and
  //           crossed dandiya sticks), "onam" (green, a pookalam), "sports" (night purple and gold,
  //           a crescent on the left and a sun on the right, text centred),
  //           "plain" (green, no motif)
  //           "festival" (a greeting for a festival, for everyone; icon
  //           "lotus" = deep red and gold for Durga Puja, "bow" = saffron for
  //           Dussehra, "pumpkin" = Halloween, "diya" = Diwali)
  //           "reset" (HAWC's RESET 2026 poster: paper beige, deep teal and
  //           orange; the title's year is picked out in orange)
  //   icon  - for the "reset" theme, the picture on the left: "football",
  //           "strength" or "rope"
  //   holiday - optional; the day is a holiday for every student: this text
  //           ("Holiday") is shown under the banner in every programme, even
  //           where that week's schedule is not uploaded
  //   until - optional; the occasion runs from `date` to this date (inclusive), one banner on each day
  //   banner: "week" - optional; shown once above the whole list (not on each day) from `showFrom`
  //           (default a week before `date`) to `until`
  //   for   - optional; only these groups see it, e.g. ["2027-core", "2027-bfs"] (PGDM and BFS, batch 2025-27)
  //   theme "placement" (navy and gold, a briefcase and rising bars) is for the placement week
  //   time  - optional; shown as a small tag on the right ("6:30 PM"), or
  //           before the venue when the occasion also has a link
  //   where - optional; the venue, shown after the note
  // An occasion that runs over several days gets one entry per date.
  events: [
    // Placement week for the 2027 batch (PGDM and BFS 2025-27): one banner above the whole list, shown from 23 Oct
    // to the last day (8 Nov), not one on every day, so it never crowds a day's own greeting
    { date: "2026-11-02", until: "2026-11-08", showFrom: "2026-10-23", banner: "week", title: "Best of Luck for Placements",
      note: "Final Placement Week · 2–8 Nov", theme: "placement", for: ["2027-core", "2027-bfs"] },
    { date: "2026-10-31", title: "Happy Halloween", theme: "festival", icon: "pumpkin" },
    { date: "2026-11-08", title: "Happy Diwali", theme: "festival", icon: "diya" },
    { date: "2026-10-23", title: "Garba Night", by: "CULCOM", theme: "garba", place: "after" },
    { date: "2026-10-19", title: "Happy Mahashtami", theme: "festival", icon: "lotus", holiday: "Holiday" },
    { date: "2026-10-20", title: "Happy Dussehra", theme: "festival", icon: "bow", holiday: "Holiday" },
    { date: "2026-10-15", title: "RESET 2026", by: "HAWC · Day 1", note: "Penalty Shootout",
      where: "Football Ground", time: "6:30 PM", link: "https://forms.gle/PoV2eyZwjzAt9gRYA", theme: "reset", icon: "football", place: "after" },
    { date: "2026-10-16", title: "RESET 2026", by: "HAWC · Day 2", note: "Arm Wrestling, Team Balance",
      where: "Basketball Court", time: "6:30 PM", link: "https://forms.gle/PoV2eyZwjzAt9gRYA", theme: "reset", icon: "strength", place: "after" },
    { date: "2026-10-17", title: "RESET 2026", by: "HAWC · Day 3", note: "Tug of War",
      where: "Football Ground", time: "6:30 PM", link: "https://forms.gle/PoV2eyZwjzAt9gRYA", theme: "reset", icon: "rope", place: "after" },
    { date: "2026-10-10", title: "Sports Night 2026",
      note: "Crescent Crusaders vs Solstice Sovereigns",
      theme: "sports", place: "after" },
    { date: "2026-10-11", title: "Sports Night 2026",
      note: "Crescent Crusaders vs Solstice Sovereigns",
      theme: "sports", place: "after" },
    { date: "2026-10-13", title: "Onam", note: "Celebration by IMT MALCOM", theme: "onam",
      link: "https://forms.fillout.com/t/kGoetrtKVhus" }
  ],

  // The feedback form. Printed as a link at the foot of both PDFs. (The
  // Feedback button and the disclaimer link on the pages carry the same
  // address in the HTML; change it there too if it ever moves.)
  feedbackUrl: "https://forms.gle/y2CWo8Nq7o2GqytcA",

  // The Study Material button on the portal. It opens this link in a new
  // tab; the folder behind it is organised term-wise. Set url to "" to hide
  // the button.
  studyMaterial: {
    url: "https://imtgzb-my.sharepoint.com/:f:/g/personal/dcp26khushgoyal_imt_ac_in/IgCNsHVzKIz2Q7N7Vaec049qAQwAX5m6zlpiZ0aakGt8rFI?e=MwAYU9"
  },

  // LMS (Moodle) and ERP, side by side in the Resources menu. On a phone the
  // LMS opens its app page (App Store on an iPhone, Google Play on Android);
  // on a laptop it opens the website. The ERP is the same everywhere.
  lms: {
    web: "https://lms.imt.edu/login/",
    ios: "https://apps.apple.com/in/app/moodle-workplace/id1470929705",
    android: "https://play.google.com/store/apps/details?id=com.moodle.workplace&hl=en_IN",
    // Opening the installed app: the Moodle Workplace app answers to mmworkplace://<site address>
    // (its default URL scheme, per the Moodle Workplace app docs). Tried first on a phone; if the app
    // is not there the store page opens instead.
    site: "https://lms.imt.edu",
    scheme: "mmworkplace",
    androidPackage: "com.moodle.workplace"
  },
  erp: { url: "https://erp.imt.edu/login.htm" },

  // Festival decorations (js/festival.js and css/festival.css for Diwali: fairy lights and marigolds under
  // the navbar, firecrackers at the foot of the page, fireworks in the sky; js/halloween.js and
  // css/halloween.css for Halloween: orange lights with bats and ghosts, pumpkins and ghosts at the foot,
  // bats, ghosts and lightning in the sky). Home, Weekly, Exam Seat and Bus only (never the upload page or
  // the master timetable). Each theme shows from `from` to `until`, India time, and switches itself off
  // after. `on: false` switches all of it off sooner; `sound: false` keeps the looks but takes the sound
  // away. The page's own background is not touched. To look at one outside its dates add ?festival=diwali
  // or ?festival=halloween to the address (?festival=off hides it). The app icon follows the same dates:
  // .github/workflows/seasonal-icon.yml (scripts/seasonal_icon.py) swaps it each night.
  festival: {
    on: true,
    sound: true,
    // typing one of these as a roll number shows that look whatever the date (for trying it)
    previewRolls: { DIWA: "diwali", HALLO: "halloween" },
    themes: [
      { name: "diwali",    from: "2026-11-01", until: "2026-11-12", greeting: "Happy Diwali" },
      { name: "halloween", from: "2026-10-25", until: "2026-10-31", greeting: "Happy Halloween" }
    ]
  },

  // The upload page at /upload/: which GitHub repository weekly schedules
  // are sent to. See README, "Uploading from the browser".
  upload: {
    repo: "KhushG17/imt-never-sleeps",
    branch: "main"
  },

  // Usage tracking with Google Analytics 4. Paste the property's Measurement
  // ID (looks like "G-AB12CD34EF") to switch it on; "" keeps it off. Nothing
  // is sent from a page opened as a local file. See README, "Usage tracking".
  analytics: {
    measurementId: "G-F0R29KD608"
  },

  // The mess menu: a floating button on the portal, Weekly and Exam Seat
  // that opens today's and tomorrow's meals. The menu itself comes from the
  // mess menu PDF (see README, "Mess menu"). Set enabled to false to hide it.
  mess: {
    enabled: true
  },

  // Dummy rolls for trying the site. They are defined in
  // data/config/overrides.json and are never counted in usage tracking.
  //   TEST   a current student; also opens Exam Seat while it is locked
  //          (its sample seats are under the TEST key in exam-seat/js/exam-data.js)
  //   TESTA  an alumni, to see what a graduated batch gets
  //   DIWA   like TEST, with the Diwali look on whatever the date (festival.previewRolls)
  //   HALLO  like TEST, with the Halloween look on whatever the date
  // Set to [] to switch them off.
  testRolls: ["TEST", "TESTA", "DIWA", "HALLO"]
};
