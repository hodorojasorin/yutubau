// Telecomanda: prezentarea (laptopul) primește comenzi de la telefon.
// Laptopul arată un cod QR, telefonul îl scanează și deschide remote.html.
// Mesajele trec prin serverul de pe laptop (js/bus.js + server.js): în VS Code, Terminal → npm start.
(function () {
  var P = document.querySelector(".project");
  if (!P) return;
  var slides = [].slice.call(P.querySelectorAll(".slide"));
  if (!slides.length) return;

  var KEY = "rm-id:" + location.pathname;
  var ON = "rm-on:" + location.pathname;

  function store(k, v) {
    try {
      if (v === undefined) return sessionStorage.getItem(k);
      sessionStorage.setItem(k, v);
    } catch (e) {}
  }
  function newId() {
    var a = "abcdefghjkmnpqrstuvwxyz23456789",
      s = "srn-";
    for (var i = 0; i < 8; i++) s += a[Math.floor(Math.random() * a.length)];
    return s;
  }
  var id = store(KEY) || newId();
  store(KEY, id);

  // ---- butonul discret și fereastra cu QR ----
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "rm-btn";
  btn.title = "Controlează slide-urile de pe telefon (tasta T)";
  btn.innerHTML = "<i></i>📱 Telecomandă";
  document.body.appendChild(btn);

  var modal = document.createElement("div");
  modal.className = "rm-modal";
  modal.hidden = true;
  modal.innerHTML =
    '<div class="rm-card" role="dialog" aria-modal="true" aria-labelledby="rm-t">' +
    '<h2 id="rm-t">Telecomanda de pe telefon</h2>' +
    "<p>Scanează codul cu camera telefonului. Apoi dai swipe sau apeși ← → ca să schimbi slide-urile.</p>" +
    '<div class="rm-qr" id="rm-qr"><span class="rm-wait">se pregătește…</span></div>' +
    '<span class="rm-status" id="rm-status"><i></i><span>Se conectează…</span></span>' +
    '<a class="rm-link" id="rm-link" target="_blank" rel="noopener"></a>' +
    '<p class="rm-ips" id="rm-ips"></p>' +
    '<div class="rm-actions"><button type="button" class="rm-new" id="rm-new">Cod nou</button>' +
    '<button type="button" class="rm-close" id="rm-close">Gata</button></div>' +
    "</div>";
  document.body.appendChild(modal);
  var $ = function (s) {
    return modal.querySelector(s);
  };

  function status(text, kind) {
    var el = $("#rm-status");
    el.className = "rm-status" + (kind ? " " + kind : "");
    el.lastChild.textContent = text;
  }
  function openModal() {
    modal.hidden = false;
    start();
  }
  function closeModal() {
    modal.hidden = true;
  }
  btn.addEventListener("click", openModal);
  $("#rm-close").addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeModal();
  });
  $("#rm-new").addEventListener("click", function () {
    id = newId();
    store(KEY, id);
    restart();
  });
  addEventListener("keydown", function (e) {
    if (e.target.closest && e.target.closest("input,textarea")) return;
    if (e.key === "t" || e.key === "T") modal.hidden ? openModal() : closeModal();
    else if (e.key === "Escape" && !modal.hidden) {
      e.stopImmediatePropagation();
      closeModal();
    }
  }, true);

  // ---- bibliotecile se încarcă doar când e nevoie ----
  function load(src, test, cb) {
    if (test()) return cb();
    var s = document.createElement("script");
    s.src = src;
    s.onload = cb;
    s.onerror = function () {
      status("Nu s-a putut încărca telecomanda", "err");
    };
    document.head.appendChild(s);
  }
  function libs(cb) {
    load("js/vendor/qrcode.js", function () {
      return typeof qrcode !== "undefined";
    }, function () {
      load("js/bus.js", function () {
        return typeof SRNBus !== "undefined";
      }, cb);
    });
  }
  function drawQR() {
    SRNBus.phoneURL("remote.html", { id: id }).then(function (url) {
      if (!url) {
        $("#rm-qr").innerHTML =
          '<div class="rm-howto"><b>Pornește serverul pe laptop</b><ol><li>VS Code → Terminal → New Terminal</li><li>scrie <code>npm start</code></li><li>deschide prezentarea de pe <code>localhost:8000</code></li></ol></div>';
        $("#rm-link").textContent = "";
        $("#rm-link").removeAttribute("href");
        return;
      }
      reachTxt = SRNBus.reach(url);
      setOn();
      var q = qrcode(0, "M");
      q.addData(url);
      q.make();
      $("#rm-qr").innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
      var a = $("#rm-link");
      a.href = url;
      a.textContent = url;
    });
  }

  // ---- legătura ----
  var bus = null,
    reachTxt = "scanează codul",
    phones = {},
    startAt = Date.now(),
    noNet = 0;
  function phonesOn() {
    var now = Date.now();
    return Object.keys(phones).filter(function (k) {
      return now - phones[k] < 12000;
    }).length;
  }
  function setOn() {
    var on = phonesOn() > 0;
    btn.classList.toggle("on", on);
    btn.lastChild.textContent = on ? "📱 conectat" : "📱 Telecomandă";
    if (!bus) return;
    if (on) status("Telefonul e conectat", "ok");
    else if (bus.mode === "none") status("Serverul de pe laptop nu e pornit", "err");
    else if (bus.online()) status("Gata · " + reachTxt, "");
    else status(noNet > 1 ? "Serverul s-a oprit? Rulează npm start" : "Se conectează…", noNet > 1 ? "err" : "");
  }
  setInterval(function () {
    if (!bus) return;
    noNet = bus.online() ? 0 : noNet + 1;
    setOn();
  }, 4000);
  function start() {
    if (bus) return;
    store(ON, "1");
    libs(function () {
      drawQR();
      SRNBus.ipPicker($("#rm-ips"), drawQR);
      if (bus) return;
      bus = SRNBus.host(id.replace(/^srn-/, "rm-"), {
        onMessage: function (m, from) {
          if (!m || typeof m !== "object") return;
          var fresh = !phones[from] || Date.now() - phones[from] > 12000;
          phones[from] = Date.now();
          onData(m);
          if (fresh) {
            setOn();
            if (!modal.hidden) setTimeout(closeModal, 900);
          }
        },
        onStatus: setOn,
      });
    });
  }
  function restart() {
    if (bus) bus.close();
    bus = null;
    phones = {};
    setOn();
    $("#rm-qr").innerHTML = '<span class="rm-wait">se pregătește…</span>';
    start();
  }

  // ---- slide-ul curent și comenzile ----
  function current() {
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
    return bi;
  }
  // la apăsări rapide, scroll-ul încă nu a ajuns: pornim de la slide-ul spre care mergem deja
  var target = -1,
    targetAt = 0;
  function here() {
    return target > -1 && Date.now() - targetAt < 900 ? target : current();
  }
  function go(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    target = i;
    targetAt = Date.now();
    slides[i].scrollIntoView({ behavior: "smooth" });
  }
  // cronometrul: dacă prezentarea are deja unul în bară (colocviu), telefonul arată exact același timp
  function elapsed() {
    var el = document.getElementById("co-tc");
    if (el) {
      var p = el.textContent.trim().split(":").map(Number);
      if (p.length === 3 && p.every(isFinite)) return p[0] * 3600 + p[1] * 60 + p[2];
    }
    return Math.floor((Date.now() - startAt) / 1000);
  }
  function resetTime() {
    startAt = Date.now();
    var rec = document.getElementById("co-rec");
    if (rec) rec.click();
  }
  function onData(m) {
    if (!m || typeof m !== "object") return;
    if (m.t === "go") go(here() + (m.d > 0 ? 1 : -1));
    else if (m.t === "goto") go(+m.i || 0);
    else if (m.t === "reset") resetTime();
    send(true);
  }
  function txt(el) {
    return el ? el.textContent.replace(/\s+/g, " ").replace(/^\?\s*/, "").trim() : "";
  }
  // notițele vorbitorului (<div class="sn" hidden> din fiecare slide) ajung pe telecomandă
  var NOTES = slides.map(function (s) {
    var box = s.querySelector(".sn");
    if (!box) return null;
    return [].map.call(box.children, function (el) {
      var t = "";
      [].forEach.call(el.childNodes, function (n) {
        t += n.nodeType === 1 && n.tagName === "B" ? "**" + n.textContent + "**" : n.textContent;
      });
      return { k: el.dataset.k || "", t: t.replace(/\s+/g, " ").trim() };
    });
  });
  var last = "";
  function send(force) {
    if (!bus || !phonesOn()) return;
    var i = here(),
      s = slides[i],
      nx = slides[i + 1];
    var msg = {
      t: "state",
      i: i,
      n: slides.length,
      name: s.dataset.name || txt(s.querySelector("h1,h2")),
      q: txt(s.querySelector(".co-next")),
      next: nx ? nx.dataset.name || txt(nx.querySelector("h1,h2")) : "",
      title: document.title,
      sec: elapsed(),
      open: P.classList.contains("open"),
      notes: NOTES[i],
    };
    var key = JSON.stringify(msg);
    if (!force && key === last) return;
    last = key;
    bus.send(msg);
  }
  var tick = false;
  addEventListener(
    "scroll",
    function () {
      if (tick) return;
      tick = true;
      setTimeout(function () {
        tick = false;
        send();
      }, 180);
    },
    { passive: true },
  );
  setInterval(send, 1000);

  // după o reîncărcare a paginii, telecomanda pornește singură (telefonul se reconectează)
  if (store(ON) === "1") start();
})();
