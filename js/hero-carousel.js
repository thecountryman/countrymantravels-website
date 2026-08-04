(function () {
  const slides = document.querySelectorAll('.hero-carousel .slide');
  const dots = document.querySelectorAll('.hero-dots span');
  if (!slides.length) return;
  let i = 0;
  setInterval(() => {
    slides[i].classList.remove('active');
    dots[i]?.classList.remove('active');
    i = (i + 1) % slides.length;
    slides[i].classList.add('active');
    dots[i]?.classList.add('active');
  }, 4500);
})();
