// Program rail: an endless slider driven by a CSS transform, not native
// scrolling. Native scroll + scroll-snap + mid-fling position jumps fight each
// other and stutter on a fast trackpad fling; here the position is a plain
// number we own. The eight cards are rendered three times; whenever the
// position leaves the middle copy it is shifted by one copy's width, which
// draws the identical picture, so the loop is seamless at any speed.
// Wheel, drag and the arrows all move the same number; it eases toward a
// target and snaps to a card when input stops. The card nearest the center is
// "active" (dark text, accent eyebrow) like google.org.
(function () {
  const carousel = document.querySelector('[data-carousel]');
  if (!carousel) return;
  const track = carousel.querySelector('[data-track]');
  const prev = carousel.querySelector('[data-prev]');
  const next = carousel.querySelector('[data-next]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  let pitch = 0, set = 0, viewW = 0, cardW = 0;
  function measure() {
    const r = cards[0].getBoundingClientRect();
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
    cardW = r.width; pitch = r.width + gap; set = n * pitch;
    viewW = carousel.clientWidth;
  }
  measure();

  // x = distance from the track's left edge to the card that sits in the
  // center. Card i is centered when x === i * pitch. Kept inside the middle
  // copy, [set, 2*set), by wrapping; the same card is drawn either way.
  let x = set + Math.min(2, n - 1) * pitch;   // start on financial aid
  let target = x;
  let activeIdx = -1;

  function wrap() {
    while (x < set) { x += set; target += set; }
    while (x >= 2 * set) { x -= set; target -= set; }
  }

  function render() {
    wrap();
    track.style.transform = 'translate3d(' + (viewW / 2 - cardW / 2 - x) + 'px,0,0)';
    const i = Math.round(x / pitch);
    if (i !== activeIdx) {
      activeIdx = i;
      cards.forEach((c, j) => c.classList.toggle('is-active', j === i));
    }
  }

  // Ease toward the target; the loop stops itself once it arrives.
  let raf = 0;
  function tick() {
    const d = target - x;
    if (Math.abs(d) < 0.5 || reduceMotion) { x = target; render(); raf = 0; return; }
    x += d * 0.16;
    render();
    raf = requestAnimationFrame(tick);
  }
  function animate() { if (!raf) raf = requestAnimationFrame(tick); }
  function snapTo(px) { target = Math.round(px / pitch) * pitch; animate(); }

  // Arrows: one card per click; quick clicks accumulate on the target.
  prev.addEventListener('click', () => { target = Math.round(target / pitch - 1) * pitch; animate(); });
  next.addEventListener('click', () => { target = Math.round(target / pitch + 1) * pitch; animate(); });

  // Wheel / trackpad: horizontal gestures move the rail 1:1 (vertical ones
  // scroll the page as usual); snap to the nearest card when the gesture and
  // its momentum have stopped.
  let wheelTimer = 0;
  carousel.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    const dx = e.deltaMode === 1 ? e.deltaX * 16 : e.deltaMode === 2 ? e.deltaX * viewW : e.deltaX;
    x += dx; target = x; render();
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => snapTo(x), 120);
  }, { passive: false });

  // Drag with mouse or finger; release with momentum, then snap.
  let drag = null;
  carousel.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('button')) return;
    drag = { id: e.pointerId, startX: e.clientX, startPos: x, lastX: e.clientX, lastT: performance.now(), v: 0, moved: false };
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  });
  carousel.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.startX;
    if (!drag.moved && Math.abs(dx) > 5) { drag.moved = true; carousel.setPointerCapture(e.pointerId); carousel.classList.add('is-dragging'); }
    if (!drag.moved) return;
    const now = performance.now();
    drag.v = (e.clientX - drag.lastX) / Math.max(1, now - drag.lastT);
    drag.lastX = e.clientX; drag.lastT = now;
    x = drag.startPos - dx; target = x; render();
  });
  let suppressClick = false;
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    carousel.classList.remove('is-dragging');
    if (!d.moved) return;
    suppressClick = true;           // the click that follows a drag is not a click on the card
    // Carry the release velocity for a beat, capped at a few cards, then snap.
    const fling = Math.max(-pitch * 3, Math.min(pitch * 3, -d.v * 160));
    snapTo(x + fling);
  }
  carousel.addEventListener('pointerup', endDrag);
  carousel.addEventListener('pointercancel', endDrag);
  track.addEventListener('click', (e) => {
    if (suppressClick) { e.preventDefault(); e.stopPropagation(); }
    suppressClick = false;
  }, true);

  // Keyboard focus landing on an off-center card brings it to the center.
  track.addEventListener('focusin', (e) => {
    const card = e.target.closest('.card');
    if (card) snapTo(cards.indexOf(card) * pitch);
  });

  window.addEventListener('resize', () => {
    const i = Math.round(target / pitch);
    measure();
    x = target = i * pitch;
    render();
  });

  render();
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
