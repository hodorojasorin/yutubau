// proiectul 03 · Pascaru Production (adresa #pascaru)
(function () {
  var P = document.getElementById("p-pascaru");
  if (!P) return;
  var root = document.documentElement;
  var $ = function (id) {
    return document.getElementById(id);
  };
  var slides = [].slice.call(P.querySelectorAll(".slide"));
  var wipe = $("pp-wipe"),
    pager = $("pp-pager");
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
    root.classList.add("in-project", "pp");
    slides.forEach(function (s) {
      s.classList.remove("active");
    });
    cur = -1;
    scrollTo({ top: 0, behavior: "instant" });
    document.title = "Pascaru Production · rebranding de Echipa NOUĂ";
    requestAnimationFrame(function () {
      requestAnimationFrame(pick);
    });
  }
  function close() {
    if (!inProj) return;
    inProj = false;
    P.classList.remove("open");
    root.classList.remove("pp");
    if (
      location.hash !== "#bau-bau" &&
      location.hash !== "#sase-roluri" &&
      location.hash !== "#etajul-3" &&
      location.hash !== "#colocviu"
    )
      root.classList.remove("in-project");
  }
  function route() {
    open();
  }
  addEventListener("hashchange", route);
  $("pp-back").addEventListener("click", function () {
    location.href = "index.html";
  });

  var toast = $("pp-toast"),
    tt;
  function say(t) {
    toast.textContent = t;
    clearTimeout(tt);
    tt = setTimeout(function () {
      toast.textContent = "";
    }, 2600);
  }
  $("pp-again").addEventListener("click", function () {
    say("Motor!");
    slides[0].scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
    });
  });
  $("pp-share").addEventListener("click", function () {
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

  var pdfBtn = $("pp-pdf");
  pdfBtn.addEventListener("click", function () {
    if (pdfBtn.disabled) return;
    if (typeof html2canvas === "undefined" || !window.jspdf) {
      say("Nu s-a putut genera PDF-ul");
      return;
    }
    pdfBtn.disabled = true;
    var original = pdfBtn.textContent;
    pdfBtn.textContent = "Se generează…";
    root.classList.add("pdf-export");
    slides.forEach(function (s) {
      s.classList.add("active");
    });
    var jsPDF = window.jspdf.jsPDF;
    var pdf = null;
    var chain = Promise.resolve();
    slides.forEach(function (s) {
      chain = chain.then(function () {
        return html2canvas(s, {
          backgroundColor: "#0b0909",
          scale: 1.5,
          useCORS: true,
        }).then(function (canvas) {
          var img = canvas.toDataURL("image/jpeg", 0.92);
          var w = canvas.width,
            h = canvas.height;
          var orient = w > h ? "landscape" : "portrait";
          if (!pdf) {
            pdf = new jsPDF({
              orientation: orient,
              unit: "px",
              format: [w, h],
            });
          } else {
            pdf.addPage([w, h], orient);
          }
          pdf.addImage(img, "JPEG", 0, 0, w, h);
        });
      });
    });
    chain
      .then(function () {
        pdf.save("pascaru-production-brandbook.pdf");
        say("PDF descărcat");
      })
      .catch(function () {
        say("Generarea PDF-ului a eșuat");
      })
      .then(function () {
        root.classList.remove("pdf-export");
        slides.forEach(function (s, j) {
          s.classList.toggle("active", j === cur);
        });
        pdfBtn.disabled = false;
        pdfBtn.textContent = original;
      });
  });

  route();
})();
