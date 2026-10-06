(function(){
"use strict";
  var DATA = window.EXAM_DATA;
  var BLOCKS = DATA.blocks; // [subject, date, time, hall]
  // roll -> [[blockIdx,row,col], ...]. Keys are normalised the same way the
  // portal normalises what's typed, so "25FPM-003" in the sheet matches "25FPM003".
  var ROLLS = {};
  Object.keys(DATA.rolls).forEach(function(k){ ROLLS[window.IMT.normRoll(k)] = DATA.rolls[k]; });
  var TINTS = ['var(--color-sky-wash)','var(--color-peach-wash)','var(--color-mint-wash)'];
  var CONFIG = window.EXAM_CONFIG || {};
  var ROSTER = window.ROSTER_DATA || {}; // roll -> {name, course, section, term}, empty until supplied

  // "{title}, {period} ({termsLabel})" - the single place this line is built
  // from, instead of being hardcoded wherever it's shown (eyebrow, PDF).
  function examHeadline(){
    return [CONFIG.title, CONFIG.period].filter(Boolean).join(', ') +
      (CONFIG.termsLabel ? ' (' + CONFIG.termsLabel + ')' : '');
  }

  function rosterLine(roll){
    var r = ROSTER[roll];
    if(!r) return '';
    return [r.name, window.IMT.metaLine(window.IMT.student(roll))].filter(Boolean).join(' · ');
  }

  // ---- subject disambiguation ----
  // A shared exam block's subject string (e.g. "OM; Banking and Treasury
  // Management") can cover more than one course when two terms sit the same
  // slot/hall together. Term 1 rolls start "26", Term 4 rolls start "25".
  // TERM1_ALIASES lists every spelling/abbreviation seen in the sheet for a
  // confirmed Term 1 course (from the student-supplied Term 1 subject list).
  // Everything else in a block is treated as not-Term-1, which for a Term 1
  // roll means it gets dropped; for a Term 4 roll it means it's kept, since
  // Term 1 core courses and Term 4 electives don't otherwise overlap in this
  // dataset. Organisation/Organizational Behaviour is the one subject the
  // student flagged as appearing in both terms, so it is never dropped.
  // Term 4's own subject list has not been supplied yet, so nothing here is
  // guessed beyond that elimination; once given, TERM4_ALIASES can be filled
  // in the same way for a fully confirmed match both ways.
  function normalizeSubject(s){
    return String(s).toLowerCase().replace(/[.,;]+$/,'').replace(/[^a-z0-9&\s]/g,'')
      .replace(/\s+/g,' ').trim()
      .replace(/behaviour/g,'behavior').replace(/organisation/g,'organization');
  }
  var TERM1_ALIASES = {};
  [
    'Marketing Management','MM',
    'Business and Corporate Finance','BCF',
    'Business Communication','BC',
    'Operations Management','OM',
    'Macroeconomics for Managers',
    'Entrepreneurial Manager','EM',
    'Critical Thinking',
    'Digital Business Strategy',
    'Financial Accounting',
    'Accounting For Business Decisions','ABD',
    'Basics of Database and SQL',
    'Technology Readiness',
    'Macroeconomics & Monetary Policy',
    'Organisation Structure and Behaviour',
    'Corporate Finance'
  ].forEach(function(s){ TERM1_ALIASES[normalizeSubject(s)] = true; });
  var ALWAYS_KEEP = {};
  ['Organizational Behavior','Organizational Behaviour'].forEach(function(s){ ALWAYS_KEEP[normalizeSubject(s)] = true; });

  function rollTerm(roll){
    var r = ROSTER[roll];
    if(r && r.term) return r.term;
    var prefixMap = CONFIG.rollPrefixTerm || {};
    for(var prefix in prefixMap){
      if(prefixMap.hasOwnProperty(prefix) && roll.indexOf(prefix) === 0) return prefixMap[prefix];
    }
    return null;
  }

  // Returns the subject string to show this particular roll for this block.
  function subjectForRoll(fullSubject, roll){
    var candidates = fullSubject.split(';').map(function(s){ return s.trim(); }).filter(Boolean);
    if(candidates.length <= 1) return fullSubject;
    var term = rollTerm(roll);
    if(!term) return fullSubject;
    var kept = candidates.filter(function(c){
      var norm = normalizeSubject(c);
      var isTerm1 = !!TERM1_ALIASES[norm];
      var keep = ALWAYS_KEEP[norm];
      if(keep) return true;
      return term === 1 ? isTerm1 : !isTerm1;
    });
    if(!kept.length) return fullSubject; // unsure, show everything rather than guess
    var seen = {};
    var deduped = kept.filter(function(c){
      var norm = normalizeSubject(c);
      if(seen[norm]) return false;
      seen[norm] = true;
      return true;
    });
    return deduped.join('; ');
  }

  var errBox = document.getElementById('err');
  var results = document.getElementById('results');
  var listEl = document.getElementById('list');
  var rollOut = document.getElementById('rollOut');
  var rollRoster = document.getElementById('rollRoster');
  var countOut = document.getElementById('countOut');
  var eyebrowEl = document.getElementById('eyebrow');
  if(eyebrowEl) eyebrowEl.textContent = examHeadline();
  var backBtn = document.getElementById('backBtn');
  var pdfBtn = document.getElementById('pdfBtn');

  function parseDate(dstr){
    var m = /(\d{2})\.(\d{2})\.(\d{4})/.exec(dstr);
    if(!m) return null;
    return {d:+m[1], mo:+m[2], y:+m[3]};
  }
  function parseTime(tstr){
    var m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(tstr);
    if(!m) return 0;
    var h = +m[1] % 12;
    if(/pm/i.test(m[3])) h += 12;
    return h*60 + (+m[2]);
  }
  function sortKey(entry){
    var b = BLOCKS[entry[0]];
    var dt = parseDate(b[1]);
    var tm = parseTime(b[2]);
    return (dt.y*10000 + dt.mo*100 + dt.d) * 10000 + tm;
  }
  function shortDate(dstr){
    var parts = dstr.split(',');
    var day = parts[0].trim();
    var rest = parts[1] ? parts[1].trim() : '';
    var m = /(\d{2})\.(\d{2})\.(\d{4})/.exec(rest);
    if(!m) return dstr;
    var months=['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return day + ', ' + (+m[1]) + ' ' + months[+m[2]] + ' ' + m[3];
  }

  var lastResult = null; // {roll, groups} for the current search, used to build the PDF

  pdfBtn.addEventListener('click', function(){ savePdf(); });
  listEl.addEventListener('click', function(e){
    if(lastResult && e.target.closest('.card-cal-link')){
      window.IMT.track('add_to_calendar', window.IMT.student(lastResult.roll), { tool: 'exam_seat' });
    }
  });

  // Brand colors sampled from assets/imt-logo.png.
  var PDF_NAVY = [30,57,140];
  var PDF_GOLD = [212,165,42];
  var PDF_MUTED = [120,120,120];
  var PDF_INK = [25,25,25];

  // Small vector calendar glyph (outline square + filled header strip) -
  // no image asset needed, reads clearly as "calendar" even at a few mm.
  function drawCalendarIcon(doc, x, y, size){
    doc.setDrawColor.apply(doc, PDF_NAVY);
    doc.setFillColor.apply(doc, PDF_NAVY);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, size, size, 0.3, 0.3, 'S');
    doc.rect(x, y, size, size * 0.32, 'F');
  }

  function buildPlainPdf(){
    var jsPDFCtor = window.jspdf && window.jspdf.jsPDF;
    if(!jsPDFCtor || !lastResult) return null;

    var roll = lastResult.roll;
    var groups = lastResult.groups;

    var doc = new jsPDFCtor({ unit:'mm', format:'a4' });
    var marginX = 16, y = 20;
    var pageW = doc.internal.pageSize.getWidth();
    var pageH = doc.internal.pageSize.getHeight();

    // Header
    doc.setFont('helvetica','bold');
    doc.setFontSize(17);
    doc.setTextColor.apply(doc, PDF_NAVY);
    doc.text('IMT NEVER SLEEPS', marginX, y);
    y += 3;
    doc.setDrawColor.apply(doc, PDF_GOLD);
    doc.setLineWidth(0.6);
    doc.line(marginX, y, pageW - marginX, y);
    y += 7;

    // Title
    doc.setFont('helvetica','normal');
    doc.setFontSize(10.5);
    doc.setTextColor.apply(doc, PDF_MUTED);
    doc.text(examHeadline(), marginX, y);
    y += 9;

    // Roll number line
    doc.setFont('helvetica','bold');
    doc.setFontSize(12);
    doc.setTextColor.apply(doc, PDF_INK);
    doc.text('Personalised Seat Plan for : ' + roll, marginX, y);
    var paperCount = groups.reduce(function(n,g){return n+g.items.length;},0);
    doc.setFont('helvetica','normal');
    doc.setFontSize(9);
    doc.setTextColor.apply(doc, PDF_MUTED);
    doc.text(paperCount + (paperCount===1 ? ' paper' : ' papers'), pageW - marginX, y, { align:'right' });
    y += 5;

    var roster = rosterLine(roll);
    if(roster){
      doc.setFont('helvetica','normal');
      doc.setFontSize(9.5);
      doc.setTextColor.apply(doc, PDF_MUTED);
      doc.text(roster, marginX, y);
      y += 5;
    }
    y += 1;

    var rows = [];
    var calLinks = [];
    groups.forEach(function(g){
      g.items.forEach(function(entry){
        var b = BLOCKS[entry[0]];
        var subject = subjectForRoll(b[0], roll), time = b[2], hall = b[3];
        var seatNo = entry[1] + entry[2];
        rows.push([shortDate(g.date), subject, time, hall, seatNo]);
        var dateObj = parseDate(b[1]);
        calLinks.push(dateObj ? googleCalendarLink(subject, dateObj, parseTime(b[2]), hall, seatNo, roll) : null);
      });
    });

    var calIconSize = 3.2;
    doc.autoTable({
      startY: y,
      margin: { left: marginX, right: marginX },
      head: [['Date','Subject','Time','Hall','Seat']],
      body: rows,
      theme: 'grid',
      styles: { font:'helvetica', fontSize:9.5, cellPadding:2.6, textColor:PDF_INK, lineColor:[210,210,210], lineWidth:0.2, overflow:'linebreak' },
      headStyles: { fillColor:[245,247,251], textColor:PDF_NAVY, fontStyle:'bold', halign:'left' },
      columnStyles: {
        0: { cellWidth: 34 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 24 },
        3: { cellWidth: 24 },
        4: { cellWidth: 16 + calIconSize + 3 }
      },
      // Calendar icon tucked into the Seat cell (right of the seat text)
      // instead of a whole extra column - click it to add that exam.
      didDrawCell: function(data){
        if(data.column.index !== 4 || data.row.section !== 'body') return;
        var url = calLinks[data.row.index];
        if(!url) return;
        var iconX = data.cell.x + data.cell.width - 2.6 - calIconSize;
        var iconY = data.cell.y + data.cell.height / 2 - calIconSize / 2;
        drawCalendarIcon(doc, iconX, iconY, calIconSize);
        doc.link(iconX - 0.8, iconY - 0.8, calIconSize + 1.6, calIconSize + 1.6, { url: url });
      }
    });

    // Footer: anchored to the bottom of the page so it stays in a fixed,
    // predictable spot regardless of how many rows the table has (1-8
    // papers), rather than trailing right under a short table.
    var maxTextW = pageW - marginX * 2;
    doc.setFontSize(7.5);
    doc.setTextColor.apply(doc, PDF_MUTED);
    var disclaimerLines = doc.splitTextToSize(
      'Unofficial tool built from IMT Ghaziabad\'s official seating plan. Subjects are matched by term, not by individual course; please confirm your exact paper against the official datesheet.',
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

  // The generated PDF from buildPlainPdf() is always exactly one page
  // (verified directly: even the roll with the most papers in the whole
  // dataset, 8, produces a single A4 page). So a "PDF" that comes out as
  // several pages was never that file, it was the browser's own
  // Print dialog kicking in as a fallback, printing the live page
  // instead. Print, and pop-up new tabs, both behave unreliably from
  // inside the artifact's embedded preview (they can be silently blocked,
  // or in some mobile browsers print the surrounding app page instead of
  // just this content), so neither is used here anymore. The single
  // supported path is the platform's own "downloads" capability, which
  // hands the exact one-page file to the phone/desktop's normal save or
  // share flow. If this page is ever opened as a plain, un-embedded
  // webpage (for example once it is hosted on its own, outside the
  // Claude app), a completely ordinary browser download is used instead,
  // since that context has none of the embedded preview's restrictions.
  function savePdf(){
    var doc;
    try{ doc = buildPlainPdf(); }
    catch(e){ showNotice('Could not prepare the PDF. Please try again.'); return; }
    if(!doc){ showNotice('Could not prepare the PDF. Please try again.'); return; }
    var filename = (lastResult.roll || 'exam') + '_schedule.pdf';

    if(window.claude && typeof window.claude.use === 'function'){
      var blob = doc.output('blob');
      window.claude.use('downloads').then(function(downloads){
        if(!downloads){ showNotice('PDF save isn’t available in this preview. Open this page in your phone or computer’s browser (outside the Claude app) and try again.'); return; }
        return downloads.save({ filename: filename, data: blob }).then(function(){
          errBox.hidden = true;
          window.IMT.track('save_pdf', window.IMT.student(lastResult.roll), { tool: 'exam_seat' });
        }).catch(function(err){
          if(err && err.code === 'declined') return; // user said no, nothing else to do
          showNotice('PDF save didn’t go through. Please try again.');
        });
      }).catch(function(){
        showNotice('PDF save isn’t available in this preview. Open this page in your phone or computer’s browser (outside the Claude app) and try again.');
      });
    } else {
      // Plain webpage context: a normal browser download works fine here.
      try{
        doc.save(filename);
        errBox.hidden = true;
        window.IMT.track('save_pdf', window.IMT.student(lastResult.roll), { tool: 'exam_seat' });
      }
      catch(e){ showNotice('Could not save the PDF. Please try again.'); }
    }
  }

  function showNotice(message){
    errBox.hidden = false;
    errBox.textContent = message;
  }

  // ---- per-exam "Add to Calendar" links ----
  // A real Google Calendar "render" link per exam: opens straight into
  // Google Calendar with the event pre-filled, no file to download or open
  // afterward. Dates must be true UTC instants - exam times in the data are
  // IST wall-clock time (e.g. "10:00 AM" means 10am India time), so this
  // converts IST -> UTC (IST is UTC+5:30) rather than just appending a "Z"
  // to the raw local numbers, which would silently be off by 5.5 hours.
  var IST_OFFSET_MIN = 5 * 60 + 30;
  function pad2(n){ n = String(n); return n.length < 2 ? '0' + n : n; }
  function googleCalStamp(utcMs){
    var d = new Date(utcMs);
    return d.getUTCFullYear() + pad2(d.getUTCMonth() + 1) + pad2(d.getUTCDate()) +
      'T' + pad2(d.getUTCHours()) + pad2(d.getUTCMinutes()) + '00Z';
  }
  function googleCalendarLink(subject, dateObj, startMin, hall, seatNo, roll){
    var istMs = Date.UTC(dateObj.y, dateObj.mo - 1, dateObj.d, Math.floor(startMin / 60), startMin % 60);
    var startUtcMs = istMs - IST_OFFSET_MIN * 60000;
    var endUtcMs = startUtcMs + 30 * 60000; // nominal 30-min block; the data has no real exam duration
    var params = {
      action: 'TEMPLATE',
      text: subject,
      dates: googleCalStamp(startUtcMs) + '/' + googleCalStamp(endUtcMs),
      details: 'Roll number: ' + roll + '. Hall ' + hall + ', seat ' + seatNo +
        '. Unofficial schedule from IMT Never Sleeps, always confirm on the official datesheet.',
      location: 'Hall ' + hall
    };
    return 'https://calendar.google.com/calendar/render?' + Object.keys(params).map(function(k){
      return k + '=' + encodeURIComponent(params[k]);
    }).join('&');
  }

  // v is the roll handed over by the portal, already normalised.
  function showSeats(v){
    var entries = ROLLS[v];
    if(!entries){
      showCard('No seat found', 'There is no seat for roll number ' + v + ' in the current seating plan.', v);
      return;
    }
    errBox.hidden = true;
    backBtn.href = '../index.html?roll=' + encodeURIComponent(v);
    entries = entries.slice().sort(function(a,b){ return sortKey(a) - sortKey(b); });

    rollOut.textContent = v;
    countOut.textContent = entries.length + (entries.length===1 ? ' paper' : ' papers');
    var roster = rosterLine(v);
    rollRoster.textContent = roster;
    rollRoster.hidden = !roster;

    var groups = [];
    var lastDate = null;
    entries.forEach(function(entry){
      var b = BLOCKS[entry[0]];
      if(b[1] !== lastDate){
        groups.push({date:b[1], items:[]});
        lastDate = b[1];
      }
      groups[groups.length-1].items.push(entry);
    });

    lastResult = { roll: v, groups: groups };

    var cardIndex = 0;
    listEl.innerHTML = groups.map(function(g, gi){
      var tint = TINTS[gi % TINTS.length];
      var cards = g.items.map(function(entry){
        var b = BLOCKS[entry[0]];
        var subject = subjectForRoll(b[0], v), time = b[2], hall = b[3];
        var row = entry[1], col = entry[2];
        var seatNo = row + col; // seat number = row + column, e.g. row 3 + col C = "3C"
        var delay = (cardIndex++ * 0.06).toFixed(2);
        var dateObj = parseDate(b[1]);
        var calHref = dateObj ? googleCalendarLink(subject, dateObj, parseTime(b[2]), hall, seatNo, v) : null;
        return ''+
          '<div class="exam-card" style="animation-delay:'+delay+'s">'+
            '<div class="exam-subject">'+escapeHtml(subject)+'</div>'+
            '<div class="detail-grid">'+
              '<div class="detail" style="--tint:'+tint+'"><div class="k">Date</div><div class="v">'+shortDate(b[1])+'</div></div>'+
              '<div class="detail" style="--tint:'+tint+'"><div class="k">Time</div><div class="v">'+escapeHtml(time)+'</div></div>'+
              '<div class="detail" style="--tint:'+tint+'"><div class="k">Hall No.</div><div class="v">'+escapeHtml(hall)+'</div></div>'+
              '<div class="detail" style="--tint:'+tint+'"><div class="k">Seat No.</div><div class="v">'+escapeHtml(seatNo)+'</div></div>'+
            '</div>'+
            (calHref ? '<a class="card-cal-link" href="'+calHref+'" target="_blank" rel="noopener">'+
              '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M16 3v4M8 3v4M3 11h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'+
              'Add to Calendar</a>' : '')+
          '</div>';
      }).join('');
      return '<div class="day-group"><div class="day-title">'+shortDate(g.date)+'</div><div class="card-grid">'+cards+'</div></div>';
    }).join('');

    results.hidden = false;
    attachTilt(listEl.querySelectorAll('.exam-card'));
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  // ---- tasteful 3D pointer-tilt, only for viewers who can actually hover a
  // fine pointer and haven't asked for reduced motion; never fights touch
  // scrolling and never runs when it'd just be flattened again anyway. ----
  var canTilt = window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function attachTilt(elements){
    if(!canTilt) return;
    elements.forEach(function(el){
      el.addEventListener('mousemove', function(e){
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'translateY(-3px) rotateX(' + (py * -6).toFixed(2) + 'deg) rotateY(' + (px * 6).toFixed(2) + 'deg)';
      });
      el.addEventListener('mouseleave', function(){
        el.style.transform = '';
      });
    });
  }

  // ---- portal hand-off ----
  // This page has no search of its own: the portal is the only way in, and
  // it passes the roll in the URL. No roll, or one the portal doesn't know,
  // goes straight back there. While Exam Seat is locked in
  // js/portal-config.js, only the test roll gets through.
  function showCard(title, text, roll){
    results.hidden = true;
    document.getElementById('lockedTitle').textContent = title;
    document.getElementById('lockedText').textContent = text;
    document.getElementById('lockedBack').href = '../index.html?roll=' + encodeURIComponent(roll);
    document.getElementById('locked').hidden = false;
  }
  var IMT = window.IMT;
  var fromUrl = IMT.rollFromUrl();
  var visitor = IMT.student(fromUrl);
  if(!fromUrl){
    window.location.replace('../index.html');
  } else if(!visitor.batchKey){
    window.location.replace('../index.html?roll=' + encodeURIComponent(fromUrl));
  } else if(IMT.examSeatLocked(visitor)){
    IMT.track('tool_open', visitor, { tool: 'exam_seat', status: 'locked' });
    showCard('Exam Seat is locked', IMT.config.examSeat.lockedLabel + '.', fromUrl);
  } else {
    IMT.track('tool_open', visitor, { tool: 'exam_seat', status: ROLLS[fromUrl] ? 'shown' : 'no_seat' });
    showSeats(fromUrl);
  }
})();
