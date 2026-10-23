/* Halloween decorations: orange, purple and green lights under the navbar with
   little pumpkins, ghosts, bats and a spider hanging from them; a row of four
   characters at the foot of the page (pumpkin, ghost, bat, cauldron) that do
   something when tapped; and, behind the page now and then, bats flying by, a
   ghost floating up, a witch on her broom, will-o'-the-wisps or lightning.
   Decoration only: the page's own background and content are not touched.

   Loaded by Home, Weekly, Exam Seat and Bus; the upload page and the master
   timetable do not load it. It does nothing unless the active festival theme
   (js/portal-config.js, festival.themes, picked by IMT.festivalTheme() from the
   dates, India time) is "halloween". ?festival=halloween shows it outside its
   dates and ?festival=off hides it for a visit. Diwali is js/festival.js; the
   two never run together. Shares css/festival.css (the row, the bell, the
   canvases).

   Sky show: one every 3 to 6 seconds, a different kind and place each time,
   on a canvas BEHIND the page's cards and text (nothing is covered, taps pass
   through). A tap on a character acts in front of the page. A device that asks
   for reduced motion gets the lights and characters, still, and no sky show.

   Sound: made in the browser (Web Audio), no sound files: wing flutter, a
   ghost's "whoo", thunder, a witch's laugh, music-box notes, a creaking door,
   bubbles. A tap on a character always makes its sound; the sky stays silent
   until the visitor switches sound on with the bell or the footer button (a
   browser will not play sound before a tap, and students open this in
   classrooms). The choice is kept on the device (imt.festSound, shared with
   the Diwali look). No sky show, no sound, for reduced motion.

   Moving parts on the garland are SMIL (<animate>), and the sky is canvas, not
   CSS transforms on SVG parts: some phones' browsers misplace those. */
