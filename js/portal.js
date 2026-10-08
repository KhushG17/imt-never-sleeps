(function(){
"use strict";
  var IMT = window.IMT;
  var CONFIG = IMT.config;

  var rollInput = document.getElementById('roll');
  var goBtn = document.getElementById('go');
  var errBox = document.getElementById('err');
  var searchCard = document.getElementById('searchCard');
  var stepsStrip = document.getElementById('stepsStrip');
  var greetCard = document.getElementById('greetCard');
  var greetRoll = document.getElementById('greetRoll');
  var greetName = document.getElementById('greetName');
  var greetMeta = document.getElementById('greetMeta');
  var greetNote = document.getElementById('greetNote');
  var weeklyBtn = document.getElementById('weeklyBtn');
  var examBtn = document.getElementById('examBtn');
  var examSub = document.getElementById('examSub');
  var clearBtn = document.getElementById('clearBtn');
  var EXAM_SUB_OPEN = examSub.textContent;

  rollInput.addEventListener('input', function(){ errBox.hidden = true; });
  rollInput.addEventListener('keydown', function(e){ if(e.key === 'Enter') doSearch(true); });
  goBtn.addEventListener('click', function(){ doSearch(true); });
  clearBtn.addEventListener('click', function(){
    rollInput.value = '';
    greetCard.hidden = true;
    searchCard.hidden = false;
    stepsStrip.hidden = false;
    errBox.hidden = true;
    showPill(normalPill());
    rollInput.focus();
  });

  // A locked tool stays visible but can't be followed.
  function setLocked(btn, locked){
    btn.classList.toggle('is-locked', locked);
    if(locked){
      btn.setAttribute('aria-disabled', 'true');
      btn.setAttribute('tabindex', '-1');
    } else {
      btn.removeAttribute('aria-disabled');
      btn.removeAttribute('tabindex');
    }
  }
  examBtn.addEventListener('click', function(e){
    if(examBtn.classList.contains('is-locked')){
      e.preventDefault();
      IMT.track('locked_tool_click', IMT.student(rollInput.value), { tool: 'exam_seat' });
    }
  });

  // typedByVisitor is false when the roll came back in the URL from a tool
  // page, so returning to the portal isn't counted as a second roll entry.
  function doSearch(typedByVisitor){
    var typed = rollInput.value.trim();
    if(!typed) return;
    var s = IMT.student(typed);
    if(typedByVisitor){
      IMT.track('roll_search', s, { result: !s.batchKey ? 'not_found' : s.inRoster ? 'found' : 'batch_only' });
    }
    if(!s.batchKey){
      greetCard.hidden = true;
      errBox.hidden = false;
      errBox.textContent = 'No student found for "' + typed + '". Check the roll number and try again.';
      return;
    }
    errBox.hidden = true;

    greetRoll.textContent = 'Roll number ' + s.roll;
    greetName.textContent = IMT.greeting(s);
    var meta = IMT.metaLine(s);
    greetMeta.textContent = meta;
    greetMeta.hidden = !meta;
    greetNote.textContent = IMT.welcome(s);

    var q = '?roll=' + encodeURIComponent(s.roll);
    weeklyBtn.href = 'weekly-seat/' + q;
    examBtn.href = 'exam-seat/' + q;
    var locked = IMT.examSeatLocked(s);
    setLocked(examBtn, locked);
    examSub.textContent = locked ? IMT.examLockedLabel(s) : EXAM_SUB_OPEN;

    searchCard.hidden = true;
    stepsStrip.hidden = true;
    greetCard.hidden = false;
    showPill(pillFor(s));
  }

  IMT.attachTilt(document.querySelectorAll('.step'));

  // ---- the pill above the heading ----
  // While Exam Seat is unlocked: "Exam seating is live", and nothing else.
  // Otherwise it follows the weekly schedules as they are uploaded:
  //   green "Live · 5 Oct - 11 Oct"   this week is loaded for everyone it
  //         speaks for. A week uploaded early stretches the dates
  //         ("Live · 5 Oct - 18 Oct").
  //   red   "5 Oct - 11 Oct"   the dates alone, in red, mean something is
  //         not up to date: either not every programme's schedule for this
  //         week is in, or the schedule day has passed those dates. It does
  //         not say which.
  //   red   "New week's schedule not uploaded yet"   nothing to date at all
  //   hidden during End Term Exams, and for alumni and terms held in Dubai
  // Each programme's PDF arrives on its own. Before a roll is entered the
  // pill speaks for everyone, and its dates only move on to a new week once
  // at least three programmes have it (livePill.minProgrammes); after, it
  // speaks for that student's own programme. The test rolls force one pill
  // each (livePill.preview in js/portal-config.js).
  var pill = document.getElementById('livePill');
  var MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function dates(c){
    var a = c.start.split('-'), b = c.end.split('-');
    return (+a[2]) + ' ' + MONTHS[+a[1]] + ' - ' + (+b[2]) + ' ' + MONTHS[+b[1]];
  }
  function examPill(){
    return { text: (CONFIG.examSeat && CONFIG.examSeat.liveLabel) || 'Exam seating is live' };
  }
  function showPill(p){
    document.getElementById('livePillText').textContent = p ? p.text : '';
    pill.classList.toggle('is-stale', !!(p && p.stale));
    pill.hidden = !p;
  }
  function normalPill(groupKey){
    if(CONFIG.examSeat && !CONFIG.examSeat.locked) return examPill();
    var c = IMT.coverage(window.WEEKLY_DATA, groupKey);
    if(c.state === 'live') return { text: 'Live · ' + dates(c) };
    if(c.state === 'partial' || c.state === 'stale') return { text: dates(c), stale: true };
    if(c.state === 'missing'){
      return { text: (CONFIG.livePill && CONFIG.livePill.missingLabel) || 'New week\'s schedule not uploaded yet', stale: true };
    }
    return null;
  }
  function pillFor(s){
    var preview = ((CONFIG.livePill && CONFIG.livePill.preview) || {})[s && s.isTest ? s.roll : ''];
    if(preview === 'exam') return examPill();
    if(preview === 'weekly'){
      var c = IMT.coverage(window.WEEKLY_DATA, s.groupKey);
      if(c.start) return { text: 'Live · ' + dates(c) };
    }
    return normalPill(s.groupKey);
  }
  showPill(normalPill());

  // Coming back from a tool ("Back to portal") lands on the greeting again.
  var fromUrl = IMT.rollFromUrl();
  if(fromUrl){
    rollInput.value = fromUrl;
    doSearch();
  }
})();
