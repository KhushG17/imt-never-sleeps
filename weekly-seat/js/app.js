(function(){
"use strict";
  var IMT = window.IMT;
  // groupKey ("2027-core") -> the newest weeks on file, see scripts/update.py
  var WEEKLY = window.WEEKLY_DATA || {};
  var TINTS = ['var(--color-sky-wash)','var(--color-peach-wash)','var(--color-mint-wash)'];
  var DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  var MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var CAL_ICON = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M16 3v4M8 3v4M3 11h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

  var notice = document.getElementById('notice');
  var noticeTitle = document.getElementById('noticeTitle');
  var noticeText = document.getElementById('noticeText');
  var noticeBack = document.getElementById('noticeBack');
  var results = document.getElementById('results');
  var listEl = document.getElementById('list');
  var weekOut = document.getElementById('weekOut');
  var nameOut = document.getElementById('nameOut');
  var metaOut = document.getElementById('metaOut');
  var bannerEl = document.getElementById('banner');
  var backBtn = document.getElementById('backBtn');
  var otherBtn = document.getElementById('otherWeekBtn');
  var eyebrow = document.getElementById('eyebrow');

  var lastResult = null; // {student, shown, label} for what is on screen

  // ---- formatting ----
  function parseIso(iso){
    var p = iso.split('-');
    return { y:+p[0], mo:+p[1], d:+p[2] };
  }
  function dayLabel(data, dayIdx){
    var dt = parseIso(data.days[dayIdx].date);
    return DAY_NAMES[dayIdx] + ', ' + dt.d + ' ' + MONTHS[dt.mo] + ' ' + dt.y;
  }
  function rangeLabel(data){
    var a = parseIso(data.start), b = parseIso(data.end);
    return a.d + ' ' + MONTHS[a.mo] + ' - ' + b.d + ' ' + MONTHS[b.mo] + ' ' + b.y;
  }
  function weekLabel(data){
    return (data.weekNumber ? 'Week ' + data.weekNumber + ' · ' : '') + rangeLabel(data);
  }
  function minutes(hhmm){
    var p = hhmm.split(':');
    return +p[0] * 60 + +p[1];
  }
  function clock(hhmm){
    var m = minutes(hhmm), h = Math.floor(m / 60), mi = m % 60;
    return ((h + 11) % 12 + 1) + ':' + (mi < 10 ? '0' : '') + mi + ' ' + (h < 12 ? 'AM' : 'PM');
  }
  // slots s .. s+span-1 as one range
  function slotLabel(data, s, span){
    var a = clock(data.slots[s][0]), b = clock(data.slots[s + (span || 1) - 1][1]);
    // "2:00 - 3:15 PM" when both ends share AM/PM, so it fits one line on phones
    if(a.slice(-2) === b.slice(-2)) a = a.slice(0, -3);
    return a + ' - ' + b;
  }
  function courseName(data, code){
    return data.courses[code] || code;
  }
  // Which section or track a class is for, as shown on its card.
  function rowText(x){
    if(!x.row) return x.sec || '';
    return x.row + (x.sec && x.row.slice(-x.sec.length - 1) !== '-' + x.sec && x.row !== x.sec ? ' · ' + x.sec : '');
  }

  // ---- "Add to Calendar" links ----
  // Class times are IST wall-clock time, so convert IST -> UTC (IST is
  // UTC+5:30) for the link's dates param rather than appending a bare "Z".
  var IST_OFFSET_MIN = 5 * 60 + 30;
  function pad2(n){ n = String(n); return n.length < 2 ? '0' + n : n; }
  function googleCalStamp(utcMs){
    var d = new Date(utcMs);
    return d.getUTCFullYear() + pad2(d.getUTCMonth() + 1) + pad2(d.getUTCDate()) +
      'T' + pad2(d.getUTCHours()) + pad2(d.getUTCMinutes()) + '00Z';
  }
  function googleCalendarLink(data, dayIdx, s, span, title, details, room){
    var dt = parseIso(data.days[dayIdx].date);
    var dayUtcMs = Date.UTC(dt.y, dt.mo - 1, dt.d) - IST_OFFSET_MIN * 60000;
    var params = {
      action: 'TEMPLATE',
      text: title,
      dates: googleCalStamp(dayUtcMs + minutes(data.slots[s][0]) * 60000) + '/' +
        googleCalStamp(dayUtcMs + minutes(data.slots[s + (span || 1) - 1][1]) * 60000),
      details: details + ' Unofficial schedule from IMT Never Sleeps, always confirm against the official weekly schedule.',
      location: room || ''
    };
    return 'https://calendar.google.com/calendar/render?' + Object.keys(params).map(function(k){
      return k + '=' + encodeURIComponent(params[k]);
    }).join('&');
  }
  function classLink(data, x){
    var tag = x.grp ? 'Group ' + x.grp : rowText(x);
    return googleCalendarLink(data, x.d, x.s, 1,
      courseName(data, x.c) + (tag ? ' (' + (x.grp ? '' : (data.rowLabel || 'Section') + ' ') + tag + ')' : ''),
      x.c + ', session ' + x.n + (x.room ? ', room ' + x.room : '') + '.', x.room);
  }

  // ---- which classes are this student's ----
  // The three schedule layouts differ only in what a class is matched on:
  //   course  - the course and section the student registered for
  //   section - the student's section
  //   track   - the student's elective track
  // When the thing to match on isn't loaded for this student, every row is
  // shown, labelled, with a banner saying so, rather than nothing at all.
  // Group sessions (e.g. Design Thinking groups) are listed for everyone in
  // the programme, since group membership isn't in the files.
  var buildView = IMT.buildView;   // in js/common.js, shared with the master timetable

  // ---- page states ----
  listEl.addEventListener('click', function(e){
    var cal = lastResult && e.target.closest('.card-cal-link');
    if(cal){
      IMT.track('add_to_calendar', lastResult.student, { tool: 'weekly', course: (cal.getAttribute('data-what') || '').slice(0, 90) });
    }
    var occasion = lastResult && e.target.closest('.event-link');
    if(occasion){
      IMT.track('event_click', lastResult.student, { tool: 'weekly', result: occasion.getAttribute('data-event') || '' });
    }
  });

  function showNotice(s, title, text){
    results.hidden = true;
    noticeTitle.textContent = title;
    noticeText.textContent = text;
    noticeBack.href = '../?roll=' + encodeURIComponent(s.roll);
    notice.hidden = false;
  }

  // One class is one compact row: time on the left, what and where in the
  // middle, and a calendar button on the right that is hard to miss.
  var CAL_PLUS = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M12 13v5M9.5 15.5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  function timeCell(tint, from, to){
    return '<div class="cls-time" style="--tint:' + tint + '"><span class="cls-start">' + from + '</span>' +
      (to ? '<span class="cls-end">to ' + to + '</span>' : '') + '</div>';
  }
  function calButton(href, what){
    return '<a class="card-cal-link cls-cal" href="' + href + '" target="_blank" rel="noopener" title="Add to Google Calendar" data-what="' + IMT.escapeHtml(what) + '" ' +
      'aria-label="Add ' + IMT.escapeHtml(what) + ' to Google Calendar">' + CAL_PLUS + '</a>';
  }
  function metaLine(parts){
    return '<div class="cls-meta">' + parts.filter(function(p){ return p[1] !== '' && p[1] != null; }).map(function(p){
      return '<span><b>' + p[0] + '</b> ' + IMT.escapeHtml(p[1]) + '</span>';
    }).join('') + '</div>';
  }

  // ---- campus occasions (events in js/portal-config.js) ----
  // A pookalam, the flower carpet laid for Onam: rings of petals around a
  // centre, drawn as plain SVG so no image file is needed.
  function pookalam(){
    var rings = [
      { r: 44, n: 16, size: 9,   fill: '#f7c948' },
      { r: 33, n: 12, size: 8.5, fill: '#f08a24' },
      { r: 22, n: 10, size: 7.5, fill: '#fff6dc' },
      { r: 12, n: 8,  size: 6,   fill: '#d6452b' }
    ];
    var out = '<svg class="event-motif" viewBox="-56 -56 112 112" aria-hidden="true">' +
      '<circle r="54" fill="#0f5a3a"/><circle r="53" fill="none" stroke="#f7c948" stroke-width="1.5"/>';
    rings.forEach(function(ring){
      for(var i = 0; i < ring.n; i++){
        var a = (i / ring.n) * 2 * Math.PI;
        out += '<ellipse cx="' + (Math.cos(a) * ring.r).toFixed(1) + '" cy="' + (Math.sin(a) * ring.r).toFixed(1) +
          '" rx="' + ring.size + '" ry="' + (ring.size * 0.52).toFixed(1) + '" fill="' + ring.fill +
          '" transform="rotate(' + (i / ring.n * 360).toFixed(1) + ' ' + (Math.cos(a) * ring.r).toFixed(1) + ' ' + (Math.sin(a) * ring.r).toFixed(1) + ')"/>';
      }
    });
    return out + '<circle r="5.5" fill="#f7c948"/></svg>';
  }
  // Sports Night, juniors against seniors: a crescent for one side and a sun
  // for the other, one at each end of the banner.
  function crescent(){
    return '<svg class="event-motif motif-moon" viewBox="-56 -56 112 112" aria-hidden="true">' +
      '<circle r="54" fill="#1d1033"/><circle r="53" fill="none" stroke="#b79cf0" stroke-width="1.5"/>' +
      '<path d="M14 -34 A36 36 0 1 0 14 34 A28 28 0 1 1 14 -34 Z" fill="#cdb9ff"/>' +
      '<circle cx="22" cy="-6" r="3.2" fill="#f1e9ff"/><circle cx="31" cy="12" r="2" fill="#b79cf0"/><circle cx="10" cy="14" r="1.6" fill="#b79cf0"/></svg>';
  }
  function sun(){
    var out = '<svg class="event-motif motif-sun" viewBox="-56 -56 112 112" aria-hidden="true">' +
      '<circle r="54" fill="#2a1c08"/><circle r="53" fill="none" stroke="#f0c869" stroke-width="1.5"/>';
    for(var i = 0; i < 12; i++){
      out += '<path d="M-5 -26 L0 ' + (i % 2 ? -40 : -46) + ' L5 -26 Z" fill="#f0c869" transform="rotate(' + (i * 30) + ')"/>';
    }
    return out + '<circle r="20" fill="#f7d98a"/><circle r="20" fill="none" stroke="#c9972f" stroke-width="2"/></svg>';
  }
  // "Holiday" when an occasion on that date marks the day as a holiday for all
  // The student whose week is on screen: an occasion with `for: [group keys]` is theirs only if their group is in the list
  var curStudent = null;
  function appliesTo(e){ return !e.for || !curStudent || e.for.indexOf(curStudent.groupKey) >= 0; }
  // an occasion is on its date, or on every date from `date` to `until` when it runs over several days.
  // One with banner: "week" is not a day's banner at all: it is shown once, above the whole list, from its
  // `showFrom` date (a week ahead, by default) to its last day, so a wish never repeats on every day and
  // never crowds a day's own greeting.
  function covers(e, date){ return e.banner !== 'week' && e.date <= date && date <= (e.until || e.date); }
  function holidayOn(date){
    var h = ((IMT.config.events) || []).filter(function(e){ return covers(e, date) && e.holiday && appliesTo(e); })[0];
    return h ? h.holiday : '';
  }
  function eventsOn(date, place){
    return ((IMT.config.events) || []).filter(function(e){
      return covers(e, date) && appliesTo(e) && (!place || (e.place === 'after' ? 'after' : 'top') === place);
    });
  }
  function weekBanners(day){
    return ((IMT.config.events) || []).filter(function(e){
      return e.banner === 'week' && appliesTo(e) && day <= (e.until || e.date) && day >= (e.showFrom || IMT.addDays(e.date, -7));
    }).map(eventBanner).join('');
  }
  // RESET 2026 (HAWC): one picture a day, in the poster's deep teal.
  var RESET_ICONS = {
    football: '<circle cx="0" cy="0" r="30" fill="#f3ead8" stroke="#0f4b45" stroke-width="3.5"/>' +
      '<path d="M0 -12 L11.4 -3.7 L7 9.7 L-7 9.7 L-11.4 -3.7 Z" fill="#0f4b45"/>' +
      '<path d="M0 -12 V-29 M11.4 -3.7 L27.5 -9 M7 9.7 L17 23.5 M-7 9.7 L-17 23.5 M-11.4 -3.7 L-27.5 -9" stroke="#0f4b45" stroke-width="3" stroke-linecap="round"/>',
    strength: '<path d="M-14 0 H14" stroke="#0f4b45" stroke-width="7" stroke-linecap="round"/>' +
      '<rect x="-25" y="-17" width="10" height="34" rx="3.5" fill="#0f4b45"/><rect x="15" y="-17" width="10" height="34" rx="3.5" fill="#0f4b45"/>' +
      '<rect x="-33" y="-10" width="7" height="20" rx="3" fill="#e8921c"/><rect x="26" y="-10" width="7" height="20" rx="3" fill="#e8921c"/>',
    rope: '<path d="M-33 6 C-20 -8 -10 14 0 2 S 20 -10 33 4" fill="none" stroke="#0f4b45" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M-33 6 C-20 -8 -10 14 0 2 S 20 -10 33 4" fill="none" stroke="#f3ead8" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 7"/>' +
      '<circle cx="0" cy="2" r="8" fill="#e8921c" stroke="#0f4b45" stroke-width="3"/>' +
      '<path d="M-27 -14 l-8 6 8 6 M27 -16 l8 6 -8 6" fill="none" stroke="#0f4b45" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'
  };
  function resetIcon(name){
    return '<svg class="event-motif motif-reset" viewBox="-40 -40 80 80" aria-hidden="true">' + (RESET_ICONS[name] || RESET_ICONS.football) + '</svg>';
  }
  // "RESET 2026" -> RESET <b>2026</b>: the year takes the poster's orange
  function titleWithYear(text){
    return IMT.escapeHtml(text).replace(/\b(20\d{2})\b/, '<b>$1</b>');
  }
  // Festival greetings: a lotus for Durga Puja (Mahashtami), a bow and arrow
  // for Dussehra, on a soft glowing disc.
  var FESTIVAL_ICONS = {
    // a jack-o'-lantern for Halloween: the eyes and mouth glow
    pumpkin: '<g stroke="#5a2300" stroke-width="1.400" stroke-linejoin="round">' +
      '<ellipse cx="-12" cy="6" rx="14" ry="20" fill="#e2641e"/><ellipse cx="12" cy="6" rx="14" ry="20" fill="#e2641e"/><ellipse cx="0" cy="6" rx="12" ry="21" fill="#ff9a2e"/></g>' +
      '<path d="M-2 -14 q-2 -9 6 -11 q-1 5 1 11z" fill="#4a7a2a" stroke="#2d4d17" stroke-width="1"/>' +
      '<path d="M-11 2 l5 -9 5 9z M2 2 l5 -9 5 9z" fill="#fff0a8"><animate attributeName="opacity" values="1;.55;1" dur="1.6s" repeatCount="indefinite"/></path>' +
      '<path d="M-14 12 l5 5 4 -5 5 5 4 -5 5 5 4 -5 v7 q-13 10 -27 0z" fill="#fff0a8"><animate attributeName="opacity" values="1;.55;1" dur="1.6s" repeatCount="indefinite"/></path>',
    // a clay lamp for Diwali: the flame flickers
    diya: '<path d="M-26 8 C-22 30 22 30 26 8 Z" fill="#d9480f" stroke="#7a2400" stroke-width="1.500"/>' +
      '<path d="M-30 7 H30" stroke="#ffd36b" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M26 8 C36 7 40 1 41 -6 C35 0 31 1 26 1 Z" fill="#d9480f" stroke="#7a2400" stroke-width="1.200"/>' +
      '<path d="M-14 18 C-6 24 6 24 14 18" stroke="#ffd36b" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<path d="M-5 5 C-18 -10 -8 -26 0 -42 C8 -26 18 -10 5 5 Z" fill="#ffb21c"><animate attributeName="opacity" values="1;.8;1" dur="1.2s" repeatCount="indefinite"/></path>' +
      '<path d="M-2 2 C-9 -8 -4 -18 0 -28 C4 -18 9 -8 2 2 Z" fill="#fff7cc"/>',
    // the outer petals open and close, the centre petal rises, a gold line glows
    lotus: '<g stroke="#7a1010" stroke-width="1.6" stroke-linejoin="round">' +
      '<path class="lp lp-ol" d="M-4 15 C-18 18 -28 10 -32 2 C-20 0 -10 6 -4 15Z" fill="#f08a24"/>' +
      '<path class="lp lp-or" d="M4 15 C18 18 28 10 32 2 C20 0 10 6 4 15Z" fill="#f08a24"/>' +
      '<path class="lp lp-il" d="M-2 14 C-14 10 -20 -2 -20 -12 C-10 -10 -3 -2 -2 14Z" fill="#f7c948"/>' +
      '<path class="lp lp-ir" d="M2 14 C14 10 20 -2 20 -12 C10 -10 3 -2 2 14Z" fill="#f7c948"/>' +
      '<path class="lp lp-c" d="M0 14 C-6 4 -6 -10 0 -22 C6 -10 6 4 0 14Z" fill="#ffd96a"/></g>' +
      '<path class="lp-base" d="M-22 22 H22" stroke="#f7c948" stroke-width="2.4" stroke-linecap="round"/>',
    // the string draws back with the arrow, the arrow flies off, a new one is nocked
    bow: '<g fill="none" stroke-linecap="round" stroke-linejoin="round">' +
      '<path class="bw-bow" d="M-14 -26 C10 -18 10 18 -14 26" stroke="#7a2e00" stroke-width="4"/>' +
      '<path class="bw-string" d="M-14 -26 L-14 26" stroke="#fff3d6" stroke-width="1.5"/>' +
      '<g class="bw-arrow"><path d="M-24 0 H28" stroke="#7a2e00" stroke-width="3"/>' +
      '<path d="M20 -6 L29 0 L20 6" stroke="#7a2e00" stroke-width="3"/>' +
      '<path d="M-24 0 l-5 -5 M-24 0 l-5 5 M-19 0 l-5 -5 M-19 0 l-5 5" stroke="#b5482a" stroke-width="2"/></g></g>'
  };
  function festivalIcon(name){
    return '<svg class="event-motif motif-festival" viewBox="-40 -40 80 80" aria-hidden="true">' +
      '<circle class="fx-halo" r="38" fill="rgba(255,255,255,.18)"/><circle r="31" fill="rgba(255,255,255,.22)"/>' +
      (FESTIVAL_ICONS[name] || FESTIVAL_ICONS.lotus) + '</svg>';
  }
  // a few drifting sparks behind the festival greeting
  function festivalSparks(icon){
    if(icon === 'pumpkin') return halloweenScene();
    if(icon === 'diya') return diwaliScene();
    var out = '';
    for(var i = 0; i < 7; i++) out += '<span class="fx-spark" style="--i:' + i + '"></span>';
    return '<span class="fx-sparks" aria-hidden="true">' + out + '</span>';
  }
  // Halloween: a big moon, stars, and bats flying across (the wings beat, drawn with <animate>)
  var BAT_OPEN = 'M20 10C16 4 8 2 1 5C4 8 5 12 8 14C11 12 13 12 15 15C17 13 19 12 20 14C21 12 23 13 25 15C27 12 29 12 32 14C35 12 36 8 39 5C32 2 24 4 20 10Z';
  var BAT_SHUT = 'M20 10C16 14 8 17 2 14C5 15 6 17 8 18C11 17 13 17 15 18C17 17 19 16 20 17C21 16 23 17 25 18C27 17 29 17 32 18C34 17 35 15 38 14C32 17 24 14 20 10Z';
  function bat(top, size, dur, delay, beat){
    return '<span class="fx-bat" style="top:' + top + '%;width:' + size + 'px;animation-duration:' + dur + 's;animation-delay:' + delay + 's">' +
      '<svg viewBox="0 0 40 20" aria-hidden="true"><path fill="#0b0420" d="' + BAT_OPEN + '"><animate attributeName="d" values="' + BAT_OPEN + ';' + BAT_SHUT + ';' + BAT_OPEN + '" dur="' + beat + 's" repeatCount="indefinite"/></path></svg></span>';
  }
  function halloweenScene(){
    var stars = '';
    [[52, 18], [64, 62], [74, 30], [86, 72], [58, 80], [92, 24]].forEach(function(p, i){ stars += '<i class="fx-star" style="left:' + p[0] + '%;top:' + p[1] + '%;animation-delay:-' + (i * .7).toFixed(1) + 's"></i>'; });
    return '<span class="fx-scene" aria-hidden="true">' + stars + '<span class="fx-moon"></span>' +
      bat(18, 30, 7.5, 0, .55) + bat(52, 22, 9.5, -3.2, .45) + bat(70, 26, 8.5, -5.6, .5) + bat(34, 18, 11, -7.5, .4) + '</span>';
  }
  // Diwali: crackers going off (starbursts), a rocket climbing, sparks rising, a string of little lamps along the bottom
  function diwaliScene(){
    var bursts = '';
    [[62, 30, '#ffd36b', 0], [80, 52, '#ff7aa8', 1.3], [92, 24, '#7fe0ff', 2.4], [70, 66, '#ffb347', 3.4]].forEach(function(b, i){
      bursts += '<i class="fx-burst" style="left:' + b[0] + '%;top:' + b[1] + '%;--c:' + b[2] + ';animation-delay:' + b[3] + 's"></i>';
    });
    var sparks = '';
    for(var i = 0; i < 6; i++) sparks += '<span class="fx-spark" style="--i:' + i + '"></span>';
    var rocket = '<span class="fx-rocket"><svg viewBox="0 0 16 34" aria-hidden="true"><path d="M8 0l4 9v12H4V9z" fill="#ffd36b"/><rect x="4" y="12" width="8" height="3" fill="#e0334f"/><path d="M4 21l-4 7 4-2zM12 21l4 7-4-2z" fill="#e0334f"/><path d="M6 21h4l-2 12z" fill="#ff9d1c"/></svg></span>';
    var lamps = '';
    for(var j = 0; j < 9; j++) lamps += '<i class="fx-lamp" style="left:' + (4 + j * 11.5) + '%;animation-delay:-' + (j * .4).toFixed(1) + 's"></i>';
    return '<span class="fx-scene" aria-hidden="true">' + bursts + rocket + sparks + '<span class="fx-lamps">' + lamps + '</span></span>';
  }
  // Garba Night: a turning rangoli mandala at one end, crossed dandiya sticks at the other
  function garbaMandala(){
    var out = '<svg class="event-motif motif-garba-a" viewBox="-56 -56 112 112" aria-hidden="true">' +
      '<circle r="54" fill="#4a0e6b"/><circle r="53" fill="none" stroke="#ffd24a" stroke-width="1.6"/>';
    for(var m = 0; m < 16; m++){ var ma = m / 16 * 2 * Math.PI; out += '<circle cx="' + (Math.cos(ma) * 47.5).toFixed(1) + '" cy="' + (Math.sin(ma) * 47.5).toFixed(1) + '" r="2" fill="#fff4c2"/>'; }
    [ { r: 35, n: 12, rx: 10, ry: 5.6, fill: '#e91e78', off: 0 },
      { r: 25, n: 12, rx: 8.5, ry: 4.6, fill: '#ff8a1c', off: 15 },
      { r: 15.5, n: 8, rx: 7, ry: 3.8, fill: '#ffd24a', off: 0 } ].forEach(function(ring){
      for(var i = 0; i < ring.n; i++){
        var deg = ring.off + i / ring.n * 360, a = deg * Math.PI / 180, cx = Math.cos(a) * ring.r, cy = Math.sin(a) * ring.r;
        out += '<ellipse cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" rx="' + ring.rx + '" ry="' + ring.ry + '" fill="' + ring.fill + '" transform="rotate(' + deg.toFixed(1) + ' ' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ')"/>';
      }
    });
    return out + '<circle r="7.500" fill="#14b8a6"/><circle r="3.200" fill="#fff4c2"/></svg>';
  }
  function dandiyaStick(rot){
    var bands = '';
    ['#ffd24a', '#e91e78', '#14b8a6', '#ffd24a', '#e91e78', '#14b8a6'].forEach(function(c, i){ bands += '<rect x="-5.500" y="' + (-27 + i * 9) + '" width="11" height="4.500" fill="' + c + '"/>'; });
    return '<g transform="rotate(' + rot + ')"><rect x="-5.500" y="-30" width="11" height="60" rx="5.500" fill="#f6e2b3"/>' + bands +
      '<circle cy="-31" r="6" fill="#ffd24a"/><circle cy="31" r="6" fill="#ffd24a"/>' +
      '<path d="M0 -34 q-6 -6 -9 -2 M0 -34 q6 -6 9 -2" fill="none" stroke="#e91e78" stroke-width="2" stroke-linecap="round"/></g>';
  }
  function dandiya(){
    return '<svg class="event-motif motif-garba-b" viewBox="-56 -56 112 112" aria-hidden="true">' +
      '<circle r="54" fill="#4a0e6b"/><circle r="53" fill="none" stroke="#ffd24a" stroke-width="1.6"/>' +
      dandiyaStick(-36) + dandiyaStick(36) +
      '<path d="M0 -8 L2.400 -2.400 L8 0 L2.400 2.400 L0 8 L-2.400 2.400 L-8 0 L-2.400 -2.400Z" fill="#fff4c2"/>' +
      '<circle cx="-36" cy="-34" r="2" fill="#fff4c2"/><circle cx="38" cy="30" r="2" fill="#fff4c2"/><circle cx="-34" cy="34" r="1.600" fill="#ffd24a"/><circle cx="36" cy="-32" r="1.600" fill="#ffd24a"/></svg>';
  }
  // Placement week (the 2027 batch): a gold briefcase with stars on one side, rising bars on the other
  function briefcase(){
    return '<svg class="event-motif motif-case" viewBox="-56 -56 112 112" aria-hidden="true"><defs><linearGradient id="plGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset="1" stop-color="#d4a52a"/></linearGradient></defs>' +
      '<circle r="54" fill="#0f1f5c"/><circle r="53" fill="none" stroke="#f4c542" stroke-width="1.500"/>' +
      '<path d="M-11 -12 V-19 a5 5 0 0 1 5 -5 H6 a5 5 0 0 1 5 5 V-12" fill="none" stroke="url(#plGold)" stroke-width="5" stroke-linecap="round"/>' +
      '<rect x="-30" y="-12" width="60" height="38" rx="7" fill="url(#plGold)"/><path d="M-30 4 H30" stroke="#a97c10" stroke-width="2"/>' +
      '<rect x="-6" y="-1" width="12" height="11" rx="2.500" fill="#0f1f5c"/><circle cy="4.500" r="1.800" fill="#f4c542"/>' +
      [[-38, -34, 5], [36, -30, 4], [40, 12, 3.500], [-42, 14, 3]].map(function(st, i){
        var x = st[0], y = st[1], r = st[2];
        return '<path d="M' + x + ' ' + (y - r) + ' L' + (x + r * .3) + ' ' + (y - r * .3) + ' L' + (x + r) + ' ' + y + ' L' + (x + r * .3) + ' ' + (y + r * .3) + ' L' + x + ' ' + (y + r) + ' L' + (x - r * .3) + ' ' + (y + r * .3) + ' L' + (x - r) + ' ' + y + ' L' + (x - r * .3) + ' ' + (y - r * .3) + 'Z" fill="#fff4c2">' +
          '<animate attributeName="opacity" values="1;.25;1" dur="' + (1.8 + i * .4).toFixed(1) + 's" begin="-' + (i * .5) + 's" repeatCount="indefinite"/></path>';
      }).join('') + '</svg>';
  }
  function growth(){
    return '<svg class="event-motif motif-growth" viewBox="-56 -56 112 112" aria-hidden="true">' +
      '<circle r="54" fill="#0f1f5c"/><circle r="53" fill="none" stroke="#f4c542" stroke-width="1.500"/>' +
      '<rect x="-32" y="8" width="14" height="22" rx="3" fill="#6f8cff"/><rect x="-12" y="-4" width="14" height="34" rx="3" fill="#9fb4ff"/><rect x="8" y="-18" width="14" height="48" rx="3" fill="#f4c542"/>' +
      '<path d="M-34 -4 L-8 -22 L6 -12 L30 -36" fill="none" stroke="#fff4c2" stroke-width="3.500" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M18 -37 L31 -37 L31 -24" fill="none" stroke="#fff4c2" stroke-width="3.500" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function eventBanner(e){
    var theme = e.theme === 'onam' || e.theme === 'sports' || e.theme === 'reset' || e.theme === 'festival' || e.theme === 'garba' || e.theme === 'placement' ? e.theme : 'plain';
    return '<div class="event-banner event-' + theme + (theme === 'festival' ? ' is-' + (e.icon === 'bow' || e.icon === 'pumpkin' || e.icon === 'diya' ? e.icon : 'lotus') : '') + '">' +
      (theme === 'onam' ? pookalam() : theme === 'sports' ? crescent() : theme === 'reset' ? resetIcon(e.icon) : theme === 'festival' ? festivalSparks(e.icon) + festivalIcon(e.icon) : theme === 'garba' ? garbaMandala() : theme === 'placement' ? briefcase() : '') +
      '<div class="event-text"><div class="event-title">' + (theme === 'reset' ? titleWithYear(e.title) : IMT.escapeHtml(e.title)) + '</div>' +
      (e.note ? '<div class="event-note">' + IMT.escapeHtml(e.note) + '</div>' : '') +
      (e.where ? '<div class="event-where"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="10" r="2.3" fill="currentColor"/></svg>' + IMT.escapeHtml((e.time && e.link ? e.time + ' · ' : '') + e.where) + '</div>' : '') +
      (e.by ? '<div class="event-by">' + IMT.escapeHtml(e.by) + '</div>' : '') + '</div>' +
      // with a link the arrow takes the right-hand end, so the time moves beside the venue
      (e.time && !(e.link && e.where) ? '<div class="event-time">' + IMT.escapeHtml(e.time) + '</div>' : '') +
      (e.link ? '<a class="event-link" href="' + IMT.escapeHtml(e.link) + '" target="_blank" rel="noopener" data-event="' + IMT.escapeHtml(e.title) + '" ' +
        'title="Open" aria-label="' + IMT.escapeHtml(e.title + (e.note ? ', ' + e.note : '')) + ': open the link">' +
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>' : '') +
      (theme === 'sports' ? sun() : theme === 'garba' ? dandiya() : theme === 'placement' ? growth() : '') +
      '</div>';
  }

  // How soon the student's next class is when they open the page, in broad
  // steps: 'in_class', 'under_30m', 'under_2h', 'later_today', 'tomorrow',
  // 'later', or 'none' when nothing is left in the weeks on file.
  function leadTime(weeks, s){
    var today = IMT.istToday(), tomorrow = IMT.addDays(today, 1), now = IMT.istMinutes();
    var best = null, inClass = false;
    weeks.forEach(function(w){
      buildView(w, s).classes.forEach(function(x){
        var date = w.days[x.d].date, from = minutes(w.slots[x.s][0]), to = minutes(w.slots[x.s][1]);
        if(date === today && from <= now && now < to) inClass = true;
        if(date < today || (date === today && from <= now)) return;
        if(!best || date < best.date || (date === best.date && from < best.from)) best = { date: date, from: from };
      });
    });
    if(inClass) return 'in_class';
    if(!best) return 'none';
    if(best.date === today) return best.from - now < 30 ? 'under_30m' : best.from - now < 120 ? 'under_2h' : 'later_today';
    return best.date === tomorrow ? 'tomorrow' : 'later';
  }

  // Whether the student scrolls as far as next week, or back to the days
  // gone: each is reported once, the first time its heading comes into view.
  var reachWatcher = null;
  function watchReach(s){
    if(reachWatcher) reachWatcher.disconnect();
    if(!('IntersectionObserver' in window)) return;
    var sent = {};
    reachWatcher = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting) return;
        var what = /^Week\b/.test(en.target.textContent) ? 'next_week' : 'earlier';
        if(sent[what]) return;
        sent[what] = true;
        IMT.track('weekly_reach', s, { tool: 'weekly', result: what });
      });
    });
    Array.prototype.forEach.call(listEl.querySelectorAll('.earlier-divider'), function(el){ reachWatcher.observe(el); });
  }

  // The day this student's schedule should lead with. It is today until
  // their own last class of the day has ended, and tomorrow from then on.
  // On a day with none of their classes (a free day, a whole-day note such
  // as "SSR Visits") there is no last class to go by, so the general rule
  // applies: tomorrow from 8 pm India time (IMT.scheduleDay).
  function currentDayFor(weeks, s){
    var today = IMT.istToday();
    var week = weeks.filter(function(w){ return w.start <= today && today <= w.end; })[0];
    if(!week) return IMT.scheduleDay();
    var view = buildView(week, s), lastEnd = -1;
    week.days.forEach(function(day, di){
      if(day.date !== today) return;
      view.classes.forEach(function(x){ if(x.d === di) lastEnd = Math.max(lastEnd, minutes(week.slots[x.s][1])); });
      // group sessions count too: one of them may be this student's last class of the day
      view.groups.forEach(function(x){ if(x.d === di) lastEnd = Math.max(lastEnd, minutes(week.slots[x.s][1])); });
      view.specials.forEach(function(sp){ if(sp.d === di) lastEnd = Math.max(lastEnd, minutes(week.slots[sp.s + sp.span - 1][1])); });
    });
    if(lastEnd < 0) return IMT.scheduleDay();
    return IMT.istMinutes() >= lastEnd ? IMT.addDays(today, 1) : today;
  }

  // The schedule is one running list: from the current day through the end
  // of the newest week on file. A week uploaded early simply adds its days
  // below this week's, so nothing has to be switched.
  function showWeek(s){
    var weeks = (WEEKLY[s.groupKey] || []).slice().sort(function(a, b){ return a.start < b.start ? -1 : 1; });
    var realToday = IMT.istToday();
    var E = (s.alumni || !weeks.length || (weeks[0].mode === 'course' && !Object.keys(s.courses).length)) ? IMT.scheduleDay() : currentDayFor(weeks, s);
    // a day with a campus occasion stays whole until midnight: its classes and
    // the occasion keep their places all day, since the occasion lasts the day
    if(eventsOn(realToday).length) E = realToday;
    // weeks that are not over yet; if every week on file is over, the newest one
    var live = weeks.filter(function(w){ return w.end >= E; });
    if(!live.length && weeks.length) live = [weeks[weeks.length - 1]];
    var first = live[0];
    var status = s.alumni ? 'alumni' : !first ? 'no_schedule' :
      (first.mode === 'course' && !Object.keys(s.courses).length) ? 'no_roster' : 'shown';
    IMT.track('tool_open', s, {
      tool: 'weekly', status: status, entry: IMT.entry(),
      // how soon the student's next class is, and whether the schedule shown is current
      lead: status === 'shown' ? leadTime(live, s) : 'none',
      fresh: IMT.coverage(WEEKLY, s.groupKey).state || 'none'
    });
    lastResult = null;
    notice.hidden = true;
    otherBtn.hidden = true;
    if(status === 'alumni'){
      showNotice(s, IMT.greeting(s), 'Term 6 is done, so there are no more weekly schedules for ' + s.batchLabel + '.');
      return;
    }
    if(status === 'no_schedule'){
      showNotice(s, IMT.greeting(s), s.campus === 'Dubai' ?
        'Term ' + s.term + ' is at the Dubai campus. Weekly schedules here cover the Ghaziabad campus.' :
        'The weekly schedule for ' + [s.programme, s.batchLabel].filter(Boolean).join(', ') + ' is coming soon.');
      return;
    }
    if(status === 'no_roster'){
      showNotice(s, IMT.greeting(s), 'Your course registration for ' + s.batchLabel +
        ' isn\'t loaded yet, so we can\'t build your week. It\'s being added soon.');
      return;
    }

    curStudent = s;
    var shown = live.map(function(data){ return { data: data, view: buildView(data, s) }; });
    var last = shown[shown.length - 1].data;
    var label = shown.length === 1 ? weekLabel(first) : rangeLabel({ start: first.start, end: last.end });
    var firstView = shown[0].view;
    lastResult = { student: s, shown: shown, label: label };

    eyebrow.textContent = label;
    eyebrow.hidden = false;
    weekOut.textContent = label;
    nameOut.textContent = IMT.greeting(s);
    // the roll number, then programme, batch, term and section, one chip each
    metaOut.innerHTML = '<span class="id-chip id-chip-roll">Roll ' + IMT.escapeHtml(s.roll) + '</span>' +
      IMT.metaLine(s).split(' · ').filter(Boolean).map(function(part){
        return '<span class="id-chip">' + IMT.escapeHtml(part) + '</span>';
      }).join('');
    backBtn.href = '../?roll=' + encodeURIComponent(s.roll);
    bannerEl.textContent = firstView.banner;
    bannerEl.hidden = !firstView.banner;

    // every day of every shown week, then: current day first, days to come, days gone
    var days = [];
    shown.forEach(function(w, wi){
      w.data.days.forEach(function(day, di){ days.push({ wi: wi, di: di, date: day.date }); });
    });
    // an occasion still to come shows on its day whether or not that week's
    // schedule has been uploaded: such a day is added with nothing but the
    // occasion on it
    var covered = {};
    days.forEach(function(d){ covered[d.date] = true; });
    (IMT.config.events || []).forEach(function(e){
      if(!appliesTo(e) || e.banner === 'week') return;
      for(var d = e.date < E ? E : e.date; d <= (e.until || e.date); d = IMT.addDays(d, 1)){
        if(d >= E && !covered[d]){ covered[d] = true; days.push({ wi: -1, di: -1, date: d }); }
        if(d > '2100-01-01') break;
      }
    });
    days.sort(function(a, b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    var order = IMT.todayFirst(days.map(function(d){ return d.date; }), E);
    // the divider is needed whenever days gone follow days still to come
    var mixed = order.some(function(o){ return o.past; }) && order.some(function(o){ return !o.past; });
    var earlierShown = false, lastWeek = null;
    // the Monday of the week the schedule day falls in: days before it are
    // from a week that is over, not "earlier this week"
    var pe = parseIso(E);
    var weekStart = IMT.addDays(E, -((new Date(Date.UTC(pe.y, pe.mo - 1, pe.d)).getUTCDay() + 6) % 7));
    var cardIndex = 0;
    listEl.innerHTML = weekBanners(E) + order.map(function(o){
      var slot = days[o.i];
      if(slot.wi < 0){
        // a day outside every uploaded week, listed only for its occasion
        var p = parseIso(slot.date);
        var name = DAY_NAMES[(new Date(Date.UTC(p.y, p.mo - 1, p.d)).getUTCDay() + 6) % 7];
        return '<div class="day-group' + (slot.date === E ? ' is-today' : '') + '">' +
          '<div class="day-title">' + name + ', ' + p.d + ' ' + MONTHS[p.mo] + ' ' + p.y +
          (slot.date === E ? '<span class="today-badge">' + (E === realToday ? 'Today' : 'Tomorrow') + '</span>' : '') + '</div>' +
          eventsOn(slot.date, 'top').map(eventBanner).join('') +
          (holidayOn(slot.date) ? '<div class="day-note">' + IMT.escapeHtml(holidayOn(slot.date)) + '</div>'
                               : '<div class="day-free">The class schedule for this day is not uploaded yet.</div>') +
          eventsOn(slot.date, 'after').map(eventBanner).join('') + '</div>';
      }
      var data = shown[slot.wi].data, view = shown[slot.wi].view, di = slot.di, day = data.days[di];
      var third = data.rowLabel || 'Section';
      var tint = TINTS[di % TINTS.length];
      var classes = view.classes.filter(function(x){ return x.d === di; });
      var specials = view.specials.filter(function(sp){ return sp.d === di; });
      var groups = view.groups.filter(function(x){ return x.d === di; });
      var isCurrent = day.date === E;
      var title = '<div class="day-title">' + dayLabel(data, di) +
        (isCurrent ? '<span class="today-badge">' + (E === realToday ? 'Today' : 'Tomorrow') + '</span>' : '') + '</div>';
      var occasions = day.date >= E ? eventsOn(day.date, 'top') : []; // gone once its day has passed
      var afterClasses = day.date >= E ? eventsOn(day.date, 'after') : []; // held once classes are over
      // a holiday for everyone (set on an occasion) shows unless the schedule has its own note
      var note = day.note || holidayOn(day.date);
      var body = occasions.map(eventBanner).join('') +
        (note ? '<div class="day-note">' + IMT.escapeHtml(note) + '</div>' : '');

      // classes and one-off entries share the grid, in time order
      var cards = classes.map(function(x){ return { s: x.s, row: x.row || '', html: function(){
        var clash = view.clash[x.d + ':' + x.s];
        var name = courseName(data, x.c);
        return '<div class="exam-card cls-card" style="animation-delay:' + (Math.min(cardIndex++, 30) * 0.03).toFixed(2) + 's">' +
          timeCell(tint, clock(data.slots[x.s][0]), clock(data.slots[x.s][1])) +
          '<div class="cls-main">' +
            '<div class="exam-subject">' + IMT.escapeHtml(name) +
              (view.tagElectives && data.electives.indexOf(x.c) >= 0 ? '<span class="elective-badge">Elective</span>' : '') +
              (clash ? '<span class="clash-badge">Clash</span>' : '') + '</div>' +
            (x.grp ? '<div class="cls-tags"><span class="group-badge">Group ' + IMT.escapeHtml(x.grp) + '</span></div>' : '') +
            metaLine([['Room', x.room || '-'], x.grp ? null : [third, rowText(x)], ['Session', x.n]].filter(Boolean)) +
          '</div>' + calButton(classLink(data, x), name) + '</div>';
      }}; }).concat(specials.map(function(sp){ return { s: sp.s, row: '', html: function(){
        return '<div class="exam-card cls-card" style="animation-delay:' + (Math.min(cardIndex++, 30) * 0.03).toFixed(2) + 's">' +
          timeCell(tint, clock(data.slots[sp.s][0]), clock(data.slots[sp.s + sp.span - 1][1])) +
          '<div class="cls-main">' +
            '<div class="exam-subject">' + IMT.escapeHtml(sp.text) + '</div>' +
            metaLine([[third + (sp.rows.length > 1 ? 's' : ''), sp.rows.join(', ') || 'All']]) +
          '</div>' +
          calButton(googleCalendarLink(data, sp.d, sp.s, sp.span, sp.text, 'As printed on the weekly schedule.', ''), sp.text) + '</div>';
      }}; }));
      cards.sort(function(a, b){ return a.s - b.s || (a.row < b.row ? -1 : a.row > b.row ? 1 : 0); });
      if(cards.length){
        body += '<div class="card-grid">' + cards.map(function(c){ return c.html(); }).join('') + '</div>';
      }

      if(groups.length){
        var byCourse = {};
        groups.forEach(function(x){ (byCourse[x.c] = byCourse[x.c] || []).push(x); });
        body += Object.keys(byCourse).map(function(code){
          return '<div class="group-card">' +
            '<div class="group-head">' + IMT.escapeHtml(courseName(data, code)) + ' <span>group sessions, attend only your own group</span></div>' +
            '<ul class="group-list">' + byCourse[code].sort(function(a, b){
              // groups are numbered (1, 2, 11) in one programme and lettered (A, B, C) in another
              return (isNaN(a.grp) || isNaN(b.grp) ? String(a.grp).localeCompare(String(b.grp)) : a.grp - b.grp) || a.s - b.s;
            }).map(function(x){
              return '<li><span class="group-name">Group ' + IMT.escapeHtml(x.grp) + '</span>' +
                '<span>' + slotLabel(data, x.s) + '</span><span>Room ' + IMT.escapeHtml(x.room || '-') + '</span>' +
                '<span>Session ' + x.n + '</span>' +
                calButton(classLink(data, x), courseName(data, x.c) + ' group ' + x.grp) + '</li>';
            }).join('') + '</ul></div>';
        }).join('');
      }
      if(!cards.length && !groups.length && !day.note){
        body += '<div class="day-free">No classes</div>';
      }

      // headings between stretches of days: a new week starting, and the days gone
      var divider = '';
      if(mixed && o.past && !earlierShown){
        earlierShown = true;
        divider = '<div class="earlier-divider">' + (slot.date < weekStart ? 'Last week' : 'Earlier this week') + '</div>';
      } else if(!o.past && lastWeek !== null && slot.wi !== lastWeek){
        divider = '<div class="earlier-divider">' + weekLabel(data) + '</div>';
      }
      if(!o.past) lastWeek = slot.wi;
      body += afterClasses.map(eventBanner).join('');
      return divider + '<div class="day-group' + (isCurrent ? ' is-today' : '') + (o.past && mixed ? ' is-past' : '') + '">' + title + body + '</div>';
    }).join('');

    results.hidden = false;
    IMT.attachTilt(listEl.querySelectorAll('.exam-card'));
    watchReach(s);
  }

  // This page has no search of its own: the portal is the only way in, and
  // it passes the roll in the URL. No roll, or one the portal doesn't know,
  // goes straight back there.
  // (the installed app's "Weekly schedule" shortcut opens this page with
  // no roll in the address: the one this device remembers is used)
  var fromUrl = IMT.rollFromUrl() || IMT.savedRoll();
  var visitor = IMT.student(fromUrl);
  if(!fromUrl){
    window.location.replace('../');
  } else if(!visitor.groupKey){
    window.location.replace('../?roll=' + encodeURIComponent(fromUrl));
  } else {
    showWeek(visitor);
  }
})();
