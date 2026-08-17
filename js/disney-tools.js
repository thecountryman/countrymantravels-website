(() => {
  const key = 'countryman-disney-tools-v1';
  const budgetFields = [...document.querySelectorAll('[data-budget-field]')];
  const checkboxes = [...document.querySelectorAll('[data-checklist]')];
  const total = document.querySelector('[data-budget-total]');

  const readState = () => {
    try { return JSON.parse(localStorage.getItem(key)) || {}; }
    catch { return {}; }
  };

  const state = readState();
  const save = () => {
    const next = {
      budget: Object.fromEntries(budgetFields.map(field => [field.dataset.budgetField, field.value])),
      checks: Object.fromEntries(checkboxes.map(field => [field.dataset.checklist, field.checked]))
    };
    localStorage.setItem(key, JSON.stringify(next));
  };

  const updateTotal = () => {
    const amount = budgetFields.reduce((sum, field) => sum + (Number.parseFloat(field.value) || 0), 0);
    if (total) total.textContent = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  budgetFields.forEach(field => {
    field.value = state.budget?.[field.dataset.budgetField] || '';
    field.addEventListener('input', () => { updateTotal(); save(); });
  });

  checkboxes.forEach(field => {
    field.checked = Boolean(state.checks?.[field.dataset.checklist]);
    field.addEventListener('change', save);
  });

  document.querySelector('[data-print-page]')?.addEventListener('click', () => window.print());
  document.querySelector('[data-reset-tools]')?.addEventListener('click', () => {
    if (!window.confirm('Reset the saved Disney World worksheet data on this device?')) return;
    localStorage.removeItem(key);
    budgetFields.forEach(field => { field.value = ''; });
    checkboxes.forEach(field => { field.checked = false; });
    updateTotal();
  });

  updateTotal();
})();
