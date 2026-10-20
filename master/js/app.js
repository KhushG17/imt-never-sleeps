/* Master timetable (staff view): a hidden page, behind a password.

   Built from window.WEEKLY_DATA, the same published weekly schedules the
   student pages use (the newest weeks per group). Five views of one list of
   classes:
     Rooms board       rooms down the side, time across: what is running at any
                       moment, which rooms are free and until when
     Week by section   the classic grid for one section, track or student
     Find a time       when several sections are all free, for a guest lecture
                       or a make-up class
     Search            one box that understands a course, room, day, section
                       or roll number; copy or download what it finds
     Checks            things in the schedules that look wrong (room clashes)

   The password is a soft lock: only a salted hash of it is kept here, but
   anyone who reads this page's code can get past it. It keeps casual
   visitors out of a page that shows nothing that is not already published
   in the weekly files. See README, "Master timetable". */
(function(){
  'use strict';
  var IMT = window.IMT, WEEKLY = window.WEEKLY_DATA || {}, SITE = window.SITE_DATA || {};

  // ---- the lock ----
  var SALT = 'imt-never-sleeps/master:';
  var HASH = '1625fda861ec6741af9c29629b695b0496c4bba889fae15a576efa352cbab2c6';
  var KEY = 'imt.master';

  function $(id){ return document.getElementById(id); }
  var esc = IMT.escapeHtml;

  function sha256(text){
    if(!window.crypto || !window.crypto.subtle) return Promise.reject(new Error('no crypto'));
    return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function(buf){
      return Array.prototype.map.call(new Uint8Array(buf), function(b){ return (b < 16 ? '0' : '') + b.toString(16); }).join('');
    });
  }
  function remembered(){ try { return window.localStorage.getItem(KEY) === HASH; } catch(e){ return false; } }
  function remember(on){
    try { if(on) window.localStorage.setItem(KEY, HASH); else window.localStorage.removeItem(KEY); } catch(e){}
  }

  var gate = $('gate'), app = $('app'), lockError = $('lockError'), started = false;
  function show(unlocked){
    gate.hidden = unlocked;
    app.hidden = !unlocked;
    if(unlocked && !started){ started = true; start(); }
  }
  $('lockForm').addEventListener('submit', function(e){
    e.preventDefault();
    var typed = $('lockInput').value.trim();
    lockError.hidden = true;
    sha256(SALT + typed).then(function(h){
      if(h === HASH){
        IMT.track('master_unlock', null, { tool: 'master', result: 'ok' });
        remember(true); $('lockInput').value = ''; show(true);
      } else {
        IMT.track('master_unlock', null, { tool: 'master', result: 'wrong' });
        lockError.textContent = 'That is not the password.'; lockError.hidden = false; $('lockInput').select();
      }
    }, function(){
      lockError.textContent = 'This needs a secure (https) connection.'; lockError.hidden = false;
    });
  });
  $('lockBtn').addEventListener('click', function(){ remember(false); show(false); $('lockInput').focus(); });

  // ---- small helpers ----
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var DAYFULL = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  var MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var PROG = { core: 'PGDM', bfs: 'PGDM BFS', dcp: 'PGDM DCP' };
  function mins(hhmm){ var p = hhmm.split(':'); return +p[0] * 60 + +p[1]; }
  function clock(m){ var h = Math.floor(m / 60), mi = m % 60; return ((h + 11) % 12 + 1) + ':' + (mi < 10 ? '0' : '') + mi + ' ' + (h < 12 ? 'AM' : 'PM'); }
  function range(a, b){
    var x = clock(a), y = clock(b);
    return (x.slice(-2) === y.slice(-2) ? x.slice(0, -3) : x) + ' - ' + y;
  }
  function hourTick(m){ var h = Math.floor(m / 60); return ((h + 11) % 12 + 1) + (h < 12 ? 'a' : 'p'); }
  function dow(iso){ var p = iso.split('-'); return (new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).getUTCDay() + 6) % 7; }
  function dateLabel(iso){ var p = iso.split('-'); return DAYS[dow(iso)] + ', ' + (+p[2]) + ' ' + MONTHS[+p[1]] + ' ' + p[0]; }
  function shortDate(iso){ var p = iso.split('-'); return DAYS[dow(iso)] + ' ' + (+p[2]) + ' ' + MONTHS[+p[1]]; }
  function mondayOf(iso){ return IMT.addDays(iso, -dow(iso)); }
  function weekLabel(start){
    var a = start.split('-'), z = IMT.addDays(start, 6).split('-');
    return (+a[2]) + (a[1] === z[1] ? '' : ' ' + MONTHS[+a[1]]) + ' - ' + (+z[2]) + ' ' + MONTHS[+z[1]] + ' ' + z[0];
  }
  function natural(a, b){ return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }); }
  function option(value, text, selected){ return '<option value="' + esc(value) + '"' + (selected ? ' selected' : '') + '>' + esc(text) + '</option>'; }
  function norm(s){ return String(s).toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function minutesText(m){ return m >= 60 ? (Math.floor(m / 60) + 'h' + (m % 60 ? ' ' + (m % 60) + 'm' : '')) : m + ' min'; }

  var toastTimer = 0;
  document.documentElement.appendChild($('toast'));   // fixed pieces live on <html>: the body's perspective would break position:fixed
  function toast(text){
    var t = $('toast'); t.textContent = text; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function(){ t.hidden = true; }, 2600);
  }
  function copyText(text, done){
    function ok(){ toast(done || 'Copied'); }
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(ok, fallback); } else fallback();
    function fallback(){
      var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta);
      ta.select(); try { document.execCommand('copy'); ok(); } catch(e){ toast('Could not copy'); } document.body.removeChild(ta);
    }
  }

  // ---- the data: one flat list of classes ----
  var GROUPS = Object.keys(WEEKLY).filter(function(g){ return (WEEKLY[g] || []).length; }).sort();
  var HUES = [210, 155, 28, 275, 340, 190], COURSE_HUES = [210, 155, 28, 275, 340, 190, 50, 120];
  var GROUP_HUE = {};
  GROUPS.forEach(function(g, i){ GROUP_HUE[g] = HUES[i % HUES.length]; });
  function courseHue(code){ var h = 0; for(var i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0; return COURSE_HUES[h % COURSE_HUES.length]; }
  function groupLabel(g){
    var tl = (SITE.timeline || {})[g] || {};
    return (PROG[g.split('-')[1]] || g) + ' · ' + String(tl.label || g).replace('Batch ', '');
  }
  // a short name for a lane label: "DCP 26-28"
  function groupShort(g){
    var tl = (SITE.timeline || {})[g] || {};
    return ({ core: 'PGDM', bfs: 'BFS', dcp: 'DCP' }[g.split('-')[1]] || g) + ' ' + String(tl.label || g).replace(/Batch 20(\d\d)-(\d\d)/, '$1-$2');
  }
  function unitWord(week){ return week.mode === 'track' ? 'Track' : (week.rowLabel || 'Section'); }
  function unitOf(week, x){ return x.grp ? '' : (week.mode === 'course' ? (x.sec || '') : (x.row || '')); }

  var EVENTS = [];          // classes, one per slot
  var NOTES = [];           // entries that are not a class ("VB-SSR", a guest visit): one per run of slots
  var DAYNOTES = {};        // group -> date -> text, e.g. "Holiday"
  var DATES = {};           // every date with data
  var ROOMS = {};           // every room named in any schedule
  var UNITS = {};           // group -> sorted sections or tracks
  var COURSES = {};         // group -> { code: name }
  var WEEKSET = {};         // Monday -> true

  function fromSession(g, week, x){
    return { g: g, week: week, date: week.days[x.d].date, start: mins(week.slots[x.s][0]), end: mins(week.slots[x.s][1]), code: x.c,
             name: week.courses[x.c] || x.c, n: x.n, room: x.room || '', unit: unitOf(week, x), grp: x.grp || '',
             elective: (week.electives || []).indexOf(x.c) >= 0, word: unitWord(week), s: x.s, d: x.d };
  }
  function fromSpecial(g, week, sp){
    return { g: g, week: week, date: week.days[sp.d].date, start: mins(week.slots[sp.s][0]), end: mins(week.slots[sp.s + sp.span - 1][1]),
             text: sp.text, units: sp.rows || [], word: unitWord(week), s: sp.s, span: sp.span, d: sp.d };
  }
  GROUPS.forEach(function(g){
    UNITS[g] = {}; COURSES[g] = {}; DAYNOTES[g] = {};
    WEEKLY[g].forEach(function(week){
      WEEKSET[week.start] = true;
      week.days.forEach(function(d){ if(d.note) DAYNOTES[g][d.date] = d.note; DATES[d.date] = 1; });
      (week.rows || []).forEach(function(r){ UNITS[g][r] = 1; });
      week.sessions.forEach(function(x){
        var e = fromSession(g, week, x);
        EVENTS.push(e); if(e.room) ROOMS[e.room] = 1;
        if(e.unit) UNITS[g][e.unit] = 1;
        COURSES[g][e.code] = e.name;
      });
      week.specials.forEach(function(sp){ NOTES.push(fromSpecial(g, week, sp)); });
    });
    UNITS[g] = Object.keys(UNITS[g]).sort(natural);
  });
  var DATE_LIST = Object.keys(DATES).sort();
  var ROOM_LIST = Object.keys(ROOMS).sort(natural);
  var WEEK_STARTS = Object.keys(WEEKSET).sort();
  // the hours the boards and strips cover: 8 AM to 9 PM, wider if a class needs it
  var LO = 480, HI = 1260;
  EVENTS.forEach(function(e){ LO = Math.min(LO, Math.floor(e.start / 60) * 60); HI = Math.max(HI, Math.ceil(e.end / 60) * 60); });
  EVENTS.forEach(function(e, i){ e.id = i; });

  // rooms in the order and groups they are looked for in: 3xx, 4xx, 5xx, then the C block, then halls
  function roomGroup(r){
    if(/^\d{3}$/.test(r)) return { k: 10 + +r.charAt(0), label: 'Rooms ' + r.charAt(0) + 'xx' };
    if(/^C-/i.test(r)) return { k: 20, label: 'C block' };
    return { k: 30, label: 'Halls and other rooms' };
  }
  var ROOM_ORDER = ROOM_LIST.slice().sort(function(a, b){ return roomGroup(a).k - roomGroup(b).k || natural(a, b); });

  var today = IMT.istToday();
  var state = { date: '', week: '', time: 600, focus: '', blocks: [], sel: -1, picked: {}, sIdx: {} };

  // ---- shared pieces ----
  function tag(text){ return '<span class="mt-tag">' + esc(text) + '</span>'; }
  function who(e){ return e.grp ? 'Group ' + e.grp + ' (all sections)' : (e.unit ? e.word + ' ' + e.unit : ''); }
  function sorted(list){
    return list.slice().sort(function(a, b){
      return (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) || a.start - b.start || natural(groupLabel(a.g), groupLabel(b.g)) ||
             natural(a.unit || a.grp || '', b.unit || b.grp || '') || natural(a.name || a.text || '', b.name || b.text || '');
    });
  }
  function weekNav(prefix){
    var i = WEEK_STARTS.indexOf(state.week);
    $(prefix + 'Week').textContent = weekLabel(state.week);
    $(prefix + 'Prev').disabled = i <= 0;
    $(prefix + 'Next').disabled = i < 0 || i >= WEEK_STARTS.length - 1;
  }
  function setWeek(start){
    if(WEEK_STARTS.indexOf(start) < 0) return;
    state.week = start;
    if(mondayOf(state.date) !== start){
      var same = IMT.addDays(start, dow(state.date));
      state.date = DATES[same] ? same : start;
    }
    renderBoard(); renderFind(); renderSearch();
  }

  // ======================================================================
  // 1. ROOMS BOARD
  // ======================================================================
  function mergeBlocks(evs){
    // a class in a room, for one or more sections at once, is one block
    var map = {}, out = [];
    evs.forEach(function(e){
      if(!e.room) return;
      var k = [e.room, e.start, e.end, e.g, e.name, e.n, e.grp].join('|');
      if(!map[k]){ map[k] = { room: e.room, a: e.start, b: e.end, g: e.g, code: e.code, name: e.name, n: e.n, grp: e.grp, units: [], word: e.word, elective: e.elective, date: e.date }; out.push(map[k]); }
      if(e.unit && map[k].units.indexOf(e.unit) < 0) map[k].units.push(e.unit);
    });
    return out;
  }
  function assignLanes(blocks){
    // overlapping blocks in one room share the row, stacked
    var byRoom = {};
    blocks.forEach(function(b){ (byRoom[b.room] = byRoom[b.room] || []).push(b); });
    Object.keys(byRoom).forEach(function(r){
      var L = byRoom[r].sort(function(x, y){ return x.a - y.a || x.b - y.b; }), ends = [];
      L.forEach(function(b){
        var lane = 0; while(ends[lane] > b.a) lane++;
        ends[lane] = b.b; b.lane = lane;
      });
      var lanes = Math.max(1, ends.length);
      L.forEach(function(b){ b.lanes = lanes; b.clash = lanes > 1; });
    });
  }
  function blockLabel(b){ return b.grp ? 'G' + b.grp : b.units.join('+'); }
  function blockTitle(b){
    return b.name + ' · ' + (b.grp ? 'Group ' + b.grp : b.word + ' ' + b.units.join(' + ')) + ' · ' + groupLabel(b.g) + ' · session ' + b.n + ' · room ' + b.room + ' · ' + range(b.a, b.b);
  }

  function renderBoard(){
    weekNav('b');
    $('bDays').innerHTML = [0, 1, 2, 3, 4, 5, 6].map(function(i){
      var d = IMT.addDays(state.week, i), off = GROUPS.every(function(g){ return DAYNOTES[g][d]; });
      return '<button class="mt-day' + (d === state.date ? ' is-on' : '') + (d === today ? ' is-today' : '') + (off ? ' is-off' : '') + '" type="button" data-d="' + d + '"' + (DATES[d] ? '' : ' disabled') +
        ' aria-pressed="' + (d === state.date) + '"><b>' + DAYS[i] + '</b><span>' + (+d.slice(8)) + '</span>' + (off ? '<em>Holiday</em>' : '') + '</button>';
    }).join('');
    $('bLegend').innerHTML = GROUPS.map(function(g){
      return '<button class="mt-key mt-hue' + (state.focus === g ? ' is-on' : '') + '" type="button" data-g="' + g + '" style="--h:' + GROUP_HUE[g] + '" aria-pressed="' + (state.focus === g) + '"><i></i>' + esc(groupLabel(g)) + '</button>';
    }).join('');

    var blocks = mergeBlocks(EVENTS.filter(function(e){ return e.date === state.date; }));
    assignLanes(blocks);
    state.blocks = blocks; state.sel = -1; $('bDetail').hidden = true;
    var byRoom = {};
    blocks.forEach(function(b, i){ b.i = i; (byRoom[b.room] = byRoom[b.room] || []).push(b); });
    var span = HI - LO, ticks = '', rows = '', lastGroup = '';
    for(var m = LO; m <= HI; m += 60) ticks += '<span style="left:' + ((m - LO) / span * 100) + '%">' + hourTick(m) + '</span>';
    // how many rooms are in use, every quarter hour: the day's shape at a glance
    var used = [], peak = 0;
    for(var q = LO; q < HI; q += 15){
      var n = 0; ROOM_LIST.forEach(function(r){ if((byRoom[r] || []).some(function(b){ return b.a <= q && q < b.b; })) n++; });
      used.push([q, n]); peak = Math.max(peak, n);
    }
    var bars = used.map(function(u){
      return '<i data-t="' + u[0] + '" style="height:' + (peak ? Math.max(u[1] ? 8 : 0, u[1] / peak * 100) : 0) + '%" title="' + esc(clock(u[0]) + ' · ' + u[1] + (u[1] === 1 ? ' room' : ' rooms') + ' in use') + '"></i>';
    }).join('');
    ROOM_ORDER.forEach(function(r){
      var grp = roomGroup(r);
      if(grp.label !== lastGroup){
        var count = ROOM_ORDER.filter(function(x){ return roomGroup(x).label === grp.label; }).length;
        rows += '<div class="bd-group"><div class="bd-groupname">' + esc(grp.label) + ' <span>' + count + '</span></div></div>';
        lastGroup = grp.label;
      }
      var list = byRoom[r] || [], clash = list.some(function(b){ return b.clash; });
      rows += '<div class="bd-row' + (clash ? ' has-clash' : '') + '" data-room="' + esc(r) + '"><div class="bd-room">' + esc(r) + '</div><div class="bd-track">' +
        list.map(function(b){
          return '<button class="bd-blk mt-hue' + (b.clash ? ' is-clash' : '') + (state.focus && state.focus !== b.g ? ' is-dim' : '') + '" type="button" data-i="' + b.i + '" style="--h:' + GROUP_HUE[b.g] +
            ';left:' + ((b.a - LO) / span * 100) + '%;width:' + ((b.b - b.a) / span * 100) + '%;top:' + (b.lane / b.lanes * 100) + '%;height:' + (100 / b.lanes) + '%" title="' + esc(blockTitle(b)) + '">' +
            '<b>' + esc(b.code) + '</b><span>' + esc(blockLabel(b)) + '</span></button>';
        }).join('') + '</div></div>';
    });
    $('bBoard').innerHTML = '<div class="bd" style="--cols:' + ((HI - LO) / 60) + '"><div class="bd-head"><div class="bd-corner">Room</div><div class="bd-axis">' + ticks + '</div></div>' +
      '<div class="bd-head bd-loadrow"><div class="bd-corner">In use</div><div class="bd-bars">' + bars + '</div></div>' +
      '<div class="bd-body">' + rows + '</div><div class="bd-cur" aria-hidden="true"></div></div>';
    var slider = $('bTime'); slider.min = LO; slider.max = HI;
    paintTime();
    centreCursor();
    renderLoad();
  }
  // on a phone the board scrolls sideways inside its frame: open it on the cursor
  function centreCursor(){
    var box = $('bBoard'), bd = box.firstElementChild; if(!bd || box.scrollWidth <= box.clientWidth) return;
    box.scrollLeft = 92 + (bd.scrollWidth - 92) * ((state.time - LO) / (HI - LO)) - box.clientWidth / 2;
  }

  function paintTime(){
    var t = state.time, bd = $('bBoard').firstElementChild;
    $('bTime').value = t; $('bTimeOut').textContent = clock(t);
    if(bd){
      bd.style.setProperty('--cur', ((t - LO) / (HI - LO)).toFixed(4));
      Array.prototype.forEach.call(bd.querySelectorAll('.bd-blk'), function(el){
        var b = state.blocks[+el.getAttribute('data-i')];
        el.classList.toggle('is-live', b.a <= t && t < b.b);
      });
      Array.prototype.forEach.call(bd.querySelectorAll('.bd-bars i'), function(el){
        var q = +el.getAttribute('data-t'); el.classList.toggle('is-now', q <= t && t < q + 15);
      });
    }
    var used = {}, running = 0, next = 0;
    state.blocks.forEach(function(b){
      if(b.a <= t && t < b.b){ used[b.room] = 1; running++; }
      [b.a, b.b].forEach(function(x){ if(x > t && (!next || x < next)) next = x; });
    });
    var free = ROOM_LIST.filter(function(r){ return !used[r]; });
    var dayNote = GROUPS.filter(function(g){ return DAYNOTES[g][state.date]; });
    $('bSummary').innerHTML =
      '<div class="kpi"><span>Time</span><b>' + esc(clock(t)) + '</b><em>' + esc(shortDate(state.date)) + '</em></div>' +
      '<div class="kpi"><span>Running</span><b>' + running + '</b><em>' + (running === 1 ? 'class' : 'classes') + '</em></div>' +
      '<div class="kpi"><span>In use</span><b>' + (ROOM_LIST.length - free.length) + '</b><em>of ' + ROOM_LIST.length + ' rooms</em></div>' +
      '<div class="kpi is-free"><span>Free</span><b>' + free.length + '</b><em>' + (free.length === 1 ? 'room' : 'rooms') + '</em></div>' +
      '<div class="kpi"><span>Next change</span><b>' + (next ? esc(clock(next)) : 'none') + '</b><em>' + (next ? 'in ' + minutesText(next - t) : 'for the day') + '</em></div>' +
      (dayNote.length ? '<div class="kpi is-note"><span>Note</span><b>' + esc(dayNote.length === GROUPS.length ? 'Holiday' : dayNote.length + ' programmes') + '</b><em>' + esc(dayNote.length === GROUPS.length ? 'for everyone' : dayNote.map(function(g){ return groupShort(g) + ': ' + DAYNOTES[g][state.date]; }).join(' · ')) + '</em></div>' : '');
    var untilOf = {};
    state.blocks.forEach(function(b){ if(b.a > t && (!untilOf[b.room] || b.a < untilOf[b.room])) untilOf[b.room] = b.a; });
    free.sort(function(x, y){ return (untilOf[y] || 9999) - (untilOf[x] || 9999) || natural(x, y); });
    $('bFree').innerHTML = '<div class="mt-sec-h">Free at ' + esc(clock(t)) + ' <span>' + free.length + ' of ' + ROOM_LIST.length + ' rooms, longest free first</span></div>' + (free.length ? free.map(function(r){
      return '<button class="mt-room' + (untilOf[r] ? '' : ' is-all') + '" type="button" data-room="' + esc(r) + '"><b>' + esc(r) + '</b><i>' + (untilOf[r] ? 'till ' + esc(clock(untilOf[r])) : 'all day') + '</i></button>';
    }).join('') : '<span class="mt-none">Every known room is in use at this time.</span>');
  }
  function setTime(t){
    t = Math.max(LO, Math.min(HI, Math.round(t / 5) * 5));
    if(t === state.time) return;
    state.time = t; paintTime();
  }
  function nowTime(){
    var m = IMT.istMinutes();
    if(state.date !== today){ state.date = DATES[today] ? today : state.date; state.week = mondayOf(state.date); }
    state.time = Math.max(LO, Math.min(HI, Math.round(m / 5) * 5));
    renderBoard();
  }
  function flashRoom(room){
    var row = $('bBoard').querySelector('.bd-row[data-room="' + room.replace(/"/g, '\\"') + '"]');
    if(!row) return;
    row.scrollIntoView({ block: 'center', behavior: 'smooth' });
    row.classList.add('is-flash'); setTimeout(function(){ row.classList.remove('is-flash'); }, 1600);
  }
  function showDetail(i){
    var b = state.blocks[i], el = $('bDetail');
    state.sel = i;
    Array.prototype.forEach.call($('bBoard').querySelectorAll('.bd-blk'), function(x){ x.classList.toggle('is-sel', +x.getAttribute('data-i') === i); });
    el.hidden = false;
    el.innerHTML = '<div class="mt-detail-in mt-hue" style="--h:' + GROUP_HUE[b.g] + '"><div><div class="mt-detail-title">' + esc(b.name) + ' <span>session ' + b.n + '</span></div>' +
      '<div class="mt-detail-when">' + esc(dateLabel(b.date)) + ' · ' + esc(range(b.a, b.b)) + ' · room ' + esc(b.room) + '</div>' +
      '<div class="mt-meta">' + tag(groupLabel(b.g)) + (b.grp ? tag('Group ' + b.grp + ' (all sections)') : b.units.map(function(u){ return tag(b.word + ' ' + u); }).join('')) + (b.elective ? tag('Elective') : '') + '</div></div>' +
      '<div class="mt-detail-actions">' + (b.units.length ? '<button class="mt-btn" type="button" data-act="section">Open this section\'s week</button>' : '') + '<button class="mt-btn" type="button" data-act="close">Close</button></div></div>';
  }
  $('bBoard').addEventListener('click', function(e){
    var blk = e.target.closest('.bd-blk');
    if(blk){ showDetail(+blk.getAttribute('data-i')); return; }
    var bar = e.target.closest('.bd-bars i');
    if(bar){ setTime(+bar.getAttribute('data-t') + 7); return; }
    var track = e.target.closest('.bd-track');
    if(track && e.pointerType !== 'mouse') {
      var r = track.getBoundingClientRect(); setTime(LO + (e.clientX - r.left) / r.width * (HI - LO));
    }
  });
  // with a mouse the cursor can also be dragged
  var dragging = false;
  function timeAt(e){ var tr = $('bBoard').querySelector('.bd-track'); if(!tr) return; var r = tr.getBoundingClientRect(); setTime(LO + (e.clientX - r.left) / r.width * (HI - LO)); }
  $('bBoard').addEventListener('pointerdown', function(e){
    if(e.pointerType !== 'mouse' || e.target.closest('.bd-blk') || !e.target.closest('.bd-track, .bd-axis')) return;
    dragging = true; timeAt(e);
  });
  window.addEventListener('pointermove', function(e){ if(dragging) timeAt(e); });
  window.addEventListener('pointerup', function(){ dragging = false; });
  // the arrow keys move the time and N jumps to now, while the board is on show and nothing is being typed
  document.addEventListener('keydown', function(e){
    if(app.hidden || $('panel-board').hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target, typing = t && (/^(input|select|textarea)$/i.test(t.tagName) && t.type !== 'range');
    if(typing) return;
    if(e.key === 'ArrowRight' || e.key === 'ArrowLeft'){ e.preventDefault(); setTime(state.time + (e.key === 'ArrowRight' ? 15 : -15)); }
    else if(e.key === 'n' || e.key === 'N'){ e.preventDefault(); nowTime(); }
  });
  $('bDetail').addEventListener('click', function(e){
    var act = e.target.closest('[data-act]'); if(!act) return;
    if(act.getAttribute('data-act') === 'close'){ $('bDetail').hidden = true; state.sel = -1; Array.prototype.forEach.call($('bBoard').querySelectorAll('.is-sel'), function(x){ x.classList.remove('is-sel'); }); return; }
    var b = state.blocks[state.sel]; if(!b) return;
    IMT.track('master_action', null, { tool: 'master', result: 'open_section' });
    $('sRoll').value = ''; $('sGroup').value = b.g; fillUnits(); $('sUnit').value = b.units[0];
    state.sIdx[b.g] = WEEKLY[b.g].map(function(w){ return w.start; }).indexOf(mondayOf(b.date));
    switchTab('sections');
  });
  $('bFree').addEventListener('click', function(e){ var r = e.target.closest('[data-room]'); if(r) flashRoom(r.getAttribute('data-room')); });
  $('bLegend').addEventListener('click', function(e){
    var k = e.target.closest('[data-g]'); if(!k) return;
    state.focus = state.focus === k.getAttribute('data-g') ? '' : k.getAttribute('data-g'); renderBoard();
  });
  $('bDays').addEventListener('click', function(e){ var d = e.target.closest('[data-d]'); if(d && !d.disabled){ state.date = d.getAttribute('data-d'); renderBoard(); } });
  $('bTime').addEventListener('input', function(){ setTime(+this.value); });
  $('bNow').addEventListener('click', nowTime);

  // hours booked, room by room and day by day, for the week on show
  function renderLoad(){
    var dates = [0, 1, 2, 3, 4, 5, 6].map(function(i){ return IMT.addDays(state.week, i); }).filter(function(d){ return DATES[d]; });
    var cell = {}, total = {}, seen = {};
    EVENTS.forEach(function(e){
      if(!e.room || dates.indexOf(e.date) < 0) return;
      var k = e.date + '|' + e.start + '|' + e.end + '|' + e.room;      // one class in a room at a time: a combined lecture counts once
      if(seen[k]) return; seen[k] = 1;
      cell[e.room + '|' + e.date] = (cell[e.room + '|' + e.date] || 0) + (e.end - e.start);
      total[e.room] = (total[e.room] || 0) + (e.end - e.start);
    });
    var rooms = ROOM_LIST.slice().sort(function(a, b){ return (total[b] || 0) - (total[a] || 0) || natural(a, b); });
    var max = Math.max.apply(null, Object.keys(cell).map(function(k){ return cell[k]; }).concat([1]));
    var idle = rooms.filter(function(r){ return !total[r]; });
    var html = '<div class="mt-table-wrap"><table class="mt-table"><thead><tr><th>Room</th>' + dates.map(function(d){ return '<th>' + esc(shortDate(d)) + '</th>'; }).join('') + '<th>Total</th></tr></thead><tbody>';
    rooms.filter(function(r){ return total[r]; }).forEach(function(r){
      html += '<tr><th scope="row">' + esc(r) + '</th>' + dates.map(function(d){
        var m = cell[r + '|' + d] || 0, level = m ? Math.min(4, 1 + Math.floor(m / max * 3.99)) : 0;
        return '<td class="mt-heat mt-h' + level + '">' + (m ? (m / 60).toFixed(1).replace(/\.0$/, '') + ' h' : '·') + '</td>';
      }).join('') + '<td class="mt-total">' + (total[r] / 60).toFixed(1).replace(/\.0$/, '') + ' h</td></tr>';
    });
    html += '</tbody></table></div>' + (idle.length ? '<p class="mt-fine">Not used this week: ' + idle.map(esc).join(', ') + '.</p>' : '');
    $('bLoad').innerHTML = html;
  }

  // ======================================================================
  // 2. WEEK BY SECTION (or student)
  // ======================================================================
  var sGroup = $('sGroup'), sUnit = $('sUnit'), sRoll = $('sRoll');
  function fillUnits(){
    var g = sGroup.value, wk = WEEKLY[g][WEEKLY[g].length - 1], prev = sUnit.value;
    $('sUnitLabel').textContent = unitWord(wk);
    sUnit.innerHTML = UNITS[g].map(function(u){ return option(u, u, u === prev); }).join('');
  }
  function sWeeks(g){ return WEEKLY[g]; }
  function sIndex(g){
    if(state.sIdx[g] == null || state.sIdx[g] < 0){
      var ws = sWeeks(g), at = ws.map(function(w){ return w.start; }).indexOf(state.week);
      state.sIdx[g] = at >= 0 ? at : ws.length - 1;
    }
    return state.sIdx[g];
  }
  function gridItems(week, g, unit, view){
    // what shows in the grid: classes, group sessions and the other entries, each with its day and slot
    var items = [];
    var add = function(x){ items.push({ d: x.d, s: x.s, code: x.c, name: week.courses[x.c] || x.c, n: x.n, room: x.room || '', grp: x.grp || '', elective: (week.electives || []).indexOf(x.c) >= 0 }); };
    if(view){
      view.classes.concat(view.groups).forEach(add);
      view.specials.forEach(function(sp){ for(var k = 0; k < sp.span; k++) items.push({ d: sp.d, s: sp.s + k, text: sp.text, cont: k > 0 }); });
    } else {
      week.sessions.forEach(function(x){ if(x.grp || unitOf(week, x) === unit) add(x); });
      week.specials.forEach(function(sp){
        if(sp.rows.length && sp.rows.indexOf(unit) < 0) return;
        for(var k = 0; k < sp.span; k++) items.push({ d: sp.d, s: sp.s + k, text: sp.text, cont: k > 0 });
      });
    }
    return items;
  }
  function renderSections(){
    var g = sGroup.value, roll = IMT.normRoll(sRoll.value), student = null, view = null, banner = '';
    sUnit.disabled = !!roll; sGroup.disabled = !!roll;
    if(roll){
      student = IMT.student(roll);
      if(!student.groupKey || !WEEKLY[student.groupKey]){
        $('sWeek').textContent = ''; $('sPrev').disabled = $('sNext').disabled = true;
        $('sOut').innerHTML = '<div class="empty">That roll number is not one we have a schedule for.</div>'; return;
      }
      g = student.groupKey;
    }
    var ws = sWeeks(g), i = Math.max(0, Math.min(ws.length - 1, sIndex(g))), week = ws[i];
    $('sWeek').textContent = weekLabel(week.start); $('sPrev').disabled = i <= 0; $('sNext').disabled = i >= ws.length - 1;
    if(student){ view = IMT.buildView(week, student); if(view.banner) banner = '<div class="view-banner">' + esc(view.banner) + '</div>'; }
    var items = gridItems(week, g, sUnit.value, view), byCell = {}, used = {};
    items.forEach(function(it){ (byCell[it.d + ':' + it.s] = byCell[it.d + ':' + it.s] || []).push(it); if(it.code) used[it.code] = it.name; });
    var head = '<div class="gr-corner"></div>' + week.days.map(function(d, di){
      var note = d.note || '', has = items.some(function(it){ return it.d === di; });
      return '<div class="gr-day' + (note && !has ? ' is-off' : '') + (d.date === today ? ' is-today' : '') + '"><b>' + DAYS[di] + '</b><span>' + (+d.date.slice(8)) + ' ' + MONTHS[+d.date.slice(5, 7)] + '</span>' + (note ? '<em>' + esc(note) + '</em>' : '') + '</div>';
    }).join('');
    var body = week.slots.map(function(sl, si){
      return '<div class="gr-time"><b>' + esc(clock(mins(sl[0])).replace(' ', '')) + '</b><span>' + esc(clock(mins(sl[1])).replace(' ', '')) + '</span></div>' + week.days.map(function(d, di){
        var list = byCell[di + ':' + si] || [], off = d.note && !items.some(function(it){ return it.d === di; });
        return '<div class="gr-cell' + (off ? ' is-off' : '') + '">' + list.map(function(it){
          if(it.text) return '<div class="gr-blk gr-note' + (it.cont ? ' is-cont' : '') + '" title="' + esc(it.text) + '">' + esc(it.text) + '</div>';
          return '<div class="gr-blk mt-hue' + (it.grp ? ' is-group' : '') + '" style="--h:' + courseHue(it.code) + '" title="' + esc(it.name + (it.grp ? ' · Group ' + it.grp : '') + ' · session ' + it.n + (it.room ? ' · room ' + it.room : '')) + '"><b>' + esc(it.code) + (it.grp ? ' · G' + it.grp : '') + '</b><span>' + (it.elective ? 'Elective · ' : '') + 'S' + it.n + (it.room ? ' · ' + esc(it.room) : '') + '</span></div>';
        }).join('') + '</div>';
      }).join('');
    }).join('');
    var title = student ? '<div class="mt-who"><b>' + esc(student.name || 'Roll ' + student.roll) + '</b><span>' + esc([student.programme, student.batchLabel, student.section ? 'Section ' + student.section : (student.track ? 'Track ' + student.track : '')].filter(Boolean).join(' · ')) + '</span></div>' :
      '<div class="mt-who"><b>' + esc(groupLabel(g)) + ' · ' + esc(unitWord(week) + ' ' + sUnit.value) + '</b><span>Week ' + (week.weekNumber || '') + ' · ' + esc(weekLabel(week.start)) + '</span></div>';
    var keys = Object.keys(used).sort(natural).map(function(c){ return '<span class="mt-key-pill mt-hue" style="--h:' + courseHue(c) + '"><i></i><b>' + esc(c) + '</b> ' + esc(used[c]) + '</span>'; }).join('');
    var empty = items.length ? '' : '<div class="empty">No classes in this week.</div>';
    $('sOut').innerHTML = title + banner + '<div class="gr-scroll"><div class="gr" style="--days:7">' + head + body + '</div></div>' + empty + (keys ? '<div class="mt-keys">' + keys + '</div>' : '');
  }
  function sStep(n){
    var roll = IMT.normRoll(sRoll.value), g = roll && IMT.student(roll).groupKey ? IMT.student(roll).groupKey : sGroup.value;
    state.sIdx[g] = Math.max(0, Math.min(sWeeks(g).length - 1, sIndex(g) + n)); renderSections();
  }

  // ======================================================================
  // 3. FIND A TIME
  // ======================================================================
  function renderPicks(){
    $('cPicks').innerHTML = GROUPS.map(function(g){
      var wk = WEEKLY[g][WEEKLY[g].length - 1];
      return '<fieldset class="mt-group mt-hue" style="--h:' + GROUP_HUE[g] + '"><legend>' + esc(groupLabel(g)) + '</legend>' + UNITS[g].map(function(u){
        var k = g + '|' + u;
        return '<label class="mt-check"><input type="checkbox" data-k="' + esc(k) + '"' + (state.picked[k] ? ' checked' : '') + '> <span>' + esc(unitWord(wk) + ' ' + u) + '</span></label>';
      }).join('') + '</fieldset>';
    }).join('');
  }
  function busyFor(g, u, d){
    var out = [];
    EVENTS.forEach(function(e){ if(e.g === g && e.date === d && (e.unit === u || e.grp)) out.push([e.start, e.end, e.name]); });
    NOTES.forEach(function(n){ if(n.g === g && n.date === d && (!n.units.length || n.units.indexOf(u) >= 0)) out.push([n.start, n.end, n.text]); });
    return out;
  }
  function stripBlocks(list, lo, hi, hue){
    return list.map(function(b){
      var a = Math.max(b[0], lo), z = Math.min(b[1], hi); if(z <= a) return '';
      return '<span class="tl-blk mt-hue" style="--h:' + hue + ';left:' + ((a - lo) / (hi - lo) * 100) + '%;width:' + ((z - a) / (hi - lo) * 100) + '%" title="' + esc(b[2] + ' · ' + range(b[0], b[1])) + '"></span>';
    }).join('');
  }
  function renderFind(){
    weekNav('c');
    var keys = Object.keys(state.picked).filter(function(k){ return state.picked[k]; }), out = $('cOut'), best = $('cBest');
    if(!keys.length){ best.innerHTML = ''; out.innerHTML = '<div class="empty">Tick the sections that must all be free.</div>'; return; }
    var need = +$('cLen').value, lo = mins($('cWinA').value || '8:00'), hi = mins($('cWinB').value || '20:30');
    if(!(hi > lo)){ best.innerHTML = ''; out.innerHTML = '<div class="empty">The day must end after it starts.</div>'; return; }
    var all = [], html = '';
    [0, 1, 2, 3, 4, 5, 6].map(function(i){ return IMT.addDays(state.week, i); }).filter(function(d){ return DATES[d]; }).forEach(function(d){
      var lanes = '', busyAll = [], away = [];
      keys.forEach(function(k){
        var g = k.split('|')[0], u = k.slice(g.length + 1), b = busyFor(g, u, d);
        if(DAYNOTES[g] && DAYNOTES[g][d] && !EVENTS.some(function(e){ return e.g === g && e.date === d; })){ var line = groupLabel(g) + ': ' + DAYNOTES[g][d]; if(away.indexOf(line) < 0) away.push(line); }
        busyAll = busyAll.concat(b);
        lanes += '<div class="tl-lane"><span class="tl-lbl" title="' + esc(groupLabel(g) + ' · ' + u) + '">' + esc(groupShort(g) + ' · ' + u) + '</span><div class="tl-track">' + stripBlocks(b, lo, hi, GROUP_HUE[g]) + '</div></div>';
      });
      if(away.length){ html += '<div class="mt-daycard"><div class="day-title">' + esc(dateLabel(d)) + '</div><div class="day-note">' + esc(away.join(' · ')) + '</div></div>'; return; }
      busyAll.sort(function(x, y){ return x[0] - y[0]; });
      var free = [], at = lo;
      busyAll.forEach(function(iv){ if(iv[0] - at >= need) free.push([at, Math.min(iv[0], hi)]); at = Math.max(at, iv[1]); });
      if(hi - at >= need) free.push([at, hi]);
      free = free.filter(function(f){ return f[1] - f[0] >= need; });
      free.forEach(function(f){ all.push({ d: d, a: f[0], b: f[1] }); });
      var strip = free.map(function(f){
        return '<button class="tl-free" type="button" data-d="' + d + '" data-a="' + f[0] + '" data-b="' + f[1] + '" style="left:' + ((f[0] - lo) / (hi - lo) * 100) + '%;width:' + ((f[1] - f[0]) / (hi - lo) * 100) + '%" title="Copy ' + esc(range(f[0], f[1])) + '">' + esc(range(f[0], f[1])) + '</button>';
      }).join('');
      var ticks = ''; for(var m = Math.ceil(lo / 60) * 60; m <= hi; m += 60) ticks += '<span style="left:' + ((m - lo) / (hi - lo) * 100) + '%">' + hourTick(m) + '</span>';
      html += '<div class="mt-daycard"><div class="day-title">' + esc(dateLabel(d)) + '</div><div class="tl"><div class="tl-lane tl-axis"><span class="tl-lbl"></span><div class="tl-track tl-ticks">' + ticks + '</div></div>' + lanes +
        '<div class="tl-lane tl-all"><span class="tl-lbl">All free</span><div class="tl-track">' + (strip || '<em class="tl-none">none of that length</em>') + '</div></div></div></div>';
    });
    all.sort(function(x, y){ return (y.b - y.a) - (x.b - x.a) || (x.d < y.d ? -1 : 1) || x.a - y.a; });
    best.innerHTML = all.length ? '<div class="mt-panel mt-bestcard"><div class="mt-sec-h">Best windows <span>the longest time all of them are free</span></div><div class="mt-best">' + all.slice(0, 6).map(function(w){
      return '<div class="mt-bw"><span class="mt-bwd">' + esc(shortDate(w.d)) + '</span><span class="mt-bwt">' + esc(range(w.a, w.b)) + '</span><span class="mt-bwl">' + esc(minutesText(w.b - w.a)) + '</span>' +
        '<button class="mt-btn tl-copy" type="button" data-d="' + w.d + '" data-a="' + w.a + '" data-b="' + w.b + '">Copy</button></div>';
    }).join('') + '</div></div>' : '<div class="mt-panel mt-bestcard"><span class="mt-none">No time of that length is free for all of them this week.</span></div>';
    out.innerHTML = html || '<div class="empty">No schedule data this week.</div>';
  }
  function copyWindow(el){
    var d = el.getAttribute('data-d'), a = +el.getAttribute('data-a'), b = +el.getAttribute('data-b');
    var picks = Object.keys(state.picked).filter(function(k){ return state.picked[k]; }).map(function(k){ var g = k.split('|')[0]; return groupLabel(g) + ' ' + k.slice(g.length + 1); });
    IMT.track('master_action', null, { tool: 'master', result: 'copy_window' });
    copyText(dateLabel(d) + ', ' + range(a, b) + ' (free for ' + picks.join(', ') + ')', 'Copied: ' + shortDate(d) + ', ' + range(a, b));
  }
  $('cPicks').addEventListener('change', function(e){ var k = e.target.getAttribute('data-k'); if(k){ state.picked[k] = e.target.checked; renderFind(); } });
  ['cLen', 'cWinA', 'cWinB'].forEach(function(id){ $(id).addEventListener('input', renderFind); });
  $('cOut').addEventListener('click', function(e){ var f = e.target.closest('.tl-free'); if(f) copyWindow(f); });
  $('cBest').addEventListener('click', function(e){ var f = e.target.closest('.tl-copy'); if(f) copyWindow(f); });

  // ======================================================================
  // 4. SEARCH
  // ======================================================================
  var qIn = $('qIn'), qGroup = $('qGroup'), qScope = $('qScope'), lastRows = [];
  function renderSearch(){
    var scopeVal = qScope.value;
    qScope.innerHTML = option('week', 'The week on show (' + weekLabel(state.week) + ')', scopeVal !== 'all') + option('all', 'Every week loaded', scopeVal === 'all');
    var scope = qScope.value, tokens = qIn.value.trim().toLowerCase().split(/\s+/).filter(Boolean), roll = '';
    tokens = tokens.filter(function(t){ if(/^\d{9}$/.test(t)){ roll = t; return false; } return true; });
    var roomKeys = {}; ROOM_LIST.forEach(function(r){ roomKeys[norm(r)] = r; });
    var rows = [], note = '', student = null;
    var inScope = function(date){ return scope === 'all' || mondayOf(date) === state.week; };
    if(roll){
      student = IMT.student(roll);
      if(!student.groupKey || !WEEKLY[student.groupKey]){ $('qCount').textContent = ''; $('qOut').innerHTML = '<div class="empty">That roll number is not one we have a schedule for.</div>'; lastRows = []; return; }
      WEEKLY[student.groupKey].forEach(function(week){
        var view = IMT.buildView(week, student);
        view.classes.concat(view.groups).forEach(function(x){ rows.push(fromSession(student.groupKey, week, x)); });
        view.specials.forEach(function(sp){ rows.push(fromSpecial(student.groupKey, week, sp)); });
      });
      rows = rows.filter(function(e){ return inScope(e.date); });
      note = '<div class="mt-who"><b>' + esc(student.name || 'Roll ' + student.roll) + '</b><span>' + esc([student.programme, student.batchLabel, student.section ? 'Section ' + student.section : (student.track ? 'Track ' + student.track : '')].filter(Boolean).join(' · ')) + '</span></div>';
    } else {
      rows = EVENTS.concat(NOTES).filter(function(e){ return inScope(e.date) && (!qGroup.value || e.g === qGroup.value); });
    }
    // "group 3" is one word: the group, not the 3rd of the month
    tokens = tokens.join(' ').replace(/\bgroups?\s+([a-z0-9]+)/g, 'group$1').split(' ').filter(Boolean);
    // each word has to match something about the class
    var iso = {}; tokens.forEach(function(t){
      if(t === 'today') iso[t] = today; else if(t === 'tomorrow') iso[t] = IMT.addDays(today, 1);
    });
    rows = rows.filter(function(e){
      var dn = dow(e.date), text = (e.name || e.text || '').toLowerCase(), code = (e.code || '').toLowerCase();
      return tokens.every(function(t){
        if(iso[t]) return e.date === iso[t];
        var gm = /^group([a-z0-9]+)$/.exec(t) || /^g(\d+)$/.exec(t);
        if(gm) return !!e.grp && e.grp.toLowerCase() === gm[1];
        if(t === 'group' || t === 'groups') return !!e.grp;
        if(t.length >= 3 && DAYFULL[dn].indexOf(t) === 0) return true;
        if(t.length >= 3 && DAYFULL.some(function(f){ return f.indexOf(t) === 0; })) return false;
        if(roomKeys[norm(t)] && norm(e.room || '') === norm(t)) return true;
        if(code === t) return true;
        // one or two letters are a section, a track or a date, never a piece of a course name
        if(t.length === 1 && ((e.unit || '').toLowerCase() === t || (e.units && e.units.some(function(u){ return u.toLowerCase() === t; })))) return true;
        if(/^\d{1,2}$/.test(t)) return e.date.slice(8) === (t.length < 2 ? '0' + t : t);
        if(t.length < 3) return false;
        if(text.indexOf(t) >= 0) return true;
        if(groupLabel(e.g).toLowerCase().indexOf(t) >= 0) return true;
        if(MONTHS.indexOf(t.charAt(0).toUpperCase() + t.slice(1, 3)) > 0 && shortDate(e.date).toLowerCase().indexOf(t.slice(0, 3)) >= 0) return true;
        return false;
      });
    });
    rows = sorted(rows); lastRows = rows;
    var classes = rows.filter(function(e){ return !e.text; }).length;
    $('qCount').textContent = classes + (classes === 1 ? ' class' : ' classes') + (rows.length > classes ? ' and ' + (rows.length - classes) + ' other ' + (rows.length - classes === 1 ? 'entry' : 'entries') : '');
    $('qCopy').disabled = $('qCsv').disabled = !rows.length;
    var byDate = {}, html = note;
    rows.forEach(function(e){ (byDate[e.date] = byDate[e.date] || []).push(e); });
    var dates = Object.keys(byDate).sort();
    if(dates.length) html += '<div class="mt-rowhead"><span>Time</span><span>Class</span><span>Programme</span><span>Section</span><span>Room</span></div>';
    dates.forEach(function(day){
      var notes = (student ? [student.groupKey] : (qGroup.value ? [qGroup.value] : GROUPS)).filter(function(g){ return DAYNOTES[g] && DAYNOTES[g][day]; });
      html += '<div class="day-group"><div class="day-title">' + esc(dateLabel(day)) + '</div>' +
        (notes.length && !tokens.length ? '<div class="day-note">' + esc(notes.map(function(g){ return (qGroup.value || student ? '' : groupLabel(g) + ': ') + DAYNOTES[g][day]; }).join(' · ')) + '</div>' : '') +
        '<div class="mt-rows">' + byDate[day].map(resultRow).join('') + '</div></div>';
    });
    $('qOut').innerHTML = html || '<div class="empty">Nothing matches.</div>';
  }
  function resultRow(e){
    var hue = e.text ? 0 : GROUP_HUE[e.g];
    var unit = e.text ? (e.units.length ? e.word + (e.units.length > 1 ? 's ' : ' ') + e.units.join(', ') : '') : who(e);
    return '<div class="mt-row mt-hue" style="--h:' + hue + '"><div class="mt-rt"><b>' + esc(range(e.start, e.end).split(' - ')[0]) + '</b><span>to ' + esc(clock(e.end)) + '</span></div>' +
      '<div class="mt-rc"><div class="mt-title">' + (e.text ? esc(e.text) : esc(e.name) + ' <span class="mt-session">session ' + e.n + (e.elective ? ' · Elective' : '') + '</span>') + '</div></div>' +
      '<div class="mt-rp">' + esc(groupLabel(e.g)) + '</div><div class="mt-ru">' + esc(unit) + '</div><div class="mt-rr">' + (e.room ? 'Room ' + esc(e.room) : '') + '</div></div>';
  }
  function rowsAsText(rows){
    return rows.map(function(e){
      return dateLabel(e.date) + ', ' + range(e.start, e.end) + ': ' + (e.text || e.name + ' (session ' + e.n + ')') + ' · ' + groupLabel(e.g) +
        (who(e) ? ' · ' + who(e) : '') + (e.room ? ' · room ' + e.room : '');
    }).join('\n');
  }
  function rowsAsCsv(rows){
    var q = function(v){ v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    return ['Date,Day,Start,End,Programme,Section or track,Group,Course,Session,Room'].concat(rows.map(function(e){
      return [e.date, DAYS[dow(e.date)], clock(e.start), clock(e.end), groupLabel(e.g), e.text ? (e.units || []).join(' + ') : e.unit, e.grp || '', e.text || e.name, e.n || '', e.room || ''].map(q).join(',');
    })).join('\r\n');
  }
  [qIn, qGroup, qScope].forEach(function(el){ el.addEventListener('input', renderSearch); });
  $('qCopy').addEventListener('click', function(){ IMT.track('master_action', null, { tool: 'master', result: 'copy_list' }); copyText(rowsAsText(lastRows), 'Copied ' + lastRows.length + ' lines'); });
  $('qCsv').addEventListener('click', function(){
    IMT.track('master_action', null, { tool: 'master', result: 'csv' });
    var blob = new Blob(['﻿' + rowsAsCsv(lastRows)], { type: 'text/csv;charset=utf-8' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'master-timetable.csv'; document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); document.body.removeChild(a); }, 500);
  });

  // ======================================================================
  // 5. CHECKS
  // ======================================================================
  var CHECKS = null;
  function runChecks(){
    var byRoom = {}, clashes = [], noRoom = EVENTS.filter(function(e){ return !e.room; });
    EVENTS.forEach(function(e){ if(e.room) (byRoom[e.date + '|' + e.room] = byRoom[e.date + '|' + e.room] || []).push(e); });
    Object.keys(byRoom).forEach(function(k){
      var L = byRoom[k];
      for(var i = 0; i < L.length; i++) for(var j = i + 1; j < L.length; j++){
        var p = L[i], q = L[j];
        if(!(p.start < q.end && q.start < p.end)) continue;
        if(p.g === q.g && p.name === q.name && p.n === q.n && p.grp === q.grp) continue;     // one class for several sections
        clashes.push({ p: p, q: q, date: p.date, room: p.room, from: Math.max(p.start, q.start), to: Math.min(p.end, q.end) });
      }
    });
    clashes.sort(function(a, b){ return (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) || a.from - b.from || natural(a.room, b.room); });
    // a section with two classes at once: only where a section has its own row, and electives and group sessions are not counted
    var overlaps = [], by = {};
    EVENTS.forEach(function(e){ if(e.unit && !e.elective && e.week.mode !== 'course') (by[e.g + '|' + e.unit + '|' + e.date] = by[e.g + '|' + e.unit + '|' + e.date] || []).push(e); });
    Object.keys(by).forEach(function(k){
      var L = by[k];
      for(var i = 0; i < L.length; i++) for(var j = i + 1; j < L.length; j++){
        if(L[i].start < L[j].end && L[j].start < L[i].end && L[i].name !== L[j].name) overlaps.push({ p: L[i], q: L[j], date: L[i].date });
      }
    });
    overlaps.sort(function(a, b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    return { clashes: clashes, noRoom: noRoom, overlaps: overlaps };
  }
  function clashLine(e){ return esc(e.name) + ' <span class="mt-session">' + esc(groupLabel(e.g)) + (who(e) ? ' · ' + esc(who(e)) : '') + ' · ' + esc(range(e.start, e.end)) + '</span>'; }
  function renderChecks(){
    var c = CHECKS, html = '';
    html += '<div class="mt-panel mt-check-card ' + (c.clashes.length ? 'is-warn' : 'is-ok') + '"><div class="mt-check-head"><b>' + (c.clashes.length ? c.clashes.length : 'No') + ' possible room ' + (c.clashes.length === 1 ? 'clash' : 'clashes') +
      '</b><span>two different classes in one room at overlapping times</span></div>';
    c.clashes.forEach(function(k, i){
      html += '<div class="mt-clash"><div class="mt-clash-when"><b>' + esc(shortDate(k.date)) + '</b> ' + esc(range(k.from, k.to)) + ' · room <b>' + esc(k.room) + '</b></div>' +
        '<div class="mt-clash-two"><div class="mt-hue" style="--h:' + GROUP_HUE[k.p.g] + '">' + clashLine(k.p) + '</div><div class="mt-hue" style="--h:' + GROUP_HUE[k.q.g] + '">' + clashLine(k.q) + '</div></div>' +
        '<button class="mt-btn mt-clash-go" type="button" data-i="' + i + '">See on the board</button></div>';
    });
    html += '</div>';
    html += '<div class="mt-panel mt-check-card ' + (c.noRoom.length ? 'is-warn' : 'is-ok') + '"><div class="mt-check-head"><b>' + (c.noRoom.length || 'No') + ' ' + (c.noRoom.length === 1 ? 'class' : 'classes') + ' without a room</b><span>a class with no room in its entry</span></div></div>';
    html += '<div class="mt-panel mt-check-card ' + (c.overlaps.length ? 'is-warn' : 'is-ok') + '"><div class="mt-check-head"><b>' + (c.overlaps.length || 'No') + ' section ' + (c.overlaps.length === 1 ? 'overlap' : 'overlaps') + '</b><span>a section with two different classes at once (programmes laid out by section only; electives and group sessions are not counted)</span></div>';
    c.overlaps.slice(0, 60).forEach(function(k){
      html += '<div class="mt-clash"><div class="mt-clash-when"><b>' + esc(shortDate(k.date)) + '</b> · ' + esc(groupLabel(k.p.g)) + ' · ' + esc(k.p.word + ' ' + k.p.unit) + '</div><div class="mt-clash-two"><div class="mt-hue" style="--h:' + GROUP_HUE[k.p.g] + '">' + esc(k.p.name) + ' <span class="mt-session">' + esc(range(k.p.start, k.p.end)) + '</span></div><div class="mt-hue" style="--h:' + GROUP_HUE[k.q.g] + '">' + esc(k.q.name) + ' <span class="mt-session">' + esc(range(k.q.start, k.q.end)) + '</span></div></div></div>';
    });
    html += '</div>';
    $('kOut').innerHTML = html;
    var n = c.clashes.length + c.noRoom.length + c.overlaps.length;
    $('checksBadge').textContent = n; $('checksBadge').hidden = !n;
  }
  $('kOut').addEventListener('click', function(e){
    var go = e.target.closest('.mt-clash-go'); if(!go) return;
    var k = CHECKS.clashes[+go.getAttribute('data-i')];
    IMT.track('master_action', null, { tool: 'master', result: 'see_on_board' });
    state.date = k.date; state.week = mondayOf(k.date); state.time = Math.round(k.from / 5) * 5;
    switchTab('board'); renderBoard(); flashRoom(k.room);
  });

  // ======================================================================
  // tabs and start
  // ======================================================================
  var TABS = ['board', 'sections', 'find', 'search', 'checks'];
  function switchTab(t, quiet){
    TABS.forEach(function(o){ $('tab-' + o).setAttribute('aria-selected', o === t ? 'true' : 'false'); $('panel-' + o).hidden = o !== t; });
    if(t === 'sections') renderSections();
    if(!quiet){
      IMT.track('master_view', null, { tool: 'master', result: t });
      try { window.history.replaceState(null, '', '#' + t); } catch(e){}
    }
  }

  function start(){
    IMT.track('tool_open', null, { tool: 'master', status: 'shown' });
    var first = DATE_LIST[0], last = DATE_LIST[DATE_LIST.length - 1];
    state.date = (today >= first && today <= last) ? today : last;
    state.week = mondayOf(state.date);
    var nowM = IMT.istMinutes();
    state.time = (state.date === today && nowM >= LO && nowM <= HI) ? Math.round(nowM / 5) * 5 : 600;
    $('dataNote').textContent = GROUPS.length + ' programmes · ' + shortDate(first) + ' to ' + shortDate(last) + ' · ' + EVENTS.length + ' classes · ' + ROOM_LIST.length + ' rooms';

    sGroup.innerHTML = GROUPS.map(function(g){ return option(g, groupLabel(g)); }).join(''); fillUnits();
    qGroup.innerHTML = option('', 'All programmes') + GROUPS.map(function(g){ return option(g, groupLabel(g)); }).join('');
    renderPicks(); CHECKS = runChecks(); renderChecks();
    renderBoard(); renderFind(); renderSearch();

    $('bPrev').addEventListener('click', function(){ setWeek(WEEK_STARTS[WEEK_STARTS.indexOf(state.week) - 1]); });
    $('bNext').addEventListener('click', function(){ setWeek(WEEK_STARTS[WEEK_STARTS.indexOf(state.week) + 1]); });
    $('cPrev').addEventListener('click', function(){ setWeek(WEEK_STARTS[WEEK_STARTS.indexOf(state.week) - 1]); });
    $('cNext').addEventListener('click', function(){ setWeek(WEEK_STARTS[WEEK_STARTS.indexOf(state.week) + 1]); });
    sGroup.addEventListener('change', function(){ fillUnits(); renderSections(); });
    sUnit.addEventListener('change', renderSections);
    sRoll.addEventListener('input', renderSections);
    $('sPrev').addEventListener('click', function(){ sStep(-1); });
    $('sNext').addEventListener('click', function(){ sStep(1); });
    TABS.forEach(function(t){ $('tab-' + t).addEventListener('click', function(){ switchTab(t); }); });
    var at = (window.location.hash || '').replace('#', '');
    if(TABS.indexOf(at) > 0) switchTab(at, true);
  }

  show(remembered());
  if(!remembered()) IMT.track('tool_open', null, { tool: 'master', status: 'locked' });
})();
