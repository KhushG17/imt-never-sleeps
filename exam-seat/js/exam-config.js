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
  rollPrefixTerm: {
    "26": 1,
    "25": 4,
    "TEST": 4
  }
};
