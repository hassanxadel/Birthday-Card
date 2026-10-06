const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const teddy = document.getElementById("teddy");
const teddySvg = teddy.querySelector(".teddy");

/* =====================================================
   1. HEADLINE: letters drop in one by one
   ===================================================== */
(function splitHeadline() {
  const h1 = document.querySelector(".hero h1");
  const text = h1.textContent.trim();
  h1.setAttribute("aria-label", text);
  h1.textContent = "";
  let i = 0;
  text.split(" ").forEach((word, wi, words) => {
    const w = document.createElement("span");
    w.className = "word";
    w.setAttribute("aria-hidden", "true");
    [...word].forEach((ch) => {
      const c = document.createElement("span");
      c.className = "char";
      c.textContent = ch;
      c.style.setProperty("--i", i++);
      c.addEventListener("animationend", () => c.classList.add("done"), { once: true });
      w.appendChild(c);
    });
    h1.appendChild(w);
    if (wi < words.length - 1) h1.appendChild(document.createTextNode(" "));
  });
})();

/* =====================================================
   2. SCROLL: things pop in when they come into view
   ===================================================== */
(function revealOnScroll() {
  const targets = document.querySelectorAll(".section h2, .sub, .letter, .gallery figure, .specs li, .title-block");
  targets.forEach((el, n) => el.classList.add("reveal"));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const siblings = [...el.parentElement.children];
      el.style.transitionDelay = siblings.indexOf(el) * 120 + "ms";
      el.classList.add("in");
      setTimeout(() => (el.style.transitionDelay = ""), 1400);
      io.unobserve(el);
    });
  }, { threshold: 0.15 });
  targets.forEach((el) => io.observe(el));
})();

/* =====================================================
   3. THINGS FALLING FROM THE TOP
   ===================================================== */
const rain = document.getElementById("rain");
const toys = ["🧸", "🐻", "🐰", "🎈", "⭐", "💛", "🎀", "🎁", "✨", "🌸", "🐼", "🦄"];

function spawnFall({ fast = false, delay = 0 } = {}) {
  const wrap = document.createElement("div");
  wrap.className = "fall";
  wrap.style.left = rand(2, 96) + "%";
  wrap.style.fontSize = rand(1.3, fast ? 3.2 : 2.4) + "rem";
  wrap.style.opacity = fast ? 1 : 0.75;
  wrap.style.animationDuration = (fast ? rand(3.5, 7) : rand(9, 16)) + "s";
  wrap.style.animationDelay = delay + "s";
  const s = document.createElement("span");
  s.className = "sway";
  s.textContent = pick(toys);
  s.style.animationDuration = rand(1.6, 3.4) + "s";
  wrap.appendChild(s);
  wrap.addEventListener("animationend", (e) => { if (e.target === wrap) wrap.remove(); });
  rain.appendChild(wrap);
}

if (!reduceMotion) {
  for (let i = 0; i < 8; i++) spawnFall({ delay: i * 0.5 });     // first few right away
  setInterval(() => { if (rain.childElementCount < 30 && !document.hidden) spawnFall(); }, 800);
}

function rainBurst(n = 45) {
  for (let i = 0; i < n; i++) spawnFall({ fast: true, delay: rand(0, 2.5) });
}

function floatBalloons(n = 14) {
  const colors = ["🎈", "🎈", "🎈", "🧸", "💛"];
  for (let i = 0; i < n; i++) {
    const b = document.createElement("div");
    b.className = "balloon";
    b.style.left = rand(2, 94) + "%";
    b.style.fontSize = rand(2.4, 4) + "rem";
    b.style.animationDuration = rand(5, 9) + "s";
    b.style.animationDelay = rand(0, 3) + "s";
    const s = document.createElement("span");
    s.textContent = pick(colors);
    s.style.animationDuration = rand(1.5, 3) + "s";
    b.appendChild(s);
    b.addEventListener("animationend", (e) => { if (e.target === b) b.remove(); });
    document.body.appendChild(b);
  }
}

/* =====================================================
   4. MOUSE SPARKLES
   ===================================================== */
if (!reduceMotion) {
  let last = 0;
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const now = performance.now();
    if (now - last < 70) return;
    last = now;
    const sp = document.createElement("span");
    sp.className = "sparkle";
    sp.textContent = pick(["✨", "⭐", "💛"]);
    sp.style.left = e.clientX + "px";
    sp.style.top = e.clientY + "px";
    sp.addEventListener("animationend", () => sp.remove());
    document.body.appendChild(sp);
  });
}

/* =====================================================
   5. FIREWORKS (canvas)
   ===================================================== */
const canvas = document.getElementById("fireworks");
const ctx = canvas.getContext("2d");
const colors = ["#e9b565", "#f4b9c2", "#f7e8d2", "#e5677e", "#9cc9f0", "#ffffff", "#ffd86b"];