(function(){
  'use strict';
  var IMT = window.IMT;
  if(!IMT || !IMT.festivalTheme) return;
  var theme = IMT.festivalTheme();
  if(!theme || theme.name !== 'halloween') return;
  var F = { sound: theme.sound, greeting: theme.greeting };

  var root = document.documentElement;
  var calm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var PAGE = /\/weekly-seat\//.test(location.pathname) ? 'weekly' : /\/exam-seat\//.test(location.pathname) ? 'exam_seat' : /\/bus\//.test(location.pathname) ? 'bus' : 'portal';
  root.classList.add('fest-on', 'fest-halloween');
  function rnd(a, b){ return a + Math.random() * (b - a); }
  function pick(list){ return list[Math.floor(Math.random() * list.length)]; }

  // Slow phones: if the show makes the page run below about 30 frames a second, switch to a lighter look for the
  // rest of the visit: the lights and characters stop moving, and the sky show comes every 9 to 15 seconds.
  var lite = false;
  function goLite(){
    if(lite) return; lite = true; root.classList.add('fest-lite');
    Array.prototype.forEach.call(document.querySelectorAll('.fest-garland animate, .fest-garland animateTransform, .fest-row animate, .fest-row animateTransform'), function(e){ e.parentNode && e.parentNode.removeChild(e); });
  }
  function isDark(){ return root.getAttribute('data-theme') === 'dark'; }

  // ---------------------------------------------------------------- the garland and the characters (SVG)
  var BULBS = ['#ff8a1c', '#a855f7', '#7cff4f', '#ff8a1c', '#c084fc'];
  function animate(attr, values, dur, begin){
    return calm ? '' : '<animate attributeName="' + attr + '" values="' + values + '" dur="' + dur + 's" begin="' + (begin || 0) + 's" repeatCount="indefinite"/>';
  }
  function sway(cx, cy, deg, dur, i){
    return calm ? '' : '<animateTransform attributeName="transform" type="rotate" values="-' + deg + ' ' + cx + ' ' + cy + ';' + deg + ' ' + cx + ' ' + cy + ';-' + deg + ' ' + cx + ' ' + cy + '" dur="' + dur.toFixed(1) + 's" begin="-' + ((i * 1.3) % 5).toFixed(1) + 's" repeatCount="indefinite"/>';
  }
  function bulb(x, y, color, g){
    return '<g class="fest-b g' + g + '"><circle class="fest-glow" cx="' + x.toFixed(1) + '" cy="' + (y + 8).toFixed(1) + '" r="9" fill="' + color + '"/>' +
      '<path d="M' + (x - 2.4).toFixed(1) + ' ' + (y + 1.5).toFixed(1) + 'h4.8l-.7 3h-3.4z" fill="#3a2a4a"/>' +
      '<ellipse cx="' + x.toFixed(1) + '" cy="' + (y + 8).toFixed(1) + '" rx="3.4" ry="4.7" fill="' + color + '" stroke="rgba(0,0,0,.25)" stroke-width=".6"/>' +
      '<ellipse cx="' + (x - 1).toFixed(1) + '" cy="' + (y + 6.4).toFixed(1) + '" rx=".9" ry="1.5" fill="#fff" opacity=".7"/></g>';
  }
  // things that hang from the wire, by a thread: x is where the thread is tied, y the wire's height there
  function hangPumpkin(x, y, i){
    var cx = x.toFixed(1), fy = y + 22;
    return '<g>' + sway(cx, y, 3, 5.2 + (i % 3), i) + '<path class="fest-wire" d="M' + cx + ' ' + y + 'V' + (y + 13) + '"/>' +
      '<ellipse cx="' + (x - 5) + '" cy="' + fy + '" rx="6.500" ry="8.500" fill="#f2761a"/><ellipse cx="' + (x + 5) + '" cy="' + fy + '" rx="6.500" ry="8.500" fill="#f2761a"/>' +
      '<ellipse cx="' + cx + '" cy="' + fy + '" rx="5.500" ry="9.200" fill="#ff9a2e"/><path d="M' + (x - 1) + ' ' + (fy - 9) + 'q-1-4 3-5q-1 3 1 5z" fill="#4a7a2a"/>' +
      '<path d="M' + (x - 5) + ' ' + (fy - 2) + 'l2.500-3.500 2.500 3.500zM' + (x + 0.500) + ' ' + (fy - 2) + 'l2.500-3.500 2.500 3.500z" fill="#3a1500"/>' +
      '<path d="M' + (x - 5) + ' ' + (fy + 2) + 'l2.500 2.500 2.500-2.500 2.500 2.500 2.500-2.500v3.500h-10z" fill="#3a1500"/></g>';
  }
  function hangGhost(x, y, i){
    var cx = x.toFixed(1), top = y + 14;
    return '<g>' + sway(cx, y, 4, 4.4 + (i % 3) * .8, i) + '<path class="fest-wire" d="M' + cx + ' ' + y + 'V' + top + '"/>' +
      '<path d="M' + (x - 8) + ' ' + (top + 22) + 'V' + (top + 8) + 'a8 8 0 0 1 16 0V' + (top + 22) + 'l-4-3.500-4 3.500-4-3.500z" fill="#fff" stroke="rgba(80,60,130,.45)" stroke-width="1"/>' +
      '<circle cx="' + (x - 3) + '" cy="' + (top + 9) + '" r="1.600" fill="#2a1747"/><circle cx="' + (x + 3) + '" cy="' + (top + 9) + '" r="1.600" fill="#2a1747"/><ellipse cx="' + cx + '" cy="' + (top + 14) + '" rx="1.500" ry="2" fill="#2a1747"/></g>';
  }
  function hangBat(x, y, i){
    var cx = x.toFixed(1), top = y + 8;
    return '<g>' + sway(cx, y, 5, 3.6 + (i % 3) * .7, i) + '<path class="fest-wire" d="M' + cx + ' ' + y + 'V' + top + '"/>' +
      '<path d="M' + (x - 9) + ' ' + (top + 3) + 'Q' + (x - 10) + ' ' + (top + 18) + ' ' + x + ' ' + (top + 22) + 'Q' + (x + 10) + ' ' + (top + 18) + ' ' + (x + 9) + ' ' + (top + 3) + 'Q' + (x + 5) + ' ' + (top + 7) + ' ' + x + ' ' + (top + 3) + 'Q' + (x - 5) + ' ' + (top + 7) + ' ' + (x - 9) + ' ' + (top + 3) + 'Z" fill="#2b1a40" stroke="#b58cff" stroke-width=".8"/>' +
      '<path d="M' + (x - 3) + ' ' + (top + 3) + 'l-1-4 3 2 3-2-1 4z" fill="#2b1a40" stroke="#b58cff" stroke-width=".6"/>' +
      '<circle cx="' + (x - 1.800) + '" cy="' + (top + 8) + '" r="1" fill="#ff5a3c"/><circle cx="' + (x + 1.800) + '" cy="' + (top + 8) + '" r="1" fill="#ff5a3c"/></g>';
  }
  function hangSpider(x, y, i){
    var cx = x.toFixed(1), d = 16 + (i % 3) * 6;
    function legs(py){ var o = ''; for(var k = -1; k <= 1; k += 2) for(var j = 0; j < 3; j++) o += '<path d="M' + x + ' ' + py + 'q' + (k * 6) + ' ' + (-4 + j * 3) + ' ' + (k * 8) + ' ' + (2 + j * 3) + '" stroke="#2b1a40" stroke-width="1.100" fill="none"/>'; return o; }
    if(calm) return '<g><path class="fest-wire" d="M' + cx + ' ' + y + 'V' + (y + d) + '"/><circle cx="' + cx + '" cy="' + (y + d + 3) + '" r="4" fill="#2b1a40" stroke="#b58cff" stroke-width=".6"/>' + legs(y + d + 3) + '</g>';
    return '<g><line class="fest-wire" x1="' + cx + '" y1="' + y + '" x2="' + cx + '" y2="' + (y + d) + '">' + animate('y2', (y + d) + ';' + (y + d + 14) + ';' + (y + d), 4.6 + (i % 3), -(i * .9).toFixed(1)) + '</line>' +
      '<g>' + '<animateTransform attributeName="transform" type="translate" values="0 0;0 14;0 0" dur="' + (4.6 + (i % 3)) + 's" begin="-' + (i * .9).toFixed(1) + 's" repeatCount="indefinite"/>' +
      '<circle cx="' + cx + '" cy="' + (y + d + 3) + '" r="4" fill="#2b1a40" stroke="#b58cff" stroke-width=".6"/>' + legs(y + d + 3) + '<circle cx="' + (x - 1.300) + '" cy="' + (y + d + 2) + '" r=".8" fill="#ff5a3c"/><circle cx="' + (x + 1.300) + '" cy="' + (y + d + 2) + '" r=".8" fill="#ff5a3c"/></g></g>';
  }
  var HANG = [hangPumpkin, hangGhost, hangBat, hangSpider, hangPumpkin, hangBat, hangGhost];
  function garland(){
    var w = Math.max(320, root.clientWidth), seg = w < 560 ? 112 : 168, n = Math.ceil(w / seg) + 2, sag = w < 560 ? 15 : 22, y0 = 8, cy = y0 + 2 * sag;
    var wire = '', items = '';
    for(var i = 0; i < n; i++){
      var x0 = i * seg - seg / 2, x1 = x0 + seg, cx = x0 + seg / 2;
      wire += 'M' + x0 + ' ' + y0 + 'Q' + cx + ' ' + cy + ' ' + x1 + ' ' + y0;
      for(var k = 1; k <= 5; k++){
        var t = k / 6, u = 1 - t;
        items += bulb(u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y0, BULBS[(i * 5 + k) % BULBS.length], ((i * 5 + k) % 4) + 1);
      }
      items += HANG[i % HANG.length](x0, y0, i);
    }
    return '<svg viewBox="0 0 ' + w + ' 62" preserveAspectRatio="xMinYMin meet" aria-hidden="true" focusable="false">' +
      '<path class="fest-wire" d="' + wire + '"/>' + items + '</svg>';
  }
  function bubbleDots(cx, cy, n, spread){
    var out = '';
    for(var i = 0; i < n; i++){
      var dx = ((i / (n - 1)) - .5) * spread, d = -(i * 0.31).toFixed(2);
      out += '<circle cx="' + cx + '" cy="' + cy + '" r="2.400" fill="none" stroke="#9bff7a" stroke-width="1.300" opacity="' + (calm ? '.8' : '0') + '">' +
        animate('cx', cx + ';' + (cx + dx), 1.9, d) + animate('cy', cy + ';' + (cy - 26), 1.9, d) + animate('opacity', '1;0', 1.9, d) + '</circle>';
    }
    return out;
  }
  var CHARS = [
    { id: 'pumpkin', label: 'Tap the pumpkin',
      svg: '<svg viewBox="0 0 44 66" aria-hidden="true" focusable="false"><ellipse cx="22" cy="42" rx="22" ry="20" fill="#ffb347" opacity=".2">' + animate('opacity', '.15;.4;.15', 1.8) + '</ellipse>' +
        '<ellipse cx="13" cy="42" rx="12" ry="18" fill="#e2641e"/><ellipse cx="31" cy="42" rx="12" ry="18" fill="#e2641e"/><ellipse cx="22" cy="42" rx="10" ry="19" fill="#ff9a2e"/>' +
        '<path d="M20 24q-2-8 5-10-1 5 1 10z" fill="#4a7a2a"/><path d="M12 38l4-7 4 7zM24 38l4-7 4 7z" fill="#fff0a8">' + animate('opacity', '1;.6;1', 1.3) + '</path>' +
        '<path d="M11 47l4 4 3-4 4 4 3-4 4 4 3-4v5q-10 8-24 0z" fill="#fff0a8">' + animate('opacity', '1;.6;1', 1.3) + '</path></svg>' },
    { id: 'ghost', label: 'Tap the ghost',
      svg: '<svg viewBox="0 0 44 66" aria-hidden="true" focusable="false"><g><animateTransform attributeName="transform" type="translate" values="0 2;0 -3;0 2" dur="2.6s" repeatCount="indefinite"/>' +
        '<path d="M6 60V28a16 16 0 0 1 32 0v32l-5.300-5-5.400 5-5.300-5-5.300 5-5.400-5z" fill="#fff" stroke="rgba(80,60,130,.5)" stroke-width="1.500"/>' +
        '<ellipse cx="16" cy="30" rx="3" ry="4" fill="#2a1747"/><ellipse cx="28" cy="30" rx="3" ry="4" fill="#2a1747"/><ellipse cx="22" cy="40" rx="3.200" ry="4.500" fill="#2a1747"/>' +
        '<ellipse cx="10" cy="38" rx="3" ry="2" fill="#ffb3c8" opacity=".6"/><ellipse cx="34" cy="38" rx="3" ry="2" fill="#ffb3c8" opacity=".6"/></g></svg>' },
    { id: 'bat', label: 'Tap the bat',
      svg: '<svg viewBox="0 0 44 66" aria-hidden="true" focusable="false"><g transform="translate(0 4)"><animateTransform attributeName="transform" type="translate" values="0 6;0 -2;0 6" dur="1.8s" repeatCount="indefinite"/>' +
        '<path fill="#2b1a40" stroke="#b58cff" stroke-width="1" d="M22 30C17 22 8 16 1 20c3 4 3 9 6 13 3-3 6-3 8 1 2-3 4-4 7-1 3-3 5-3 7 1 2-4 5-4 8-1 3-4 3-9 6-13-7-4-16 2-21 10z">' +
        animate('d', 'M22 30C17 22 8 16 1 20c3 4 3 9 6 13 3-3 6-3 8 1 2-3 4-4 7-1 3-3 5-3 7 1 2-4 5-4 8-1 3-4 3-9 6-13-7-4-16 2-21 10z;M22 30C17 34 8 38 1 40c3 -1 3 4 6 7 3-3 6-3 8 1 2-3 4-4 7-1 3-3 5-3 7 1 2-4 5-4 8-1 3-3 3-8 6-7-7-2-16-6-21-10z;M22 30C17 22 8 16 1 20c3 4 3 9 6 13 3-3 6-3 8 1 2-3 4-4 7-1 3-3 5-3 7 1 2-4 5-4 8-1 3-4 3-9 6-13-7-4-16 2-21 10z', .9) + '</path>' +
        '<ellipse cx="22" cy="31" rx="4.500" ry="7" fill="#2b1a40" stroke="#b58cff" stroke-width="1"/><path d="M18.500 26l-1.500-7 4.500 3zM25.500 26l1.500-7-4.500 3z" fill="#2b1a40" stroke="#b58cff" stroke-width=".8"/>' +
        '<circle cx="20.300" cy="29.500" r="1.200" fill="#ff5a3c"/><circle cx="23.700" cy="29.500" r="1.200" fill="#ff5a3c"/></g></svg>' },
    { id: 'cauldron', label: 'Tap the cauldron',
      svg: '<svg viewBox="0 0 44 66" aria-hidden="true" focusable="false"><ellipse cx="22" cy="58" rx="19" ry="4" fill="rgba(0,0,0,.25)"/>' +
        '<path d="M5 34C3 52 12 60 22 60S41 52 39 34Z" fill="#241a33" stroke="#7a5cb0" stroke-width="1.200"/><ellipse cx="22" cy="34" rx="17.500" ry="5" fill="#9bff7a"><animate attributeName="fill" values="#9bff7a;#6ee66a;#9bff7a" dur="2s" repeatCount="indefinite"/></ellipse>' +
        '<ellipse cx="22" cy="34" rx="17.500" ry="5" fill="none" stroke="#3b2a55" stroke-width="2.500"/><path d="M8 58l-3 5M36 58l3 5" stroke="#241a33" stroke-width="3" stroke-linecap="round"/>' + bubbleDots(22, 32, 5, 16) + '</svg>' }
  ];

  // ---------------------------------------------------------------- sound (Web Audio, synthesised: no files)
  var SOUND_KEY = 'imt.festSound', SLOG = [];
  var mode = '';                                   // 'on', 'off' or '' (not chosen: taps sound, the sky is silent)
  try { mode = window.localStorage.getItem(SOUND_KEY) || ''; } catch(e){}
  var soundAllowed = F.sound !== false && !calm;
  function skyAudible(){ return soundAllowed && mode === 'on'; }
  function tapAudible(){ return soundAllowed && mode !== 'off'; }

  var Snd = (function(){
    var AC = window.AudioContext || window.webkitAudioContext, ac = null, out = null, echo = null, noise = null, master = .55, hooked = false;
    function clamp(v){ return Math.max(-.85, Math.min(.85, v)); }
    function context(){
      if(!AC) return null;
      if(!ac){
        try { ac = new AC(); } catch(e){ return null; }
        var comp = ac.createDynamicsCompressor();      // keeps a loud moment (thunder) from clipping or startling
        comp.threshold.value = -20; comp.knee.value = 12; comp.ratio.value = 6; comp.attack.value = .003; comp.release.value = .25;
        out = ac.createGain(); out.gain.value = master; out.connect(comp); comp.connect(ac.destination);
        // a soft echo, for the eerie parts
        echo = ac.createGain(); var dl = ac.createDelay(1), fb = ac.createGain(), lp = ac.createBiquadFilter(), wet = ac.createGain();
        dl.delayTime.value = .27; fb.gain.value = .38; lp.type = 'lowpass'; lp.frequency.value = 2300; wet.gain.value = .5;
        echo.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(wet); wet.connect(out);
        var len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
        for(var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        noise = buf;
      }
      if(ac.state === 'suspended'){
        ac.resume().catch(function(){});
        if(!hooked){   // a browser starts sound only after a tap: the first tap or key wakes it
          hooked = true;
          ['pointerdown', 'keydown', 'touchend'].forEach(function(ev){ window.addEventListener(ev, function(){ if(ac && ac.state === 'suspended') ac.resume().catch(function(){}); }, { passive: true }); });
        }
      }
      return ac;
    }
    function env(g, t, attack, peak, decay){
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, peak), t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + attack + decay);
    }
    function dest(x, vol, wetAmt){
      var g = ac.createGain(); g.gain.value = vol;
      if(ac.createStereoPanner){ var pn = ac.createStereoPanner(); pn.pan.value = clamp(x); g.connect(pn); pn.connect(out); } else g.connect(out);
      if(wetAmt){ var s = ac.createGain(); s.gain.value = wetAmt; g.connect(s); s.connect(echo); }
      return g;
    }
    function nz(t, dur, node){ var s = ac.createBufferSource(); s.buffer = noise; s.loop = true; s.connect(node); s.start(t, rnd(0, 1)); s.stop(t + dur); }
    function flutter(t, x, n){                          // wing beats, with a squeak or two
      for(var i = 0; i < n; i++){
        var at = t + i * rnd(.07, .1), f = ac.createBiquadFilter(), g = ac.createGain();
        f.type = 'bandpass'; f.frequency.value = rnd(1100, 1900); f.Q.value = .9; env(g, at, .006, .5, .07); nz(at, .12, f); f.connect(g); g.connect(dest(x + rnd(-.2, .2), .3));
      }
      for(var j = 0; j < 2; j++){
        var st = t + rnd(.05, .5), o = ac.createOscillator(), og = ac.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(rnd(4600, 5400), st); o.frequency.exponentialRampToValueAtTime(rnd(6200, 7200), st + .07); env(og, st, .004, .5, .07);
        o.connect(og); og.connect(dest(x + rnd(-.3, .3), .07)); o.start(st); o.stop(st + .15);
      }
    }
    function whoo(t, x, size){                          // a ghost's "whoooo": a slow, wavering hum that rises and falls
      var d = dest(x, .55 * size, .55), lp = ac.createBiquadFilter(), lfo = ac.createOscillator(), lg = ac.createGain();
      lp.type = 'lowpass'; lp.frequency.value = 1100; lp.connect(d);
      lfo.frequency.value = 5.2; lg.gain.value = 9; lfo.connect(lg); lfo.start(t); lfo.stop(t + 2);
      [1, 1.006].forEach(function(det){
        var o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine';
        o.frequency.setValueAtTime(300 * det, t); o.frequency.linearRampToValueAtTime(470 * det, t + .6); o.frequency.linearRampToValueAtTime(250 * det, t + 1.6);
        lg.connect(o.frequency); env(g, t, .35, .5, 1.2); o.connect(g); g.connect(lp); o.start(t); o.stop(t + 2);
      });
      var f = ac.createBiquadFilter(), bg = ac.createGain(); f.type = 'bandpass'; f.frequency.value = 650; f.Q.value = 1.2; env(bg, t, .4, .09, 1.1); nz(t, 1.8, f); f.connect(bg); bg.connect(d);
    }
    function thunder(t, x){                             // a far crack, then a long low rumble
      var d = dest(x, .85), h = ac.createBiquadFilter(), hg = ac.createGain();
      h.type = 'highpass'; h.frequency.value = 1800; env(hg, t, .002, .35, .12); nz(t, .2, h); h.connect(hg); hg.connect(d);
      var lp = ac.createBiquadFilter(), g = ac.createGain(), am = ac.createOscillator(), ag = ac.createGain();
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(260, t + .3); lp.frequency.exponentialRampToValueAtTime(70, t + 2.6);
      g.gain.setValueAtTime(.0001, t + .3); g.gain.linearRampToValueAtTime(1, t + .75); g.gain.exponentialRampToValueAtTime(.0001, t + 2.8);
      am.frequency.value = 8; ag.gain.value = .35; am.connect(ag); ag.connect(g.gain); am.start(t + .3); am.stop(t + 2.9);
      nz(t + .3, 2.6, lp); lp.connect(g); g.connect(d);
      var o = ac.createOscillator(), og = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(70, t + .3); o.frequency.exponentialRampToValueAtTime(38, t + 2); env(og, t + .35, .3, .6, 1.6); o.connect(og); og.connect(d); o.start(t + .3); o.stop(t + 2.4);
    }
    function cackle(t, x){                              // a broom's whoosh and a witch's laugh: "eh-heh-heh-heh"
      var d = dest(x, .3, .3), f = ac.createBiquadFilter(), g = ac.createGain();
      f.type = 'bandpass'; f.Q.value = .8; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(2500, t + .9);
      g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.55, t + .45); g.gain.linearRampToValueAtTime(.0001, t + .95); nz(t, 1, f); f.connect(g); g.connect(d);
      [540, 500, 470, 430, 400].forEach(function(fr, i){
        var at = t + .75 + i * .15, o = ac.createOscillator(), bp = ac.createBiquadFilter(), lp = ac.createBiquadFilter(), og = ac.createGain();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(fr * 1.15, at); o.frequency.exponentialRampToValueAtTime(fr, at + .1);
        bp.type = 'bandpass'; bp.frequency.value = 1150; bp.Q.value = 2.5; lp.type = 'lowpass'; lp.frequency.value = 2200;
        env(og, at, .012, .6, .1); o.connect(bp); bp.connect(lp); lp.connect(og); og.connect(d); o.start(at); o.stop(at + .2);
      });
    }
    function musicbox(t, x, n){                         // a few music-box notes in a minor key, echoing
      var scale = [440, 523.25, 587.33, 659.25, 783.99, 880], k = Math.floor(rnd(0, scale.length));
      for(var i = 0; i < n; i++){
        k = Math.max(0, Math.min(scale.length - 1, k + pick([-2, -1, 1, 2])));
        var at = t + i * .24, fr = scale[k];
        [[1, .5], [2, .14], [3.01, .05]].forEach(function(p){
          var o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = fr * p[0]; env(g, at, .003, p[1], 1.0 / p[0] + .15);
          o.connect(g); g.connect(dest(x + rnd(-.15, .15), .32, .5)); o.start(at); o.stop(at + 1.4);
        });
      }
    }
    function creak(t, x){                               // a door on an old hinge
      var d = dest(x, .4, .25), o = ac.createOscillator(), bp = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(82, t); o.frequency.linearRampToValueAtTime(150, t + .4); o.frequency.linearRampToValueAtTime(96, t + .85);
      lfo.frequency.value = 24; lg.gain.value = 14; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + 1);
      bp.type = 'bandpass'; bp.Q.value = 5; bp.frequency.setValueAtTime(520, t); bp.frequency.linearRampToValueAtTime(1150, t + .45); bp.frequency.linearRampToValueAtTime(640, t + .85);
      g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.8, t + .1); g.gain.linearRampToValueAtTime(.0001, t + .9);
      o.connect(bp); bp.connect(g); g.connect(d); o.start(t); o.stop(t + 1);
    }
    function bubbles(t, x, n){                          // a cauldron bubbling
      var d = dest(x, .4, .15);
      for(var i = 0; i < n; i++){
        var at = t + Math.pow(Math.random(), 1.3) * 1.2, o = ac.createOscillator(), g = ac.createGain(), f0 = rnd(170, 400);
        o.type = 'sine'; o.frequency.setValueAtTime(f0, at); o.frequency.exponentialRampToValueAtTime(f0 * rnd(1.7, 2.4), at + .09); env(g, at, .003, .6, .1);
        o.connect(g); g.connect(dest(x + rnd(-.3, .3), .3)); o.start(at); o.stop(at + .25);
      }
      var f = ac.createBiquadFilter(), ng = ac.createGain(); f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = .8;
      ng.gain.setValueAtTime(.0001, t); ng.gain.linearRampToValueAtTime(.16, t + .3); ng.gain.linearRampToValueAtTime(.0001, t + 1.4); nz(t, 1.5, f); f.connect(ng); ng.connect(d);
    }
    function ready(name, x){ SLOG.push({ t: Date.now(), name: name, x: x }); return context(); }
    function p(x01){ return (x01 - .5) * 1.6; }
    return {
      play: function(kind, x01, size){
        if(!ready(kind, x01)) return; var t = ac.currentTime + .02;
        if(kind === 'bats') flutter(t, p(x01), Math.round(10 + 8 * (size || .5)));
        else if(kind === 'ghost') whoo(t, p(x01), .7 + .3 * (size || .5));
        else if(kind === 'lightning') thunder(t, p(x01));
        else if(kind === 'witch') cackle(t, p(x01));
        else if(kind === 'wisps') musicbox(t, p(x01), 4);
        else if(kind === 'pumpkin') creak(t, p(x01));
        else if(kind === 'cauldron') bubbles(t, p(x01), 11);
      },
      wake: function(){ context(); },                  // silent: lets the browser start sound after the tap that switched it on
      state: function(){ return ac ? ac.state : 'none'; },
      master: function(){ return out ? out.gain.value : null; }
    };
  })();

  // ---------------------------------------------------------------- the canvas layers and what flies on them
  // Two canvases: one BEHIND the page (the sky show) and one in front (for a tap on a character). A layer exists
  // only while something is on it. Everything on a layer is an "actor": step(ctx, dark) draws it and says if it lives on.
  function Layer(cls){
    var lastT = 0, avgGap = 0, seen = 0, canvas = null, ctx = null, actors = [], raf = 0, W = 0, H = 0, DPR = 1;
    function fit(){ if(!canvas) return; DPR = Math.min(1.5, window.devicePixelRatio || 1); W = root.clientWidth; H = window.innerHeight; canvas.width = W * DPR; canvas.height = H * DPR; }
    function ensure(){
      if(canvas) return;
      canvas = document.createElement('canvas'); canvas.className = cls; canvas.setAttribute('aria-hidden', 'true');
      root.appendChild(canvas); ctx = canvas.getContext('2d'); fit(); window.addEventListener('resize', fit);
    }
    function tick(){
      var now = performance.now();
      if(lastT){ var gap = now - lastT; if(gap < 250){ avgGap = avgGap ? avgGap * .9 + gap * .1 : gap; if(++seen > 30 && avgGap > 34) goLite(); } } lastT = now;
      var dark = isDark();
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
      for(var i = actors.length - 1; i >= 0; i--){
        ctx.save(); var alive = actors[i].step(ctx, dark, W, H); ctx.restore();
        if(alive === false) actors.splice(i, 1);
      }
      if(actors.length) raf = requestAnimationFrame(tick);
      else { raf = 0; lastT = 0; ctx.clearRect(0, 0, W, H); }
    }
    function add(a){ ensure(); actors.push(a); if(!raf) raf = requestAnimationFrame(tick); }
    return { add: add, size: function(){ ensure(); return [W, H]; }, count: function(){ return actors.length; } };
  }
  var sky = Layer('fest-sky'), front = Layer('fest-fx');
  function fade(age, life, edge){ return Math.max(0, Math.min(1, age / edge, (life - age) / edge)); }

  function Bat(x, y, vx, vy, s, life){
    var ph = rnd(0, 6.28), age = 0;
    function wing(c, k){
      c.beginPath(); c.moveTo(0, -s * .1); c.quadraticCurveTo(s * .5, -s * (.55 + .4 * k), s, -s * (.2 + .5 * k));
      c.quadraticCurveTo(s * .78, -s * (.05 + .2 * k), s * .62, s * .12); c.quadraticCurveTo(s * .45, 0, s * .3, s * .18); c.quadraticCurveTo(s * .15, s * .05, 0, s * .2); c.closePath(); c.fill();
    }
    return { step: function(c, dark, W, H){
      age++; ph += .42; x += vx + Math.sin(age / 9) * .5; y += vy + Math.cos(age / 7) * .6;
      if(age > life || x < -80 || x > W + 80 || y < -80 || y > H + 80) return false;
      c.globalAlpha = fade(age, life, 14) * (dark ? .9 : .8); c.fillStyle = dark ? '#e3d3ff' : '#2a1747'; c.translate(x, y);
      var k = Math.sin(ph);
      wing(c, k); c.scale(-1, 1); wing(c, k); c.scale(-1, 1);
      c.beginPath(); c.ellipse(0, 0, s * .17, s * .27, 0, 0, 6.2832); c.fill();
      c.beginPath(); c.moveTo(-s * .12, -s * .2); c.lineTo(-s * .15, -s * .42); c.lineTo(-s * .02, -s * .26); c.moveTo(s * .12, -s * .2); c.lineTo(s * .15, -s * .42); c.lineTo(s * .02, -s * .26); c.fill();
      return true;
    } };
  }
  function Ghost(x, y, s, life, speed){
    var age = 0, x0 = x, sw = rnd(0, 6.28);
    return { step: function(c, dark){
      age++; y -= speed; x = x0 + Math.sin(age / 26 + sw) * 20;
      if(age > life || y < -s * 2) return false;
      var a = fade(age, life, 30) * (dark ? .8 : .92); c.globalAlpha = a; c.translate(x, y);
      c.fillStyle = dark ? 'rgba(190,210,255,.18)' : 'rgba(140,100,220,.16)'; c.beginPath(); c.arc(0, s * .1, s * .78, 0, 6.2832); c.fill();   // a soft glow (a plain circle: shadows are slow on phones)
      c.fillStyle = dark ? 'rgba(236,244,255,.9)' : '#fff'; c.strokeStyle = dark ? 'rgba(200,215,255,.6)' : 'rgba(80,60,130,.5)'; c.lineWidth = 1.5;
      c.beginPath(); c.arc(0, 0, s * .5, Math.PI, 0); c.lineTo(s * .5, s * .62);
      var w = Math.sin(age / 6) * s * .05;
      for(var i = 0; i < 4; i++){ var px = s * .5 - (i + 1) * s * .25; c.quadraticCurveTo(px + s * .125, s * (.62 + (i % 2 ? -.12 : .12)) + w, px, s * .62); }
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#2a1747'; c.beginPath(); c.ellipse(-s * .19, -s * .05, s * .07, s * .1, 0, 0, 6.2832); c.ellipse(s * .19, -s * .05, s * .07, s * .1, 0, 0, 6.2832); c.fill();
      c.beginPath(); c.ellipse(0, s * .22, s * .07, s * .11, 0, 0, 6.2832); c.fill();
      return true;
    } };
  }
  function Wisps(x, y, n, life){
    var orbs = [], age = 0, i;
    for(i = 0; i < n; i++) orbs.push({ x: x + rnd(-90, 90), y: y + rnd(-50, 50), ph: rnd(0, 6.28), sp: rnd(.018, .034), r: rnd(5, 9), hist: [], hue: i % 3 ? 'g' : 'o' });
    return { step: function(c, dark){
      age++; if(age > life) return false;
      var a = fade(age, life, 40);
      orbs.forEach(function(o){
        o.ph += o.sp; o.x += Math.cos(o.ph * 1.7) * 1.1; o.y += Math.sin(o.ph) * .7 - .12;
        o.hist.push(o.x, o.y); if(o.hist.length > 24) o.hist.splice(0, 2);
        var col = o.hue === 'g' ? (dark ? '124,255,79' : '47,168,63') : (dark ? '255,170,60' : '232,89,12');
        c.globalCompositeOperation = dark ? 'lighter' : 'source-over';
        for(var h = 2; h < o.hist.length; h += 2){ c.globalAlpha = a * .5 * (h / o.hist.length); c.fillStyle = 'rgba(' + col + ',1)'; c.beginPath(); c.arc(o.hist[h], o.hist[h + 1], o.r * .3 * (h / o.hist.length), 0, 6.2832); c.fill(); }
        var g = c.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 3);
        g.addColorStop(0, 'rgba(' + col + ',.95)'); g.addColorStop(.35, 'rgba(' + col + ',.4)'); g.addColorStop(1, 'rgba(' + col + ',0)');
        c.globalAlpha = a * (.75 + .25 * Math.sin(age / 5 + o.ph)); c.fillStyle = g; c.beginPath(); c.arc(o.x, o.y, o.r * 3, 0, 6.2832); c.fill();
      });
      return true;
    } };
  }
  function Lightning(W, H){
    var x = rnd(W * .12, W * .88), pts = [[x, -10]], yEnd = rnd(H * .35, H * .7), y = -10, age = 0, branch = [];
    while(y < yEnd){ y += rnd(24, 48); x += rnd(-30, 30); pts.push([x, y]); if(Math.random() < .3) branch.push([x, y, rnd(-1, 1) > 0 ? 1 : -1]); }
    var bolts = branch.slice(0, 2).map(function(b){ var bp = [[b[0], b[1]]], bx = b[0], by = b[1]; for(var i = 0; i < 4; i++){ bx += b[2] * rnd(14, 34); by += rnd(14, 34); bp.push([bx, by]); } return bp; });
    function line(c, p){ c.beginPath(); p.forEach(function(q, i){ if(i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.stroke(); }
    return { step: function(c, dark, w, h){
      age++; if(age > 26) return false;
      var a = age < 4 ? 1 : age < 8 ? .2 : age < 11 ? .95 : Math.max(0, 1 - (age - 11) / 15);
      c.globalAlpha = a * (dark ? .12 : .08); c.fillStyle = dark ? '#b9a4ff' : '#7c3aed'; c.fillRect(0, 0, w, h);   // a faint wash, not a blinding flash
      c.strokeStyle = dark ? '#b794ff' : '#a78bfa'; c.lineJoin = 'round'; c.globalAlpha = a * .3; c.lineWidth = 9; line(c, pts);   // a wide faint stroke for the glow
      c.globalAlpha = a; c.strokeStyle = dark ? '#efe6ff' : '#6d28d9'; c.lineWidth = 2.6; line(c, pts); c.lineWidth = 1.4; bolts.forEach(function(b){ line(c, b); });
      return true;
    } };
  }
  function Witch(W, H, s){
    var dir = Math.random() < .5 ? 1 : -1, x = dir > 0 ? -90 : W + 90, y0 = rnd(H * .14, H * .38), age = 0, sparks = [];
    return { step: function(c, dark){
      age++; x += dir * (W < 560 ? 2.1 : 2.8); var y = y0 + Math.sin(age / 22) * 12;
      if((dir > 0 && x > W + 100) || (dir < 0 && x < -100)) return false;
      if(age % 3 === 0) sparks.push({ x: x - dir * s * .9, y: y + s * .3, vx: -dir * rnd(.1, .5), vy: rnd(.1, .6), life: 0, max: rnd(26, 44) });
      for(var i = sparks.length - 1; i >= 0; i--){
        var p = sparks[i]; p.life++; p.x += p.vx; p.y += p.vy; if(p.life > p.max){ sparks.splice(i, 1); continue; }
        c.globalAlpha = 1 - p.life / p.max; c.fillStyle = dark ? '#ffd54a' : '#e8590c'; c.beginPath(); c.arc(p.x, p.y, 1.8, 0, 6.2832); c.fill();
      }
      c.globalAlpha = dark ? .92 : .82; c.fillStyle = c.strokeStyle = dark ? '#dcc7ff' : '#241038'; c.translate(x, y); c.scale(dir, 1);
      c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(-s * 1.0, s * .3); c.lineTo(s * .8, s * .12); c.stroke();                       // the broom
      c.beginPath(); c.moveTo(-s * .95, s * .3); c.lineTo(-s * 1.45, s * .05); c.lineTo(-s * 1.4, s * .55); c.closePath(); c.fill();                  // its bristles
      c.beginPath(); c.moveTo(-s * .25, s * .12); c.quadraticCurveTo(-s * .45, -s * .35, -s * .05, -s * .4); c.quadraticCurveTo(s * .3, -s * .35, s * .3, s * .12); c.closePath(); c.fill();   // cloak
      c.beginPath(); c.arc(s * .12, -s * .56, s * .2, 0, 6.2832); c.fill();                                                                            // head
      c.beginPath(); c.moveTo(-s * .12, -s * .66); c.lineTo(s * .02, -s * 1.3); c.lineTo(s * .32, -s * .66); c.closePath(); c.fill();                 // hat
      c.beginPath(); c.ellipse(s * .1, -s * .66, s * .42, s * .08, -.1, 0, 6.2832); c.fill();                                                          // brim
      c.beginPath(); c.moveTo(s * .3, -s * .5); c.quadraticCurveTo(s * .6, -s * .3, s * .46, -s * .08); c.lineTo(s * .35, -s * .35); c.closePath(); c.fill();   // hair
      return true;
    } };
  }
  // small things thrown off by a tap: embers (rise and fade) and bubbles (rise, swell, pop)
  function Bits(x, y, n, kind){
    var parts = [], i;
    for(i = 0; i < n; i++) parts.push({ x: x + rnd(-8, 8), y: y, vx: rnd(-1.2, 1.2), vy: kind === 'ember' ? -rnd(1.2, 3.4) : -rnd(.6, 1.8), life: 0, max: rnd(40, 80), r: rnd(2, kind === 'ember' ? 3.4 : 7) });
    return { step: function(c, dark){
      var alive = false;
      parts.forEach(function(p){
        p.life++; if(p.life > p.max) return; alive = true;
        p.x += p.vx; p.y += p.vy; if(kind === 'ember'){ p.vy += .03; p.vx *= .99; } else p.vx = Math.sin(p.life / 7 + p.r) * .6;
        var a = 1 - p.life / p.max;
        if(kind === 'ember'){ c.globalAlpha = a; c.fillStyle = pick(['#ffd54a', '#ff8a1c', '#ff5a1c']); c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.2832); c.fill(); }
        else { c.globalAlpha = a * .9; c.strokeStyle = dark ? '#9bff7a' : '#2fa83f'; c.lineWidth = 1.6; c.beginPath(); c.arc(p.x, p.y, p.r * (1 + p.life / p.max * .6), 0, 6.2832); c.stroke(); }
      });
      return alive;
    } };
  }

  // ---------------------------------------------------------------- shows
  var LOG = [], lastX = -1;
  function sizeOf(w, h){ return Math.min(w, h) > 600 ? 1 : .75; }
  function sound(kind, x, w, size, audible){ if(audible) Snd.play(kind, x / Math.max(1, w), size); }
  // one thing in the sky, of a random kind, in a random place
  function autoShow(forceKind){
    if(calm || document.hidden) return null;
    var wh = sky.size(), w = wh[0], h = wh[1], k = sizeOf(w, h);
    var kind = forceKind || pick(['bats', 'bats', 'ghost', 'ghost', 'lightning', 'witch', 'wisps', 'wisps']);
    var x = rnd(w * .1, w * .9); if(Math.abs(x - lastX) < w * .2) x = (x + w * .45) % (w * .8) + w * .1; lastX = x;
    LOG.push({ t: Date.now(), kind: kind });
    var audible = skyAudible();
    if(kind === 'bats'){
      var dir = Math.random() < .5 ? 1 : -1, y = rnd(h * .12, h * .5), n = Math.round(rnd(4, 7));
      for(var i = 0; i < n; i++) sky.add(Bat(dir > 0 ? -30 - i * 34 : w + 30 + i * 34, y + rnd(-40, 40), dir * rnd(2.2, 3.2), rnd(-.5, .3), rnd(16, 24) * k, 600));
      sound('bats', dir > 0 ? w * .25 : w * .75, w, .9, audible);
    } else if(kind === 'ghost'){
      sky.add(Ghost(x, rnd(h * .6, h * .95), rnd(46, 66) * k, 520, rnd(.55, .85))); sound('ghost', x, w, .8, audible);
    } else if(kind === 'lightning'){
      sky.add(Lightning(w, h)); sound('lightning', w * .5, w, 1, audible);
    } else if(kind === 'witch'){
      sky.add(Witch(w, h, 30 * k)); sound('witch', w * .5, w, .8, audible);
    } else {
      sky.add(Wisps(x, rnd(h * .25, h * .6), 5, 420)); sound('wisps', x, w, .5, audible);
    }
    return kind;
  }
  // a tap on a character: its own sound and something in front of the page, where the character is
  function tapAct(x, y, id){
    if(calm) return false;
    var w = Math.max(1, root.clientWidth), audible = tapAudible();
    if(id === 'ghost'){ front.add(Ghost(x, y, 52, 190, 1.1)); sound('ghost', x, w, .8, audible); }
    else if(id === 'bat'){ for(var i = 0; i < 6; i++) front.add(Bat(x + rnd(-8, 8), y + rnd(-8, 8), rnd(-3.4, 3.4), -rnd(1.5, 3.4), rnd(15, 21), 130)); sound('bats', x, w, .7, audible); }
    else if(id === 'cauldron'){ front.add(Bits(x, y + 6, 14, 'bubble')); sound('cauldron', x, w, .7, audible); }
    else { front.add(Bits(x, y + 14, 34, 'ember')); sound('pumpkin', x, w, .7, audible); }
    return true;
  }

  // ---------------------------------------------------------------- build the page
  var header = document.getElementById('siteHeader');
  var wrap = document.createElement('div'); wrap.className = 'fest-garland';
  var lights = document.createElement('div'); lights.setAttribute('aria-hidden', 'true'); wrap.appendChild(lights);   // the bell is a sibling, so redrawing the lights never removes it
  if(header && header.parentNode) header.parentNode.insertBefore(wrap, header.nextSibling);
  var built = 0;
  function drawGarland(){ var w = root.clientWidth; if(w === built) return; built = w; lights.innerHTML = garland(); }
  drawGarland();
  var rz = 0; window.addEventListener('resize', function(){ clearTimeout(rz); rz = setTimeout(drawGarland, 180); });

  // the sound switch: a bell on the garland and a button in the footer (the same as Diwali's)
  var BELL = '<svg viewBox="0 0 44 58" aria-hidden="true" focusable="false"><defs><linearGradient id="festBell" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b9831a"/><stop offset=".45" stop-color="#ffe27a"/><stop offset="1" stop-color="#c8921f"/></linearGradient></defs>' +
    '<path d="M22 0v9" stroke="#8a5a2b" stroke-width="1.600" stroke-linecap="round"/><circle cx="22" cy="10" r="2.600" fill="#d4a52a"/>' +
    '<path d="M22 9C14 9 10 16 10 24v10L5 43h34l-5-9V24C34 16 30 9 22 9Z" fill="url(#festBell)" stroke="#8f6314" stroke-width="1"/><path d="M5 43h34" stroke="#8f6314" stroke-width="2.400" stroke-linecap="round"/><circle cx="22" cy="47.500" r="3.800" fill="#d4a52a" stroke="#8f6314" stroke-width="1"/>' +
    '<g class="fest-on-mark" fill="none" stroke="#e8590c" stroke-width="2.200" stroke-linecap="round"><path d="M38 22q4 5 0 10"/><path d="M41 18q7 9 0 18"/></g>' +
    '<path class="fest-off-mark" d="M6 8 38 52" stroke="#c0392b" stroke-width="3" stroke-linecap="round"/></svg>';
  var SPEAKER = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M4 9.500h3.500L12 5.500v13l-4.500-4H4Z" stroke="currentColor" stroke-width="1.700" stroke-linejoin="round"/><g class="fest-on-mark" stroke="currentColor" stroke-width="1.700" stroke-linecap="round"><path d="M15.500 9.500a3.500 3.500 0 0 1 0 5"/><path d="M18 7a7 7 0 0 1 0 10"/></g><path class="fest-off-mark" d="M16 9.500 21 14.500M21 9.500 16 14.500" stroke="currentColor" stroke-width="1.700" stroke-linecap="round"/></svg>';
  var switches = [];
  function paintSwitches(){
    var on = mode === 'on';
    switches.forEach(function(b){
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', on ? 'Turn the Halloween sound off' : 'Turn the Halloween sound on');
      b.setAttribute('title', on ? 'Halloween sound: on' : 'Halloween sound: off');
      var t = b.querySelector('.fest-sound-text'); if(t) t.textContent = on ? 'Sound on' : 'Sound off';
    });
  }
  function setSound(next, fromTap){
    mode = next;
    try { if(next) window.localStorage.setItem(SOUND_KEY, next); else window.localStorage.removeItem(SOUND_KEY); } catch(e){}
    paintSwitches();
    if(fromTap){
      if(next === 'on') Snd.wake();                          // silent: the tap that switches it on lets the browser start sound
      switches.forEach(function(b){ if(b.classList.contains('fest-bell')){ b.classList.remove('is-ring'); void b.offsetWidth; b.classList.add('is-ring'); } });
      try { IMT.track('festival_sound', null, { tool: PAGE, result: next }); } catch(err){}
    }
  }
  function toggleSound(){ setSound(mode === 'on' ? 'off' : 'on', true); }
  if(soundAllowed){
    var bell = document.createElement('button'); bell.type = 'button'; bell.className = 'fest-bell'; bell.innerHTML = BELL; wrap.appendChild(bell);
    bell.addEventListener('click', toggleSound); switches.push(bell);
  }

  var foot = document.querySelector('footer');
  if(foot){
    var row = document.createElement('div'); row.className = 'fest-row';
    row.innerHTML = CHARS.map(function(c){ return '<button class="fest-tap" type="button" data-c="' + c.id + '" aria-label="' + c.label + '">' + c.svg + '</button>'; }).join('') +
      '<p class="fest-note">' + (F.greeting || 'Happy Halloween') + (calm ? '' : ' · tap a friend') + '</p>' +
      (soundAllowed ? '<button class="fest-sound" type="button">' + SPEAKER + '<span class="fest-sound-text">Sound off</span></button>' : '');
    foot.insertBefore(row, foot.firstChild);
    var sb = row.querySelector('.fest-sound'); if(sb){ sb.addEventListener('click', toggleSound); switches.push(sb); }
    paintSwitches();
    row.addEventListener('click', function(e){
      var b = e.target.closest('.fest-tap'); if(!b) return;
      var r = b.getBoundingClientRect(), id = b.getAttribute('data-c');
      b.classList.remove('is-lit'); void b.offsetWidth; b.classList.add('is-lit');
      tapAct(r.left + r.width / 2, r.top + r.height / 2, id);
      try { IMT.track('festival_tap', null, { tool: PAGE, result: id }); } catch(err){}
    });
  }

  // ---------------------------------------------------------------- the sky show: one every 3 to 6 seconds
  paintSwitches();
  window.IMTFestival = { burst: function(x, y){ return tapAct(x, y, 'pumpkin'); }, show: autoShow, log: LOG, calm: calm, theme: 'halloween', layers: { sky: sky, front: front },
                         sound: { log: SLOG, mode: function(){ return mode; }, state: Snd.state, master: Snd.master, set: function(m){ setSound(m, false); } } };
  if(!calm){
    (function next(wait){ setTimeout(function(){ autoShow(); next(lite ? rnd(9000, 15000) : rnd(3000, 6000)); }, wait); })(1400);
  }
})();
