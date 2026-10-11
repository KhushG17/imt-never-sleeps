// Service worker: what lets the site be installed as an app and still open
// with no signal.
//
// The rule is "fresh first": every page and data file is fetched from the
// network as usual, and a copy is kept. Only when the network fails is the
// kept copy used. So a schedule uploaded a minute ago is never hidden by an
// old copy; the copy is only for the lift, the basement and a dead Wi-Fi.
// Fonts and the PDF library never change at their address, so those are
// served from the kept copy straight away.
var CACHE = 'imt-never-sleeps-v1';
var LIBRARIES = /^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com)\//;

self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(event){
  event.waitUntil(caches.keys().then(function(names){
    return Promise.all(names.filter(function(n){ return n !== CACHE; }).map(function(n){ return caches.delete(n); }));
  }).then(function(){ return self.clients.claim(); }));
});

function keep(request, response){
  if(response && (response.ok || response.type === 'opaque')){
    var copy = response.clone();
    caches.open(CACHE).then(function(cache){ cache.put(request, copy); });
  }
  return response;
}

self.addEventListener('fetch', function(event){
  var request = event.request;
  if(request.method !== 'GET') return;
  var url = new URL(request.url);
  var ours = url.origin === self.location.origin;

  if(LIBRARIES.test(request.url)){
    event.respondWith(caches.match(request).then(function(hit){
      return hit || fetch(request).then(function(response){ return keep(request, response); });
    }));
    return;
  }
  // everything else that is not ours (usage tracking, the upload page's calls
  // to GitHub) is left alone; so is the upload page itself
  if(!ours || url.pathname.indexOf('/upload/') >= 0) return;

  event.respondWith(fetch(request).then(function(response){ return keep(request, response); }).catch(function(){
    // offline: the same address if we have it, else the same page whatever
    // came after the "?" (the roll number, or a file's version stamp)
    return caches.match(request).then(function(hit){
      return hit || caches.match(request, { ignoreSearch: true });
    }).then(function(hit){
      return hit || Response.error();
    });
  }));
});
