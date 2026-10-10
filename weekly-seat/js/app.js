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
  var pdfBtn = document.getElementById('pdfBtn');
  var backBtn = document.getElementById('backBtn');
  var otherBtn = document.getElementById('otherWeekBtn');
  var eyebrow = document.getElementById('eyebrow');

  var lastResult = null; // {student, data, view} for what is on screen, used to build the PDF

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
  function buildView(data, s){
    var view = { all: false, classes: [], groups: [], specials: [], banner: '' };
    var key = data.mode === 'track' ? s.track : s.section;
    var what = (data.rowLabel || 'section').toLowerCase();
    var hasCourses = Object.keys(s.courses).length > 0;
    var isElective = function(x){ return data.electives.indexOf(x.c) >= 0; };
    if(data.mode === 'course' || (data.mode === 'track' && hasCourses)){
      // each class names its course and section: the student's own registrations decide
      view.classes = data.sessions.filter(function(x){ return s.courses[x.c] === x.sec; });
    } else {
      view.all = !key;
      if(view.all){
        view.banner = 'Your ' + what + ' isn\'t loaded yet, so this shows every ' + what + ' of ' +
          (s.programme || 'your programme') + '. Check the ' + what + ' on each class.';
      }
      // electives are tagged only while we don't know which one this student chose
      view.tagElectives = data.electives.length > 0 && !s.electives;
      if(view.tagElectives){
        view.banner += (view.banner ? ' ' : '') + 'Classes tagged Elective are only for students who chose that course.';
      }
      data.sessions.forEach(function(x){
        if(x.grp){ view.groups.push(x); return; }
        if(isElective(x)){
          // an elective is attended by those who chose it, whichever section's
          // row it is printed in; with no choice on file, every elective is
          // shown (tagged) so the student can pick out their own
          if(!s.electives || s.electives.indexOf(x.c) >= 0) view.classes.push(x);
          return;
        }
        if(!view.all && x.row !== key) return;
        view.classes.push(x);
      });
      view.specials = data.specials.filter(function(sp){
        return view.all || !sp.rows.length || sp.rows.indexOf(key) >= 0;
      });
    }
    view.clash = {};
    if(!view.all){
      var seen = {};
      view.classes.forEach(function(x){ var k = x.d + ':' + x.s; seen[k] = (seen[k] || 0) + 1; });
      Object.keys(seen).forEach(function(k){ if(seen[k] > 1) view.clash[k] = true; });
    }
    return view;
  }

  // ---- page states ----
  pdfBtn.addEventListener('click', function(){ savePdf(); });
  listEl.addEventListener('click', function(e){
    if(lastResult && e.target.closest('.card-cal-link')){
      IMT.track('add_to_calendar', lastResult.student, { tool: 'weekly' });
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
    return '<a class="card-cal-link cls-cal" href="' + href + '" target="_blank" rel="noopener" title="Add to Google Calendar" ' +
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
  function eventsOn(date, place){
    return ((IMT.config.events) || []).filter(function(e){
      return e.date === date && (!place || (e.place === 'after' ? 'after' : 'top') === place);
    });
  }
  function eventBanner(e){
    var theme = e.theme === 'onam' || e.theme === 'sports' ? e.theme : 'plain';
    return '<div class="event-banner event-' + theme + '">' + (theme === 'onam' ? pookalam() : theme === 'sports' ? crescent() : '') +
      '<div class="event-text"><div class="event-title">' + IMT.escapeHtml(e.title) + '</div>' +
      (e.note ? '<div class="event-note">' + IMT.escapeHtml(e.note) + '</div>' : '') +
      (e.by ? '<div class="event-by">' + IMT.escapeHtml(e.by) + '</div>' : '') + '</div>' +
      (e.link ? '<a class="event-link" href="' + IMT.escapeHtml(e.link) + '" target="_blank" rel="noopener" data-event="' + IMT.escapeHtml(e.title) + '" ' +
        'title="Open" aria-label="' + IMT.escapeHtml(e.title + (e.note ? ', ' + e.note : '')) + ': open the link">' +
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>' : '') +
      (theme === 'sports' ? sun() : '') +
      '</div>';
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
    IMT.track('tool_open', s, { tool: 'weekly', status: status });
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

    var shown = live.map(function(data){ return { data: data, view: buildView(data, s) }; });
    var last = shown[shown.length - 1].data;
    var label = shown.length === 1 ? weekLabel(first) : rangeLabel({ start: first.start, end: last.end });
    var firstView = shown[0].view;
    lastResult = { student: s, shown: shown, label: label };

    eyebrow.textContent = label;
    eyebrow.hidden = false;
    weekOut.textContent = label;
    nameOut.textContent = IMT.greeting(s);
    metaOut.textContent = 'Roll number ' + s.roll + (IMT.metaLine(s) ? ' · ' + IMT.metaLine(s) : '');
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
      if(e.date >= E && !covered[e.date]){ covered[e.date] = true; days.push({ wi: -1, di: -1, date: e.date }); }
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
    listEl.innerHTML = order.map(function(o){
      var slot = days[o.i];
      if(slot.wi < 0){
        // a day outside every uploaded week, listed only for its occasion
        var p = parseIso(slot.date);
        var name = DAY_NAMES[(new Date(Date.UTC(p.y, p.mo - 1, p.d)).getUTCDay() + 6) % 7];
        return '<div class="day-group' + (slot.date === E ? ' is-today' : '') + '">' +
          '<div class="day-title">' + name + ', ' + p.d + ' ' + MONTHS[p.mo] + ' ' + p.y +
          (slot.date === E ? '<span class="today-badge">' + (E === realToday ? 'Today' : 'Tomorrow') + '</span>' : '') + '</div>' +
          eventsOn(slot.date, 'top').map(eventBanner).join('') +
          '<div class="day-free">The class schedule for this day is not uploaded yet.</div>' +
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
      var body = occasions.map(eventBanner).join('') +
        (day.note ? '<div class="day-note">' + IMT.escapeHtml(day.note) + '</div>' : '');

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
            metaLine([['Room', x.room || '-'], [third, rowText(x)], ['Session', x.n]]) +
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
  }

  // ---- PDF ----
  // Brand colors sampled from assets/imt-logo.png.
  var PDF_NAVY = [30,57,140];
  var PDF_GOLD = [212,165,42];
  var PDF_MUTED = [120,120,120];
  var PDF_INK = [25,25,25];

  // Small vector calendar glyph (outline square + filled header strip).
  function drawCalendarIcon(doc, x, y, size){
    doc.setDrawColor.apply(doc, PDF_NAVY);
    doc.setFillColor.apply(doc, PDF_NAVY);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, size, size, 0.3, 0.3, 'S');
    doc.rect(x, y, size, size * 0.32, 'F');
  }

  function buildPdf(){
    var jsPDFCtor = window.jspdf && window.jspdf.jsPDF;
    if(!jsPDFCtor || !lastResult) return null;
    // Students think in weeks, so the PDF is one week: the week that is
    // running (or, if none is, the one on screen), even when the page also
    // lists the week after.
    var s = lastResult.student, shown = lastResult.shown.slice(0, 1), banner = shown[0].view.banner;
    var weekCount = shown[0].view.classes.length;

    var doc = new jsPDFCtor({ unit:'mm', format:'a4' });
    var marginX = 16, y = 20;
    var pageW = doc.internal.pageSize.getWidth();
    var pageH = doc.internal.pageSize.getHeight();

    doc.setFont('helvetica','bold');
    doc.setFontSize(17);
    doc.setTextColor.apply(doc, PDF_NAVY);
    doc.text('IMT NEVER SLEEPS', marginX, y);
    y += 3;
    doc.setDrawColor.apply(doc, PDF_GOLD);
    doc.setLineWidth(0.6);
    doc.line(marginX, y, pageW - marginX, y);
    y += 7;

    doc.setFont('helvetica','normal');
    doc.setFontSize(10.5);
    doc.setTextColor.apply(doc, PDF_MUTED);
    doc.text('Weekly Schedule, ' + weekLabel(shown[0].data).replace(' · ', ', '), marginX, y);
    y += 9;

    doc.setFont('helvetica','bold');
    doc.setFontSize(12);
    doc.setTextColor.apply(doc, PDF_INK);
    doc.text('Personalised Schedule for : ' + s.roll, marginX, y);
    doc.setFont('helvetica','normal');
    doc.setFontSize(9);
    doc.setTextColor.apply(doc, PDF_MUTED);
    doc.text(weekCount + (weekCount === 1 ? ' class' : ' classes') + (shown[0].view.all ? ', all ' + shown[0].data.rowLabel.toLowerCase() + 's' : ''),
      pageW - marginX, y, { align:'right' });
    y += 5;
    doc.setFontSize(9.5);
    doc.text([s.name, IMT.metaLine(s).replace(/ · /g, ', ')].filter(Boolean).join(', '), marginX, y);
    y += 6;

    // in calendar order
    var third = shown[0].data.rowLabel || 'Section';
    var rows = [], calLinks = [];
    shown.forEach(function(w){
      var data = w.data, view = w.view;
      data.days.forEach(function(day, di){
        if(day.note){ rows.push([dayLabel(data, di), '', day.note, '', '']); calLinks.push(null); }
        var items = view.classes.filter(function(x){ return x.d === di; }).map(function(x){
          return { s: x.s, row: [dayLabel(data, di), slotLabel(data, x.s),
            courseName(data, x.c) + (view.tagElectives && data.electives.indexOf(x.c) >= 0 ? ' (elective)' : ''),
            (rowText(x) || '-') + ' · ' + x.n, x.room || '-'], link: classLink(data, x) };
        }).concat(view.specials.filter(function(sp){ return sp.d === di; }).map(function(sp){
          return { s: sp.s, row: [dayLabel(data, di), slotLabel(data, sp.s, sp.span), sp.text, sp.rows.join(', '), ''],
            link: googleCalendarLink(data, sp.d, sp.s, sp.span, sp.text, 'As printed on the weekly schedule.', '') };
        })).concat(view.groups.filter(function(x){ return x.d === di; }).map(function(x){
          return { s: x.s, row: [dayLabel(data, di), slotLabel(data, x.s), courseName(data, x.c) + ', Group ' + x.grp + ' only',
            'G' + x.grp + ' · ' + x.n, x.room || '-'], link: classLink(data, x) };
        }));
        items.sort(function(a, b){ return a.s - b.s; });
        items.forEach(function(it){ rows.push(it.row); calLinks.push(it.link); });
      });
    });
    var calIconSize = 3.2;

    doc.autoTable({
      startY: y,
      margin: { left: marginX, right: marginX, bottom: 26 },
      head: [['Day','Time','Course', third + ' · Session','Room']],
      body: rows,
      theme: 'grid',
      styles: { font:'helvetica', fontSize:8.5, cellPadding:2, textColor:PDF_INK, lineColor:[210,210,210], lineWidth:0.2, overflow:'linebreak' },
      headStyles: { fillColor:[245,247,251], textColor:PDF_NAVY, fontStyle:'bold', halign:'left' },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 34 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 28 },
        4: { cellWidth: 26 + calIconSize + 3 }
      },
      // Calendar icon tucked into the Room cell - click it to add that class.
      didDrawCell: function(cell){
        if(cell.column.index !== 4 || cell.row.section !== 'body') return;
        var url = calLinks[cell.row.index];
        if(!url) return;
        var iconX = cell.cell.x + cell.cell.width - 2.6 - calIconSize;
        var iconY = cell.cell.y + cell.cell.height / 2 - calIconSize / 2;
        drawCalendarIcon(doc, iconX, iconY, calIconSize);
        doc.link(iconX - 0.8, iconY - 0.8, calIconSize + 1.6, calIconSize + 1.6, { url: url });
      }
    });

    // Footer on the last page, anchored to the bottom.
    var maxTextW = pageW - marginX * 2;
    doc.setFontSize(7.5);
    doc.setTextColor.apply(doc, PDF_MUTED);
    var disclaimerLines = doc.splitTextToSize(
      (banner ? banner + ' ' : '') +
      'Unofficial, and still in development. This schedule is built from weekly schedules and lists shared by students, so a detail may occasionally be missing or out of date. Classes also get rescheduled, so please confirm against the latest official schedule.',
      maxTextW
    );
    var creditY = pageH - 12;
    var disclaimerY = creditY - 5 - (disclaimerLines.length - 1) * 3.4;
    doc.setDrawColor(224,224,224);
    doc.setLineWidth(0.2);
    doc.line(marginX, disclaimerY - 6, pageW - marginX, disclaimerY - 6);
    doc.text(disclaimerLines, marginX, disclaimerY);
    doc.setFontSize(8);
    doc.setTextColor.apply(doc, PDF_NAVY);
    doc.textWithLink('Created by Khush Goyal', marginX, creditY, { url: 'https://www.linkedin.com/in/khushgoyal17/' });
    // the feedback form, right-aligned on the credit line
    var feedbackUrl = window.IMT.config.feedbackUrl;
    if(feedbackUrl){
      var fbText = 'Something wrong, or an idea? Give feedback';
      doc.textWithLink(fbText, pageW - marginX - doc.getTextWidth(fbText), creditY, { url: feedbackUrl });
    }

    return doc;
  }

  function savePdf(){
    var doc;
    try{ doc = buildPdf(); }
    catch(e){ doc = null; }
    if(!doc){ window.alert('Could not prepare the PDF. Please try again.'); return; }
    try{
      var week = lastResult.shown[0].data;
      doc.save(lastResult.student.roll + '_' + (week.weekNumber ? 'week' + week.weekNumber + '_' : '') + week.start + '_schedule.pdf');
      IMT.track('save_pdf', lastResult.student, { tool: 'weekly' });
    }
    catch(e){ window.alert('Could not save the PDF. Please try again.'); }
  }

  // This page has no search of its own: the portal is the only way in, and
  // it passes the roll in the URL. No roll, or one the portal doesn't know,
  // goes straight back there.
  var fromUrl = IMT.rollFromUrl();
  var visitor = IMT.student(fromUrl);
  if(!fromUrl){
    window.location.replace('../');
  } else if(!visitor.groupKey){
    window.location.replace('../?roll=' + encodeURIComponent(fromUrl));
  } else {
    showWeek(visitor);
  }
})();
