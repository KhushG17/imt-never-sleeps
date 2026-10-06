// Shared by the portal and both tools: roll lookup against the roster and
// portal config, plus a few small page helpers.
(function(){
"use strict";
  var CONFIG = window.PORTAL_CONFIG || {};
  var BATCHES = CONFIG.batches || {};
  var ROSTER = window.ROSTER_DATA || {};

  // "25fpm-003 " and "25FPM003" are the same roll.
  function normRoll(v){
    return String(v == null ? '' : v).toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  function todayIso(){
    var d = new Date();
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }

  // Everything known about a roll. batchKey is null when the roll is neither
  // in the roster nor matches any batch's prefix, i.e. not a roll we know.
  function student(roll){
    roll = normRoll(roll);
    var entry = ROSTER[roll] || null;
    var batchKey = entry && entry.batch ? String(entry.batch) : null;
    if(!batchKey){
      for(var key in BATCHES){
        if(BATCHES.hasOwnProperty(key) && BATCHES[key].rollPrefix && roll.indexOf(BATCHES[key].rollPrefix) === 0){
          batchKey = key;
          break;
        }
      }
    }
    var batch = batchKey ? BATCHES[batchKey] || null : null;
    return {
      roll: roll,
      inRoster: !!entry,
      name: entry ? entry.name : '',
      major: entry ? entry.major || '' : '',
      minor: entry ? entry.minor || '' : '',
      courses: entry ? entry.courses || {} : {},
      batchKey: batchKey,
      batchLabel: batch ? batch.label : '',
      term: batch ? batch.term : null,
      alumni: !!(batch && batch.alumniFrom && todayIso() >= batch.alumniFrom),
      isTest: !!CONFIG.testRoll && roll === normRoll(CONFIG.testRoll)
    };
  }

  function greeting(s){
    if(s.alumni) return 'Hey Alumni' + (s.name ? ', ' + s.name : '');
    return 'Hey ' + (s.name || 'there');
  }

  // The line under the greeting on the portal.
  function welcome(s){
    if(s.alumni) return 'Once IMT, always IMT. Good to see you back.';
    if(!s.inRoster) return 'Your name and courses for ' + s.batchLabel + ' are not loaded yet. They will show up here once added.';
    var h = new Date().getHours();
    var part = h < 5 ? 'Up late?' : h < 12 ? 'Good morning.' : h < 17 ? 'Good afternoon.' : h < 22 ? 'Good evening.' : 'Up late?';
    return part + ' Your Term ' + s.term + ' schedule is ready. Pick what you want to check.';
  }

  // "Batch 2025-27 · Term 5 · Major MKT · Minor BA", skipping what's unknown.
  function metaLine(s){
    var parts = [];
    if(s.batchLabel) parts.push(s.batchLabel);
    if(s.alumni) parts.push('Alumni');
    else if(s.term) parts.push('Term ' + s.term);
    if(s.major) parts.push('Major ' + s.major);
    if(s.minor) parts.push('Minor ' + s.minor);
    return parts.join(' · ');
  }

  function examSeatLocked(s){
    return !!(CONFIG.examSeat && CONFIG.examSeat.locked) && !(s && s.isTest);
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
  // names or courses. The test roll is not counted. Page views are counted
  // automatically by Google Analytics once the ID is set.
  var GA_ID = (CONFIG.analytics && CONFIG.analytics.measurementId) || '';
  var trackingOn = !!GA_ID && window.location.protocol !== 'file:';
  if(trackingOn){
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
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
    metaLine: metaLine,
    examSeatLocked: examSeatLocked,
    rollFromUrl: rollFromUrl,
    track: track,
    escapeHtml: escapeHtml,
    attachTilt: attachTilt
  };
})();
