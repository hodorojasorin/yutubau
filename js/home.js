// Pagina de acasă: bara de căutare care „tastează”, ochii care urmăresc mouse-ul,
// apariții la scroll.
(function () {
  var root = document.documentElement;
  root.classList.add("js");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s) {
    return document.querySelector(s);
  };

  // ---- anul din footer ----
  var yr = $("#yr");
  if (yr) yr.textContent = new Date().getFullYear();

  // ---- bara de căutare: tastează singură câteva întrebări ----
  var q = $("#q"),
    form = $("#search");
  var lines = [
    "Ce e în 2026?",
    "proiecte studențești",
    "prezentări fără șabloane",
    "after movie-uri",
    "un Bau Bau vlogger?",
    "Ce e în 2026?",
  ];
  var typing = !reduce,
    li = 0;
  function typeLine() {
    if (!typing) return;
    var text = lines[li % lines.length],
      i = 0;
    (function add() {
      if (!typing) return;
      q.setAttribute("placeholder", text.slice(0, ++i) + (i < text.length ? "▍" : ""));
      if (i < text.length) setTimeout(add, 55 + Math.random() * 60);
      else
        setTimeout(function () {
          li++;
          typeLine();
        }, 1700);
    })();
  }
  if (q) {
    typeLine();
    q.addEventListener("focus", function () {
      typing = false;
      q.setAttribute("placeholder", "caută un proiect…");
    });
  }
  // căutarea filtrează cardurile de proiect (titlu + descriere)
  var games = [].slice.call(document.querySelectorAll(".game"));
  function filter(term) {
    term = (term || "").trim().toLowerCase();
    var any = false;
    games.forEach(function (g) {
      var hit = !term || g.textContent.toLowerCase().indexOf(term) !== -1;
      g.style.display = hit ? "" : "none";
      if (hit) any = true;
    });
    if (!any)
      games.forEach(function (g) {
        g.style.display = "";
      });
    return any;
  }
  if (form)
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      filter(q.value);
      $("#proiecte").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    });
  if (q)
    q.addEventListener("input", function () {
      if (!q.value) filter("");
    });

  // ---- ochii de pe foaie urmăresc mouse-ul ----
  var eyes = [].slice.call(document.querySelectorAll(".eyes i"));
  if (eyes.length && !reduce)
    addEventListener(
      "pointermove",
      function (e) {
        eyes.forEach(function (el) {
          var r = el.getBoundingClientRect();
          var dx = e.clientX - (r.left + r.width / 2),
            dy = e.clientY - (r.top + r.height / 2);
          var d = Math.max(1, Math.hypot(dx, dy));
          el.style.setProperty("--ex", ((dx / d) * 14).toFixed(1) + "px");
          el.style.setProperty("--ey", ((dy / d) * 18).toFixed(1) + "px");
        });
      },
      { passive: true },
    );

  // ---- foaia se înclină ușor după mouse ----
  var sheet = $("[data-tilt]");
  if (sheet && !reduce && matchMedia("(hover: hover)").matches) {
    sheet.addEventListener("pointermove", function (e) {
      var r = sheet.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5,
        y = (e.clientY - r.top) / r.height - 0.5;
      sheet.style.transform =
        "rotate(-1deg) perspective(1200px) rotateY(" + (x * 4).toFixed(2) + "deg) rotateX(" + (-y * 4).toFixed(2) + "deg)";
    });
    sheet.addEventListener("pointerleave", function () {
      sheet.style.transform = "";
    });
  }

  // ---- apariții la scroll ----
  var rv = [].slice.call(document.querySelectorAll(".rv"));
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    rv.forEach(function (el) {
      io.observe(el);
    });
  } else
    rv.forEach(function (el) {
      el.classList.add("in");
    });

  // ---- secțiunea curentă, marcată în bara de sus ----
  var navLinks = [].slice.call(document.querySelectorAll(".nav-pill a"));
  if ("IntersectionObserver" in window) {
    var secs = navLinks
      .map(function (a) {
        return document.querySelector(a.getAttribute("href"));
      })
      .filter(Boolean);
    var so = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          navLinks.forEach(function (a) {
            a.classList.toggle("on", a.getAttribute("href") === "#" + en.target.id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    secs.forEach(function (s) {
      so.observe(s);
    });
  }

  // ---- profilul din colțul stânga sus ----
  var pop = document.getElementById("me-pop");
  var openBtn = document.getElementById("me-open");
  if (pop && openBtn && pop.showModal) {
    openBtn.addEventListener("click", function () {
      pop.showModal();
    });
    document.getElementById("me-close").addEventListener("click", function () {
      pop.close();
    });
    // click pe fundalul întunecat închide
    pop.addEventListener("click", function (e) {
      if (e.target === pop) pop.close();
    });
    pop.addEventListener("close", function () {
      openBtn.focus();
    });
  }
})();
