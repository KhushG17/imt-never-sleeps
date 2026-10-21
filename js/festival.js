/* Festival decorations (Diwali): lights and marigolds under the navbar, a row
   of firecrackers at the foot of the page, and fireworks going off in the sky
   behind the page now and then. Decoration only: the page's own background and
   content are not touched, and nothing here is part of Weekly, Exam Seat or
   the rest.

   Loaded by Home, Weekly, Exam Seat and Bus; the upload page and the master
   timetable do not load it. It does nothing unless the festival is on in
   js/portal-config.js (festival.on and the dates from / until, India time).
   For a look outside those dates add ?festival=on to the address, and
   ?festival=off to switch it off for a visit.

   Fireworks: one goes off by itself every 3 to 6 seconds, a different kind
   and place each time, on a canvas that sits behind the page's cards and
   text (so nothing is covered). Tapping a firecracker at the foot sets one
   off in front. A device that asks for reduced motion gets the lights and
   firecrackers, still, and no fireworks.

   Sound: made in the browser (Web Audio), no sound files. A tap on a
   firecracker at the foot of the page always makes its sound; the fireworks
   in the sky stay silent until the visitor switches sound on, with the bell
   hanging from the garland or the Sound button in the footer (a browser
   will not play sound before a tap, and students open this in classrooms).
   The choice is kept on the device (imt.festSound). No fireworks, no sound
   for a device that asks for reduced motion.

   The moving parts are drawn with SMIL (<animate>) and canvas, not with CSS
   transforms on SVG parts: some phones' browsers misplace those. */
