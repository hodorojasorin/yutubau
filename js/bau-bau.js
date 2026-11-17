// Proiectul 01 · bau BAU
(function () {
  var slides = [].slice.call(
    document.querySelectorAll("#p-bau-bau .slide"),
  );
  var tc = document.getElementById("tc"),
    wipe = document.getElementById("wipe"),
    pager = document.getElementById("pager");
  var links = [].slice.call(
    document.querySelectorAll("#p-bau-bau .recbar nav a"),
  );
  var vid = document.getElementById("cardvid");
  var navname = document.getElementById("navname");
  var cur = -1;
  function pad(n) {
    return String(n).padStart(2, "0");
  }

  // butoane de navigare pe dreapta
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

  var setActive = function (i) {
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
    if (
      navname &&
      !navname.dataset.shown &&
      i >= slides.indexOf(document.getElementById("yutubau"))
    ) {
      navname.dataset.shown = "1";
      navname.textContent = "YUTUBAU";
      navname.classList.add("reveal");
    }
    if (vid) {
      if (id === "cardul") {
        var p = vid.play();
        if (p && p.catch) p.catch(function () {});
      } else vid.pause();
    }
  };

  // slide-ul activ = cel care ocupă cea mai mare parte din ecran
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

  // REC: pornește de la zero de fiecare dată când se deschide proiectul
  var inProj = false,
    t0 = 0,
    recStopped = true,
    recSec = 0,
    recToken = 0,
    upToken = 0;
  function startRec() {
    t0 = performance.now();
    recStopped = false;
    var tok = ++recToken;
    tc.textContent = "00:00:00";
    (function rec(now) {
      if (recStopped || tok !== recToken) return;
      var s = (recSec = Math.max(0, Math.floor((now - t0) / 1000)));
      tc.textContent =
        pad(Math.floor(s / 3600)) +
        ":" +
        pad(Math.floor(s / 60) % 60) +
        ":" +
        pad(s % 60);
      requestAnimationFrame(rec);
    })(performance.now());
  }
  // final: camera se oprește și vlogul se încarcă
  function stopRec() {
    document.getElementById("recbox").classList.add("stopped");
    document.getElementById("reclabel").textContent = "STOP";
  }
  var up = document.getElementById("up");
  document
    .getElementById("upX")
    .addEventListener("click", function () {
      up.classList.remove("show");
      setTimeout(function () {
        up.hidden = true;
      }, 400);
    });
  function upload() {
    // o zi întreagă de festival, de la porți până la ultimul set
    var durTxt = "11:47:32";
    var size = 18.4;
    document.getElementById("upDur").textContent = durTxt;
    var bar = document.getElementById("upBar"),
      pct = document.getElementById("upPct"),
      step = document.getElementById("upStep"),
      sub = document.getElementById("upSub"),
      title = document.getElementById("upTitle");
    up.hidden = false;
    void up.offsetWidth;
    up.classList.add("show");
    var T = reduce ? 0 : 3600,
      t0 = null,
      tok = upToken;
    function tick(t) {
      if (tok !== upToken) return;
      if (!t0) t0 = t;
      var p = T ? Math.min(1, (t - t0) / T) : 1,
        e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      bar.style.width = e * 100 + "%";
      pct.textContent = Math.round(e * 100) + "%";
      sub.textContent =
        "yutubau_vlog_final.mp4 · " +
        (size * e).toFixed(1).replace(".", ",") +
        " din " +
        String(size).replace(".", ",") +
        " GB";
      if (p < 1) {
        requestAnimationFrame(tick);
        return;
      }
      up.classList.add("processing");
      step.textContent = "Procesare HD";
      pct.textContent = "";
      title.textContent = "Se procesează…";
      setTimeout(
        function () {
          if (tok !== upToken) return;
          up.classList.remove("processing");
          up.classList.add("done");
          title.textContent = "Vlog publicat!";
          step.textContent = "Public · acum";
          var shown = 0,
            GOAL = 104000;
          pct.classList.add("live");
          // urcă în pași de sute și mii; spre final încetinește, doar câte o sută
          function bumpTo(n, fin) {
            pct.textContent =
              (fin ? "104K" : n.toLocaleString("ro-RO")) +
              " de vizualizări";
            pct.classList.remove("bump");
            void pct.offsetWidth;
            pct.classList.add("bump");
          }
          if (reduce) {
            bumpTo(GOAL, true);
            pct.classList.remove("live");
          } else
            (function tickV() {
              if (tok !== upToken) return;
              var left = GOAL - shown,
                inc;
              if (left > 8000)
                inc =
                  (Math.random() < 0.35
                    ? 1000
                    : Math.ceil(Math.random() * 9) * 100) +
                  (Math.random() < 0.5 ? 1000 : 0);
              else inc = Math.ceil(Math.random() * 3) * 100;
              shown = Math.min(GOAL, shown + inc);
              var fin = shown >= GOAL;
              bumpTo(shown, fin);
              if (fin) {
                pct.classList.remove("live");
                return;
              }
              setTimeout(
                tickV,
                left > 8000 ? 55 : 90 + (8000 - left) / 40,
              );
            })();
          sub.textContent = "YUTUBAU · " + durTxt + " de filmare";
        },
        reduce ? 0 : 1500,
      );
    }
    requestAnimationFrame(tick);
  }

  var ticking = false;
  addEventListener(
    "scroll",
    function () {
      if (!inProj) return;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () {
          ticking = false;
          pick();
        });
      }
    },
    { passive: true },
  );
  addEventListener("resize", function () {
    if (inProj) pick();
  });

  // săgeți / PageDown sar exact un slide
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

  // ---- efecte ----
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // (împărțirea titlurilor în litere e în js/base.js)

  // numele: decodare din simboluri
  var nameEl = document.querySelector(".fx-scramble"),
    scrT;
  function scramble() {
    if (!nameEl || reduce) return;
    var target = "YUTUBAU",
      glyph = "█▓▒░#@$%&?!<>/\\ABCDEFGHJKLMNPQRSTVWXZ0123456789",
      t0 = null;
    cancelAnimationFrame(scrT);
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.max(0, (t - t0 - 250) / 1100),
        out = "";
      for (var k = 0; k < target.length; k++) {
        out +=
          p * target.length > k + 0.6
            ? target[k]
            : glyph[Math.floor(Math.random() * glyph.length)];
      }
      nameEl.textContent = out;
      if (p < 1) scrT = requestAnimationFrame(step);
      else nameEl.textContent = target;
    }
    scrT = requestAnimationFrame(step);
  }

  // cifrele de pe card numără de la 0
  var nums = [].slice.call(document.querySelectorAll(".fx-count b"));
  nums.forEach(function (b) {
    b.dataset.v = b.textContent;
  });
  function countUp() {
    if (reduce) return;
    var t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, Math.max(0, (t - t0 - 500) / 1200)),
        e = 1 - Math.pow(1 - p, 3);
      nums.forEach(function (b) {
        b.textContent = Math.round(+b.dataset.v * e);
      });
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // vizorul camerei face focus la fiecare slide
  var vf = document.getElementById("vf");
  function focus() {
    vf.classList.remove("focus");
    void vf.offsetWidth;
    vf.classList.add("focus");
  }

  var _set = setActive;
  setActive = function (i) {
    var was = cur;
    _set(i);
    if (was === i) return;
    focus();
    var id = slides[i].id;
    if (id === "yutubau") scramble();
    if (id === "cardul") countUp();
    if (id === "final" && !recStopped) {
      recStopped = true;
      stopRec();
      var tk = upToken;
      setTimeout(
        function () {
          if (inProj && tk === upToken) upload();
        },
        reduce ? 0 : 900,
      );
    }
  };

  // cardul se înclină după mouse
  var card = document.querySelector(".fx-card");
  if (card && !reduce && matchMedia("(hover:hover)").matches) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect(),
        x = (e.clientX - r.left) / r.width,
        y = (e.clientY - r.top) / r.height;
      card.classList.add("tilting");
      card.style.setProperty(
        "--ty",
        ((x - 0.5) * 18).toFixed(2) + "deg",
      );
      card.style.setProperty(
        "--tx",
        ((0.5 - y) * 14).toFixed(2) + "deg",
      );
      card.style.setProperty("--gx", x * 100 + "%");
      card.style.setProperty("--gy", y * 100 + "%");
    });
    card.addEventListener("pointerleave", function () {
      card.classList.remove("tilting");
      card.style.setProperty("--tx", "0deg");
      card.style.setProperty("--ty", "0deg");
    });
  }

  // linkurile din bara de sus derulează, fără să schimbe adresa
  links.forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var t = document.querySelector(a.getAttribute("href"));
      if (t) t.scrollIntoView({ behavior: "smooth" });
    });
  });

  // ---- acasă / proiect (adresa: #bau-bau deschide proiectul) ----
  var root = document.documentElement;
  function resetProject() {
    slides.forEach(function (s) {
      s.classList.remove("active");
    });
    cur = -1;
    var rb = document.getElementById("recbox");
    rb.classList.remove("stopped");
    document.getElementById("reclabel").textContent = "REC";
    upToken++;
    up.classList.remove("show", "done", "processing");
    up.hidden = true;
    document.getElementById("upBar").style.width = "0";
    var pc = document.getElementById("upPct");
    pc.className = "";
    pc.textContent = "0%";
    document.getElementById("upTitle").textContent =
      "Se încarcă vlogul…";
    document.getElementById("upStep").textContent = "Încărcare";
    if (navname) {
      delete navname.dataset.shown;
      navname.textContent = "???";
      navname.classList.remove("reveal");
    }
  }
  function openProject() {
    var was = inProj;
    inProj = true;
    if (!was) {
      root.classList.add("in-project");
      document.getElementById("p-bau-bau").classList.add("open");
      resetProject();
      scrollTo({ top: 0, behavior: "instant" });
      startRec();
      document.title = "bau BAU by sorinarseni";
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(pick);
    });
  }
  function openHome() {
    inProj = false;
    recToken++;
    recStopped = true;
    upToken++;
    if (vid) {
      vid.pause();
      vid.muted = true;
      if (snd) {
        snd.textContent = "🔇 Pornește sunetul";
        snd.classList.remove("liked");
        snd.setAttribute("aria-pressed", "false");
      }
    }
    document.getElementById("p-bau-bau").classList.remove("open");
    // alt proiect deschis (#sase-roluri)? atunci nu ne întoarcem acasă
    if (
      location.hash === "#sase-roluri" ||
      location.hash === "#pascaru" ||
      location.hash === "#etajul-3" ||
      location.hash === "#colocviu"
    )
      return;
    root.classList.remove("in-project");
    scrollTo({ top: 0, behavior: "instant" });
    document.title = "Proiecte sorinarseni";
  }
  function route() {
    openProject();
  }
  addEventListener("hashchange", route);
  document
    .getElementById("back")
    .addEventListener("click", function () {
      location.href = "index.html";
    });

  // pornește: întâi starea ascunsă, apoi ruta curentă
  root.classList.add("anim");
  var snd = document.getElementById("snd");
  route();

  if (vid && snd) {
    snd.addEventListener("click", function () {
      vid.muted = !vid.muted;
      if (!vid.muted) {
        vid.currentTime = 0;
        var p = vid.play();
        if (p && p.catch) p.catch(function () {});
      }
      snd.textContent = vid.muted
        ? "🔇 Pornește sunetul"
        : "🔊 Oprește sunetul";
      snd.classList.toggle("liked", !vid.muted);
      snd.setAttribute("aria-pressed", !vid.muted);
    });
  }
  if (vid && matchMedia("(prefers-reduced-motion: reduce)").matches) {
    vid.controls = true;
  }

  var toast = document.getElementById("toast"),
    tt;
  function say(t) {
    toast.textContent = t;
    clearTimeout(tt);
    tt = setTimeout(function () {
      toast.textContent = "";
    }, 2600);
  }

  var like = document.getElementById("like"),
    n = document.getElementById("likes"),
    liked = false;
  try {
    liked = localStorage.getItem("yutubau-like") === "1";
  } catch (e) {}
  function paintLike() {
    like.classList.toggle("liked", liked);
    like.setAttribute("aria-pressed", liked);
    n.textContent = liked ? 1 : 0;
  }
  paintLike();
  like.addEventListener("click", function (e) {
    liked = !liked;
    paintLike();
    if (liked && !reduce) {
      var r = like.getBoundingClientRect();
      for (var q = 0; q < 16; q++) {
        var h = document.createElement("span");
        h.className = "burst";
        h.textContent = "♥";
        var a = Math.random() * Math.PI * 2,
          d = 60 + Math.random() * 90;
        h.style.setProperty("--x0", r.left + r.width / 2 - 8 + "px");
        h.style.setProperty("--y0", r.top + r.height / 2 - 12 + "px");
        h.style.setProperty("--dx", Math.cos(a) * d + "px");
        h.style.setProperty("--dy", Math.sin(a) * d - 40 + "px");
        h.style.setProperty("--r", Math.random() * 80 - 40 + "deg");
        document.body.appendChild(h);
        setTimeout(
          (function (x) {
            return function () {
              x.remove();
            };
          })(h),
          1100,
        );
      }
    }
    try {
      localStorage.setItem("yutubau-like", liked ? "1" : "0");
    } catch (e) {}
    say(liked ? "Mulțumesc pentru like!" : "Like retras");
  });

  var bell = document.getElementById("bell"),
    on = false;
  bell.addEventListener("click", function () {
    on = !on;
    bell.classList.toggle("liked", on);
    bell.setAttribute("aria-pressed", on);
    bell.textContent = on ? "🔔 Abonat" : "🔔 Abonează-te";
    say(on ? "Ai apăsat clopoțelul." : "Notificări oprite");
  });

  document
    .getElementById("share")
    .addEventListener("click", function () {
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
})();
