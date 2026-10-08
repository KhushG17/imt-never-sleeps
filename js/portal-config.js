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
    openFor: ["TEST"],
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
  events: [
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

  // Dummy rolls for trying the site. They are defined in
  // data/config/overrides.json and are never counted in usage tracking.
  //   TEST   a current student; also opens Exam Seat while it is locked
  //          (its sample seats are under the TEST key in exam-seat/js/exam-data.js)
  //   TESTA  an alumni, to see what a graduated batch gets
  // Set to [] to switch them off.
  testRolls: ["TEST", "TESTA"]
};
