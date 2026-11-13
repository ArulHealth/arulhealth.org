// arulhealth.org/research — scroll behaviour for the research index and the
// paper template. Every chart value lives in the HTML; this file only
// reveals figures, counts numbers up, draws the respondent dot grids, drives
// the sticky "scrolly" figure, and tracks the section bar. With JS off the
// pages still read top to bottom with every number visible.
(function () {
  const doc = document.documentElement;
  doc.classList.add('js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  // ---- Reveal + count-up ------------------------------------------------
  function countUp(el) {
    const to = parseFloat(el.dataset.count);
    const dec = (el.dataset.count.split('.')[1] || '').length;
    if (reduce) { el.firstChild.nodeValue = to.toFixed(dec); return; }
    const t0 = performance.now(), dur = 1400;
    (function tick(now) {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 4);
      el.firstChild.nodeValue = (to * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  $$('[data-count]').forEach((el) => {
    // Keep the final value as text for no-JS / copy; animate the first text node.
    if (!el.firstChild || el.firstChild.nodeType !== 3) el.prepend(document.createTextNode(el.dataset.count));
  });
  const seen = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      $$('[data-count]', en.target).concat(en.target.matches('[data-count]') ? [en.target] : []).forEach(countUp);
      seen.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
  $$('.reveal, .fig, .stats').forEach((el) => seen.observe(el));

  // ---- Respondent dot grids --------------------------------------------
  // One dot per respondent. Dots light up in a fixed shuffled order so a
  // share reads as "people scattered through the sample", and stays stable
  // when the share changes between steps.
  function order(n, seed) {
    const a = Array.from({ length: n }, (_, i) => i);
    let s = seed;
    const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function buildDots(el) {
    const n = +el.dataset.dots;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) { const d = document.createElement('i'); d.style.setProperty('--i', i); frag.appendChild(d); }
    el.appendChild(frag);
    el._order = order(n, +(el.dataset.seed || 7));
    setDots(el, +(el.dataset.on || 0), +(el.dataset.hot || 0));
  }
  function setDots(el, on, hot) {
    const kids = el.children;
    el._order.forEach((idx, rank) => {
      kids[idx].classList.toggle('hot', rank < hot);
      kids[idx].classList.toggle('on', rank >= hot && rank < on);
    });
  }
  $$('[data-dots]').forEach(buildDots);

  // ---- Scrolly: the step nearest the middle of the screen drives the figure
  $$('.scrolly').forEach((wrap) => {
    const dots = wrap.querySelector('[data-dots]');
    const big = wrap.querySelector('.scrolly-read b');
    const txt = wrap.querySelector('.scrolly-read span');
    const timed = $$('[data-at]', wrap);   // transcript lines etc. shown from step N on
    const steps = $$('.step', wrap);
    let active = null;
    function activate(step) {
      if (step === active) return;
      active = step;
      const n = steps.indexOf(step);
      steps.forEach((s) => s.classList.toggle('is-active', s === step));
      if (dots) setDots(dots, +step.dataset.on, +step.dataset.hot);
      if (big && step.dataset.read) big.textContent = step.dataset.read;
      if (txt && step.dataset.text) txt.textContent = step.dataset.text;
      timed.forEach((el) => el.classList.toggle('is-on', +el.dataset.at <= n));
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) activate(en.target); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => io.observe(s));
    activate(steps[0]);
  });

  // ---- Paper section bar: scrollspy + reading progress -------------------
  const nav = document.querySelector('.paper-nav');
  if (nav) {
    const links = $$('ol a', nav);
    const secs = links.map((a) => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
    const bar = nav.querySelector('.paper-progress');
    const pct = nav.querySelector('.paper-nav-pct');
    const paper = document.querySelector('.paper');
    let current = -1, ticking = false;
    function update() {
      ticking = false;
      const y = window.scrollY + 120;
      let i = -1;
      secs.forEach((s, k) => { if (s.getBoundingClientRect().top + window.scrollY <= y) i = k; });
      if (i !== current) {
        current = i;
        links.forEach((a, k) => { if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
        const a = links[i];
        if (a) { const ol = a.closest('ol'); ol.scrollTo({ left: a.offsetLeft - ol.offsetLeft - 24, behavior: reduce ? 'auto' : 'smooth' }); }
      }
      const r = paper.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - window.innerHeight)));
      bar.style.setProperty('--p', p.toFixed(4));
      if (pct) pct.textContent = Math.round(p * 100) + '%';
    }
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // ---- Tooltips on chart marks -------------------------------------------
  const tipped = $$('[data-tip]');
  if (tipped.length) {
    const tip = document.createElement('div');
    tip.className = 'tip'; tip.setAttribute('role', 'tooltip');
    document.body.appendChild(tip);
    const place = (x, y) => {
      const w = tip.offsetWidth, h = tip.offsetHeight;
      tip.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x - w / 2)) + 'px';
      tip.style.top = (y - h - 14 < 8 ? y + 18 : y - h - 14) + 'px';
    };
    tipped.forEach((el) => {
      el.addEventListener('pointerenter', (e) => { tip.textContent = el.dataset.tip; tip.classList.add('is-on'); place(e.clientX, e.clientY); });
      el.addEventListener('pointermove', (e) => place(e.clientX, e.clientY));
      el.addEventListener('pointerleave', () => tip.classList.remove('is-on'));
    });
  }

  // ---- Cite: copy ---------------------------------------------------------
  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = document.querySelector(btn.dataset.copy).textContent.trim();
      try { await navigator.clipboard.writeText(text); btn.textContent = 'Copied'; }
      catch (_) { btn.textContent = 'Select the text above to copy'; }
      setTimeout(() => { btn.textContent = 'Copy citation'; }, 2400);
    });
  });

  // ---- Index: filter chips ------------------------------------------------
  const chips = $$('.rx-chip');
  if (chips.length) {
    const tiles = $$('.mosaic .tile');
    const count = document.querySelector('.rx-count');
    function apply(kind) {
      let n = 0;
      tiles.forEach((t) => { const show = kind === 'all' || t.dataset.kind === kind; t.hidden = !show; if (show) n++; });
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === kind)));
      if (count) count.textContent = String(n).padStart(2, '0') + ' / ' + String(tiles.length).padStart(2, '0');
    }
    chips.forEach((c) => c.addEventListener('click', () => apply(c.dataset.filter)));
    apply('all');
  }

  // ---- Index: generated tile art ------------------------------------------
  // Small abstract figures drawn from each tile's own numbers.
  const NS = 'http://www.w3.org/2000/svg';
  const svg = (w, h) => { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', `0 0 ${w} ${h}`); s.setAttribute('preserveAspectRatio', 'xMidYMid slice'); s.setAttribute('aria-hidden', 'true'); return s; };
  const add = (p, tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); p.appendChild(e); return e; };
  const art = {
    // 400 respondents; the share in data-share is lit
    people(el) {
      const cols = 25, rows = 16, s = svg(cols * 20, rows * 20 + 40);
      const ord = order(cols * rows, 11), lit = Math.round(cols * rows * (+el.dataset.share || 0.45));
      const rank = []; ord.forEach((idx, r) => { rank[idx] = r; });
      for (let i = 0; i < cols * rows; i++) {
        add(s, 'circle', { cx: (i % cols) * 20 + 10, cy: Math.floor(i / cols) * 20 + 10, r: 5.2, fill: rank[i] < lit * 0.33 ? '#cffadf' : rank[i] < lit ? '#b592ff' : 'rgba(255,255,255,.14)' });
      }
      return s;
    },
    // concentric arcs, one per value in data-values (0–1)
    rings(el) {
      const s = svg(300, 300), vals = (el.dataset.values || '.4,.31,.3').split(',').map(Number);
      vals.forEach((v, i) => {
        const r = 150 - i * 34, c = 2 * Math.PI * r;
        add(s, 'circle', { cx: 300, cy: 0, r, fill: 'none', stroke: 'currentColor', 'stroke-opacity': .14, 'stroke-width': 18 });
        add(s, 'circle', { cx: 300, cy: 0, r, fill: 'none', stroke: 'currentColor', 'stroke-opacity': .9 - i * .22, 'stroke-width': 18, 'stroke-dasharray': `${c * v * .5} ${c}`, transform: 'rotate(90 300 0)' });
      });
      return s;
    },
    // a voice waveform
    wave() {
      const s = svg(500, 360), n = 56;
      let x = 3;
      const rnd = () => (x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296;
      for (let i = 0; i < n; i++) {
        const env = Math.sin((i / (n - 1)) * Math.PI) * .75 + .25;
        const h = (20 + rnd() * 150) * env;
        add(s, 'rect', { x: 22 + i * 8.2, y: 120 - h / 2, width: 4.4, height: h, rx: 2.2, fill: i % 5 === 0 ? '#cffadf' : '#b592ff', 'fill-opacity': .9 });
      }
      return s;
    },
    // rising columns
    columns() {
      const s = svg(300, 300), hs = [.3, .42, .36, .55, .5, .7, .64, .86];
      hs.forEach((h, i) => add(s, 'rect', { x: 150 + i * 20, y: 150 - h * 130, width: 12, height: h * 130, rx: 3, fill: 'currentColor', 'fill-opacity': .12 + i * .05 }));
      return s;
    },
    // a week of moments: 144 ticks, 7 rows
    ticks() {
      const s = svg(300, 300), ord = order(144, 5);
      for (let i = 0; i < 144; i++) add(s, 'rect', { x: 120 + (i % 24) * 7.2, y: 22 + Math.floor(i / 24) * 16, width: 4, height: 11, rx: 1.5, fill: 'currentColor', 'fill-opacity': ord[i] < 40 ? .85 : .16 });
      return s;
    },
  };
  $$('[data-art]').forEach((el) => { const f = art[el.dataset.art]; if (f) el.appendChild(f(el)); });
})();
