(function(){
"use strict";
  var IMT = window.IMT;
  var WEEKLY = window.WEEKLY_DATA || {}; // batch -> this week's schedule, see scripts/generate_weekly_data.py
  var TINTS = ['var(--color-sky-wash)','var(--color-peach-wash)','var(--color-mint-wash)'];
  var DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  var MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  // session tuple: [dayIndex, slotIndex, course, section, session no., room]
  var S_DAY = 0, S_SLOT = 1, S_COURSE = 2, S_SEC = 3, S_NUM = 4, S_ROOM = 5;

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
  var pdfBtn = document.getElementById('pdfBtn');
  var backBtn = document.getElementById('backBtn');

  var lastResult = null; // {student, data, sessions} for the current search, used to build the PDF

  // ---- formatting ----
  function parseIso(iso){
    var p = iso.split('-');
    return { y:+p[0], mo:+p[1], d:+p[2] };
  }
  function dayLabel(data, dayIdx){
    var dt = parseIso(data.days[dayIdx].date);
    return DAY_NAMES[dayIdx] + ', ' + dt.d + ' ' + MONTHS[dt.mo] + ' ' + dt.y;
  }
  function weekLabel(data){
    var a = parseIso(data.week.start), b = parseIso(data.week.end);
    var range = a.d + ' ' + MONTHS[a.mo] + ' - ' + b.d + ' ' + MONTHS[b.mo] + ' ' + b.y;
    return (data.week.number ? 'Week ' + data.week.number + ' · ' : '') + range;
  }
  function minutes(hhmm){
    var p = hhmm.split(':');
    return +p[0] * 60 + +p[1];
  }
  function clock(hhmm){
    var m = minutes(hhmm), h = Math.floor(m / 60), mi = m % 60;
    return ((h + 11) % 12 + 1) + ':' + (mi < 10 ? '0' : '') + mi + ' ' + (h < 12 ? 'AM' : 'PM');
  }
  function slotLabel(data, slotIdx){
    var s = data.slots[slotIdx];
    var a = clock(s[0]), b = clock(s[1]);
    // "2:00 - 3:15 PM" when both ends share AM/PM, so it fits one line on phones
    if(a.slice(-2) === b.slice(-2)) a = a.slice(0, -3);
    return a + ' - ' + b;
  }
  function courseName(data, abbr){
    return data.courses[abbr] ? data.courses[abbr].name : abbr;
  }

  // ---- per-class "Add to Calendar" links ----
  // Class times are IST wall-clock time, so convert IST -> UTC (IST is
  // UTC+5:30) for the link's dates param rather than appending a bare "Z".
  var IST_OFFSET_MIN = 5 * 60 + 30;
  function pad2(n){ n = String(n); return n.length < 2 ? '0' + n : n; }
  function googleCalStamp(utcMs){
    var d = new Date(utcMs);
    return d.getUTCFullYear() + pad2(d.getUTCMonth() + 1) + pad2(d.getUTCDate()) +
      'T' + pad2(d.getUTCHours()) + pad2(d.getUTCMinutes()) + '00Z';
  }
  function googleCalendarLink(data, s){
    var dt = parseIso(data.days[s[S_DAY]].date);
    var slot = data.slots[s[S_SLOT]];
    var dayUtcMs = Date.UTC(dt.y, dt.mo - 1, dt.d) - IST_OFFSET_MIN * 60000;
    var params = {
      action: 'TEMPLATE',
      text: courseName(data, s[S_COURSE]) + ' (Section ' + s[S_SEC] + ')',
      dates: googleCalStamp(dayUtcMs + minutes(slot[0]) * 60000) + '/' + googleCalStamp(dayUtcMs + minutes(slot[1]) * 60000),
      details: s[S_COURSE] + ' section ' + s[S_SEC] + ', session ' + s[S_NUM] + ', room ' + s[S_ROOM] +
        '. Unofficial schedule from IMT Never Sleeps, always confirm against the official weekly schedule.',
      location: s[S_ROOM]
    };
    return 'https://calendar.google.com/calendar/render?' + Object.keys(params).map(function(k){
      return k + '=' + encodeURIComponent(params[k]);
    }).join('&');
  }

  // ---- the student's week ----
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

  function showWeek(s){
    var data = WEEKLY[s.batchKey];
    IMT.track('tool_open', s, { tool: 'weekly',
      status: s.alumni ? 'alumni' : !data ? 'no_schedule' : !s.inRoster ? 'no_roster' : 'shown' });
    if(s.alumni){
      showNotice(s, IMT.greeting(s), 'Term 6 is done, so there are no more weekly schedules for ' + s.batchLabel + '.');
      return;
    }
    if(!data){
      showNotice(s, IMT.greeting(s), 'The weekly schedule for ' + s.batchLabel + ' is coming soon.');
      return;
    }
    if(!s.inRoster){
      showNotice(s, IMT.greeting(s), 'Your course list for ' + s.batchLabel +
        ' isn\'t loaded yet, so we can\'t build your week. It\'s being added soon.');
      return;
    }

    // A student's week = every session whose course + section they're registered in.
    var mine = data.sessions.filter(function(x){ return s.courses[x[S_COURSE]] === x[S_SEC]; });
    var perSlot = {};
    mine.forEach(function(x){
      var k = x[S_DAY] + ':' + x[S_SLOT];
      perSlot[k] = (perSlot[k] || 0) + 1;
    });
    lastResult = { student: s, data: data, sessions: mine };

    weekOut.textContent = weekLabel(data);
    nameOut.textContent = IMT.greeting(s);
    metaOut.textContent = 'Roll number ' + s.roll + (IMT.metaLine(s) ? ' · ' + IMT.metaLine(s) : '');
    countOut.textContent = mine.length + (mine.length === 1 ? ' class' : ' classes');
    backBtn.href = '../?roll=' + encodeURIComponent(s.roll);

    var today = IMT.todayIso();
    var cardIndex = 0;
    listEl.innerHTML = data.days.map(function(day, di){
      var items = mine.filter(function(x){ return x[S_DAY] === di; });
      var tint = TINTS[di % TINTS.length];
      var title = '<div class="day-title">' + dayLabel(data, di) +
        (day.date === today ? '<span class="today-badge">Today</span>' : '') + '</div>';
      var body = '';
      if(day.note){
        body += '<div class="day-note">' + IMT.escapeHtml(day.note) + '</div>';
      }
      if(items.length){
        body += '<div class="card-grid">' + items.map(function(x){
          var delay = (cardIndex++ * 0.04).toFixed(2);
          var clash = perSlot[x[S_DAY] + ':' + x[S_SLOT]] > 1;
          return '' +
            '<div class="exam-card" style="animation-delay:' + delay + 's">' +
              '<div class="exam-subject">' + IMT.escapeHtml(courseName(data, x[S_COURSE])) +
                (clash ? '<span class="clash-badge">Clash</span>' : '') + '</div>' +
              '<div class="detail-grid">' +
                '<div class="detail" style="--tint:' + tint + '"><div class="k">Time</div><div class="v">' + slotLabel(data, x[S_SLOT]) + '</div></div>' +
                '<div class="detail" style="--tint:' + tint + '"><div class="k">Room</div><div class="v">' + IMT.escapeHtml(x[S_ROOM]) + '</div></div>' +
                '<div class="detail" style="--tint:' + tint + '"><div class="k">Section</div><div class="v">' + IMT.escapeHtml(x[S_SEC]) + '</div></div>' +
                '<div class="detail" style="--tint:' + tint + '"><div class="k">Session</div><div class="v">' + x[S_NUM] + '</div></div>' +
              '</div>' +
              '<a class="card-cal-link" href="' + googleCalendarLink(data, x) + '" target="_blank" rel="noopener">' +
                '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M16 3v4M8 3v4M3 11h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' +
                'Add to Calendar</a>' +
            '</div>';
        }).join('') + '</div>';
      } else if(!day.note){
        body += '<div class="day-free">No classes</div>';
      }
      return '<div class="day-group' + (day.date === today ? ' is-today' : '') + '">' + title + body + '</div>';
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
    var s = lastResult.student, data = lastResult.data, mine = lastResult.sessions;

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
    doc.text(mine.length + (mine.length === 1 ? ' class' : ' classes'), pageW - marginX, y, { align:'right' });
    y += 5;
    doc.setFontSize(9.5);
    doc.text([s.name, IMT.metaLine(s).replace(/ · /g, ', ')].filter(Boolean).join(', '), marginX, y);
    y += 6;

    var rows = [];
    var calLinks = [];
    data.days.forEach(function(day, di){
      var items = mine.filter(function(x){ return x[S_DAY] === di; });
      if(day.note){
        rows.push([dayLabel(data, di), '', day.note, '', '']);
        calLinks.push(null);
      }
      items.forEach(function(x){
        rows.push([
          dayLabel(data, di),
          slotLabel(data, x[S_SLOT]),
          courseName(data, x[S_COURSE]),
          x[S_SEC] + ' · ' + x[S_NUM],
          x[S_ROOM]
        ]);
        calLinks.push(googleCalendarLink(data, x));
      });
    });
    var calIconSize = 3.2;

    doc.autoTable({
      startY: y,
      margin: { left: marginX, right: marginX, bottom: 26 },
      head: [['Day','Time','Course','Sec · Session','Room']],
      body: rows,
      theme: 'grid',
      styles: { font:'helvetica', fontSize:8.5, cellPadding:2, textColor:PDF_INK, lineColor:[210,210,210], lineWidth:0.2, overflow:'linebreak' },
      headStyles: { fillColor:[245,247,251], textColor:PDF_NAVY, fontStyle:'bold', halign:'left' },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 34 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 24 },
        4: { cellWidth: 28 + calIconSize + 3 }
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
      'Unofficial tool built from IMT Ghaziabad\'s official weekly schedule and course registration list. Classes get rescheduled; please confirm against the latest official schedule.',
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

    return doc;
  }

  function savePdf(){
    var doc;
    try{ doc = buildPdf(); }
    catch(e){ doc = null; }
    if(!doc){ window.alert('Could not prepare the PDF. Please try again.'); return; }
    var week = lastResult.data.week.number ? '_week' + lastResult.data.week.number : '';
    try{
      doc.save(lastResult.student.roll + week + '_schedule.pdf');
      IMT.track('save_pdf', lastResult.student, { tool: 'weekly' });
    }
    catch(e){ window.alert('Could not save the PDF. Please try again.'); }
  }

  // The eyebrow names the newest week on file, whichever batch it belongs to.
  var eyebrow = document.getElementById('eyebrow');
  var latest = Object.keys(WEEKLY).map(function(k){ return WEEKLY[k]; }).sort(function(a, b){
    return a.week.start < b.week.start ? 1 : -1;
  })[0];
  if(latest){
    eyebrow.textContent = weekLabel(latest);
    eyebrow.hidden = false;
  }

  // This page has no search of its own: the portal is the only way in, and
  // it passes the roll in the URL. No roll, or one the portal doesn't know,
  // goes straight back there.
  var fromUrl = IMT.rollFromUrl();
  var visitor = IMT.student(fromUrl);
  if(!fromUrl){
    window.location.replace('../');
  } else if(!visitor.batchKey){
    window.location.replace('../?roll=' + encodeURIComponent(fromUrl));
  } else {
    showWeek(visitor);
  }
})();
