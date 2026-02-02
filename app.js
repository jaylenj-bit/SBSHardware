/* =========================
   FORGE HARDWARE — JS
   Animations + 3D tilt + canvas pseudo-3D
   ========================= */

/* ---------- Helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ---------- Preloader ---------- */
window.addEventListener("load", () => {
  const preloader = $("#preloader");
  // Small delay so the loader feels intentional
  setTimeout(() => preloader.classList.add("hidden"), 650);
});

/* ---------- Header shrink on scroll ---------- */
const header = $("#siteHeader");
let lastY = 0;
window.addEventListener("scroll", () => {
  const y = window.scrollY || 0;
  header.classList.toggle("shrink", y > 16);

  // Subtle hide/show as you scroll (feels premium)
  if (y > lastY && y > 140) header.style.transform = "translateY(-8px)";
  else header.style.transform = "translateY(0)";
  lastY = y;
});

/* ---------- Mobile nav ---------- */
const navToggle = $("#navToggle");
const navDrawer = $("#navDrawer");
navToggle?.addEventListener("click", () => {
  const isOpen = navDrawer.classList.toggle("open");
  navDrawer.setAttribute("aria-hidden", String(!isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
});
$$(".nav-drawer a").forEach(a => a.addEventListener("click", () => {
  navDrawer.classList.remove("open");
  navDrawer.setAttribute("aria-hidden", "true");
}));

/* ---------- Cursor glow follow ---------- */
const cursorGlow = $("#cursorGlow");
window.addEventListener("pointermove", (e) => {
  if (!cursorGlow) return;
  cursorGlow.style.left = `${e.clientX}px`;
  cursorGlow.style.top = `${e.clientY}px`;
});

/* ---------- Reveal on scroll (IntersectionObserver) ---------- */
const reveals = $$(".reveal");
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("in");
  });
}, { threshold: 0.12 });

reveals.forEach(el => io.observe(el));

/* ---------- Count-up stats (when visible) ---------- */
const statNums = $$(".stat__num");
let statsFired = false;

