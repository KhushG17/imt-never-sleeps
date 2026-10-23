// The loading screen (the #preloader at the top of each public page, styled in css/styles.css).
// The first page of a visit (and every launch of the installed app) shows the logo animation for
// at least 1 s, longer if the page is slow; later pages of the same visit stay quiet unless they
// take more than a third of a second. It fades away when the page has loaded, and always after 8 s.
(function(){
  var el = document.getElementById('preloader');
  if(!el) return;
  var quick = document.documentElement.classList.contains('pre-quick'), MIN = quick ? 0 : 1000, done = false;
  function finish(){
    if(done) return; done = true;
    try { window.sessionStorage.setItem('imt.pre', '1'); } catch(e){}
    el.classList.add('is-done');
    setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); document.documentElement.classList.remove('pre-quick'); }, 700);
  }
  function ready(){ setTimeout(finish, Math.max(0, MIN - (window.performance && performance.now ? performance.now() : 0))); }
  if(document.readyState === 'complete') ready(); else window.addEventListener('load', ready);
  setTimeout(finish, 8000);
})();
