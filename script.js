// Program rail: loops forever. The eight real cards are cloned twice on each
// side (five sets in a row, the real set in the middle). As the user scrolls,
// the track silently shifts by one set whenever the position drifts more than
// a set away from the middle, so the same card stays under the viewport and
// there is always two sets of runway in either direction. The card nearest the
// center is "active" (dark text, accent eyebrow) like google.org.
(function () {
  const carousel = document.querySelector('[data-carousel]');
  if (!carousel) return;
  const track = carousel.querySelector('[data-track]');
  const prev = carousel.querySelector('[data-prev]');
  const next = carousel.querySelector('[data-next]');

  const originals = Array.from(track.querySelectorAll('.card'));
  const n = originals.length;
  if (n < 2) return;
  const SETS = 5;                 // clones on each side: (SETS - 1) / 2
  const MID = Math.floor(SETS / 2);

  const clone = (card) => {
    const c = card.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    c.querySelectorAll('a').forEach((a) => a.setAttribute('tabindex', '-1'));
    c.querySelectorAll('img').forEach((img) => img.setAttribute('loading', 'lazy'));
    return c;
  };
  for (let k = 0; k < MID; k++) {
    originals.forEach((card) => track.appendChild(clone(card)));
    originals.slice().reverse().forEach((card) => track.insertBefore(clone(card), track.firstChild));
  }
  const cards = Array.from(track.querySelectorAll('.card'));

  function pitch() {
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
    return cards[0].getBoundingClientRect().width + gap;
  }
  const setWidth = () => n * pitch();

  function activeIndex() {
    return Math.max(0, Math.min(cards.length - 1, Math.round(track.scrollLeft / pitch())));
  }

  function setScroll(x) {
    track.style.scrollBehavior = 'auto';
    track.scrollLeft = x;
    track.style.scrollBehavior = '';
  }

  function sync() {
    const i = activeIndex();
    cards.forEach((c, j) => c.classList.toggle('is-active', j === i));
  }

  // Keep the position within one set of the middle: shift by whole sets, which
  // are also whole pitches, so snap points line up and nothing visibly moves.
  let shifting = false;
  function recenter() {
    if (shifting) return;
    const set = setWidth();
    const x = track.scrollLeft;
    const lo = (MID - 1) * set, hi = (MID + 1) * set;
    if (x >= lo && x <= hi) return;
    const dx = x < lo ? set * Math.ceil((lo - x) / set) : -set * Math.ceil((x - hi) / set);
    shifting = true;
    setScroll(x + dx);
    requestAnimationFrame(() => { shifting = false; });
    // The jump cancels any smooth scroll in flight, so re-aim at the arrows'
    // target (moved by the same number of cards).
    if (target !== null) {
      target += Math.round(dx / pitch());
      track.scrollTo({ left: target * pitch(), behavior: 'smooth' });
    }
  }

  // Arrows drive an explicit target index so quick clicks queue up instead of
  // being lost while the previous smooth scroll is still running.
  let target = null;
  let settle;
  function step(dir) {
    if (target === null) target = activeIndex();
    target += dir;
    track.scrollTo({ left: target * pitch(), behavior: 'smooth' });
  }
  prev.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));

  track.addEventListener('scroll', () => {
    recenter();
    requestAnimationFrame(sync);
    clearTimeout(settle);
    settle = setTimeout(() => {
      // Only forget the arrows' target once the track has actually reached it,
      // so a pause mid-animation doesn't make the next click start from the
      // wrong card.
      if (target !== null && Math.abs(track.scrollLeft - target * pitch()) < 2) target = null;
      recenter(); sync();
    }, 150);
  }, { passive: true });

  window.addEventListener('resize', () => { setScroll(activeIndex() * pitch()); sync(); });

  // Start on the third card (financial aid) of the middle set so a landscape
  // card sits on each side.
  setScroll((MID * n + Math.min(2, n - 1)) * pitch());
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
