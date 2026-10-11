// The Bus Schedule page: the next bus each way on top, then the two shifts
// as timetables with the buses already gone today dimmed and the next one
// picked out. Timings come from js/bus-data.js.
(function(){
  var IMT = window.IMT, DATA = window.BUS_DATA;
  if(!IMT || !DATA) return;
  var A = DATA.stops.a, B = DATA.stops.b;

  var ARROW = '<svg class="bus-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15M13.500 6.500L19 12l-5.500 5.500" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var BUS = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4.500" y="3.500" width="15" height="14" rx="3" stroke="currentColor" stroke-width="1.700"/><path d="M4.500 11h15M8 17.500V20M16 17.500V20" stroke="currentColor" stroke-width="1.700" stroke-linecap="round"/><circle cx="8.300" cy="14.200" r="1" fill="currentColor"/><circle cx="15.700" cy="14.200" r="1" fill="currentColor"/></svg>';
  var SUN = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.800"/><path d="M12 3v2.200M12 18.800V21M3 12h2.200M18.800 12H21M5.600 5.600l1.600 1.600M16.800 16.800l1.600 1.600M18.400 5.600l-1.600 1.600M7.200 16.800l-1.600 1.600" stroke="currentColor" stroke-width="1.800" stroke-linecap="round"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19.500 14.500A8 8 0 0 1 9.500 4.500a8 8 0 1 0 10 10Z" stroke="currentColor" stroke-width="1.800" stroke-linejoin="round"/></svg>';

  function minutes(hhmm){ var p = hhmm.split(':'); return +p[0] * 60 + +p[1]; }
  function clock(hhmm){
    var p = hhmm.split(':'), h = +p[0];
    return (h % 12 || 12) + ':' + p[1] + ' ' + (h < 12 ? 'AM' : 'PM');
  }
  function route(from, to){
    return IMT.escapeHtml(from) + ARROW + '<span class="sr-only"> to </span>' + IMT.escapeHtml(to);
  }

  // The next departure in one direction, across both shifts: the first time
  // still to come, wrapping past midnight.
  function nextIn(key){
    var now = IMT.istMinutes(), best = null;
    DATA.shifts.forEach(function(shift, si){
      shift[key].forEach(function(t, ti){
        var wait = (minutes(t) - now + 1440) % 1440;
        if(best === null || wait < best.wait) best = { wait: wait, time: t, shift: si, index: ti };
      });
    });
    return best;
  }
  function waitText(m){
    if(m === 0) return 'Leaving now';
    if(m < 60) return 'in ' + m + ' min';
    var h = Math.floor(m / 60), r = m % 60;
    return 'in ' + h + ' h' + (r ? ' ' + r + ' min' : '');
  }
  // Has this bus already left in the shift's current run? A shift that runs
  // past midnight (the night shift) starts its run in the evening: before
  // then nothing has gone; after midnight the evening buses have.
  function gone(shift, t){
    var now = IMT.istMinutes(), all = shift.fromA.concat(shift.fromB).map(minutes);
    var first = Math.min(minutes(shift.fromA[0]), minutes(shift.fromB[0]));   // when the shift's run begins
    var overnight = all.some(function(m){ return m < first; });
    var m = minutes(t);
    if(!overnight) return m < now;
    if(now >= first) return m >= first && m < now;                 // evening: only earlier evening buses
    var lastAfterMidnight = Math.max.apply(null, all.filter(function(x){ return x < first; }));
    if(now <= lastAfterMidnight) return m >= first || m < now;      // small hours: the evening ones, and earlier small-hours ones
    return false;                                                    // daytime: tonight's run has not begun
  }

  function render(){
    var nextA = nextIn('fromA'), nextB = nextIn('fromB');
    var card = function(from, to, next){
      var soon = next.wait <= 15;
      return '<div class="bus-next' + (soon ? ' is-soon' : '') + '">' +
        '<div class="bus-next-top"><span class="bus-next-ico">' + BUS + '</span><span class="bus-next-route">' + route(from, to) + '</span></div>' +
        '<div class="bus-next-time">' + clock(next.time) + '</div>' +
        '<div class="bus-next-wait"><span class="bus-pulse" aria-hidden="true"></span>Next bus ' + waitText(next.wait).replace(/^Leaving now$/, '· leaving now') + '</div></div>';
    };
    document.getElementById('busNext').innerHTML = card(A, B, nextA) + card(B, A, nextB);

    // the shift that is running (the one the very next bus belongs to) goes
    // first on a phone, where the two timetables are stacked
    var running = (nextA.wait <= nextB.wait ? nextA : nextB).shift;
    document.getElementById('busShifts').innerHTML = DATA.shifts.map(function(shift, si){
      var rows = Math.max(shift.fromA.length, shift.fromB.length), body = '';
      for(var i = 0; i < rows; i++){
        var cell = function(list, next){
          if(list[i] == null) return '<td></td>';
          var isNext = next.shift === si && next.index === i;
          var cls = isNext ? 'is-next' : gone(shift, list[i]) ? 'is-gone' : '';
          return '<td' + (cls ? ' class="' + cls + '"' : '') + '><span class="bus-time">' + clock(list[i]) + '</span>' + (isNext ? '<span class="bus-tag">Next</span>' : '') + '</td>';
        };
        body += '<tr>' + cell(shift.fromA, nextA) + cell(shift.fromB, nextB) + '</tr>';
      }
      var night = /night/i.test(shift.name);
      var span = clock(shift.fromA[0] < shift.fromB[0] || night ? shift.fromA[0] : shift.fromB[0]) + ' to ' +
                 clock(night ? shift.fromA[shift.fromA.length - 1] : shift.fromB[shift.fromB.length - 1]);
      return '<section class="bus-card' + (night ? ' is-night' : '') + (si === running ? ' is-running' : '') + '">' +
        '<header class="bus-card-head"><span class="bus-shift-ico">' + (night ? MOON : SUN) + '</span>' +
          '<div><h2 class="bus-shift">' + IMT.escapeHtml(shift.name) + '</h2><p class="bus-span">' + span + ' · ' + (shift.fromA.length + shift.fromB.length) + ' buses</p></div></header>' +
        '<table class="bus-table"><thead><tr><th>' + route(A, B) + '</th><th>' + route(B, A) + '</th></tr></thead>' +
        '<tbody>' + body + '</tbody></table></section>';
    }).join('');
  }

  render();
  setInterval(render, 30000);   // keep "next bus" right while the page stays open
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) render(); });

  var back = document.getElementById('backBtn'), roll = IMT.rollFromUrl() || IMT.savedRoll();
  if(back && roll) back.href = '../?roll=' + encodeURIComponent(roll);
  IMT.track('tool_open', null, { tool: 'bus', status: 'shown', entry: IMT.entry() });
})();
