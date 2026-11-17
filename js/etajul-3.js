// proiectul 04 · Etajul 3 (adresa #etajul-3; #etajul-5 e redirecționat), cu parolă
(function () {
  var P = document.getElementById("p-etajul-5");
  if (!P) return;
  var root = document.documentElement;
  var $ = function (id) {
    return document.getElementById(id);
  };
  var slides = [].slice.call(P.querySelectorAll(".slide"));
  var wipe = $("e5-wipe"),
    pager = $("e5-pager");
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
    root.classList.add("in-project", "e5");
    slides.forEach(function (s) {
      s.classList.remove("active");
    });
    cur = -1;
    scrollTo({ top: 0, behavior: "instant" });
    document.title = "Etajul 3 · regie Sorin Arseni Hodoroja";
    requestAnimationFrame(function () {
      requestAnimationFrame(pick);
    });
  }
  function close() {
    if (!inProj) return;
    inProj = false;
    P.classList.remove("open");
    root.classList.remove("e5");
    if (
      location.hash !== "#bau-bau" &&
      location.hash !== "#sase-roluri" &&
      location.hash !== "#pascaru" &&
      location.hash !== "#colocviu"
    )
      root.classList.remove("in-project");
  }

  // ---- accesul cu parolă ----
  var SUM =
    "ed948dcfe2bc92b2b4f9a0701c326c88090fa910385f65679e7868894102eb40";
  var SUM2 = "052722af";
  var gate = $("e5-screen"),
    gForm = $("e5-form"),
    gInput = $("e5-input"),
    gNote = $("e5-note");
  function ok() {
    try {
      return sessionStorage.getItem("e5-ok") === "1";
    } catch (e) {
      return false;
    }
  }
  function markOk() {
    try {
      sessionStorage.setItem("e5-ok", "1");
    } catch (e) {}
  }
  function fnv(s) {
    var h = 0x811c9dc5,
      b = new TextEncoder().encode(s);
    for (var i = 0; i < b.length; i++) {
      h ^= b[i];
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return ("0000000" + h.toString(16)).slice(-8);
  }
  function check(v) {
    if (window.crypto && crypto.subtle && window.isSecureContext) {
      return crypto.subtle
        .digest("SHA-256", new TextEncoder().encode(v))
        .then(function (buf) {
          return (
            [].map
              .call(new Uint8Array(buf), function (x) {
                return ("0" + x.toString(16)).slice(-2);
              })
              .join("") === SUM
          );
        });
    }
    return Promise.resolve(fnv(v) === SUM2);
  }
  function showGate() {
    gNote.hidden = true;
    gInput.value = "";
    gate.hidden = false;
    setTimeout(function () {
      gInput.focus();
    }, 50);
  }
  function hideGate() {
    gate.hidden = true;
  }
  gForm.addEventListener("submit", function (e) {
    e.preventDefault();
    check(gInput.value.trim().toLowerCase()).then(function (good) {
      if (good) {
        markOk();
        hideGate();
        open();
        say("Acces permis");
      } else {
        gNote.hidden = false;
        gInput.value = "";
        gInput.focus();
      }
    });
  });
  $("e5-gback").addEventListener("click", function () {
    hideGate();
    location.href = "index.html";
  });

  function route() {
    if (false) {
      hideGate();
      close();
      return;
    }
    if (ok()) {
      hideGate();
      open();
    } else {
      close();
      showGate();
    }
  }
  addEventListener("hashchange", route);
  $("e5-back").addEventListener("click", function () {
    location.href = "index.html";
  });

  var toast = $("e5-toast"),
    tt;
  function say(t) {
    toast.textContent = t;
    clearTimeout(tt);
    tt = setTimeout(function () {
      toast.textContent = "";
    }, 2600);
  }
  $("e5-again").addEventListener("click", function () {
    say("Motor!");
    slides[0].scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
    });
  });
  $("e5-share").addEventListener("click", function () {
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