function animateCount(el, target) {
  const isFloat = String(target).includes(".");
  const duration = 1100;
  const start = performance.now();

  function tick(t) {
    const p = Math.min(1, (t - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
    const val = (0 + (target - 0) * eased);

    el.textContent = isFloat ? val.toFixed(1) : Math.round(val).toString();
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const statsObserver = new IntersectionObserver((entries) => {
  const anyVisible = entries.some(e => e.isIntersecting);
  if (anyVisible && !statsFired) {
    statsFired = true;
    statNums.forEach(el => animateCount(el, Number(el.dataset.count || "0")));
  }
}, { threshold: 0.4 });

statNums.forEach(el => statsObserver.observe(el));

/* ---------- 3D Tilt on product cards ---------- */
const tiltCards = $$(".tilt");

tiltCards.forEach(card => {
  let rect;

  const onEnter = () => { rect = card.getBoundingClientRect(); };
  const onLeave = () => {
    card.style.transform = `translateY(0) rotateX(0) rotateY(0)`;
  };

  const onMove = (e) => {
    if (!rect) rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const px = (x / rect.width) - 0.5;
    const py = (y / rect.height) - 0.5;

    const max = 10; // degrees
    const rotY = px * max;
    const rotX = -py * max;

    card.style.transform =
      `translateY(-2px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  };

  card.addEventListener("pointerenter", onEnter);
  card.addEventListener("pointerleave", onLeave);
  card.addEventListener("pointermove", onMove);
});

/* ---------- Cube speed changes on scroll (fun 3D touch) ---------- */
const cube = $("#cube");
window.addEventListener("scroll", () => {
  if (!cube) return;
  const y = window.scrollY || 0;
  // Speed up slightly as you scroll down
  const seconds = Math.max(5.5, 10 - y / 600);
  cube.style.animationDuration = `${seconds}s`;
});

/* ---------- Compatibility checker (mock) ---------- */
const budgetRange = $("#budgetRange");
const budgetLabel = $("#budgetLabel");
budgetRange?.addEventListener("input", () => {
  budgetLabel.textContent = `$${budgetRange.value}`;
});

$("#mockCheckBtn")?.addEventListener("click", () => {
  const platform = $("#platformSelect")?.value || "Desktop";
  const goal = $("#goalSelect")?.value || "Gaming";
  const budget = Number(budgetRange?.value || 900);

  const rec =
    budget < 500 ? "Starter kit + upgrade path" :
    budget < 1100 ? "Balanced build + efficient cooling" :
    budget < 1800 ? "High performance + quiet airflow" :
    "Enthusiast tier + premium reliability";

  $("#mockResult").textContent =
    `Result: ${platform} • ${goal} • Budget $${budget} → ${rec}.`;
});

/* ---------- FAQ accordion ---------- */
$$(".faq__q").forEach((btn) => {
  btn.addEventListener("click", () => {
    const expanded = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!expanded));

    const ans = btn.nextElementSibling;
    if (!ans) return;

    if (!expanded) {
      ans.classList.add("open");
      ans.style.maxHeight = ans.scrollHeight + "px";
    } else {
      ans.style.maxHeight = "0px";
      ans.classList.remove("open");
    }
  });
});

/* ---------- Contact form fake submit ---------- */
const form = $("#contactForm");
const formNote = $("#formNote");
form?.addEventListener("submit", (e) => {
  e.preventDefault();
  formNote.textContent = "Sent! (Template mode) — connect to a backend to make this real.";
  form.reset();
  setTimeout(() => formNote.textContent = "", 3200);
});

/* ---------- Footer year + Back to top ---------- */
$("#year").textContent = new Date().getFullYear().toString();
$("#toTop")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* ======================================================
   Canvas pseudo-3D effect
   - A simple particle grid that uses a fake "z depth"
   - Looks 3D-ish without needing Three.js
   ====================================================== */
const canvas = $("#fxCanvas");
const ctx = canvas?.getContext("2d");

let W = 0, H = 0, DPR = Math.min(2, window.devicePixelRatio || 1);
let particles = [];
let t0 = performance.now();

function resize() {
  if (!canvas || !ctx) return;
  W = canvas.width = Math.floor(window.innerWidth * DPR);
  H = canvas.height = Math.floor(window.innerHeight * DPR);
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  initParticles();
}
window.addEventListener("resize", resize);

function initParticles() {
  particles = [];
  // density scales with screen size
  const count = Math.floor((window.innerWidth * window.innerHeight) / 28000);

  for (let i = 0; i < count; i++) {
    particles.push({
      // world coords centered around 0
      x: (Math.random() * 2 - 1) * 1.2,
      y: (Math.random() * 2 - 1) * 1.2,
      z: Math.random(),             // 0..1 depth
      s: 0.5 + Math.random() * 1.8, // size
      p: Math.random() * Math.PI * 2 // phase
    });
  }
}

function draw(now) {
  if (!canvas || !ctx) return;
  const dt = (now - t0) / 1000;
  t0 = now;

  // clear
  ctx.clearRect(0, 0, W, H);

  // slight motion based on pointer (adds depth feeling)
  // we’ll read cursorGlow position if available:
  let px = 0, py = 0;
  if (cursorGlow) {
    const cx = parseFloat(cursorGlow.style.left || "0");
    const cy = parseFloat(cursorGlow.style.top || "0");
    px = (cx / window.innerWidth - 0.5) * 2;
    py = (cy / window.innerHeight - 0.5) * 2;
  }

  // camera-like params
  const centerX = W * 0.5;
  const centerY = H * 0.5;
  const scale = Math.min(W, H) * 0.38;

  // draw connecting lines between close particles (feels like a 3D net)
  // project particles first
  const projected = particles.map((pt) => {
    // animate depth wave
    pt.p += dt * (0.8 + pt.z);
    const wobble = Math.sin(pt.p) * 0.03;

    // fake 3D: bring closer particles larger + slightly offset with cursor
    const z = 0.15 + pt.z * 0.85;
    const inv = 1 / (z + 0.25);
    const x = (pt.x + wobble + px * 0.05) * inv;
    const y = (pt.y + wobble + py * 0.05) * inv;

    return {
      sx: centerX + x * scale,
      sy: centerY + y * scale,
      z,
      r: pt.s * inv * DPR
    };
  });

  // lines
  for (let i = 0; i < projected.length; i++) {
    for (let j = i + 1; j < projected.length; j++) {
      const a = projected[i], b = projected[j];
      const dx = a.sx - b.sx;
      const dy = a.sy - b.sy;
      const d2 = dx*dx + dy*dy;
      const maxD = (160 * DPR) ** 2;
      if (d2 < maxD) {
        const alpha = (1 - d2 / maxD) * 0.18;
        ctx.strokeStyle = `rgba(0,229,255,${alpha})`;
        ctx.lineWidth = 1 * DPR;
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.stroke();
      }
    }
  }

  // dots
  for (const p of projected) {
    const alpha = 0.10 + (1 - p.z) * 0.25;
    ctx.fillStyle = `rgba(124,92,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, Math.max(0.9 * DPR, p.r), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255,79,216,${alpha * 0.55})`;
    ctx.beginPath();
    ctx.arc(p.sx + 1.2 * DPR, p.sy + 0.8 * DPR, Math.max(0.7 * DPR, p.r * 0.7), 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(draw);
}

resize();
requestAnimationFrame(draw);
