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
  const OPEN_MS = reduceMotion ? 0 : 360;
  const CLOSE_MS = reduceMotion ? 0 : 240;
  const RISE = 56;   // px the sheet travels while it fades in/out

  const dialog = document.createElement('dialog');
  dialog.className = 'sheet-dialog';
  dialog.innerHTML =
    '<div class="sheet-scrim" data-sheet-close></div>' +
    '<div class="sheet" role="document">' +
      '<div class="sheet-bar">' +
        '<span class="sheet-handle" aria-hidden="true"></span>' +
        '<p class="sheet-kicker" aria-hidden="true"></p>' +
        '<button class="sheet-close" type="button" aria-label="Close article" data-sheet-close autofocus>' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>' +
        '</button>' +
        '<span class="sheet-progress" aria-hidden="true"></span>' +
      '</div>' +
      '<div class="sheet-scroll" tabindex="-1"></div>' +
    '</div>';
  document.body.appendChild(dialog);
  const sheet = dialog.querySelector('.sheet');
  const scrim = dialog.querySelector('.sheet-scrim');
  const bar = dialog.querySelector('.sheet-bar');
  const kicker = dialog.querySelector('.sheet-kicker');
  const scroller = dialog.querySelector('.sheet-scroll');
  const progress = dialog.querySelector('.sheet-progress');

  let current = null;       // id of the open article
  let opener = null;        // element to return focus to
  let pushed = false;       // we added a history entry for this sheet
  let closeTimer = 0;
  let drag = null;          // active grab-bar drag

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
    resetScroll();
  }

  // Every article opens at its top. Reset after layout and again after the
  // open animation, in case focus or late-loading images moved the scroller.
  function resetScroll() {
    scroller.style.scrollBehavior = 'auto';
    scroller.scrollTop = 0;
    requestAnimationFrame(() => { scroller.scrollTop = 0; scroller.style.scrollBehavior = ''; onScroll(); });
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
      // Reserve the scrollbar's width so the page doesn't shift when it locks.
      const sbw = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty('--sbw', (sbw > 0 ? sbw : 0) + 'px');
      document.documentElement.classList.add('sheet-open');
      dialog.showModal();
    }
    // Always animate in from the first keyframe, including when re-opened
    // mid-close; any in-flight close animation is cancelled first.
    stopAnimations();
    sheet.style.transform = '';
    if (!switching) {
      scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: OPEN_MS, easing: 'ease-out' });
      const inAnim = sheet.animate(
        [{ transform: 'translate3d(0,' + RISE + 'px,0)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: OPEN_MS, easing: 'cubic-bezier(.2, .8, .2, 1)' }
      );
      inAnim.onfinish = () => { if (current) resetScroll(); };
    }
    resetScroll();
    scroller.focus({ preventScroll: true });
  }

  function stopAnimations() {
    sheet.getAnimations().forEach((a) => a.cancel());
    scrim.getAnimations().forEach((a) => a.cancel());
  }

  function finishClose() {
    dialog.classList.remove('is-dragging');
    current = null;
    stopAnimations();
    // Start from wherever the sheet is (it may have been dragged), then slide
    // down a little and fade out; the dialog is closed when that finishes.
    const from = sheet.style.transform || 'none';
    const dy = parseFloat((from.match(/,\s*(-?[\d.]+)px/) || [])[1]) || 0;
    scrim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: CLOSE_MS, easing: 'ease-in', fill: 'forwards' });
    const out = sheet.animate(
      [{ transform: 'translate3d(0,' + dy + 'px,0)', opacity: 1 }, { transform: 'translate3d(0,' + (dy + RISE) + 'px,0)', opacity: 0 }],
      { duration: CLOSE_MS, easing: 'ease-in', fill: 'forwards' }
    );
    const done = () => {
      if (current) return;   // re-opened in the meantime
      stopAnimations();
      sheet.style.transform = '';
      if (dialog.open) dialog.close();
      document.documentElement.classList.remove('sheet-open');
      scroller.replaceChildren();
      if (opener && opener.isConnected && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
      opener = null;
    };
    out.onfinish = done;
    closeTimer = setTimeout(() => { if (!current && dialog.open) done(); }, CLOSE_MS + 80);
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
  bar.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('button')) return;
    drag = { id: e.pointerId, y: e.clientY, dy: 0, t: performance.now() };
    bar.setPointerCapture(e.pointerId);
    dialog.classList.add('is-dragging');
  });
  bar.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.dy = Math.max(0, e.clientY - drag.y);
    sheet.style.transform = 'translate3d(0,' + drag.dy + 'px,0)';
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    dialog.classList.remove('is-dragging');
    const fast = d.dy / Math.max(1, performance.now() - d.t) > 0.6;
    if (d.dy > sheet.offsetHeight * 0.25 || (fast && d.dy > 40)) { close(); return; }
    sheet.animate(
      [{ transform: 'translate3d(0,' + d.dy + 'px,0)' }, { transform: 'none' }],
      { duration: reduceMotion ? 0 : 220, easing: 'cubic-bezier(.2, .8, .2, 1)' }
    );
    sheet.style.transform = '';
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
