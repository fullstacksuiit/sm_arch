/* ============================================
   Suraj Mishra Architects — interactions
   ============================================ */

(function () {
  "use strict";

  /* ---------- Lenis smooth scroll ----------
     Weighted, momentum scrolling. Lenis still scrolls the real page, so all the
     window.scrollY / "scroll" listeners below keep working unchanged. We drive it
     off the shared rAF loop and skip it entirely for reduced-motion users. */
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (window.Lenis && !prefersReducedMotion) {
    const lenis = new Lenis({
      lerp: 0.1,          // lower = smoother/heavier glide
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false,   // leave touch devices on native scroll (feels better on mobile)
    });
    window.lenis = lenis; // exposed so anchor links can use lenis.scrollTo(target)
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  /* ---------- Loader ---------- */
  const loader = document.getElementById("loader");
  window.addEventListener("load", () => {
    requestAnimationFrame(() => loader.classList.add("fill"));
    setTimeout(() => {
      loader.classList.add("done");
      document.body.classList.add("loaded");
    }, 1400);
  });
  // Fallback if load already fired
  setTimeout(() => {
    if (!document.body.classList.contains("loaded")) {
      loader.classList.add("fill");
      setTimeout(() => {
        loader.classList.add("done");
        document.body.classList.add("loaded");
      }, 900);
    }
  }, 2600);

  /* ---------- Sticky nav ---------- */
  const nav = document.getElementById("nav");
  const onScroll = () => {
    nav.classList.toggle("scrolled", window.scrollY > window.innerHeight * 0.7);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  const setMenu = (open) => {
    toggle.classList.toggle("open", open);
    links.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  };
  toggle.setAttribute("aria-expanded", "false");
  // Contact line at the foot of the mobile menu (injected so every page gets it)
  const navContact = document.createElement("div");
  navContact.className = "nav__contact";
  navContact.innerHTML =
    '<a href="mailto:surajlev@gmail.com">surajlev@gmail.com</a>';
  links.appendChild(navContact);
  toggle.addEventListener("click", () => setMenu(!links.classList.contains("open")));
  links.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => setMenu(false))
  );
  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && links.classList.contains("open")) setMenu(false);
  });
  // Close the menu if the viewport grows back to desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 720) setMenu(false);
  });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
  );
  /* Stagger: items sharing a parent cascade in one after another instead of
     all landing at once. Delay is baked per-element via a CSS var, capped so a
     long grid's last item doesn't crawl in seconds late. */
  const STAGGER_MS = 70; // gap between siblings in a group
  const STAGGER_CAP = 6; // max steps of delay (≈420ms)
  revealEls.forEach((el) => {
    const group = el.parentElement
      ? Array.from(el.parentElement.querySelectorAll(":scope > .reveal"))
      : [el];
    const idx = group.indexOf(el);
    if (idx > 0) {
      el.style.setProperty(
        "--reveal-delay",
        `${Math.min(idx, STAGGER_CAP) * STAGGER_MS}ms`
      );
    }
    io.observe(el);
  });

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll(".stat__num");
  const counterIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const duration = 1600;
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(eased * target);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        counterIO.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );
  counters.forEach((el) => counterIO.observe(el));

  /* ---------- Custom cursor ---------- */
  const cursor = document.getElementById("cursor");
  if (window.matchMedia("(hover: hover)").matches) {
    let cx = window.innerWidth / 2,
      cy = window.innerHeight / 2,
      tx = cx,
      ty = cy;

    window.addEventListener("mousemove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
    });

    const render = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(render);
    };
    render();

    document.querySelectorAll("[data-hover]").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("hover"));
    });
  }

  /* ---------- Contact form ---------- */
  const cform = document.getElementById("cform");
  if (cform) {
    // Prefill the project type from a deep link (contact.html?type=SaaS%20Platform)
    const params = new URLSearchParams(window.location.search);
    const wantType = params.get("type");
    if (wantType) {
      const typeSel = document.getElementById("type");
      if (typeSel) {
        const match = Array.from(typeSel.options).find(
          (o) => o.value.toLowerCase() === wantType.toLowerCase()
        );
        if (match) typeSel.value = match.value;
      }
    }
    cform.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!cform.checkValidity()) {
        cform.reportValidity();
        return;
      }
      const note = document.getElementById("cformNote");
      const btn = cform.querySelector(".btn-submit span");
      if (btn) btn.textContent = "Sent";
      if (note) note.hidden = false;
      cform.querySelectorAll("input, textarea").forEach((el) => (el.value = ""));
      // A real deployment would POST to a backend / form service here.
    });
  }

  /* ---------- Project filters (Work page) ---------- */
  const filterBar = document.getElementById("filters");
  const workGrid = document.getElementById("workGrid");
  const workEmpty = document.getElementById("workEmpty");
  if (filterBar && workGrid) {
    const projects = Array.from(workGrid.querySelectorAll(".project"));
    filterBar.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter");
      if (!btn) return;
      filterBar.querySelectorAll(".filter").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      const cat = btn.dataset.filter;
      let visible = 0;
      projects.forEach((p) => {
        const show = cat === "all" || p.dataset.cat === cat;
        p.style.display = show ? "" : "none";
        if (show) visible++;
      });
      if (workEmpty) workEmpty.classList.toggle("show", visible === 0);
    });
  }

  /* ---------- Subtle hero parallax ---------- */
  const heroImg = document.querySelector(".hero__media img");
  if (heroImg && window.matchMedia("(hover: hover)").matches) {
    window.addEventListener(
      "scroll",
      () => {
        const y = window.scrollY;
        if (y < window.innerHeight) {
          heroImg.style.transform = `scale(1) translateY(${y * 0.18}px)`;
        }
      },
      { passive: true }
    );
  }

  /* ========================================================
     SIGNATURE FEATURES
     ======================================================== */

  /* ---------- 1 · Golden-Hour live clock — hero lighting follows real time ---------- */
  const heroSky = document.getElementById("heroSky");
  const heroSun = document.getElementById("heroSun");
  const heroImgEl = document.getElementById("heroImg");
  const sunTimeEl = document.getElementById("sunTime");
  const sunPhaseEl = document.getElementById("sunPhase");
  if (heroSky && heroSun && heroImgEl) {
    // Keyframe stops across a day (t: 0 dawn → 1 night)
    const stops = [
      { t: 0.0, top: [42, 36, 64],   bot: [201, 138, 94],  sun: [255, 214, 150], b: 0.74, s: 0.3,  label: "Dawn" },
      { t: 0.34, top: [111, 134, 168], bot: [223, 230, 234], sun: [255, 250, 235], b: 1.02, s: 0.0, label: "Midday" },
      { t: 0.66, top: [58, 44, 63],  bot: [224, 168, 96],  sun: [255, 190, 110], b: 0.86, s: 0.32, label: "Golden Hour" },
      { t: 1.0, top: [5, 6, 12],     bot: [18, 19, 31],    sun: [120, 140, 200], b: 0.44, s: 0.1,  label: "Night" },
    ];
    const lerp = (a, b, f) => a + (b - a) * f;
    const mix = (a, b, f) =>
      `rgb(${Math.round(lerp(a[0], b[0], f))},${Math.round(lerp(a[1], b[1], f))},${Math.round(lerp(a[2], b[2], f))})`;
    const applySun = (t) => {
      let i = 0;
      while (i < stops.length - 2 && t > stops[i + 1].t) i++;
      const a = stops[i], b = stops[i + 1];
      const f = (t - a.t) / (b.t - a.t);
      heroSky.style.background = `linear-gradient(to bottom, ${mix(a.top, b.top, f)} 0%, ${mix(a.bot, b.bot, f)} 100%)`;
      const sx = 10 + t * 80; // sun travels left → right
      const sy = 82 - Math.sin(t * Math.PI) * 72; // arc: low → high → low
      heroSun.style.background = `radial-gradient(circle at ${sx}% ${sy}%, ${mix(a.sun, b.sun, f)} 0%, rgba(0,0,0,0) 24%)`;
      heroImgEl.style.filter = `grayscale(0.15) brightness(${lerp(a.b, b.b, f).toFixed(2)}) sepia(${lerp(a.s, b.s, f).toFixed(2)}) saturate(1.06)`;
      if (sunPhaseEl) sunPhaseEl.textContent = f < 0.5 ? a.label : b.label;
    };

    // Map the visitor's local clock (0–24h) to the day-cycle position t (0 dawn → 1 night)
    const anchors = [
      { h: 0,   t: 1.0 },  // deep night
      { h: 5.5, t: 0.0 },  // dawn
      { h: 12,  t: 0.34 }, // midday
      { h: 18,  t: 0.66 }, // golden hour
      { h: 21,  t: 1.0 },  // night
      { h: 24,  t: 1.0 },
    ];
    const timeToT = (h) => {
      let i = 0;
      while (i < anchors.length - 2 && h > anchors[i + 1].h) i++;
      const a = anchors[i], b = anchors[i + 1];
      return lerp(a.t, b.t, (h - a.h) / (b.h - a.h));
    };
    const pad = (n) => String(n).padStart(2, "0");
    const tick = () => {
      const now = new Date();
      applySun(timeToT(now.getHours() + now.getMinutes() / 60));
      if (sunTimeEl) sunTimeEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    };
    tick();
    setInterval(tick, 30000); // refresh every 30s so the clock and light stay live
  }

  /* ---------- 1b · Live weather — real conditions outside the visitor's window ---------- */
  /* Detects the visitor's city (IP, upgraded by GPS if already granted), asks Open-Meteo
     what the sky is doing there right now, and lets it rain/snow/fog over the hero scene —
     as if you were standing inside looking out at their actual weather. */
  const precip = document.getElementById("heroPrecip");
  const weatherEl = document.getElementById("heroWeather");
  const sunbeamEl = document.getElementById("heroSunbeam");
  if (precip && weatherEl) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = precip.getContext("2d");
    let raf = 0, drops = [], mode = null, dpr = 1;

    // Open-Meteo weather codes → what the sky is doing
    // https://open-meteo.com/en/docs  (WMO code table)
    const classify = (code) => {
      if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) return "rain";
      if ([95,96,99].includes(code)) return "storm";
      if ([71,73,75,77,85,86].includes(code)) return "snow";
      if ([45,48].includes(code)) return "fog";
      if ([1,2,3].includes(code)) return "overcast";
      return "clear";
    };
    const labelFor = { rain: "Raining", storm: "Storming", snow: "Snowing", fog: "Foggy", overcast: "Overcast", clear: "Clear skies" };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      precip.width = precip.clientWidth * dpr;
      precip.height = precip.clientHeight * dpr;
    };

    // Seed particles for the active mode (rain streaks or snow flakes)
    const seed = (kind) => {
      const w = precip.width, h = precip.height;
      const density = kind === "snow" ? 0.00009 : 0.00016; // per px²
      const n = Math.round(w * h * density);
      drops = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.4 + Math.random() * 0.9,          // depth → speed & size
        len: kind === "snow" ? 0 : (10 + Math.random() * 18) * dpr,
        sway: Math.random() * Math.PI * 2,
      }));
    };

    const draw = () => {
      const w = precip.width, h = precip.height;
      ctx.clearRect(0, 0, w, h);
      const heavy = mode === "storm";
      if (mode === "snow") {
        ctx.fillStyle = "rgba(236,240,246,0.85)";
        for (const d of drops) {
          d.y += (0.5 + d.z * 0.9) * dpr;
          d.sway += 0.01;
          d.x += Math.sin(d.sway) * 0.4 * dpr;
          if (d.y > h) { d.y = -4 * dpr; d.x = Math.random() * w; }
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.z * 1.6 * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.strokeStyle = heavy ? "rgba(200,214,232,0.42)" : "rgba(198,210,228,0.30)";
        ctx.lineWidth = dpr;
        const slant = heavy ? 2.4 : 1.4; // wind-driven diagonal
        for (const d of drops) {
          const speed = (heavy ? 14 : 9) * d.z * dpr;
          d.y += speed;
          d.x += slant * d.z * dpr;
          if (d.y > h) { d.y = -d.len; d.x = Math.random() * w; }
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - slant * d.z * dpr, d.y - d.len * d.z);
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(draw);
    };

    const stop = () => { cancelAnimationFrame(raf); raf = 0; ctx && ctx.clearRect(0, 0, precip.width, precip.height); };

    // Apply a classified sky to the hero
    const applyWeather = (sky, city) => {
      // Clear skies → warm sunlight streams through the window
      if (sunbeamEl) sunbeamEl.classList.toggle("is-active", sky === "clear");
      // Atmospheric wash (overcast/fog) via the tint layer
      if (sky === "overcast" || sky === "fog") {
        weatherEl.setAttribute("data-sky", sky);
        weatherEl.classList.add("is-active");
      } else {
        weatherEl.classList.remove("is-active");
        weatherEl.removeAttribute("data-sky");
      }
      // Precipitation via the canvas
      const wantsParticles = sky === "rain" || sky === "storm" || sky === "snow";
      if (wantsParticles && !reduceMotion) {
        mode = sky === "storm" ? "storm" : (sky === "snow" ? "snow" : "rain");
        resize();
        seed(mode === "snow" ? "snow" : "rain");
        precip.classList.add("is-active");
        if (!raf) draw();
      } else {
        precip.classList.remove("is-active");
        stop();
        // Reduced-motion or storm/overcast: still hint wet weather with the tint
        if (wantsParticles && reduceMotion) {
          weatherEl.setAttribute("data-sky", "overcast");
          weatherEl.classList.add("is-active");
        }
      }
    };

    window.addEventListener("resize", () => {
      if (raf) { resize(); seed(mode === "snow" ? "snow" : "rain"); }
    });

    // Fetch current conditions for a coordinate, then paint the sky
    const loadWeather = async (lat, lon, city) => {
      try {
        const r = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code,precipitation`
        );
        const j = await r.json();
        const code = j?.current?.weather_code;
        if (typeof code !== "number") return;
        let sky = classify(code);
        // Trust measured precipitation over the code: local showers often fall
        // while the coarse model still reports "overcast" for the grid cell.
        const mm = j?.current?.precipitation;
        if (typeof mm === "number" && mm > 0 && (sky === "overcast" || sky === "clear" || sky === "fog")) {
          sky = "rain";
        }
        applyWeather(sky, city);
      } catch (e) { /* weather is an enhancement — fail silently */ }
    };

    // Step 1: silent city-level location from IP (no permission prompt)
    const locateByIP = async () => {
      try {
        const r = await fetch("https://ipwho.is/?fields=latitude,longitude,city,success");
        const j = await r.json();
        if (j && j.success !== false && typeof j.latitude === "number") {
          loadWeather(j.latitude, j.longitude, j.city);
          return true;
        }
      } catch (e) { /* ignore */ }
      return false;
    };

    // Step 2: upgrade to precise GPS *only* if the visitor already granted it — never prompt
    const upgradeWithGPS = () => {
      if (!navigator.geolocation || !navigator.permissions) return;
      navigator.permissions.query({ name: "geolocation" }).then((p) => {
        if (p.state === "granted") {
          navigator.geolocation.getCurrentPosition(
            (pos) => loadWeather(pos.coords.latitude.toFixed(3), pos.coords.longitude.toFixed(3), null),
            () => {}, { maximumAge: 6e5, timeout: 8000 }
          );
        }
      }).catch(() => {});
    };

    // Preview override: index.html?weather=rain|storm|snow|fog|overcast|clear (for demos/testing)
    const forced = new URLSearchParams(location.search).get("weather");
    if (forced && labelFor[forced]) {
      applyWeather(forced, "your location");
    } else {
      locateByIP();
      upgradeWithGPS();
      // Refresh conditions every 15 min so the scene tracks the real sky
      setInterval(locateByIP, 9e5);
    }
  }

  /* ---------- 2 · Blueprint draws itself ---------- */
  const bpStage = document.getElementById("bpStage");
  if (bpStage) {
    const bpIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            bpStage.classList.add("drawn");
            bpIO.unobserve(bpStage);
          }
        });
      },
      { threshold: 0.35 }
    );
    bpIO.observe(bpStage);
  }

  /* ---------- 3 · Dream-home configurator ---------- */
  const config = document.getElementById("config");
  if (config) {
    const state = { style: "Minimal", material: "Timber", light: "Golden Hour" };
    const styleImg = {
      Minimal: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=78",
      Warm: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=78",
      Brutalist: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1000&q=78",
    };
    const matPalette = {
      Concrete: ["#9a978f", "#c9c3b8", "#4a4744"],
      Timber: ["#a9743f", "#d8b483", "#5a3d24"],
      Stone: ["#8f8a80", "#cfc7b6", "#5c574d"],
    };
    const lightFilter = {
      Dawn: "brightness(0.92) sepia(0.25) saturate(1.05) hue-rotate(-8deg)",
      "Golden Hour": "brightness(1.0) sepia(0.32) saturate(1.15)",
      Dusk: "brightness(0.72) sepia(0.2) saturate(1.1) hue-rotate(-12deg)",
    };
    const cfgImg = document.getElementById("cfgImg");
    const cfgCaption = document.getElementById("cfgCaption");
    const cfgPalette = document.getElementById("cfgPalette");
    const cfgSend = document.getElementById("cfgSend");
    const renderCfg = () => {
      if (cfgImg) { cfgImg.src = styleImg[state.style]; cfgImg.style.filter = lightFilter[state.light]; }
      if (cfgPalette) cfgPalette.innerHTML = matPalette[state.material].map((c) => `<span style="background:${c}"></span>`).join("");
      if (cfgCaption) cfgCaption.textContent = `${state.style} · ${state.material} · ${state.light}`;
      if (cfgSend) cfgSend.href = `contact.html?${new URLSearchParams(state).toString()}`;
    };
    config.querySelectorAll(".config__group").forEach((group) => {
      const key = group.dataset.key;
      group.addEventListener("click", (e) => {
        const btn = e.target.closest(".config__opt");
        if (!btn) return;
        group.querySelectorAll(".config__opt").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        state[key] = btn.dataset.val;
        renderCfg();
      });
    });
    renderCfg();
  }

  /* ---------- 4 · 3D house explorer (Three.js, lazy-loaded) ---------- */
  const canvas = document.getElementById("house3dCanvas");
  const wrap = document.getElementById("house3d");
  if (canvas && wrap) {
    const build3D = () => {
    if (typeof THREE === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0806, 22, 62);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if ("outputEncoding" in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    const camera = new THREE.PerspectiveCamera(34, 1.6, 0.1, 200);
    camera.position.set(15, 9, 17);

    const resize = () => {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    /* ---- Procedural dusk environment (PMREM) → real reflections on glass & steel ---- */
    (() => {
      const c = document.createElement("canvas");
      c.width = 512; c.height = 256;
      const g = c.getContext("2d");
      const sky = g.createLinearGradient(0, 0, 0, 256);
      sky.addColorStop(0.00, "#0d0a06");
      sky.addColorStop(0.42, "#2c210f");
      sky.addColorStop(0.55, "#7a5822");
      sky.addColorStop(0.60, "#a8792f");
      sky.addColorStop(0.64, "#20180e");
      sky.addColorStop(1.00, "#040302");
      g.fillStyle = sky; g.fillRect(0, 0, 512, 256);
      const sun = g.createRadialGradient(360, 150, 4, 360, 150, 150);
      sun.addColorStop(0, "rgba(255,206,138,0.95)");
      sun.addColorStop(1, "rgba(255,206,138,0)");
      g.fillStyle = sun; g.fillRect(0, 0, 512, 256);
      const tex = new THREE.CanvasTexture(c);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      try {
        const pmrem = new THREE.PMREMGenerator(renderer);
        pmrem.compileEquirectangularShader();
        scene.environment = pmrem.fromEquirectangular(tex).texture;
        pmrem.dispose();
      } catch (e) { /* fall back to lights only */ }
      tex.dispose();
    })();

    /* ---- Lighting — cinematic dusk ---- */
    scene.add(new THREE.HemisphereLight(0xffe6c0, 0x0a0806, 0.45));
    const key = new THREE.DirectionalLight(0xffd7a0, 2.4);
    key.position.set(12, 18, 9);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0004;
    key.shadow.radius = 5;
    const sc = key.shadow.camera;
    sc.near = 1; sc.far = 60; sc.left = -18; sc.right = 18; sc.top = 18; sc.bottom = -18;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x6a7ea8, 0.5);
    fill.position.set(-12, 7, -9);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffb058, 0.7);
    rim.position.set(-6, 5, -12);
    scene.add(rim);

    /* ---- Materials ---- */
    const EI = 0.9;
    const concrete   = new THREE.MeshStandardMaterial({ color: 0x2b2721, roughness: 0.82, metalness: 0.02, envMapIntensity: EI });
    const concreteHi = new THREE.MeshStandardMaterial({ color: 0x38322a, roughness: 0.68, metalness: 0.03, envMapIntensity: EI });
    const slabMat    = new THREE.MeshStandardMaterial({ color: 0x413a31, roughness: 0.55, metalness: 0.06, envMapIntensity: EI });
    const steel      = new THREE.MeshStandardMaterial({ color: 0x0e0d0c, roughness: 0.32, metalness: 0.95, envMapIntensity: 1.1 });
    const wood       = new THREE.MeshStandardMaterial({ color: 0x5c3f24, roughness: 0.5,  metalness: 0.0,  envMapIntensity: EI });
    const glass      = new THREE.MeshStandardMaterial({ color: 0x0a0f14, roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.32, envMapIntensity: 1.6 });
    const interior   = new THREE.MeshStandardMaterial({ color: 0xffdca6, emissive: 0xffb45a, emissiveIntensity: 1.35, roughness: 0.85 });
    const water      = new THREE.MeshStandardMaterial({ color: 0x060a0d, roughness: 0.03, metalness: 0.35, envMapIntensity: 1.9 });
    const foliage    = new THREE.MeshStandardMaterial({ color: 0x2c3320, roughness: 0.9, metalness: 0.0, envMapIntensity: 0.5, flatShading: true });

    const villa = new THREE.Group();
    const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
    const put = (geo, mat, x, y, z, cast = true, receive = true) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = cast; m.receiveShadow = receive;
      villa.add(m);
      return m;
    };

    /* ground */
    const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 64),
      new THREE.MeshStandardMaterial({ color: 0x0c0a08, roughness: 0.92, metalness: 0.08, envMapIntensity: 0.4 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    villa.add(ground);

    /* terrace deck / plinth */
    put(B(13, 0.5, 9), concreteHi, 0, 0.25, 0);
    put(B(11.4, 0.08, 7.6), wood, 0, 0.52, 0.4);           // timber deck top
    // floating entry steps
    put(B(3.2, 0.16, 1.1), wood, 0, 0.36, 5.2);
    put(B(3.2, 0.16, 1.1), wood, 0, 0.20, 6.1);

    /* ---- Lower level: glass pavilion with lit interior ---- */
    put(B(6.4, 0.16, 5.4), slabMat, 0, 0.6, 0);            // floor slab
    put(B(6, 3, 0.16), concrete, 0, 2.1, -2.5);            // back wall
    put(B(0.16, 3, 5), concrete, -3, 2.1, 0);              // left wall
    put(B(5.4, 2.3, 0.06), interior, 0, 1.9, -2.4, false); // glowing interior backdrop
    put(B(0.06, 2.3, 4.4), interior, -2.9, 1.9, 0, false); // side glow
    put(B(6.8, 0.34, 5.8), slabMat, 0, 3.75, 0);           // ceiling / cantilever floor
    // full-height glazing (front + right, real transparent glass)
    put(B(6, 3, 0.05), glass, 0, 2.1, 2.55, false);
    put(B(0.05, 3, 5), glass, 3, 2.1, 0, false);

    /* ---- Upper cantilevered volume (solid, ribbon window) ---- */
    const ux = 1.6, uz = -0.5;
    put(B(5.2, 2.6, 4.2), concrete, ux, 5.25, uz);
    put(B(4.6, 0.85, 0.06), interior, ux, 5.15, uz + 2.13, false); // ribbon glow
    put(B(4.7, 0.95, 0.05), glass, ux, 5.15, uz + 2.16, false);    // ribbon glass
    put(B(0.05, 0.95, 3.4), glass, ux + 2.63, 5.15, uz, false);
    put(B(5.9, 0.24, 4.9), slabMat, ux, 6.68, uz);          // roof slab

    /* slender steel columns carrying the deck canopy */
    [[-3.15, 2.35], [3.15, 2.35], [-3.15, -2.35], [3.15, -2.35]].forEach(([x, z]) => {
      put(B(0.13, 3.2, 0.13), steel, x, 2.15, z);
    });

    /* ---- Reflective infinity pool beside the deck ---- */
    put(B(6.4, 0.4, 3.6), concrete, -8.2, 0.2, 1.2);       // pool shell
    put(B(6.0, 0.05, 3.2), water, -8.2, 0.42, 1.2, false, true);

    /* ---- Low-poly landscaping ---- */
    const tree = (x, z, s) => {
      const t = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * s, 0.09 * s, 1.1 * s, 6), wood);
      trunk.position.y = 0.55 * s; trunk.castShadow = true;
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7 * s, 0), foliage);
      crown.position.y = 1.5 * s; crown.castShadow = true;
      crown.scale.y = 1.25;
      t.add(trunk, crown);
      t.position.set(x, 0.5, z);
      villa.add(t);
    };
    tree(6.4, 3.6, 1.15);
    tree(7.4, -2.2, 0.9);
    tree(-4.6, -4.2, 1.0);
    put(B(2.2, 0.5, 1.0), concreteHi, 5.6, 0.75, 3.4);      // planter

    /* ---- Warm interior + landscape point lights ---- */
    const addGlow = (x, y, z, color, intensity, dist) => {
      const l = new THREE.PointLight(color, intensity, dist, 2);
      l.position.set(x, y, z);
      scene.add(l);
    };
    addGlow(0, 2.0, 0, 0xffb45a, 12, 11);        // lower interior
    addGlow(ux, 5.1, uz, 0xffb864, 8, 9);         // upper interior
    addGlow(-8.2, 1.2, 1.2, 0xffc98a, 4, 8);      // pool wash
    // little landscape path lights (emissive beads)
    const bead = new THREE.MeshStandardMaterial({ color: 0xffe4b0, emissive: 0xffcaa0, emissiveIntensity: 2.2, roughness: 0.6 });
    [[1.4, 6.6], [-1.4, 6.6], [2.2, 5.0], [-2.2, 5.0]].forEach(([x, z]) => {
      const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), bead);
      s2.position.set(x, 0.62, z); villa.add(s2);
    });

    scene.add(villa);

    /* ---- Drifting dust motes ---- */
    const MOTES = reduce ? 0 : 150;
    let motes = null, moteVel = null;
    if (MOTES) {
      const pos = new Float32Array(MOTES * 3);
      moteVel = new Float32Array(MOTES);
      for (let i = 0; i < MOTES; i++) {
        pos[i * 3] = (i / MOTES - 0.5) * 34 + Math.sin(i * 12.9) * 6;
        pos[i * 3 + 1] = ((i * 7.3) % 10) + 0.5;
        pos[i * 3 + 2] = Math.cos(i * 4.7) * 11 + Math.sin(i * 3.1) * 5;
        moteVel[i] = 0.12 + ((i * 0.017) % 0.2);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      motes = new THREE.Points(geo, new THREE.PointsMaterial({
        color: 0xffcf94, size: 0.07, transparent: true, opacity: 0.55,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
      }));
      scene.add(motes);
    }

    /* ---- Controls ---- */
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 9;
    controls.maxDistance = 34;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.enablePan = false;
    controls.target.set(-0.4, 2.6, 0);
    controls.autoRotate = !reduce;
    controls.autoRotateSpeed = 0.55;

    resize();
    window.addEventListener("resize", resize);

    // Only render while the canvas is on screen
    let onScreen = true;
    new IntersectionObserver((es) => { onScreen = es[0].isIntersecting; }, { threshold: 0.02 }).observe(wrap);

    /* ---- Intro dolly + render loop ---- */
    const clock = new THREE.Clock();
    let t0 = 0;
    const easeOut = (x) => 1 - Math.pow(1 - x, 3);

    const loop = () => {
      requestAnimationFrame(loop);
      if (!onScreen) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      t0 += dt;

      if (!reduce && t0 < 2.6) {
        const p = easeOut(t0 / 2.6);
        const dist = 26 - 8 * p;
        const ang = 0.72 + 0.12 * (1 - p);
        controls.target.y = 1.4 + 1.2 * p;
        camera.position.set(Math.cos(ang) * dist * 0.62, 5 + 5 * p, Math.sin(ang) * dist);
      }

      if (motes) {
        const a = motes.geometry.attributes.position;
        for (let i = 0; i < MOTES; i++) {
          let y = a.array[i * 3 + 1] + moteVel[i] * dt;
          if (y > 11) y = 0.4;
          a.array[i * 3 + 1] = y;
        }
        a.needsUpdate = true;
        motes.rotation.y += dt * 0.02;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    loop();
    };

    // Fetch Three.js (~heavy) only when the section is about to enter view
    const loadScript = (src) =>
      new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = src; s.async = true; s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    const loadThree = () =>
      window.THREE && window.THREE.OrbitControls
        ? Promise.resolve()
        : loadScript("https://unpkg.com/three@0.128.0/build/three.min.js").then(() =>
            loadScript("https://unpkg.com/three@0.128.0/examples/js/controls/OrbitControls.js")
          );
    const lazy3D = new IntersectionObserver(
      (es) => {
        if (!es[0].isIntersecting) return;
        lazy3D.disconnect();
        loadThree().then(build3D).catch(() => {
          const hint = wrap.querySelector(".house3d__hint");
          if (hint) hint.textContent = "3D preview needs a connection";
        });
      },
      { rootMargin: "300px" }
    );
    lazy3D.observe(wrap);
  }

  /* ========================================================
     MOUSE-REACTIVE DEPTH — tilt · sheen · magnetic · parallax
     ======================================================== */
  const canHover = window.matchMedia("(hover: hover)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (canHover && !reduceMotion) {
    /* (a) 3D tilt + cursor-tracked sheen on cards & media */
    const TILT_SEL =
      ".project__inner, .pitch__media, .pillar, .testi__card, .config__preview, .member, .svc__media";
    document.querySelectorAll(TILT_SEL).forEach((el) => {
      el.classList.add("js-tilt");
      const MAX = 7; // degrees
      let rect = null;
      el.addEventListener("mouseenter", () => {
        rect = el.getBoundingClientRect();
        el.classList.add("tilting");
      });
      el.addEventListener("mousemove", (e) => {
        if (!rect) rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform =
          `perspective(1000px) rotateX(${(-py * MAX).toFixed(2)}deg) rotateY(${(px * MAX).toFixed(2)}deg)`;
        el.style.setProperty("--gx", `${((px + 0.5) * 100).toFixed(1)}%`);
        el.style.setProperty("--gy", `${((py + 0.5) * 100).toFixed(1)}%`);
      });
      el.addEventListener("mouseleave", () => {
        el.classList.remove("tilting");
        el.style.transform = "";
        rect = null;
      });
    });

    /* (b) Magnetic buttons are handled in enhance.js (single owner) */

    /* (c) Hero depth parallax — headline & light drift with the pointer */
    const heroSection = document.getElementById("hero");
    const heroContent = document.querySelector(".hero__content");
    if (heroSection && heroContent) {
      let tx = 0, ty = 0, cx = 0, cy = 0;
      heroSection.addEventListener("mousemove", (e) => {
        const r = heroSection.getBoundingClientRect();
        tx = e.clientX / r.width - 0.5;
        ty = e.clientY / r.height - 0.5;
      });
      heroSection.addEventListener("mouseleave", () => { tx = 0; ty = 0; });
      const heroTick = () => {
        cx += (tx - cx) * 0.07;
        cy += (ty - cy) * 0.07;
        heroContent.style.transform = `translate3d(${(cx * 24).toFixed(1)}px, ${(cy * 16).toFixed(1)}px, 0)`;
        if (typeof heroSun !== "undefined" && heroSun) {
          heroSun.style.transform = `translate3d(${(cx * -46).toFixed(1)}px, ${(cy * -30).toFixed(1)}px, 0)`;
        }
        requestAnimationFrame(heroTick);
      };
      heroTick();
    }
  }

  /* ========================================================
     WebGL LIQUID-RIPPLE on project images (raw GL, no libs)
     ======================================================== */
  if (canHover && !reduceMotion) {
    const supportsGL = (() => {
      try {
        const c = document.createElement("canvas");
        return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
      } catch (e) { return false; }
    })();

    if (supportsGL) {
      const buildProgram = (gl, vsSrc, fsSrc) => {
        const compile = (type, src) => {
          const sh = gl.createShader(type);
          gl.shaderSource(sh, src);
          gl.compileShader(sh);
          if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { gl.deleteShader(sh); return null; }
          return sh;
        };
        const vs = compile(gl.VERTEX_SHADER, vsSrc);
        const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
        if (!vs || !fs) return null;
        const p = gl.createProgram();
        gl.attachShader(p, vs);
        gl.attachShader(p, fs);
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
        return p;
      };

      const VS = "attribute vec2 p; varying vec2 v; void main(){ v = p*0.5+0.5; gl_Position = vec4(p,0.0,1.0); }";
      const FS = [
        "precision mediump float;",
        "varying vec2 v;",
        "uniform sampler2D tex; uniform vec2 canvasRes; uniform vec2 imgRes;",
        "uniform vec2 mouse; uniform float time; uniform float strength;",
        "void main(){",
        "  float cAsp = canvasRes.x/canvasRes.y; float iAsp = imgRes.x/imgRes.y;",
        "  vec2 uv = v; vec2 s = vec2(1.0);",           // object-fit: cover
        "  if(iAsp > cAsp){ s.x = cAsp/iAsp; } else { s.y = iAsp/cAsp; }",
        "  uv = (uv - 0.5)*s + 0.5;",
        "  vec2 dir = uv - mouse; float d = length(dir);",
        "  float wave = sin(d*38.0 - time*6.0) * 0.022 * strength * smoothstep(0.55, 0.0, d);",
        "  uv += normalize(dir + 1e-5) * wave;",
        "  gl_FragColor = texture2D(tex, uv);",
        "}"
      ].join("\n");

      const initRipple = (media) => {
        const img = media.querySelector("img");
        if (!img) return;
        let gl, program, tex, canvas, raf = null, ready = false, built = false, dead = false;
        let strength = 0, target = 0, t0 = performance.now(), nat = [1, 1];
        const mouse = [0.5, 0.5];
        const U = {};

        const resize = () => {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = Math.max(1, Math.floor(media.clientWidth * dpr));
          canvas.height = Math.max(1, Math.floor(media.clientHeight * dpr));
          gl.viewport(0, 0, canvas.width, canvas.height);
        };

        const build = () => {
          canvas = document.createElement("canvas");
          canvas.className = "ripple-canvas";
          media.appendChild(canvas);
          gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
          if (!gl) { canvas.remove(); dead = true; return false; }
          program = buildProgram(gl, VS, FS);
          if (!program) { canvas.remove(); dead = true; return false; }
          gl.useProgram(program);
          const buf = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, buf);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
          const loc = gl.getAttribLocation(program, "p");
          gl.enableVertexAttribArray(loc);
          gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
          ["canvasRes", "imgRes", "mouse", "time", "strength"].forEach((n) => (U[n] = gl.getUniformLocation(program, n)));
          const image = new Image();
          image.crossOrigin = "anonymous";
          image.onload = () => {
            try {
              tex = gl.createTexture();
              gl.bindTexture(gl.TEXTURE_2D, tex);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
              gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
              nat = [image.naturalWidth || 1, image.naturalHeight || 1];
              ready = true;
            } catch (e) { dead = true; }
          };
          image.onerror = () => { dead = true; };
          image.src = img.currentSrc || img.src;
          resize();
          built = true;
          return true;
        };

        const frame = () => {
          strength += (target - strength) * 0.08;
          if (ready && !dead) {
            canvas.style.opacity = "1";
            gl.useProgram(program);
            gl.uniform2f(U.canvasRes, canvas.width, canvas.height);
            gl.uniform2f(U.imgRes, nat[0], nat[1]);
            gl.uniform2f(U.mouse, mouse[0], mouse[1]);
            gl.uniform1f(U.time, (performance.now() - t0) / 1000);
            gl.uniform1f(U.strength, strength);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          }
          if (target > 0 || strength > 0.002) {
            raf = requestAnimationFrame(frame);
          } else {
            raf = null;
            if (canvas) canvas.style.opacity = "0";
          }
        };

        media.addEventListener("mouseenter", () => {
          if (dead) return;
          if (!built && !build()) return;
          resize();
          target = 1;
          if (!raf) raf = requestAnimationFrame(frame);
        });
        media.addEventListener("mouseleave", () => { target = 0; });
        media.addEventListener("mousemove", (e) => {
          const r = media.getBoundingClientRect();
          mouse[0] = (e.clientX - r.left) / r.width;
          mouse[1] = 1 - (e.clientY - r.top) / r.height;
        });
        window.addEventListener("resize", () => { if (built && !dead) resize(); });
      };

      document.querySelectorAll(".project__media").forEach(initRipple);
    }
  }
})();
