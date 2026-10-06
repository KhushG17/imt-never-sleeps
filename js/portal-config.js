// The one hand-edited settings file for the whole portal. Loaded by every
// page (portal, Weekly, Exam Seat).
window.PORTAL_CONFIG = {
  // The batch tracker: one entry per batch, keyed by graduation year. This is
  // where "which batch is in which term" lives; README.md mirrors it.
  //   rollPrefix  - used only when a roll isn't in the roster yet; a roster
  //                 entry's own "batch" always wins.
  //   term        - 1 to 6. Bump it when the batch moves to its next term.
  //   alumniFrom  - "YYYY-MM-DD", the day after the batch's last Term 6 exam.
  //                 A batch becomes alumni once its Term 6 exams are done:
  //                 from that date the greeting says "Hey Alumni" and Weekly
  //                 stops. null = date not known yet, never switches.
  batches: {
    "2027": { label: "Batch 2025-27", rollPrefix: "25", term: 5, alumniFrom: null },
    "2028": { label: "Batch 2026-28", rollPrefix: "26", term: 2, alumniFrom: null }
  },

  // Exam Seat is locked between exam cycles. Set locked to false (and refresh
  // exam-seat/js/exam-data.js + exam-config.js) when the next seating plan is out.
  examSeat: {
    locked: true,
    lockedLabel: "Term 2 & Term 5 exams coming soon"
  },

  // Usage tracking with Google Analytics 4. Paste the property's Measurement
  // ID (looks like "G-AB12CD34EF") to switch it on; "" keeps it off. Nothing
  // is sent from a page opened as a local file. See README, "Usage tracking".
  analytics: {
    measurementId: "G-F0R29KD608"
  },

  // A dummy roll for trying every feature end to end. It bypasses the Exam
  // Seat lock. Its data lives in data/roster-test.json and under the same key in
  // exam-seat/js/exam-data.js. Set to null to switch it off.
  testRoll: "TEST"
};