let W, H, rockets = [], sparks = [], running = false, pending = 0;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
window.addEventListener("resize", resize);

function kick() {
  if (!running) { running = true; requestAnimationFrame(frame); }
}

function launchRocket(big = false) {
  rockets.push({
    x: rand(W * 0.08, W * 0.92),
    y: H,
    targetY: rand(H * 0.1, H * 0.5),
    vy: -rand(9, 14),
    color: pick(colors),
    big
  });
}

function explode(x, y, color, count = 90) {
  const heart = Math.random() < 0.25;
  const ring = !heart && Math.random() < 0.25;
  const second = pick(colors);
  for (let i = 0; i < count; i++) {
    let vx, vy;
    if (heart) {
      const t = (i / count) * Math.PI * 2;
      vx = 16 * Math.pow(Math.sin(t), 3) * 0.38;
      vy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.38;
    } else {
      const angle = (i / count) * Math.PI * 2 + rand(-0.05, 0.05);
      const speed = ring ? 5 : rand(1.5, 7);
      vx = Math.cos(angle) * speed;
      vy = Math.sin(angle) * speed;
    }
    sparks.push({
      x, y, vx, vy, life: 1,
      decay: rand(0.008, 0.018),
      size: rand(1.8, 3.6),
      color: Math.random() < 0.7 ? color : second
    });
  }
}

function frame() {
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "lighter";

  rockets = rockets.filter((r) => {
    r.y += r.vy;
    r.vy *= 0.985;
    sparks.push({ x: r.x, y: r.y, vx: rand(-0.3, 0.3), vy: rand(0.5, 1.5), life: 0.7, decay: 0.05, size: 1.6, color: r.color });
    ctx.beginPath();
    ctx.fillStyle = "#fff";
    ctx.arc(r.x, r.y, 2.6, 0, Math.PI * 2);
    ctx.fill();
    if (r.y <= r.targetY || r.vy > -2) {
      explode(r.x, r.y, r.color, r.big ? 140 : 90);
      return false;
    }
    return true;
  });

  sparks = sparks.filter((s) => {
    s.x += s.vx;
    s.y += s.vy;
    s.vx *= 0.98;
    s.vy = s.vy * 0.98 + 0.05;
    s.life -= s.decay;
    if (s.life <= 0) return false;
    ctx.globalAlpha = Math.max(s.life, 0);
    ctx.beginPath();
    ctx.fillStyle = s.color;
    ctx.arc(s.x, s.y, s.size * s.life + 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    return true;
  });

  if (rockets.length || sparks.length || pending > 0) {
    requestAnimationFrame(frame);
  } else {
    running = false;
    ctx.clearRect(0, 0, W, H);
  }
}

function schedule(count, startMs, gapMs, big = false) {
  for (let i = 0; i < count; i++) {
    pending++;
    setTimeout(() => { launchRocket(big); pending--; }, startMs + i * gapMs + rand(0, 120));
  }
  kick();
}

/* =====================================================
   6. THE CELEBRATION
   ===================================================== */
const banner = document.getElementById("banner");
const celebrateBtn = document.getElementById("celebrate");
let bannerTimeout;

function jumpTeddy() {
  teddySvg.classList.remove("jump");
  void teddySvg.getBoundingClientRect();     // restart the animation
  teddySvg.classList.add("jump");
}

function celebrate() {
  teddy.classList.add("filled");
  if (reduceMotion) {
    banner.classList.add("show");
    celebrateBtn.textContent = "Again! 🎆";
    window.clearTimeout(bannerTimeout);
    bannerTimeout = window.setTimeout(() => banner.classList.remove("show"), 4000);
    return;
  }

  jumpTeddy();

  banner.classList.remove("show");
  void banner.offsetWidth;
  banner.classList.add("show");

  rainBurst(45);
  floatBalloons(14);

  // the show: three waves, then a big finale
  schedule(6, 300, 350);
  schedule(7, 2800, 300);
  schedule(8, 5300, 260);
  schedule(16, 8000, 140, true);

  // second burst of falling things for the finale
  setTimeout(() => rainBurst(35), 8000);

  celebrateBtn.textContent = "Again! 🎆";
}

celebrateBtn.addEventListener("click", celebrate);

// click the teddy: colour in, hop, and pop a little firework
teddy.addEventListener("click", () => {
  teddy.classList.toggle("filled");
  if (reduceMotion) return;
  jumpTeddy();
  const r = teddySvg.getBoundingClientRect();
  explode(r.left + r.width / 2, r.top + r.height * 0.3, pick(colors), 70);
  kick();
});

// click empty space: pop a firework there
document.addEventListener("click", (e) => {
  if (reduceMotion || e.target.closest("button")) return;
  explode(e.clientX, e.clientY, pick(colors));
  kick();
});
