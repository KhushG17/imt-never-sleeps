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
    examSub.textContent = locked ? (CONFIG.examSeat.lockedLabel || 'Coming soon') : EXAM_SUB_OPEN;

    searchCard.hidden = true;
    stepsStrip.hidden = true;
    greetCard.hidden = false;
  }

  IMT.attachTilt(document.querySelectorAll('.step'));

  // Coming back from a tool ("Back to portal") lands on the greeting again.
  var fromUrl = IMT.rollFromUrl();
  if(fromUrl){
    rollInput.value = fromUrl;
    doSearch();
  }
})();