(function(){
  'use strict';
  var IMT = window.IMT, CONFIG = (IMT && IMT.config) || {}, F = CONFIG.festival;
  if(!IMT || !F) return;
  var theme = IMT.festivalTheme && IMT.festivalTheme();
  if(!theme || theme.name !== 'diwali') return;        // Halloween is js/halloween.js
  F = { sound: theme.sound, greeting: theme.greeting };

  var root = document.documentElement;
  var calm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var PAGE = /\/weekly-seat\//.test(location.pathname) ? 'weekly' : /\/exam-seat\//.test(location.pathname) ? 'exam_seat' : /\/bus\//.test(location.pathname) ? 'bus' : 'portal';
  root.classList.add('fest-on');
  function rnd(a, b){ return a + Math.random() * (b - a); }
  function pick(list){ return list[Math.floor(Math.random() * list.length)]; }

  // ---------------------------------------------------------------- the garland and the firecrackers (SVG)
  var BULBS = ['#ffd54a', '#ff8a3c', '#ff4f7b', '#4fd8ff', '#9bff7a'];
  function animate(attr, values, dur, begin){
    return calm ? '' : '<animate attributeName="' + attr + '" values="' + values + '" dur="' + dur + 's" begin="' + (begin || 0) + 's" repeatCount="indefinite"/>';
  }
  function bulb(x, y, color, g){
    return '<g class="fest-b g' + g + '"><circle class="fest-glow" cx="' + x.toFixed(1) + '" cy="' + (y + 8).toFixed(1) + '" r="9" fill="' + color + '"/>' +
      '<path d="M' + (x - 2.4).toFixed(1) + ' ' + (y + 1.5).toFixed(1) + 'h4.8l-.7 3h-3.4z" fill="#7a5a2b"/>' +
      '<ellipse cx="' + x.toFixed(1) + '" cy="' + (y + 8).toFixed(1) + '" rx="3.4" ry="4.7" fill="' + color + '" stroke="rgba(0,0,0,.18)" stroke-width=".6"/>' +
      '<ellipse cx="' + (x - 1).toFixed(1) + '" cy="' + (y + 6.4).toFixed(1) + '" rx=".9" ry="1.5" fill="#fff" opacity=".7"/></g>';
  }
  function marigold(x, y, i){
    function flower(fx, fy, r){
      var petals = '';
      for(var k = 0; k < 8; k++){ var a = k * Math.PI / 4; petals += '<circle cx="' + (fx + Math.cos(a) * r * .62).toFixed(1) + '" cy="' + (fy + Math.sin(a) * r * .62).toFixed(1) + '" r="' + (r * .5).toFixed(1) + '" fill="url(#festMg)"/>'; }
      return petals + '<circle cx="' + fx.toFixed(1) + '" cy="' + fy.toFixed(1) + '" r="' + (r * .46).toFixed(1) + '" fill="#ff9a1a"/><circle cx="' + fx.toFixed(1) + '" cy="' + fy.toFixed(1) + '" r="' + (r * .2).toFixed(1) + '" fill="#b8570a"/>';
    }
    var cx = x.toFixed(1);
    // the strand sways a little about the point it hangs from (a rotation about that point, in the SVG's own units)
    return '<g class="fest-flower">' +
      (calm ? '' : '<animateTransform attributeName="transform" type="rotate" values="-2.2 ' + cx + ' ' + y + ';2.2 ' + cx + ' ' + y + ';-2.2 ' + cx + ' ' + y + '" dur="' + (5.5 + (i % 3) * 1.1).toFixed(1) + 's" begin="-' + ((i * 1.3) % 5).toFixed(1) + 's" repeatCount="indefinite"/>') +
      '<path class="fest-wire" d="M' + cx + ' ' + y + 'V' + (y + 33) + '"/>' + flower(x, y + 8, 9) + flower(x, y + 21, 7.5) + flower(x, y + 33, 6) + '</g>';
  }
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
      items += marigold(x0, y0, i);
    }
    return '<svg viewBox="0 0 ' + w + ' 62" preserveAspectRatio="xMinYMin meet" aria-hidden="true" focusable="false"><defs>' +
      '<radialGradient id="festMg" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#ffe27a"/><stop offset=".6" stop-color="#ffb21c"/><stop offset="1" stop-color="#f07f12"/></radialGradient></defs>' +
      '<path class="fest-wire" d="' + wire + '"/>' + items + '</svg>';
  }
  // sparks rising out of a pot: each one drifts up and fades (cx, cy and opacity animated in place)
  function sparks(cx, cy, n, spread){
    var out = '';
    for(var i = 0; i < n; i++){
      var dx = ((i / (n - 1)) - .5) * spread, d = -(i * 0.23).toFixed(2);
      out += '<circle cx="' + cx + '" cy="' + cy + '" r="1.8" fill="' + (i % 2 ? '#ffd54a' : '#ff8a3c') + '" opacity="' + (calm ? '.8' : '0') + '">' +
        animate('cx', cx + ';' + (cx + dx), 1.5, d) + animate('cy', cy + ';' + (cy - 34), 1.5, d) + animate('opacity', '1;0', 1.5, d) + '</circle>';
    }
    return out;
  }
  function rays(cx, cy, angles, len, colors){
    return angles.map(function(a, i){
      return '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + len) + '" y2="' + cy + '" stroke="' + colors[i % colors.length] + '" stroke-width="1.8" stroke-linecap="round" transform="rotate(' + a + ' ' + cx + ' ' + cy + ')" opacity="' + (calm ? '.8' : '.1') + '">' +
        animate('opacity', '1;.1;1', 1, -(i * 0.12).toFixed(2)) + '</line>';
    }).join('');
  }
  var CRACKERS = [
    { id: 'anar', label: 'Light the flowerpot',
      svg: '<svg viewBox="0 0 44 66" aria-hidden="true" focusable="false"><path d="M9 62 13.500 29h17L35 62Z" fill="#c4482a"/><path d="M11 50h22l-.8 5H11.800Z" fill="#ffd54a"/><path d="M13.500 29h17l.8-4H12.700Z" fill="#8f2f18"/>' + sparks(22, 25, 7, 34) + '</svg>' },
    { id: 'rocket', label: 'Launch the rocket',
      svg: '<svg viewBox="0 0 44 66" aria-hidden="true" focusable="false"><g transform="rotate(14 22 33)"><path d="M21.200 40V64" stroke="#8a5a2b" stroke-width="2"/><rect x="15" y="14" width="14" height="28" rx="2" fill="#e0334f"/><rect x="15" y="22" width="14" height="4" fill="#ffd54a"/><rect x="15" y="32" width="14" height="4" fill="#ffd54a"/><path d="M15 14 22 0l7 14Z" fill="#ffd54a"/><path d="M15 36l-6 8 6-2zM29 36l6 8-6-2z" fill="#b9203a"/><path d="M18 42h8l-4 14Z" fill="#ff9d1c">' + animate('opacity', '1;.55;1', .5) + '</path></g></svg>' },
    { id: 'sparkler', label: 'Light the sparkler',
      svg: '<svg viewBox="0 0 44 66" aria-hidden="true" focusable="false"><path d="M22 64V26" stroke="#aab2c2" stroke-width="2.400" stroke-linecap="round"/><path d="M22 36v-6" stroke="#6b7385" stroke-width="3.600"/><circle cx="22" cy="22" r="4.500" fill="#fff7cc"/><circle cx="22" cy="22" r="9" fill="#ffd36b" opacity=".35"/>' +
        rays(22, 22, [0, 45, 90, 135, 180, 225, 270, 315], 13, ['#ffffff', '#ffd54a']) + '</svg>' },
    { id: 'chakri', label: 'Spin the ground chakra',
      svg: '<svg viewBox="0 0 44 66" aria-hidden="true" focusable="false"><ellipse cx="22" cy="52" rx="17" ry="6" fill="#7a3b1b"/><ellipse cx="22" cy="50" rx="17" ry="6" fill="#c4482a"/><ellipse cx="22" cy="50" rx="6" ry="2.200" fill="#2b1a10"/>' +
        rays(22, 50, [0, 40, 80, 120, 160, 200, 240, 280, 320], 17, ['#ffd54a', '#ff8a3c']) + sparks(22, 44, 5, 24) + '</svg>' }
  ];

  // ---------------------------------------------------------------- sound (Web Audio, synthesised: no files)
  var SOUND_KEY = 'imt.festSound', SLOG = [];
  var mode = '';                                   // 'on', 'off' or '' (not chosen: taps sound, the sky is silent)
  try { mode = window.localStorage.getItem(SOUND_KEY) || ''; } catch(e){}
  var soundAllowed = F.sound !== false && !calm;
  function skyAudible(){ return soundAllowed && mode === 'on'; }
  function tapAudible(){ return soundAllowed && mode !== 'off'; }

  var Snd = (function(){
    var AC = window.AudioContext || window.webkitAudioContext, ac = null, out = null, noise = null, master = .55, hooked = false;
    function clamp(v){ return Math.max(-.85, Math.min(.85, v)); }
    function context(){
      if(!AC) return null;
      if(!ac){
        try { ac = new AC(); } catch(e){ return null; }
        var comp = ac.createDynamicsCompressor();      // keeps a loud moment from clipping or startling
        comp.threshold.value = -20; comp.knee.value = 12; comp.ratio.value = 6; comp.attack.value = .003; comp.release.value = .25;
        out = ac.createGain(); out.gain.value = master; out.connect(comp); comp.connect(ac.destination);
        var len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
        for(var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;     // two seconds of noise, reused by every bang and crackle
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
    function dest(x, vol){
      var g = ac.createGain(); g.gain.value = vol;
      if(ac.createStereoPanner){ var pn = ac.createStereoPanner(); pn.pan.value = clamp(x); g.connect(pn); pn.connect(out); } else g.connect(out);
      return g;
    }
    function nz(t, dur, node){ var s = ac.createBufferSource(); s.buffer = noise; s.loop = true; s.connect(node); s.start(t, rnd(0, 1)); s.stop(t + dur); }
    function boom(t, x, size){                          // the deep thump of a burst, with a bright crack on top
      var d = dest(x, .55 + .35 * size), o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(150 + size * 45, t); o.frequency.exponentialRampToValueAtTime(34, t + .42);
      env(g, t, .004, 1, .5 + size * .35); o.connect(g); g.connect(d); o.start(t); o.stop(t + 1.1);
      var f = ac.createBiquadFilter(), g2 = ac.createGain(); f.type = 'lowpass'; f.frequency.setValueAtTime(1200, t); f.frequency.exponentialRampToValueAtTime(110, t + .35);
      env(g2, t, .003, .85, .38); nz(t, .6, f); f.connect(g2); g2.connect(d);
      var h = ac.createBiquadFilter(), g3 = ac.createGain(); h.type = 'highpass'; h.frequency.value = 2400; env(g3, t, .001, .4, .07); nz(t, .15, h); h.connect(g3); g3.connect(d);
    }
    function tick(t, x, vol){                           // one tiny crackle
      var d = dest(x, vol), b = ac.createBiquadFilter(), g = ac.createGain();
      b.type = 'bandpass'; b.frequency.value = rnd(2400, 6800); b.Q.value = 1.3; env(g, t, .0008, 1, rnd(.016, .04)); nz(t, .09, b); b.connect(g); g.connect(d);
    }
    function crackle(t, x, n, span, vol){ for(var i = 0; i < n; i++) tick(t + Math.pow(Math.random(), 1.5) * span, x + rnd(-.25, .25), vol * rnd(.4, 1)); }
    function pop(t, x, vol){                            // a small round pop
      var d = dest(x, vol), o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(rnd(330, 460), t); o.frequency.exponentialRampToValueAtTime(120, t + .14); env(g, t, .002, 1, .16); o.connect(g); g.connect(d); o.start(t); o.stop(t + .4);
      tick(t, x, vol * .8);
    }
    function whistle(t, x, dur){                        // a rocket climbing
      var d = dest(x, .2), o = ac.createOscillator(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(430, t); o.frequency.exponentialRampToValueAtTime(2300, t + dur);
      lfo.frequency.value = 13; lg.gain.value = 26; lfo.connect(lg); lg.connect(o.frequency);
      g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(1, t + .09); g.gain.linearRampToValueAtTime(.0001, t + dur);
      o.connect(g); g.connect(d); o.start(t); lfo.start(t); o.stop(t + dur + .05); lfo.stop(t + dur + .05);
      var f = ac.createBiquadFilter(), g2 = ac.createGain(); f.type = 'bandpass'; f.frequency.value = 4800; f.Q.value = .7;
      g2.gain.setValueAtTime(.0001, t); g2.gain.linearRampToValueAtTime(.22, t + dur * .75); g2.gain.linearRampToValueAtTime(.0001, t + dur); nz(t, dur, f); f.connect(g2); g2.connect(d);
    }
    function shimmer(t, x, dur){                        // a willow falling: a soft sparkling hiss
      var d = dest(x, .3), f = ac.createBiquadFilter(), g = ac.createGain();
      f.type = 'bandpass'; f.frequency.value = 5200; f.Q.value = .6; g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(1, t + .25); g.gain.exponentialRampToValueAtTime(.0001, t + dur); nz(t, dur, f); f.connect(g); g.connect(d);
      for(var i = 0; i < 7; i++){ var o = ac.createOscillator(), og = ac.createGain(), at = t + rnd(.1, dur * .8); o.type = 'sine'; o.frequency.value = rnd(1800, 3400); env(og, at, .003, .22, .06); o.connect(og); og.connect(dest(x + rnd(-.3, .3), .5)); o.start(at); o.stop(at + .15); }
    }
    function chime(t){                                  // a gentle two-note ting, for "sound on"
      [[784, 0], [1175, .11]].forEach(function(n){
        var o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = n[0]; env(g, t + n[1], .004, .5, .9); o.connect(g); g.connect(dest(0, .5)); o.start(t + n[1]); o.stop(t + n[1] + 1);
      });
    }
    function ready(name, x){ SLOG.push({ t: Date.now(), name: name, x: x }); return context(); }
    return {
      // a firework of a kind, at x (0 to 1 across the screen), of a size (0 to 1)
      burst: function(kind, x01, size){
        if(!ready(kind, x01)) return; var t = ac.currentTime + .02, p = (x01 - .5) * 1.6;
        if(kind === 'peony'){ boom(t, p, size); crackle(t + .12, p, 10, 1.1, .34); }
        else if(kind === 'chrysanthemum'){ boom(t, p, size); crackle(t + .1, p, 28, 2.1, .4); }
        else if(kind === 'willow'){ boom(t, p, size * .55); shimmer(t + .05, p, 1.9); }
        else { pop(t, p, .85); pop(t + .09, p, .5); }         // ring and anything small
      },
      whistle: function(x01, dur){ if(!ready('whistle', x01)) return; whistle(ac.currentTime + .02, (x01 - .5) * 1.6, dur); },
      pops: function(x01, n){ if(!ready('pops', x01)) return; var t = ac.currentTime + .02; for(var i = 0; i < n; i++) pop(t + i * .13, (x01 - .5) * 1.6 + rnd(-.2, .2), .6); },
      fizz: function(x01, dur){ if(!ready('fizz', x01)) return; var t = ac.currentTime + .02, d = dest((x01 - .5) * 1.6, .35), f = ac.createBiquadFilter(), g = ac.createGain();
        f.type = 'highpass'; f.frequency.value = 3000; g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(1, t + .1); g.gain.linearRampToValueAtTime(.0001, t + dur); nz(t, dur, f); f.connect(g); g.connect(d); crackle(t, (x01 - .5) * 1.6, 22, dur, .35); },
      chime: function(){ if(!ready('chime', .5)) return; chime(ac.currentTime + .02); },
      wake: function(){ context(); },                  // silent: lets the browser start sound after the tap that switched it on
      state: function(){ return ac ? ac.state : 'none'; },
      master: function(){ return out ? out.gain.value : null; }
    };
  })();

  // ---------------------------------------------------------------- fireworks: layers and shows
  // Two canvases: one BEHIND the page (the sky, for the shows that go off by themselves) and one in front
  // (for a tap on a firecracker). A layer exists only while something is on it.
  function Layer(cls, z){
    var canvas = null, ctx = null, parts = [], rockets = [], raf = 0, W = 0, H = 0, DPR = 1, frame = 0;
    function fit(){ if(!canvas) return; DPR = Math.min(2, window.devicePixelRatio || 1); W = root.clientWidth; H = window.innerHeight; canvas.width = W * DPR; canvas.height = H * DPR; }
    function ensure(){
      if(canvas) return;
      canvas = document.createElement('canvas'); canvas.className = cls; canvas.setAttribute('aria-hidden', 'true');
      root.appendChild(canvas); ctx = canvas.getContext('2d'); fit(); window.addEventListener('resize', fit);
    }
    function add(list){ ensure(); for(var i = 0; i < list.length; i++) parts.push(list[i]); if(parts.length > 900) parts.splice(0, parts.length - 900); start(); }
    function launch(r){ ensure(); rockets.push(r); start(); }
    function start(){ if(!raf) raf = requestAnimationFrame(tick); }
    function tick(){
      var dark = root.getAttribute('data-theme') === 'dark';
      frame++;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      // rockets climbing: a bright head, a trail of sparks, then the burst they carry
      for(var r = rockets.length - 1; r >= 0; r--){
        var k = rockets[r]; k.x += k.vx; k.y += k.vy; k.vy *= .985; k.life++;
        parts.push({ x: k.x, y: k.y, px: k.x, py: k.y, vx: rnd(-.4, .4), vy: rnd(.2, .9), life: 0, max: 16 + rnd(0, 10), color: dark ? '#ffd9a0' : '#e8590c', size: rnd(1.2, 2.2), grav: .02, fric: .96, hist: null });
        ctx.globalAlpha = 1; ctx.fillStyle = dark ? '#fff1b8' : '#f59e00'; ctx.shadowColor = '#ff9a1a'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(k.x, k.y, 2.4, 0, 6.2832); ctx.fill();
        if(k.y <= k.ty || k.life > 120){ rockets.splice(r, 1); k.then(k.x, k.y); }
      }
      for(var i = parts.length - 1; i >= 0; i--){
        var p = parts[i];
        if(p.flash){
          p.life++; var fa = 1 - p.life / p.max; if(fa <= 0){ parts.splice(i, 1); continue; }
          var rad = p.size * (0.4 + 0.6 * (p.life / p.max)), g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
          g.addColorStop(0, p.color); g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.globalAlpha = fa * (dark ? .45 : .3); ctx.fillStyle = g; ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, 6.2832); ctx.fill();
          continue;
        }
        if(p.delay > 0){ p.delay--; continue; }
        p.px = p.x; p.py = p.y;
        p.vx *= p.fric; p.vy = p.vy * p.fric + p.grav; p.x += p.vx; p.y += p.vy; p.life++;
        var a = 1 - p.life / p.max;
        if(a <= 0){ parts.splice(i, 1); continue; }
        if(p.strobe && ((frame + i) % 7) < 3) a *= .25;
        if(p.hist){ p.hist.push(p.x, p.y); if(p.hist.length > (p.trail || 0) * 2) p.hist.splice(0, 2); }
        ctx.strokeStyle = p.color; ctx.fillStyle = p.color; ctx.lineWidth = p.size; ctx.shadowColor = p.color; ctx.shadowBlur = dark ? 0 : 6;
        if(p.hist && p.hist.length >= 4){
          for(var h = 2; h < p.hist.length; h += 2){
            ctx.globalAlpha = a * (h / p.hist.length); ctx.beginPath(); ctx.moveTo(p.hist[h - 2], p.hist[h - 1]); ctx.lineTo(p.hist[h], p.hist[h + 1]); ctx.stroke();
          }
        } else { ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke(); }
        ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * .6, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      if(parts.length || rockets.length) raf = requestAnimationFrame(tick);
      else { raf = 0; ctx.clearRect(0, 0, W, H); }
    }
    return { add: add, launch: launch, size: function(){ ensure(); return [W, H]; }, count: function(){ return parts.length + rockets.length; } };
  }
  var sky = Layer('fest-sky'), front = Layer('fest-fx');

  // colours: bright on a dark page, deeper ones on a light page (pale sparks would vanish there)
  var BRIGHT = ['#ffd54a', '#ff8a3c', '#ff4f7b', '#4fd8ff', '#9bff7a', '#c58bff', '#ffffff', '#ffb3c8'];
  var DEEP = ['#f59e00', '#e8590c', '#e8336d', '#0a9fd1', '#2fa83f', '#8b5cf6', '#d6336c', '#1b6fe0'];
  function colours(){
    var pal = root.getAttribute('data-theme') === 'dark' ? BRIGHT : DEEP, n = pick([1, 1, 2, 3]), out = [];
    for(var i = 0; i < n; i++) out.push(pick(pal));
    return out;
  }
  function P(x, y, ang, speed, o){
    return { x: x, y: y, px: x, py: y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, life: 0, max: o.max, color: o.color, size: o.size, grav: o.grav, fric: o.fric,
             trail: o.trail || 0, hist: o.trail ? [] : null, strobe: !!o.strobe, delay: o.delay || 0 };
  }
  function flash(x, y, r, color){ return { flash: true, x: x, y: y, size: r, life: 0, max: 14, color: color }; }
  // the kinds of firework; R is how far a burst reaches, in pixels
  var KINDS = {
    peony: function(x, y, R, c){ var out = [flash(x, y, R * .9, c[0])], n = 64; for(var i = 0; i < n; i++) out.push(P(x, y, i / n * 6.2832 + rnd(0, .1), R * .035 * rnd(.8, 1.05), { max: rnd(70, 95), color: c[i % c.length], size: rnd(1.9, 3), grav: .03, fric: .965 })); return out; },
    chrysanthemum: function(x, y, R, c){ var out = [flash(x, y, R, c[0])], n = 80; for(var i = 0; i < n; i++) out.push(P(x, y, i / n * 6.2832 + rnd(0, .12), R * .034 * rnd(.7, 1.05), { max: rnd(80, 110), color: c[i % c.length], size: rnd(1.6, 2.4), grav: .035, fric: .966, trail: 9, strobe: i % 5 === 0 })); return out; },
    willow: function(x, y, R, c){ var out = [flash(x, y, R * .8, '#ffcf5a')], n = 56; for(var i = 0; i < n; i++) out.push(P(x, y, i / n * 6.2832 + rnd(0, .1), R * .03 * rnd(.7, 1.05), { max: rnd(125, 165), color: root.getAttribute('data-theme') === 'dark' ? '#ffd36b' : '#e08a00', size: rnd(1.6, 2.2), grav: .055, fric: .974, trail: 12 })); return out; },
    ring: function(x, y, R, c){
      var out = [flash(x, y, R * .7, c[0])], n = 54, tilt = rnd(-.9, .9), ct = Math.cos(tilt), st = Math.sin(tilt), sp = R * .036;
      for(var i = 0; i < n; i++){ var a = i / n * 6.2832, vx = Math.cos(a) * sp, vy = Math.sin(a) * sp * .38; out.push({ x: x, y: y, px: x, py: y, vx: vx * ct - vy * st, vy: vx * st + vy * ct, life: 0, max: rnd(68, 84), color: c[0], size: 2.6, grav: .018, fric: .968, trail: 0, hist: null, strobe: false, delay: 0 }); }
      for(var j = 0; j < 22; j++) out.push(P(x, y, rnd(0, 6.2832), R * .02 * rnd(.4, 1), { max: rnd(60, 80), color: c[c.length - 1], size: 1.8, grav: .03, fric: .96 }));
      return out;
    }
  };
  function show(kind, x, y, R, layer){
    var pals = colours(); (layer || sky).add(KINDS[kind](x, y, R, pals));
    if((layer === front) ? tapAudible() : skyAudible()) Snd.burst(kind, x / Math.max(1, root.clientWidth), Math.min(1, R / 190));
    if(Math.random() < .4){ var second = pick(['peony', 'chrysanthemum']);   // a few late crackles, like the little pops after a big one
      setTimeout(function(){ var l = layer || sky; l.add(Array.apply(null, Array(16)).map(function(_, i){ return P(x + rnd(-R * .5, R * .5), y + rnd(-R * .4, R * .4), rnd(0, 6.2832), rnd(.3, 1.1), { max: rnd(30, 50), color: pick(pals), size: 2, grav: .02, fric: .94, strobe: true, delay: i * 3 }); })); }, 420);
    }
  }
  var LOG = [], lastX = -1;
  // one firework of a random kind, in a random place in the sky
  function autoShow(forceKind){
    if(calm || document.hidden) return null;
    var wh = sky.size(), w = wh[0], h = wh[1], big = Math.min(w, h) > 600;
    var R = (big ? rnd(120, 190) : rnd(80, 125));
    var x = rnd(w * .08, w * .92); if(Math.abs(x - lastX) < w * .18) x = (x + w * .45) % (w * .84) + w * .08; lastX = x;
    var y = rnd(h * .12, h * .5), kind = forceKind || pick(['peony', 'peony', 'chrysanthemum', 'chrysanthemum', 'willow', 'ring', 'rocket', 'rocket', 'cluster']);
    LOG.push({ t: Date.now(), kind: kind });
    if(kind === 'rocket'){
      var kinds = ['peony', 'chrysanthemum', 'willow', 'ring'], inner = pick(kinds), sx = x + rnd(-40, 40);
      if(skyAudible()) Snd.whistle(sx / w, .9);
      sky.launch({ x: sx, y: h + 8, ty: y, vx: (x - sx) / 50, vy: -(h - y) / 38, life: 0, then: function(bx, by){ show(inner, bx, by, R, sky); } });
    } else if(kind === 'cluster'){
      for(var i = 0; i < 3; i++) (function(i){ setTimeout(function(){ if(!document.hidden) show(pick(['peony', 'ring']), x + rnd(-110, 110), y + rnd(-50, 60), R * .6, sky); }, i * 330); })(i);
    } else show(kind, x, y, R, sky);
    return kind;
  }
  // a tap on a firecracker: its own sound and a burst in front of the page, where the cracker is; the rocket really flies
  function tapBurst(x, y, id){
    if(calm) return false;
    var w = Math.max(1, root.clientWidth), audible = tapAudible();
    if(id === 'rocket'){
      var h = window.innerHeight, top = Math.max(60, y - rnd(200, 330));
      if(audible) Snd.whistle(x / w, .9);
      front.launch({ x: x, y: y, ty: top, vx: rnd(-.5, .5), vy: -(y - top) / 38, life: 0, then: function(bx, by){ show('chrysanthemum', bx, by, 125, front); } });
    } else if(id === 'sparkler'){ if(audible) Snd.fizz(x / w, 1.3); show('ring', x, y, 80, front); }
    else if(id === 'chakri'){ if(audible) Snd.fizz(x / w, 1.1); show('peony', x, y, 85, front); }
    else { if(audible) Snd.pops(x / w, 3); show('peony', x, y, 95, front); }
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

  // ---------------------------------------------------------------- the sound switch: a bell on the garland and a button in the footer
  var BELL = '<svg viewBox="0 0 44 58" aria-hidden="true" focusable="false"><defs><linearGradient id="festBell" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b9831a"/><stop offset=".45" stop-color="#ffe27a"/><stop offset="1" stop-color="#c8921f"/></linearGradient></defs>' +
    '<path d="M22 0v9" stroke="#8a5a2b" stroke-width="1.6" stroke-linecap="round"/><circle cx="22" cy="10" r="2.6" fill="#d4a52a"/>' +
    '<path d="M22 9C14 9 10 16 10 24v10L5 43h34l-5-9V24C34 16 30 9 22 9Z" fill="url(#festBell)" stroke="#8f6314" stroke-width="1"/><path d="M5 43h34" stroke="#8f6314" stroke-width="2.4" stroke-linecap="round"/><circle cx="22" cy="47.500" r="3.800" fill="#d4a52a" stroke="#8f6314" stroke-width="1"/>' +
    '<g class="fest-on-mark" fill="none" stroke="#e8590c" stroke-width="2.200" stroke-linecap="round"><path d="M38 22q4 5 0 10"/><path d="M41 18q7 9 0 18"/></g>' +
    '<path class="fest-off-mark" d="M6 8 38 52" stroke="#c0392b" stroke-width="3" stroke-linecap="round"/></svg>';
  var SPEAKER = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M4 9.500h3.500L12 5.500v13l-4.500-4H4Z" stroke="currentColor" stroke-width="1.700" stroke-linejoin="round"/><g class="fest-on-mark" stroke="currentColor" stroke-width="1.700" stroke-linecap="round"><path d="M15.500 9.500a3.500 3.500 0 0 1 0 5"/><path d="M18 7a7 7 0 0 1 0 10"/></g><path class="fest-off-mark" d="M16 9.500 21 14.500M21 9.500 16 14.500" stroke="currentColor" stroke-width="1.700" stroke-linecap="round"/></svg>';
  var switches = [];
  function paintSwitches(){
    var on = mode === 'on';
    switches.forEach(function(b){
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', on ? 'Turn the fireworks sound off' : 'Turn the fireworks sound on');
      b.setAttribute('title', on ? 'Fireworks sound: on' : 'Fireworks sound: off');
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
    row.innerHTML = CRACKERS.map(function(c){ return '<button class="fest-tap" type="button" data-c="' + c.id + '" aria-label="' + c.label + '">' + c.svg + '</button>'; }).join('') +
      '<p class="fest-note">' + (F.greeting || 'Happy Diwali') + (calm ? '' : ' · tap a firecracker') + '</p>' +
      (soundAllowed ? '<button class="fest-sound" type="button">' + SPEAKER + '<span class="fest-sound-text">Sound off</span></button>' : '');
    foot.insertBefore(row, foot.firstChild);
    var sb = row.querySelector('.fest-sound'); if(sb){ sb.addEventListener('click', toggleSound); switches.push(sb); }
    paintSwitches();
    row.addEventListener('click', function(e){
      var b = e.target.closest('.fest-tap'); if(!b) return;
      var r = b.getBoundingClientRect(), id = b.getAttribute('data-c');
      b.classList.remove('is-lit'); void b.offsetWidth; b.classList.add('is-lit');
      tapBurst(r.left + r.width / 2, r.top + 8, id);
      try { IMT.track('festival_tap', null, { tool: PAGE, result: id }); } catch(err){}
    });
  }

  // ---------------------------------------------------------------- the sky show: one every 3 to 6 seconds
  paintSwitches();
  window.IMTFestival = { burst: function(x, y){ return tapBurst(x, y, 'anar'); }, show: autoShow, log: LOG, calm: calm, layers: { sky: sky, front: front },
                         sound: { log: SLOG, mode: function(){ return mode; }, state: Snd.state, master: Snd.master, set: function(m){ setSound(m, false); } } };
  if(!calm){
    (function next(wait){ setTimeout(function(){ autoShow(); next(rnd(3000, 6000)); }, wait); })(1400);   // the first soon after the page opens, then one every 3 to 6 seconds
  }
})();
