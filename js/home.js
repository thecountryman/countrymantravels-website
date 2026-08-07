(() => {
  const form = document.querySelector('[data-email-capture]');
  if (!form) return;

  const status = form.querySelector('.form-status');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    if (!data.get('email')) return;

    if (submitBtn) submitBtn.disabled = true;
    if (status) status.textContent = 'Sending…';

    try {
      const res = await fetch(form.getAttribute('action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(data.entries())),
      });
      const result = await res.json().catch(() => ({}));

      if (res.ok && result.ok !== false) {
        form.closest('.lead-capture').classList.add('is-success');
        if (status) status.textContent = "You're in! Check your inbox for the free tool.";
        form.reset();
      } else {
        if (status) status.textContent = result.error || 'Something went wrong. Please try again.';
        if (submitBtn) submitBtn.disabled = false;
      }
    } catch {
      if (status) status.textContent = 'Something went wrong. Please try again.';
      if (submitBtn) submitBtn.disabled = false;
    }
  });
})();
