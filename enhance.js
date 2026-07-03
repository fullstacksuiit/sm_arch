/* ============================================================
   REVAMP LAYER — interactions
   Loaded AFTER script.js. Self-contained; safe to remove.
   ============================================================ */
(function () {
  "use strict";

  const mm = (q) => window.matchMedia(q).matches;
  const reduce = mm("(prefers-reduced-motion: reduce)");
  const canHover = mm("(hover: hover)");
  const root = document.documentElement;

  /* ---------- Scroll progress bar ---------- */
  const prog = document.createElement("div");
  prog.className = "fx-progress";
  prog.setAttribute("aria-hidden", "true");
  document.body.appendChild(prog);
  const updateProg = () => {
    const max = root.scrollHeight - root.clientHeight;
    prog.style.transform = `scaleX(${max > 0 ? root.scrollTop / max : 0})`;
  };
  window.addEventListener("scroll", updateProg, { passive: true });
  window.addEventListener("resize", updateProg);
  updateProg();

  /* ---------- Film grain ---------- */
  if (!reduce) {
    const grain = document.createElement("div");
    grain.className = "fx-grain";
    grain.setAttribute("aria-hidden", "true");
    document.body.appendChild(grain);
  }

  /* ---------- Sticky nav — stays visible while scrolling ---------- */
  const nav = document.getElementById("nav");
  if (nav) nav.classList.remove("nav--hidden");

  /* ---------- Magnetic buttons ---------- */
  if (canHover && !reduce) {
    const strength = 0.3;
    document.querySelectorAll(".btn-solid, .btn-outline, .btn-submit").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) * strength;
        const dy = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
      });
    });
  }

  /* ---------- Contextual "View" cursor over project cards ---------- */
  if (canHover && !reduce) {
    const dot = document.getElementById("cursor");
    const label = document.createElement("div");
    label.className = "fx-cursor-label";
    label.setAttribute("aria-hidden", "true");
    document.body.appendChild(label);

    let lx = window.innerWidth / 2, ly = window.innerHeight / 2;
    let tx = lx, ty = ly, scale = 0, targetScale = 0;

    window.addEventListener(
      "mousemove",
      (e) => { tx = e.clientX; ty = e.clientY; },
      { passive: true }
    );

    const loop = () => {
      lx += (tx - lx) * 0.2;
      ly += (ty - ly) * 0.2;
      scale += (targetScale - scale) * 0.2;
      label.style.opacity = scale;
      label.style.transform = `translate(${lx}px, ${ly}px) translate(-50%, -50%) scale(${scale})`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    // Project cards say "View"; any element with data-cursor="…" sets its own text
    document.querySelectorAll(".project__inner, [data-cursor]").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        label.textContent = el.dataset.cursor || "View";
        targetScale = 1;
        if (dot) dot.classList.add("fx-dim");
      });
      el.addEventListener("mouseleave", () => {
        targetScale = 0;
        if (dot) dot.classList.remove("fx-dim");
      });
    });
  }
})();
