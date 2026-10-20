/* Light or dark.

   Runs in the <head>, before anything is drawn, so a page never flashes the
   wrong theme. It puts two attributes on <html>:
     data-theme       "light" or "dark": the theme being shown
     data-theme-pref  "auto", "light" or "dark": what is kept for this device
   Until someone uses the switch, nothing is kept ("auto"): the page follows
   the phone or laptop, and changes with it (dark at night, if the device
   does). The switch only ever flips between light and dark. If what it flips
   to is what the device already shows, it goes back to following the device,
   so there is no third state to understand.

   The choice is kept on this device only, in the browser's own storage. The
   button itself is wired in common.js, through window.IMTTheme. */
(function(){
  var KEY = 'imt.theme';
  var root = document.documentElement;
  var query = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var BAR = { light: '#ffffff', dark: '#0c1220' };   // the browser bar, matching --color-page

  function pref(){
    try {
      var v = window.localStorage.getItem(KEY);
      if(v === 'light' || v === 'dark') return v;
    } catch(e){}
    return 'auto';
  }
  function device(){ return query && query.matches ? 'dark' : 'light'; }
  function shown(p){ return p === 'auto' ? device() : p; }
  function apply(p){
    var t = shown(p);
    root.setAttribute('data-theme', t);
    root.setAttribute('data-theme-pref', p);
    var bar = document.querySelector('meta[name="theme-color"]');
    if(bar) bar.setAttribute('content', BAR[t]);
    try { document.dispatchEvent(new Event('imt-theme')); } catch(e){}
  }
  function set(p){
    try {
      if(p === 'auto') window.localStorage.removeItem(KEY); else window.localStorage.setItem(KEY, p);
    } catch(e){}
    apply(p);
  }

  apply(pref());
  if(query){
    var follow = function(){ if(pref() === 'auto') apply('auto'); };
    if(query.addEventListener) query.addEventListener('change', follow); else if(query.addListener) query.addListener(follow);
  }

  window.IMTTheme = {
    get: pref,
    shown: function(){ return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; },
    set: set,
    // flip the theme being shown; returns the one now shown
    toggle: function(){
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      set(next === device() ? 'auto' : next);
      return next;
    }
  };
})();
