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

  // The small "live" pill above the portal heading.
  //   weeklyDays - it shows "Weekly schedule live" from the week's Monday for
  //                this many days (3 = Monday to Wednesday, gone on Thursday),
  //                and only once every batch and programme on campus has that
  //                week loaded.
  // While Exam Seat is unlocked the pill shows examSeat.liveLabel instead,
  // for as long as it stays unlocked.
  //   preview    - the pill a test roll shows after it is entered, on any day:
  //                "weekly" or "exam". Everyone else gets the real one.
  livePill: {
    weeklyDays: 3,
    preview: { "TEST": "weekly", "TESTA": "exam" }
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
