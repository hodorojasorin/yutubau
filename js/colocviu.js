// proiectul 05 · Colocviu: Creativitatea și imaginarul (adresa #colocviu)
(function () {
  var P = document.getElementById("p-colocviu");
  if (!P) return;
  var root = document.documentElement;
  var $ = function (id) {
    return document.getElementById(id);
  };
  var HASH = "#colocviu";
  var OTHERS = ["#bau-bau", "#sase-roluri", "#pascaru", "#etajul-3", "#etajul-5"];
  var slides = [].slice.call(P.querySelectorAll(".slide"));
  var wipe = $("co-wipe"),
    pager = $("co-pager");
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
    // telecomanda de prezentare trimite PageDown / PageUp sau săgețile
    if (k === "ArrowDown" || k === "PageDown" || k === " " || k === "ArrowRight") d = 1;
    if (k === "ArrowUp" || k === "PageUp" || k === "ArrowLeft") d = -1;
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
  // ---- cronometrul din bară: cât timp am vorbit (după 7:00 se marchează galben) ----
  var recBtn = $("co-rec"),
    tcEl = $("co-tc"),
    recStart = 0,
    recTimer = null;
  function tick() {
    var s = Math.max(0, Math.floor((Date.now() - recStart) / 1000));
    tcEl.textContent =
      pad(Math.floor(s / 3600)) + ":" + pad(Math.floor(s / 60) % 60) + ":" + pad(s % 60);
    recBtn.classList.toggle("late", s >= 420);
  }
  function startRec() {
    recStart = Date.now();
    clearInterval(recTimer);
    tick();
    recTimer = setInterval(tick, 250);
  }
  function stopRec() {
    clearInterval(recTimer);
    recTimer = null;
  }
  recBtn.addEventListener("click", startRec);
  function open() {
    if (inProj) {
      pick();
      return;
    }
    inProj = true;
    P.classList.add("open");
    startRec();
    root.classList.add("in-project", "co");
    slides.forEach(function (s) {
      s.classList.remove("active");
    });
    cur = -1;
    scrollTo({ top: 0, behavior: "instant" });
    document.title = "Creativitatea și imaginarul · Sorin Hodoroja";
    requestAnimationFrame(function () {
      requestAnimationFrame(pick);
    });
  }
  function close() {
    if (!inProj) return;
    inProj = false;
    P.classList.remove("open");
    stopRec();
    root.classList.remove("co");
    if (OTHERS.indexOf(location.hash) === -1)
      root.classList.remove("in-project");
  }
  function route() {
    open();
  }
  addEventListener("hashchange", route);
  $("co-back").addEventListener("click", function () {
    location.href = "index.html";
  });

  var toast = $("co-toast"),
    tt;
  function say(t) {
    toast.textContent = t;
    clearTimeout(tt);
    tt = setTimeout(function () {
      toast.textContent = "";
    }, 2600);
  }
  $("co-again").addEventListener("click", function () {
    say("De la capăt!");
    slides[0].scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
    });
  });
  $("co-share").addEventListener("click", function () {
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

  // ---- descărcare PDF: fișierul e generat dinainte (merge și fără internet) ----
  [$("co-pdf")].forEach(function (b) {
    b.addEventListener("click", function () {
      say("Se descarcă PDF-ul");
    });
  });

  route();
})();
