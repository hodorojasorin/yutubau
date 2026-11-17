// Proiectul 02 · Șase roluri (cu cheie de acces)
var AUD = {
  nunta:
    "audio/sr-nunta.m4a",
  benz1:
    "audio/sr-benz1.m4a",
  benz2:
    "audio/sr-benz2.m4a",
  parcare:
    "audio/sr-parcare.m4a",
  comentarii:
    "audio/sr-comentarii.m4a",
  viori:
    "audio/sr-viori.m4a",
};
var SB = {
  1: "img/sb/1.webp",
  2: "img/sb/2.webp",
  3: "img/sb/3.webp",
  4: "img/sb/4.webp",
  5: "img/sb/5.webp",
  6: "img/sb/6.webp",
  7: "img/sb/7.webp",
};
// proiectul 02 · Șase roluri (adresa #sase-roluri)
(function () {
  var P = document.getElementById("p-sase-roluri");
  if (!P) return;
  // schițele din storyboard, puse o singură dată și refolosite
  [].slice
    .call(document.querySelectorAll("img[data-sb]"))
    .forEach(function (im) {
      var src = SB[im.getAttribute("data-sb")];
      if (src) im.src = src;
      im.decoding = "async";
    });

  var root = document.documentElement;
  var $ = function (id) {
    return document.getElementById(id);
  };
  var slides = [].slice.call(P.querySelectorAll(".slide"));
  var wipe = $("s-wipe"),
    pager = $("s-pager");
  var links = [].slice.call(P.querySelectorAll(".recbar nav a"));
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cur = -1,
    inProj = false;
  function pad(n) {
    return String(n).padStart(2, "0");
  }

  var dots = slides.map(function (s, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", i + 1 + " · " + s.dataset.name);
    b.addEventListener("click", function () {
      s.scrollIntoView({ behavior: "smooth" });
    });
    pager.appendChild(b);
    return b;
  });
  var count = document.createElement("span");
  count.className = "count";
  pager.appendChild(count);

  function setActive(i) {
    if (i === cur) return;
    var first = cur === -1;
    cur = i;
    slides.forEach(function (s, j) {
      s.classList.toggle("active", j === i);
    });
    dots.forEach(function (d, j) {
      d.classList.toggle("on", j === i);
    });
    count.textContent = pad(i + 1) + " / " + pad(slides.length);
    var id = slides[i].id;
    links.forEach(function (a) {
      a.classList.toggle("on", a.getAttribute("href") === "#" + id);
    });
    if (!first) {
      wipe.classList.remove("go");
      void wipe.offsetWidth;
      wipe.classList.add("go");
    }
    onSlide(slides[i]);
  }
  function pick() {
    var best = 0,
      bi = 0;
    slides.forEach(function (s, j) {
      var r = s.getBoundingClientRect();
      var vis = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
      if (vis > best) {
        best = vis;
        bi = j;
      }
    });
    setActive(bi);
  }
  var ticking = false;
  addEventListener(
    "scroll",
    function () {
      if (!inProj || ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        pick();
      });
    },
    { passive: true },
  );
  addEventListener("resize", function () {
    if (inProj) pick();
  });
  addEventListener("keydown", function (e) {
    if (!inProj) return;
    if (e.key === "Escape") {
      location.href = "index.html";
      return;
    }
    if (e.target.closest && e.target.closest("button,input,textarea"))
      return;
    var k = e.key,
      d = 0;
    if (k === "ArrowDown" || k === "PageDown" || k === " ") d = 1;
    if (k === "ArrowUp" || k === "PageUp") d = -1;
    if (!d) return;
    var n = Math.max(0, Math.min(slides.length - 1, cur + d));
    if (n !== cur) {
      e.preventDefault();
      slides[n].scrollIntoView({ behavior: "smooth" });
    }
  });
  links.forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var t = document.querySelector(a.getAttribute("href"));
      if (t) t.scrollIntoView({ behavior: "smooth" });
    });
  });

  function open() {
    if (inProj) {
      pick();
      return;
    }
    inProj = true;
    P.classList.add("open");
    root.classList.add("in-project", "sr");
    slides.forEach(function (s) {
      s.classList.remove("active");
    });
    cur = -1;
    scrollTo({ top: 0, behavior: "instant" });
    document.title = "Șase roluri · regie Sorin Hodoroja";
    requestAnimationFrame(function () {
      requestAnimationFrame(pick);
    });
  }
  function close() {
    if (!inProj) return;
    inProj = false;
    stopAudio();
    P.classList.remove("open");
    root.classList.remove("sr");
    if (
      location.hash !== "#bau-bau" &&
      location.hash !== "#pascaru" &&
      location.hash !== "#etajul-3" &&
      location.hash !== "#colocviu"
    )
      root.classList.remove("in-project");
  }
  var PIN = "sanutefvta";
  var TAKE = "anaconda";
  var scr = $("clap-screen"),
    scrForm = $("clap-form"),
    scrInput = $("clap-input"),
    scrNote = $("clap-note"),
    scrBack = $("clap-back");
  function ready() {
    try {
      return sessionStorage.getItem("sr-take-ok") === "1";
    } catch (e) {
      return false;
    }
  }
  function markReady() {
    try {
      sessionStorage.setItem("sr-take-ok", "1");
    } catch (e) {}
  }
  var MASKED_IDS = ["sr-title", "sr-desc", "sr-chip1", "sr-chip2"];
  MASKED_IDS.forEach(function (id) {
    var el = $(id);
    if (el) el.dataset.real = el.innerHTML;
  });
  function maskHome() {
    MASKED_IDS.forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.innerHTML = "######";
      el.classList.add("sr-masked");
    });
  }
  function revealHome() {
    MASKED_IDS.forEach(function (id) {
      var el = $(id);
      if (!el || el.dataset.real == null) return;
      el.innerHTML = el.dataset.real;
      el.classList.remove("sr-masked");
    });
  }
  ready() ? revealHome() : maskHome();
  function showScreen() {
    if (!scr) return;
    scrNote.hidden = true;
    scrInput.value = "";
    scr.hidden = false;
    setTimeout(function () {
      scrInput.focus();
    }, 50);
  }
  function hideScreen() {
    if (scr) scr.hidden = true;
  }
  if (scrForm) {
    scrForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (scrInput.value.trim().toLowerCase() === TAKE) {
        markReady();
        revealHome();
        hideScreen();
        open();
        say("Acces permis");
      } else {
        scrNote.hidden = false;
        scrInput.value = "";
        scrInput.focus();
      }
    });
    scrBack.addEventListener("click", function () {
      hideScreen();
      location.href = "index.html";
    });
  }
  function route() {
    if (false) {
      hideScreen();
      close();
      return;
    }
    if (ready()) {
      hideScreen();
      open();
    } else {
      close();
      showScreen();
    }
  }
  addEventListener("hashchange", route);
  $("s-back").addEventListener("click", function () {
    hideScreen();
    location.href = "index.html";
  });

  // ===== scenele animate + muzica =====
  // camera: [timp (s), x, y (centrul cadrului, 0–1 din imagine), zoom]; două chei cu același timp = tăietură
  var SCN = {
    1: {
      L: 28,
      a: ["nunta"],
      cam: [
        [0, 0.12, 0.22, 2.4],
        [2.4, 0.12, 0.22, 2.4],
        [9.5, 0.34, 0.64, 2.4],
        [9.5, 0.74, 0.45, 2.15],
        [18, 0.735, 0.42, 2.3],
        [18, 0.5, 0.5, 1],
        [28, 0.5, 0.5, 1.1],
      ],
    },
    2: {
      L: 45,
      a: ["benz1", "benz2"],
      wob: 1,
      cam: [
        [0, 0.5, 0.5, 1],
        [1.4, 0.5, 0.5, 1.05],
        [2, 0.17, 0.25, 2.95],
        [6, 0.17, 0.27, 3.05],
        [6.6, 0.5, 0.25, 2.95],
        [11, 0.5, 0.27, 3.05],
        [11.6, 0.83, 0.25, 2.95],
        [16, 0.83, 0.27, 3.05],
        [16.6, 0.17, 0.75, 2.95],
        [21, 0.17, 0.73, 3.05],
        [21.6, 0.5, 0.75, 2.95],
        [26, 0.5, 0.73, 3.05],
        [26.6, 0.83, 0.75, 2.95],
        [31.5, 0.83, 0.73, 3.05],
        [32, 0.5, 0.5, 1],
        [45, 0.5, 0.5, 1.12],
      ],
    },
    3: {
      L: 16,
      a: [],
      cam: [
        [0, 0.45, 0.5, 1.05],
        [16, 0.44, 0.4, 1.6],
      ],
    },
    4: {
      L: 35,
      a: ["parcare"],
      wob: 1,
      cam: [
        [0, 0.5, 0.5, 1.05],
        [3, 0.45, 0.55, 1.25],
        [9, 0.37, 0.6, 1.9],
        [15, 0.33, 0.55, 1.95],
        [17, 0.2, 0.33, 2.1],
        [23, 0.2, 0.33, 2.25],
        [25, 0.78, 0.3, 2.2],
        [30.5, 0.78, 0.3, 2.4],
        [31, 0.5, 0.5, 1.05],
        [35, 0.5, 0.5, 1.1],
      ],
    },
    5: {
      L: 27,
      a: ["comentarii"],
      cam: [
        [0, 0.5, 0.5, 1.02],
        [2, 0.5, 0.5, 1.02],
        [2.6, 0.17, 0.45, 2.2],
        [8, 0.17, 0.43, 2.32],
        [8.6, 0.5, 0.45, 2.2],
        [14, 0.5, 0.43, 2.32],
        [14.6, 0.83, 0.45, 2.2],
        [20.6, 0.83, 0.43, 2.4],
        [21.2, 0.5, 0.5, 1.02],
        [27, 0.5, 0.5, 1.06],
      ],
    },
    6: {
      L: 18,
      a: [],
      drums: 1,
      cam: [
        [0, 0.5, 0.5, 1.05],
        [4.6, 0.42, 0.42, 1.7],
        [9, 0.42, 0.4, 1.85],
        [9, 0.62, 0.38, 1.9],
        [13, 0.62, 0.35, 2.05],
        [13, 0.5, 0.5, 1.05],
        [18, 0.5, 0.5, 1.15],
      ],
    },
    7: {
      L: 22,
      a: ["viori"],
      cam: [
        [0, 0.48, 0.45, 3],
        [4.2, 0.48, 0.44, 3.15],
        [4.2, 0.48, 0.44, 3.15],
        [16, 0.5, 0.5, 1],
        [22, 0.5, 0.5, 1],
      ],
    },
  };
  var player = new Audio(),
    soundOn = true,
    blocked = false,
    manual = null, // piesă pornită din slide-ul „Muzica”
    actx = null,
    drumNodes = [];
  player.preload = "auto";
  var eng = { n: 0, el: null, t0: 0, raf: 0, loop: -1, ai: 0 };
  var sndBtn = $("s-snd");
  var playBtns = [].slice.call(P.querySelectorAll(".sr-play"));

  function ease(u) {
    return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
  }
  function camAt(keys, t) {
    var i = 0;
    while (i < keys.length - 1 && keys[i + 1][0] <= t) i++;
    var k = keys[i],
      nx = keys[i + 1];
    if (!nx || nx[0] === k[0]) return k;
    var u = ease((t - k[0]) / (nx[0] - k[0]));
    return [
      t,
      k[1] + (nx[1] - k[1]) * u,
      k[2] + (nx[2] - k[2]) * u,
      k[3] + (nx[3] - k[3]) * u,
    ];
  }
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function pad2(n) {
    return String(n).padStart(2, "0");
  }
  function tick(now) {
    if (!eng.n) return;
    var S = SCN[eng.n],
      el = eng.el;
    var el2 = (now - eng.t0) / 1000;
    var lp = Math.floor(el2 / S.L),
      t = el2 - lp * S.L;
    if (lp !== eng.loop) {
      eng.loop = lp;
      if (S.drums) scheduleDrums(S);
    }
    var c = camAt(S.cam, t),
      s = c[3],
      px = c[1],
      py = c[2];
    if (S.wob && !reduce) {
      px += Math.sin(t * 1.3) * 0.006;
      py += Math.cos(t * 1.7) * 0.006;
    }
    var tx = clamp(100 * (0.5 - s * px), 100 * (1 - s), 0),
      ty = clamp(100 * (0.5 - s * py), 100 * (1 - s), 0);
    el._cam.style.transform =
      "translate(" +
      tx.toFixed(3) +
      "%," +
      ty.toFixed(3) +
      "%) scale(" +
      s.toFixed(4) +
      ")";
    el._bar.style.transform = "scaleX(" + (t / S.L).toFixed(4) + ")";
    el._ov.forEach(function (o) {
      o.classList.toggle("on", t >= o._a && t < o._b);
    });
    el._fn.forEach(function (f) {
      var k = f.dataset.fn,
        v;
      if (k === "timer") {
        v = Math.max(0, Math.round(900 - t * 29));
        f.textContent = pad2(Math.floor(v / 60)) + ":" + pad2(v % 60);
      } else if (k === "timer2") {
        v = Math.max(0, Math.round(120 - t * 3.9));
        f.textContent = Math.floor(v / 60) + ":" + pad2(v % 60);
      } else if (k === "budget") {
        v =
          t < 6.6
            ? 100
            : t < 11.6
              ? 82
              : t < 16.6
                ? 64
                : t < 21.6
                  ? 41
                  : t < 26.6
                    ? 23
                    : 9;
        f.textContent = v;
      }
    });
    eng.raf = requestAnimationFrame(tick);
  }
  function prep(el) {
    if (el._cam) return;
    el._cam = el.querySelector(".sc-cam");
    el._bar = el.querySelector(".sc-bar i");
    el._ov = [].slice.call(el.querySelectorAll(".ov"));
    el._ov.forEach(function (o) {
      o._a = +o.dataset.a;
      o._b = +o.dataset.b;
    });
    el._fn = [].slice.call(el.querySelectorAll("[data-fn]"));
    el._hint = el.querySelector(".sc-hint");
    el._pill = el.querySelector(".sc-sound");
  }
  function startScene(el) {
    prep(el);
    stopScene();
    eng.n = +el.dataset.scene;
    eng.el = el;
    eng.t0 = performance.now();
    eng.loop = -1;
    eng.ai = 0;
    stopManual();
    if (soundOn) playScene();
    paintSound();
    eng.raf = requestAnimationFrame(tick);
  }
  function stopScene() {
    cancelAnimationFrame(eng.raf);
    stopDrums();
    if (eng.n && SCN[eng.n].a.length) player.pause();
    if (eng.el) {
      eng.el._ov.forEach(function (o) {
        o.classList.remove("on");
      });
      eng.el._hint.hidden = true;
      if (eng.el._pill) {
        eng.el._pill.classList.remove("on");
        eng.el._pill.setAttribute("aria-pressed", "false");
      }
    }
    eng.n = 0;
    eng.el = null;
  }
  function playScene() {
    var S = SCN[eng.n];
    if (!S) return;
    if (S.drums) {
      ensureCtx();
      eng.loop = -1; // reprogramează tobele pentru tura curentă
      return;
    }
    if (!S.a.length) return;
    eng.ai = 0;
    player.loop = false;
    player.src = AUD[S.a[0]];
    tryPlay(true);
  }
  function tryPlay(resync) {
    var pr = player.play();
    var ok = function () {
      blocked = false;
      if (eng.el) eng.el._hint.hidden = true;
      if (resync) eng.t0 = performance.now();
      paintSound();
    };
    if (pr && pr.then)
      pr.then(ok, function () {
        blocked = true;
        if (eng.el) eng.el._hint.hidden = false;
        paintSound();
      });
    else ok();
  }
  player.addEventListener("ended", function () {
    if (manual) {
      manual = null;
      paintManual();
      return;
    }
    var S = SCN[eng.n];
    if (!S || !S.a.length || !soundOn) return;
    eng.ai = (eng.ai + 1) % S.a.length;
    player.src = AUD[S.a[eng.ai]];
    tryPlay(eng.ai === 0); // ceasul animației repornește odată cu piesa
  });

  // tobele din finală (generate în browser, nu e fișier)
  function ensureCtx() {
    if (!actx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (C) actx = new C();
    }
    if (actx && actx.state === "suspended") actx.resume();
  }
  function noise(at, len, gain, hp) {
    var n = Math.floor(actx.sampleRate * len),
      buf = actx.createBuffer(1, n, actx.sampleRate),
      d = buf.getChannelData(0);
    for (var i = 0; i < n; i++)
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    var src = actx.createBufferSource(),
      g = actx.createGain(),
      f = actx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = hp;
    src.buffer = buf;
    g.gain.value = gain;
    src.connect(f).connect(g).connect(actx.destination);
    src.start(at);
    drumNodes.push(src);
  }
  function boom(at) {
    var o = actx.createOscillator(),
      g = actx.createGain();
    o.frequency.setValueAtTime(120, at);
    o.frequency.exponentialRampToValueAtTime(40, at + 0.5);
    g.gain.setValueAtTime(0.9, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.9);
    o.connect(g).connect(actx.destination);
    o.start(at);
    o.stop(at + 1);
    drumNodes.push(o);
  }
  function scheduleDrums(S) {
    stopDrums();
    if (!soundOn || !actx || actx.state !== "running") return;
    var el2 = (performance.now() - eng.t0) / 1000,
      t = el2 - Math.floor(el2 / S.L) * S.L,
      base = actx.currentTime - t;
    // bătăi de show la început, apoi ruloul și lovitura pe „Marcel!”
    for (var b = 0.5; b < 12.5; b += 0.75)
      if (b >= t) {
        noise(base + b, 0.18, 0.35, 180);
        if ((b * 4) % 3 === 0) boom(base + b);
      }
    var x = 13.2,
      gap = 0.12;
    while (x < 16.8) {
      if (x >= t)
        noise(base + x, 0.07, 0.25 + (x - 13.2) * 0.12, 1400);
      x += gap;
      gap = Math.max(0.035, gap * 0.95);
    }
    if (16.8 >= t) {
      noise(base + 16.8, 0.6, 0.9, 900);
      boom(base + 16.8);
    }
  }
  function stopDrums() {
    drumNodes.forEach(function (n) {
      try {
        n.stop();
      } catch (e) {}
    });
    drumNodes = [];
  }

  // butoanele de sunet
  function paintSound() {
    sndBtn.setAttribute("aria-pressed", soundOn);
    sndBtn.textContent = soundOn
      ? "♪ Sunet: pornit"
      : "♪ Sunet: oprit";
    if (eng.el && eng.el._pill) {
      var S = SCN[eng.n],
        playing =
          soundOn && (S.drums ? !!actx : !player.paused && !blocked);
      eng.el._pill.classList.toggle("on", playing);
      eng.el._pill.setAttribute("aria-pressed", playing);
    }
  }
  function setSound(on) {
    soundOn = on;
    if (eng.n) {
      if (on) playScene();
      else {
        player.pause();
        stopDrums();
      }
    }
    paintSound();
  }
  sndBtn.addEventListener("click", function () {
    setSound(!soundOn);
  });
  [].slice
    .call(P.querySelectorAll(".sc-sound,.sc-hint"))
    .forEach(function (b) {
      b.addEventListener("click", function () {
        setSound(
          b.classList.contains("sc-hint") || blocked
            ? true
            : !soundOn,
        );
      });
    });
  // primul click / tastă din pagină deblochează sunetul, dacă browserul l-a oprit
  ["pointerdown", "keydown"].forEach(function (ev) {
    addEventListener(ev, function () {
      if (!inProj) return;
      if (actx && actx.state === "suspended") actx.resume();
      if (blocked && soundOn && eng.n) playScene();
    });
  });

  // slide-ul „Muzica”: ascultare manuală, câte o piesă
  function paintManual() {
    var p = player.duration
      ? (player.currentTime / player.duration) * 100
      : 0;
    playBtns.forEach(function (b) {
      var me = b.dataset.a === manual;
      b.classList.toggle("on", me && !player.paused);
      b.setAttribute("aria-pressed", me && !player.paused);
      b.style.setProperty("--p", (me ? p : 0) + "%");
    });
  }
  function manualLoop() {
    paintManual();
    if (manual && !player.paused) requestAnimationFrame(manualLoop);
  }
  function stopManual() {
    if (manual) {
      player.pause();
      manual = null;
      paintManual();
    }
  }
  playBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var k = b.dataset.a;
      if (manual === k) {
        if (player.paused) player.play();
        else player.pause();
      } else {
        manual = k;
        player.loop = false;
        player.src = AUD[k];
        var pr = player.play();
        if (pr && pr.catch) pr.catch(function () {});
      }
      paintManual();
    });
  });
  player.addEventListener("play", function () {
    if (manual) manualLoop();
    paintSound();
  });
  player.addEventListener("pause", function () {
    paintManual();
    paintSound();
  });

  function onSlide(s) {
    if (s.dataset.scene) startScene(s);
    else if (eng.n) stopScene();
  }
  function stopAudio() {
    stopScene();
    stopManual();
    player.pause();
  }

  var toast = $("s-toast"),
    tt;
  function say(t) {
    toast.textContent = t;
    clearTimeout(tt);
    tt = setTimeout(function () {
      toast.textContent = "";
    }, 2600);
  }
  $("s-again").addEventListener("click", function () {
    say("Dubla 2. Motor!");
    slides[0].scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
    });
  });
  $("s-share").addEventListener("click", function () {
    var url = location.href.split("#")[0];
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        function () {
          say("Linkul a fost copiat");
        },
        function () {
          say(url);
        },
      );
    } else say(url);
  });

  route();
})();
