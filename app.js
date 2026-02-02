const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ===== Preloader ===== */
window.addEventListener("load", () => {
  const pre = $("#preloader");
  setTimeout(() => pre.classList.add("hidden"), 650);
});

/* ===== Header behavior ===== */
const header = $("#siteHeader");
let lastY = 0;
window.addEventListener("scroll", () => {
  const y = window.scrollY || 0;
  header.classList.toggle("shrink", y > 16);

  // subtle hide/show
  if (y > lastY && y > 140) header.style.transform = "translateY(-8px)";
  else header.style.transform = "translateY(0)";
  lastY = y;

  // cube speed shift
  const cube = $("#cube");
  if (cube) {
    const seconds = Math.max(5.5, 10 - y / 650);
    cube.style.animationDuration = `${seconds}s`;
  }
});

/* ===== Mobile nav ===== */
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

/* ===== Cursor glow ===== */
const cursorGlow = $("#cursorGlow");
window.addEventListener("pointermove", (e) => {
  if (!cursorGlow) return;
  cursorGlow.style.left = `${e.clientX}px`;
  cursorGlow.style.top = `${e.clientY}px`;
});

/* ===== Reveal on scroll ===== */
const reveals = $$(".reveal");
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("in");
  });
}, { threshold: 0.12 });
reveals.forEach(el => io.observe(el));

/* ===== Count-up stats ===== */
const statNums = $$(".stat__num");
let statsFired = false;

