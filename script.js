// Program rail: loops forever. The eight cards are cloned once on each side
// (three copies in a row); the user always scrolls the middle copy, and when a
// scroll settles on a clone the track jumps silently by one set so the same
// card is showing from the middle copy again. The card nearest the center is
// "active" (dark text, accent eyebrow) like google.org.
(function () {
  const carousel = document.querySelector('[data-carousel]');
  if (!carousel) return;
  const track = carousel.querySelector('[data-track]');
  const prev = carousel.querySelector('[data-prev]');
  const next = carousel.querySelector('[data-next]');

  const originals = Array.from(track.querySelectorAll('.card'));
  const n = originals.length;
  if (n < 2) return;

  const clone = (card) => {
    const c = card.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    c.querySelectorAll('a').forEach((a) => a.setAttribute('tabindex', '-1'));
    c.querySelectorAll('img').forEach((img) => img.setAttribute('loading', 'lazy'));
    return c;
  };
  originals.forEach((card) => track.appendChild(clone(card)));
  originals.slice().reverse().forEach((card) => track.insertBefore(clone(card), track.firstChild));

  const cards = Array.from(track.querySelectorAll('.card'));

  function pitch() {
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
    return cards[0].getBoundingClientRect().width + gap;
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

  function jumpTo(i) {
    track.style.scrollBehavior = 'auto';
    track.scrollLeft = i * pitch();
    track.style.scrollBehavior = '';
  }

  function sync() {
    const i = activeIndex();
    cards.forEach((c, j) => c.classList.toggle('is-active', j === i));
  }

  // Once a scroll settles on a clone, jump back into the middle set.
  function normalize() {
    const i = activeIndex();
    if (i < n) jumpTo(i + n);
    else if (i >= 2 * n) jumpTo(i - n);
    sync();
  }

  let settle;
  track.addEventListener('scroll', () => {
    requestAnimationFrame(sync);
    clearTimeout(settle);
    settle = setTimeout(normalize, 120);
  }, { passive: true });
  if ('onscrollend' in window) track.addEventListener('scrollend', normalize);

  function step(dir) {
    clearTimeout(settle);
    normalize();
    track.scrollTo({ left: (activeIndex() + dir) * pitch(), behavior: 'smooth' });
  }
  prev.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  window.addEventListener('resize', () => { jumpTo(activeIndex()); sync(); });

  // Start on the third card (financial aid) of the middle set so a landscape
  // card sits on each side.
  jumpTo(n + Math.min(2, n - 1));
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
