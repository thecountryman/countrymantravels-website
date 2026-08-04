(() => {
  if (document.querySelector('.ct-shell')) return;
  const path = window.location.pathname;
  const destination = path.startsWith('/vegas') ? 'Las Vegas' : path.startsWith('/orlando') ? 'Orlando' : path.startsWith('/anaheim') ? 'Anaheim' : path.startsWith('/nashville') ? 'Nashville' : 'Travel planning';
  const shell = document.createElement('header');
  shell.className = 'ct-shell';
  shell.innerHTML = `<nav class="ct-shell__row" aria-label="Countryman Travels"><a class="ct-shell__brand" href="/"><i></i>Countryman Travels</a><div class="ct-shell__links"><a href="/destinations">Destinations</a><a href="/vegas/">Las Vegas</a><a href="/plan-your-trip">Plan your trip</a><a href="/affiliate-disclosure.html">Disclosure</a><a class="ct-shell__cta" href="/plan-your-trip">Start planning</a></div></nav>`;
  document.body.prepend(shell);
  const footer = document.createElement('footer');
  footer.className = 'ct-footer';
  footer.innerHTML = `<div class="ct-footer__grid"><div><strong>Countryman Travels</strong><p>Independent vacation planning and booking guidance for trips that work in the real world.</p></div><div><h2>Plan</h2><a href="/destinations">Destination hubs</a><a href="/plan-your-trip">Plan your trip</a><a href="/vegas/">Las Vegas</a></div><div><h2>Company</h2><a href="/about.html">About</a><a href="/affiliate-disclosure.html">Affiliate disclosure</a><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a></div></div><div class="ct-footer__bottom">© 2026 Countryman Travels · ${destination} page · Some links may earn a commission at no additional cost to you.</div>`;
  document.body.append(footer);
  document.body.classList.add('ct-shell-ready');
})();
