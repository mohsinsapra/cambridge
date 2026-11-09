// PostHog product analytics (EU cloud). Loaded before consent.js on every page.
// Cookieless (in-memory) until the visitor clicks Accept in the consent banner;
// consent.js then switches it to normal storage so returning visitors are recognised.
// The project key is public by design (it can only send events).
(function () {
  var KEY = 'phc_tBxKRAgGUoFomjnbCfdt6yKGzvboQoJyq45wG2TgyQf9';
  var host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return; // local previews are not counted
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once unregister identify alias reset set_config opt_in_capturing opt_out_capturing has_opted_out_capturing get_distinct_id getFeatureFlag isFeatureEnabled onFeatureFlags people.set people.set_once".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  var granted = false;
  try { granted = localStorage.getItem('cambridge-consent') === 'granted'; } catch (e) {}
  window.posthog.init(KEY, {
    api_host: 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
    persistence: granted ? 'localStorage+cookie' : 'memory',
    capture_pageleave: true
  });
  window.posthog.register({ product: 'cambridge' });
})();
