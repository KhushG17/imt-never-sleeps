// Shared by the portal and both tools: roll lookup against the roster, the
// term timeline, and a few small page helpers.
(function(){
"use strict";
  var CONFIG = window.PORTAL_CONFIG || {};
  var SITE = window.SITE_DATA || {};          // js/site-data.js: programmes + timeline
  var PROGRAMMES = SITE.programmes || {};
  var TIMELINE = SITE.timeline || {};
  var ROSTER = window.ROSTER_DATA || {};      // js/roster-data.js: every student

  // "25fpm-003 " and "25FPM003" are the same roll.
  function normRoll(v){
    return String(v == null ? '' : v).toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  function todayIso(){
    var d = new Date();
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }

  // ---- which day it is, for the schedule ----
  // Everything about classes runs on India time, wherever the visitor is.
  // The "schedule day" is today until 8 pm IST and tomorrow from then on:
  // by 8 pm the day's classes are over and it is tomorrow's that matter.
  var IST_OFFSET_MS = (5 * 60 + 30) * 60000;
  var DAY_ROLLS_AT_HOUR = (CONFIG.schedule && CONFIG.schedule.dayRollsAtHour) || 20;
  function isoOf(d){
    var m = d.getUTCMonth() + 1, day = d.getUTCDate();
    return d.getUTCFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }
  function addDays(iso, n){
    var p = iso.split('-');
    return isoOf(new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + n)));
  }
  function istNow(){ return new Date(Date.now() + IST_OFFSET_MS); } // read with getUTC*()
  function istToday(){ return isoOf(istNow()); }
  function scheduleDay(){
    var now = istNow();
    return now.getUTCHours() >= DAY_ROLLS_AT_HOUR ? addDays(isoOf(now), 1) : isoOf(now);
  }

  // Where a batch + schedule group ("2027-core") stands today: its current
  // term (the latest one that has started), that term's campus, and whether
  // its Term 6 exams are over.
  function standing(groupKey, today){
    var tl = TIMELINE[groupKey];
    if(!tl) return null;
    today = today || todayIso();
    var now = null;
    (tl.terms || []).forEach(function(t){
      if(now === null || t.start <= today) now = t;
    });
    return {
      label: tl.label || '',
      term: now ? now.term : null,
      campus: now ? now.campus || '' : '',
      examStart: now ? now.examStart || '' : '',
      examEnd: now ? now.examEnd || '' : '',
      alumni: !!(tl.alumniFrom && today >= tl.alumniFrom)
    };
  }

  // Everything known about a roll. A roll number is batch + programme code +
  // serial (25 0103 045), so the programme and batch are known even before
  // a student list is loaded. groupKey is null when the roll is neither in
  // the roster nor a batch and programme we have a timeline for.
  function student(roll){
    roll = normRoll(roll);
    var e = ROSTER[roll] || null;
    var code = (e && e.p) || (/^\d{9}$/.test(roll) ? roll.substr(2, 4) : roll.indexOf('FPM') === 2 ? 'FPM' : null);
    var prog = (code && PROGRAMMES[code]) || null;
    var groupKey = e ? e.g : null;
    if(!groupKey && prog && /^\d{2}/.test(roll)){
      groupKey = '20' + (+roll.substr(0, 2) + 2) + '-' + prog.group;
    }
    var st = groupKey ? standing(groupKey) : null;
    if(!st) groupKey = null;
    return {
      roll: roll,
      inRoster: !!e,
      name: e ? e.n || '' : '',
      programme: prog ? prog.name : '',
      section: e ? e.s || '' : '',
      track: e ? e.t || '' : '',
      major: e ? e.mj || '' : '',
      minor: e ? e.mn || '' : '',
      courses: e ? e.c || {} : {},
      electives: e ? e.e || null : null,
      groupKey: groupKey,
      batchKey: groupKey,
      batchLabel: st ? st.label : '',
      term: st ? st.term : null,
      campus: st ? st.campus : '',
      alumni: !!(st && (st.alumni || (e && e.al))),
      isTest: (CONFIG.testRolls || []).map(normRoll).indexOf(roll) >= 0
    };
  }

  function greeting(s){
    if(s.alumni) return 'Hey Alumni' + (s.name ? ', ' + s.name : '');
    return 'Hey ' + (s.name || 'there');
  }

  // The line under the greeting on the portal.
  function welcome(s){
    if(s.alumni) return 'Once IMT, always IMT. Good to see you back.';
    if(!s.inRoster) return 'Your name and section for ' + [s.programme, s.batchLabel].filter(Boolean).join(', ') +
      ' are not loaded yet. They will show up here once added.';
    var h = new Date().getHours();
    var part = h < 5 ? 'Up late?' : h < 12 ? 'Good morning.' : h < 17 ? 'Good afternoon.' : h < 22 ? 'Good evening.' : 'Up late?';
    return part + ' Your Term ' + s.term + ' schedule is ready.';
  }

  // "PGDM Marketing · Batch 2025-27 · Term 5 · Major MKT · Minor BA", skipping what's unknown.
  function metaLine(s){
    var parts = [];
    if(s.programme) parts.push(s.programme);
    if(s.batchLabel) parts.push(s.batchLabel);
    if(s.alumni) parts.push('Alumni');
    else if(s.term) parts.push('Term ' + s.term);
    if(s.section) parts.push('Section ' + s.section);
    if(s.track) parts.push('Track ' + s.track);
    if(s.major) parts.push('Major ' + s.major);
    if(s.minor) parts.push('Minor ' + s.minor);
    return parts.join(' · ');
  }

  // A term's course list ({abbreviation: name}) and its electives, by
  // "<batch>-<group>-<term>", e.g. "2028-core-2". null when not on file.
  function catalog(key){ return (SITE.courses || {})[key] || null; }
  function electivesOf(key){ return (SITE.electives || {})[key] || []; }

  // The order to list dated groups in: today first, then the days still to
  // come, then the days already gone. Returns [{i: index, past: bool}]; when
  // today isn't among the dates, the order is simply the days still to come
  // followed by those gone, or unchanged if they are all on one side.
  function todayFirst(isoDates, today){
    today = today || scheduleDay();
    var now = [], later = [], past = [];
    isoDates.forEach(function(d, i){
      (d === today ? now : d > today ? later : past).push({ i: i, past: d < today, today: d === today });
    });
    return now.concat(later, past);
  }

  // The week to show from a group's weeks on file: the one running today,
  // else the next one coming, else the newest.
  function pickWeek(weeks, today){
    if(!weeks || !weeks.length) return null;
    today = today || scheduleDay();
    var running = weeks.filter(function(w){ return w.start <= today && today <= w.end; })[0];
    var coming = weeks.filter(function(w){ return w.start > today; })[0];
    return running || coming || weeks[weeks.length - 1];
  }

  // What the pill should say about the loaded schedules, for one
  // batch-and-group or (with no groupKey) for everyone on the Ghaziabad
  // campus, as of the schedule day.
  //
  // Each programme's PDF arrives on its own, so for everyone a week only
  // "counts" once at least `need` programmes have it (livePill.minProgrammes,
  // 3 of the 6). The dates shown are those of the counted week the schedule
  // day falls in, stretched over any counted weeks that follow it; if the
  // day is past every counted week, the dates of the last one.
  //   live    - the day is inside those dates and every programme has it
  //   partial - the day is inside those dates but some programme is missing
  //   stale   - the day is past the dates shown
  //   missing - no week counts at all yet
  //   exam    - every group asked about is in its End Term Exam window
  //   none    - nobody to show a schedule to (alumni, a term in Dubai)
  // For a single group, one programme is all there is, so need is 1.
  function coverage(weekly, groupKey, day){
    day = day || scheduleDay();
    var keys = (groupKey ? [groupKey] : Object.keys(TIMELINE)).filter(function(k){
      var st = standing(k, day);
      return st && !st.alumni && st.campus !== 'Dubai';
    });
    if(!keys.length) return { state: 'none' };
    var teaching = keys.filter(function(k){
      var st = standing(k, day);
      return !(st.examStart && st.examStart <= day && day <= st.examEnd);
    });
    if(!teaching.length) return { state: 'exam' };
    var need = groupKey ? 1 : Math.min((CONFIG.livePill && CONFIG.livePill.minProgrammes) || 3, teaching.length);
    var count = {}, ends = {};
    teaching.forEach(function(k){
      ((weekly || {})[k] || []).forEach(function(w){
        count[w.start] = (count[w.start] || 0) + 1;
        ends[w.start] = w.end;
      });
    });
    var counted = Object.keys(count).filter(function(st){ return count[st] >= need; }).sort();
    if(!counted.length) return { state: 'missing' };
    var cur = counted.filter(function(st){ return st <= day && day <= ends[st]; })[0];
    if(!cur){
      var before = counted.filter(function(st){ return ends[st] < day; });
      var last = before.length ? before[before.length - 1] : counted[0];
      return { state: 'stale', start: last, end: ends[last] };
    }
    var reach = ends[cur];
    counted.forEach(function(st){ if(st > reach && st <= addDays(reach, 1)) reach = ends[st]; });
    return { state: count[cur] >= teaching.length ? 'live' : 'partial', start: cur, end: reach };
  }

  function examSeatLocked(s){
    var exam = CONFIG.examSeat || {};
    return !!exam.locked && !(s && (exam.openFor || []).map(normRoll).indexOf(s.roll) >= 0);
  }

  // What a locked Exam Seat says to this student: their own term's exams.
  function examLockedLabel(s){
    var exam = CONFIG.examSeat || {};
    if(s && s.alumni) return exam.alumniLabel || 'No more exams';
    if(!s || !s.term) return 'Exams coming soon';
    return (exam.lockedLabel || 'Term {term} exams coming soon').replace('{term}', s.term);
  }

  function rollFromUrl(){
    var m = /[?&]roll=([^&#]*)/.exec(window.location.search);
    return m ? normRoll(decodeURIComponent(m[1])) : '';
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  // Tasteful 3D pointer-tilt, only for viewers who can hover a fine pointer
  // and haven't asked for reduced motion.
  var canTilt = window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function attachTilt(elements){
    if(!canTilt) return;
    Array.prototype.forEach.call(elements, function(el){
      el.addEventListener('mousemove', function(e){
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'translateY(-3px) rotateX(' + (py * -6).toFixed(2) + 'deg) rotateY(' + (px * 6).toFixed(2) + 'deg)';
      });
      el.addEventListener('mouseleave', function(){ el.style.transform = ''; });
    });
  }

  // ---- usage tracking ----
  // One function for every page, so the event names and what is sent stay in
  // one place. Sent: the event name, the batch, and the few labels the caller
  // passes (which tool, what the visitor saw). Never sent: roll numbers,
  // names or courses - including in page addresses, see below. The test roll is not counted. Page views are counted
  // automatically by Google Analytics once the ID is set.
  var GA_ID = (CONFIG.analytics && CONFIG.analytics.measurementId) || '';
  var trackingOn = !!GA_ID && window.location.protocol !== 'file:';
  if(trackingOn){
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    // Google records each page's address and the address it was reached
    // from. Ours can end in ?roll=..., so both are sent without anything
    // after the "?": a roll number never leaves the site this way either.
    var bare = function(url){ return String(url || '').split('?')[0].split('#')[0]; };
    var clean = { page_location: bare(window.location.href), page_referrer: bare(document.referrer) };
    window.gtag('set', clean);
    window.gtag('config', GA_ID, clean);
    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(ga);
  }
  function track(name, s, params){
    if(!trackingOn || (s && s.isTest)) return;
    params = params || {};
    params.batch = (s && s.batchLabel) || 'unknown';
    window.gtag('event', name, params);
  }

  // The Study Material icon in the header, next to Feedback. Its link is
  // studyMaterial.url in js/portal-config.js; with no link it stays hidden.
  var studyNav = document.getElementById('studyNav');
  var studyUrl = (CONFIG.studyMaterial && CONFIG.studyMaterial.url) || '';
  if(studyNav && studyUrl){
    studyNav.href = studyUrl;
    studyNav.hidden = false;
    studyNav.addEventListener('click', function(){
      var typed = document.getElementById('roll');
      track('tool_open', student(rollFromUrl() || (typed ? typed.value : '')), { tool: 'study_material', status: 'shown' });
    });
  }

  var siteHeader = document.getElementById('siteHeader');
  if(siteHeader){
    window.addEventListener('scroll', function(){
      siteHeader.classList.toggle('is-scrolled', window.scrollY > 24);
    }, { passive:true });
  }

  window.IMT = {
    config: CONFIG,
    normRoll: normRoll,
    todayIso: todayIso,
    student: student,
    greeting: greeting,
    welcome: welcome,
    standing: standing,
    pickWeek: pickWeek,
    catalog: catalog,
    electivesOf: electivesOf,
    examAliases: SITE.examAliases || {},
    todayFirst: todayFirst,
    coverage: coverage,
    scheduleDay: scheduleDay,
    istToday: istToday,
    metaLine: metaLine,
    examSeatLocked: examSeatLocked,
    examLockedLabel: examLockedLabel,
    rollFromUrl: rollFromUrl,
    track: track,
    escapeHtml: escapeHtml,
    attachTilt: attachTilt
  };
})();
