// Email signup form — posts to the CamBridge signup worker.
(function () {
  var WORKER_URL = "https://cambridge-signup.mohsin-sapra.workers.dev";

  var form = document.getElementById('signupForm');
  if (!form) return;

  var emailInput = document.getElementById('signupEmail');
  var useCaseInput = document.getElementById('signupUseCase');
  var statusEl = document.getElementById('signupStatus');
  var submitBtn = document.getElementById('signupSubmit');
  var originalBtnText = submitBtn ? submitBtn.textContent : 'Join the list';

  function setStatus(message, kind) {
    if (!statusEl) return;
    statusEl.textContent = message || '';
    statusEl.classList.remove('signup-status--success', 'signup-status--error');
    if (kind === 'success') statusEl.classList.add('signup-status--success');
    if (kind === 'error') statusEl.classList.add('signup-status--error');
  }

  function getCheckedValue(name) {
    var checked = form.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : '';
  }

  function getAcquisition() {
    try {
      return typeof window.cbAcquisition === 'function' ? window.cbAcquisition() : { ft: null, lt: null };
    } catch (e) {
      return { ft: null, lt: null };
    }
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var email = (emailInput && emailInput.value || '').trim();
    setStatus('', null);

    if (!email) {
      setStatus('Please enter your email address.', 'error');
      if (emailInput) emailInput.focus();
      return;
    }

    var turnstileInput = form.querySelector('input[name="cf-turnstile-response"]');
    var turnstileToken = turnstileInput ? turnstileInput.value : '';
    if (!turnstileToken) {
      setStatus('Please wait for the bot check to finish, then try again.', 'error');
      return;
    }

    var payload = {
      email: email,
      channel: getCheckedValue('channel') || 'both',
      platform: getCheckedValue('platform') || 'both',
      use_case: (useCaseInput && useCaseInput.value || '').trim(),
      website: (form.querySelector('input[name="website"]') || {}).value || '',
      turnstile_token: turnstileToken,
      // First/last-touch acquisition record from js/attribution.js (null when unavailable).
      acq: getAcquisition()
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Joining…';
    }

    fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        return response.json().catch(function () {
          return null;
        }).then(function (data) {
          return { response: response, data: data };
        });
      })
      .then(function (result) {
        var data = result.data;
        if (data && data.ok) {
          setStatus("You're on the list — thanks!", 'success');
          // GA4 conversion; gtag is the page's existing, consent-mode-gated tag.
          try {
            if (typeof gtag === 'function') gtag('event', 'sign_up', { method: 'waitlist' });
          } catch (e) {}
          if (emailInput) emailInput.value = '';
          if (useCaseInput) useCaseInput.value = '';
        } else {
          var errorMessage = (data && data.error) || 'Something went wrong — please try again.';
          setStatus(errorMessage, 'error');
        }
      })
      .catch(function () {
        setStatus("Couldn't reach the server — check your connection and try again.", 'error');
      })
      .finally(function () {
        // Turnstile tokens are single-use: get a fresh one for any retry.
        if (window.turnstile) window.turnstile.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      });
  });

  // Keep .pill labels visually in sync with their radio's checked state,
  // as a fallback for browsers without :has() support.
  function syncPillGroup(group) {
    group.querySelectorAll('.pill').forEach(function (pill) {
      var input = pill.querySelector('input[type="radio"]');
      if (!input) return;
      pill.classList.toggle('is-active', input.checked);
    });
  }

  document.querySelectorAll('.pill-group').forEach(function (group) {
    syncPillGroup(group);
    group.addEventListener('change', function () {
      syncPillGroup(group);
    });
  });
})();
