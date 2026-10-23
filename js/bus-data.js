// The campus bus timings shown on the Bus Schedule page. Hand-edited: change
// the times here when the transport office sends a new sheet (see README,
// "Bus schedule"). Times are 24-hour "HH:MM", in the order they run; the
// night shift runs on past midnight, so its early-morning times come last.
// The stop names are shown exactly as written here.
window.BUS_DATA = {
  updated: "2026-10-23",
  stops: { a: "CDL", b: "Campus" },
  shifts: [
    {
      name: "Day shift",
      fromA: ["08:30", "08:35", "08:50", "08:55", "10:05", "10:20", "11:40", "11:55",
              "13:55", "15:15", "15:35", "17:00", "17:10", "17:55", "18:15", "19:15"],
      fromB: ["09:00", "09:30", "10:45", "11:15", "11:50", "12:30", "13:40", "14:30",
              "16:00", "16:15", "17:25", "17:30", "17:45", "18:15", "19:00", "19:35"]
    },
    {
      name: "Night shift",
      fromA: ["21:00", "22:00", "23:00", "00:00", "01:00", "02:00", "03:00", "04:00",
              "05:00"],
      fromB: ["21:30", "22:30", "23:30", "00:30", "01:30", "02:30", "03:30", "04:30"]
    }
  ]
};
