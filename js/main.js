// Mobile nav toggle
(function () {
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('primaryNav');
  if (!toggle || !nav) return;

  function setOpen(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () { setOpen(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
  });
})();

// Ambient motion in the product mockups only runs while they are on screen.
// Nothing is hidden before this runs: without JS the page is fully visible.
(function () {
  var targets = document.querySelectorAll('.stage, .vis');
  if (!targets.length) return;
  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('in-view'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      entry.target.classList.toggle('in-view', entry.isIntersecting);
    });
  }, { rootMargin: '80px' });
  targets.forEach(function (el) { io.observe(el); });
})();

// Public beta status (beta-status.json, flipped to "live" automatically when
// Apple approves the build). While a platform is still in Apple's beta review
// its TestFlight link would show "not accepting testers", so point those
// buttons at the email sign-up instead. Links stay real in the HTML.
(function () {
  if (!window.fetch) return;
  fetch('beta-status.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (status) {
      if (!status) return;
      var names = { ios: 'iPhone', mac: 'Mac' };
      document.querySelectorAll('[data-beta]').forEach(function (a) {
        var platform = a.getAttribute('data-beta');
        if (status[platform] === 'live') return;
        // The Mac app has a direct download; only iPhone has to wait.
        var direct = platform === 'mac';
        a.href = direct ? '#mac-download' : '#updates';
        if (!direct) a.classList.add('is-pending');
        if (a.classList.contains('btn')) {
          var icon = a.querySelector('svg');
          a.textContent = direct ? 'Download for Mac' : names[platform] + ' beta opens soon';
          if (icon) a.insertBefore(icon, a.firstChild);
        }
      });
      var banner = document.querySelector('[data-beta-banner]');
      if (banner && (status.ios !== 'live' || status.mac !== 'live')) {
        banner.innerHTML = 'The Mac app is ready: <a href="#mac-download">download CamBridge Studio</a>. ' +
          'The iPhone beta opens soon. <a href="#updates">Leave your email</a> and we\'ll tell you the moment it does.';
      }
    })
    .catch(function () {});
})();

// Copy buttons for the install command.
(function () {
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = document.getElementById(btn.getAttribute('data-copy')).textContent;
      var done = function () {
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = 'Copy'; }, 1800);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {});
    });
  });
})();
