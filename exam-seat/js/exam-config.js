// Edit this file at the start of each new exam cycle. Everything here flows
// through to the page (eyebrow text) and the PDF (subtitle) automatically,
// so nothing else needs to be touched for a period/term label change.
window.EXAM_CONFIG = {
  title: "IMT End Term Exams",
  period: "Sep 2026",
  termsLabel: "Term I & IV",
  // Roll-number prefix -> term number. Used as a fallback whenever a roll
  // isn't found in ROSTER_DATA (js/roster-data.js) or no roster has been
  // loaded yet. Add/replace entries each cycle as needed.
  // Which term each batch is sitting in THIS seating plan (batch = the year it
  // graduates). With that term's course list on file, a student in a hall
  // shared by two papers is shown only the paper that is on their own course
  // list. The Sep 2026 plan was Terms 1 and 4, for which no course lists are
  // on file, so it falls back to the older by-batch rule below. For the next
  // cycle set this to { "2027": 5, "2028": 2 }.
  termByBatch: {
    "2027": 4,
    "2028": 1
  },
  rollPrefixTerm: {
    "26": 1,
    "25": 4,
    "TEST": 4
  }
};
