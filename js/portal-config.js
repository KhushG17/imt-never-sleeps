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

  // The schedule day rolls over at this hour, India time: from 8 pm the
  // schedule leads with tomorrow, and the pill judges by tomorrow too.
  schedule: {
    dayRollsAtHour: 20
  },

  // The pill above the portal heading.
  //   green "Live · <dates>"  this week is loaded for everyone it speaks for
  //   red   "<dates>"         not every programme's schedule for this week is
  //                           in, or the dates have passed. The colour is the
  //                           only signal; it is not spelled out.
  //   red   missingLabel      nothing loaded to date at all
  // Hidden during End Term Exams. While Exam Seat is unlocked it shows
  // examSeat.liveLabel and nothing else.
  //   minProgrammes - the six programmes' PDFs arrive separately. The dates
  //                   in the pill move on to a new week only once at least
  //                   this many programmes have it.
  //   preview       - the pill a test roll shows after it is entered, on any
  //                   day: "weekly" or "exam". Everyone else gets the real one.
  livePill: {
    minProgrammes: 3,
    missingLabel: "New week's schedule not uploaded yet",
    preview: { "TEST": "weekly", "TESTA": "exam" }
  },

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
