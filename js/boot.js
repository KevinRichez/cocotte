(function () {
  function show(msg) {
    var el = document.getElementById('boot-error');
    if (!el) {
      el = document.createElement('pre');
      el.id = 'boot-error';
      document.body.appendChild(el);
    }
    el.textContent = 'Oups, erreur de chargement :\n' + msg + '\n\n' + navigator.userAgent;
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
    if (app && !app.children.length) show('L’app ne s’est pas lancée. Recharge la page ou mets ton navigateur à jour.');
  }, 8000);
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
