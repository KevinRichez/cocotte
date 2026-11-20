(function () {
  function repair() {
    var jobs = [];
    if ('serviceWorker' in navigator) {
      jobs.push(navigator.serviceWorker.getRegistrations().then(function (regs) {
        return Promise.all(regs.map(function (r) { return r.unregister(); }));
      }));
    }
    if (window.caches) {
      jobs.push(caches.keys().then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== 'cocotte-share'; }).map(function (k) { return caches.delete(k); }));
      }));
    }
    return Promise.all(jobs).catch(function () {}).then(function () {
      location.replace(location.pathname);
    });
  }

  if (/[?&]reset\b/.test(location.search)) { repair(); return; }

  function show(msg) {
    var el = document.getElementById('boot-error');
    if (!el) {
      el = document.createElement('div');
      el.id = 'boot-error';
      var pre = document.createElement('pre');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn primary block';
      btn.textContent = 'Réparer et recharger (tes données sont gardées)';
      btn.addEventListener('click', repair);
      el.appendChild(pre);
      el.appendChild(btn);
      document.body.appendChild(el);
    }
    el.firstChild.textContent = 'Oups, erreur de chargement :\n' + msg + '\n\n' + navigator.userAgent;
  }
  window.addEventListener('error', function (e) {
    if (e.message) show(e.message + (e.filename ? '\n' + e.filename.split('/').pop() + ':' + e.lineno : ''));
  });
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'AbortError') return;
    show(String((r && (r.stack || r.message)) || r));
  });
  setTimeout(function () {
    var app = document.getElementById('app');
    if (app && !app.children.length) show('L’app ne s’est pas lancée.');
  }, 6000);
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    var hadController = !!navigator.serviceWorker.controller;
    var reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!hadController || reloaded) return;
      reloaded = true;
      location.reload();
    });
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').then(function (reg) {
        document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') reg.update().catch(function () {}); });
      }).catch(function () {});
    });
  }
})();
