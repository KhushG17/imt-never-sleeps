// The Mess Menu page. The menu itself is plain HTML (built by scripts/seo.py, so search engines and
// AI assistants can read it without running scripts); this only makes it easy to use: today's menu
// first, then the days after, then the days gone, each marked.
(function(){
  var IMT = window.IMT;
  if(!IMT) return;
  var box = document.getElementById('messDays'), lead = document.getElementById('messLead');
  if(!box) return;
  var today = IMT.istToday(), tomorrow = IMT.addDays(today, 1);
  var days = Array.prototype.slice.call(box.querySelectorAll('.mess-day'));
  function badge(el, text, cls){
    var h = el.querySelector('h2'); if(!h || h.querySelector('.mess-badge')) return;
    var s = document.createElement('span'); s.className = 'mess-badge ' + cls; s.textContent = text; h.appendChild(s);
  }
  var upcoming = days.filter(function(d){ return d.getAttribute('data-date') >= today; });
  var past = days.filter(function(d){ return d.getAttribute('data-date') < today; }).reverse();
  upcoming.concat(past).forEach(function(d){ box.appendChild(d); });
  days.forEach(function(d){
    var date = d.getAttribute('data-date');
    if(date === today){ badge(d, 'Today', 'is-today'); d.classList.add('is-today'); }
    else if(date === tomorrow) badge(d, 'Tomorrow', 'is-next');
    else if(date < today) d.classList.add('is-past');
  });
  if(lead){
    lead.textContent = upcoming.length && upcoming[0].getAttribute('data-date') === today
      ? "Today's menu is first. The days after it follow, and days already gone are dimmed at the end."
      : upcoming.length ? 'There is no menu for today yet; the next day on file is first.' : 'These are the latest days on file.';
  }
})();
