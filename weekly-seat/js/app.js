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
  var countOut = document.getElementById('countOut');
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
    if(data.mode === 'course'){
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
        if(!view.all && x.row !== key) return;
        if(data.electives.indexOf(x.c) >= 0 && s.electives && s.electives.indexOf(x.c) < 0) return;
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
  });

  function showNotice(s, title, text){
    results.hidden = true;
    noticeTitle.textContent = title;
    noticeText.textContent = text;
    noticeBack.href = '../?roll=' + encodeURIComponent(s.roll);
    notice.hidden = false;
  }

  function detail(tint, k, v){
    return '<div class="detail" style="--tint:' + tint + '"><div class="k">' + k + '</div><div class="v">' + IMT.escapeHtml(v) + '</div></div>';
  }
  function calLink(href){
    return '<a class="card-cal-link" href="' + href + '" target="_blank" rel="noopener">' + CAL_ICON + 'Add to Calendar</a>';
  }

  function showWeek(s, data){
    var weeks = WEEKLY[s.groupKey] || [];
    data = data || IMT.pickWeek(weeks);
    var status = s.alumni ? 'alumni' : !data ? 'no_schedule' :
      (data.mode === 'course' && !Object.keys(s.courses).length) ? 'no_roster' : 'shown';
    IMT.track('tool_open', s, { tool: 'weekly', status: status });
    lastResult = null;
    notice.hidden = true;
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

    var view = buildView(data, s);
    lastResult = { student: s, data: data, view: view };
    var total = view.classes.length;

    eyebrow.textContent = weekLabel(data);
    eyebrow.hidden = false;
    weekOut.textContent = weekLabel(data);
    nameOut.textContent = IMT.greeting(s);
    metaOut.textContent = 'Roll number ' + s.roll + (IMT.metaLine(s) ? ' · ' + IMT.metaLine(s) : '');
    countOut.textContent = total + (total === 1 ? ' class' : ' classes') + (view.all ? ', all ' + data.rowLabel.toLowerCase() + 's' : '');
    backBtn.href = '../?roll=' + encodeURIComponent(s.roll);
    bannerEl.textContent = view.banner;
    bannerEl.hidden = !view.banner;

    var other = weeks.filter(function(w){ return w.start !== data.start; })[0];
    otherBtn.hidden = !other;
    if(other){
      otherBtn.textContent = (other.start > data.start ? 'Next week: ' : 'Previous week: ') + rangeLabel(other);
      otherBtn.onclick = function(){ showWeek(s, other); window.scrollTo(0, 0); };
    }

    var today = IMT.todayIso();
    var cardIndex = 0;
    var third = data.rowLabel || 'Section';
    // today's classes come first, then the rest of the week, then the days gone
    var order = IMT.todayFirst(data.days.map(function(d){ return d.date; }), today);
    // the divider is needed whenever days gone follow days still to come
    var hasToday = order.some(function(o){ return o.past; }) && order.some(function(o){ return !o.past; });
    var earlierShown = false;
    listEl.innerHTML = order.map(function(o){
      var di = o.i, day = data.days[di];
      var tint = TINTS[di % TINTS.length];
      var classes = view.classes.filter(function(x){ return x.d === di; });
      var specials = view.specials.filter(function(sp){ return sp.d === di; });
      var groups = view.groups.filter(function(x){ return x.d === di; });
      var title = '<div class="day-title">' + dayLabel(data, di) +
        (day.date === today ? '<span class="today-badge">Today</span>' : '') + '</div>';
      var body = day.note ? '<div class="day-note">' + IMT.escapeHtml(day.note) + '</div>' : '';

      // classes and one-off entries share the grid, in time order
      var cards = classes.map(function(x){ return { s: x.s, row: x.row || '', html: function(){
        var clash = view.clash[x.d + ':' + x.s];
        return '<div class="exam-card" style="animation-delay:' + (cardIndex++ * 0.04).toFixed(2) + 's">' +
          '<div class="exam-subject">' + IMT.escapeHtml(courseName(data, x.c)) +
            (view.tagElectives && data.electives.indexOf(x.c) >= 0 ? '<span class="elective-badge">Elective</span>' : '') +
            (clash ? '<span class="clash-badge">Clash</span>' : '') + '</div>' +
          '<div class="detail-grid">' +
            detail(tint, 'Time', slotLabel(data, x.s)) + detail(tint, 'Room', x.room || '-') +
            detail(tint, third, rowText(x) || '-') + detail(tint, 'Session', x.n) +
          '</div>' + calLink(classLink(data, x)) + '</div>';
      }}; }).concat(specials.map(function(sp){ return { s: sp.s, row: '', html: function(){
        return '<div class="exam-card" style="animation-delay:' + (cardIndex++ * 0.04).toFixed(2) + 's">' +
          '<div class="exam-subject">' + IMT.escapeHtml(sp.text) + '</div>' +
          '<div class="detail-grid">' +
            detail(tint, 'Time', slotLabel(data, sp.s, sp.span)) +
            detail(tint, third + (sp.rows.length > 1 ? 's' : ''), sp.rows.join(', ') || 'All') +
          '</div>' +
          calLink(googleCalendarLink(data, sp.d, sp.s, sp.span, sp.text, 'As printed on the weekly schedule.', '')) + '</div>';
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
            '<ul class="group-list">' + byCourse[code].sort(function(a, b){ return a.grp - b.grp || a.s - b.s; }).map(function(x){
              return '<li><span class="group-name">Group ' + IMT.escapeHtml(x.grp) + '</span>' +
                '<span>' + slotLabel(data, x.s) + '</span><span>Room ' + IMT.escapeHtml(x.room || '-') + '</span>' +
                '<span>Session ' + x.n + '</span>' +
                '<a class="card-cal-link" href="' + classLink(data, x) + '" target="_blank" rel="noopener" aria-label="Add Group ' +
                  IMT.escapeHtml(x.grp) + ' to calendar">' + CAL_ICON + '</a></li>';
            }).join('') + '</ul></div>';
        }).join('');
      }
      if(!cards.length && !groups.length && !day.note){
        body += '<div class="day-free">No classes</div>';
      }
      var divider = '';
      if(hasToday && o.past && !earlierShown){
        earlierShown = true;
        divider = '<div class="earlier-divider">Earlier this week</div>';
      }
      return divider + '<div class="day-group' + (day.date === today ? ' is-today' : '') + (o.past && hasToday ? ' is-past' : '') + '">' + title + body + '</div>';
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
    var s = lastResult.student, data = lastResult.data, view = lastResult.view;

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
    doc.text('Weekly Schedule, ' + weekLabel(data).replace(' · ', ', '), marginX, y);
    y += 9;

    doc.setFont('helvetica','bold');
    doc.setFontSize(12);
    doc.setTextColor.apply(doc, PDF_INK);
    doc.text('Personalised Schedule for : ' + s.roll, marginX, y);
    doc.setFont('helvetica','normal');
    doc.setFontSize(9);
    doc.setTextColor.apply(doc, PDF_MUTED);
    doc.text(countOut.textContent, pageW - marginX, y, { align:'right' });
    y += 5;
    doc.setFontSize(9.5);
    doc.text([s.name, IMT.metaLine(s).replace(/ · /g, ', ')].filter(Boolean).join(', '), marginX, y);
    y += 6;

    var third = data.rowLabel || 'Section';
    var rows = [], calLinks = [];
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
      (view.banner ? view.banner + ' ' : '') +
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
      doc.save(lastResult.student.roll + '_week_of_' + lastResult.data.start + '_schedule.pdf');
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
