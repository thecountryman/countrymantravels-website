(() => {
  const form = document.querySelector('[data-email-capture]');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = form.querySelector('.form-status');
    const data = new FormData(form);
    if (!data.get('email')) return;
    form.closest('.lead-capture').classList.add('is-success');
    status.textContent = 'Email delivery is being connected. Your address has not been submitted.';
  });
})();
