// First-touch acquisition attribution. Runs on every page load (the signup form is on
// the home page, but most visitors land on a guide/compare page first).
// Stores in localStorage only: UTM params, the referring HOSTNAME (never the full URL),
// the landing path (no query string) and which ad click-id param was present (never its value).
// signup.js sends it with the waitlist form. Everything is wrapped in try/catch: it must never
// break or block the page.
(function () {
  var FT_KEY = 'acq_ft';
  var LT_KEY = 'acq_lt';
  var MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
  var UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var CLICK_IDS = ['fbclid', 'gclid', 'ttclid'];

  function clean(value, max) {
    var v = String(value == null ? '' : value).trim().toLowerCase().slice(0, max);
    return v === '' ? null : v;
  }

  function bare(host) {
    return String(host || '').toLowerCase().replace(/^www\./, '');
  }

  // Hostname of document.referrer when it is a different site, else null.
  // chatgpt.com and other AI referrers arrive as plain Referer hostnames.
  function referrerHost() {
    try {
      if (!document.referrer) return null;
      var host = bare(new URL(document.referrer).hostname);
      if (!host || host === bare(location.hostname)) return null;
      return host.slice(0, 100);
    } catch (e) {
      return null;
    }
  }

  function buildTouch() {
    var params = new URLSearchParams(location.search);
    var clickId = null;
    for (var i = 0; i < CLICK_IDS.length; i++) {
      if (params.has(CLICK_IDS[i])) { clickId = CLICK_IDS[i]; break; }
    }
    var touch = {};
    UTM.forEach(function (k) { touch[k] = clean(params.get(k), 100); });
    touch.referrer_host = referrerHost();
    touch.landing_path = location.pathname.slice(0, 200);
    touch.click_id_type = clickId;
    touch.ts = new Date().toISOString();
    return touch;
  }

  function read(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function write(key, touch) {
    try { localStorage.setItem(key, JSON.stringify(touch)); } catch (e) {}
  }

  function isFresh(touch) {
    var t = touch && Date.parse(touch.ts);
    return typeof t === 'number' && isFinite(t) && Date.now() - t <= MAX_AGE_MS;
  }

  try {
    var touch = buildTouch();
    if (!isFresh(read(FT_KEY))) {
      write(FT_KEY, touch);
    } else if (UTM.some(function (k) { return touch[k] !== null; })) {
      write(LT_KEY, touch);
    }
  } catch (e) {}

  // Used by signup.js: {ft, lt}, each the stored record or null.
  window.cbAcquisition = function () {
    return { ft: read(FT_KEY), lt: read(LT_KEY) };
  };
})();
