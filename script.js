// Program rail: the card nearest the viewport center is "active" (dark text,
// accent eyebrow) like google.org; arrows move one card pitch and disable at the ends.
(function () {
  const carousel = document.querySelector('[data-carousel]');
  if (!carousel) return;
  const track = carousel.querySelector('[data-track]');
  const cards = Array.from(track.querySelectorAll('.card'));
  const prev = carousel.querySelector('[data-prev]');
  const next = carousel.querySelector('[data-next]');

  function pitch() {
    const card = cards[0];
    if (!card) return 378;
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
    return card.getBoundingClientRect().width + gap;
  }

  function activeIndex() {
    const mid = track.getBoundingClientRect().left + track.clientWidth / 2;
    let best = 0, bestDist = Infinity;
    cards.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - mid);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }

  function sync() {
    const i = activeIndex();
    cards.forEach((c, j) => c.classList.toggle('is-active', j === i));
    prev.disabled = i === 0;
    next.disabled = i === cards.length - 1;
  }

  function goTo(i) {
    i = Math.max(0, Math.min(cards.length - 1, i));
    track.scrollTo({ left: i * pitch(), behavior: 'smooth' });
  }

  prev.addEventListener('click', () => goTo(activeIndex() - 1));
  next.addEventListener('click', () => goTo(activeIndex() + 1));
  track.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
  window.addEventListener('resize', () => { goTo(activeIndex()); sync(); });

  // Start on the third card (financial aid) so a landscape card sits on each side.
  const start = Math.min(2, cards.length - 1);
  track.style.scrollBehavior = 'auto';
  track.scrollLeft = start * pitch();
  track.style.scrollBehavior = '';
  sync();
})();

// Mobile menu
(function () {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('mobile-nav');
  if (!toggle || !nav) return;
  const set = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.hidden = !open;
  };
  toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
})();

// Footer year
(function () {
  const y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());
})();
