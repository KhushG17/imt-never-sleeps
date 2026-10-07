// The upload page. Everything here talks to GitHub's API directly from the
// browser; there is no server of our own. The "access key" is a GitHub
// fine-grained token for this one repository (Contents: read and write,
// Actions: read). It is kept in this tab only, or on this device if
// "Remember" is ticked, and is sent nowhere but api.github.com.
//
// Uploading = one commit that adds the chosen PDFs to uploads/_inbox/.
// That commit starts the "Weekly schedule upload" workflow, which runs
// scripts/update.py --uploads and commits the rebuilt weekly data. This page
// then waits for the workflow and shows uploads/last-run.json.
(function(){
"use strict";
  var CFG = (window.PORTAL_CONFIG || {}).upload || {};
  var REPO = CFG.repo, BRANCH = CFG.branch || 'main';
  var API = 'https://api.github.com/repos/' + REPO;
  var STORE = 'imtns-upload-key';
  var MAX_FILE_MB = 20;

  var $ = function(id){ return document.getElementById(id); };
  var signIn = $('signIn'), keyInput = $('key'), remember = $('remember'), signInErr = $('signInErr'), signInBtn = $('signInBtn');
  var uploader = $('uploader'), drop = $('drop'), fileInput = $('files'), fileList = $('fileList');
  var sendBtn = $('sendBtn'), clearFiles = $('clearFiles'), upErr = $('upErr'), signOut = $('signOut');
  var statusBox = $('status'), statusTitle = $('statusTitle'), statusText = $('statusText'), report = $('report'), runLink = $('runLink');

  var key = '';
  var chosen = []; // File objects

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function show(el, text){ el.textContent = text; el.hidden = !text; }

  function gh(path, options){
    options = options || {};
    options.headers = Object.assign({
      'Authorization': 'Bearer ' + key,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }, options.headers || {});
    if(options.body) options.body = JSON.stringify(options.body);
    return fetch(API + path, options).then(function(res){
      if(res.status === 204) return null;
      return res.json().catch(function(){ return {}; }).then(function(data){
        if(!res.ok){
          var err = new Error(data.message || ('GitHub answered ' + res.status));
          err.status = res.status;
          throw err;
        }
        return data;
      });
    });
  }

  // ---- signing in ----
  function enter(){
    signIn.hidden = true;
    uploader.hidden = false;
    signOut.hidden = false;
  }
  function leave(){
    key = '';
    try{ sessionStorage.removeItem(STORE); localStorage.removeItem(STORE); }catch(e){}
    keyInput.value = '';
    chosen = [];
    renderFiles();
    uploader.hidden = true;
    statusBox.hidden = true;
    signOut.hidden = true;
    signIn.hidden = false;
  }
  function check(candidate){
    key = candidate;
    return gh('').then(function(repo){
      if(!repo.permissions || !repo.permissions.push){
        throw new Error('That key can read the site but cannot upload to it. It needs "Contents: Read and write".');
      }
    });
  }
  signIn.addEventListener('submit', function(e){
    e.preventDefault();
    var candidate = keyInput.value.trim();
    if(!candidate) return;
    show(signInErr, '');
    signInBtn.disabled = true;
    check(candidate).then(function(){
      try{
        (remember.checked ? localStorage : sessionStorage).setItem(STORE, candidate);
      }catch(e){}
      enter();
    }).catch(function(err){
      key = '';
      show(signInErr, err.status === 401 ? 'That access key was not accepted. Check it was pasted in full and has not expired.' :
        err.status === 404 ? 'That key does not have access to this site\'s repository.' : err.message);
    }).then(function(){ signInBtn.disabled = false; });
  });
  signOut.addEventListener('click', leave);

  // ---- choosing files ----
  function addFiles(list){
    show(upErr, '');
    var refused = [];
    Array.prototype.forEach.call(list, function(f){
      var isPdf = /\.pdf$/i.test(f.name) || f.type === 'application/pdf';
      if(!isPdf){ refused.push(f.name + ' is not a PDF'); return; }
      if(f.size > MAX_FILE_MB * 1024 * 1024){ refused.push(f.name + ' is larger than ' + MAX_FILE_MB + ' MB'); return; }
      if(chosen.some(function(c){ return c.name === f.name; })) return;
      chosen.push(f);
    });
    if(refused.length) show(upErr, 'Left out: ' + refused.join('; ') + '.');
    renderFiles();
  }
  function renderFiles(){
    fileList.innerHTML = chosen.map(function(f, i){
      return '<li><span class="up-file-name">' + escapeHtml(f.name) + '</span>' +
        '<span class="up-file-size">' + (f.size / 1024 < 1000 ? Math.round(f.size / 1024) + ' KB' : (f.size / 1048576).toFixed(1) + ' MB') + '</span>' +
        '<button type="button" class="up-file-remove" data-i="' + i + '" aria-label="Remove ' + escapeHtml(f.name) + '">Remove</button></li>';
    }).join('');
    fileList.hidden = !chosen.length;
    clearFiles.hidden = !chosen.length;
    sendBtn.disabled = !chosen.length;
    sendBtn.textContent = chosen.length ? 'Upload ' + chosen.length + (chosen.length === 1 ? ' file' : ' files') : 'Upload';
  }
  drop.addEventListener('click', function(){ fileInput.click(); });
  drop.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); fileInput.click(); } });
  fileInput.addEventListener('change', function(){ addFiles(fileInput.files); fileInput.value = ''; });
  ['dragenter', 'dragover'].forEach(function(n){
    drop.addEventListener(n, function(e){ e.preventDefault(); drop.classList.add('is-over'); });
  });
  ['dragleave', 'drop'].forEach(function(n){
    drop.addEventListener(n, function(e){ e.preventDefault(); drop.classList.remove('is-over'); });
  });
  drop.addEventListener('drop', function(e){ addFiles(e.dataTransfer.files); });
  fileList.addEventListener('click', function(e){
    var b = e.target.closest('.up-file-remove');
    if(b){ chosen.splice(+b.getAttribute('data-i'), 1); renderFiles(); }
  });
  clearFiles.addEventListener('click', function(){ chosen = []; renderFiles(); });

  // ---- uploading: one commit holding every file ----
  function toBase64(file){
    return new Promise(function(resolve, reject){
      var r = new FileReader();
      r.onload = function(){ resolve(String(r.result).split(',')[1]); };
      r.onerror = function(){ reject(new Error('Could not read ' + file.name)); };
      r.readAsDataURL(file);
    });
  }
  // a file name GitHub and the workflow are both happy with
  function safeName(name){
    return name.replace(/[\\/:*?"<>|#%]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function commitFiles(files){
    var head, tree = [];
    return gh('/git/ref/heads/' + BRANCH).then(function(ref){
      head = ref.object.sha;
      return files.reduce(function(chain, f){
        return chain.then(function(){ return toBase64(f); }).then(function(b64){
          return gh('/git/blobs', { method: 'POST', body: { content: b64, encoding: 'base64' } });
        }).then(function(blob){
          tree.push({ path: 'uploads/_inbox/' + safeName(f.name), mode: '100644', type: 'blob', sha: blob.sha });
        });
      }, Promise.resolve());
    }).then(function(){
      return gh('/git/commits/' + head);
    }).then(function(commit){
      return gh('/git/trees', { method: 'POST', body: { base_tree: commit.tree.sha, tree: tree } });
    }).then(function(newTree){
      return gh('/git/commits', { method: 'POST', body: {
        message: 'Upload ' + files.length + ' weekly schedule' + (files.length === 1 ? '' : 's'),
        tree: newTree.sha, parents: [head]
      } });
    }).then(function(commit){
      return gh('/git/refs/heads/' + BRANCH, { method: 'PATCH', body: { sha: commit.sha } }).then(function(){ return commit.sha; });
    });
  }

  // ---- waiting for the workflow, then showing its report ----
  function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
  function waitForRun(sha){
    var started = Date.now(), POLL = CFG.pollMs || 5000, LIMIT = 6 * 60 * 1000;
    function poll(){
      return gh('/actions/runs?head_sha=' + sha + '&per_page=5').then(function(data){
        var run = (data.workflow_runs || [])[0];
        if(run){
          runLink.href = run.html_url;
          runLink.hidden = false;
          if(run.status === 'completed') return run;
          show(statusText, 'GitHub is reading the schedules. This usually takes about two minutes; you can leave this page open.');
        }
        if(Date.now() - started > LIMIT) return null;
        return wait(POLL).then(poll);
      });
    }
    return poll();
  }
  function showReport(sentNames){
    return gh('/contents/uploads/last-run.json?ref=' + BRANCH + '&t=' + Date.now()).then(function(file){
      var data = JSON.parse(decodeURIComponent(escape(atob(file.content.replace(/\s/g, '')))));
      var rows = [];
      var mine = data.weeks.filter(function(w){ return sentNames.indexOf(w.file) >= 0; });
      mine.forEach(function(w){
        rows.push('<li class="is-ok"><strong>' + escapeHtml(w.file) + '</strong>Loaded: ' + escapeHtml(w.group.replace('-', ' ')) +
          ', Term ' + w.term + ', ' + escapeHtml(w.start) + ' to ' + escapeHtml(w.end) + ', ' + w.classes + ' classes.</li>');
      });
      data.messages.filter(function(m){ return m.kind === 'SKIPPED' || m.kind === 'INBOX'; }).forEach(function(m){
        rows.push('<li class="is-bad">' + escapeHtml(m.text) + '</li>');
      });
      data.messages.filter(function(m){ return m.kind === 'NOTE'; }).forEach(function(m){
        rows.push('<li class="is-note">' + escapeHtml(m.text) + '</li>');
      });
      var bad = sentNames.length - mine.length;
      show(statusTitle, bad ? mine.length + ' loaded, ' + bad + ' not loaded' : mine.length === 1 ? 'Schedule loaded' : 'All ' + mine.length + ' schedules loaded');
      show(statusText, mine.length ? 'The site will show ' + (mine.length === 1 ? 'it' : 'them') + ' in about a minute.' :
        'Nothing was loaded. See the reasons below.');
      report.innerHTML = rows.join('');
      report.hidden = !rows.length;
    });
  }

  sendBtn.addEventListener('click', function(){
    if(!chosen.length) return;
    var files = chosen.slice();
    var names = files.map(function(f){ return safeName(f.name); });
    show(upErr, '');
    sendBtn.disabled = true;
    drop.classList.add('is-busy');
    report.hidden = true;
    runLink.hidden = true;
    statusBox.hidden = false;
    show(statusTitle, 'Uploading');
    show(statusText, 'Sending ' + files.length + (files.length === 1 ? ' file' : ' files') + ' to GitHub.');
    commitFiles(files).then(function(sha){
      chosen = [];
      renderFiles();
      show(statusTitle, 'Uploaded, now updating the site');
      show(statusText, 'Waiting for GitHub to start reading the schedules.');
      return waitForRun(sha);
    }).then(function(run){
      if(!run){
        show(statusTitle, 'Still running');
        show(statusText, 'The files are uploaded but GitHub has not finished yet. Check the run on GitHub in a few minutes.');
        return;
      }
      if(run.conclusion !== 'success'){
        show(statusTitle, 'The update did not finish');
        show(statusText, 'The files are uploaded, but the step that reads them failed. Open the run on GitHub to see why, and tell Khush.');
        return;
      }
      return showReport(names);
    }).catch(function(err){
      show(statusTitle, 'Upload failed');
      show(statusText, err.status === 401 ? 'Your access key was not accepted any more. Sign out and paste a fresh one.' :
        err.status === 403 || err.status === 404 ? 'This access key is not allowed to do that. It needs "Contents: Read and write" and "Actions: Read" on this repository.' :
        err.message);
    }).then(function(){
      drop.classList.remove('is-busy');
      renderFiles();
    });
  });

  // ---- start ----
  if(!REPO){
    show(signInErr, 'Uploads are not set up: no repository is named in js/portal-config.js.');
    signInBtn.disabled = true;
    return;
  }
  var saved = '';
  try{ saved = sessionStorage.getItem(STORE) || localStorage.getItem(STORE) || ''; }catch(e){}
  if(saved){
    check(saved).then(enter).catch(function(){ key = ''; });
  }
})();