function animateCount(el, target) {
  const isFloat = String(target).includes(".");
  const duration = 1100;
  const start = performance.now();

  function tick(t) {
    const p = Math.min(1, (t - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = (target * eased);
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

/* ===== 3D tilt on cards ===== */
$$(".tilt").forEach(card => {
  let rect;

  card.addEventListener("pointerenter", () => {
    rect = card.getBoundingClientRect();
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = `translateY(0) rotateX(0) rotateY(0)`;
  });

  card.addEventListener("pointermove", (e) => {
    if (!rect) rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const px = (x / rect.width) - 0.5;
    const py = (y / rect.height) - 0.5;

    const max = 10;
    const rotY = px * max;
    const rotX = -py * max;

    card.style.transform = `translateY(-2px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  });
});

/* ===== Deals filtering + cart ===== */
const filterBtns = $$(".filter-btn");
const dealCards = $$("#dealGrid .deal-card");

function setFilter(cat){
  filterBtns.forEach(b => b.classList.toggle("is-active", b.dataset.filter === cat));
  dealCards.forEach(card => {
    const ok = (cat === "all") || (card.dataset.cat === cat);
    // animate out/in without removing from layout
    if (!ok){
      card.style.pointerEvents = "none";
      card.style.opacity = "0";
      card.style.transform = "translateY(14px) scale(.98)";
      card.style.filter = "blur(6px)";
      setTimeout(() => card.style.display = "none", 180);
    } else {
      card.style.display = "block";
      requestAnimationFrame(() => {
        card.style.pointerEvents = "auto";
        card.style.opacity = "1";
        card.style.transform = "translateY(0) scale(1)";
        card.style.filter = "blur(0)";
      });
    }
  });
}

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => setFilter(btn.dataset.filter));
});

// cart mock
let cartCount = 0;
let cartTotal = 0;

const cartCountEl = $("#cartCount");
const cartTotalEl = $("#cartTotal");
const cartNote = $("#cartNote");

function popNote(msg){
  cartNote.textContent = msg;
  setTimeout(() => cartNote.textContent = "", 2600);
}

$$(".add-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".deal-card");
    const price = Number(card?.dataset.price || "0");

    cartCount += 1;
    cartTotal += price;

    cartCountEl.textContent = String(cartCount);
    cartTotalEl.textContent = `$${cartTotal}`;

    // micro animation
    btn.animate([
      { transform: "translateY(0) scale(1)" },
      { transform: "translateY(-4px) scale(1.08)" },
      { transform: "translateY(0) scale(1)" }
    ], { duration: 260, easing: "cubic-bezier(.2,.9,.2,1)" });

    popNote("Added to cart (mock).");
  });
});

$("#clearCart")?.addEventListener("click", () => {
  cartCount = 0;
  cartTotal = 0;
  cartCountEl.textContent = "0";
  cartTotalEl.textContent = "$0";
  popNote("Cart cleared.");
});

/* ===== Contact form fake submit ===== */
$("#contactForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  $("#formNote").textContent = "Message sent! (Template mode — connect to a backend to make it real.)";
  e.target.reset();
  setTimeout(() => $("#formNote").textContent = "", 3200);
});

/* ===== Beacon pulse animation (extra fun) ===== */
$("#pulseBtn")?.addEventListener("click", () => {
  const note = $("#pulseNote");
  note.textContent = "Beacon pinged… aisle lights blinking ✨";
  note.animate(
    [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "translateY(0)" }],
    { duration: 260, easing: "cubic-bezier(.2,.9,.2,1)" }
  );
  setTimeout(() => note.textContent = "", 2600);
});

/* ===== Footer year + top ===== */
$("#year").textContent = new Date().getFullYear().toString();
$("#toTop")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* ======================================================
   Canvas pseudo-3D background (hardware store vibe)
   - Warm/teal dots connected like a "store map grid"
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
  const count = Math.floor((window.innerWidth * window.innerHeight) / 30000);
  for (let i = 0; i < count; i++) {
    particles.push({
      x: (Math.random() * 2 - 1) * 1.2,
      y: (Math.random() * 2 - 1) * 1.2,
      z: Math.random(),
      s: 0.5 + Math.random() * 1.8,
      p: Math.random() * Math.PI * 2
    });
  }
}

function draw(now) {
  if (!canvas || !ctx) return;
  const dt = (now - t0) / 1000;
  t0 = now;

  ctx.clearRect(0, 0, W, H);

  let px = 0, py = 0;
  if (cursorGlow) {
    const cx = parseFloat(cursorGlow.style.left || "0");
    const cy = parseFloat(cursorGlow.style.top || "0");
    px = (cx / window.innerWidth - 0.5) * 2;
    py = (cy / window.innerHeight - 0.5) * 2;
  }

  const centerX = W * 0.5;
  const centerY = H * 0.5;
  const scale = Math.min(W, H) * 0.38;

  const projected = particles.map((pt) => {
    pt.p += dt * (0.8 + pt.z);
    const wobble = Math.sin(pt.p) * 0.03;

    const z = 0.15 + pt.z * 0.85;
    const inv = 1 / (z + 0.25);
    const x = (pt.x + wobble + px * 0.05) * inv;
    const y = (pt.y + wobble + py * 0.05) * inv;

    return { sx: centerX + x * scale, sy: centerY + y * scale, z, r: pt.s * inv * DPR };
  });

  // lines (teal)
  for (let i = 0; i < projected.length; i++) {
    for (let j = i + 1; j < projected.length; j++) {
      const a = projected[i], b = projected[j];
      const dx = a.sx - b.sx;
      const dy = a.sy - b.sy;
      const d2 = dx*dx + dy*dy;
      const maxD = (160 * DPR) ** 2;
      if (d2 < maxD) {
        const alpha = (1 - d2 / maxD) * 0.16;
        ctx.strokeStyle = `rgba(0,224,198,${alpha})`;
        ctx.lineWidth = 1 * DPR;
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.stroke();
      }
    }
  }

  // dots (amber + pink accent)
  for (const p of projected) {
    const alpha = 0.08 + (1 - p.z) * 0.22;
    ctx.fillStyle = `rgba(255,176,0,${alpha})`;
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, Math.max(0.9 * DPR, p.r), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255,78,126,${alpha * 0.45})`;
    ctx.beginPath();
    ctx.arc(p.sx + 1.2 * DPR, p.sy + 0.8 * DPR, Math.max(0.7 * DPR, p.r * 0.7), 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(draw);
}

resize();
requestAnimationFrame(draw);
