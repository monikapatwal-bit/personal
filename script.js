// ===== NAVIGATION =====
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', open);
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('open');
  });
});

// ===== FADE IN ON SCROLL =====
const fadeEls = document.querySelectorAll('.section-title, .project-card, .skill-group, .about-grid');
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

fadeEls.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
  fadeObserver.observe(el);
});

// ===== SKIP INTRO =====
const skipBtn = document.getElementById('skipIntro');
if (skipBtn) {
  skipBtn.addEventListener('click', () => {
    document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
  });
  skipBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
    }
  });
}

// ===== STAR CANVAS =====
(function () {
  const canvas = document.getElementById('starCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Generate stars once
  const STAR_COUNT = 90;
  const stars = Array.from({ length: STAR_COUNT }, () => ({
    xf: Math.random(),   // fraction of width
    yf: Math.random(),   // fraction of height
    r: Math.random() * 0.9 + 0.25,
    a: Math.random() * 0.45 + 0.12,
  }));

  // A handful of larger "cross" sparkle decorations rendered on canvas
  const crossStars = Array.from({ length: 6 }, () => ({
    xf: Math.random(),
    yf: Math.random(),
    size: Math.random() * 3 + 2,
    a: Math.random() * 0.25 + 0.1,
  }));

  function drawCross(cx, cy, size, alpha) {
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - size, cy);
    ctx.lineTo(cx + size, cy);
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx, cy + size);
    ctx.stroke();
  }

  function draw() {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Draw regular star dots
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.xf * w, s.yf * h, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.a})`;
      ctx.fill();
    });

    // Draw cross sparkles
    crossStars.forEach(s => {
      drawCross(s.xf * w, s.yf * h, s.size, s.a);
    });
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
})();

// ===== SCATTER WORDS PHYSICS =====
(function () {
  const heroEl = document.getElementById('hero');
  const field = document.getElementById('scatterField');
  if (!heroEl || !field) return;

  // Each .sw word is positioned with left/top as % of hero,
  // and CSS transform: translate(-50%,-50%) centers it on that point.
  // We track displacement (dx, dy) and apply an additional transform on top.
  const words = Array.from(field.querySelectorAll('.sw'));

  const particles = words.map(el => {
    // Home position as fraction of hero dimensions
    const leftPct = parseFloat(el.style.left) / 100;
    const topPct  = parseFloat(el.style.top) / 100;
    return {
      el,
      leftPct,
      topPct,
      dx: 0,
      dy: 0,
      vx: 0,
      vy: 0,
    };
  });

  let mouseX = -9999;
  let mouseY = -9999;
  let mouseInHero = false;

  heroEl.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    mouseInHero = true;
  }, { passive: true });

  heroEl.addEventListener('mouseleave', () => {
    mouseInHero = false;
  });

  // Physics constants
  const SPRING     = 0.055;  // how fast words return home
  const DAMPING    = 0.76;   // velocity damping (friction)
  const REPEL_R    = 165;    // repulsion radius in px
  const REPEL_STR  = 15;     // max repulsion acceleration

  function animate() {
    const heroRect = heroEl.getBoundingClientRect();

    particles.forEach(p => {
      // Home position in viewport space
      const homeX = heroRect.left + p.leftPct * heroRect.width;
      const homeY = heroRect.top  + p.topPct  * heroRect.height;

      // Current world position of the word center
      const wx = homeX + p.dx;
      const wy = homeY + p.dy;

      // Spring force pulling back to home (Hooke's law)
      let ax = -p.dx * SPRING;
      let ay = -p.dy * SPRING;

      // Cursor repulsion
      if (mouseInHero) {
        const distX = wx - mouseX;
        const distY = wy - mouseY;
        const dist  = Math.sqrt(distX * distX + distY * distY);
        if (dist < REPEL_R && dist > 0.5) {
          const t = 1 - dist / REPEL_R;       // 0→1 as cursor gets closer
          const strength = t * t * REPEL_STR;
          ax += (distX / dist) * strength;
          ay += (distY / dist) * strength;
        }
      }

      // Integrate velocity → position
      p.vx = (p.vx + ax) * DAMPING;
      p.vy = (p.vy + ay) * DAMPING;
      p.dx += p.vx;
      p.dy += p.vy;

      // Apply only the physics displacement on top of the CSS centering transform
      p.el.style.transform = `translate(calc(-50% + ${p.dx}px), calc(-50% + ${p.dy}px))`;
    });

    requestAnimationFrame(animate);
  }

  animate();
})();

// ===== LIVE CLOCK =====
(function () {
  const clockEl = document.getElementById('liveClock');
  if (!clockEl) return;

  function tick() {
    const now  = new Date();
    let h      = now.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${String(h).padStart(2, '0')}:${m}:${s} ${ampm}`;
  }

  tick();
  setInterval(tick, 1000);
})();
