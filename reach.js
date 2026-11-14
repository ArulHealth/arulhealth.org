// arulhealth.org/reach — the living network behind the hero. Points drift
// slowly and link to their neighbours; a few larger "hub" points pulse, and
// points near the cursor light up. Decorative only (the canvas is
// aria-hidden). It draws a single still frame when the visitor prefers
// reduced motion, and stops animating while the hero is off screen.
(function () {
  const canvas = document.querySelector('[data-net]');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LINK = 150;            // px: points closer than this are joined
  let w = 0, h = 0, pts = [], raf = 0, visible = true, t = 0;
  const mouse = { x: -9999, y: -9999 };

  let seed = 17;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Density scales with area, capped so phones and huge screens both stay smooth.
    const n = Math.max(36, Math.min(120, Math.round((w * h) / 11000)));
    seed = 17;
    pts = Array.from({ length: n }, (_, i) => ({
      x: rnd() * w, y: rnd() * h,
      vx: (rnd() - 0.5) * 0.22, vy: (rnd() - 0.5) * 0.22,
      hub: i % 11 === 0, phase: rnd() * Math.PI * 2,
    }));
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j];
        const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 > LINK * LINK) continue;
        const k = 1 - Math.sqrt(d2) / LINK;
        ctx.strokeStyle = (a.hub || b.hub) ? `rgba(207,250,223,${0.55 * k})` : `rgba(181,146,255,${0.42 * k})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    for (const p of pts) {
      const near = Math.max(0, 1 - Math.hypot(p.x - mouse.x, p.y - mouse.y) / 180);
      if (p.hub) {
        const pulse = (Math.sin(t * 0.0016 + p.phase) + 1) / 2;
        ctx.strokeStyle = `rgba(207,250,223,${0.35 * (1 - pulse)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 5 + pulse * 16, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#cffadf';
        ctx.beginPath(); ctx.arc(p.x, p.y, 3.4 + near * 2, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = `rgba(181,146,255,${0.55 + near * 0.45})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.8 + near * 2.2, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function step(now) {
    t = now;
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20; else if (p.y > h + 20) p.y = -20;
    }
    draw();
    if (visible) raf = requestAnimationFrame(step);
  }

  window.addEventListener('resize', resize);
  resize();
  if (reduce) return;   // one still frame, already drawn

  const hero = canvas.parentElement;
  hero.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) raf = requestAnimationFrame(step);
  }).observe(canvas);
})();
