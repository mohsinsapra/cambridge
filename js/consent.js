// Cookie-consent banner + Google Consent Mode.
// Analytics is denied by default (set in <head>) and only granted here
// after an explicit Accept. Choice persists in localStorage.
(function () {
  var KEY = 'cambridge-consent';
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}

  function grant() {
    if (typeof gtag === 'function') gtag('consent', 'update', { analytics_storage: 'granted' });
    if (window.posthog && window.posthog.set_config) window.posthog.set_config({ persistence: 'localStorage+cookie' });
  }

  if (saved === 'granted') { grant(); return; }
  if (saved === 'denied') { return; }

  // Resolve the privacy page from this script's own URL (js/ is one level
  // below the site root), so the link works from every folder depth.
  var privacyUrl = 'privacy.html';
  try {
    var src = document.currentScript && document.currentScript.src;
    if (src) privacyUrl = new URL('../privacy.html', src).href;
  } catch (e) {}

  var bar = document.createElement('div');
  bar.className = 'consent-bar';
  bar.setAttribute('role', 'dialog');
  bar.setAttribute('aria-label', 'Cookie consent');
  bar.innerHTML =
    '<p class="consent-text">We use Google Analytics (anonymized) and PostHog (EU) to see how many people visit. No ads, no personalization. <a href="' + privacyUrl + '">Privacy</a></p>' +
    '<div class="consent-actions">' +
    '<button type="button" class="consent-btn consent-btn--accept">Accept</button>' +
    '<button type="button" class="consent-btn consent-btn--decline">Decline</button>' +
    '</div>';
  document.body.appendChild(bar);

  function close(choice) {
    try { localStorage.setItem(KEY, choice); } catch (e) {}
    bar.remove();
    if (choice === 'granted') grant();
    else if (window.posthog && window.posthog.opt_out_capturing) window.posthog.opt_out_capturing();
  }
  bar.querySelector('.consent-btn--accept').addEventListener('click', function () { close('granted'); });
  bar.querySelector('.consent-btn--decline').addEventListener('click', function () { close('denied'); });
})();
