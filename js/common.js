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

  // Which festival look is on today, if any (js/portal-config.js, festival): the first theme whose dates
  // (India time) include today. ?festival=off hides it; ?festival=on shows the first theme outside its dates;
  // ?festival=halloween or =diwali shows that one; a preview roll (DIWA, HALLO) shows its theme whatever the date. Returns { name, greeting, sound } or null.
  // the roll in the address, else the one remembered on this device, if it is one of festival.previewRolls
  function previewName(F){
    var m = /[?&]roll=([^&]+)/.exec(window.location.search), r = '';
    try { r = m ? normRoll(decodeURIComponent(m[1])) : savedRoll(); } catch(e){}
    return (F.previewRolls && F.previewRolls[r]) || '';
  }
  function festivalTheme(){
    var F = CONFIG.festival; if(!F) return null;
    var list = F.themes || [F], forced = (/[?&]festival=(\w+)/.exec(window.location.search) || [])[1], today = istToday(), pick = null;
    if(forced === 'off') return null;
    if(forced && forced !== 'on'){ list.forEach(function(t){ if(t.name === forced) pick = t; }); }
    else if(forced === 'on'){ list.forEach(function(t){ if(!pick && (!t.from || today >= t.from) && (!t.until || today <= t.until)) pick = t; }); pick = pick || list[0]; }
    else if(previewName(F)){ var want = previewName(F); list.forEach(function(t){ if(t.name === want) pick = t; }); }
    else if(F.on !== false){ list.forEach(function(t){ if(!pick && (!t.from || today >= t.from) && (!t.until || today <= t.until)) pick = t; }); }
    return pick ? { name: pick.name || 'diwali', greeting: pick.greeting || '', sound: F.sound !== false && pick.sound !== false } : null;
  }

  function istMinutes(){ var n = istNow(); return n.getUTCHours() * 60 + n.getUTCMinutes(); } // minutes since midnight, IST
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
  // Each programme's PDF arrives on its own. The dates follow whatever is
  // loaded: as soon as even one programme has a week, the dates include it.
  // They are those of the week the schedule day falls in, stretched over any
  // loaded weeks that follow; if the day is past everything loaded, the
  // dates of the last week.
  //   live    - the day is inside those dates, and no more than
  //             livePill.redWhenMissingMoreThan programmes (3) lack this week
  //   partial - the day is inside those dates, but more programmes than
  //             that lack this week
  //   stale   - the day is past the dates shown
  //   missing - nothing loaded at all
  //   exam    - every group asked about is in its End Term Exam window
  //   none    - nobody to show a schedule to (alumni, a term in Dubai)
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
    var limit = CONFIG.livePill && CONFIG.livePill.redWhenMissingMoreThan;
    if(limit == null) limit = 3;
    var count = {}, ends = {};
    teaching.forEach(function(k){
      ((weekly || {})[k] || []).forEach(function(w){
        count[w.start] = (count[w.start] || 0) + 1;
        ends[w.start] = w.end;
      });
    });
    var loaded = Object.keys(count).sort();
    if(!loaded.length) return { state: 'missing' };
    var cur = loaded.filter(function(st){ return st <= day && day <= ends[st]; })[0];
    if(!cur){
      var before = loaded.filter(function(st){ return ends[st] < day; });
      var last = before.length ? before[before.length - 1] : loaded[0];
      return { state: 'stale', start: last, end: ends[last] };
    }
    var reach = ends[cur];
    loaded.forEach(function(st){ if(st > reach && st <= addDays(reach, 1)) reach = ends[st]; });
    var lacking = teaching.length - count[cur];
    return { state: lacking > limit ? 'partial' : 'live', start: cur, end: reach, lacking: lacking };
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
        el.style.transform = 'perspective(1600px) translateY(-3px) rotateX(' + (py * -6).toFixed(2) + 'deg) rotateY(' + (px * 6).toFixed(2) + 'deg)';
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
  // (the staff upload page is never counted)
  var trackingOn = !!GA_ID && window.location.protocol !== 'file:' && !/\/upload\//.test(window.location.pathname);
  if(trackingOn){
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    // Google records each page's address and the address it was reached
    // from. Ours can end in ?roll=..., so both are sent without anything
    // after the "?": a roll number never leaves the site this way either.
    // Campaign tags (utm_source and friends) are the one exception: they say
    // which shared link brought the visit, and say nothing about the student.
    var bare = function(url){ return String(url || '').split('?')[0].split('#')[0]; };
    var tags = window.location.search.replace(/^\?/, '').split('&').filter(function(p){ return /^utm_[a-z]+=/i.test(p); });
    var clean = {
      page_location: bare(window.location.href) + (tags.length ? '?' + tags.join('&') : ''),
      page_referrer: bare(document.referrer),
      mode: installedApp() ? 'app' : 'browser'   // the installed app, or a browser tab
    };
    window.gtag('set', clean);
    window.gtag('config', GA_ID, clean);
    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(ga);
  }
  // Every event says which group it came from, never which student: batch,
  // programme, section and term, plus app or browser. When the caller has no
  // student to hand, the roll this device remembers stands in.
  function track(name, s, params){
    if(!trackingOn) return;
    if(!s || !s.batchKey){
      var known = rollFromUrl() || savedRoll();
      if(known) s = student(known);
    }
    if(s && s.isTest) return;
    params = params || {};
    params.batch = (s && s.batchLabel) || 'unknown';
    params.programme = (s && s.programme) || 'unknown';
    params.section = (s && (s.section || s.track)) || 'unknown';
    params.term = s && s.alumni ? 'alumni' : (s && s.term) ? 'Term ' + s.term : 'unknown';
    params.mode = installedApp() ? 'app' : 'browser';
    window.gtag('event', name, params);
  }

  // How this page was reached: 'link' (a roll in the address, from outside
  // the site), 'portal' (a roll in the address, from our own pages),
  // 'remembered' (no roll in the address, the device remembered one), or
  // 'fresh' (no roll at all).
  function entry(){
    if(rollFromUrl()){
      return document.referrer.indexOf(window.location.origin + '/') === 0 ? 'portal' : 'link';
    }
    return savedRoll() ? 'remembered' : 'fresh';
  }
  var PAGE = /\/master\//.test(window.location.pathname) ? 'master' :
             /\/weekly-seat\//.test(window.location.pathname) ? 'weekly' :
             /\/exam-seat\//.test(window.location.pathname) ? 'exam_seat' :
             /\/bus\//.test(window.location.pathname) ? 'bus' : 'portal';

  // Things that go wrong on the page itself, at most three a visit.
  var errorsSent = 0;
  function pageError(message){
    if(errorsSent++ < 3) track('page_error', null, { tool: PAGE, result: String(message || 'unknown').slice(0, 90) });
  }
  window.addEventListener('error', function(e){ if(e && e.message) pageError(e.message); });
  window.addEventListener('unhandledrejection', function(e){ pageError('promise: ' + (e && e.reason && e.reason.message || e && e.reason || '')); });

  // Opens with no signal cannot be reported at the time. They are counted on
  // the device and reported, as one number, the next time it is online.
  var OFFLINE_KEY = 'imt.offlineOpens';
  try {
    var waiting = +window.localStorage.getItem(OFFLINE_KEY) || 0;
    if(window.navigator.onLine === false){
      window.localStorage.setItem(OFFLINE_KEY, String(waiting + 1));
    } else if(waiting){
      window.localStorage.removeItem(OFFLINE_KEY);
      window.addEventListener('load', function(){ track('offline_opens', null, { tool: PAGE, result: String(waiting) }); });
    }
  } catch(e){}

  // Taps on the nav bar and on "Back to portal".
  document.addEventListener('click', function(e){
    var t = e.target;
    if(!t || !t.closest) return;
    var what = t.closest('#navToggle') ? 'menu' :
               t.closest('#resToggle') ? 'resources' :
               t.closest('#busNav') ? 'bus_schedule' :
               t.closest('#lmsNav') ? 'lms' :
               t.closest('#erpNav') ? 'erp' :
               t.closest('#feedbackNav') ? 'feedback' :
               t.closest('#backBtn, #noticeBack, #lockedBack') ? 'back_to_portal' : '';
    if(what) track('nav_click', null, { tool: PAGE, result: what });
  }, true);   // on the way down, so a handler that stops the click cannot hide it

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

  // ---- the roll number, remembered on this device ----
  // Kept in the browser's own storage, on this phone or laptop only: it is
  // never sent anywhere. Typing a roll on the portal saves it; "Not you?
  // Change roll number" forgets it. A browser that refuses storage (some
  // private windows) simply does not remember.
  var ROLL_KEY = 'imt.roll';
  function savedRoll(){
    try { return normRoll(window.localStorage.getItem(ROLL_KEY) || ''); } catch(e){ return ''; }
  }
  function saveRoll(roll){
    try { window.localStorage.setItem(ROLL_KEY, normRoll(roll)); } catch(e){}
  }
  function forgetRoll(){
    try { window.localStorage.removeItem(ROLL_KEY); } catch(e){}
  }

  // ---- installing the site as an app ----
  // sw.js (at the site's root) keeps a copy of each page for when there is
  // no signal. It only runs on https, and on localhost for trying it out.
  var HERE = document.currentScript && document.currentScript.src;
  if('serviceWorker' in navigator && HERE && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')){
    window.addEventListener('load', function(){
      navigator.serviceWorker.register(new URL('../sw.js', HERE).href).catch(function(){});
    });
  }
  // Chrome, Edge and Android offer to install by firing this; we hold on to
  // the offer and show our own "Install app" button (see portal.js). iPhones
  // never fire it: there, it is Share, then "Add to Home Screen".
  var installOffer = null, installWaiters = [];
  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    installOffer = e;
    installWaiters.forEach(function(fn){ fn(true); });
  });
  window.addEventListener('appinstalled', function(){
    installOffer = null;
    installWaiters.forEach(function(fn){ fn(false); });
    track('app_install', null, {});
  });
  function onInstallable(fn){ installWaiters.push(fn); if(installOffer) fn(true); }
  function install(){
    if(!installOffer) return;
    var offer = installOffer;
    installOffer = null;
    installWaiters.forEach(function(fn){ fn(false); });
    offer.prompt();
  }
  function installedApp(){
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  }

  // ---- staying up to date ----
  // A phone does not reload an installed app when it is opened again: it
  // brings back the page it had in memory, sometimes days old. So each time
  // the page comes back into view (and at most once a minute) we fetch this
  // page afresh and compare it with the copy we started from. Every script
  // and stylesheet link in it carries a fingerprint (see stamp_pages in
  // scripts/update.py), so any change to the site changes the page; if it
  // differs, we reload. With no signal the fetch fails and nothing happens.
  var pageAtStart = null, lastFreshCheck = 0;
  function pageNow(){
    return window.fetch(window.location.pathname, { cache: 'no-store' }).then(function(r){
      if(!r.ok) throw new Error('not ok');
      return r.text();
    });
  }
  function checkFresh(){
    if(!window.fetch || document.hidden || Date.now() - lastFreshCheck < 60000) return;
    lastFreshCheck = Date.now();
    pageNow().then(function(text){
      if(pageAtStart === null){ pageAtStart = text; return; }
      if(text !== pageAtStart){
        pageAtStart = text;
        // not while something is open in front of the student
        if(document.querySelector('.mess-panel:not([hidden]), .nav-menu.is-open')) return;
        window.location.reload();
      }
    }).catch(function(){});
  }
  if(window.location.protocol !== 'file:'){
    window.addEventListener('load', checkFresh);
    document.addEventListener('visibilitychange', checkFresh);
    window.addEventListener('pageshow', function(e){ if(e.persisted){ lastFreshCheck = 0; checkFresh(); } });
    window.addEventListener('online', function(){ lastFreshCheck = 0; checkFresh(); });
  }

  // ---- a clean edge for things that float ----
  // The mess button, its bubble and the install pop-up float over the foot
  // of the screen. This strip fades the page to white just beneath them, so
  // they never sit on top of a class row. It lives on <html> for the same
  // reason they do (see js/mess.js). Phones only; styled in css/styles.css.
  var bottomFade = document.createElement('div');
  bottomFade.className = 'bottom-fade';
  bottomFade.setAttribute('aria-hidden', 'true');
  document.documentElement.appendChild(bottomFade);

  // ---- the nav bar ----
  // On a laptop the links sit in the bar. On a phone they fold into a menu
  // behind the three-line button.
  var navToggle = document.getElementById('navToggle'), navMenu = document.getElementById('navMenu');
  // While the menu is open the page behind it is blurred and dimmed (the
  // "menu-open" class on <html>; see the nav bar styles), so the menu does
  // not sit in a jumble of headings and cards.
  function closeMenu(){
    if(!navMenu) return;
    navMenu.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('menu-open');
    closeRes();
  }
  // "Resources" is a drop-down inside the nav bar: Bus Schedule, Study Material.
  var resToggle = document.getElementById('resToggle'), navRes = document.getElementById('navRes');
  function closeRes(){
    if(!navRes) return;
    navRes.classList.remove('is-open');
    resToggle.setAttribute('aria-expanded', 'false');
  }
  if(resToggle && navRes){
    resToggle.addEventListener('click', function(e){
      e.stopPropagation();
      var open = navRes.classList.toggle('is-open');
      resToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function(e){ if(!navRes.contains(e.target)) closeRes(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeRes(); });
    // the bus page is reached with the same roll, so "Back to portal" knows who it is
    var busNav = document.getElementById('busNav'), known = rollFromUrl();
    if(busNav && known) busNav.href += '?roll=' + encodeURIComponent(known);
  }
  if(navToggle && navMenu){
    navToggle.addEventListener('click', function(e){
      e.stopPropagation();
      var open = navMenu.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.documentElement.classList.toggle('menu-open', open);
    });
    navMenu.addEventListener('click', function(e){ if(e.target.closest('a')) closeMenu(); });
    document.addEventListener('click', function(e){ if(!navMenu.contains(e.target)) closeMenu(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeMenu(); });
  }
  // "Install app": in the nav bar of every page, and in the greeting
  // card on the main page. Each shows when the browser has offered
  // installing, and on iPhones (where it can only explain how); never inside
  // the installed app.
  var onApple = /iphone|ipad|ipod/i.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function wireInstall(button, label, where){
    if(!button || installedApp()) return;
    var offered = false;
    button.hidden = !onApple;
    onInstallable(function(can){ offered = can; button.hidden = !(can || onApple); });
    button.addEventListener('click', function(e){
      var typed = document.getElementById('roll');
      var who = student(rollFromUrl() || (typed ? typed.value : '') || savedRoll());
      if(offered){
        track('install_click', who, { tool: where, result: 'prompt' });
        closeMenu();
        install();
      } else {
        // no site can install itself on an iPhone: say how, and keep the menu open
        e.stopPropagation();
        label.textContent = 'Tap Share, then "Add to Home Screen"';
        button.classList.add('is-hint');
        track('install_click', who, { tool: where, result: 'ios_hint' });
      }
    });
  }
  wireInstall(document.getElementById('installNav'), document.getElementById('installNavText'), 'nav');
  wireInstall(document.getElementById('installBtn'), document.getElementById('installBtnText'), 'greeting');

  // ---- LMS and ERP, side by side in Resources ----
  // The addresses are in js/portal-config.js. On a phone the LMS goes to its
  // app (App Store on an iPhone, Google Play on Android); anywhere else, to
  // the website.
  var lmsNav = document.getElementById('lmsNav'), erpNav = document.getElementById('erpNav');
  if(lmsNav && CONFIG.lms){
    var onAndroid = /android/i.test(navigator.userAgent || '');
    lmsNav.href = (onApple && CONFIG.lms.ios) || (onAndroid && CONFIG.lms.android) || CONFIG.lms.web || lmsNav.href;
    // A tap on a phone tries the app first. Android: an "intent" link opens the app when it is installed and
    // goes to Google Play when it is not. iPhone: the app's address is tried, and if the page is still in
    // front a moment later (nothing opened) the App Store page opens. The href above stays the store page
    // for anyone whose browser blocks this.
    lmsNav.addEventListener('click', function(e){
      var L = CONFIG.lms, store = onApple ? L.ios : L.android;
      if(!(onApple || onAndroid) || !L.scheme || !L.site || !store) return;
      e.preventDefault();
      if(onAndroid){
        window.location.href = 'intent://' + L.site + '#Intent;scheme=' + L.scheme + ';' + (L.androidPackage ? 'package=' + L.androidPackage + ';' : '') +
          'S.browser_fallback_url=' + encodeURIComponent(store) + ';end';
        return;
      }
      var gone = false, timer = 0;
      function away(){ gone = true; clearTimeout(timer); }
      document.addEventListener('visibilitychange', function(){ if(document.hidden) away(); });
      window.addEventListener('pagehide', away);
      timer = setTimeout(function(){ if(!gone) window.location.href = store; }, 1400);
      window.location.href = L.scheme + '://' + L.site;
    });
  }
  if(erpNav && CONFIG.erp && CONFIG.erp.url) erpNav.href = CONFIG.erp.url;

  // ---- the light / dark switch, left of Resources ----
  // One button: moon while the page is light, sun while it is dark. js/theme.js
  // (in the <head>) does the work; this only wires the button and keeps its
  // words right, including when the device changes theme by itself. Which
  // theme was switched to is counted (never who).
  var themeBtn = document.getElementById('themeBtn');
  if(themeBtn && window.IMTTheme){
    var labelTheme = function(){
      var next = window.IMTTheme.shown() === 'dark' ? 'light' : 'dark';
      themeBtn.setAttribute('aria-label', 'Switch to ' + next + ' mode');
      themeBtn.setAttribute('title', 'Switch to ' + next + ' mode');
    };
    labelTheme();
    document.addEventListener('imt-theme', labelTheme);
    themeBtn.addEventListener('click', function(){
      var now = window.IMTTheme.toggle();
      track('theme_change', null, { tool: PAGE, result: now });
    });
  }

  // ---- which classes are one student's (Weekly and the master timetable) ----
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

  window.IMT = {
    config: CONFIG,
    buildView: buildView,
    savedRoll: savedRoll,
    saveRoll: saveRoll,
    forgetRoll: forgetRoll,
    onInstallable: onInstallable,
    install: install,
    installedApp: installedApp,
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
    festivalTheme: festivalTheme,
    istMinutes: istMinutes,
    addDays: addDays,
    metaLine: metaLine,
    examSeatLocked: examSeatLocked,
    examLockedLabel: examLockedLabel,
    rollFromUrl: rollFromUrl,
    track: track,
    entry: entry,
    escapeHtml: escapeHtml,
    attachTilt: attachTilt
  };
})();
