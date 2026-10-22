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

// Article sheets. Any element with data-sheet="<id>" opens the article kept in
// <template id="sheet-<id>"> in a bottom sheet. The sheet is a native <dialog>
// (top layer, focus trap, Esc); it slides up over ~90% of the viewport and
// closes with the X button, Esc, a click on the dimmed page, a swipe down on
// the grab bar, or the browser's Back button. The open article is mirrored in
// the URL hash (#financial-aid etc.) so every article has a shareable link.
(function () {
  const templates = Array.from(document.querySelectorAll('template[id^="sheet-"]'));
  if (!templates.length) return;
  const ids = templates.map((t) => t.id.slice(6));
  const has = (id) => ids.includes(id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CLOSE_MS = reduceMotion ? 0 : 440;

  const dialog = document.createElement('dialog');
  dialog.className = 'sheet-dialog';
  dialog.innerHTML =
    '<div class="sheet-scrim" data-sheet-close></div>' +
    '<div class="sheet" role="document">' +
      '<div class="sheet-bar">' +
        '<span class="sheet-handle" aria-hidden="true"></span>' +
        '<p class="sheet-kicker" aria-hidden="true"></p>' +
        '<button class="sheet-close" type="button" aria-label="Close article" data-sheet-close>' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>' +
        '</button>' +
        '<span class="sheet-progress" aria-hidden="true"></span>' +
      '</div>' +
      '<div class="sheet-scroll" tabindex="-1"></div>' +
    '</div>';
  document.body.appendChild(dialog);
  const sheet = dialog.querySelector('.sheet');
  const bar = dialog.querySelector('.sheet-bar');
  const kicker = dialog.querySelector('.sheet-kicker');
  const scroller = dialog.querySelector('.sheet-scroll');
  const progress = dialog.querySelector('.sheet-progress');

  let current = null;       // id of the open article
  let opener = null;        // element to return focus to
  let pushed = false;       // we added a history entry for this sheet
  let closeTimer = 0;

  function render(id) {
    const tpl = document.getElementById('sheet-' + id);
    scroller.replaceChildren(tpl.content.cloneNode(true));
    const art = scroller.querySelector('article');
    const h = art && art.querySelector('h2');
    if (h) { h.id = 'sheet-title-' + id; dialog.setAttribute('aria-labelledby', h.id); }
    kicker.textContent = h ? h.textContent : '';

    // "Up next": the following article in reading order (data-next overrides).
    const nextId = (art && art.dataset.next) || ids[(ids.indexOf(id) + 1) % ids.length];
    const nextTpl = document.getElementById('sheet-' + nextId);
    if (nextTpl && nextId !== id) {
      const na = nextTpl.content.querySelector('article');
      const more = document.createElement('div');
      more.className = 'sheet-more';
      const img = na.querySelector('.article-media img');
      more.innerHTML = '<p class="sheet-more-label">Up next</p>' +
        '<button class="sheet-next" type="button" data-sheet="' + nextId + '">' +
          (img ? '<img src="' + img.getAttribute('src') + '" alt="" loading="lazy">' : '') +
          '<span><span class="eyebrow"></span><span class="t"></span></span>' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>' +
        '</button>';
      more.querySelector('.eyebrow').textContent = (na.querySelector('.eyebrow') || {}).textContent || '';
      more.querySelector('.t').textContent = (na.querySelector('h2') || {}).textContent || '';
      scroller.appendChild(more);
    }
    scroller.scrollTop = 0;
    onScroll();
  }

  function open(id, opts) {
    if (!has(id)) return;
    opts = opts || {};
    clearTimeout(closeTimer);
    if (current === id && dialog.open) return;
    const switching = dialog.open;
    current = id;
    render(id);
    if (opts.history !== false) {
      const url = location.pathname + location.search + '#' + id;
      if (switching && pushed) history.replaceState({ sheet: id }, '', url);
      else { history.pushState({ sheet: id }, '', url); pushed = true; }
    }
    if (!switching) {
      opener = opts.opener || document.activeElement;
      document.documentElement.classList.add('sheet-open');
      dialog.showModal();
      // Next frame so the slide-up transition runs from the closed position.
      requestAnimationFrame(() => requestAnimationFrame(() => dialog.classList.add('is-open')));
    }
    scroller.focus({ preventScroll: true });
  }

  function finishClose() {
    dialog.classList.remove('is-open', 'is-dragging');
    sheet.style.transform = '';
    closeTimer = setTimeout(() => {
      if (dialog.open) dialog.close();
      document.documentElement.classList.remove('sheet-open');
      scroller.replaceChildren();
      if (opener && opener.isConnected && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
      opener = null;
    }, CLOSE_MS);
    current = null;
  }

  // Closing from the UI walks back the history entry we pushed, so the Back
  // button and the X button always agree; popstate then runs finishClose.
  function close() {
    if (!current) return;
    if (pushed) { pushed = false; history.back(); }
    else {
      history.replaceState(null, '', location.pathname + location.search);
      finishClose();
    }
  }

  window.addEventListener('popstate', (e) => {
    const id = (e.state && e.state.sheet) || location.hash.slice(1);
    if (has(id)) { pushed = !!(e.state && e.state.sheet); open(id, { history: false }); }
    else if (current) { pushed = false; finishClose(); }
  });

  // Open from any trigger on the page or inside the sheet ("Up next").
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-sheet]');
    if (t && has(t.dataset.sheet)) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;   // let "open in new tab" work on links
      e.preventDefault();
      open(t.dataset.sheet, { opener: dialog.open ? opener : t });
      return;
    }
    if (e.target.closest('[data-sheet-close]')) { e.preventDefault(); close(); }
  });

  dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(); });   // Esc

  // Reading progress + a hairline under the bar once the article scrolls.
  function onScroll() {
    const max = scroller.scrollHeight - scroller.clientHeight;
    progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, scroller.scrollTop / max) : 0) + ')';
    bar.classList.toggle('is-scrolled', scroller.scrollTop > 120);
  }
  scroller.addEventListener('scroll', onScroll, { passive: true });

  // Swipe down on the grab bar to dismiss.
  let drag = null;
  bar.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('button')) return;
    drag = { id: e.pointerId, y: e.clientY, dy: 0, t: performance.now() };
    bar.setPointerCapture(e.pointerId);
    dialog.classList.add('is-dragging');
  });
  bar.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.dy = Math.max(0, e.clientY - drag.y);
    sheet.style.transform = 'translate(-50%,' + drag.dy + 'px)';
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    dialog.classList.remove('is-dragging');
    const fast = d.dy / Math.max(1, performance.now() - d.t) > 0.6;
    if (d.dy > sheet.offsetHeight * 0.25 || (fast && d.dy > 40)) close();
    else sheet.style.transform = '';
  }
  bar.addEventListener('pointerup', endDrag);
  bar.addEventListener('pointercancel', endDrag);

  // Deep link: /#financial-aid opens that article on load. The entry below it
  // is the plain page, so Back (or X) returns to the page, not off the site.
  const initial = location.hash.slice(1);
  if (has(initial)) {
    history.replaceState(null, '', location.pathname + location.search);
    open(initial);
  }
})();
