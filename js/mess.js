// The mess menu: a floating button on every page that opens a small card
// with today's four meals, and an arrow across to tomorrow's.
// Data: js/mess-data.js, written by scripts/update.py from the mess menu PDF.
(function(){
  var IMT = window.IMT, DATA = window.MESS_DATA;
  var settings = (IMT && IMT.config && IMT.config.mess) || {};
  if(!IMT || !DATA || settings.enabled === false) return;

  var MEALS = [['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['snacks', 'Snacks'], ['dinner', 'Dinner']];
  var DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var TINTS = { breakfast: 'var(--color-peach-wash)', lunch: 'var(--color-mint-wash)', snacks: 'var(--color-sky-wash)', dinner: 'var(--color-peach-wash)' };

  function minutes(hhmm){ var p = hhmm.split(':'); return +p[0] * 60 + +p[1]; }
  function clock(hhmm){
    var p = hhmm.split(':'), h = +p[0];
    return (h % 12 || 12) + ':' + p[1] + ' ' + (h < 12 ? 'AM' : 'PM');
  }
  function dayLabel(iso){
    var p = iso.split('-'), d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
    return DAY_NAMES[d.getUTCDay()] + ', ' + (+p[2]) + ' ' + MONTHS[+p[1] - 1];
  }
  function timing(meal){ return (DATA.timings || {})[meal] || null; }

  // The meal being served now, or the next one today; null once dinner is over.
  function mealUpNext(){
    var now = IMT.istMinutes();
    for(var i = 0; i < MEALS.length; i++){
      var t = timing(MEALS[i][0]);
      if(t && now < minutes(t[1])) return { meal: MEALS[i][0], on: now >= minutes(t[0]) };
    }
    return null;
  }

  var fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'mess-fab';
  fab.setAttribute('aria-label', 'Mess menu');
  fab.setAttribute('aria-expanded', 'false');
  fab.title = 'Mess menu';
  fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M5 3v5.5a2.5 2.5 0 0 0 5 0V3M7.5 3v18" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M16.5 21v-8M16.5 13c-1.9 0-3-2.2-3-5s1.1-5 3-5 3 2.2 3 5-1.1 5-3 5Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var panel = document.createElement('div');
  panel.className = 'mess-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Mess menu');
  panel.hidden = true;

  // A small pop-up beside the button saying what is being served or coming
  // next. It shows for a few seconds when the page opens, and again whenever
  // the button is hovered or focused; the button itself never goes away.
  var hint = document.createElement('div');
  hint.className = 'mess-hint';
  hint.setAttribute('aria-hidden', 'true');
  function hintText(){
    var next = mealUpNext(), day = (DATA.days || {})[IMT.istToday()];
    if(!next) return '<b>Mess menu</b><span>See what is on tomorrow</span>';
    var name = MEALS.filter(function(m){ return m[0] === next.meal; })[0][1];
    var first = day && day[next.meal] && day[next.meal][0];
    return '<b>' + (next.on ? name + ' is on' : name + ' at ' + clock(timing(next.meal)[0])) + '</b>' +
      '<span>' + (first ? IMT.escapeHtml(first) + ' and more' : 'Tap for the mess menu') + '</span>';
  }
  function showHint(ms){
    if(!panel.hidden) return;
    hint.innerHTML = hintText();
    hint.classList.add('is-on');
    clearTimeout(showHint.timer);
    if(ms) showHint.timer = setTimeout(hideHint, ms);
  }
  function hideHint(){ clearTimeout(showHint.timer); hint.classList.remove('is-on'); }
  hint.addEventListener('click', function(e){ e.stopPropagation(); fab.click(); });

  var today, tomorrow, lastDay, showing;   // set each time the card opens

  function render(){
    var isToday = showing === today;
    var day = (DATA.days || {})[showing];
    var next = isToday ? mealUpNext() : null;
    var arrow = function(dir, off){
      return '<button type="button" class="mess-arrow" data-go="' + dir + '"' + (off ? ' disabled' : '') +
        ' aria-label="' + (dir === 'prev' ? 'The day before' : 'The next day') + '"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
        '<path d="' + (dir === 'prev' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6') + '" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
    };
    var body;
    if(!day){
      body = '<p class="mess-empty">The menu for this day is not uploaded yet.</p>';
    } else {
      body = MEALS.map(function(m){
        var t = timing(m[0]), items = day[m[0]] || [];
        var mark = next && next.meal === m[0];
        return '<div class="mess-row' + (mark ? ' is-next' : '') + '">' +
          '<div class="cls-time" style="--tint:' + (mark ? TINTS[m[0]] : 'var(--color-mist-hairline)') + '">' +
            '<span class="cls-start">' + (t ? clock(t[0]) : m[1]) + '</span>' + (t ? '<span class="cls-end">to ' + clock(t[1]) + '</span>' : '') + '</div>' +
          '<div class="mess-main"><div class="mess-meal">' + m[1] +
            (mark ? '<span class="mess-tag">' + (next.on ? 'Now' : 'Next') + '</span>' : '') + '</div>' +
            '<div class="mess-items">' + (items.length ? IMT.escapeHtml(items.join(', ')) : 'Not listed') + '</div></div></div>';
      }).join('');
    }
    panel.innerHTML =
      '<div class="mess-head">' + arrow('prev', showing <= today) +
        '<div class="mess-title"><span class="mess-kicker">Mess menu</span>' +
          '<span class="mess-date">' + dayLabel(showing) + (isToday || showing === tomorrow ? '<span class="today-badge">' + (isToday ? 'Today' : 'Tomorrow') + '</span>' : '') + '</span></div>' +
        arrow('next', showing >= lastDay) +
        '<button type="button" class="mess-close" aria-label="Close the mess menu"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
          '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>' +
      '<div class="mess-body">' + body + '</div>' +
      (DATA.note ? '<p class="mess-note">' + IMT.escapeHtml(DATA.note) + '</p>' : '');
  }

  function open(){
    today = IMT.istToday();
    tomorrow = IMT.addDays(today, 1);
    // the arrows run from today to the last day the menu has (tomorrow at least)
    lastDay = Object.keys(DATA.days || {}).reduce(function(a, d){ return d > a ? d : a; }, tomorrow);
    // once dinner is over, the menu worth seeing is tomorrow's
    showing = mealUpNext() ? today : tomorrow;
    render();
    hideHint();
    panel.hidden = false;
    fab.setAttribute('aria-expanded', 'true');
    fab.classList.add('is-open');
    var typed = document.getElementById('roll');   // the portal's roll box
    var roll = (IMT.rollFromUrl && IMT.rollFromUrl()) || (typed ? typed.value : '');
    IMT.track('tool_open', roll ? IMT.student(roll) : null, {
      tool: 'mess', status: (DATA.days || {})[showing] ? (showing === today ? 'today' : 'tomorrow') : 'no_menu'
    });
  }
  function close(){
    panel.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
    fab.classList.remove('is-open');
  }

  fab.addEventListener('click', function(){ if(panel.hidden) open(); else close(); });
  panel.addEventListener('click', function(e){
    // redrawing the card removes the button that was clicked, so the
    // click-outside check below must not see this click
    e.stopPropagation();
    var go = e.target.closest('.mess-arrow');
    if(go && !go.disabled){
      var dir = go.getAttribute('data-go');
      showing = IMT.addDays(showing, dir === 'next' ? 1 : -1);
      render();
      var again = panel.querySelector('.mess-arrow[data-go="' + dir + '"]:not([disabled])') || panel.querySelector('.mess-arrow:not([disabled])');
      if(again) again.focus();
      return;
    }
    if(e.target.closest('.mess-close')){ close(); fab.focus(); }
  });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && !panel.hidden){ close(); fab.focus(); } });
  document.addEventListener('click', function(e){
    if(!panel.hidden && !panel.contains(e.target) && !fab.contains(e.target)) close();
  });

  fab.addEventListener('mouseenter', function(){ showHint(0); });
  fab.addEventListener('mouseleave', hideHint);
  fab.addEventListener('focus', function(){ showHint(0); });
  fab.addEventListener('blur', hideHint);

  // These go on <html>, not <body>: the body has a CSS perspective (for the
  // card tilt), and that makes anything "fixed" inside it scroll away with
  // the page. Outside the body they stay put in the corner of the screen.
  var root = document.documentElement;
  root.appendChild(panel);
  root.appendChild(hint);
  root.appendChild(fab);
  setTimeout(function(){ showHint(6000); }, 900);
})();
