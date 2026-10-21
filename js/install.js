// A small pop-up on the Weekly page offering to install the site as an app.
// It appears once a student has been looking at their schedule for ten
// seconds, and only where installing is actually possible:
//   - Android, Chrome, Edge: the browser has made its install offer
//     (IMT.onInstallable); the pop-up has an Install button.
//   - iPhone, iPad: no site can install itself there, so the pop-up says how
//     (Share, then "Add to Home Screen").
// Never inside the installed app, and not again for a while after "Not now".
// (The nav bar and the greeting card carry "Install as an app" all the time;
// this is the nudge for people who never open the menu.)
(function(){
  var IMT = window.IMT;
  if(!IMT || IMT.installedApp()) return;

  var WAIT_MS = 10000;            // time on the schedule before asking
  var QUIET_DAYS = 7;             // after the cross or Install, leave them alone this long
  var KEY = 'imt.installAsk';
  var ua = window.navigator.userAgent || '';
  var apple = /iphone|ipad|ipod/i.test(ua) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
  var canInstall = false, waited = false, shown = false;

  function askedRecently(){
    try { return Date.now() - (+window.localStorage.getItem(KEY) || 0) < QUIET_DAYS * 86400000; } catch(e){ return false; }
  }
  function remember(){
    try { window.localStorage.setItem(KEY, String(Date.now())); } catch(e){}
  }

  var box = document.createElement('div');
  box.className = 'install-pop';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-label', 'Install IMT Never Sleeps as an app');

  function close(how){
    box.classList.remove('is-on');
    remember();
    if(how) IMT.track('install_popup', null, { tool: 'weekly', result: how });
    setTimeout(function(){ if(box.parentNode) box.parentNode.removeChild(box); }, 300);
  }

  function show(){
    if(shown || !waited || !(canInstall || apple) || askedRecently()) return;
    if(document.hidden || !document.querySelector('#results:not([hidden])')) return;
    shown = true;
    box.innerHTML =
      '<img class="install-pop-icon" src="../assets/icon-192.png?v=standard" alt="" width="40" height="40">' +
      '<div class="install-pop-text"><b>Get the app</b>' +
        '<span>' + (canInstall ? 'Your schedule in one tap.'
                               : 'Tap Share, then "Add to Home Screen".') + '</span></div>' +
      (canInstall ? '<button type="button" class="install-pop-go">Install</button>' : '') +
      '<button type="button" class="install-pop-close" aria-label="Not now">' +
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>';
    // on <html>, not <body>: see the note in js/mess.js
    document.documentElement.appendChild(box);
    window.requestAnimationFrame(function(){ box.classList.add('is-on'); });
    IMT.track('install_popup', null, { tool: 'weekly', result: 'shown' });
  }

  box.addEventListener('click', function(e){
    if(e.target.closest('.install-pop-go')){ close('install'); IMT.install(); }
    else if(e.target.closest('.install-pop-close')){ close('dismissed'); }
  });

  IMT.onInstallable(function(can){
    canInstall = can;
    if(can) show();
    else if(shown && box.classList.contains('is-on')) close('');   // installed, or the offer was used from the nav bar
  });
  setTimeout(function(){ waited = true; show(); }, WAIT_MS);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) show(); });
})();
