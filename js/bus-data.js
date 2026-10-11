// The campus bus timings shown on the Bus Schedule page. Hand-edited: change
// the times here when the transport office sends a new sheet (see README,
// "Bus schedule"). Times are 24-hour "HH:MM", in the order they run; the
// night shift runs on past midnight, so its early-morning times come last.
// The stop names are shown exactly as written here.
window.BUS_DATA = {
  updated: "2026-10-13",
  stops: { a: "CDL", b: "Campus" },
  shifts: [
    {
      name: "Day shift",
      fromA: ["08:30", "08:35", "08:40", "08:45", "10:00", "10:05", "11:30", "11:40",
              "13:50", "15:00", "15:20", "16:45", "17:00", "17:30", "18:00", "19:00"],
      fromB: ["09:00", "09:25", "10:30", "11:00", "11:55", "12:30", "13:25", "14:30",
              "15:45", "16:00", "17:10", "17:15", "17:30", "18:00", "19:00", "19:20"]
    },
    {
      name: "Night shift",
      fromA: ["21:00", "22:00", "23:00", "00:00", "01:00", "02:00", "03:00", "04:00", "05:00"],
      fromB: ["21:30", "22:30", "23:30", "00:30", "01:30", "02:30", "03:30", "04:30"]
    }
  ]
};
